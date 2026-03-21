import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Code2, Box } from 'lucide-react';
import { FrameworkTemplate } from '@hackathon/shared-types';
import { useProjects } from './useProjects';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const { createProject } = useProjects();
  
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<FrameworkTemplate>('NEXTJS_TAILWIND');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProject(name, templateId);
      // Wait a moment for container to bind
      setTimeout(() => {
        router.push(`/projects/${result.project.id}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to scaffold project');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 shadow-2xl rounded-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#121212]">
          <h2 className="text-lg font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-500" />
            New Project
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono tracking-tight">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-black border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-4 py-2.5 text-sm text-gray-200 outline-none transition-all placeholder-gray-700 font-mono"
              placeholder="e.g. hackathon-alpha"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Framework Template</label>
            <div className="relative">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value as FrameworkTemplate)}
                disabled={isSubmitting}
                className="w-full appearance-none bg-black border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-4 py-2.5 pr-10 text-sm text-gray-200 outline-none transition-all font-mono cursor-pointer"
              >
                <option value="NEXTJS_TAILWIND">Next.js 14 + Tailwind</option>
                <option value="PYTHON_FASTAPI">Python FastAPI</option>
                <option value="VANILLA_VITE">Vanilla Vite (React)</option>
              </select>
              <Code2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-wider transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Spinning up Docker Sandbox...
                </>
              ) : (
                'Create Sandbox'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
