import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { usePresence } from './usePresence';

export function useCollabEditor(
  projectId: string,
  userId: string,
  clerkRole: string,
  editorInstance: any // Monaco Editor instance
) {
  const [connected, setConnected] = useState(false);
  const { onlineUsers, updateCursor } = usePresence(projectId, userId, clerkRole);

  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    if (!editorInstance) return;

    // 1. Initialize the Yjs Document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');

    // 2. Connect to the unified Express/Yjs WebSocket Server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/api/ws';
    const provider = new WebsocketProvider(wsUrl, projectId, ydoc);
    providerRef.current = provider;

    provider.on('status', (event: { status: string }) => {
      setConnected(event.status === 'connected');
    });

    // 3. Bind Yjs to the Monaco Editor instance
    const binding = new MonacoBinding(
      ytext,
      editorInstance.getModel(),
      new Set([editorInstance]),
      provider.awareness
    );
    bindingRef.current = binding;

    // 4. Listen to local cursor changes to broadcast via Supabase Presence
    const cursorListener = editorInstance.onDidChangeCursorPosition((e: any) => {
      updateCursor({ lineNumber: e.position.lineNumber, column: e.position.column });
    });

    // Cleanup: Disconnect WS, destroy doc, destroy binding
    return () => {
      cursorListener.dispose();
      binding.destroy();
      provider.disconnect();
      ydoc.destroy();
    };
  }, [projectId, editorInstance, updateCursor]);

  return { connected, onlineUsers };
}
