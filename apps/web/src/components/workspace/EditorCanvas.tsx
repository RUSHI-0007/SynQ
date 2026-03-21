"use client";

import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '@clerk/nextjs';

// Detect the language and return the correct bash command
const getLanguage = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python', json: 'json',
    md: 'markdown', css: 'css',
    html: 'html', sh: 'shell',
    yaml: 'yaml', yml: 'yaml', toml: 'ini',
    lock: 'plaintext', config: 'plaintext',
  };
  return map[ext ?? ''] ?? 'plaintext';
}

const getRunCommand = (filePath: string) => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return `node ${filePath}`;
    case 'ts': return `npx ts-node ${filePath}`; // Assuming ts-node is in their container
    case 'py': return `python3 ${filePath}`;
    case 'cpp': return `g++ ${filePath} -o output && ./output`;
    case 'sh': return `bash ${filePath}`;
    default: return `echo "Cannot auto-run .${ext} files. Please run manually in terminal."`;
  }
};

interface EditorCanvasProps {
  projectId: string;
  currentUser: any;
  activeFile: string;
  initialContent?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  projectId,
  currentUser,
  activeFile,
  initialContent,
}) => {
  const { getToken } = useAuth();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const handleRunFile = () => {
    if (!activeFile) return;
    
    const command = getRunCommand(activeFile);
    
    window.dispatchEvent(new CustomEvent('inject-terminal-command', { 
      detail: `${command}\r\n` 
    }));
  };

  const scheduleSave = useCallback((content: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      if (content === lastSavedRef.current) return;
      if (!activeFile) return;

      try {
        const token = await getToken();
        const res = await fetch(
          `http://localhost:4000/api/workspace/${projectId}/file?path=${encodeURIComponent(activeFile)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
          }
        );
        if (res.ok) {
          lastSavedRef.current = content;
          console.log('[EditorCanvas] Auto-saved:', activeFile);
        } else {
          console.error(`[EditorCanvas] Failed to save ${activeFile}: ${res.statusText}`);
          // Fallback UI indication since we have no toast library
        }
      } catch (e) {
        console.error('[EditorCanvas] Auto-save completely failed:', e);
        // Alert is un-intrusive enough when actively writing code that just failed to sync to Docker
      }
    }, 1000);
  }, [activeFile, projectId, getToken]);

  const handleEditorDidMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:4000/api/ws',
      projectId,
      doc
    );

    const type = doc.getText(activeFile || 'monaco');

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && type.length === 0 && initialContent) {
        type.insert(0, initialContent);
        lastSavedRef.current = initialContent;
      }
    });

    // Wait for Monaco to have a valid Model before binding Yjs
    const model = editorInstance.getModel();
    if (!model) {
       console.warn('[EditorCanvas] No active model found during mount');
       return;
    }

    // MonacoBinding explicitly requires the IStandaloneCodeEditor type
    const binding = new MonacoBinding(
      type,
      model,
      new Set([editorInstance as any]), // y-monaco bindings internal legacy type mismatch
      provider.awareness
    );

    if (currentUser) {
      provider.awareness.setLocalStateField('user', {
        name: currentUser.firstName || currentUser.username || 'Anonymous',
        color: '#' + ((Math.random() * 0xffffff) | 0).toString(16).padStart(6, '0'),
      });
    }

    editorInstance.onDidChangeModelContent(() => {
      const currentValue = editorInstance.getValue();
      scheduleSave(currentValue);
    });

    return () => {
      provider.disconnect();
      doc.destroy();
      binding.destroy();
    };
  };

  return (
    <div className="w-full h-full flex flex-col pt-[60px]" style={{ backgroundColor: '#050505' }}>
      {/* File Header & Smart Run Button */}
      {activeFile && (
        <div className="flex items-center justify-between px-6 py-2 bg-[#0a0a0c] border-b border-white/5">
          <span className="text-sm font-mono text-zinc-400">{activeFile}</span>
          <button 
            onClick={handleRunFile}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md hover:bg-emerald-400/20 transition-all shadow-[0_0_10px_rgba(52,211,153,0.1)] hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] active:scale-95 outline-none focus:ring-2 focus:ring-emerald-400/30"
          >
            ▶ Run File
          </button>
        </div>
      )}
      
      <div className="flex-1 min-h-0 relative">
        <Editor
          key={activeFile} // Force full remount when switching files → clean Yjs binding
          height="100%"
          language={getLanguage(activeFile)}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            minimap: { enabled: false },
            roundedSelection: true,
            scrollBeyondLastLine: false,
            padding: { top: 20 },
            lineNumbersMinChars: 3,
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};
