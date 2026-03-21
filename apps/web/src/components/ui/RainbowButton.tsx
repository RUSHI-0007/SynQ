'use client';

import React from 'react';

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function RainbowButton({ children, className = '', ...props }: RainbowButtonProps) {
  return (
    <button
      className={`relative group overflow-hidden rounded-full p-[1px] transition-all active:scale-95 ${className}`}
      {...props}
    >
      {/* Animated Gradient Border */}
      <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] group-hover:animate-[spin_2s_linear_infinite]" />
      
      {/* Button Content Container */}
      <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-4 text-sm font-medium text-white backdrop-blur-3xl transition-all group-hover:bg-slate-950/90">
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </div>
      
      {/* Outer Glow */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 -z-10" />
    </button>
  );
}
