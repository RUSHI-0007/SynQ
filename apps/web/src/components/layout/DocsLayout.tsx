'use client';

import { useState } from 'react';
import { NavBar } from '@/components/landing/NavBar';
import { Footer } from '@/components/landing/Footer';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const SignInPage = dynamic(
  () => import('@/components/ui/sign-in-flow-1').then(m => m.SignInPage),
  { ssr: false }
);

interface DocsLayoutProps {
  children: React.ReactNode;
  toc?: { id: string; title: string; level: number }[];
}

export function DocsLayout({ children, toc = [] }: DocsLayoutProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const pathname = usePathname();

  const navGroups = [
    {
      title: 'Company',
      items: [
        { title: 'About', href: '/about' },
        { title: 'Contact', href: '/contact' },
        { title: 'Legal', href: '/legal' }
      ]
    },
    {
      title: 'Resources',
      items: [
        { title: 'Blog', href: '/blog' }
      ]
    }
  ];

  return (
    <div className="bg-[#050508] min-h-screen w-full overflow-x-hidden text-neutral-300 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* Top Navbar */}
      <NavBar onLoginClick={() => setIsLoginOpen(true)} />
      
      {/* Main Docs Shell */}
      <div className="flex-grow pt-[60px] pb-20 px-6 mx-auto w-full max-w-[1440px] flex md:gap-8 lg:gap-12 relative">
        
        {/* Left Sidebar (Tree Nav) */}
        <aside className="sticky top-[60px] h-[calc(100vh-60px)] w-64 flex-shrink-0 hidden md:flex flex-col border-r border-white/[0.06] py-8 pr-6 overflow-y-auto custom-scrollbar">
          
          {/* Fake Search Bar */}
          <button className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors rounded-lg px-3 py-2 text-sm text-neutral-500 w-full mb-8 text-left">
            <Search size={14} />
            <span className="flex-1">Search documentation...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] font-medium text-neutral-500 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <nav className="flex flex-col gap-8 flex-1">
            {navGroups.map((group, i) => (
              <div key={i} className="flex flex-col gap-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  {group.title}
                </h4>
                <div className="flex flex-col gap-1 border-l border-white/[0.06] ml-1.5 pl-3">
                  {group.items.map((item, j) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={j}
                        href={item.href}
                        className={`text-[13px] hover:text-white transition-colors py-1 ${
                          isActive ? 'text-indigo-400 font-semibold' : 'text-neutral-400 font-medium'
                        }`}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Center Main Content */}
        <main className="flex-1 py-10 min-w-0 max-w-4xl w-full">
          <article className="prose prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-p:text-neutral-400 max-w-none">
            {children}
          </article>
          
          <div className="mt-20 pt-10 border-t border-white/[0.06]">
            <p className="text-xs text-neutral-500">
              Last updated on {new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </main>

        {/* Right Sidebar (Table of Contents) */}
        <aside className="sticky top-[60px] h-[calc(100vh-60px)] w-64 flex-shrink-0 hidden xl:flex flex-col py-10 pl-4 overflow-y-auto">
          {toc.length > 0 ? (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-white">On this page</span>
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {toc.map((heading, i) => (
                  <li key={i} style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}>
                    <a href={`#${heading.id}`} className="text-neutral-500 hover:text-white transition-colors line-clamp-1">
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-3 opacity-50">
              <span className="text-xs font-semibold text-white">On this page</span>
              <span className="text-[13px] text-neutral-500">—</span>
            </div>
          )}
        </aside>

      </div>

      <Footer />

      {isLoginOpen && <SignInPage onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
}
