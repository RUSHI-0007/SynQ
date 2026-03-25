import Docker from 'dockerode';
import { PassThrough } from 'stream';
import { FileNode } from '@hackathon/shared-types';

const docker = new Docker();

// ─── Internal Helper: demux Docker's multiplexed stdout/stderr stream ──────
function execInContainer(
  container: Docker.Container,
  cmd: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
      });

      // hijack: true is required for demuxStream to work correctly
      const stream = await exec.start({ Detach: false, hijack: true });

      const stdoutPT = new PassThrough();
      const stderrPT = new PassThrough();

      let stdout = '';
      let stderr = '';

      stdoutPT.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
      stderrPT.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });

      // Docker multiplexes stdout/stderr into a single stream.
      // modem.demuxStream correctly splits them using the 8-byte frame headers.
      docker.modem.demuxStream(stream, stdoutPT, stderrPT);

      stream.on('end', () => resolve({ stdout, stderr }));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Internal Helper: parse flat `find` output into nested FileNode tree ───
function parseFindOutput(raw: string): FileNode[] {
  // Build a path → children map
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l !== '/workspace' && l !== '.')
    // Normalise: strip leading /workspace/ or ./
    .map(l => l.replace(/^\/workspace\/?/, '').replace(/^\.\//, ''))
    .filter(Boolean);

  // Build an intermediary tree of { [name]: childrenMap | null }
  type RawTree = { [key: string]: RawTree | null };
  const root: RawTree = {};

  for (const line of lines) {
    const parts = line.split('/');
    let cursor: RawTree = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      if (i === parts.length - 1) {
        // Leaf = file (only set if not already a dir map)
        if (!(part in cursor)) cursor[part] = null;
      } else {
        // Intermediate = directory
        if (cursor[part] === null || !(part in cursor)) {
          cursor[part] = {};
        }
        cursor = cursor[part] as RawTree;
      }
    }
  }

  function toNodes(tree: RawTree, parentPath: string): FileNode[] {
    return Object.entries(tree)
      .sort(([aKey, aVal], [bKey, bVal]) => {
        const aIsDir = aVal !== null && typeof aVal === 'object';
        const bIsDir = bVal !== null && typeof bVal === 'object';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return aKey.localeCompare(bKey);
      })
      .map(([name, children]) => {
        const path = parentPath ? `${parentPath}/${name}` : name;
        if (children === null) {
          return { name, path, type: 'file' as const };
        }
        return {
          name,
          path,
          type: 'directory' as const,
          children: toNodes(children as RawTree, path),
        };
      });
  }

  return toNodes(root, '');
}

// ─── Public Service ────────────────────────────────────────────────────────
export class FsService {
  /**
   * Resolves the running Docker container for a project by its well-known name.
   * Throws a descriptive error if the container isn't running.
   */
  static async getContainer(projectId: string): Promise<Docker.Container> {
    const name = `hackathon-project-${projectId}`;
    try {
      const container = docker.getContainer(name);
      const info = await container.inspect();
      if (!info.State.Running) {
        throw new Error(`Container ${name} exists but is not running.`);
      }
      return container;
    } catch (err: any) {
      if (err.statusCode === 404 || err.message?.includes('No such container')) {
        throw new Error(`No running container found for project ${projectId}. Has the sandbox been started?`);
      }
      throw err;
    }
  }

  /**
   * Returns a nested FileNode tree of the /workspace directory inside the container.
   * Excludes node_modules, .git, .next, __pycache__, and .venv.
   */
  static async getTree(projectId: string): Promise<FileNode[]> {
    const container = await FsService.getContainer(projectId);

    const excludes = [
      '*/node_modules/*',
      '*/.git/*',
      '*/.next/*',
      '*/__pycache__/*',
      '*/.venv/*',
      '*/dist/*',
    ];

    const pruneArgs = excludes.flatMap(p => ['-not', '-path', p]);
    const cmd = ['find', '/workspace', ...pruneArgs, '-print'];

    const { stdout, stderr } = await execInContainer(container, cmd);

    if (stderr && !stderr.includes('Permission denied')) {
      console.warn('[FsService] find stderr:', stderr);
    }

    return parseFindOutput(stdout);
  }

  /**
   * Reads a file from /workspace inside the container and returns it as a string.
   * The filePath should be relative to /workspace (e.g., "src/app/page.tsx").
   */
  static async readFile(projectId: string, filePath: string): Promise<string> {
    const container = await FsService.getContainer(projectId);

    // Prevent path traversal
    const safePath = filePath.replace(/\.\.\//g, '').replace(/^\/+/, '');
    const absolutePath = `/workspace/${safePath}`;

    const { stdout, stderr } = await execInContainer(container, ['cat', absolutePath]);

    if (stderr?.trim()) {
      throw new Error(`Failed to read file: ${stderr.trim()}`);
    }

    return stdout;
  }

  /**
   * Returns a flat sorted array of relative file paths inside /workspace,
   * excluding node_modules, .git, .next, dist, __pycache__, .venv, and hidden files.
   */
  /**
   * Returns a flat sorted array of relative file paths inside /workspace.
   */
  static async getFlatPaths(projectId: string): Promise<string[]> {
    const container = await FsService.getContainer(projectId);

    const { stdout } = await execInContainer(container, [
      'sh', '-c',
      'find . -type f ' +
      '-not -path "*/node_modules/*" ' +
      '-not -path "*/.git/*" ' +
      '-not -path "*/.next/*" ' +
      '-not -path "*/dist/*" ' +
      '-not -path "*/__pycache__/*" ' +
      '-not -path "*/.venv/*" ' +
      '-not -path "*/\\.*" ' +
      '| sed "s|^./||" | sort',
    ]);

    return stdout
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);
  }

  /**
   * Creates a new empty file at the given relative path inside /workspace.
   * Automatically creates parent directories as needed.
   */
  /**
   * Creates a new empty file at the given relative path inside /workspace.
   */
  static async createFile(projectId: string, filePath: string): Promise<void> {
    const container = await FsService.getContainer(projectId);
    const safePath = filePath.replace(/\.\.\//g, '').replace(/^\/+/, '');
    const absolutePath = `/workspace/${safePath}`;
    const { stderr } = await execInContainer(container, [
      'sh', '-c',
      `mkdir -p "$(dirname "${absolutePath}")" && touch "${absolutePath}"`,
    ]);
    if (stderr?.trim()) {
      throw new Error(`Failed to create file: ${stderr.trim()}`);
    }
  }

  /**
   * Writes content to a file inside the container via stdin → tee.
   * This avoids ALL shell quoting and escaping nightmares with special chars in code.
   * The content is streamed as raw bytes directly into the container process.
   */
  static async writeFile(projectId: string, filePath: string, content: string): Promise<void> {
    const container = await FsService.getContainer(projectId);

    const safePath = filePath.replace(/\.\.\//g, '').replace(/^\/+/, '');
    const absolutePath = `/workspace/${safePath}`;

    // Ensure parent directories exist first
    await execInContainer(container, [
      'sh', '-c', `mkdir -p "$(dirname "${absolutePath}")"`,
    ]);

    const exec = await container.exec({
      Cmd: ['tee', absolutePath],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
    });

    await new Promise<void>((resolve, reject) => {
      exec.start({ hijack: true, stdin: true }, (err: Error | null, stream: any) => {
        if (err) return reject(err);

        // Write content as UTF-8 bytes and close stdin
        stream.write(Buffer.from(content, 'utf8'));
        stream.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
      });
    });
  }

  /**
   * Deletes a file or directory inside the container via `rm -rf`.
   */
  static async deleteFile(projectId: string, filePath: string): Promise<void> {
    const container = await FsService.getContainer(projectId);
    const safePath = filePath.replace(/\.\.\//g, '').replace(/^\/+/, '');
    const absolutePath = `/workspace/${safePath}`;

    // Protect against deleting the root workspace
    if (absolutePath === '/workspace' || absolutePath === '/workspace/') {
      throw new Error('Cannot delete the root workspace folder.');
    }

    const { stderr } = await execInContainer(container, [
      'sh', '-c', `rm -rf "${absolutePath}"`,
    ]);

    if (stderr?.trim()) {
      throw new Error(`Failed to delete file: ${stderr.trim()}`);
    }
  }

  /**
   * Renames a file or directory inside the container via `mv`.
   */
  static async renameFile(projectId: string, oldPath: string, newPath: string): Promise<void> {
    const container = await FsService.getContainer(projectId);
    
    const safeOldPath = oldPath.replace(/\.\.\//g, '').replace(/^\/+/, '');
    const absoluteOldPath = `/workspace/${safeOldPath}`;
    
    const safeNewPath = newPath.replace(/\.\.\//g, '').replace(/^\/+/, '');
    const absoluteNewPath = `/workspace/${safeNewPath}`;

    if (absoluteOldPath === '/workspace' || absoluteOldPath === '/workspace/') {
      throw new Error('Cannot rename the root workspace folder.');
    }

    // Ensure the parent directory of the new path exists
    await execInContainer(container, [
      'sh', '-c', `mkdir -p "$(dirname "${absoluteNewPath}")"`,
    ]);

    const { stderr } = await execInContainer(container, [
      'sh', '-c', `mv "${absoluteOldPath}" "${absoluteNewPath}"`,
    ]);

    if (stderr?.trim()) {
      throw new Error(`Failed to rename file: ${stderr.trim()}`);
    }
  }
}
