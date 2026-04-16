import { Router } from 'express';
import { ContainerService } from '../services/container.service';
import { FrameworkTemplate, Project } from '@hackathon/shared-types';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';

const router = Router();

// ─── In-memory fallback store ─────────────────────────────────────────────
// Populated on every scaffold so projects are always retrievable even when
// the Supabase `projects` table hasn't been created yet.
type StoredProject = Project & { ownerId: string; templateId: string };
const projectCache = new Map<string, StoredProject>();

// ─── GET /api/projects ────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { scopeId } = req.query;
    if (!scopeId || typeof scopeId !== 'string') {
      res.status(400).json({ error: 'scopeId query parameter is required' });
      return;
    }

    // 1. Projects the user OWNS
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('ownerId', scopeId)
      .order('createdAt', { ascending: false });

    // 2. Projects the user is a TEAMMATE of (but doesn't own)
    const { data: teammateRows } = await supabase
      .from('project_teammates')
      .select('project_id')
      .eq('user_id', scopeId);

    let sharedDbProjects: any[] = [];
    let sharedCacheProjects: any[] = [];

    if (teammateRows && teammateRows.length > 0) {
      const sharedProjectIds = teammateRows.map((r: any) => r.project_id);
      
      // Try from DB
      const { data: shared } = await supabase
        .from('projects')
        .select('*')
        .in('id', sharedProjectIds);
      sharedDbProjects = shared ?? [];

      // Try from memory cache (since Supabase 'projects' table might not exist)
      const allCached = Array.from(projectCache.values());
      sharedCacheProjects = allCached.filter(p => sharedProjectIds.includes(p.id));
    }

    // 3. In-memory cache fallback for OWNED projects
    const cachedForScope = Array.from(projectCache.values())
      .filter(p => p.ownerId === scopeId);

    if (ownedError) {
      console.warn('[Supabase] Ignoring fetch error or table missing:', ownedError.message);
      // Merge cached owned + cached shared
      const allCached = [...cachedForScope, ...sharedCacheProjects];
      const uniqueCached = Array.from(new Map(allCached.map(p => [p.id, p])).values());
      res.json(uniqueCached);
      return;
    }

    // 4. Merge all sources, deduplicate by id
    const allDbProjects = [...(ownedProjects ?? []), ...sharedDbProjects];
    const dbIds = new Set(allDbProjects.map((p: any) => p.id));
    
    // Add any cached projects (owned or shared) that aren't in the DB
    const allCacheRelevant = [...cachedForScope, ...sharedCacheProjects];
    const cacheOnly = allCacheRelevant.filter(p => !dbIds.has(p.id));
    
    const finalMerge = [...allDbProjects, ...cacheOnly];
    const uniqueFinal = Array.from(new Map(finalMerge.map(p => [p.id, p])).values());
    
    res.json(uniqueFinal);
  } catch (error) {
    next(error);
  }
});


// ─── POST /api/projects/scaffold ─────────────────────────────────────────
router.post('/scaffold', async (req, res, next) => {
  try {
    const { name, templateId, scopeId } = req.body as {
      name: string;
      templateId: FrameworkTemplate;
      scopeId: string;
    };

    if (!templateId || !scopeId) {
      res.status(400).json({ error: 'templateId and scopeId are required' });
      return;
    }

    const projectId = crypto.randomUUID();
    const projectName = name || `Project ${projectId.substring(0, 6)}`;

    const newProject: StoredProject = {
      id: projectId,
      name: projectName,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: scopeId,
      templateId,
    };

    // Always write to in-memory cache FIRST — guarantees GET /:id always works
    projectCache.set(projectId, newProject);

    const { error } = await supabase
      .from('projects')
      .insert([{
        id: projectId,
        name: projectName,
        status: 'active',
        ownerid: scopeId,
        templateid: templateId,
      }]);

    if (error) {
      console.warn('[Supabase] Could not persist project (using in-memory cache):', error.message);
    } else {
      // Automatically add the creator as a teammate (owner)
      const { error: teamErr } = await supabase
        .from('project_teammates')
        .insert([{
          project_id: projectId,
          user_id: scopeId,
          role: 'owner',
          custom_role: null,
        }]);
      if (teamErr) {
        console.warn('[Supabase] Could not persist owner to teammates:', teamErr.message);
      }
    }

    // ── RESPOND IMMEDIATELY (before Docker) so Cloudflare tunnel doesn't time out ──
    // Cloudflare free tunnels kill requests after 30s. Docker can take 60-120s on first
    // run (image pull). We return the project record right away and do Docker in background.
    res.json({ project: newProject, container: { status: 'booting', projectId } });

    // ── BACKGROUND: spin up the Docker container async ──
    ContainerService.createProjectContainer(templateId, projectId)
      .then((containerConfig) => {
        if (containerConfig.previewUrl) {
          projectCache.set(projectId, { ...newProject, previewUrl: containerConfig.previewUrl } as any);
          // Persist previewUrl back to Supabase
          supabase.from('projects').update({ previewurl: containerConfig.previewUrl }).eq('id', projectId)
            .then(({ error }) => { if (error) console.warn('[Supabase] previewUrl backfill failed:', error.message); });
        }
        console.log(`[Scaffold] Container ready for project ${projectId}`);
      })
      .catch((err) => {
        console.error(`[Scaffold] Background container creation failed for ${projectId}:`, err.message);
      });

  } catch (error) {
    next(error);
  }
});


// ─── GET /api/projects/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Check in-memory cache first (always fresh, zero latency)
    const cached = projectCache.get(id);
    if (cached) {
      res.json(cached);
      return;
    }

    // 2. Fall back to Supabase
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});
// ─── GET /api/projects/:id/teammates ──────────────────────────────────────
router.get('/:id/teammates', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Get user_ids from Supabase project_teammates table
    const { data: members, error } = await supabase
      .from('project_teammates')
      .select('user_id, role, custom_role')
      .eq('project_id', id);

    if (error) {
      console.warn('[Supabase] Failed to fetch teammates:', error.message);
      res.status(500).json({ error: 'Failed to fetch teammates' });
      return;
    }

    let finalMembers = members || [];

    // Fallback: Ensure the project owner exists in the members list
    const { data: projectData } = await supabase
      .from('projects')
      .select('ownerId')
      .eq('id', id)
      .single();

    if (projectData && projectData.ownerId) {
      const ownerExists = finalMembers.some((m: any) => m.user_id === projectData.ownerId);
      if (!ownerExists) {
        finalMembers.push({ user_id: projectData.ownerId, role: 'owner', custom_role: null });
      }
    }

    if (finalMembers.length === 0) {
      res.json([]);
      return;
    }

    // 2. Resolve Clerk profiles in parallel
    const { createClerkClient } = await import('@clerk/backend');
    // Using simple initialization relying on CLERK_SECRET_KEY env var
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

    const enrichedTeammates = await Promise.all(
      members.map(async (m) => {
        try {
          const user = await clerk.users.getUser(m.user_id);
          const nameParts = [user.firstName, user.lastName].filter((p): p is string => !!p && p !== 'null');
          const name = nameParts.length > 0 ? nameParts.join(' ') : (user.username || user.emailAddresses?.[0]?.emailAddress || 'Anonymous');
          return {
            id: user.id,
            name,
            avatarUrl: user.imageUrl,
            role: m.role,
            customRole: m.custom_role || null,
          };
        } catch (clerkErr) {
          console.warn(`[Clerk] Could not resolve user ${m.user_id}:`, clerkErr);
          // Fallback if Clerk API errors out for a specific user
          return {
            id: m.user_id,
            name: 'Unknown User',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`,
            role: m.role,
            customRole: m.custom_role || null,
          };
        }
      })
    );

    res.json(enrichedTeammates);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/projects/:id/resume ────────────────────────────────────────
router.post('/:id/resume', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch project to get templateId
    const { data: project, error } = await supabase
      .from('projects')
      .select('templateId, status')
      .eq('id', id)
      .single();

    if (error || !project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.status === 'active') {
       res.json({ message: 'Project is already active' });
       return;
    }

    // 2. Scaffold/Restore container
    // Because we previously wired `createProjectContainer` to check Supabase Storage
    // for backups, calling this will automatically execute native restore instead of git clone!
    const containerConfig = await ContainerService.createProjectContainer(
      project.templateId as FrameworkTemplate, 
      id
    );

    res.json({ message: 'Restored', container: containerConfig });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/projects/:id/join ──────────────────────────────────────────
// Called by the /join/[id] invite page after Clerk authenticates the user.
router.post('/:id/join', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, customRole } = req.body as { userId: string; customRole?: string };

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // 1. Verify the project exists
    const cached = projectCache.get(id);
    if (!cached) {
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, ownerId')
        .eq('id', id)
        .single();
      if (error || !project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
    }

    // Also ensure the project owner is seeded as a teammate (idempotent fix)
    const projectRecord = projectCache.get(id);
    if (projectRecord) {
      await supabase
        .from('project_teammates')
        .upsert(
          { project_id: id, user_id: projectRecord.ownerId, role: 'owner' },
          { onConflict: 'project_id,user_id' }
        );
    }

    // 2. Upsert into project_teammates — store custom_role text, system role stays 'member'
    const { error: upsertError } = await supabase
      .from('project_teammates')
      .upsert(
        { 
          project_id: id, 
          user_id: userId, 
          role: 'member',
          custom_role: customRole?.trim() || null,
        },
        { onConflict: 'project_id,user_id' }
      );

    if (upsertError) {
      console.warn('[Supabase] Failed to upsert teammate:', upsertError.message);
      res.status(500).json({ error: 'Failed to join project' });
      return;
    }

    res.json({ success: true, projectId: id });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/projects/:id/invite ────────────────────────────────────────
// Accepts an email address, resolves it to a Clerk userId, and adds them to project_teammates.
router.post('/:id/invite', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body as { email: string };

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    // 1. Verify the project exists
    const cached = projectCache.get(id);
    if (!cached) {
      const { data: project, error } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .single();
      if (error || !project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
    }

    // 2. Look up the Clerk user by email
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

    const usersResult = await clerk.users.getUserList({ emailAddress: [email.toLowerCase().trim()] });
    
    // If the user doesn't exist in Clerk yet, send them a B2C email invitation to join the app
    if (!usersResult.data || usersResult.data.length === 0) {
      try {
        await clerk.invitations.createInvitation({
          emailAddress: email.toLowerCase().trim(),
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${id}`,
          ignoreExisting: true,
        });
        res.json({ success: true, name: email, userId: 'pending' });
        return;
      } catch (invErr: any) {
        console.warn('[Clerk] Failed to send email invitation:', invErr);
        res.status(500).json({ error: 'Failed to send invitation email via Clerk' });
        return;
      }
    }

    const invitedUser = usersResult.data[0];

    if (!invitedUser) {
      res.status(404).json({ error: 'Failed to resolve user' });
      return;
    }

    // 3. Upsert into project_teammates
    const { error: upsertError } = await supabase
      .from('project_teammates')
      .upsert(
        { project_id: id, user_id: invitedUser.id, role: 'member' },
        { onConflict: 'project_id,user_id' }
      );

    if (upsertError) {
      console.warn('[Supabase] Failed to upsert invited teammate:', upsertError.message);
      res.status(500).json({ error: 'Failed to add teammate' });
      return;
    }

    const nameParts = [invitedUser.firstName, invitedUser.lastName].filter((p): p is string => !!p && p !== 'null');
    const name = nameParts.length > 0 ? nameParts.join(' ') : (invitedUser.username || email);

    res.json({ success: true, name, userId: invitedUser.id });
  } catch (error) {
    next(error);
  }
});

export default router;
