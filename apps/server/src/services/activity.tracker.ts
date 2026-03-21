import { ArchiverService } from './archiver.service';
import { supabase } from '../lib/supabase';
import { ContainerService } from './container.service';
import Docker from 'dockerode';

const docker = new Docker();

export class ActivityTracker {
  // Map of projectId -> last active timestamp (ms)
  static lastActivity = new Map<string, number>();

  /**
   * Call this every time a user types in Monaco (Yjs) or hits a terminal key.
   */
  static markActive(projectId: string) {
    this.lastActivity.set(projectId, Date.now());
  }

  /**
   * Runs every 10 minutes to sweep for stale containers
   * (No activity in the last 30 minutes).
   */
  static startIdleCronJob() {
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const CRON_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    console.log(`[Archiver] Started global Idle Cron Job. Sweeping every 10m.`);

    setInterval(async () => {
      console.log(`[Archiver] Running idle container sweep...`);
      const now = Date.now();

      try {
        // Query database for all active containers to map projectId -> containerId
        const { data: activeProjects } = await supabase
          .from('projects')
          .select('id')
          .eq('status', 'active');

        if (!activeProjects || activeProjects.length === 0) return;

        // Ensure every active DB project has a timestamp 
        // (if it just booted but no one typed, track it from NOW)
        for (const proj of activeProjects) {
          if (!this.lastActivity.has(proj.id)) {
             this.lastActivity.set(proj.id, now);
          }
        }

        // Check for stale projects
        for (const [projectId, lastActiveTime] of this.lastActivity.entries()) {
          if (now - lastActiveTime > IDLE_TIMEOUT_MS) {
            
            // Find container ID
            try {
              const containers = await docker.listContainers({
                filters: { name: [`hackathon-project-${projectId}`] }
              });
              
              if (containers.length > 0 && containers[0]?.Id) {
                const containerId = containers[0].Id;
                console.log(`[Archiver] Project ${projectId} has been idle for 30m. Archiving...`);
                // Auto-archive
                await ArchiverService.backupAndKillContainer(projectId, containerId);
              }
            } catch (dockerErr) {
               console.warn(`[Archiver] Docker list error for ${projectId}:`, dockerErr);
            }

            // Clean up the tracker map
            this.lastActivity.delete(projectId);
          }
        }
      } catch (err) {
        console.error(`[Archiver] Sweep error:`, err);
      }
    }, CRON_INTERVAL_MS);
  }
}
