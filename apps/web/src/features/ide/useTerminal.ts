import { useEffect, useRef, useCallback, useState } from 'react';
import { getWsUrl } from '@/lib/api-client';

// Resize message sent to the backend when xterm dimensions change
interface ResizeMessage {
  type: 'resize';
  cols: number;
  rows: number;
}

export interface UseTerminalReturn {
  /** Attach this as the WebSocket ref — useTerminal manages the connection internally */
  wsRef: React.MutableRefObject<WebSocket | null>;
  /** Connection status for UI display */
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Send raw bytes (keystrokes) to the docker shell */
  sendData: (data: string) => void;
  /** Notify the server about an xterm resize so Docker PTY is resized too */
  sendResize: (cols: number, rows: number) => void;
  /** Register a callback that fires whenever the server sends data (Docker → xterm) */
  onData: (handler: (data: string) => void) => void;
  /** Manually trigger a reconnect */
  reconnect: () => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export function useTerminal(projectId: string): UseTerminalReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const dataHandlerRef = useRef<((data: string) => void) | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<UseTerminalReturn['status']>('connecting');

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');

    const url = getWsUrl(`api/terminal/${projectId}`);
    // Passing 'ngrok-skip-browser-warning' as a subprotocol tricks Ngrok's free tier
    // into bypassing the browser warning interstitial page that otherwise blocks WSS handshakes!
    const ws = new WebSocket(url, ['ngrok-skip-browser-warning']);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      retryCountRef.current = 0;
      setStatus('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      const raw = event.data;

      let text: string;
      if (raw instanceof ArrayBuffer) {
        text = new TextDecoder().decode(raw);
      } else {
        text = raw as string;
      }

      dataHandlerRef.current?.(text);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus('error');
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      setStatus('disconnected');

      // Auto-retry unless it was a clean intentional close (code 1000)
      if (event.code !== 1000 && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = RETRY_DELAY_MS * retryCountRef.current;
        console.log(`[Terminal] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      }
    };
  }, [projectId]);

  // Initial connect + cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop on intentional unmount
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendData = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const msg: ResizeMessage = { type: 'resize', cols, rows };
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const onData = useCallback((handler: (data: string) => void) => {
    dataHandlerRef.current = handler;
  }, []);

  const reconnect = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    wsRef.current?.close();
    retryCountRef.current = 0;
    setTimeout(connect, 100);
  }, [connect]);

  return { wsRef, status, sendData, sendResize, onData, reconnect };
}
