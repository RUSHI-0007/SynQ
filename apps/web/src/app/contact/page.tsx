'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';

export default function ContactPage() {
  const toc = [
    { id: 'get-in-touch', title: 'Get in Touch', level: 2 },
    { id: 'founder', title: 'Founder', level: 3 },
    { id: 'phone', title: 'Phone', level: 3 },
    { id: 'email', title: 'Email', level: 3 },
    { id: 'github', title: 'GitHub', level: 3 },
    { id: 'send-a-message', title: 'Send a Message', level: 2 },
  ];

  return (
    <DocsLayout toc={toc}>
      <h1 className="text-4xl font-extrabold text-white mb-6">Contact</h1>
      <p className="lead text-xl text-neutral-300 font-medium mb-12">
        Have questions about SYNQ? Looking to integrate our platform for your next hackathon or engineering team? Reach out to us.
      </p>

      <h2 id="get-in-touch" className="text-2xl font-bold text-white mt-12 mb-6 scroll-m-20 border-b border-white/[0.06] pb-4">
        Get in Touch
      </h2>

      <p className="mb-6">
        We are actively building the future of collaborative IDEs. Feel free to connect directly using the methods below.
      </p>

      <div className="not-prose grid gap-4 mb-12">
        <a href="mailto:rushipk16@gmail.com" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex justify-center items-center text-lg shadow-sm">✉️</div>
          <div>
            <h3 id="email" className="font-semibold text-white text-sm m-0 scroll-m-20">Email Us</h3>
            <p className="text-neutral-500 text-xs m-0 mt-0.5">rushipk16@gmail.com</p>
          </div>
        </a>

        <a href="tel:+917020495651" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex justify-center items-center text-lg shadow-sm">📱</div>
          <div>
            <h3 id="phone" className="font-semibold text-white text-sm m-0 scroll-m-20">Phone</h3>
            <p className="text-neutral-500 text-xs m-0 mt-0.5">+91 7020495651</p>
          </div>
        </a>

        <a href="http://github.com/RUSHI-0007/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex justify-center items-center text-lg shadow-sm">🐙</div>
          <div>
            <h3 id="github" className="font-semibold text-white text-sm m-0 scroll-m-20">GitHub</h3>
            <p className="text-neutral-500 text-xs m-0 mt-0.5">github.com/RUSHI-0007</p>
          </div>
        </a>

        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors p-4 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex justify-center items-center text-lg shadow-sm">🧑‍💻</div>
          <div>
            <h3 id="founder" className="font-semibold text-white text-sm m-0 scroll-m-20">Founder</h3>
            <p className="text-neutral-500 text-xs m-0 mt-0.5">Rushi Khalate</p>
          </div>
        </div>
      </div>

      <h2 id="send-a-message" className="text-2xl font-bold text-white mt-12 mb-6 scroll-m-20 border-b border-white/[0.06] pb-4">
        Send a Message
      </h2>

      <div className="not-prose bg-black border border-white/[0.08] p-6 rounded-2xl shadow-xl mt-6">
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400">Name</label>
            <input type="text" placeholder="John Doe" className="bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400">Email</label>
            <input type="email" placeholder="john@company.com" className="bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400">Message</label>
            <textarea rows={4} placeholder="How can we help?" className="bg-white/[0.02] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600 text-white resize-none"></textarea>
          </div>
          <button className="mt-4 bg-white text-black hover:bg-neutral-200 font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm">
            Send Message
          </button>
        </form>
      </div>

    </DocsLayout>
  );
}
