'use client';

import React from 'react';

export function PresenceAvatars({ users }: { users: string[] }) {
  return (
    <div className="flex -space-x-2 overflow-hidden items-center">
      {users.map((userId, idx) => (
        <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
          {userId.substring(0, 2).toUpperCase()}
        </div>
      ))}
      {users.length === 0 && (
        <span className="text-sm text-slate-500 pl-2">Only you</span>
      )}
    </div>
  );
}
