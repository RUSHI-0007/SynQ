'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, Terminal, Brain, Cpu, Code2 } from 'lucide-react';
import {
  SiReact, SiNextdotjs, SiTailwindcss, SiTypescript, SiPrisma,
  SiPython, SiFastapi, SiCplusplus, SiRust, SiGo, SiNodedotjs, SiC,
  SiVuedotjs, SiSvelte,
} from 'react-icons/si';

import { FrameworkTemplate } from '@hackathon/shared-types';
import { useProjects } from './useProjects';
import { BorderBeam } from '@/registry/magicui/border-beam';
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-effect';

// Accepts both Lucide ForwardRef components and react-icons FC
type AnyIcon = (props: { className?: string; style?: React.CSSProperties }) => React.ReactNode;

interface CreateProjectViewProps {
  onBack: () => void;
}

// ─── Data ────────────────────────────────────────────────────────────────────

interface TierConfig {
  id: string;
  templateId: FrameworkTemplate;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  colorFrom: string;
  colorTo: string;
  glowColor: string;
  icons: AnyIcon[];
}

interface BlankOption {
  id: FrameworkTemplate;
  label: string;
  description: string;
  Icon: AnyIcon;
  colorFrom: string;
  colorTo: string;
}

const GOD_TIERS: TierConfig[] = [
  {
    id: 'fullstack-meta',
    templateId: 'NEXTJS_TAILWIND',
    title: 'The Fullstack Meta',
    subtitle: 'Next.js · Prisma · TypeScript',
    badge: 'Web',
    badgeColor: 'text-cyan-400',
    description: 'A robust Node environment pre-configured with the ultimate modern meta-frameworks for instant UI/UX iteration.',
    colorFrom: '#06b6d4',
    colorTo: '#3b82f6',
    glowColor: 'rgba(6,182,212,0.18)',
    icons: [SiReact, SiNextdotjs, SiTailwindcss, SiTypescript, SiPrisma],
  },
  {
    id: 'ai-agent',
    templateId: 'PYTHON_FASTAPI',
    title: 'The AI Agent',
    subtitle: 'FastAPI · Python 3.11',
    badge: 'Data / ML',
    badgeColor: 'text-pink-400',
    description: 'Python environment primed for LLM integrations, RAG pipelines, and high-performance async backends.',
    colorFrom: '#ec4899',
    colorTo: '#a855f7',
    glowColor: 'rgba(236,72,153,0.18)',
    icons: [SiPython, SiFastapi, Brain, Brain, Brain],
  },
  {
    id: 'heavy-lifter',
    templateId: 'CPP_CMAKE',
    title: 'The Heavy Lifter',
    subtitle: 'C++ · CMake · GCC 13',
    badge: 'Systems',
    badgeColor: 'text-orange-400',
    description: 'Bare-metal performance. Low-level environment pre-configured with CMake, modern C++23, and full STL support.',
    colorFrom: '#f97316',
    colorTo: '#ef4444',
    glowColor: 'rgba(249,115,22,0.18)',
    icons: [SiCplusplus, SiC, Cpu, Cpu, Terminal],
  },
  {
    id: 'rust-forge',
    templateId: 'RUST_CARGO',
    title: 'The Rust Forge',
    subtitle: 'Rust · Cargo · Tokio',
    badge: 'Systems',
    badgeColor: 'text-orange-400',
    description: 'Memory-safe systems programming. Rust with Cargo workspace, async Tokio runtime, and zero-cost abstractions.',
    colorFrom: '#fb923c',
    colorTo: '#dc2626',
    glowColor: 'rgba(251,146,60,0.18)',
    icons: [SiRust, Terminal, Cpu, Cpu, Zap],
  },
  {
    id: 'go-gopher',
    templateId: 'GO_MODULE',
    title: 'The Go Gopher',
    subtitle: 'Go 1.22 · Modules',
    badge: 'Backend',
    badgeColor: 'text-sky-400',
    description: 'Concurrent by design. Go module workspace with standard project layout, goroutines, and channels ready to go.',
    colorFrom: '#38bdf8',
    colorTo: '#6366f1',
    glowColor: 'rgba(56,189,248,0.18)',
    icons: [SiGo, Terminal, Zap, Zap, Code2],
  },
  {
    id: 'vanilla-vite',
    templateId: 'VANILLA_VITE',
    title: 'The Vite Studio',
    subtitle: 'Vite · TypeScript · HMR',
    badge: 'Web',
    badgeColor: 'text-violet-400',
    description: 'Blazing-fast frontend tooling. Vite with TypeScript, HMR, and zero config — your canvas, your rules.',
    colorFrom: '#8b5cf6',
    colorTo: '#ec4899',
    glowColor: 'rgba(139,92,246,0.18)',
    icons: [SiVuedotjs, SiSvelte, SiTypescript, SiTailwindcss, Zap],
  },
];

const BLANK_OPTIONS: BlankOption[] = [
  {
    id: 'NODE_BLANK',
    label: 'Node.js',
    description: 'Blank Node 20 Alpine — npm ready',
    Icon: SiNodedotjs,
    colorFrom: '#4ade80',
    colorTo: '#22c55e',
  },
  {
    id: 'PYTHON_BLANK',
    label: 'Python',
    description: 'Blank Python 3.11 Alpine — pip ready',
    Icon: SiPython,
    colorFrom: '#facc15',
    colorTo: '#f59e0b',
  },
  {
    id: 'C_MAKE',
    label: 'C',
    description: 'GCC 13 · CMake · Make',
    Icon: SiC,
    colorFrom: '#60a5fa',
    colorTo: '#3b82f6',
  },
  {
    id: 'CPP_CMAKE',
    label: 'C++',
    description: 'GCC 13 · CMake · C++23',
    Icon: SiCplusplus,
    colorFrom: '#f97316',
    colorTo: '#ef4444',
  },
  {
    id: 'RUST_CARGO',
    label: 'Rust',
    description: 'Rust 1.78 · Cargo workspace',
    Icon: SiRust,
    colorFrom: '#fb923c',
    colorTo: '#dc2626',
  },
  {
    id: 'GO_MODULE',
    label: 'Go',
    description: 'Go 1.22 · Modules',
    Icon: SiGo,
    colorFrom: '#38bdf8',
    colorTo: '#0ea5e9',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateProjectView({ onBack }: CreateProjectViewProps) {
  const router = useRouter();
  const { createProject } = useProjects();

  type Selection =
    | { type: 'tier'; tier: TierConfig }
    | { type: 'blank'; option: BlankOption }
    | null;

  const [selection, setSelection] = useState<Selection>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplateId: FrameworkTemplate | null =
    selection?.type === 'tier'
      ? selection.tier.templateId
      : selection?.type === 'blank'
        ? selection.option.id
        : null;

  const selectedTitle =
    selection?.type === 'tier'
      ? selection.tier.title
      : selection?.type === 'blank'
        ? `${selection.option.label} Blank`
        : '';

  const selectedColorFrom =
    selection?.type === 'tier'
      ? selection.tier.colorFrom
      : selection?.type === 'blank'
        ? selection.option.colorFrom
        : '#06b6d4';

  const handleDeploy = async () => {
    if (!selectedTemplateId || !name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createProject(name, selectedTemplateId);
      setTimeout(() => router.push(`/projects/${result.project.id}`), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to scaffold project');
      setIsSubmitting(false);
    }
  };

  const containerV = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemV = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
  };

  return (
    <div className="flex flex-col w-full relative overflow-y-auto overflow-x-hidden min-h-[calc(100vh-100px)]">

      {/* Booting overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          >
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[[6, 182, 212], [59, 130, 246]]}
              dotSize={2}
            />
            <div className="absolute inset-0 [mask-image:radial-gradient(500px_at_center,white,transparent)] bg-black/60 backdrop-blur-[2px]" />
            <div className="relative z-10 flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-white animate-spin mb-8 opacity-80" />
              <h2 className="text-3xl font-extrabold text-white tracking-widest uppercase font-mono mb-2">
                Booting Workspace
              </h2>
              <p className="text-neutral-400 font-mono text-sm uppercase tracking-wider">
                Scaffolding {selectedTitle} environment...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-full transition-colors text-neutral-400 hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Spin up a new Sandbox</h2>
          <p className="text-sm text-neutral-400">Select a God-Image or configure a custom blank environment.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono rounded-lg">
          {error}
        </div>
      )}

      {/* ── Section 1: God-Image Tiers ─────────────────────────────────── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
        1-Click God Images
      </p>
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10"
      >
        {GOD_TIERS.map((tier) => {
          const isSelected = selection?.type === 'tier' && selection.tier.id === tier.id;
          return (
            <motion.div
              key={tier.id}
              variants={itemV}
              whileHover={{ scale: 1.015, y: -3 }}
              onClick={() =>
                setSelection(isSelected ? null : { type: 'tier', tier })
              }
              className={`relative flex flex-col justify-between h-[280px] p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group
                ${isSelected
                  ? 'border-transparent bg-[#0c0a1c]/80 backdrop-blur-xl'
                  : 'border-white/[0.07] bg-[#0c0a1c]/50 backdrop-blur-md hover:border-white/[0.15]'}
              `}
              style={isSelected ? { boxShadow: `0 0 35px ${tier.glowColor}` } : {}}
            >
              {/* Beam */}
              <BorderBeam
                duration={isSelected ? 4 : 9}
                size={90}
                borderWidth={1.5}
                colorFrom={tier.colorFrom}
                colorTo={tier.colorTo}
                wrapperClassName={`transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'}`}
              />

              {/* Card glow bg */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top right, ${tier.glowColor} 0%, transparent 70%)` }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] ${tier.badgeColor}`}>
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white mb-1">{tier.title}</h3>
                  <p className="text-[11px] font-mono text-neutral-500 mb-3">{tier.subtitle}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">{tier.description}</p>
                </div>

                {/* Icons */}
                <div className="mt-auto flex items-center gap-2">
                  {tier.icons.map((Icon, idx) => (
                    <div
                      key={idx}
                      className={`w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center transition-all duration-300
                        ${isSelected ? 'bg-white/[0.08] border-white/20' : 'group-hover:scale-110 group-hover:bg-white/[0.05]'}`}
                    >
                      <Icon className={`w-4 h-4 text-neutral-300 ${isSelected ? '' : 'group-hover:text-white'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Section 2: Custom / Blank Environment ─────────────────────── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
        Custom Blank Environment
      </p>
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-3 mb-32"
      >
        {BLANK_OPTIONS.map((opt) => {
          const isSelected = selection?.type === 'blank' && selection.option.id === opt.id;
          return (
            <motion.div
              key={opt.id}
              variants={itemV}
              whileHover={{ scale: 1.03, y: -2 }}
              onClick={() =>
                setSelection(isSelected ? null : { type: 'blank', option: opt })
              }
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer overflow-hidden group transition-all duration-300`}
              style={{
                background: isSelected ? '#0c0a1c' : 'rgba(12,10,28,0.4)',
                borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.07)',
                boxShadow: isSelected ? `0 0 20px ${opt.colorFrom}40` : undefined,
                minWidth: '160px',
              }}
            >
              {/* Beam */}
              <BorderBeam
                duration={isSelected ? 5 : 10}
                size={50}
                borderWidth={1}
                colorFrom={opt.colorFrom}
                colorTo={opt.colorTo}
                wrapperClassName={`transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
              />

              <div
                className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${opt.colorFrom}20` }}
              >
                <opt.Icon className="w-4 h-4" style={{ color: opt.colorFrom }} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-white leading-tight">{opt.label}</p>
                <p className="text-[10px] text-neutral-500 leading-tight mt-0.5">{opt.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Progressive Footer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="fixed bottom-0 left-0 w-full z-50 p-5 md:p-6"
          >
            <div
              className="max-w-4xl mx-auto w-full bg-[#08080f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4"
              style={{ boxShadow: `0 -16px 48px rgba(0,0,0,0.6), 0 0 24px ${selectedColorFrom}22` }}
            >
              {/* Selected tier label */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: selectedColorFrom }} />
                <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                  {selectedTitle}
                </span>
              </div>

              <div className="hidden md:block w-px h-10 bg-white/[0.08]" />

              {/* Name input */}
              <div className="flex flex-col flex-1 w-full gap-1.5">
                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                  Name your Sandbox
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleDeploy()}
                  className="w-full bg-black/50 border border-white/[0.08] focus:border-white/25 rounded-xl px-4 py-3 text-white font-mono placeholder:text-neutral-500 outline-none transition-all text-base"
                  placeholder="e.g. hackathon-alpha"
                  autoFocus
                />
              </div>

              {/* Deploy button */}
              <button
                onClick={handleDeploy}
                disabled={isSubmitting || !name.trim()}
                className={`flex-shrink-0 flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 w-full md:w-auto
                  ${isSubmitting || !name.trim()
                    ? 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'
                    : 'bg-white text-black hover:bg-neutral-100 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02]'
                  }`}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</>
                ) : (
                  <>Deploy <Zap className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
