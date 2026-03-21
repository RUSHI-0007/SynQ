'use client';

import { useEffect, useRef } from 'react';
import { BentoMonochrome } from '@/components/ui/bento-monochrome';

export function PlatformSection() {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const phrases = ['Every tool', 'Collaboration', 'Zero conflicts', 'Ship faster', 'Your stack'];
    let idx = 0;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const tick = () => {
      idx = (idx + 1) % phrases.length;
      wrap.style.transform = 'translateY(-20px)';
      wrap.style.opacity = '0';
      setTimeout(() => {
        wrap.textContent = phrases[idx] || '';
        wrap.style.transform = 'translateY(20px)';
        setTimeout(() => {
          wrap.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1), opacity .4s';
          wrap.style.transform = 'translateY(0)';
          wrap.style.opacity = '1';
        }, 20);
      }, 300);
    };

    wrap.textContent = phrases[0] || '';
    const interval = setInterval(tick, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="platform" className="relative w-full mx-auto pb-32 flex flex-col items-center z-10 w-full">
      <div className="w-full max-w-6xl mx-auto px-6 py-32 flex flex-col items-center">
        <div className="aos text-[#6366f1] text-xs font-semibold tracking-[0.2em] mb-6 inline-flex items-center gap-2">
          <span className="bg-[#6366f1] w-[6px] h-[6px] rounded-full inline-block" />
          PLATFORM
        </div>
        
        <h2 className="aos d1 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center leading-tight mb-6">
          One platform.&nbsp;
          <span className="inline-flex overflow-hidden align-bottom text-[#a5b4fc]" id="rt-wrap">
            <span
              ref={wrapRef}
              className="inline-block transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)] min-w-[180px] md:min-w-[280px] text-left"
            />
          </span>
          <br />your team needs.
        </h2>
        
        <p className="aos d2 text-white/50 text-lg md:text-xl max-w-2xl text-center mb-16 font-light">
          From spinning up a Docker sandbox to pushing code to GitHub — everything lives in one browser tab.
        </p>
      </div>

      <div className="w-full aos d3">
        <BentoMonochrome />
      </div>
    </section>
  );
}
