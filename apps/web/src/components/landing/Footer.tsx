'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer id="footer" className="w-full border-t border-white/[0.06] bg-[#050508] pt-20 pb-10 z-10 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-8">
        
        <div className="flex flex-col">
          <div className="text-xl font-bold tracking-[0.2em] font-sans text-white mb-4">
            SYN<span className="text-indigo-500">Q</span>
          </div>
          <div className="text-sm text-white/40 leading-relaxed">
            &copy; {new Date().getFullYear()} SYNQ Systems, Inc.<br />
            All rights reserved.
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white font-semibold mb-2">Connect</div>
          <div className="text-sm text-white/50">Rushi Khalate</div>
          <a href="tel:+917020495651" className="text-sm text-white/50 hover:text-white transition-colors">+91 7020495651</a>
          <a href="mailto:rushipk16@gmail.com" className="text-sm text-white/50 hover:text-white transition-colors">rushipk16@gmail.com</a>
          <a href="http://github.com/RUSHI-0007/" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">GitHub: RUSHI-0007</a>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white font-semibold mb-2">Product</div>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Integrations</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Changelog</a>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white font-semibold mb-2">Resources</div>
          <a href="https://docs.synq.com" target="_blank" className="text-sm text-white/50 hover:text-white transition-colors">Documentation</a>
          <a href="https://api.synq.com" target="_blank" className="text-sm text-white/50 hover:text-white transition-colors">API Reference</a>
          <a href="https://discord.gg/synq" target="_blank" className="text-sm text-white/50 hover:text-white transition-colors">Community</a>
          <Link href="/blog" className="text-sm text-white/50 hover:text-white transition-colors">Blog</Link>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white font-semibold mb-2">Company</div>
          <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors">About</Link>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Careers</a>
          <Link href="/legal" className="text-sm text-white/50 hover:text-white transition-colors">Legal</Link>
          <Link href="/contact" className="text-sm text-white/50 hover:text-white transition-colors">Contact</Link>
        </div>

      </div>
    </footer>
  );
}
