import { WebSocketServer } from 'ws';
import http from 'http';
import { parse } from 'url';
import { ActivityTracker } from '../services/activity.tracker';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setupWSConnection } = require('y-websocket/bin/utils');

// Track per-project connection counts to know when a project goes fully idle
const projectConnectionCount = new Map<string, number>();

export const setupYjsWebSocketServer = (server: http.Server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      if (!request.url) throw new Error('No URL in upgrade request');
      const { pathname } = parse(request.url);

      // Expected format: /api/ws/:projectId
      if (pathname?.startsWith('/api/ws/')) {
        const projectId = pathname.split('/')[3];

        if (!projectId) {
          socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          (ws as any).__projectId = projectId;
          request.url = projectId; // y-websocket uses request.url as the doc name
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('[Yjs] Upgrade error:', err);
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    const projectId: string = (ws as any).__projectId ?? (req.url ?? '').replace('/', '');

    // Increment refcount; heartbeat on reconnect so the idle clock resets
    const prev = projectConnectionCount.get(projectId) ?? 0;
    projectConnectionCount.set(projectId, prev + 1);
    ActivityTracker.markActive(projectId);

    // Hand off to y-websocket for CRDT sync
    setupWSConnection(ws, req);

    // Reset idle timer on every Yjs message
    ws.on('message', () => { ActivityTracker.markActive(projectId); });

    // Ping/pong dead-socket cleanup
    let isAlive = true;
    ws.on('pong', () => { isAlive = true; });

    const pingInterval = setInterval(() => {
      if (!isAlive) return ws.terminate();
      isAlive = false;
      ws.ping();
    }, 30_000);

    ws.on('close', () => {
      clearInterval(pingInterval);
      const remaining = (projectConnectionCount.get(projectId) ?? 1) - 1;
      if (remaining <= 0) {
        projectConnectionCount.delete(projectId);
        // Do NOT untrack — ActivityTracker will handle shutdown after 30 min idle
      } else {
        projectConnectionCount.set(projectId, remaining);
      }
    });
  });

  console.log('🚀 Yjs WebSocket server bound to HTTP server upgrade pipeline');
  return wss;
};
