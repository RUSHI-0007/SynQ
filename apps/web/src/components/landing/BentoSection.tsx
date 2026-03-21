export function BentoSection() {
  return (
    <section id="capabilities" className="relative w-full max-w-7xl mx-auto px-6 py-32 flex flex-col items-center z-10">
      <div className="aos text-[#6366f1] text-xs font-semibold tracking-[0.2em] mb-6 inline-flex items-center gap-2">
        <span className="bg-[#6366f1] w-[6px] h-[6px] rounded-full inline-block" />
        CAPABILITIES
      </div>
      <h2 className="aos d1 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center leading-tight mb-6">
        All-in-one platform capabilities
      </h2>
      <p className="aos d2 text-white/50 text-lg md:text-xl max-w-2xl text-center mb-24 font-light">
        Your entire team, one sandbox, full visibility — with zero environment setup.
      </p>

      {/* Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(18rem,auto)]">
        
        {/* Col 1: Rows 1-2 (Yjs) */}
        <div className="aos flex flex-col justify-start rounded-3xl border border-white/[0.08] bg-[#0c0a1c]/80 p-8 shadow-2xl relative overflow-hidden group md:col-span-1 md:row-span-2 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:border-white/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(99,102,241,0.18)_0%,transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.06)_0%,transparent_50%))] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <span className="font-mono text-4xl font-bold text-white mb-6 tracking-tighter">Yjs</span>
            <h3 className="text-2xl font-semibold mb-3 tracking-tight">Real-time Collaboration</h3>
            <p className="text-white/50 leading-relaxed font-light mb-8">
              Yjs CRDTs sync every keystroke in under 50ms. Live colored cursors per teammate. 4,218+ files synced — zero conflicts, always.
            </p>
            
            <div className="mt-auto mb-6 bg-black/40 backdrop-blur-md border border-indigo-500/20 rounded-xl p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-mono text-lg font-bold text-green-400">00:47</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Uptime</div>
                </div>
                <div>
                  <div className="font-mono text-lg font-bold text-white">4,218</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Files synced</div>
                </div>
                <div>
                  <div className="font-mono text-lg font-bold text-green-400">7</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Merged</div>
                </div>
              </div>
            </div>
            
            <a href="#" className="mt-4 text-[#818cf8] font-medium hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group-hover:gap-2">
              Open Editor <span className="transition-all">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Col 1: Row 3 (Consensus) */}
        <div className="aos d1 flex flex-col justify-start rounded-3xl border border-white/[0.08] bg-[#0c0a1c]/80 p-8 shadow-2xl relative overflow-hidden group md:col-span-1 md:row-span-1 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:border-white/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(37,99,235,0.15)_0%,transparent_65%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <span className="text-3xl mb-4">⚖️</span>
            <h3 className="text-xl font-semibold mb-3 tracking-tight">Consensus Merge</h3>
            <p className="text-white/50 leading-relaxed font-light text-sm mb-4">
              Code ships to GitHub only when every teammate votes Approve via Octokit. No rogue pushes ever.
            </p>
            <a href="#" className="mt-auto text-[#818cf8] font-medium hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group-hover:gap-2">
              Learn Workflow <span className="transition-all">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Col 2: Row 1-2 (Hero Card) */}
        <div className="aos d1 flex flex-col justify-center rounded-3xl border border-white/[0.08] p-8 shadow-2xl relative overflow-hidden group md:col-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-br from-[#312e81] via-[#4338ca] to-[#6366f1] text-center lg:text-left self-stretch transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(99,102,241,0.6)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full items-center lg:items-start justify-center">
            <span className="text-4xl mb-6 drop-shadow-lg">🚀</span>
            <h3 className="text-2xl lg:text-3xl font-extrabold mb-4 tracking-tight leading-tight text-white drop-shadow-md">
              Your world, simplified in one sandbox.
            </h3>
            <p className="text-white/80 leading-relaxed font-medium text-sm mb-6 drop-shadow-sm max-w-xs">
              Full visibility across your team&apos;s code, containers, and merges — with zero environment setup required. 
              Spin up an isolated Docker instance in 30 seconds and start coding immediately.
            </p>
            <a href="#" className="mt-2 bg-white text-indigo-900 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-50 transition-colors duration-200 inline-flex items-center justify-center gap-2 group-hover:gap-3 w-max mx-auto lg:mx-0">
              Discover Synq <span className="transition-all">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Col 3: Row 1 (Voice) */}
        <div className="aos d1 flex flex-col justify-start rounded-3xl border border-white/[0.08] bg-[#0c0a1c]/80 p-8 shadow-2xl relative overflow-hidden group md:col-span-1 md:row-span-1 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:border-white/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.12)_0%,transparent_65%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <span className="text-3xl mb-4">🎙️</span>
            <h3 className="text-xl font-semibold mb-3 tracking-tight">Built-in Voice</h3>
            <p className="text-white/50 leading-relaxed font-light text-sm mb-4">
              LiveKit WebRTC audio channels built directly in. Sub-100ms latency, zero tab-switching.
            </p>
            <a href="#" className="mt-auto text-[#818cf8] font-medium hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group-hover:gap-2">
              Join Channel <span className="transition-all">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Bottom Row: Merge Feed — full-width horizontal */}
        <div className="aos d2 flex flex-col justify-start rounded-3xl border border-white/[0.08] bg-[#0c0a1c]/80 p-8 shadow-2xl relative overflow-hidden group md:col-span-2 md:row-span-1 transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] hover:border-white/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(99,102,241,0.2)_0%,transparent_65%)] pointer-events-none" />
          <div className="relative z-10 flex flex-row h-full gap-10">

            {/* Left half — live merge activity */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="mb-5 font-mono text-[10px] tracking-widest uppercase text-white/40">Merge Activity</div>
              <div className="flex flex-col gap-3">
                {[
                  { bg: 'bg-blue-700', text: 'text-blue-100', init: 'RK', name: 'rushi.k', action: 'proposed merge', status: 'PENDING', sColor: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' },
                  { bg: 'bg-purple-700', text: 'text-purple-100', init: 'AM', name: 'ayaan.m', action: 'approved', status: '✓ OK', sColor: 'bg-green-500/20 text-green-400 border border-green-500/30' },
                  { bg: 'bg-pink-700', text: 'text-pink-100', init: 'SK', name: 'shruti.k', action: 'reviewing', status: '', sColor: '' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${r.bg} ${r.text}`}>{r.init}</div>
                    <div className="flex flex-col">
                      <span className="text-white/80 text-xs">{r.name}</span>
                      <span className="text-white/40 text-[10px]">{r.action} {r.status === '' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 ml-1 animate-pulse" />}</span>
                    </div>
                    {r.status && <div className={`ml-auto text-[9px] px-2 py-0.5 rounded font-bold tracking-wider ${r.sColor}`}>{r.status}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical divider */}
            <div className="w-px bg-white/[0.06] self-stretch" />

            {/* Right half — copy & CTA */}
            <div className="flex flex-col flex-1 justify-center min-w-0">
              <span className="text-3xl mb-4">🔀</span>
              <h3 className="text-xl font-semibold tracking-tight leading-tight mb-3">Consensus works like your best PR reviewer — automatically.</h3>
              <p className="text-white/50 leading-relaxed font-light text-sm mb-5">
                Octokit only fires when all votes are in. No broken main branches. Ever.
              </p>
              <a href="#" className="text-[#818cf8] font-medium hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group-hover:gap-2">
                Discover Synq <span className="transition-all">&rarr;</span>
              </a>
            </div>

          </div>
        </div>


      </div>
    </section>
  );
}
