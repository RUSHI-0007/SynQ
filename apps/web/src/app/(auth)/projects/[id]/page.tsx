"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useFileSystem } from "@/features/ide/useFileSystem";
import { useTeammates } from "@/features/ide/useTeammates";
import { useConsensus } from "@/features/merge/useConsensus";
import { VoiceRoom } from "@/features/voice/VoiceRoom";
import { InviteButton } from "@/features/projects/InviteButton";
import { FileNode } from "@hackathon/shared-types";
import "@/app/redesign/redesign.css";

// Dynamic imports for browser-only APIs
const EditorCanvas = dynamic(
  () => import("@/components/workspace/EditorCanvas").then(m => m.EditorCanvas),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#050505] animate-pulse" /> }
);
const FloatingTerminal = dynamic(
  () => import("@/components/workspace/FloatingTerminal").then(m => m.FloatingTerminal),
  { ssr: false }
);
const MergeModal = dynamic(
  () => import("@/components/workspace/MergeModal").then(m => m.MergeModal),
  { ssr: false }
);

function getIconBg(filename: string) {
  if(filename.endsWith('.tsx')||filename.endsWith('.jsx')) return '#1a6fc4';
  if(filename.endsWith('.ts')) return '#2f74c0';
  if(filename.endsWith('.js')) return '#8a6000';
  if(filename.endsWith('.json')) return '#8b0000';
  if(filename.endsWith('.css')) return '#264de4';
  if(filename.endsWith('.md')) return '#555';
  return '#444';
}

function getIconChars(filename: string) {
  if(filename.endsWith('.tsx')||filename.endsWith('.jsx')) return '⚛';
  if(filename.endsWith('.ts')) return 'TS';
  if(filename.endsWith('.js')) return 'JS';
  if(filename.endsWith('.json')) return '{}';
  if(filename.endsWith('.css')) return 'CSS';
  if(filename.endsWith('.md')) return 'MD';
  return '◌';
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Anonymous';
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

  const { tree, activeFile, activeContent, openFile, loading, treeLoading, createFile, deleteFile, renameFile } = useFileSystem(params.id);
  const { teammates } = useTeammates(params.id);
  const { proposeMerge, loading: isProposing } = useConsensus(params.id);

  // Redesign States
  const [currentMode, setCurrentMode] = useState<"code" | "design" | "preview">("code");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<'explorer' | 'layout' | 'git' | 'settings' | null>('explorer');
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["src", "app"]));
  const [aiOpen, setAiOpen] = useState(false);
  const [activePresence, setActivePresence] = useState<any[]>([]);
  
  // File Operations State
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingFileParent, setCreatingFileParent] = useState<string | null>(null);
  const [createValue, setCreateValue] = useState("");
  
  // Real App States
  const [mergeOpen, setMergeOpen] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  
  // AI Mock State
  const [aiTyping, setAiTyping] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      id: "1",
      sender: "SYNQ AI",
      senderInitials: "S",
      time: "just now",
      content: "I'm connected to your live codebase. How can I help you build today?",
      reasoning: false,
      diff: false,
      isUser: false
    }
  ]);

  // Keep open tabs synced with activeFile selection from useFileSystem
  useEffect(() => {
    if (activeFile && !openTabs.includes(activeFile)) {
      setOpenTabs(prev => [...prev, activeFile]);
    }
  }, [activeFile, openTabs]);

  // Listen for Monaco Yjs Presence
  useEffect(() => {
    const handlePresence = (e: any) => {
      setActivePresence(e.detail || []);
    };
    window.addEventListener('ide-presence', handlePresence);
    return () => window.removeEventListener('ide-presence', handlePresence);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleProposeMerge = async () => {
    if (!user || !activeFile) {
      showToast('Select a file to propose a merge');
      return;
    }
    try {
      await proposeMerge(user.id, [activeFile], activeContent);
      setMergeOpen(true);
    } catch (err) {
      console.error("Failed to propose merge:", err);
      showToast('Failed to propose merge');
    }
  };

  const handleCreateSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const fullPath = creatingFileParent ? `${creatingFileParent}/${createValue}` : createValue;
      if (fullPath) {
        try {
          await createFile(fullPath);
          showToast("Created successfully");
        } catch(err: any) {
          showToast(err.message || 'Creation failed');
        }
      }
      setCreatingFileParent(null);
      setCreateValue("");
    } else if (e.key === "Escape") {
      setCreatingFileParent(null);
      setCreateValue("");
    }
  };

  const handleRenameSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && renamingPath) {
      if (renameValue) {
        const parentDir = renamingPath.substring(0, renamingPath.lastIndexOf('/'));
        const newFullPath = parentDir ? `${parentDir}/${renameValue}` : renameValue;
        try {
          await renameFile(renamingPath, newFullPath);
          showToast("Renamed successfully");
        } catch(err: any) {
          showToast(err.message || 'Rename failed');
        }
      }
      setRenamingPath(null);
    } else if (e.key === "Escape") {
      setRenamingPath(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if(confirm(`Are you sure you want to delete ${path}?`)) {
      try {
        await deleteFile(path);
        showToast("Deleted successfully");
        if (activeFile === path) openFile(''); // empty
      } catch(err: any) {
        showToast(err.message || 'Delete failed');
      }
    }
  };

  const toggleDir = (path: string) => {
    const next = new Set(expandedDirs);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedDirs(next);
  };

  const handleTabClose = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter(t => t !== path);
    setOpenTabs(nextTabs);
    if (nextTabs.length === 0) {
      openFile('');
    } else if (activeFile === path) {
      openFile(nextTabs[nextTabs.length - 1]!);
    }
  };

  const handleAISend = () => {
    if (!aiInput.trim()) return;
    setAiMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        senderInitials: userName.substring(0, 1).toUpperCase(),
        time: "just now",
        content: aiInput.trim(),
        reasoning: false,
        diff: false,
        isUser: true
      }
    ]);
    setAiInput("");
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      setAiMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "SYNQ AI",
          senderInitials: "S",
          time: "just now",
          content: "I have reviewed your request. I cannot make live changes yet without an active agent connection, but I'm ready for instructions.",
          reasoning: false,
          diff: false,
          isUser: false
        }
      ]);
    }, 1500);
  };

  const renderNodes = (nodes: FileNode[], depth: number) => {
    if (!nodes) return null;
    return nodes.map((n) => {
      const nodePath = n.path;
      if (!nodePath) return null;
      const pad = depth * 12 + 8;
      const key = Math.random().toString();
      
      const isRenaming = renamingPath === nodePath;

      if (n.type === "directory") {
        const isOpen = expandedDirs.has(nodePath);
        return (
          <React.Fragment key={key}>
            <div className={`ti group ${isOpen ? 'exp' : ''}`} style={{ paddingLeft: pad }} onClick={() => toggleDir(nodePath)}>
              <svg className="ch shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2l4 4-4 4" /></svg>
              <span className="fi shrink-0" style={{ fontSize: 12 }}>📁</span>
              
              {isRenaming ? (
                <input 
                  type="text" autoFocus
                  className="bg-[#0a0a0c] border border-blue-500/50 text-xs px-1 text-white outline-none w-full ml-1" 
                  value={renameValue} onChange={e => setRenameValue(e.target.value)} 
                  onKeyDown={handleRenameSubmit} onClick={e => e.stopPropagation()} onBlur={() => setRenamingPath(null)}
                />
              ) : (
                <span className="fn truncate flex-1">{n.name}</span>
              )}

              {!isRenaming && (
                <div className="hidden group-hover:flex ml-auto items-center gap-1.5 pr-2" onClick={e => e.stopPropagation()}>
                  <button title="New File" onClick={(e) => { e.stopPropagation(); setExpandedDirs(new Set(expandedDirs).add(nodePath)); setCreatingFileParent(nodePath); setCreateValue(""); }} className="hover:text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </button>
                  <button title="Rename" onClick={(e) => { e.stopPropagation(); setRenamingPath(nodePath); setRenameValue(n.name); }} className="hover:text-blue-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button title="Delete" onClick={(e) => handleDelete(e, nodePath)} className="hover:text-red-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              )}
            </div>
            <div className={`tc ${isOpen ? 'open' : ''}`}>
              {isOpen && creatingFileParent === nodePath && (
                <div className="ti" style={{ paddingLeft: pad + 20 }}>
                  <svg className="fi shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  <input 
                    type="text" autoFocus
                    className="bg-[#0a0a0c] border border-blue-500/50 text-xs px-1 text-white outline-none w-full ml-1" 
                    value={createValue} onChange={e => setCreateValue(e.target.value)} 
                    onKeyDown={handleCreateSubmit} onBlur={() => setCreatingFileParent(null)}
                  />
                </div>
              )}
              {isOpen && n.children && renderNodes(n.children, depth + 1)}
            </div>
          </React.Fragment>
        );
      } else {
        const isActive = nodePath === activeFile;
        return (
          <div key={key} className={`ti group ${isActive ? 'active' : ''}`} style={{ paddingLeft: pad + 14 }} onClick={() => openFile(nodePath)}>
            <span className="fi shrink-0" style={{ fontSize: 9, fontWeight: 800, color: getIconBg(n.name), fontFamily: "var(--font-brand)", letterSpacing: "-.3px" }}>{getIconChars(n.name)}</span>
            
            {isRenaming ? (
              <input 
                type="text" autoFocus
                className="bg-[#0a0a0c] border border-blue-500/50 text-xs px-1 text-white outline-none w-full ml-1 flex-1" 
                value={renameValue} onChange={e => setRenameValue(e.target.value)} 
                onKeyDown={handleRenameSubmit} onClick={e => e.stopPropagation()} onBlur={() => setRenamingPath(null)}
              />
            ) : (
              <span className="fn truncate flex-1">{n.name}</span>
            )}

            {!isRenaming && (
              <div className="hidden group-hover:flex ml-auto items-center gap-1.5 pr-2" onClick={e => e.stopPropagation()}>
                <button title="Rename" onClick={(e) => { e.stopPropagation(); setRenamingPath(nodePath); setRenameValue(n.name); }} className="hover:text-blue-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button title="Delete" onClick={(e) => handleDelete(e, nodePath)} className="hover:text-red-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            )}
          </div>
        );
      }
    });
  };

  useEffect(() => {
    const handleReopen = () => setIsTerminalVisible(true);
    window.addEventListener('inject-terminal-command', handleReopen);
    return () => window.removeEventListener('inject-terminal-command', handleReopen);
  }, []);

  return (
    <div className="ide-body fixed inset-0 w-screen h-screen z-0 overflow-hidden bg-[#0d1117]">
      {/* TITLEBAR */}
      <header className="titlebar shrink-0">
        <div className="tl-left">
          <div className="logo cursor-pointer" onClick={() => window.location.href='/dashboard'}>
            <div className="logo-icon">SQ</div>
            <span className="logo-text hidden sm:inline-block">SYNQ</span>
          </div>
          <div className="project-pill" onClick={() => showToast('View project settings')}>
            <span style={{ color: "var(--text-2)", fontSize: 11 }}>⎇</span>
            <span className="truncate max-w-[150px]">{params.id}</span>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l4 4 4-4" /></svg>
          </div>
          <div className="branch-chip hidden sm:flex">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z" /></svg>
            main
          </div>
        </div>
        <div className="tl-center hidden md:flex">
          <button className={`mode-btn ${currentMode === 'preview' ? 'active' : ''}`} onClick={() => setCurrentMode('preview')}>Preview</button>
          <button className={`mode-btn ${currentMode === 'design' ? 'active' : ''}`} onClick={() => setCurrentMode('design')}>Browser</button>
          <button className={`mode-btn ${currentMode === 'code' ? 'active' : ''}`} onClick={() => setCurrentMode('code')}>Code</button>
        </div>
        <div className="tl-right">
          <div className="team-stack mr-2 hidden lg:flex">
            {teammates.slice(0, 3).map(t => (
              <div key={t.id} className="t-av online border border-white/10" style={{ backgroundImage: `url(${t.avatarUrl})`, backgroundSize: 'cover' }} title={t.name} />
            ))}
            {teammates.length > 3 && (
              <div className="t-av" style={{ background: "var(--bg-elevated)", color: "var(--text-2)", fontSize: 9, fontWeight: 600, border: "1px solid var(--border)" }} title={`${teammates.length - 3} more`}>+{teammates.length - 3}</div>
            )}
          </div>
          <button className="vote-chip mr-2 shrink-0" onClick={handleProposeMerge} disabled={isProposing}>
            <div className="v-pulse"></div>
            {isProposing ? 'Proposing...' : 'Propose Merge'}
          </button>
          <div className="hidden lg:block shrink-0"><InviteButton projectId={params.id} /></div>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="workspace min-h-0 flex-1">
        {/* ICON RAIL */}
        <div className="rail hidden sm:flex shrink-0">
          <button className={`rail-btn ${activePanel === 'explorer' ? 'active' : ''}`} title="Explorer" onClick={() => setActivePanel(activePanel === 'explorer' ? null : 'explorer')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
          </button>
          <button className={`rail-btn ${activePanel === 'layout' ? 'active' : ''}`} title="Layout" onClick={() => setActivePanel(activePanel === 'layout' ? null : 'layout')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>
          </button>
          <button className={`rail-btn ${activePanel === 'git' ? 'active' : ''}`} title="Source Control" onClick={() => setActivePanel(activePanel === 'git' ? null : 'git')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 8v8M6 8c3 0 5-1 6-3m6 4c-3 0-5-1-6-3" /></svg>
           </button>
          <button className={`rail-btn ${isTerminalVisible ? 'active text-white' : ''}`} title="Terminal" onClick={() => setIsTerminalVisible(!isTerminalVisible)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
          </button>
          <div className="rail-spacer"></div>
          <button className={`rail-btn ${aiOpen ? 'active text-white' : ''}`} title="SYNQ AI" onClick={() => setAiOpen(!aiOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          </button>
          <button className={`rail-btn ${activePanel === 'settings' ? 'active' : ''}`} title="Settings" onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          </button>
        </div>

        {/* SIDEBAR */}
        <aside className="sidebar shrink-0 flex flex-col min-h-0" style={{ display: activePanel ? "flex" : "none" }}>
          {activePanel === 'explorer' && (
            <>
              <div className="sb-head shrink-0 flex items-center justify-between group">
                <span>Explorer</span>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="sb-search hover:text-white" title="New File" onClick={() => { setCreatingFileParent(""); setCreateValue(""); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </button>
                  <button className="sb-search hover:text-white" title="New Folder" onClick={() => { setCreatingFileParent(""); setCreateValue(""); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                  </button>
                </div>
              </div>
              <div className="file-tree flex-1 overflow-y-auto mb-2 relative">
                {creatingFileParent === "" && (
                  <div className="ti" style={{ paddingLeft: 8 }}>
                    <svg className="fi shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    <input 
                      type="text" autoFocus
                      className="bg-[#0a0a0c] border border-blue-500/50 text-xs px-1 text-white outline-none w-full ml-1" 
                      value={createValue} onChange={e => setCreateValue(e.target.value)} 
                      onKeyDown={handleCreateSubmit} onBlur={() => setCreatingFileParent(null)}
                    />
                  </div>
                )}
                {treeLoading ? (
                  <div className="p-4 text-xs text-zinc-500 animate-pulse">Loading container...</div>
                ) : (
                  renderNodes(tree, 0)
                )}
              </div>
              
              {/* TEAMMATES SECTION */}
              <div className="shrink-0 flex flex-col min-h-0 border-t border-white/5 pb-2">
                <div className="sb-head text-[10px] text-zinc-500 font-semibold tracking-wider uppercase pt-4 pb-2 px-3">
                  Teammates & Guests
                </div>
                <div className="px-2 space-y-0.5 max-h-[120px] overflow-y-auto">
                  {/* Filter out duplicates by name between DB teammates and Live Presence */}
                  {(() => {
                    const uniqueNames = new Set<string>();
                    const members: React.ReactNode[] = [];
                    
                    // Render DB Teammates
                    teammates.forEach(t => {
                      const isOnline = activePresence.some(p => p.user?.name === t.name);
                      uniqueNames.add(t.name);
                      members.push(
                        <div key={t.id} className="flex items-center gap-2 group hover:bg-white/5 px-2 py-1.5 rounded-lg cursor-pointer">
                          <div className="relative shrink-0">
                            <div className="w-5 h-5 rounded-full bg-zinc-800" style={{ backgroundImage: `url(${t.avatarUrl})`, backgroundSize: 'cover' }}></div>
                            <div className={`absolute -bottom-0.5 right-0 w-2 h-2 rounded-full border border-[#010409] ${isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                          </div>
                          <span className="text-xs text-zinc-400 group-hover:text-zinc-200 truncate flex-1">{t.name}</span>
                          {t.role === 'owner' && <span className="text-[9px] text-rose-400/80 uppercase tracking-widest">Admin</span>}
                        </div>
                      );
                    });

                    // Render Active External Guests
                    activePresence.forEach((p, idx) => {
                      if (p.user?.name && !uniqueNames.has(p.user.name)) {
                        uniqueNames.add(p.user.name);
                        members.push(
                           <div key={`guest-${idx}`} className="flex items-center gap-2 group hover:bg-white/5 px-2 py-1.5 rounded-lg cursor-pointer relative overflow-hidden">
                             <div className="relative shrink-0 z-10">
                               <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white/90 shadow-sm" style={{ backgroundColor: p.user.color || '#6366f1' }}>
                                 {p.user.name.charAt(0).toUpperCase()}
                               </div>
                               <div className="absolute -bottom-0.5 right-0 w-2 h-2 rounded-full border border-[#010409] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                             </div>
                             <span className="text-xs text-white/90 font-medium truncate flex-1 z-10 drop-shadow-sm">{p.user.name}</span>
                             <span className="text-[9px] text-emerald-400/90 font-bold uppercase tracking-widest z-10">Live</span>
                             <div className="absolute inset-0 opacity-10 blur-xl" style={{ backgroundColor: p.user.color || '#6366f1' }}></div>
                           </div>
                        );
                      }
                    });

                    return members.length > 0 ? members : (
                      <div className="px-2 py-2 text-[11px] text-zinc-600 italic">No teammates yet</div>
                    );
                  })()}
                </div>
              </div>

              {/* Integrated Voice Room at bottom of sidebar matching UnifiedSidebar */}
              <div className="shrink-0 border-t border-white/5 bg-[#010409]">
                 <VoiceRoom 
                   projectId={params.id} 
                   userName={userName} 
                   livekitUrl={livekitUrl} 
                 />
              </div>
            </>
          )}

          {activePanel === 'layout' && (
            <div className="flex-1 p-4 text-xs text-zinc-400 flex flex-col gap-4">
              <div className="sb-head mb-2 text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">View Layout</div>
              
              <div className="flex justify-between items-center group">
                <span>Terminal Panel</span>
                <button onClick={() => setIsTerminalVisible(!isTerminalVisible)} className={`px-2 py-1 rounded ${isTerminalVisible ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-500'} hover:bg-white/10 transition-colors`}>
                  {isTerminalVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <div className="flex justify-between items-center group">
                <span>AI Assistant</span>
                <button onClick={() => setAiOpen(!aiOpen)} className={`px-2 py-1 rounded ${aiOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-500'} hover:bg-white/10 transition-colors`}>
                  {aiOpen ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <div className="flex justify-between items-center group">
                <span>Multi-Cursor Mode</span>
                <button className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">Enabled</button>
              </div>
            </div>
          )}
          
          {activePanel === 'git' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <svg className="w-8 h-8 text-zinc-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 8v8M6 8c3 0 5-1 6-3m6 4c-3 0-5-1-6-3" /></svg>
              <span className="text-xs text-zinc-400 mb-4">No uncommitted changes in this branch</span>
              <button className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-md transition-colors" onClick={() => setMergeOpen(true)}>Propose Merge</button>
            </div>
          )}

          {activePanel === 'settings' && (
            <div className="flex-1 p-4 text-xs text-zinc-400 flex flex-col gap-5 overflow-y-auto">
              <div>
                <div className="sb-head mb-3 text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Editor Settings</div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-500 text-[11px]">Theme</label>
                    <select className="bg-[#0a0a0c] border border-white/10 rounded px-2 py-1.5 text-white outline-none focus:border-indigo-500/50">
                      <option>SYNQ Dark (Default)</option>
                      <option>GitHub Dark</option>
                      <option>High Contrast</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-500 text-[11px]">Font Size</label>
                    <div className="flex items-center gap-2">
                       <input type="number" defaultValue={13} className="bg-[#0a0a0c] border border-white/10 rounded px-2 py-1 w-16 text-white outline-none focus:border-indigo-500/50" />
                       <span className="text-zinc-600">px</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="sb-head mb-3 text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Danger Zone</div>
                <div className="p-3 border border-rose-500/20 rounded-md bg-rose-500/5">
                  <p className="text-zinc-400 mb-3 leading-relaxed">Permanently delete this sandbox and all its contents. This cannot be undone.</p>
                  <button className="w-full py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded transition-colors" onClick={() => showToast('Only owners can delete sandboxes.')}>
                    Delete Sandbox
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* EDITOR AREA */}
        <main className="editor-area min-w-0 flex-1 relative bg-[#050505]">
          {/* TAB BAR */}
          <div className="tab-bar shrink-0">
            {openTabs.map(f => {
              const name = f.split('/').pop() || f;
              const isActive = f === activeFile;
              return (
                <div key={f} className={`tab ${isActive ? 'active' : ''}`} onClick={() => openFile(f)}>
                  <span className="tab-icon" style={{ background: getIconBg(name), color: "white", fontSize: 8, fontWeight: 800, fontFamily: "var(--font-brand)" }}>{getIconChars(name)}</span>
                  <span className="truncate max-w-[120px]">{name}</span>
                  <span className="tab-close" onClick={(e) => handleTabClose(e, f)}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 2l6 6M8 2l-6 6" /></svg>
                  </span>
                </div>
              );
            })}
            <div className="tab-add" onClick={() => showToast('New file...')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
            <div className="tab-toolbar hidden md:flex">
              <button className="tb-icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg></button>
              <button className="tb-icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98" /></svg></button>
            </div>
          </div>

          {/* CODE VIEW (Uses the real EditorCanvas component now) */}
          <div className="editor-content flex-1 min-h-0 relative z-0" style={{ display: currentMode === 'code' ? 'flex' : 'none' }}>
            <EditorCanvas 
              activeFile={activeFile || ''} 
              projectId={params.id}
              currentUser={user}
              initialContent={activeContent}
            />
            {loading && (
               <div className="absolute inset-0 bg-[#050505]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
               </div>
            )}
          </div>

          {/* APP BROWSER PREVIEW (Fallback for design/preview modes) */}
          <div className={`preview-view flex flex-col flex-1 h-full min-h-0 ${currentMode === 'preview' || currentMode === 'design' ? 'active' : ''}`}>
            {currentMode !== 'code' && (
              <>
                <div className="preview-bar shrink-0">
                  <div className="pv-dots hidden sm:flex">
                    <div className="pv-dot" style={{ background: "#f85149" }}></div>
                    <div className="pv-dot" style={{ background: "#d29922" }}></div>
                    <div className="pv-dot" style={{ background: "#3fb950" }}></div>
                  </div>
                  <div className="pv-url truncate text-xs mx-auto max-w-[200px] sm:max-w-md">https://{params.id}-app.synq.dev</div>
                  <button className="text-zinc-400 hover:text-white" onClick={() => showToast('Refreshed')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                  </button>
                </div>
                <div className="pv-frame flex-1 bg-zinc-900 border border-t-0 p-4 border-white/5 overflow-auto relative">
                   <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-mono text-sm tracking-wider uppercase flex-col gap-4">
                     <svg className="w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                     Preview Server Not Connected
                   </div>
                </div>
              </>
            )}
          </div>

          {/* STATUS BAR */}
          <div className="status-bar shrink-0">
            <div className="st-item st-branch">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z" /></svg>
              main
            </div>
            <div className="st-item hidden sm:flex">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              0
            </div>
            <div className="st-item st-collab hidden md:flex">
               <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 11l2 2 4-4" /></svg>
               {teammates.length}
            </div>
            <div className="st-right hidden sm:flex">
              <div className="st-item st-lang">{activeFile?.split('.').pop()?.toUpperCase() || 'TXT'}</div>
              <div className="st-item">UTF-8</div>
              <div className="st-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                Yjs Live
              </div>
            </div>
          </div>
          
          {/* Real Floating Terminal integrated here */}
          <FloatingTerminal 
            projectId={params.id} 
            isVisible={isTerminalVisible}
            onClose={() => setIsTerminalVisible(false)}
          />
        </main>

        {/* AI PANEL */}
        <aside className={`ai-panel shrink-0 ${aiOpen ? 'flex' : 'hidden'} flex-col`}>
          <div className="ai-ph flex items-center justify-between">
            <div className="ai-title flex items-center">
              <div className="ai-dot"></div>
              AI Assistance
            </div>
            <div className="flex items-center gap-2">
              <button className="ai-chat-btn" onClick={() => showToast('Chat activated')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                Chat
              </button>
              <button className="p-1 hover:text-white text-zinc-500 transition-colors" title="Close AI Panel" onClick={() => setAiOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
          <div className="ai-body">
            {activeFile && (
              <div className="ctx-card">
                <div className="ctx-icon">📦</div>
                <div className="ctx-info">
                  <div className="ctx-name truncate max-w-[200px]">{activeFile}</div>
                  <div className="ctx-meta">Active Context</div>
                </div>
              </div>
            )}

            {aiMessages.map(msg => (
              <div key={msg.id} className="ai-msg" style={msg.isUser ? { background: 'rgba(88,166,255,.06)', border: '1px solid rgba(88,166,255,.15)' } : {}}>
                <div className="ai-msg-hd">
                  <div className="ai-av" style={msg.isUser ? { background: 'var(--team-rk)' } : {}}>{msg.senderInitials}</div>
                  <span className="ai-name flex-1" style={msg.isUser ? { color: 'var(--text-2)' } : {}}>{msg.sender}</span>
                  <span className="ai-time whitespace-nowrap">{msg.time}</span>
                </div>
                <div className="ai-msg-body break-words" dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}

            {aiTyping && (
              <div className="ai-msg">
                <div className="ai-msg-hd">
                  <div className="ai-av">S</div>
                  <span className="ai-name">SYNQ AI</span>
                  <span className="ai-time">typing...</span>
                </div>
                <div className="typing-ind"><span></span><span></span><span></span></div>
              </div>
            )}
            
          </div>

          <div className="ai-input-area">
            <div className="ai-iw">
              <textarea 
                className="ai-inp" 
                rows={1} 
                placeholder="Ask about this project..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { 
                  if(e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleAISend(); 
                  } 
                }}
              />
              <div className="ai-btns">
                <button className="ai-ib" title="Voice input">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
                </button>
                <button className="builder-btn hidden 2xl:flex">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
                  Builder
                </button>
                <button className="send-btn" onClick={handleAISend}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <MergeModal 
        isOpen={mergeOpen} 
        onClose={() => setMergeOpen(false)} 
        teammates={teammates} 
        projectId={params.id} 
      />

      <div className={`toast ${toastVisible ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
