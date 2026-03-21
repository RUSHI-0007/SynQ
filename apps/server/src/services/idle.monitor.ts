import { ContainerPersistenceService } from './container.persistence';

// ─────────────────────────────────────────────────────────────
// IdleMonitor
//
// Tracks Yjs WebSocket activity per project. When a project
// has had zero WebSocket messages for 30 minutes, it triggers
// the container archival + shutdown sequence.
//
// Usage:
//   const monitor = IdleMonitor.getInstance();
//   monitor.heartbeat('project-123');                // call on every WS message
//   monitor.track('project-123', 'container-abc');   // call when container starts
//   monitor.untrack('project-123');                  // call when manually stopped
// ─────────────────────────────────────────────────────────────

const IDLE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS =  5 * 60 * 1000; // check every 5 minutes

interface TrackedProject {
  containerId: string;
  lastActivity: number; // epoch ms
  shuttingDown: boolean;
}

export class IdleMonitor {
  private static instance: IdleMonitor;

  // Map of projectId → tracking state
  private projects = new Map<string, TrackedProject>();
  private intervalHandle: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): IdleMonitor {
    if (!IdleMonitor.instance) {
      IdleMonitor.instance = new IdleMonitor();
    }
    return IdleMonitor.instance;
  }

  // ── Start tracking a container after it's spawned ─────────
  track(projectId: string, containerId: string): void {
    this.projects.set(projectId, {
      containerId,
      lastActivity: Date.now(),
      shuttingDown: false,
    });
    console.log(`[IdleMonitor] Tracking project ${projectId} (container: ${containerId})`);
    this.ensureRunning();
  }

  // ── Record activity (call on every Yjs WS message) ────────
  heartbeat(projectId: string): void {
    const entry = this.projects.get(projectId);
    if (entry && !entry.shuttingDown) {
      entry.lastActivity = Date.now();
    }
  }

  // ── Remove tracking after manual stop ─────────────────────
  untrack(projectId: string): void {
    this.projects.delete(projectId);
    console.log(`[IdleMonitor] Untracked project ${projectId}`);
    if (this.projects.size === 0) this.stop();
  }

  // ── Internal: start the polling interval ──────────────────
  private ensureRunning(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => this.tick(), CHECK_INTERVAL_MS);
    console.log(`[IdleMonitor] Polling started (every ${CHECK_INTERVAL_MS / 60000} min)`);
  }

  private stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log(`[IdleMonitor] Polling stopped (no active projects)`);
    }
  }

  // ── Core tick logic ────────────────────────────────────────
  private async tick(): Promise<void> {
    const now = Date.now();

    for (const [projectId, entry] of this.projects.entries()) {
      if (entry.shuttingDown) continue;

      const idleMs = now - entry.lastActivity;
      if (idleMs < IDLE_THRESHOLD_MS) continue;

      const idleMin = Math.floor(idleMs / 60000);
      console.log(`[IdleMonitor] Project ${projectId} idle for ${idleMin} min. Initiating shutdown...`);

      // Mark immediately to prevent concurrent ticks triggering double-shutdown
      entry.shuttingDown = true;

      this.shutdown(projectId, entry.containerId);
    }
  }

  // ── Shutdown pipeline (runs async, does not block tick) ───
  private async shutdown(projectId: string, containerId: string): Promise<void> {
    try {
      await ContainerPersistenceService.archiveAndShutdown(
        containerId,
        projectId,
        'idle_shutdown',
      );
      console.log(`[IdleMonitor] Project ${projectId} archived and shut down successfully.`);
    } catch (err: any) {
      console.error(`[IdleMonitor] Shutdown failed for project ${projectId}: ${err.message}`);
      // Un-flag shuttingDown so we retry next tick — but only if the container lives
      const entry = this.projects.get(projectId);
      if (entry) entry.shuttingDown = false;
      return;
    }

    // Remove from tracking after successful shutdown
    this.untrack(projectId);
  }
}
