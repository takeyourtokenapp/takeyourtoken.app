import { supabase } from '../lib/supabase';

export type ProposalType =
  | 'discount_curve'
  | 'maintenance_fee'
  | 'burn_schedule'
  | 'charity_allocation'
  | 'feature_request'
  | 'parameter_change';

export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed';

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposalType: ProposalType;
  status: ProposalStatus;
  creatorId: string;
  creatorName: string;
  votesFor: number;
  votesAgainst: number;
  quorumRequired: number;
  startDate: string;
  endDate: string;
  executionData?: Record<string, unknown>;
  createdAt: string;
}

export interface VoteRecord {
  id: string;
  proposalId: string;
  userId: string;
  veTytBalance: number;
  voteDirection: 'for' | 'against' | 'abstain';
  votedAt: string;
}

export interface VeTYTBalance {
  userId: string;
  totalLocked: number;
  veTytBalance: number;
  lockDuration: number;
  unlockDate: string;
  votingPower: number;
}

const VETYT_MULTIPLIERS: Record<number, number> = {
  7: 0.25,
  30: 0.5,
  90: 1.0,
  180: 1.5,
  365: 2.0,
  730: 3.0,
  1460: 4.0
};

export function calculateVeTYT(lockedTyt: number, lockDays: number): number {
  let multiplier = 0.25;

  for (const [days, mult] of Object.entries(VETYT_MULTIPLIERS)) {
    if (lockDays >= parseInt(days)) {
      multiplier = mult;
    }
  }

  return lockedTyt * multiplier;
}

export async function getUserVeTYT(userId: string): Promise<VeTYTBalance | null> {
  const { data, error } = await supabase
    .from('vetyt_locks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;

  const now = new Date();
  const unlockDate = new Date(data.unlock_at);
  const lockDays = Math.floor((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const veTytBalance = calculateVeTYT(data.amount, lockDays);

  return {
    userId: data.user_id,
    totalLocked: data.amount,
    veTytBalance,
    lockDuration: lockDays,
    unlockDate: data.unlock_at,
    votingPower: veTytBalance
  };
}

export async function getActiveProposals(): Promise<GovernanceProposal[]> {
  const { data, error } = await supabase
    .from('governance_proposals')
    .select(`
      *,
      profiles:creator_id(display_name)
    `)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    proposalType: p.proposal_type,
    status: p.status,
    creatorId: p.creator_id,
    creatorName: p.profiles?.display_name || 'Anonymous',
    votesFor: p.votes_for || 0,
    votesAgainst: p.votes_against || 0,
    quorumRequired: p.quorum_required,
    startDate: p.start_date,
    endDate: p.end_date,
    executionData: p.execution_data,
    createdAt: p.created_at
  }));
}

export async function getAllProposals(options: {
  status?: ProposalStatus;
  type?: ProposalType;
  limit?: number;
  offset?: number;
} = {}): Promise<GovernanceProposal[]> {
  const { status, type, limit = 20, offset = 0 } = options;

  let query = supabase
    .from('governance_proposals')
    .select(`
      *,
      profiles:creator_id(display_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (type) {
    query = query.eq('proposal_type', type);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    proposalType: p.proposal_type,
    status: p.status,
    creatorId: p.creator_id,
    creatorName: p.profiles?.display_name || 'Anonymous',
    votesFor: p.votes_for || 0,
    votesAgainst: p.votes_against || 0,
    quorumRequired: p.quorum_required,
    startDate: p.start_date,
    endDate: p.end_date,
    executionData: p.execution_data,
    createdAt: p.created_at
  }));
}

export async function getProposalById(proposalId: string): Promise<GovernanceProposal | null> {
  const { data, error } = await supabase
    .from('governance_proposals')
    .select(`
      *,
      profiles:creator_id(display_name)
    `)
    .eq('id', proposalId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    proposalType: data.proposal_type,
    status: data.status,
    creatorId: data.creator_id,
    creatorName: data.profiles?.display_name || 'Anonymous',
    votesFor: data.votes_for || 0,
    votesAgainst: data.votes_against || 0,
    quorumRequired: data.quorum_required,
    startDate: data.start_date,
    endDate: data.end_date,
    executionData: data.execution_data,
    createdAt: data.created_at
  };
}

export async function castVote(
  proposalId: string,
  userId: string,
  direction: 'for' | 'against' | 'abstain'
): Promise<{ success: boolean; error?: string }> {
  const veTyt = await getUserVeTYT(userId);
  if (!veTyt || veTyt.veTytBalance <= 0) {
    return { success: false, error: 'No veTYT balance to vote with' };
  }

  const { data: existingVote } = await supabase
    .from('governance_votes')
    .select('id')
    .eq('proposal_id', proposalId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingVote) {
    return { success: false, error: 'Already voted on this proposal' };
  }

  const { data: proposal } = await supabase
    .from('governance_proposals')
    .select('status, end_date')
    .eq('id', proposalId)
    .maybeSingle();

  if (!proposal || proposal.status !== 'active') {
    return { success: false, error: 'Proposal is not active' };
  }

  if (new Date(proposal.end_date) < new Date()) {
    return { success: false, error: 'Voting period has ended' };
  }

  const { error: voteError } = await supabase
    .from('governance_votes')
    .insert({
      proposal_id: proposalId,
      user_id: userId,
      vetyt_amount: veTyt.veTytBalance,
      vote_direction: direction
    });

  if (voteError) {
    return { success: false, error: 'Failed to record vote' };
  }

  const updateField = direction === 'for' ? 'votes_for' : direction === 'against' ? 'votes_against' : null;

  if (updateField) {
    await supabase.rpc('increment_proposal_votes', {
      p_proposal_id: proposalId,
      p_field: updateField,
      p_amount: veTyt.veTytBalance
    });
  }

  return { success: true };
}

export async function createProposal(
  userId: string,
  proposal: {
    title: string;
    description: string;
    type: ProposalType;
    durationDays: number;
    executionData?: Record<string, unknown>;
  }
): Promise<{ success: boolean; proposalId?: string; error?: string }> {
  const veTyt = await getUserVeTYT(userId);
  const minVeTyt = 1000;

  if (!veTyt || veTyt.veTytBalance < minVeTyt) {
    return {
      success: false,
      error: `Minimum ${minVeTyt} veTYT required to create proposals`
    };
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + proposal.durationDays * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('governance_proposals')
    .insert({
      title: proposal.title,
      description: proposal.description,
      proposal_type: proposal.type,
      status: 'active',
      creator_id: userId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      quorum_required: 10000,
      execution_data: proposal.executionData || {}
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: 'Failed to create proposal' };
  }

  return { success: true, proposalId: data.id };
}

export async function getUserVotes(userId: string): Promise<VoteRecord[]> {
  const { data, error } = await supabase
    .from('governance_votes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(v => ({
    id: v.id,
    proposalId: v.proposal_id,
    userId: v.user_id,
    veTytBalance: v.vetyt_amount,
    voteDirection: v.vote_direction,
    votedAt: v.created_at
  }));
}

export function getProposalProgress(proposal: GovernanceProposal): {
  totalVotes: number;
  forPercentage: number;
  againstPercentage: number;
  quorumProgress: number;
  isPassing: boolean;
  isQuorumMet: boolean;
} {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  const quorumProgress = (totalVotes / proposal.quorumRequired) * 100;
  const isQuorumMet = totalVotes >= proposal.quorumRequired;
  const isPassing = forPercentage > 50 && isQuorumMet;

  return {
    totalVotes,
    forPercentage,
    againstPercentage,
    quorumProgress: Math.min(100, quorumProgress),
    isPassing,
    isQuorumMet
  };
}

export function getTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    isExpired: false
  };
}

export async function getGovernanceStats(): Promise<{
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  totalVotes: number;
  totalVeTyt: number;
  participationRate: number;
}> {
  const [proposalsRes, activeRes, passedRes, votesRes] = await Promise.all([
    supabase.from('governance_proposals').select('id', { count: 'exact' }),
    supabase.from('governance_proposals').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('governance_proposals').select('id', { count: 'exact' }).eq('status', 'passed'),
    supabase.from('governance_votes').select('vetyt_amount')
  ]);

  const totalVotes = (votesRes.data || []).reduce((sum, v) => sum + (v.vetyt_amount || 0), 0);

  return {
    totalProposals: proposalsRes.count || 0,
    activeProposals: activeRes.count || 0,
    passedProposals: passedRes.count || 0,
    totalVotes,
    totalVeTyt: 1000000,
    participationRate: 45
  };
}
