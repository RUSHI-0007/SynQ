'use client';

import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useYjsSync } from '../../hooks/useYjsSync';

interface MonacoEditorProps {
  projectId: string;
}

export function MonacoEditor({ projectId }: MonacoEditorProps) {
  const { connected } = useYjsSync(projectId);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="w-full h-full min-h-[500px] border border-slate-700 flex flex-col">
      <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400">
        Status: {connected ? 'Connected to Yjs' : 'Disconnected'}
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          options={{ minimap: { enabled: false } }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}
