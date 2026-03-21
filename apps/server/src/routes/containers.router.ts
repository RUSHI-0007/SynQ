import { Router } from 'express';
import { ContainerService } from '../services/container.service';

import { FrameworkTemplate } from '@hackathon/shared-types';

const router = Router();

router.post('/start', async (req, res, next) => {
  try {
    const { projectId, templateId } = req.body as {
      projectId: string;
      templateId: FrameworkTemplate;
    };
    
    if (!projectId || !templateId) {
      res.status(400).json({ error: 'projectId and templateId are required' });
      return;
    }
    const containerConfig = await ContainerService.createProjectContainer(templateId, projectId);
    res.json(containerConfig);
  } catch (error) {
    next(error);
  }
});

export default router;
