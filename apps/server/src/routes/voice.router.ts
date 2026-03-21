import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { env } from '../config/env';

const router = Router();

router.get('/token', async (req, res, next) => {
  try {
    const { projectId, participantName } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      res.status(400).json({ error: 'projectId query parameter is required' });
      return;
    }
    
    if (!participantName || typeof participantName !== 'string') {
      res.status(400).json({ error: 'participantName query parameter is required' });
      return;
    }

    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      res.status(500).json({ error: 'LiveKit credentials are not configured on the server' });
      return;
    }

    // Generate Room Name uniquely via ProjectId
    const roomName = `room-${projectId}`;

    // Create the Access Token mapping permissions
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: participantName, // Used by LiveKit to identify the client
      name: participantName,     // Display name for UI
    });

    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canSubscribe: true 
    });

    const token = await at.toJwt();
    res.json({ token, room: roomName });
  } catch (error) {
    console.error('[LiveKit] Token Generation Error:', error);
    next(error);
  }
});

export default router;
