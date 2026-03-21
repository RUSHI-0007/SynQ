import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';

import projectsRouter from './routes/projects.router';
import containersRouter from './routes/containers.router';
import mergeRouter from './routes/merge.router';
import voiceRouter from './routes/voice.router';
import fsRouter from './routes/fs.router';
import workspaceRouter from './routes/workspace.router';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/containers', containersRouter);
app.use('/api/merge', mergeRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/fs', fsRouter);
app.use('/api/workspace', workspaceRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorMiddleware);

import { setupYjsWebSocketServer } from './ws/yjs.ws';
import { setupTerminalWebSocketServer } from './ws/terminal.ws';
import { ActivityTracker } from './services/activity.tracker';

server.on('upgrade', (request, socket, head) => {
  const url = request.url ?? '';
  // Both /api/ws/* (Yjs) and /api/terminal/* are handled by their own WSS
  // — do NOT destroy the socket here; each WSS handles its own upgrade
  if (!url.startsWith('/api/ws/') && !url.startsWith('/api/terminal/')) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
  }
});

server.listen(env.PORT, () => {
  setupYjsWebSocketServer(server);
  setupTerminalWebSocketServer(server);
  
  // Start the background worker for Auto-Archiving idle containers
  ActivityTracker.startIdleCronJob();

  console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
