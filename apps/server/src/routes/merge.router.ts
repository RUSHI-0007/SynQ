import { Router, Request, Response, NextFunction } from 'express';
import { MergeService } from '../services/merge.service';
import { FsService } from '../services/fs.service';
import { supabase } from '../lib/supabase';

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/merge/propose
// Creates a new merge request for a project
// ─────────────────────────────────────────────────────────────
router.post('/propose', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, authorId, commitMessage, githubOwner, githubRepo } = req.body;

    if (!projectId || !authorId || !githubOwner || !githubRepo) {
      res.status(400).json({
        error: 'projectId, authorId, githubOwner, githubRepo are required',
      });
      return;
    }

    const filesChanged = await FsService.getFlatPaths(projectId);
    const diffPayload = "Bulk sync from SYNQ IDE workspace";

    const request = await MergeService.createMergeRequest({
      projectId,
      authorId,
      commitMessage: commitMessage ?? 'Consensus merge 🚀',
      diffPayload,
      filesChanged,
      githubOwner,
      githubRepo,
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/merge/vote
// Casts (or changes) a user's vote on a merge request.
// Automatically triggers the GitHub push when consensus is reached.
// ─────────────────────────────────────────────────────────────
router.post('/vote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId, userId, decision } = req.body;

    if (!requestId || !userId || !['approve', 'reject'].includes(decision)) {
      res.status(400).json({
        error: 'requestId, userId, and decision (approve | reject) are required',
      });
      return;
    }

    const result = await MergeService.castVote(requestId, userId, decision as 'approve' | 'reject');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/merge/requests/:projectId
// Lists all merge requests for a project
// ─────────────────────────────────────────────────────────────
router.get('/requests/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from('merge_requests')
      .select(`*, merge_votes(*)`)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
