import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MergeProposal, ProposalVote } from '@hackathon/shared-types';

export function useConsensus(projectId: string) {
  const [activeProposal, setActiveProposal] = useState<MergeProposal | null>(null);
  const [votes, setVotes] = useState<ProposalVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    const fetchInitialState = async () => {
      // 1. Get the latest pending/accepted proposal
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('*')
        .eq('projectId', projectId)
        .in('status', ['pending', 'accepted'])
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();
        
      if (!mounted) return;

      if (proposalData) {
        setActiveProposal(proposalData as MergeProposal);
        
        // 2. Get votes for this proposal
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('proposalId', proposalData.id);
          
        if (mounted && voteData) {
          setVotes(voteData as ProposalVote[]);
        }
      } else {
        setActiveProposal(null);
        setVotes([]);
      }
    };

    fetchInitialState();

    // 3. Subscribe to Proposal Changes
    const proposalSub = supabase.channel(`proposals-room:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposals', filter: `projectId=eq.${projectId}` },
        (payload: any) => {
          const newDoc = payload.new as MergeProposal;
          if (newDoc.status === 'pending' || newDoc.status === 'accepted') {
            setActiveProposal(newDoc);
            supabase.from('votes').select('*').eq('proposalId', newDoc.id).then(({data}: {data: any[] | null}) => {
              if (mounted && data) setVotes(data as ProposalVote[]);
            });
          } else if (newDoc.status === 'merged' || newDoc.status === 'rejected') {
            setActiveProposal(null);
            setVotes([]);
          }
        }
      )
      .subscribe();

    // 4. Subscribe to Vote Changes
    const voteSub = supabase.channel(`votes-room:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        (payload: any) => {
          const newVote = payload.new as ProposalVote;
          setVotes((prev) => {
            const existingIndex = prev.findIndex(v => v.voterId === newVote.voterId && v.proposalId === newVote.proposalId);
            if (existingIndex > -1) {
              const copy = [...prev];
              copy[existingIndex] = newVote;
              return copy;
            }
            return [...prev, newVote];
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(proposalSub);
      supabase.removeChannel(voteSub);
    };
  }, [projectId]);

  const proposeMerge = useCallback(async (
    authorId: string, 
    filesChanged: string[], 
    diffPayload: string
  ): Promise<MergeProposal> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/merge/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, authorId, filesChanged, diffPayload }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (err: any) {
      setError(err.message);
      console.error('Propose Merge failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const castVote = useCallback(async (
    proposalId: string, 
    voterId: string, 
    vote: 'approve' | 'reject'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/merge/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, voterId, vote }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err: any) {
      setError(err.message);
      console.error('Cast Vote failed:', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  const totalVotes = votes.length;
  const approvalsCount = votes.filter(v => v.vote === 'approve').length;
  const rejectionsCount = votes.filter(v => v.vote === 'reject').length;

  return {
    activeProposal,
    votes,
    totalVotes,
    approvalsCount,
    rejectionsCount,
    loading,
    error,
    proposeMerge,
    castVote
  };
}
