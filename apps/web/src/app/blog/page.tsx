import { DocsLayout } from '@/components/layout/DocsLayout';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function BlogPage() {
  const toc = [
    { id: 'all-posts', title: 'All Posts', level: 2 },
  ];

  const posts = [
    {
      id: 1,
      title: 'Introducing SYNQ',
      excerpt: 'Why we built SYNQ to solve the exact problems we faced at every hackathon.',
      date: 'January 1, 2026',
      author: 'SYNQ Team'
    },
    {
      id: 2,
      title: 'Yjs CRDT Synchronization',
      excerpt: 'Deep dive into our implementation of Yjs CRDTs and how it creates a buttery-smooth sync experience.',
      date: 'January 20, 2026',
      author: 'SYNQ Labs'
    },
    {
      id: 3,
      title: 'The Power of Consensus Merging',
      excerpt: 'Stop breaking the main branch. How SYNQ implements team voting natively into the workspace.',
      date: 'February 15, 2026',
      author: 'SYNQ Engineering'
    }
  ];

  return (
    <DocsLayout toc={toc}>
      <h1 className="text-4xl font-extrabold text-white mb-4">Blog</h1>
      <p className="lead text-lg text-neutral-400 mb-10">
        Guides, tutorials, technical deep dives, and system notes from the SYNQ team.
      </p>

      <h2 id="all-posts" className="text-2xl font-bold text-white mt-12 mb-6 scroll-m-20 border-b border-white/[0.06] pb-4">All Posts</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
        {posts.map((post) => (
          <Link 
            href="#" 
            key={post.id} 
            className="group flex flex-col justify-between p-5 rounded-xl border border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {post.title}
                </h3>
                <ArrowUpRight size={16} className="text-neutral-600 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
              <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed mb-6">
                {post.excerpt}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 uppercase tracking-wider mt-auto">
              <span>{post.date}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-700" />
              <span>{post.author}</span>
            </div>
          </Link>
        ))}
      </div>
    </DocsLayout>
  );
}
