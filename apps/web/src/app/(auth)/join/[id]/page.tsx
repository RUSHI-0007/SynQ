'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'joining' | 'success' | 'error';

export default function JoinProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    // If the user isn't signed in, redirect to Clerk's sign-in,
    // then come back to this URL automatically.
    if (!isSignedIn || !userId) {
      router.push(`/sign-in?redirect_url=/join/${id}`);
      return;
    }

    // They're logged in — join the project
    async function joinProject() {
      setStatus('joining');
      try {
        const res = await fetch(getApiUrl(`api/projects/${id}/join`), {
          method: 'POST',
          headers: {
            ...getApiHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Server returned ${res.status}`);
        }

        setStatus('success');
        // Give the user a moment to see the success screen before landing in the IDE
        setTimeout(() => router.push(`/projects/${id}`), 1500);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
        setStatus('error');
      }
    }

    void joinProject();
  }, [isLoaded, isSignedIn, userId, id, router]);

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
        {status === 'loading' || status === 'joining' ? (
          <>
            <Loader2 className="animate-spin text-indigo-400" size={40} />
            <p className="text-zinc-300 text-lg font-semibold">
              {status === 'loading' ? 'Verifying your session…' : 'Joining project…'}
            </p>
            <p className="text-zinc-500 text-sm">This will only take a second.</p>
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
