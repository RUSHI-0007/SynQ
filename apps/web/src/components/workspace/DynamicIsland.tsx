import React from 'react';
import { GitBranch, Clock, Send, Play } from 'lucide-react';

interface DynamicIslandProps {
  onProposeMerge: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({ onProposeMerge }) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-full shadow-2xl">
      
      {/* Branch & Commit Info */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
        <GitBranch size={14} className="text-indigo-400" />
        <span className="text-xs font-medium text-zinc-200">main</span>
        <div className="w-1 h-1 rounded-full bg-zinc-600 mx-1"></div>
        <span className="text-xs font-mono text-zinc-400">a3f892c</span>
      </div>

      {/* Hackathon Timer */}
      <div className="flex items-center gap-2 px-3">
        <Clock size={14} className="text-zinc-500" />
        <span className="text-sm font-semibold tracking-wider font-mono text-zinc-200">14:22:05</span>
      </div>

      {/* Propose Merge Button */}
      <button 
        onClick={onProposeMerge}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] active:scale-95 transition-all outline-none focus:ring-2 focus:ring-indigo-500/50 border border-indigo-500/50"
      >
        <Send size={14} />
        Propose Merge
      </button>

      {/* Split/Run buttons */}
      <div className="flex items-center px-1">
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-green-400 transition-colors">
          <Play size={15} className="fill-green-400/20" />
        </button>
      </div>

    </div>
  );
};
