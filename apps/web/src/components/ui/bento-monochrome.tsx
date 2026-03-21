'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";

const STYLE_ID = "bento3-animations";

const flows = [
  {
    id: "01",
    variant: "orbit",
    meta: "Editor",
    title: "Multiplayer Editor",
    description: "Yjs CRDTs sync every keystroke in under 50ms. Live colored cursors per teammate. Zero conflicts, always.",
    statLabel: "Sync latency",
    statValue: "< 50ms",
  },
  {
    id: "02",
    variant: "relay",
    meta: "Workflow",
    title: "Consensus Merge",
    description: "No rogue pushes. Code ships to GitHub only when every teammate votes Approve via Octokit.",
    statLabel: "Rogue pushes",
    statValue: "0",
  },
  {
    id: "03",
    variant: "wave",
    meta: "Console",
    title: "Integrated Terminal",
    description: "xterm.js piped into your Docker container over WebSockets. Full bash, shared with the whole team.",
    statLabel: "Environments",
    statValue: "Isolated",
  },
  {
    id: "04",
    variant: "spark",
    meta: "Audio",
    title: "Voice Chat",
    description: "LiveKit WebRTC audio channels built directly in. Talk while you type — zero tab switching ever.",
    statLabel: "Audio latency",
    statValue: "< 100ms",
  },
];

const palettes = {
  dark: {
    surface: "bg-transparent text-neutral-100",
    heading: "text-white",
    muted: "text-neutral-400",
    capsule: "bg-white/5 border-white/10 text-white/80",
    card: "bg-neutral-900/40 backdrop-blur-sm",
    cardBorder: "border-white/10",
    metric: "bg-white/5 border-white/10 text-white/70",
    headingAccent: "bg-white/10",
    toggleSurface: "bg-white/10",
    toggle: "border-white/15 text-white",
    button: "border-white/15 text-white hover:border-white/40 hover:bg-white/10",
    gridColor: "rgba(255, 255, 255, 0.06)",
    overlay: "transparent",
    focusGlow: "rgba(99, 102, 241, 0.15)",
    iconStroke: "#6366f1",
    iconTrail: "rgba(99, 102, 241, 0.3)",
  },
  light: {
    surface: "bg-transparent text-neutral-900",
    heading: "text-neutral-900",
    muted: "text-neutral-600",
    capsule: "bg-white/70 border-neutral-200 text-neutral-700",
    card: "bg-white/80 backdrop-blur-sm",
    cardBorder: "border-neutral-200",
    metric: "bg-white border-neutral-200 text-neutral-600",
    headingAccent: "bg-neutral-900/10",
    toggleSurface: "bg-white",
    toggle: "border-neutral-300 text-neutral-900",
    button: "border-neutral-300 text-neutral-900 hover:border-neutral-500 hover:bg-neutral-900/5",
    gridColor: "rgba(17, 17, 17, 0.08)",
    overlay: "transparent",
    focusGlow: "rgba(99, 102, 241, 0.15)",
    iconStroke: "#6366f1",
    iconTrail: "rgba(99, 102, 241, 0.3)",
  },
};

const getRootTheme = () => {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("light")) return "light";
  return "dark"; // Default to dark for this dark-themed landing page
};

export function BentoMonochrome() {
  const [theme, setTheme] = useState(() => getRootTheme());
  const [introReady, setIntroReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      @keyframes bento3-card-in {
        0% { opacity: 0; transform: translate3d(0, 28px, 0) scale(0.97); filter: blur(12px); }
        60% { filter: blur(0); }
        100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
      }
      @keyframes bento3-flare {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes bento3-dash {
        0% { transform: translateX(-25%); opacity: 0; }
        30% { opacity: 1; }
        70% { opacity: 1; }
        100% { transform: translateX(25%); opacity: 0; }
      }
      @keyframes bento3-wave {
        0% { transform: translateX(-45%); }
        100% { transform: translateX(45%); }
      }
      @keyframes bento3-pulse {
        0% { transform: scale(0.8); opacity: 0.6; }
        70% { opacity: 0.05; }
        100% { transform: scale(1.35); opacity: 0; }
      }
      .bento3-card {
        opacity: 0;
        transform: translate3d(0, 32px, 0);
        filter: blur(14px);
        transition: border-color 400ms ease, background 400ms ease, padding 300ms ease;
        padding: clamp(1.2rem, 3vw, 2.4rem);
        border-radius: clamp(1.5rem, 4vw, 28px);
      }
      .bento3-card[data-visible="true"] {
        animation: bento3-card-in 760ms cubic-bezier(0.22, 0.68, 0, 1) forwards;
        animation-delay: var(--bento3-delay, 0ms);
      }
      .bento3-icon {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: clamp(2.75rem, 6vw, 3.25rem);
        width: clamp(2.75rem, 6vw, 3.25rem);
        border-radius: 9999px;
        overflow: hidden;
        isolation: isolate;
      }
      .bento3-icon::before,
      .bento3-icon::after {
        content: "";
        position: absolute;
        inset: 4px;
        border-radius: inherit;
        border: 1px solid var(--bento3-icon-trail);
        opacity: 0.45;
      }
      .bento3-icon::after {
        inset: 10px;
        opacity: 0.2;
      }
      .bento3-icon[data-variant="orbit"] span {
        position: absolute;
        height: 140%;
        width: 3px;
        background: linear-gradient(180deg, transparent, var(--bento3-icon-stroke) 55%, transparent);
        transform-origin: center;
        animation: bento3-flare 8s linear infinite;
      }
      .bento3-icon[data-variant="relay"] span {
        position: absolute;
        inset: 18px;
        border-top: 1px solid var(--bento3-icon-stroke);
        border-bottom: 1px solid var(--bento3-icon-stroke);
        transform: skewX(-15deg);
      }
      .bento3-icon[data-variant="relay"] span::before,
      .bento3-icon[data-variant="relay"] span::after {
        content: "";
        position: absolute;
        height: 1px;
        width: 120%;
        left: -10%;
        background: linear-gradient(90deg, transparent, var(--bento3-icon-stroke), transparent);
        animation: bento3-dash 2.6s ease-in-out infinite;
      }
      .bento3-icon[data-variant="relay"] span::after {
        top: 70%;
        animation-delay: 0.9s;
      }
      .bento3-icon[data-variant="wave"] span {
        position: absolute;
        inset: 12px;
        border-radius: 999px;
        overflow: hidden;
      }
      .bento3-icon[data-variant="wave"] span::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent 5%, var(--bento3-icon-stroke) 50%, transparent 95%);
        transform: translateX(-45%);
        animation: bento3-wave 2.8s ease-in-out infinite alternate;
      }
      .bento3-icon[data-variant="spark"] span {
        position: absolute;
        inset: 0;
      }
      .bento3-icon[data-variant="spark"] span::before,
      .bento3-icon[data-variant="spark"] span::after {
        content: "";
        position: absolute;
        inset: 12px;
        border-radius: 9999px;
        border: 1px solid var(--bento3-icon-stroke);
        opacity: 0.28;
        animation: bento3-pulse 2.8s ease-out infinite;
      }
      .bento3-icon[data-variant="spark"] span::after {
        animation-delay: 0.9s;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIntroReady(true);
      setVisible(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => setIntroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!sectionRef.current || typeof window === "undefined") return;
    const node = sectionRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const palette = useMemo(() => palettes[theme as keyof typeof palettes], [theme]);

  const containerStyle = useMemo(
    () => ({
      "--bento3-grid-color": palette.gridColor,
      "--bento3-focus-glow": palette.focusGlow,
      "--bento3-icon-stroke": palette.iconStroke,
      "--bento3-icon-trail": palette.iconTrail,
    } as React.CSSProperties),
    [palette.gridColor, palette.focusGlow, palette.iconStroke, palette.iconTrail]
  );

  return (
    <div
      ref={sectionRef}
      className={`relative w-full overflow-hidden transition-colors duration-700 ${palette.surface}`}
      style={containerStyle}
    >
      <div className={`mx-auto w-full transition-opacity duration-1000 ${introReady && visible ? "opacity-100" : "opacity-0"}`}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:gap-8">
          {flows.map((flow, index) => (
            <FlowCard key={flow.id} flow={flow} palette={palette} index={index} visible={visible} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowCard({ flow, palette, index, visible }: { flow: any, palette: any, index: number, visible: boolean }) {
  const cardRef = useRef<HTMLElement>(null);

  const setGlow = (event: React.MouseEvent<HTMLElement>) => {
    const target = cardRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--bento3-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--bento3-y", `${event.clientY - rect.top}px`);
  };

  const clearGlow = () => {
    const target = cardRef.current;
    if (!target) return;
    target.style.removeProperty("--bento3-x");
    target.style.removeProperty("--bento3-y");
  };

  return (
    <article
      ref={cardRef}
      className={`bento3-card group relative flex flex-col justify-between overflow-hidden rounded-[28px] border ${palette.cardBorder} ${palette.card} p-6 md:p-8 transition-colors duration-500 min-h-[280px] sm:min-h-[320px]`}
      data-visible={visible}
      style={{ "--bento3-delay": `${index * 90}ms` } as React.CSSProperties}
      onMouseMove={setGlow}
      onMouseLeave={clearGlow}
    >
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start z-10">
        <div className="flex flex-col gap-4 lg:flex-1">
          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.4em] ${palette.cardBorder} ${palette.muted}`}>
            {flow.meta}
          </span>
          <h3 className={`text-xl font-semibold leading-tight sm:text-2xl ${palette.heading}`}>{flow.title}</h3>
          <p className={`text-sm leading-relaxed sm:text-base ${palette.muted}`}>{flow.description}</p>
        </div>
        <div className={`mt-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${palette.cardBorder} ${palette.card} sm:h-14 sm:w-14 lg:ml-auto lg:mt-0 lg:h-16 lg:w-16`}>
          <AnimatedIcon variant={flow.variant} />
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 text-[0.65rem] uppercase tracking-[0.25em] opacity-70 sm:text-xs sm:tracking-[0.35em] sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <span className="text-center sm:text-left">{flow.statLabel}</span>
        <span className="text-center font-semibold text-current sm:text-right">{flow.statValue}</span>
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(300px circle at var(--bento3-x, 50%) var(--bento3-y, 50%), var(--bento3-focus-glow), transparent 68%)`,
        }}
      />
    </article>
  );
}

function AnimatedIcon({ variant }: { variant: string }) {
  return (
    <span className="bento3-icon" data-variant={variant}>
      <span />
    </span>
  );
}
