'use client';

import './HeroSection.css';

import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { RainbowButton } from '@/components/ui/RainbowButton';

export function HeroSection({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section id="hero" className="hero-section">
      {/* Beams */}
      <div className="beam">
        <div className="beam-wide" />
        <div className="beam-thin" />
      </div>

      <div className="relative z-10 w-full overflow-hidden flex flex-col items-center pt-10">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                New · Yjs real-time sync v2.0 now live
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[80px] font-bold tracking-tight mb-6 leading-[0.95]">
                The IDE your<br />
                <span className="text-grad">hackathon team</span><br />
                <span className="text-white/40">actually deserves.</span>
              </h1>

              <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed font-light mx-auto">
                Full visibility across your team&apos;s code, containers, and merges — with{' '}
                <strong className="text-white font-medium">zero environment setup</strong> required. Spin up an isolated Docker instance in 30 seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center">
                <RainbowButton onClick={onCtaClick}>
                  Start a Sandbox &rarr;
                </RainbowButton>
                <button className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10">
                  Watch Demo
                </button>
              </div>
              <p className="text-xs text-white/40 mb-10">No credit card · Free for hackathons · Ships today</p>
            </div>
          }
        >
          <div className="mockup-chrome w-full h-full flex flex-col">
            {/* Window Bar */}
            <div className="flex h-10 shrink-0 items-center border-b border-white/[0.06] bg-black/40 px-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto flex h-6 w-full max-w-sm items-center rounded-md bg-white/5 px-4 justify-center text-[11px] font-medium text-white/40 font-mono">
                app.synq.dev/team/hackathon-2025
              </div>
            </div>

            {/* Sub Header */}
            <div className="flex h-12 shrink-0 items-center border-b border-white/[0.06] bg-black/20 px-4 text-sm font-mono text-white/60 overflow-hidden">
              <div className="flex items-center gap-2 shrink-0">
                <span>📁</span>
                <strong className="text-white hidden sm:block">synq-collab</strong>
                <span className="text-[#3f3f46]">/</span>
              </div>
              <div className="ml-4 flex items-center gap-2 rounded bg-indigo-500/10 px-2 py-1 text-indigo-400 shrink-0">
                ⎇ main
              </div>
              <div className="ml-4 flex items-center gap-2 rounded bg-green-500/10 px-2 py-1 text-green-400 shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden sm:inline">node:20-alpine · /app</span>
                <span className="sm:hidden">docker</span>
              </div>

              {/* Avatars */}
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex -space-x-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-blue-100 ring-2 ring-black">RK</div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-700 text-[10px] font-bold text-purple-100 ring-2 ring-black">AM</div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-700 text-[10px] font-bold text-pink-100 ring-2 ring-black">SK</div>
                </div>
                
                {/* Voice Visualizer */}
                <div className="hidden md:flex h-4 items-end gap-[3px] ml-4 bg-white/5 px-2 py-1 rounded">
                  <div className="vb" style={{ height: '60%', ['--vd' as any]: '.8s', ['--vdl' as any]: '0s' }} />
                  <div className="vb" style={{ height: '100%', ['--vd' as any]: '.6s', ['--vdl' as any]: '.15s' }} />
                  <div className="vb" style={{ height: '40%', ['--vd' as any]: '1s', ['--vdl' as any]: '.3s' }} />
                  <div className="vb" style={{ height: '80%', ['--vd' as any]: '.75s', ['--vdl' as any]: '.1s' }} />
                </div>
                
                <button className="ml-4 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors">
                  ⚡ Vote
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="hidden md:block w-64 shrink-0 border-r border-white/[0.06] bg-black/20 p-4 font-mono text-sm text-white/50 overflow-y-auto">
                <div className="mb-4 text-xs font-semibold tracking-widest text-white/30">EXPLORER</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 py-1 hover:text-white cursor-pointer">📂 src</div>
                  <div className="flex items-center gap-2 py-1 pl-4 bg-white/5 text-white rounded">
                    <span>›</span>📄 App.tsx
                  </div>
                  <div className="flex items-center gap-2 py-1 pl-4 hover:text-white cursor-pointer">
                    <span>›</span>📄 auth.ts
                  </div>
                  <div className="flex items-center gap-2 py-1 pl-4 hover:text-white cursor-pointer">
                    <span>›</span>📄 collab.ts
                  </div>
                  <div className="flex items-center gap-2 py-1 hover:text-white cursor-pointer">📂 api</div>
                  <div className="flex items-center gap-2 py-1 hover:text-white cursor-pointer">📄 package.json</div>
                </div>

                <div className="mt-8 mb-4 text-xs font-semibold tracking-widest text-white/30">ONLINE NOW</div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-[8px] font-bold text-blue-100">RK</div>
                      <span className="text-white/80">rushi.k</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-700 text-[8px] font-bold text-purple-100">AM</div>
                      <span className="text-white/80">ayaan.m</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-700 text-[8px] font-bold text-pink-100">SK</div>
                      <span className="text-white/80">shruti.k</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  </div>
                </div>
              </div>

              {/* Editor Split */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 p-4 md:p-6 font-mono text-xs md:text-sm leading-relaxed overflow-y-auto">
                  <div className="flex flex-col text-white/80">
                    <div className="text-white/30 mb-2">{'//'} 🔴 rushi.k · 🟣 ayaan.m editing</div>
                    <div className="whitespace-pre-wrap">
                      <span className="text-purple-400">import </span>
                      <span className="text-yellow-200">{'{'} useCollab {'}'} </span>
                      <span className="text-purple-400">from </span>
                      <span className="text-green-300">'@synq/yjs'</span>
                      <span className="ci ci-p inline-block ml-1 h-3 w-1.5 bg-pink-500 align-middle animate-pulse" />
                    </div>
                    <div className="h-4" />
                    <div className="whitespace-pre-wrap">
                      <span className="text-purple-400">export function </span>
                      <span className="text-blue-400">App</span>() {'{'}
                      <span className="ci ci-k inline-block ml-1 h-3 w-1.5 bg-blue-500 align-middle animate-pulse" />
                    </div>
                    <div className="pl-4 md:pl-6 whitespace-pre-wrap">
                      <span className="text-purple-400">const </span>
                      {'{'} doc, awareness {'}'} = <span className="text-blue-400">useCollab</span>()
                    </div>
                    <div className="pl-4 md:pl-6 whitespace-pre-wrap">
                      <span className="text-purple-400">return </span>
                      <span className="text-green-300">{'<Editor '}</span>doc={'{'}doc{'}'}<span className="text-green-300">{' />'}</span>
                    </div>
                    <div>{'}'}</div>
                  </div>
                </div>

                {/* Terminal */}
                <div className="h-32 md:h-48 shrink-0 border-t border-white/[0.06] bg-black/40 flex flex-col font-mono text-[11px] md:text-[13px]">
                  <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 text-xs font-semibold tracking-widest text-white/30">
                    <span>TERMINAL</span>
                    <span>bash · /app</span>
                  </div>
                  <div className="p-4 flex flex-col gap-2 overflow-y-auto">
                    <div>
                      <span className="text-green-400">▸ </span>
                      <span className="text-white">npm run dev</span>
                    </div>
                    <div className="text-white/60 whitespace-pre-wrap">
                      &gt; hackathon@0.1.0 dev<br />
                      &gt; next dev --port 3000
                    </div>
                    <div className="text-green-400">✓ ready on http://localhost:3000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </div>
      
      {/* Ticker */}
      <div className="w-full overflow-hidden border-t border-white/[0.06] mt-8 py-4 flex">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          {['🚀 v2.0 released', '·', 'Yjs real-time sync', '·', 'Docker sandboxes', '·', 'Consensus Merge', '·', 'LiveKit voice', '·', '🚀 v2.0 released', '·', 'Yjs real-time sync', '·', 'Docker sandboxes', '·', 'Consensus Merge', '·'].map((t, i) => (
            <span key={i} className="mx-4 text-xs font-mono text-white/40">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
