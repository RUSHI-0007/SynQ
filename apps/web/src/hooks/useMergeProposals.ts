import { useState, useEffect } from 'react';
import { MergeProposal } from '@hackathon/shared-types';

export function useMergeProposals(projectId: string) {
  const [proposals, setProposals] = useState<MergeProposal[]>([]);

  useEffect(() => {
    // Boilerplate state hydration
    setProposals([]);
  }, [projectId]);

  const proposeMerge = async (diff: string) => {
    const res = await fetch('/api/merge/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, diff })
    });
    const data = await res.json();
    setProposals(prev => [...prev, data]);
  };

  return { proposals, proposeMerge };
}
