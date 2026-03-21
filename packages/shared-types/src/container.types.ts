export interface ContainerConfig {
  projectId: string;
  containerId: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  platform: 'linux/amd64' | 'linux/arm64';
  workspacePath: string;
}

export type FrameworkTemplate = 'NEXTJS_TAILWIND' | 'PYTHON_FASTAPI' | 'VANILLA_VITE';

export interface BoilerplateTemplate {
  id: FrameworkTemplate;
  name: string;
  gitUrl: string;
  defaultBranch: string;
}

export interface FileNode {
  name: string;
  path: string;         // relative to /workspace (e.g., "src/app/page.tsx")
  type: 'file' | 'directory';
  children?: FileNode[];
}

