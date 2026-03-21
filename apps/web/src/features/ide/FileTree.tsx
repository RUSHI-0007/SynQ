"use client";

import React, { useState } from 'react';
import { FileNode } from '@hackathon/shared-types';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  File,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ─── Icon selection by file extension ────────────────────────────────────────
const CODE_EXTS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'py', 'sh', 'rb', 'go', 'rs', 'c', 'cpp', 'java', 'css', 'scss', 'html', 'vue', 'svelte', 'md', 'mdx',
]);
const JSON_EXTS = new Set(['json', 'yaml', 'yml', 'toml', 'env', 'lock']);

function getFileIcon(name: string): React.ReactNode {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (CODE_EXTS.has(ext)) return <FileCode2 className="w-3.5 h-3.5 shrink-0" />;
  if (JSON_EXTS.has(ext)) return <FileJson className="w-3.5 h-3.5 shrink-0" />;
  return <File className="w-3.5 h-3.5 shrink-0" />;
}

// ─── Single Tree Node ─────────────────────────────────────────────────────────
interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  activeFile: string | null;
  onOpenFile: (path: string) => void;
}

function FileTreeNode({ node, depth, activeFile, onOpenFile }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth === 0);

  const indentPx = depth * 12 + 8;
  const isActive = node.type === 'file' && node.path === activeFile;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="w-full flex items-center gap-1.5 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-zinc-800 transition-colors cursor-pointer select-none"
          style={{ paddingLeft: `${indentPx}px`, paddingRight: '8px' }}
        >
          <span className="text-gray-600 shrink-0">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
          {isOpen
            ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-yellow-500/70" />
            : <Folder className="w-3.5 h-3.5 shrink-0 text-yellow-500/70" />
          }
          <span className="truncate font-medium">{node.name}</span>
        </button>

        {isOpen && node.children && node.children.length > 0 && (
          <div>
            {node.children.map(child => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                onOpenFile={onOpenFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  return (
    <button
      onClick={() => onOpenFile(node.path)}
      className={`w-full flex items-center gap-1.5 py-1 text-xs transition-colors cursor-pointer select-none ${
        isActive
          ? 'bg-zinc-800 text-blue-300 border-l-2 border-blue-500'
          : 'text-gray-500 hover:text-gray-200 hover:bg-zinc-800 border-l-2 border-transparent'
      }`}
      style={{
        paddingLeft: isActive ? `${indentPx - 2}px` : `${indentPx}px`,
        paddingRight: '8px',
      }}
      title={node.path}
    >
      <span className={isActive ? 'text-blue-400' : 'text-gray-600'}>
        {getFileIcon(node.name)}
      </span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

// ─── Root File Tree ───────────────────────────────────────────────────────────
interface FileTreeProps {
  tree: FileNode[];
  activeFile: string | null;
  onOpenFile: (path: string) => void;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function FileTree({ tree, activeFile, onOpenFile, loading, error, onRefresh }: FileTreeProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-mono">Scanning workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <AlertCircle className="w-4 h-4 text-red-500/70" />
        <p className="text-xs text-red-400/80">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-600">
        <Folder className="w-4 h-4" />
        <span className="text-xs font-mono">Empty workspace</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {tree.map(node => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          activeFile={activeFile}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
}
