'use client';

export function Footer() {
  return (
    <footer id="footer" className="w-full border-t border-white/[0.06] bg-[#050508] pt-20 pb-10 z-10 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
        
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
          <div className="text-white font-semibold mb-2">Product</div>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Integrations</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Changelog</a>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white font-semibold mb-2">Resources</div>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Documentation</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">API Reference</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Community</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Blog</a>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-white font-semibold mb-2">Company</div>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">About</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Careers</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Legal</a>
          <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Contact</a>
        </div>

      </div>
    </footer>
  );
}
