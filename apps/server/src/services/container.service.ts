import Docker from 'dockerode';
import { ContainerConfig, FrameworkTemplate } from '@hackathon/shared-types';
import path from 'path';
import { supabase } from '../lib/supabase';

const docker = new Docker();

const TEMPLATE_REPOS: Record<FrameworkTemplate, string> = {
  NEXTJS_TAILWIND: 'https://github.com/vercel/nextjs-portfolio-starter.git',
  PYTHON_FASTAPI: 'https://github.com/tiangolo/fastapi-template.git',
  VANILLA_VITE: 'https://github.com/vitejs/vite.git',
};

export class ContainerService {
  /**
   * Spawns a container, mounts a volume, and clones the requested template.
   */
  static async createProjectContainer(
    templateId: FrameworkTemplate,
    projectId: string
  ): Promise<ContainerConfig> {
    const isPython = templateId === 'PYTHON_FASTAPI';
    const image = isPython ? 'python:3.11-alpine' : 'node:20-alpine';
    
    // Crucial M1 Silicon constraint for cross-architecture stability
    const platform = process.arch === 'arm64' ? 'linux/arm64' : 'linux/amd64';
    
    // We bind a local host directory to persist files across container restarts
    const hostVolumePath = path.resolve(`/tmp/hackathon-accelerator/${projectId}`);
    
    console.log(`[Scaffolder] Pulling ${image} for project ${projectId}...`);
    // Ensure image exists locally
    await new Promise<void>((resolve, reject) => {
      docker.pull(image, { platform }, (err: Error | null, stream: NodeJS.ReadableStream | undefined) => {
        if (err) return reject(err);
        if (!stream) return reject(new Error('No stream returned from docker.pull'));
        docker.modem.followProgress(stream, onFinished);
        function onFinished(err: Error | null) {
          if (err) return reject(err);
          resolve();
        }
      });
    });

    console.log(`[Scaffolder] Creating container...`);
    const container = await docker.createContainer({
      Image: image,
      Cmd: ['tail', '-f', '/dev/null'],
      name: `hackathon-project-${projectId}`,
      WorkingDir: '/workspace',
      HostConfig: {
        AutoRemove: true,
        Binds: [`${hostVolumePath}:/workspace`],
      },
      platform
    }) as Docker.Container;

    await container.start();
    console.log(`[Scaffolder] Container ${container.id} started.`);

    // Check if a backup exists in Supabase Storage
    const backupPath = `${projectId}/backup.tar`;
    const { data: backupCheck } = await supabase.storage.from('workspaces').list(projectId, { search: 'backup.tar' });

    if (backupCheck && backupCheck.length > 0) {
      console.log(`[Scaffolder] Found existing backup for ${projectId}. Restoring from Supabase...`);
      await ContainerService.restoreWorkspace(projectId, container);
    } else {
      console.log(`[Scaffolder] No backup found. Executing git clone...`);
      
      // We must install git first if it's an alpine image missing it, then clone
      const repoUrl = TEMPLATE_REPOS[templateId] || TEMPLATE_REPOS.NEXTJS_TAILWIND;
      
      // Combine alpine package install, clone, and git directory removal.
      // Skip npm install to prevent terminal timeouts.
      const execCmd = [
        'sh', '-c',
        `apk add --no-cache git && git clone ${repoUrl} . && rm -rf .git`
      ];

      const exec = await container.exec({
        Cmd: execCmd,
        AttachStdout: true,
        AttachStderr: true,
      });

      const execStream = await exec.start({ Detach: false });
      
      // Pipe output to the server console to ensure stream drains before completion
      execStream.pipe(process.stdout);

      await new Promise<void>((resolve, reject) => {
        execStream.on('end', resolve);
        execStream.on('error', reject);
      });

      console.log(`[Scaffolder] Git clone completed for ${projectId}.`);
    }

    // Update DB status to active so dashboard knows it's alive
    await supabase.from('projects').update({ status: 'active' }).eq('id', projectId);

    return {
      projectId,
      containerId: container.id,
      port: 3000,
      status: 'running',
      platform,
      workspacePath: hostVolumePath
    };
  }

  static async stopContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    await container.stop();
  }

  /**
   * Downloads a project's tarball from Supabase Storage and streams it directly
   * into the running Docker container via dockerode's putArchive.
   */
  static async restoreWorkspace(projectId: string, container: Docker.Container): Promise<void> {
    try {
      const backupPath = `${projectId}/backup.tar`;
      
      // Download the tar archive from Supabase
      const { data, error } = await supabase.storage
        .from('workspaces')
        .download(backupPath);

      if (error || !data) {
        throw new Error(`Failed to download backup: ${error?.message || 'No data'}`);
      }

      // Convert Blob (from Supabase) to ArrayBuffer, then Buffer, then pipe to Container
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // putArchive takes a tar stream/buffer and extracts it inside the container.
      // Since `getArchive({ path: '/workspace' })` packs the "workspace" directory inside the tar,
      // extracting to `/` will unpack the "workspace" folder directly into `/workspace`.
      await container.putArchive(buffer, { path: '/' });
      
      console.log(`[Scaffolder] Successfully restored workspace from Supabase for ${projectId}`);
    } catch (err) {
      console.error(`[Scaffolder] Restoration failed for ${projectId}:`, err);
      throw err;
    }
  }
}

