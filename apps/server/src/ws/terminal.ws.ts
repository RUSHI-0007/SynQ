import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { parse } from 'url';
import Docker from 'dockerode';
import { Duplex } from 'stream';
import { ActivityTracker } from '../services/activity.tracker';

const docker = new Docker();

/**
 * Sets up a WebSocket server that streams an interactive Docker TTY shell.
 *
 * Route: ws://localhost:4000/api/terminal/:projectId
 *
 * Protocol:
 *  - Client → Server: raw keystrokes (string/Buffer) piped into Docker stdin
 *  - Server → Client: Docker stdout/stderr bytes piped back as binary frames
 *  - Client may send JSON { type: 'resize', cols: N, rows: N } for PTY resize
 */
export function setupTerminalWebSocketServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (!request.url) return;
    const { pathname } = parse(request.url);

    if (pathname?.startsWith('/api/terminal/')) {
      const projectId = pathname.split('/')[3];
      if (!projectId) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, projectId);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket, _req: http.IncomingMessage, projectId: string) => {
    const containerName = `hackathon-project-${projectId}`;
    let execStream: Duplex | null = null;

    const cleanup = () => {
      if (execStream) {
        execStream.destroy();
        execStream = null;
      }
    };

    try {
      // ── Validate container is running ──────────────────────────────
      const container = docker.getContainer(containerName);
      const info = await container.inspect();

      if (!info.State.Running) {
        ws.send('\r\n\x1b[31m[Terminal] Container is not running.\x1b[0m\r\n');
        ws.close(1011, 'Container not running');
        return;
      }

      // ── Create interactive TTY exec ────────────────────────────────
      // TTY: true is the key flag — it enables a real pseudo-terminal
      // so xterm.js receives proper ANSI escape codes for colours, cursor etc.
      const shell = info.Platform === 'linux' ? '/bin/sh' : '/bin/sh';
      const exec = await container.exec({
        Cmd: [shell],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,               // ← MUST be true for xterm.js to work
        Env: ['TERM=xterm-256color'],
      });

      // hijack: true gets us the raw TCP socket (no multiplexing when Tty:true)
      const stream = await exec.start({ hijack: true, stdin: true, Detach: false }) as unknown as Duplex;
      execStream = stream;

      ws.send('\r\n\x1b[32m[Terminal] Connected to container shell.\x1b[0m\r\n');

      // ── Docker → WebSocket ─────────────────────────────────────────
      stream.on('data', (chunk: Buffer) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(chunk);
        }
      });

      stream.on('end', () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('\r\n\x1b[33m[Terminal] Shell session ended.\x1b[0m\r\n');
          ws.close(1000, 'Shell exited');
        }
      });

      stream.on('error', (err: Error) => {
        console.error('[Terminal] Stream error:', err.message);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`\r\n\x1b[31m[Error] ${err.message}\x1b[0m\r\n`);
          ws.close(1011, err.message);
        }
      });

      // ── WebSocket → Docker ─────────────────────────────────────────
      ws.on('message', (data: Buffer | string) => {
        if (!execStream) return;
        
        // Track activity to prevent auto-shutdown
        ActivityTracker.markActive(projectId);

        // Handle PTY resize control messages
        if (typeof data === 'string' || (data instanceof Buffer && data[0] === 0x7b)) {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'resize' && msg.cols && msg.rows) {
              exec.resize({ h: msg.rows, w: msg.cols }).catch(() => {
                // Resize can fail transiently — safe to ignore
              });
              return;
            }
          } catch {
            // Not JSON — fall through to treat as raw input
          }
        }

        // Write raw keystroke bytes directly to Docker stdin
        execStream.write(data);
      });

      ws.on('close', () => {
        cleanup();
      });

      ws.on('error', (err) => {
        console.error('[Terminal] WebSocket error:', err.message);
        cleanup();
      });

    } catch (err: any) {
      const msg = err.statusCode === 404
        ? `Container '${containerName}' not found. Has the sandbox been started?`
        : err.message;
      console.error('[Terminal] Setup error:', msg);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n\x1b[31m[Terminal Error] ${msg}\x1b[0m\r\n`);
        ws.close(1011, msg);
      }
    }
  });

  console.log('🖥️  Terminal WebSocket server bound to HTTP server upgrade pipeline');
  return wss;
}
