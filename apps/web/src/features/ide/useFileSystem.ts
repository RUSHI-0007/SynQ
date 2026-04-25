import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FileNode } from '@hackathon/shared-types';
import type * as monaco from 'monaco-editor';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';

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
  createFile: (path: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
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

  const fetchTree = useCallback(async (silent = false) => {
    if (!projectId) return;
    if (!silent) setTreeLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/fs/${projectId}/tree`), {
        headers: getApiHeaders(token),
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
      if (!silent) setTreeLoading(false);
    }
  }, [projectId, getToken]);

  // ─── Fetch file tree on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchTree(false); // Initial load (not silent)

    // Poll the backend container every 5 seconds (silent refresh)
    const interval = setInterval(() => fetchTree(true), 5000);
    return () => clearInterval(interval);
  }, [fetchTree]);

  // ─── Open a file: fetch content + switch Yjs collaboration room ────────
  const openFile = useCallback(async (path: string) => {
    // Empty path = clear the editor (called when all tabs are closed)
    if (!path) {
      setActiveFile(null);
      setActiveContent('// Select a file from the sidebar to start editing.');
      setRoomId(projectId);
      return;
    }
    if (path === activeFile) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(
        getApiUrl(`api/workspace/${projectId}/file?filePath=${encodeURIComponent(path)}`),
        { headers: getApiHeaders(token) }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Failed to read file (${res.status})`);
      }

      // The workspace API returns { content: string } JSON
      const json = await res.json();
      const content: string = typeof json === 'string' ? json : (json.content ?? '');

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

  const createFile = useCallback(async (path: string) => {
    const token = await getToken();
    const res = await fetch(getApiUrl(`api/workspace/${projectId}/files`), {
      method: 'POST',
      headers: { ...getApiHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error('Failed to create file');
    await fetchTree(true);
  }, [projectId, getToken, fetchTree]);

  const deleteFile = useCallback(async (path: string) => {
    const token = await getToken();
    const res = await fetch(getApiUrl(`api/workspace/${projectId}/files?filePath=${encodeURIComponent(path)}`), {
      method: 'DELETE',
      headers: getApiHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete file');
    await fetchTree(true);
  }, [projectId, getToken, fetchTree]);

  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    const token = await getToken();
    const res = await fetch(getApiUrl(`api/workspace/${projectId}/files`), {
      method: 'PATCH',
      headers: { ...getApiHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    });
    if (!res.ok) throw new Error('Failed to rename file');
    await fetchTree(true);
  }, [projectId, getToken, fetchTree]);

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
    createFile,
    deleteFile,
    renameFile,
  };
}
