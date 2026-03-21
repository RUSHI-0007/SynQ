import Docker from 'dockerode';
import { supabase } from '../lib/supabase';
import { Readable } from 'stream';

const docker = new Docker();

const WORKSPACE_DIR = '/workspace';
const BACKUP_BUCKET = 'project_backups';

// ─────────────────────────────────────────────────────────────
// ContainerPersistenceService
// Handles: snapshot → upload to Supabase Storage → container teardown
// ─────────────────────────────────────────────────────────────
export class ContainerPersistenceService {

  /**
   * Full shutdown sequence:
   * 1. tar /workspace inside the container
   * 2. Stream the tarball out via dockerode getArchive
   * 3. Upload directly to Supabase Storage (no disk writes)
   * 4. Record the snapshot in container_snapshots table
   * 5. Stop and remove the container
   */
  static async archiveAndShutdown(
    containerId: string,
    projectId: string,
    reason: 'idle_shutdown' | 'manual' | 'pre_merge' = 'idle_shutdown',
  ): Promise<void> {
    const container = docker.getContainer(containerId);
    console.log(`[Persistence] Starting archive for container ${containerId} (project: ${projectId})`);

    // ── Step 1: Compress /workspace inside the container ─────
    const tarballName = `backup_${Date.now()}.tar.gz`;
    const tarInsideContainer = `/tmp/${tarballName}`;

    await runExec(container, [
      'sh', '-c',
      `tar -czf ${tarInsideContainer} -C ${WORKSPACE_DIR} .`
    ]);
    console.log(`[Persistence] Tarball created at ${tarInsideContainer} inside container`);

    // ── Step 2: Stream the tarball OUT of the container ──────
    // docker.getArchive pulls a file/dir as a TAR stream from the container FS.
    // Since we already gzipped it internally, we extract the inner .tar.gz from this outer TAR.
    const archiveStream = await getContainerFile(container, tarInsideContainer);
    const tarGzBuffer   = await extractFirstFileFromTar(archiveStream);
    console.log(`[Persistence] Extracted ${tarGzBuffer.byteLength} bytes from container`);

    // ── Step 3: Upload directly to Supabase Storage ───────────
    const storagePath = `${projectId}/${tarballName}`;
    const { error: uploadErr } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(storagePath, tarGzBuffer, {
        contentType: 'application/gzip',
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(`[Persistence] Supabase upload failed: ${uploadErr.message}`);
    }
    console.log(`[Persistence] Uploaded to ${BACKUP_BUCKET}/${storagePath}`);

    // ── Step 4: Record snapshot metadata ──────────────────────
    const { error: dbErr } = await supabase
      .from('container_snapshots')
      .insert({
        project_id:   projectId,
        container_id: containerId,
        storage_path: storagePath,
        size_bytes:   tarGzBuffer.byteLength,
        reason,
      });

    if (dbErr) {
      // Non-fatal — the file is safe in storage, just log the metadata gap
      console.error(`[Persistence] Snapshot record insert failed: ${dbErr.message}`);
    }

    // ── Step 5: Kill the container ────────────────────────────
    await safeStopAndRemove(container, containerId);
    console.log(`[Persistence] Container ${containerId} removed. Shutdown complete.`);
  }

  /**
   * Restore the latest snapshot for a project into a newly spawned container.
   * Called by ContainerService when re-opening a project after sleep.
   */
  static async getLatestSnapshotPath(projectId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('container_snapshots')
      .select('storage_path')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`[Persistence] Snapshot lookup failed: ${error.message}`);
    return data?.storage_path ?? null;
  }

  /**
   * Downloads the backup tarball from Supabase Storage and pipes it into
   * the workspace directory of a running container (for restore on wake).
   */
  static async restoreSnapshot(containerId: string, storagePath: string): Promise<void> {
    console.log(`[Persistence] Restoring snapshot ${storagePath} into container ${containerId}`);

    const { data: blob, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .download(storagePath);

    if (error || !blob) throw new Error(`[Persistence] Download failed: ${error?.message}`);

    const container = docker.getContainer(containerId);
    const arrayBuffer = await blob.arrayBuffer();
    const readable    = Readable.from(Buffer.from(arrayBuffer));

    // putArchive expects a TAR stream. Since our file is .tar.gz, we need to
    // wrap it. Use the container exec approach instead for reliability.
    await runExec(container, ['sh', '-c', `mkdir -p ${WORKSPACE_DIR}`]);

    // Upload the gzipped tarball to /tmp inside container then extract
    await container.putArchive(readable as any, { path: '/tmp' });
    await runExec(container, [
      'sh', '-c',
      `tar -xzf /tmp/${storagePath.split('/').pop()} -C ${WORKSPACE_DIR}`
    ]);

    console.log(`[Persistence] Restore complete for container ${containerId}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

async function runExec(container: Docker.Container, cmd: string[]): Promise<void> {
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
  });
  const stream = await exec.start({ Detach: false });

  // Drain stdout/stderr
  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
    // Discard output bytes (docker multiplexed stream)
    stream.resume();
  });

  const info = await exec.inspect();
  if ((info as any).ExitCode !== 0) {
    throw new Error(`[Persistence] exec failed (exit ${(info as any).ExitCode}): ${cmd.join(' ')}`);
  }
}

/**
 * dockerode getArchive returns a tarball of the file at `filePath`.
 * Returns it as a Readable stream.
 */
function getContainerFile(container: Docker.Container, filePath: string): Promise<Readable> {
  return new Promise((resolve, reject) => {
    container.getArchive({ path: filePath }, (err, stream) => {
      if (err) return reject(err);
      resolve(stream as unknown as Readable);
    });
  });
}

/**
 * docker getArchive wraps the file in an outer TAR (even if it's itself a .tar.gz).
 * We use node's built-in streaming to extract the first entry's raw bytes.
 */
async function extractFirstFileFromTar(tarStream: Readable): Promise<Buffer> {
  // Dynamically import 'tar-stream' (available transitively via dockerode)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tar = require('tar-stream') as { extract: () => any };
  const extract = tar.extract();

  return new Promise<Buffer>((resolve, reject) => {
    extract.on('entry', (_header: any, stream: NodeJS.ReadableStream & { resume(): void }, next: () => void) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
        next(); // signals tar-stream to continue (though we resolved already)
      });
      stream.on('error', reject);
    });
    extract.on('error', reject);
    tarStream.pipe(extract);
  });
}

async function safeStopAndRemove(container: Docker.Container, id: string): Promise<void> {
  try {
    const info = await container.inspect();
    if (info.State?.Running) {
      await container.stop({ t: 5 }); // 5-second graceful grace period
    }
  } catch (err: any) {
    if (!err.statusCode || err.statusCode !== 404) {
      console.warn(`[Persistence] Stop error for ${id}: ${err.message}`);
    }
  }
  try {
    await container.remove({ force: true });
  } catch (err: any) {
    if (!err.statusCode || err.statusCode !== 404) {
      console.warn(`[Persistence] Remove error for ${id}: ${err.message}`);
    }
  }
}
