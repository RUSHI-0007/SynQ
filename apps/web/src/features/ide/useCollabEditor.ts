import { useRef, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type * as monaco from 'monaco-editor';
import { getWsUrl } from '@/lib/api-client';

/**
 * Manages the Yjs collaboration binding for Monaco.
 *
 * @param roomId  The Yjs room key. Defaults to the projectId, but changes to
 *                `projectId:filePath` when a file is opened so that collaboration
 *                is scoped to the exact file each user is viewing.
 * @param userId  Displayed as the cursor label for remote participants.
 */
export function useCollabEditor(roomId: string, userId: string) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // ── Connect / reconnect whenever roomId changes ────────────────────────
  useEffect(() => {
    if (!editorRef.current) return;

    // Tear down previous session cleanly
    bindingRef.current?.destroy();
    providerRef.current?.disconnect();
    docRef.current?.destroy();

    const doc = new Y.Doc();
    docRef.current = doc;

    const wsUrl = getWsUrl(`api/ws/${roomId}`);
    const provider = new WebsocketProvider(wsUrl, roomId, doc, { connect: true });
    providerRef.current = provider;

    provider.awareness.setLocalStateField('user', {
      name: userId,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
    });

    const yText = doc.getText('monaco');
    const model = editorRef.current.getModel();
    if (model) {
      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editorRef.current]),
        provider.awareness
      );
    }

    return () => {
      bindingRef.current?.destroy();
      provider.disconnect();
      doc.destroy();
    };
  }, [roomId, userId]);

  // ── Full teardown on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      providerRef.current?.disconnect();
      docRef.current?.destroy();
    };
  }, []);

  /**
   * Called by <Editor onMount={...}>.
   * Stores the editor ref and immediately initialises the Yjs binding.
   */
  const onEditorMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // Initialise the Yjs binding for the current roomId
      const doc = new Y.Doc();
      docRef.current = doc;

      const wsUrl = getWsUrl(`api/ws/${roomId}`);
      const provider = new WebsocketProvider(wsUrl, roomId, doc, { connect: true });
      providerRef.current = provider;

      provider.awareness.setLocalStateField('user', {
        name: userId,
        color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
      });

      const yText = doc.getText('monaco');
      const model = editor.getModel();
      if (model) {
        bindingRef.current = new MonacoBinding(
          yText,
          model,
          new Set([editor]),
          provider.awareness
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally empty — initial mount only, roomId changes handled by effect above
  );

  return { onEditorMount };
}
