import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Project } from '@hackathon/shared-types';
import { Terminal, Box, Clock, Power, Loader2 } from 'lucide-react';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isWaking, setIsWaking] = useState(false);

  const handleWakeUp = async () => {
    try {
      setIsWaking(true);
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/projects/${project.id}/resume`), {
        method: 'POST',
        headers: getApiHeaders(token)
      });

      if (!res.ok) {
        throw new Error('Failed to wake up container');
      }

      // Container is awake! Navigate to IDE
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      setIsWaking(false);
    }
  };

  return (
    <div className="flex flex-col border border-gray-800 bg-[#0A0A0A] hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all group overflow-hidden">
      <div className="flex items-start justify-between p-5 border-b border-gray-800/50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-gray-100 text-lg tracking-tight group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-2">
            <Clock className="w-3 h-3" />
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-widest border ${
          project.status === 'sleeping' 
            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' 
            : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {project.status}
        </div>
      </div>
      
      <div className="p-4 bg-[#050505] flex justify-end">
        {project.status === 'sleeping' ? (
          <button 
            onClick={handleWakeUp}
            disabled={isWaking}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600/50 text-yellow-500 hover:text-yellow-400 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {isWaking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
            {isWaking ? 'Restoring...' : 'Wake Up Container'}
          </button>
        ) : (
          <Link 
            href={`/projects/${project.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-white hover:text-black text-gray-300 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Terminal className="w-3.5 h-3.5" />
            Join IDE
          </Link>
        )}
      </div>
    </div>
  );
}
