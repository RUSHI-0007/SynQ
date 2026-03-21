"use client";

import React, { useState } from 'react';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { Plus, LayoutGrid, AlertCircle, Loader2 } from 'lucide-react';
import { useProjects } from '@/features/projects/useProjects';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { CreateProjectModal } from '@/features/projects/CreateProjectModal';

export default function DashboardPage() {
  const { projects, loading, error, refresh } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-800 bg-[#0A0A0A]">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-blue-500" />
            Hackathon Hub
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">
            Active Workspace
          </p>
        </div>
        
        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <div className="bg-black border border-gray-800 rounded p-1">
            <OrganizationSwitcher 
              appearance={{
                elements: {
                  organizationSwitcherTrigger: "text-white focus:outline-none px-2",
                  organizationPreviewTextContainer: "text-white",
                }
              }}
            />
          </div>
          <div className="h-6 w-px bg-gray-800 hidden sm:block"></div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Your Projects</h2>
            <p className="text-sm text-gray-400 mt-1">Manage and jump into your isolated Docker environments.</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <Plus className="w-5 h-5" />
            New Sandbox
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-gray-800 rounded-sm">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-sm text-gray-400 font-mono tracking-tight">Syncing projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-gray-800 rounded-sm bg-[#050505]">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
              <LayoutGrid className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-gray-200 mb-2">No active projects</h3>
            <p className="text-sm text-gray-500 max-w-sm text-center mb-8">
              You haven&apos;t spun up any Hackathon environments yet. Create a sandbox to instantly get a Next.js or Python backend running.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-blue-500 text-gray-300 hover:text-white text-sm font-bold uppercase tracking-widest transition-all"
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
      </main>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          refresh(); // sync local state explicitly against backend
        }} 
      />
    </div>
  );
}
