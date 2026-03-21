'use client';

import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { RainbowButton } from '@/components/ui/RainbowButton';

interface NavBarProps {
  onLoginClick: () => void;
}

export function NavBar({ onLoginClick }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link href="/dashboard" className="text-white/80 hover:text-white transition-colors text-[13px] font-medium mr-2 hidden sm:block">
            Dashboard &rarr;
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        {/* Hamburger Icon */}
        <button 
          className="md:hidden text-white ml-2 p-1 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-[60px] left-0 w-full bg-[#0a0a10]/95 backdrop-blur-xl border-b border-white/10 md:hidden flex flex-col items-center py-6 gap-6 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white font-medium">Features</a>
          <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white font-medium">Platform</a>
          <a href="#foundation" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white font-medium">Stack</a>
          <a href="#cta" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white font-medium">Pricing</a>
          <a href="#footer" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white font-medium">Docs</a>
          
          <div className="flex flex-col items-center gap-4 mt-4 w-full px-6">
            <SignedOut>
              <button 
                onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}
                className="text-white font-medium w-full py-2 bg-white/5 rounded-full border border-white/10"
              >
                Log in
              </button>
              <RainbowButton onClick={() => { setMobileMenuOpen(false); onLoginClick(); }} className="w-full">
                Get Early Access
              </RainbowButton>
            </SignedOut>
            <SignedIn>
              <Link 
                href="/dashboard" 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-white font-medium w-full py-2 bg-indigo-600 rounded-full text-center"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}
