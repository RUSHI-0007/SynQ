'use client';
import { useState, useRef, useEffect } from 'react';
import { UserPlus, X, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';

interface InviteButtonProps {
  projectId: string;
  className?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function InviteButton({ projectId, className = '' }: InviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  // Auto focus the email input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setEmail('');
    setStatus('idle');
    setMessage('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/projects/${projectId}/invite`), {
        method: 'POST',
        headers: {
          ...getApiHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const body = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(body.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(`${body.name ?? email} has been added to the project! 🎉`);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 
          hover:bg-indigo-500/30 hover:text-indigo-200 transition-all duration-200
          ${className}`}
      >
        <UserPlus size={13} className="shrink-0" />
        Invite
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* Modal card */}
          <div
            className="relative w-full max-w-md mx-4 bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <UserPlus size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-zinc-100 font-semibold text-base">Invite a Teammate</h2>
                <p className="text-zinc-500 text-xs">Enter their email address to add them to this project</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle') { setStatus('idle'); setMessage(''); }
                  }}
                  placeholder="teammate@example.com"
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-sm
                    placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                    disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!email.trim() || status === 'loading'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
                    text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {status === 'loading' ? 'Adding…' : 'Send'}
                </button>
              </div>

              {/* Feedback message */}
              {message && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm border ${
                  status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {status === 'success'
                    ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    : <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  }
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
