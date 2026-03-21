import { Router } from 'express';
import { FsService } from '../services/fs.service';

const router = Router();

/**
 * GET /api/workspace/:projectId/files
 * Returns a flat array of all file paths in the container's /workspace.
 * Response: { paths: string[] }
 */
router.get('/:projectId/files', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!projectId) { res.status(400).json({ error: 'projectId is required' }); return; }
    const paths = await FsService.getFlatPaths(projectId);
    res.json({ paths });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('not running') || err.message.includes('No running container'))) {
      res.status(404).json({ error: err.message }); return;
    }
    next(err);
  }
});

/**
 * POST /api/workspace/:projectId/files
 * Creates a new empty file at the given path inside /workspace.
 * Body: { path: string }
 */
router.post('/:projectId/files', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path: filePath } = req.body as { path?: string };
    if (!projectId) { res.status(400).json({ error: 'projectId is required' }); return; }
    if (!filePath || typeof filePath !== 'string') {
      res.status(400).json({ error: 'path is required in request body' }); return;
    }
    await FsService.createFile(projectId, filePath);
    res.status(201).json({ success: true, path: filePath });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('not running') || err.message.includes('No running container'))) {
      res.status(404).json({ error: err.message }); return;
    }
    next(err);
  }
});

/**
 * GET /api/workspace/:projectId/file?path=src/App.tsx
 * Returns the content of a file inside the container.
 * Response: { content: string }
 */
router.get('/:projectId/file', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const filePath = req.query['path'] as string;
    if (!projectId) { res.status(400).json({ error: 'projectId is required' }); return; }
    if (!filePath) { res.status(400).json({ error: 'path query parameter is required' }); return; }

    const content = await FsService.readFile(projectId, filePath);
    res.json({ content });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('not running') || err.message.includes('No running container')) {
        res.status(404).json({ error: err.message }); return;
      }
      if (err.message.includes('Failed to read file')) {
        res.status(422).json({ error: err.message }); return;
      }
    }
    next(err);
  }
});

/**
 * PUT /api/workspace/:projectId/file?path=src/App.tsx
 * Writes content to a file inside the container via stdin (avoids shell-quoting issues).
 * Body: { content: string }
 * Response: { success: true }
 */
router.put('/:projectId/file', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const filePath = req.query['path'] as string;
    const { content } = req.body as { content?: string };

    if (!projectId) { res.status(400).json({ error: 'projectId is required' }); return; }
    if (!filePath) { res.status(400).json({ error: 'path query parameter is required' }); return; }
    if (typeof content !== 'string') { res.status(400).json({ error: 'content must be a string' }); return; }

    await FsService.writeFile(projectId, filePath, content);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('not running') || err.message.includes('No running container'))) {
      res.status(404).json({ error: err.message }); return;
    }
    next(err);
  }
});

export default router;
