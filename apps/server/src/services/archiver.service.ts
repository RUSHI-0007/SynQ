import Docker from 'dockerode';
import { supabase } from '../lib/supabase';

const docker = new Docker();

export class ArchiverService {
  /**
   * Archives a running container's /workspace to Supabase Storage,
   * updates the database project status, and then kills the container.
   */
  static async backupAndKillContainer(projectId: string, containerId: string): Promise<void> {
    try {
      console.log(`[Archiver] Starting backup for container ${containerId} (project: ${projectId})`);
      const container = docker.getContainer(containerId);

      // Step 1: Get the Stream
      // dockerode returns a Node.js Readable stream of the tar archive
      const tarStream = await container.getArchive({ path: '/workspace' });

      // Step 2: Upload to Supabase
      // We pipe this raw tar stream directly to the Supabase Storage bucket
      const filePath = `${projectId}/backup.tar`;
      
      // Node pipelines to a buffer for Supabase Storage since it doesn't accept raw streams easily.
      // For large workspaces in production, we'd use S3 multipart uploads.
      const chunks: Buffer[] = [];
      for await (const chunk of tarStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const tarBuffer = Buffer.concat(chunks);

      const { data, error } = await supabase.storage
        .from('workspaces')
        .upload(filePath, tarBuffer, {
          contentType: 'application/x-tar',
          upsert: true,
        });

      if (error) {
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
      }
      console.log(`[Archiver] Upload successful: ${data?.path}`);

      // Step 3: Cleanup
      console.log(`[Archiver] Stopping container ${containerId}...`);
      await container.stop();
      console.log(`[Archiver] Removing container ${containerId}...`);
      await container.remove();

      // Step 4: Update DB
      const { error: dbError } = await supabase
        .from('projects')
        .update({ 
          status: 'sleeping', 
          updated_at: new Date().toISOString() // Or last_backed_up if that column existed
        })
        .eq('id', projectId);

      if (dbError) {
        console.warn(`[Archiver] Failed to update project status in DB: ${dbError.message}`);
      }

      console.log(`[Archiver] Successfully archived and killed ${projectId}`);
    } catch (err) {
      console.error(`[Archiver] Failed to archive container ${containerId}:`, err);
    }
  }
}
