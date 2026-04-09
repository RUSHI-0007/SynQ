"use client";

import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '@clerk/nextjs';
import { getApiUrl, getWsUrl, getApiHeaders } from '@/lib/api-client';

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
          getApiUrl(`api/workspace/${projectId}/file?path=${encodeURIComponent(activeFile)}`),
          {
            method: 'PUT',
            headers: {
              ...getApiHeaders(token),
              'Content-Type': 'application/json',
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

    class NgrokBypassWebSocket extends window.WebSocket {
      constructor(url: string | URL) {
        super(url, ['ngrok-skip-browser-warning']);
      }
    }

    const provider = new WebsocketProvider(
      getWsUrl('api/ws'),
      projectId,
      doc,
      { WebSocketPolyfill: NgrokBypassWebSocket }
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
      const fullName = currentUser.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : currentUser.username || 'Anonymous';
      provider.awareness.setLocalStateField('user', {
        name: fullName,
        id: currentUser.id,   // include Clerk userId for reliable dedup
        color: '#' + ((Math.random() * 0xffffff) | 0).toString(16).padStart(6, '0'),
      });
      provider.awareness.setLocalStateField('activeFile', activeFile);
    }

    const broadcastPresence = () => {
      const states = Array.from(provider.awareness.getStates().values());
      window.dispatchEvent(new CustomEvent('ide-presence', { detail: states }));
    };

    provider.awareness.on('change', broadcastPresence);
    // Trigger initial broadcast
    broadcastPresence();

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
      {activeFile ? (
        <div className="flex items-center justify-between px-6 py-2 bg-[#0a0a0c] border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-white/5 border border-white/10">
               <span className="text-[10px] font-bold text-zinc-400 uppercase">{activeFile.split('.').pop()?.substring(0, 3)}</span>
            </div>
            <span className="text-sm font-mono text-zinc-300">{activeFile}</span>
          </div>
          <button 
            onClick={handleRunFile}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md hover:bg-emerald-400/20 transition-all shadow-[0_0_10px_rgba(52,211,153,0.1)] hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] active:scale-95 outline-none focus:ring-2 focus:ring-emerald-400/30"
          >
            ▶ Run File
          </button>
        </div>
      ) : null}
      
      <div className="flex-1 min-h-0 relative">
        {!activeFile ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-zinc-500 gap-4 select-none">
             <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-2xl">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                 <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                 <polyline points="14 2 14 8 20 8"></polyline>
                 <line x1="16" y1="13" x2="8" y2="13"></line>
                 <line x1="16" y1="17" x2="8" y2="17"></line>
                 <line x1="10" y1="9" x2="8" y2="9"></line>
               </svg>
             </div>
             <p className="text-lg font-medium text-zinc-400">Select a file</p>
             <p className="text-sm text-zinc-600 max-w-[250px] text-center leading-relaxed">Choose a file from the sidebar to open the SynQ collaborative editor.</p>
          </div>
        ) : (
          <Editor
            key={activeFile} // Force full remount when switching files → clean Yjs binding
            height="100%"
            language={getLanguage(activeFile)}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: '"Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
              fontLigatures: true,
              lineHeight: 1.6,
              minimap: { enabled: false },
              roundedSelection: true,
              scrollBeyondLastLine: false,
              padding: { top: 24, bottom: 24 },
              lineNumbersMinChars: 3,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              renderLineHighlight: 'all',
              wordWrap: 'on'
            }}
            onMount={handleEditorDidMount}
          />
        )}
      </div>
    </div>
  );
};
