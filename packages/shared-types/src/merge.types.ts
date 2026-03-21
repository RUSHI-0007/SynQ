export interface MergeProposal {
  id: string;
  projectId: string;
  authorId: string;
  title: string;
  description?: string;
  filesChanged: string[];
  diffPayload: string;
  status: 'pending' | 'accepted' | 'rejected' | 'merged';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalVote {
  proposalId: string;
  voterId: string;
  vote: 'approve' | 'reject';
  createdAt: Date;
}

export interface DiffHunk {
  fileName: string;
  diff: string;
}
