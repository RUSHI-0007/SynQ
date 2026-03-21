import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useYjsSync(roomId: string) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider('ws://localhost:4000', roomId, ydoc);
    providerRef.current = provider;

    provider.on('status', (event: { status: string }) => {
      setConnected(event.status === 'connected');
    });

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [roomId]);

  return { ydoc: ydocRef.current, provider: providerRef.current, connected };
}
