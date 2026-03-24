"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, FolderOpen, FileCode2, FilePlus, ChevronDown, ChevronRight, Mic, Loader2, Users } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { buildFileTree, FileNode } from '@/lib/file-tree';
import { VoiceRoom } from '@/features/voice/VoiceRoom';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';
import { InviteButton } from '@/features/projects/InviteButton';

interface Teammate {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
}

interface UnifiedSidebarProps {
  projectId: string;
  activeFile: string | null;
  onSelectFile: (file: string) => void;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  projectId,
  activeFile,
  onSelectFile,
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Anonymous';
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Teammates state
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [isLoadingTeammates, setIsLoadingTeammates] = useState(true);

  // VS Code-style new file state
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Live presence state from EditorCanvas Yjs Awareness
  const [activeUsers, setActiveUsers] = useState<Array<{ name: string, color: string, activeFile: string }>>([]);

  useEffect(() => {
    const handlePresence = (e: Event) => {
      const customEvent = e as CustomEvent;
      const states = customEvent.detail;
      const parsedUsers = states.map((s: any) => ({
         name: s.user?.name || 'Anonymous',
         color: s.user?.color || '#888',
         activeFile: s.activeFile
      })).filter((u: any) => !!u.activeFile);
      
      setActiveUsers(parsedUsers);
    };
    window.addEventListener('ide-presence', handlePresence);
    return () => window.removeEventListener('ide-presence', handlePresence);
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/workspace/${projectId}/files`), {
        headers: getApiHeaders(token),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Failed to fetch files (${res.status})`);
      }
      const data = await res.json();
      setFileTree(buildFileTree(data.paths as string[]));
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, getToken]);

  useEffect(() => {
    fetchTree();
    const interval = setInterval(fetchTree, 5000);
    return () => clearInterval(interval);
  }, [fetchTree]);

  const fetchTeammates = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/projects/${projectId}/teammates`), {
        headers: getApiHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setTeammates(data);
      }
    } catch (err) {
      console.error('Failed to fetch teammates', err);
    } finally {
      setIsLoadingTeammates(false);
    }
  }, [projectId, getToken]);

  useEffect(() => {
    fetchTeammates();
    const interval = setInterval(fetchTeammates, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchTeammates]);

  // Focus the inline input as soon as it mounts
  useEffect(() => {
    if (isCreating) {
      setTimeout(() => newFileInputRef.current?.focus(), 50);
    }
  }, [isCreating]);

  const handleCreateFile = async () => {
    const name = newFileName.trim();
    if (!name) { setIsCreating(false); setNewFileName(''); return; }

    try {
      const token = await getToken();
      await fetch(getApiUrl(`api/workspace/${projectId}/files`), {
        method: 'POST',
        headers: { 
          ...getApiHeaders(token),
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ path: name }),
      });
      setIsCreating(false);
      setNewFileName('');
      // Immediately refresh the tree so the new file appears
      setTimeout(fetchTree, 300);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Failed to create file:', err.message);
      } else {
        console.error('Failed to create file:', err);
      }
    }
  };


  return (
    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <span className="ml-4 font-semibold text-sm tracking-wide text-zinc-200">SYNQ IDE</span>
        <div className="ml-auto">
          <InviteButton projectId={projectId} />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {/* Explorer header with VS Code-style New File button */}
        <div className="flex items-center justify-between mb-3 pl-2 group">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Explorer</span>
          <button
            onClick={() => setIsCreating(true)}
            title="New File"
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          >
            <FilePlus size={14} />
          </button>
        </div>

        {/* VS Code-style inline new file input */}
        {isCreating && (
          <div className="flex items-center gap-1.5 px-2 py-1 mb-1 bg-white/5 rounded-md border border-indigo-500/40">
            <FileCode2 size={13} className="text-indigo-400 shrink-0" />
            <input
              ref={newFileInputRef}
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
              }}
              onBlur={handleCreateFile}
              placeholder="filename.ts"
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
            />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 px-2 text-zinc-500 text-sm animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            <span>Scanning container...</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="px-2 text-red-400/80 text-xs leading-relaxed">
            ⚠ {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex flex-col gap-0.5 text-sm text-zinc-300">
            {fileTree.map((node) => (
              <FileTreeNode
                key={node.id}
                node={node}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                activeUsers={activeUsers}
              />
            ))}
            {fileTree.length === 0 && (
              <div className="px-2 text-zinc-500 text-sm">No files found.</div>
            )}
          </div>
        )}
      </div>

      {/* Live Voice / Teammates */}
      <div className="shrink-0 border-t border-white/10 p-4 bg-[#0A0A0A]">
         {/* Teammates Section */}
         <div className="mb-6">
           <div className="flex items-center gap-2 text-zinc-400 mb-3">
             <Users size={16} />
             <span className="text-xs leading-none font-medium uppercase tracking-widest">Teammates</span>
           </div>
           
           {isLoadingTeammates ? (
             <div className="flex items-center gap-2 text-zinc-500 text-xs animate-pulse">
               <Loader2 size={12} className="animate-spin" />
               <span>Loading...</span>
             </div>
           ) : (
             <div className="flex flex-col gap-2">
               {teammates.map((member) => (
                 <div key={member.id} className="flex items-center gap-3 group">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                     src={member.avatarUrl} 
                     alt={member.name}
                     className="w-7 h-7 rounded-full border border-white/10"
                   />
                   <div className="flex flex-col">
                     <span className="text-[13px] font-medium text-zinc-300 truncate max-w-[140px] group-hover:text-white transition-colors">{member.name}</span>
                     <span className="text-[10px] text-zinc-500 capitalize">{member.role}</span>
                   </div>
                 </div>
               ))}
               {teammates.length === 0 && (
                 <span className="text-xs text-zinc-500">No teammates listed</span>
               )}
             </div>
           )}
         </div>

         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2 text-zinc-400">
             <Mic size={16} />
             <span className="text-xs leading-none font-medium uppercase tracking-widest">Voice Channel</span>
           </div>
         </div>
         {/* LiveKit Voice Room Component */}
         <VoiceRoom 
           projectId={projectId} 
           userName={userName} 
           livekitUrl={livekitUrl} 
         />
      </div>
    </aside>
  );
};

// Recursive tree node component with click-to-expand folders
const FileTreeNode = ({
  node,
  activeFile,
  onSelectFile,
  activeUsers,
  depth = 0,
}: {
  node: FileNode;
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  activeUsers: Array<{ name: string, color: string, activeFile: string }>;
  depth?: number;
}) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? false);

  if (node.type === 'file') {
    const isActive = activeFile === node.path;
    const editingUsers = activeUsers.filter(u => u.activeFile === node.path);
    
    return (
      <div
        onClick={() => onSelectFile(node.path)}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={`flex items-center gap-2 pr-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isActive ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-zinc-300'
        }`}
      >
        <FileCode2 size={14} className={isActive ? 'text-indigo-400 shrink-0' : 'text-zinc-500 shrink-0'} />
        <span className="truncate text-sm flex-1">{node.name}</span>
        
        {editingUsers.length > 0 && (
          <div className="flex items-center -space-x-1 shrink-0 ml-2">
            {editingUsers.map((u, i) => (
               <div 
                 key={i} 
                 className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-[#0a0a0c] shadow-sm shrink-0" 
                 style={{ backgroundColor: u.color }} 
                 title={`${u.name} is editing this file`}
               >
                 {u.name.substring(0,1).toUpperCase()}
               </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className="flex items-center gap-2 pr-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 text-zinc-300"
      >
        {isOpen ? (
          <ChevronDown size={13} className="text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-zinc-500 shrink-0" />
        )}
        {isOpen ? (
          <FolderOpen size={14} className="text-blue-400 shrink-0" />
        ) : (
          <Folder size={14} className="text-blue-400 fill-blue-400/20 shrink-0" />
        )}
        <span className="truncate text-sm">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
              <FileTreeNode
              key={child.id}
              node={child}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              activeUsers={activeUsers}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
