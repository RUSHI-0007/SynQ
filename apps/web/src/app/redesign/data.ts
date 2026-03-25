export const FILES: Record<string, {lang: string, icon: string, iconBg: string, code: string}> = {
  'Editor.tsx': {lang:'typescript', icon:'⚛', iconBg:'#1a6fc4', code: `import { useCollab } from '@synq/yjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import { MonacoEditor } from '@synq/editor';
import { ConsensusBar } from './ConsensusBar';
import { VoiceChannel } from './VoicePanel';
import { useTeamAwareness } from '../hooks/useCollab';
import type { MergeProposal, VoteResult } from '../types';

const VOTE_THRESHOLD = 0.75;

interface CollabEditorProps {
  roomId: string;
  userId: string;
  branch: string;
}

export function CollabEditor({ roomId, userId, branch }: CollabEditorProps) {
  const { doc, awareness, provider } = useCollab(roomId);
  const { teammates, cursors } = useTeamAwareness(awareness);
  const [voteStatus, setVoteStatus] = useState<VoteResult | null>(null);
  const [pendingMerge, setPendingMerge] = useState<MergeProposal | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    provider.on('merge:proposed', (proposal: MergeProposal) => {
      setPendingMerge(proposal);
    });
    return () => provider.removeAllListeners('merge:proposed');
  }, [provider]);

  const handleVote = useCallback(async (vote: 'approve' | 'reject') => {
    if (!pendingMerge) return;

    const result = await provider.castVote({
      mergeId: pendingMerge.id,
      userId,
      vote,
    });

    const approvalRate = result.approvals / result.total;

    if (approvalRate >= VOTE_THRESHOLD) {
      await triggerConsensusMerge(pendingMerge, branch);
    }

    setVoteStatus(result);
  }, [pendingMerge, userId, provider, branch]);

  return (
    <div className="editor-container" ref={editorRef}>
      <ConsensusBar
        teammates={teammates}
        onVote={handleVote}
        voteStatus={voteStatus}
        pendingMerge={pendingMerge}
      />
      <MonacoEditor
        doc={doc}
        awareness={awareness}
        cursors={cursors}
        language="typescript"
        theme="synq-dark"
      />
      <VoiceChannel roomId={roomId} userId={userId} />
    </div>
  );
}`
  },
  'useCollab.ts': {lang:'typescript', icon:'TS', iconBg:'#2f74c0', code: `import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useRef, useState } from 'react';
import type { Awareness } from 'y-protocols/awareness';

const SYNQ_WS_URL = process.env.NEXT_PUBLIC_SYNQ_WS || 'wss://ws.synq.dev';

interface CollabState {
  doc: Y.Doc;
  awareness: Awareness;
  provider: WebsocketProvider;
  isConnected: boolean;
}

export function useCollab(roomId: string): CollabState {
  const docRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const provider = new WebsocketProvider(
      SYNQ_WS_URL,
      \`room:\${roomId}\`,
      docRef.current,
      { connect: true }
    );

    providerRef.current = provider;

    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });

    return () => {
      provider.disconnect();
      docRef.current.destroy();
    };
  }, [roomId]);

  return {
    doc: docRef.current,
    awareness: providerRef.current?.awareness!,
    provider: providerRef.current!,
    isConnected,
  };
}

export function useTeamAwareness(awareness: Awareness) {
  const [teammates, setTeammates] = useState<any[]>([]);
  const [cursors, setCursors] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    if (!awareness) return;

    const updateAwareness = () => {
      const states = Array.from(awareness.getStates().entries());
      const users = states
        .filter(([id]) => id !== awareness.clientID)
        .map(([id, state]) => ({ id, ...state.user, cursor: state.cursor }));

      setTeammates(users.filter(u => u.isOnline));
      setCursors(new Map(states));
    };

    awareness.on('change', updateAwareness);
    return () => awareness.off('change', updateAwareness);
  }, [awareness]);

  return { teammates, cursors };
}`
  },
  'ConsensusBar.tsx': {lang:'typescript', icon:'⚛', iconBg:'#1a6fc4', code: `import { useState } from 'react';
import type { MergeProposal, VoteResult, Teammate } from '../types';

interface ConsensusBarProps {
  teammates: Teammate[];
  onVote: (vote: 'approve' | 'reject') => Promise<void>;
  voteStatus: VoteResult | null;
  pendingMerge: MergeProposal | null;
}

export function ConsensusBar({
  teammates,
  onVote,
  voteStatus,
  pendingMerge,
}: ConsensusBarProps) {
  const [isVoting, setIsVoting] = useState(false);

  if (!pendingMerge) return null;

  const handleVote = async (vote: 'approve' | 'reject') => {
    setIsVoting(true);
    try {
      await onVote(vote);
    } finally {
      setIsVoting(false);
    }
  };

  const approvalRate = voteStatus
    ? voteStatus.approvals / teammates.filter(t => t.isOnline).length
    : 0;

  return (
    <div className="consensus-bar">
      <div className="cb-header">
        <span className="cb-icon">⚖️</span>
        <strong>Consensus Vote</strong>
        <span className="cb-meta">{pendingMerge.branch} → main</span>
      </div>

      <div className="cb-team">
        {teammates.map(member => (
          <div key={member.id} className="cb-member">
            <div
              className="cb-avatar"
              style={{ background: member.color }}
            >
              {member.initials}
            </div>
            <span className="cb-vote-status">
              {member.vote === 'approve' ? '✓' : member.vote === 'reject' ? '✕' : '…'}
            </span>
          </div>
        ))}
      </div>

      <div className="cb-progress">
        <div
          className="cb-progress-fill"
          style={{ width: \`\${approvalRate * 100}%\` }}
        />
      </div>

      <div className="cb-actions">
        <button
          className="cb-btn approve"
          onClick={() => handleVote('approve')}
          disabled={isVoting}
        >
          Approve
        </button>
        <button
          className="cb-btn reject"
          onClick={() => handleVote('reject')}
          disabled={isVoting}
        >
          Request Changes
        </button>
      </div>
    </div>
  );
}`
  },
  'package.json': {lang:'json', icon:'{}', iconBg:'#cb4b16', code: `{
  "name": "synq-collab",
  "version": "2.0.1",
  "description": "Multiplayer Cloud IDE for hackathon teams",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "yjs": "^13.6.18",
    "y-websocket": "^1.5.4",
    "y-protocols": "^1.0.6",
    "@synq/editor": "^2.0.0",
    "@synq/yjs": "^2.0.0",
    "livekit-client": "^1.15.0",
    "@livekit/components-react": "^1.5.0",
    "octokit": "^3.1.2",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.9.0",
    "monaco-editor": "^0.48.0",
    "@monaco-editor/react": "^4.6.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}`
  }
};

export type TreeNodeType = {
  name: string;
  type: 'dir' | 'file';
  icon: string;
  open?: boolean;
  color?: string;
  children?: TreeNodeType[];
};

export const TREE: TreeNodeType[] = [
  {name:'node_modules', type:'dir', icon:'📦', children:[]},
  {name:'public', type:'dir', icon:'🌐', children:[
    {name:'favicon.ico', type:'file', icon:'🖼'},
    {name:'logo.svg', type:'file', icon:'🖼'},
  ]},
  {name:'src', type:'dir', icon:'📁', open:true, children:[
    {name:'components', type:'dir', icon:'📁', open:true, children:[
      {name:'Editor.tsx', type:'file', icon:'⚛', color:'#58a6ff'},
      {name:'ConsensusBar.tsx', type:'file', icon:'⚛', color:'#58a6ff'},
      {name:'VoicePanel.tsx', type:'file', icon:'⚛', color:'#58a6ff'},
      {name:'Sidebar.tsx', type:'file', icon:'⚛', color:'#58a6ff'},
    ]},
    {name:'hooks', type:'dir', icon:'📁', open:true, children:[
      {name:'useCollab.ts', type:'file', icon:'TS', color:'#2f74c0'},
      {name:'useVoice.ts', type:'file', icon:'TS', color:'#2f74c0'},
      {name:'useConsensus.ts', type:'file', icon:'TS', color:'#2f74c0'},
    ]},
    {name:'types', type:'dir', icon:'📁', children:[
      {name:'index.ts', type:'file', icon:'TS', color:'#2f74c0'},
    ]},
    {name:'App.tsx', type:'file', icon:'⚛', color:'#58a6ff'},
    {name:'main.tsx', type:'file', icon:'⚛', color:'#58a6ff'},
    {name:'globals.css', type:'file', icon:'CSS', color:'#264de4'},
  ]},
  {name:'package.json', type:'file', icon:'{}', color:'#cb4b16'},
  {name:'tsconfig.json', type:'file', icon:'{}', color:'#2f74c0'},
  {name:'next.config.js', type:'file', icon:'JS', color:'#f7df1e'},
  {name:'tailwind.config.ts', type:'file', icon:'TS', color:'#06b6d4'},
  {name:'README.md', type:'file', icon:'MD', color:'#8b949e'},
  {name:'.gitignore', type:'file', icon:'◌', color:'#8b949e'},
];

export function getIconBg(filename: string) {
  if(filename.endsWith('.tsx')||filename.endsWith('.jsx')) return '#1a6fc4';
  if(filename.endsWith('.ts')) return '#2f74c0';
  if(filename.endsWith('.js')) return '#8a6000';
  if(filename.endsWith('.json')) return '#8b0000';
  if(filename.endsWith('.css')) return '#264de4';
  if(filename.endsWith('.md')) return '#555';
  return '#444';
}
