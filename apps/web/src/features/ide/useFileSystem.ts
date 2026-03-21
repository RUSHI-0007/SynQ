import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FileNode } from '@hackathon/shared-types';
import type * as monaco from 'monaco-editor';

export interface UseFileSystemReturn {
  tree: FileNode[];
  activeFile: string | null;
  activeContent: string;
  roomId: string;
  openFile: (path: string) => Promise<void>;
  loading: boolean;
  treeLoading: boolean;
  error: string | null;
  setEditorRef: (editor: monaco.editor.IStandaloneCodeEditor | null) => void;
}

export function useFileSystem(projectId: string): UseFileSystemReturn {
  const { getToken } = useAuth();

  const [tree, setTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<string>('// Select a file from the sidebar to start editing.');
  const [roomId, setRoomId] = useState<string>(projectId);
  const [treeLoading, setTreeLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference to the Monaco editor instance — set via callback from parent
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const setEditorRef = useCallback((editor: monaco.editor.IStandaloneCodeEditor | null) => {
    editorRef.current = editor;
  }, []);

  // ─── Fetch file tree on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    const fetchTree = async () => {
      setTreeLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:4000/api/fs/${projectId}/tree`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(body.error || `Failed to fetch file tree (${res.status})`);
        }
        const data = await res.json();
        setTree(data as FileNode[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setTreeLoading(false);
      }
    };

    fetchTree();

    // Poll the backend container every 5 seconds to simulate an auto-updating file tree watcher
    const interval = setInterval(fetchTree, 5000);
    return () => clearInterval(interval);
  }, [projectId, getToken]);

  // ─── Open a file: fetch content + switch Yjs collaboration room ────────
  const openFile = useCallback(async (path: string) => {
    if (path === activeFile) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(
        `http://localhost:4000/api/fs/${projectId}/file?path=${encodeURIComponent(path)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Failed to read file (${res.status})`);
      }

      const content = await res.text();

      // Update Monaco editor content directly if we have the ref
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          model.setValue(content);
        }
      }

      setActiveContent(content);
      setActiveFile(path);

      // ── Critical: Switch Yjs room to file-scoped channel ──────────────
      // Format: "projectId:src/app/page.tsx"
      // useCollabEditor watches this and reconnects when it changes.
      setRoomId(`${projectId}:${path}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, activeFile, getToken]);

  return {
    tree,
    activeFile,
    activeContent,
    roomId,
    openFile,
    loading,
    treeLoading,
    error,
    setEditorRef,
  };
}
