export interface ContainerConfig {
  projectId: string;
  containerId: string;
  port: number;
  previewUrl?: string;  // Public URL where the container's app is accessible
  status: 'starting' | 'running' | 'stopped' | 'error';
  platform: 'linux/amd64' | 'linux/arm64';
  workspacePath: string;
}

export type FrameworkTemplate =
  | 'NEXTJS_TAILWIND'
  | 'PYTHON_FASTAPI'
  | 'VANILLA_VITE'
  | 'CPP_CMAKE'
  | 'RUST_CARGO'
  | 'GO_MODULE'
  | 'C_MAKE'
  | 'NODE_BLANK'
  | 'PYTHON_BLANK';

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

