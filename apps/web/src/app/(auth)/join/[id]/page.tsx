'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'prompt_role' | 'joining' | 'success' | 'error';

export default function JoinProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    // If the user isn't signed in, redirect to Clerk's sign-in,
    // then come back to this URL automatically.
    if (!isSignedIn || !userId) {
      router.push(`/sign-in?redirect_url=/join/${id}`);
      return;
    }

    // They're logged in — ask for their role
    setStatus('prompt_role');
  }, [isLoaded, isSignedIn, userId, id, router]);

  async function handleJoin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!userId) return;
    if (!role.trim()) return;

    setStatus('joining');
    try {
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/projects/${id}/join`), {
        method: 'POST',
        headers: {
          ...getApiHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, customRole: role.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }

      setStatus('success');
      // Give the user a moment to see the success screen before landing in the IDE
      setTimeout(() => router.push(`/projects/${id}`), 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
        {status === 'loading' ? (
          <>
            <Loader2 className="animate-spin text-indigo-400" size={40} />
            <p className="text-zinc-300 text-lg font-semibold">Verifying your session…</p>
            <p className="text-zinc-500 text-sm">This will only take a second.</p>
          </>
        ) : status === 'prompt_role' ? (
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <h2 className="text-xl font-bold text-white tracking-tight">Join Sandbox</h2>
             <p className="text-sm text-zinc-400 mb-2">What will be your role on this team?</p>
             <input 
               type="text" 
               placeholder="e.g. Frontend developer, Designer..." 
               value={role}
               onChange={(e) => setRole(e.target.value)}
               className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
               autoFocus
             />
             <button 
               type="submit"
               disabled={!role.trim()}
               className="mt-2 w-full py-3 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
             >
               Enter Workspace
             </button>
          </form>
        ) : status === 'joining' ? (
          <>
            <Loader2 className="animate-spin text-indigo-400" size={40} />
            <p className="text-zinc-300 text-lg font-semibold">Configuring your role…</p>
            <p className="text-zinc-500 text-sm">Validating invite link.</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="text-emerald-400" size={40} />
            <p className="text-zinc-100 text-lg font-semibold">You&apos;re in! 🎉</p>
            <p className="text-zinc-400 text-sm">Redirecting you to the workspace…</p>
          </>
        ) : (
          <>
            <AlertCircle className="text-red-400" size={40} />
            <p className="text-zinc-100 text-lg font-semibold">Couldn&apos;t join project</p>
            <p className="text-zinc-500 text-sm">{errorMsg}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
