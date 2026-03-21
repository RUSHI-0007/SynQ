'use client';

import { useState, useEffect } from 'react';
import { Laptop } from 'lucide-react';

type NodeId = 'yjs' | 'supabase' | 'livekit' | 'docker' | 'monaco';

interface OrbitalNode {
  id: NodeId;
  label: string;
  icon: string | React.ReactNode;
  angleDeg: number;
  radius: number;
  title: string;
  desc: string;
}

const NODES: OrbitalNode[] = [
  { id: 'yjs', label: 'Yjs', icon: <span className="font-mono font-bold text-lg">Y</span>, angleDeg: 270, radius: 210, title: 'Yjs CRDTs', desc: 'Zero-conflict real-time sync across all editors simultaneously. Every keystroke in under 50ms.' },
  { id: 'supabase', label: 'Supabase', icon: '⚡', angleDeg: 342, radius: 210, title: 'Supabase Realtime', desc: 'Presence, voting, and file-tree updates broadcast in real time. Postgres-backed, zero SPOF.' },
  { id: 'livekit', label: 'LiveKit', icon: '🎙', angleDeg: 54, radius: 210, title: 'LiveKit WebRTC', desc: 'Sub-100ms voice audio. No Discord tab required. WebRTC SFU built for scale.' },
  { id: 'docker', label: 'Docker', icon: '🐳', angleDeg: 126, radius: 210, title: 'Dockerode', desc: 'Dynamic container spin-up, fully isolated per project. Ready in 30 seconds from cold.' },
  { id: 'monaco', label: 'Monaco', icon: <span className="font-mono font-bold text-sm">{'>_'}</span>, angleDeg: 198, radius: 210, title: 'Monaco + xterm.js', desc: 'Industry-grade editor and real bash terminal, shared live across your whole team.' },
];

export function OrbitalSection() {
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);

  const toggle = (id: NodeId) => {
    setActiveNode(prev => prev === id ? null : id);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.orbital-node') && !target.closest('.orbital-card')) {
        setActiveNode(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <section id="foundation" className="relative w-full max-w-7xl mx-auto px-6 py-32 flex flex-col items-center z-10">
      <div className="aos text-[#6366f1] text-xs font-semibold tracking-[0.2em] mb-6 inline-flex items-center gap-2">
        <span className="bg-[#6366f1] w-[6px] h-[6px] rounded-full inline-block" />
        FOUNDATION
      </div>
      <h2 className="aos d1 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center leading-tight mb-6">
        Built on a rock-solid stack
      </h2>
      <p className="aos d2 text-white/50 text-lg md:text-xl max-w-2xl text-center mb-32 font-light">
        Every technology was chosen for one reason: it works at 3am during a hackathon.
      </p>

      {/* Orbital Arena */}
      <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center mt-10 mb-20 perspective-1000">
        
        {/* Giant rotating ring */}
        <div className="absolute inset-8 rounded-full border border-indigo-500/30 animate-[spin_40s_linear_infinite_reverse]" />
        
        {/* Core Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_50%))] mix-blend-screen pointer-events-none" />

        {/* Center Node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#0a0a10] border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.6)] flex items-center justify-center z-20">
          <Laptop className="w-8 h-8 text-indigo-400" />
          <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping" />
        </div>

        {/* Orbiting Nodes */}
        {NODES.map(node => {
          const rad = toRad(node.angleDeg);
          // Distribute circularly: 50% is center, offset by radius. radius is scaled proportionally.
          const xOffset = Math.cos(rad) * 45; // percentage
          const yOffset = Math.sin(rad) * 45; // percentage
          const isActive = activeNode === node.id;

          return (
            <div
              key={node.id}
              className={`orbital-node absolute w-16 h-16 -ml-8 -mt-8 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md border ${
                isActive 
                  ? 'bg-indigo-600/30 border-indigo-400 scale-110 z-50 shadow-[0_0_30px_rgba(99,102,241,0.5)]' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-indigo-400 hover:scale-105 z-30'
              }`}
              style={{
                left: `${50 + xOffset}%`,
                top: `${50 + yOffset}%`,
              }}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
            >
              <div className="text-2xl mb-1">{node.icon}</div>
              <div className={`absolute -bottom-8 whitespace-nowrap text-xs font-semibold tracking-wider transition-opacity duration-300 ${isActive ? 'text-indigo-300 opacity-100' : 'text-white/60 opacity-0 group-hover:opacity-100'}`}>
                {node.label}
              </div>

              {isActive && (
                <div className="orbital-card absolute left-1/2 -translate-x-1/2 top-full mt-4 w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-5 shadow-2xl text-left cursor-default">
                  <h4 className="text-white font-bold text-lg mb-2">{node.title}</h4>
                  <p className="text-white/60 text-sm font-light leading-relaxed">{node.desc}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
