import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { CheckCircle2, XCircle, Loader2, GitMerge } from 'lucide-react';
import { useConsensus } from './useConsensus';

interface ConsensusModalProps {
  projectId: string;
  currentUserId: string;
  originalCode: string;
  teamSize?: number;
}

export function ConsensusModal({ 
  projectId, 
  currentUserId, 
  originalCode,
  teamSize = 2 
}: ConsensusModalProps) {
  
  const { 
    activeProposal, 
    votes, 
    approvalsCount, 
    loading, 
    castVote 
  } = useConsensus(projectId);

  if (!activeProposal) return null;

  const hasVotedApprove = votes.some(v => v.voterId === currentUserId && v.vote === 'approve');
  const hasVotedReject = votes.some(v => v.voterId === currentUserId && v.vote === 'reject');
  const hasVoted = hasVotedApprove || hasVotedReject;

  // Assuming `diffPayload` contains the entire proposed new file state for this scaffold
  const modifiedCode = activeProposal.diffPayload;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-6xl h-[85vh] bg-[#0d0d0d] border border-gray-800 shadow-2xl overflow-hidden rounded-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-500/10 text-blue-400">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100 tracking-tight">
                Consensus Merge Required
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Proposal ID: {activeProposal.id} • Author: {activeProposal.authorId}
              </p>
            </div>
          </div>

          {/* Progress / Status */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
                Consensus Status
              </span>
              <div className="flex items-center gap-2">
                {/* Progress Bar */}
                <div className="flex w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(approvalsCount / teamSize) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-gray-300">
                  {approvalsCount}/{teamSize} Approved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diff Viewer Body */}
        <div className="flex-1 w-full bg-[#1e1e1e] relative">
          <DiffEditor
            height="100%"
            language="javascript" // or dynamically determined by filesChanged[0]
            original={originalCode}
            modified={modifiedCode}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-[#141414]">
          <div className="text-sm text-gray-500">
            {activeProposal.status === 'accepted' ? (
              <span className="text-green-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Merging via Octokit...
              </span>
            ) : (
              <span>Review the changes on the right before voting.</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => castVote(activeProposal.id, currentUserId, 'reject')}
              disabled={loading || hasVoted || activeProposal.status !== 'pending'}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                hasVotedReject 
                 ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
                 : 'bg-transparent text-gray-400 border border-gray-700 hover:border-red-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            
            <button
              onClick={() => castVote(activeProposal.id, currentUserId, 'approve')}
              disabled={loading || hasVoted || activeProposal.status !== 'pending'}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                hasVotedApprove
                 ? 'bg-green-500 text-black border border-green-500'
                 : 'bg-gray-800 text-green-400 border border-green-500/50 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {hasVotedApprove ? 'Approved' : 'Approve'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
