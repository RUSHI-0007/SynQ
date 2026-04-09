"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { Plus, LayoutGrid, AlertCircle, Loader2 } from 'lucide-react';
import { useProjects } from '@/features/projects/useProjects';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { CreateProjectView } from '@/features/projects/CreateProjectView';

export default function DashboardPage() {
  const { projects, loading, error, refresh } = useProjects();
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-white/[0.04] bg-[#0A0A0A]">
        <div className="flex flex-col">
          <Link href="/" className="text-2xl font-bold tracking-[0.2em] font-sans text-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer select-none border-none outline-none hover:opacity-80 transition-opacity">
            <div>SYN<span className="text-indigo-500">Q</span></div>
          </Link>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-mono">
            Active Workspace
          </p>
        </div>
        
        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <div className="bg-black border border-white/[0.08] rounded p-1">
            <OrganizationSwitcher 
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "text-white focus:outline-none px-2",
                  organizationPreviewTextContainer: "text-white",
                }
              }}
            />
          </div>
          <div className="h-6 w-px bg-white/[0.08] hidden sm:block"></div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {isCreatingProject ? (
          // View 2: The Awwwards-style Create Project Workflow
          <CreateProjectView onBack={() => {
            setIsCreatingProject(false);
            refresh(); // In case they backed out but maybe something refreshed
          }} />
        ) : (
          // View 1: The standard Project List
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Your Projects</h2>
                <p className="text-sm text-neutral-400 mt-1">Manage and jump into your isolated Docker environments.</p>
              </div>
              
              <button
                onClick={() => setIsCreatingProject(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-wider transition-colors rounded shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                <Plus className="w-5 h-5" />
                New Sandbox
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono rounded">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm text-neutral-400 font-mono tracking-tight">Syncing projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                  <LayoutGrid className="w-8 h-8 text-blue-500 opacity-80" />
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">No active projects</h3>
                <p className="text-sm text-neutral-500 max-w-sm text-center mb-8">
                  You haven&apos;t spun up any Hackathon environments yet. Create a sandbox to instantly get a Next.js or Python backend running.
                </p>
                <button
                  onClick={() => setIsCreatingProject(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] hover:border-blue-500 text-neutral-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-all rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Scaffold First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
