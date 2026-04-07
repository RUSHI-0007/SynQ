import Docker from 'dockerode';
import { ContainerConfig, FrameworkTemplate } from '@hackathon/shared-types';
import path from 'path';
import { supabase } from '../lib/supabase';

const docker = new Docker();

const TEMPLATE_REPOS: Record<FrameworkTemplate, string | null> = {
  NEXTJS_TAILWIND: 'https://github.com/vercel/nextjs-portfolio-starter.git',
  PYTHON_FASTAPI:  'https://github.com/tiangolo/fastapi-template.git',
  VANILLA_VITE:    'https://github.com/vitejs/vite.git',
  // Systems tier — clone from curated starter repos
  CPP_CMAKE:       'https://github.com/cpp-best-practices/cmake_template.git',
  RUST_CARGO:      'https://github.com/rust-unofficial/awesome-rust.git',
  GO_MODULE:       'https://github.com/golang-standards/project-layout.git',
  C_MAKE:          'https://github.com/clibs/clib.git',
  // Blank environments — no clone, just the runtime image
  NODE_BLANK:      null,
  PYTHON_BLANK:    null,
};

export class ContainerService {
  /**
   * Spawns a container, mounts a volume, and clones the requested template.
   */
  static async createProjectContainer(
    templateId: FrameworkTemplate,
    projectId: string
  ): Promise<ContainerConfig> {
    // Determine Docker image based on template
    const imageMap: Record<FrameworkTemplate, string> = {
      NEXTJS_TAILWIND: 'node:20-alpine',
      PYTHON_FASTAPI:  'python:3.11-alpine',
      VANILLA_VITE:    'node:20-alpine',
      CPP_CMAKE:       'gcc:13-bookworm',
      RUST_CARGO:      'rust:1.78-alpine',
      GO_MODULE:       'golang:1.22-alpine',
      C_MAKE:          'gcc:13-bookworm',
      NODE_BLANK:      'node:20-alpine',
      PYTHON_BLANK:    'python:3.11-alpine',
    };
    const image = imageMap[templateId] ?? 'node:20-alpine';
    
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
      const repoUrl = TEMPLATE_REPOS[templateId];

      if (repoUrl) {
        console.log(`[Scaffolder] No backup found. Executing git clone from ${repoUrl}...`);

        // Detect package manager: alpine images use apk, debian/ubuntu images use apt-get
        const isAlpine = image.includes('alpine');
        const gitInstall = isAlpine
          ? 'apk add --no-cache git'
          : 'apt-get update -qq && apt-get install -y -qq git';

        const execCmd = ['sh', '-c', `${gitInstall} && git clone ${repoUrl} . && rm -rf .git`];

        const exec = await container.exec({ Cmd: execCmd, AttachStdout: true, AttachStderr: true });
        const execStream = await exec.start({ Detach: false });
        execStream.pipe(process.stdout);

        await new Promise<void>((resolve, reject) => {
          execStream.on('end', resolve);
          execStream.on('error', reject);
        });

        console.log(`[Scaffolder] Git clone completed for ${projectId}.`);
      } else {
        console.log(`[Scaffolder] Blank environment — no clone needed for ${templateId}.`);
      }
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

