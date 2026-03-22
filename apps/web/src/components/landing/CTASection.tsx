'use client';

import { RainbowButton } from '@/components/ui/RainbowButton';

export function CTASection({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section id="cta" className="relative w-full max-w-7xl mx-auto px-6 py-32 flex flex-col items-center z-10 border-t border-white/[0.04]">
      {/* Background glow */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">
        <div className="aos text-2xl font-bold tracking-[0.2em] font-sans text-white mb-12">
          SYN<span className="text-indigo-500">Q</span>
        </div>
        
        <h2 className="aos d1 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-center leading-[0.95] mb-8">
          Ready to ship<br />without the chaos?
        </h2>
        
        <p className="aos d2 text-white/50 text-base md:text-xl max-w-xl text-center mb-12 font-light">
          Built for 24-hour hackathons. Shipped at ETHGlobal, HackMIT, and college fests across India.
        </p>

        <div className="aos d3 flex flex-col sm:flex-row gap-4">
          <RainbowButton onClick={onCtaClick}>
            Start a Sandbox &rarr;
          </RainbowButton>
          <button className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10">
            View Docs
          </button>
        </div>
      </div>
    </section>
  );
}
