'use client';

import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { RainbowButton } from '@/components/ui/RainbowButton';

interface NavBarProps {
  onLoginClick: () => void;
}

export function NavBar({ onLoginClick }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full h-[60px] flex items-center justify-between px-6 md:px-10 z-[999] transition-all duration-500 ${
      scrolled ? 'bg-[#0a0a10]/40 backdrop-blur-xl saturate-150 border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]' : 'bg-transparent border-b-transparent'
    }`}>
      <div className="text-base font-bold tracking-[0.2em] font-sans text-white cursor-pointer select-none">
        SYN<span className="text-indigo-500">Q</span>
      </div>
      
      <div className="hidden md:flex gap-8 text-[13px] font-medium">
        <a href="#hero" className="text-white/65 hover:text-white transition-colors duration-200">Features</a>
        <a href="#platform" className="text-white/65 hover:text-white transition-colors duration-200">Platform</a>
        <a href="#foundation" className="text-white/65 hover:text-white transition-colors duration-200">Stack</a>
        <a href="#cta" className="text-white/65 hover:text-white transition-colors duration-200">Pricing</a>
        <a href="#footer" className="text-white/65 hover:text-white transition-colors duration-200">Docs</a>
      </div>

      <div className="flex gap-4 items-center">
        <SignedOut>
          <button 
            onClick={onLoginClick}
            className="text-white/80 hover:text-white transition-colors text-[13px] font-medium hidden sm:block"
          >
            Log in
          </button>
          <RainbowButton onClick={onLoginClick} className="scale-[0.85] origin-right">
            Get Early Access
          </RainbowButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="text-white/80 hover:text-white transition-colors text-[13px] font-medium mr-2">
            Dashboard &rarr;
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}
