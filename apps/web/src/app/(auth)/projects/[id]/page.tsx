"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { UnifiedSidebar } from "@/components/workspace/UnifiedSidebar";
import { DynamicIsland } from "@/components/workspace/DynamicIsland";
import { useFileSystem } from "@/features/ide/useFileSystem";
import { useTeammates } from "@/features/ide/useTeammates";

// These components use browser-only APIs (y-websocket, xterm, supabase realtime)
// and MUST be loaded client-side only to avoid "window is not defined" SSR crashes.
const EditorCanvas = dynamic(
  () => import("@/components/workspace/EditorCanvas").then(m => m.EditorCanvas),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0d0d12] animate-pulse" /> }
);
const FloatingTerminal = dynamic(
  () => import("@/components/workspace/FloatingTerminal").then(m => m.FloatingTerminal),
  { ssr: false }
);
const MergeModal = dynamic(
  () => import("@/components/workspace/MergeModal").then(m => m.MergeModal),
  { ssr: false }
);

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const { tree, activeFile, activeContent, openFile } = useFileSystem(params.id);
  const { teammates } = useTeammates(params.id);
  
  const [mergeOpen, setMergeOpen] = useState(false);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-[#050505] flex flex-col md:flex-row p-2 md:p-4 gap-2 md:gap-4 font-sans text-white relative selection:bg-indigo-500/30">
      
      {/* 1. Unified Floating Sidebar */}
      <UnifiedSidebar 
        projectId={params.id}
        activeFile={activeFile} 
        onSelectFile={openFile} 
      />

      {/* 2. Main Stage */}
      <main className="flex-1 relative rounded-2xl overflow-hidden bg-[#050505] border border-white/5 shadow-2xl">
        
        {/* 3. Dynamic Island */}
        <DynamicIsland 
          onProposeMerge={() => setMergeOpen(true)} 
        />

        {/* 4. Editor Canvas (client-only) */}
        <EditorCanvas 
          activeFile={activeFile || ''} 
          projectId={params.id}
          currentUser={user}
          initialContent={activeContent}
        />

        {/* 5. Floating Terminal (client-only) */}
        <FloatingTerminal projectId={params.id} />

      </main>

      {/* 6. Merge Modal (client-only) */}
      <MergeModal 
        isOpen={mergeOpen} 
        onClose={() => setMergeOpen(false)} 
        teammates={teammates} 
        projectId={params.id} 
      />

    </div>
  );
}
