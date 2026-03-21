import { Router } from 'express';
import { FsService } from '../services/fs.service';

const router = Router();

/**
 * GET /api/fs/:projectId/tree
 * Returns the full nested file tree of the project's Docker workspace.
 */
router.get('/:projectId/tree', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }

    const tree = await FsService.getTree(projectId);
    res.json(tree);
  } catch (err) {
    // Surface container-not-running errors as 404, not 500
    if (err instanceof Error && (err.message.includes('not running') || err.message.includes('No running container'))) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/fs/:projectId/file?path=src/app/page.tsx
 * Returns raw file content as plain text.
 */
router.get('/:projectId/file', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const filePath = req.query['path'];

    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }
    if (!filePath || typeof filePath !== 'string') {
      res.status(400).json({ error: 'path query parameter is required' });
      return;
    }

    const content = await FsService.readFile(projectId, filePath);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('not running') || err.message.includes('No running container')) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message.includes('Failed to read file')) {
        res.status(422).json({ error: err.message });
        return;
      }
    }
    next(err);
  }
});

export default router;
