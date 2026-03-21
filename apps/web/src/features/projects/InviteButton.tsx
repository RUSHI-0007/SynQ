'use client';
import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

interface InviteButtonProps {
  projectId: string;
  className?: string;
}

export function InviteButton({ projectId, className = '' }: InviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Build an absolute URL that works on both localhost and Vercel
    const base = window.location.origin;
    const link = `${base}/join/${projectId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: open a prompt so the user can copy manually
      window.prompt('Copy this link to invite teammates:', link);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy invite link"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        transition-all duration-200
        ${copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 hover:text-indigo-200'
        } ${className}`}
    >
      {copied ? (
        <>
          <Check size={13} className="shrink-0" />
          Link Copied!
        </>
      ) : (
        <>
          <Link2 size={13} className="shrink-0" />
          Invite
        </>
      )}
    </button>
  );
}
