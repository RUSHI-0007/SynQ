'use client';

import React from 'react';
import { MergeProposal } from '@hackathon/shared-types';

interface MergeProposalCardProps {
  proposal: MergeProposal;
  onVote: (vote: 'accept' | 'reject') => void;
}

export function MergeProposalCard({ proposal, onVote }: MergeProposalCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 p-4 rounded-md mb-2">
      <h3 className="text-lg font-medium text-white">{proposal.title}</h3>
      <p className="text-sm text-slate-400 mb-4">Proposed by {proposal.authorId}</p>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onVote('accept')}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
        >
          Accept
        </button>
        <button 
          onClick={() => onVote('reject')}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
