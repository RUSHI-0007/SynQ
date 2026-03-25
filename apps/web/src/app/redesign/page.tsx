"use client";

import React, { useState, useEffect, useRef } from "react";
import './redesign.css';
import { FILES, TREE, TreeNodeType, getIconBg } from "./data";
import hljs from "highlight.js";

// Helper for highlighting code
function HighlightedCode({ code, language }: { code: string; language: string }) {
  const codeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (codeRef.current) {
      delete codeRef.current.dataset.highlighted;
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);
  return (
    <pre className="cd">
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
}

export default function RedesignPage() {
  const [currentFile, setCurrentFile] = useState<string>("Editor.tsx");
  const [currentMode, setCurrentMode] = useState<"code" | "design" | "preview">("code");
  const [openTabs, setOpenTabs] = useState<string[]>(["Editor.tsx", "useCollab.ts", "package.json"]);
  
  // File Tree State
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["src", "components", "hooks"]));

  // UI States
  const [panelOpen, setPanelOpen] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  
  // Vote Modal State
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [voteApproved, setVoteApproved] = useState(false);

  // Editor State
  const [codeValue, setCodeValue] = useState(FILES[currentFile]?.code || "");
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [scrollPos, setScrollPos] = useState(0);

  // AI Chat State
  const [aiTyping, setAiTyping] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      id: "1",
      sender: "SYNQ AI",
      senderInitials: "S",
      time: "just now",
      content: `I've analyzed your <code>CollabEditor</code> component. The Yjs CRDT integration looks solid — syncing awareness through <code>useTeamAwareness</code> is the right pattern. I found a potential issue with the vote threshold logic.`,
      reasoning: true,
      diff: true,
    }
  ]);
  const [diffDismissed, setDiffDismissed] = useState(false);
  const [diffApplied, setDiffApplied] = useState(false);

  // Update code when file changes
  useEffect(() => {
    const freshCode = FILES[currentFile]?.code || "";
    setCodeValue(freshCode);
  }, [currentFile]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const toggleDir = (name: string) => {
    const next = new Set(expandedDirs);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedDirs(next);
  };

  const openFile = (name: string) => {
    if (!openTabs.includes(name)) {
      setOpenTabs([...openTabs, name]);
    }
    setCurrentFile(name);
  };

  const closeTab = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter(t => t !== name);
    setOpenTabs(nextTabs);
    if (nextTabs.length === 0) {
      setCurrentFile("");
    } else if (currentFile === name) {
      setCurrentFile(nextTabs[nextTabs.length - 1]);
    }
  };

  const handleCodeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeValue(e.target.value);
    updateCursor(e.target);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target as HTMLTextAreaElement;
      const s = ta.selectionStart;
      const v = ta.value;
      const newV = v.substring(0, s) + "  " + v.substring(ta.selectionEnd);
      setCodeValue(newV);
      // Wait for react render then set selection
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
        updateCursor(ta);
      }, 0);
    }
  };

  const updateCursor = (ta: HTMLTextAreaElement) => {
    const s = ta.selectionStart;
    const lines = ta.value.substring(0, s).split("\
");
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ ln, col });
  };

  // --- Render File Tree Recursively ---
  const renderNodes = (nodes: TreeNodeType[], depth: number) => {
    return nodes.map((n) => {
      const pad = depth * 12 + 8;
      const key = n.name + depth;
      if (n.type === "dir") {
        const isOpen = expandedDirs.has(n.name);
        return (
          <React.Fragment key={key}>
            <div className={`ti ${isOpen ? 'exp' : ''}`} style={{ paddingLeft: pad }} onClick={() => toggleDir(n.name)}>
              <svg className="ch" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2l4 4-4 4" /></svg>
              <span className="fi" style={{ fontSize: 12 }}>{n.icon || '📁'}</span>
              <span className="fn">{n.name}</span>
            </div>
            <div className={`tc ${isOpen ? 'open' : ''}`}>
              {n.children && renderNodes(n.children, depth + 1)}
            </div>
          </React.Fragment>
        );
      } else {
        const isActive = n.name === currentFile;
        const col = n.color || "var(--text-2)";
        return (
          <div key={key} className={`ti ${isActive ? 'active' : ''}`} style={{ paddingLeft: pad + 14 }} onClick={() => openFile(n.name)}>
            <span className="fi" style={{ fontSize: 9, fontWeight: 800, color: col, fontFamily: "var(--font-brand)", letterSpacing: "-.3px" }}>{n.icon || '◌'}</span>
            <span className="fn">{n.name}</span>
          </div>
        );
      }
    });
  };

  // Sync scrolling for code area
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollPos((e.target as HTMLTextAreaElement).scrollTop);
  };

  const activeLang = FILES[currentFile]?.lang || "plaintext";
  const numLines = codeValue.split("\
").length;

  const handleAISend = () => {
    if (!aiInput.trim()) return;
    setAiMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        senderInitials: "RK",
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
          content: `I've reviewed the code. The <code>VOTE_THRESHOLD</code> check is the primary concern — the fix ensures we only count online teammates in the denominator, preventing premature merges during partial outages. The diff above shows the corrected version. <b>Ready to apply when you approve.</b>`,
          reasoning: false,
          diff: false,
        }
      ]);
    }, 2200);
  };

  const applyDiff = () => {
    setDiffDismissed(true);
    setDiffApplied(true);
    showToast("Fix applied successfully!");
    const fixed = codeValue.replace(
      'const approvalRate = result.approvals / result.total;',
      'const eligibleVoters = teammates.filter(t => t.isOnline);\
  const approvalRate = result.approvals / eligibleVoters.length;'
    ).replace(
      'if (approvalRate >= VOTE_THRESHOLD) {',
      'if (approvalRate >= VOTE_THRESHOLD && eligibleVoters.length > 0) {'
    ).replace(
      'await triggerConsensusMerge(pendingMerge, branch);',
      'await consensusMerge({ proposal: pendingMerge, branch });'
    );
    setCodeValue(fixed);
  };

  const castVote = (type: string) => {
    setVoteModalOpen(false);
    if (type === "approve") {
      setVoteApproved(true);
      showToast("Vote cast: ✓ Approved! Waiting for team...");
    } else {
      showToast("Requested changes — merge blocked");
    }
  };

  // Team cursors animation
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const int = setInterval(() => setFrame(f => (f + 1) % 5), 1800);
    return () => clearInterval(int);
  }, []);
  const curAmTops = [270,300,320,290,270];
  const curAmLefts = [236,248,220,236,236];
  const curSkTops = [406,420,390,410,406];
  const curSkLefts = [180,200,160,180,180];

  return (
    <div id="app" className="ide-app">
      {/* TITLEBAR */}
      <header className="titlebar">
        <div className="tl-left">
          <div className="logo cursor-pointer">
            <div className="logo-icon">SQ</div>
            <span className="logo-text">SYNQ</span>
          </div>
          <div className="project-pill" onClick={() => showToast('Switch project')}>
            <span style={{ color: "var(--text-2)", fontSize: 11 }}>⎇</span>
            <span>Hackathon Sprint — 2025</span>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l4 4 4-4" /></svg>
          </div>
          <div className="branch-chip">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z" /></svg>
            main
          </div>
        </div>
        <div className="tl-center">
          <button className={`mode-btn ${currentMode === 'preview' ? 'active' : ''}`} onClick={() => setCurrentMode('preview')}>Preview</button>
          <button className={`mode-btn ${currentMode === 'design' ? 'active' : ''}`} onClick={() => setCurrentMode('design')}>Design</button>
          <button className={`mode-btn ${currentMode === 'code' ? 'active' : ''}`} onClick={() => setCurrentMode('code')}>Code</button>
        </div>
        <div className="tl-right">
          <div className="team-stack">
            <div className="t-av online" style={{ background: "var(--team-rk)" }} title="rushi.k — Online">RK</div>
            <div className="t-av online" style={{ background: "var(--team-am)" }} title="ayaan.m — Online">AM</div>
            <div className="t-av online" style={{ background: "var(--team-sk)" }} title="shruti.k — Reviewing">SK</div>
            <div className="t-av" style={{ background: "var(--bg-elevated)", color: "var(--text-2)", fontSize: 9, fontWeight: 600, border: "1px solid var(--border)" }} title="2 more">+2</div>
          </div>
          <button className="vote-chip" onClick={() => setVoteModalOpen(true)}>
            <div className="v-pulse"></div>
            ⚖ Consensus Vote
            <span className="vote-count">{voteApproved ? '2/3' : '1/3'}</span>
          </button>
          <button className="invite-btn" onClick={() => showToast('Invite copied to clipboard!')}>Invite</button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="workspace">
        {/* ICON RAIL */}
        <div className="rail">
          <button className="rail-btn active" title="Explorer" onClick={() => showToast('Explorer')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
          </button>
          <button className="rail-btn" title="Extensions" onClick={() => showToast('Extensions')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
          </button>
          <button className="rail-btn" title="Source Control" onClick={() => showToast('Git: 3 changes staged')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 8v8M6 8c3 0 5-1 6-3m6 4c-3 0-5-1-6-3" /></svg>
          </button>
          <button className="rail-btn" title="Voice Chat" onClick={() => showToast('LiveKit voice: 2 active')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
          </button>
          <button className="rail-btn" title="Terminal" onClick={() => showToast('Terminal: /app · node:20')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 9l4 3-4 3M13 15h4" /></svg>
          </button>
          <div className="rail-spacer"></div>
          <button className="rail-btn crown" title="Pro Plan" onClick={() => showToast('SYNQ Pro — Active')}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 19l2-9 5 4 3-7 3 7 5-4 2 9H2z" /></svg>
          </button>
          <button className="rail-btn" title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          </button>
          <button className="rail-btn" title="Toggle Panel" onClick={() => setPanelOpen(!panelOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>
          </button>
        </div>

        {/* SIDEBAR */}
        <aside className="sidebar" style={{ display: panelOpen ? "flex" : "none" }}>
          <div className="sb-head">
            Explorer
            <button className="sb-search" onClick={() => showToast('Search files...')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </button>
          </div>
          <div className="file-tree">
            {renderNodes(TREE, 0)}
          </div>
        </aside>

        {/* EDITOR AREA */}
        <main className="editor-area">
          {/* TAB BAR */}
          <div className="tab-bar">
            {openTabs.map(f => (
              <div key={f} className={`tab ${f === currentFile ? 'active' : ''}`} onClick={() => openFile(f)}>
                <span className="tab-icon" style={{ background: getIconBg(f), color: "white", fontSize: 8, fontWeight: 800, fontFamily: "var(--font-brand)" }}>{FILES[f]?.icon || '◌'}</span>
                {f}
                <span className="tab-close" onClick={(e) => closeTab(e, f)}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 2l6 6M8 2l-6 6" /></svg>
                </span>
              </div>
            ))}
            <div className="tab-add" onClick={() => showToast('New file...')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
            <div className="tab-toolbar">
              <div className="zoom-ctl">88%<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 10, height: 10 }}><path d="M2 4l4 4 4-4" /></svg></div>
              <button className="tb-icon-btn" onClick={() => showToast('Copied!')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg></button>
              <button className="tb-icon-btn" onClick={() => showToast('Share link copied!')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" /></svg></button>
            </div>
          </div>

          {/* CODE VIEW */}
          <div className="editor-content" style={{ display: currentMode === 'code' ? 'flex' : 'none' }}>
            <div className="line-nums" style={{ transform: `translateY(-${scrollPos}px)` }}>
              {Array.from({ length: numLines || 1 }).map((_, i) => (
                <span key={i} className={i + 1 === cursorPos.ln ? "al" : ""}>{i + 1}</span>
              ))}
            </div>
            <div className="code-wrap" onScroll={handleScroll}>
              <HighlightedCode code={codeValue} language={activeLang} />
              <textarea
                className="ci"
                spellCheck="false"
                value={codeValue}
                onChange={handleCodeInput}
                onKeyDown={handleKey}
                onClick={(e) => updateCursor(e.target as HTMLTextAreaElement)}
              />
              {/* Team cursors (mock active file Editor.tsx) */}
              {currentFile === "Editor.tsx" && currentMode === "code" && (
                <>
                  <div className="tcursor" style={{ height: 20, top: curAmTops[frame], left: curAmLefts[frame], background: "var(--team-am)", transition: 'top .6s ease, left .6s ease' }}>
                    <div className="tcursor-lbl" style={{ background: "var(--team-am)", color: "white" }}>ayaan.m</div>
                  </div>
                  <div className="tcursor" style={{ height: 20, top: curSkTops[frame], left: curSkLefts[frame], background: "var(--team-sk)", transition: 'top .6s ease, left .6s ease' }}>
                    <div className="tcursor-lbl" style={{ background: "var(--team-sk)", color: "#010409" }}>shruti.k</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DESIGN VIEW */}
          <div className={`design-view ${currentMode === 'design' ? 'active' : ''}`}>
            {currentMode === 'design' && (
              <>
                <div className="design-section-label">Section</div>
                <div className="design-canvas">
                  <div style={{ width: "100%", background: "#0a0f0a", minHeight: "100%", fontFamily: "'Syne',sans-serif", padding: 0 }}>
                    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#39d353,#58a6ff)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#010409" }}>SQ</div>
                        <span style={{ color: "white", fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>SYNQ</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ padding: "6px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, color: "rgba(255,255,255,.7)", fontSize: 12, cursor: "pointer" }}>Features</button>
                        <button style={{ padding: "6px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, color: "rgba(255,255,255,.7)", fontSize: 12, cursor: "pointer" }}>Platform</button>
                        <button style={{ padding: "6px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, color: "rgba(255,255,255,.7)", fontSize: 12, cursor: "pointer" }}>Pricing</button>
                      </div>
                      <button style={{ padding: "8px 18px", background: "linear-gradient(135deg,#39d353,#3fb950)", border: "none", borderRadius: 8, color: "#010409", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Get Early Access</button>
                    </nav>
                    <div style={{ textAlign: "center", padding: "48px 40px 40px", background: "radial-gradient(ellipse at 50% 0%,rgba(57,211,83,.12) 0%,transparent 65%)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(57,211,83,.1)", border: "1px solid rgba(57,211,83,.25)", borderRadius: 20, fontSize: 11, color: "#39d353", marginBottom: 20 }}>⚡ Yjs real-time sync v2.0 now live</div>
                      <h1 style={{ fontSize: 36, fontWeight: 800, color: "white", lineHeight: 1.18, marginBottom: 14, letterSpacing: "-0.5px" }}>The only IDE where<br /><span style={{ background: "linear-gradient(135deg,#39d353,#58a6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>your team votes</span><br />before anything ships.</h1>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.65, maxWidth: 440, margin: "0 auto 28px" }}>No more 'works on my machine.' No more rogue commits. Your whole team in one sandbox, shipping together.</p>
                      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                        <button style={{ padding: "11px 22px", background: "linear-gradient(135deg,#39d353,#3fb950)", border: "none", borderRadius: 8, color: "#010409", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Start a Sandbox →</button>
                        <button style={{ padding: "11px 22px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "rgba(255,255,255,.8)", fontSize: 13, cursor: "pointer" }}>See how it works ↓</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* PREVIEW VIEW */}
          <div className={`preview-view ${currentMode === 'preview' ? 'active' : ''}`}>
            {currentMode === 'preview' && (
              <>
                <div className="preview-bar">
                  <div className="pv-dots">
                    <div className="pv-dot" style={{ background: "#f85149" }}></div>
                    <div className="pv-dot" style={{ background: "#d29922" }}></div>
                    <div className="pv-dot" style={{ background: "#3fb950" }}></div>
                  </div>
                  <div className="pv-url">http://localhost:3000 — synq-collab</div>
                  <button style={{ background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} onClick={() => showToast('Refreshed')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                  </button>
                </div>
                <div className="pv-frame">
                  <div style={{ width: "100%", maxWidth: 900, background: "#0a0f0a", borderRadius: 12, border: "1px solid #30363d", overflow: "hidden", minHeight: 460, fontFamily: "'Syne',sans-serif" }}>
                    <div style={{ background: "#010409", padding: "10px 20px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f85149" }}></div><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d29922" }}></div><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3fb950" }}></div></div>
                      <span style={{ fontSize: 11, color: "#8b949e", fontFamily: "'JetBrains Mono',monospace" }}>localhost:3000</span>
                    </div>
                    <div style={{ padding: 32, color: "white", textAlign: "center", background: "radial-gradient(ellipse at center top,rgba(57,211,83,.1),transparent 60%)" }}>
                      <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>The only IDE where<br /><span style={{ background: "linear-gradient(135deg,#39d353,#58a6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>your team votes</span><br />before anything ships.</div>
                      <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, margin: "12px 0 22px" }}>No rogue commits. Ship only when everyone approves.</p>
                      <button style={{ padding: "11px 24px", background: "linear-gradient(135deg,#39d353,#3fb950)", border: "none", borderRadius: 8, color: "#010409", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Start a Sandbox →</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* STATUS BAR */}
          <div className="status-bar">
            <div className="st-item st-branch">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z" /></svg>
              main
            </div>
            <div className="st-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              3 changes
            </div>
            <div className="st-item" style={{ color: "var(--accent-red)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              0 errors
            </div>
            <div className="st-item st-collab">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 11l2 2 4-4" /></svg>
              3 collaborating
            </div>
            <div className="st-item" style={{ color: "var(--accent-synq)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
              Voice: 2 active
            </div>
            <div className="st-right">
              <div className="st-item">Ln {cursorPos.ln}, Col {cursorPos.col}</div>
              <div className="st-item st-lang">TypeScript</div>
              <div className="st-item">UTF-8</div>
              <div className="st-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                Synced
              </div>
            </div>
          </div>
        </main>

        {/* AI PANEL */}
        <aside className="ai-panel">
          <div className="ai-ph">
            <div className="ai-title">
              <div className="ai-dot"></div>
              AI Assistance
            </div>
            <button className="ai-chat-btn" onClick={() => showToast('Chat mode activated')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              Chat
            </button>
          </div>
          <div className="ai-body">
            {/* Context card */}
            <div className="ctx-card">
              <div className="ctx-icon">📦</div>
              <div className="ctx-info">
                <div className="ctx-name">synq-collab / Editor.tsx</div>
                <div className="ctx-meta">Active file · 847 tokens</div>
              </div>
            </div>

            {aiMessages.map(msg => (
              <div key={msg.id} className="ai-msg" style={msg.isUser ? { background: 'rgba(88,166,255,.06)', border: '1px solid rgba(88,166,255,.15)' } : {}}>
                <div className="ai-msg-hd">
                  <div className="ai-av" style={msg.isUser ? { background: 'var(--team-rk)' } : {}}>{msg.senderInitials}</div>
                  <span className="ai-name" style={msg.isUser ? { color: 'var(--text-2)' } : {}}>{msg.sender}</span>
                  <span className="ai-time">{msg.time}</span>
                </div>
                <div className="ai-msg-body" dangerouslySetInnerHTML={{ __html: msg.content }} />
                {msg.reasoning && (
                  <div className="rsn-block">
                    <div className="rsn-toggle open">
                      <svg className="rch" style={{ transform: 'rotate(180deg)' }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l4 4 4-4" /></svg>
                      Reasoning
                    </div>
                    <div className="rsn-body open">
                      <div className="rsn-section">Code Analysis</div>
                      <div className="rsn-item"><div className="rsn-dot"></div><span><b>Line 34:</b> <code>VOTE_THRESHOLD</code> is checked after each individual vote, but <code>result.total</code> may not include offline members — causing premature merges</span></div>
                      <div className="rsn-item"><div className="rsn-dot"></div><span>The <code>removeAllListeners</code> cleanup in useEffect is too broad — it'll remove listeners from other components sharing the same provider</span></div>
                      <div className="rsn-item"><div className="rsn-dot"></div><span><code>triggerConsensusMerge</code> is called but not imported or defined in scope — this will throw at runtime</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!diffApplied && aiMessages.length === 1 && (
              <div className="qa-wrap">
                <button className="qa-btn" onClick={() => { showToast('Analyzing...'); setAiTyping(true); setTimeout(() => setAiTyping(false), 1500); }}>Explain this code</button>
                <button className="qa-btn" onClick={() => { showToast('Scanning...'); setAiTyping(true); setTimeout(() => setAiTyping(false), 1500); }}>Optimize performance</button>
                <button className="qa-btn" onClick={() => { showToast('Running detection...'); setAiTyping(true); setTimeout(() => setAiTyping(false), 1500); }}>Error fixing</button>
              </div>
            )}

            {!diffDismissed && aiMessages.length === 1 && (
               <div className="diff-wrap" style={{ opacity: 1 }}>
                <div className="diff-hd before">
                  <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
                  Before
                </div>
                <div className="diff-code">
                  {'const approvalRate = result.approvals / result.total;\
\
if (approvalRate >= VOTE_THRESHOLD) {\
  await triggerConsensusMerge(pendingMerge, branch);\
}'}
                </div>
                <div className="diff-hd after">
                  <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
                  After
                </div>
                <div className="diff-code" style={{ color: "rgba(63,185,80,.85)" }}>
                  {'const eligibleVoters = teammates.filter(t => t.isOnline);\
const approvalRate = result.approvals / eligibleVoters.length;\
\
if (approvalRate >= VOTE_THRESHOLD && eligibleVoters.length > 0) {\
  await consensusMerge({ proposal: pendingMerge, branch });\
}'}
                </div>
                <div className="diff-actions">
                  <button className="da-btn explain" onClick={() => showToast('Explaining the fix...')}>Explain</button>
                  <button className="da-btn cancel" onClick={() => setDiffDismissed(true)}>✕ Cancel</button>
                  <button className="da-btn apply" onClick={applyDiff}>✓ Apply</button>
                </div>
              </div>
            )}

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

          {/* AI Input */}
          <div className="ai-input-area">
            <div className="ai-iw">
              <textarea 
                className="ai-inp" 
                rows={1} 
                placeholder="Ask a follow-up..."
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
                <button className="ai-ib" title="Attach file" onClick={() => showToast('Attach a file or context')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                </button>
                <button className="ai-ib" title="Voice input" onClick={() => showToast('Voice: Listening...')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
                </button>
                <button className="builder-btn" onClick={() => showToast('Builder mode: AI builds from scratch')}>
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

      {/* VOTE MODAL */}
      {voteModalOpen && (
        <div className="modal-ov active" onClick={() => setVoteModalOpen(false)}>
          <div className="vote-modal" onClick={e => e.stopPropagation()}>
            <div className="vm-hd">
              <div className="vm-icon">⚖️</div>
              <div>
                <div className="vm-title">Consensus Vote Required</div>
                <div className="vm-sub">All team members must approve before merge</div>
              </div>
              <button className="vm-close" onClick={() => setVoteModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="vm-body">
              <div className="vm-pr-info">
                <div className="vm-pr-title">fix: correct vote threshold for offline members</div>
                <div className="vm-pr-meta">
                  <span>⎇ feat/collab-editor → main</span>
                  <span>+14 −7</span>
                  <span>1 file changed</span>
                </div>
              </div>
              <div className="vm-members">
                <div className="vm-member">
                  <div className="vm-av" style={{ background: "var(--team-rk)" }}>RK</div>
                  <div>
                    <div className="vm-mname">rushi.k</div>
                    <div className="vm-mhandle">Proposed merge</div>
                  </div>
                  <div className="vm-status approved">✓ Approved</div>
                </div>
                <div className="vm-member">
                  <div className="vm-av" style={{ background: "var(--team-am)" }}>AM</div>
                  <div>
                    <div className="vm-mname">ayaan.m</div>
                    <div className="vm-mhandle">Reviewing</div>
                  </div>
                  <div className="vm-status reviewing">👀 Reviewing</div>
                </div>
                <div className="vm-member">
                  <div className="vm-av" style={{ background: "var(--team-sk)" }}>SK</div>
                  <div>
                    <div className="vm-mname">shruti.k</div>
                    <div className="vm-mhandle">Pending</div>
                  </div>
                  <div className="vm-status pending">⏳ Pending</div>
                </div>
              </div>
              <div>
                <div className="vm-bar"><div className="vm-bar-fill" style={{ width: "33%" }}></div></div>
                <div className="vm-bar-label"><span>1 of 3 approved</span><span>33% — needs 75%</span></div>
              </div>
              <div className="vm-acts">
                <button className="vm-act approve" onClick={() => castVote('approve')}>✓ Approve Merge</button>
                <button className="vm-act reject" onClick={() => castVote('reject')}>✕ Request Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
