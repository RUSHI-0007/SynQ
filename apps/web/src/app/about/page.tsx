import { DocsLayout } from '@/components/layout/DocsLayout';

export default function AboutPage() {
  const toc = [
    { id: 'our-mission', title: 'Our Mission', level: 2 },
    { id: 'the-technology', title: 'The Technology', level: 2 },
    { id: 'why-we-do-it', title: 'Why We Do It', level: 2 },
  ];

  return (
    <DocsLayout toc={toc}>
      <h1 className="text-4xl font-extrabold text-white mb-6">About SYNQ</h1>
      <p className="lead text-xl text-neutral-300 font-medium mb-12">
        We are building the first genuinely multiplayer cloud IDE designed for hackathon teams and rapid prototyping.
      </p>

      <div className="flex items-center gap-2 text-sm text-neutral-500 border-y border-white/[0.06] py-4 mb-10">
        <span>Founded by Rushi Khalate</span>
        <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
        <span>Est. October 2026</span>
      </div>

      <h2 id="our-mission" className="text-2xl font-bold text-white mt-12 mb-4 scroll-m-20">Our Mission</h2>
      <p>
        The way teams write code during fast-paced events like hackathons has remained stagnant. Constant merge conflicts, broken environments, and "it works on my machine" excuses are the norm. SYNQ is here to eliminate that friction entirely by providing a unified sandbox where every teammate can collaborate, compile, and execute code simultaneously.
      </p>

      <h2 id="the-technology" className="text-2xl font-bold text-white mt-12 mb-4 scroll-m-20">The Technology</h2>
      <p>
        Built on top of robust CRDTs (Yjs) for sub-50ms keystroke syncing and scalable Docker infrastructure, SYNQ provides isolated, high-performance environments instantly. Our proprietary <strong>Consensus Merge</strong> system ensures that code requires team approval before reaching your main GitHub branch, acting as an automated gatekeeper for production quality.
      </p>

      <h2 id="why-we-do-it" className="text-2xl font-bold text-white mt-12 mb-4 scroll-m-20">Why We Do It</h2>
      <p>
        We believe that when you remove infrastructure bottlenecks, pure creativity flourishes. By combining real-time collaboration with built-in voice channels (LiveKit) and a seamless developer experience, SYNQ aims to become the de-facto standard for collaborative software engineering.
      </p>
    </DocsLayout>
  );
}
