import { supabase } from '../lib/supabase';

export interface VeTYTLock {
  id: string;
  userId: string;
  amountTYT: number;
  lockDuration: number;
  votingPower: number;
  unlockDate: Date;
  status: 'active' | 'unlocked';
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposalType: 'discount_curve' | 'maintenance_fee' | 'burn_schedule' | 'foundation_allocation' | 'other';
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  createdAt: Date;
  votingEndsAt: Date;
  executionDelay: number;
}

const MIN_LOCK_DURATION_DAYS = 7;
const MAX_LOCK_DURATION_DAYS = 365 * 4;

export function calculateVotingPower(amountTYT: number, lockDurationDays: number): number {
  if (lockDurationDays < MIN_LOCK_DURATION_DAYS) {
    return 0;
  }

  const maxMultiplier = 4;
  const multiplier = 1 + ((lockDurationDays / MAX_LOCK_DURATION_DAYS) * (maxMultiplier - 1));

  return amountTYT * multiplier;
}

export async function lockTYTForVoting(
  userId: string,
  amountTYT: number,
  lockDurationDays: number
): Promise<{ success: boolean; error?: string; lockId?: string }> {
  try {
    if (lockDurationDays < MIN_LOCK_DURATION_DAYS) {
      return { success: false, error: `Minimum lock duration is ${MIN_LOCK_DURATION_DAYS} days` };
    }

    if (lockDurationDays > MAX_LOCK_DURATION_DAYS) {
      return { success: false, error: `Maximum lock duration is ${MAX_LOCK_DURATION_DAYS} days` };
    }

    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('asset', 'TYT')
      .maybeSingle();

    if (!wallet) {
      return { success: false, error: 'TYT wallet not found' };
    }

    const balance = parseFloat(wallet.balance);
    if (balance < amountTYT) {
      return { success: false, error: 'Insufficient TYT balance' };
    }

    const votingPower = calculateVotingPower(amountTYT, lockDurationDays);
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + lockDurationDays);

    const { data: lock, error: lockError } = await supabase
      .from('vetyt_locks')
      .insert({
        user_id: userId,
        locked_amount_tyt: amountTYT.toString(),
        lock_duration_days: lockDurationDays,
        voting_power: votingPower.toString(),
        unlock_date: unlockDate.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (lockError) {
      return { success: false, error: lockError.message };
    }

    await supabase
      .from('custodial_wallets')
      .update({
        balance: (balance - amountTYT).toString(),
        locked_balance: (parseFloat(wallet.locked_balance || '0') + amountTYT).toString()
      })
      .eq('user_id', userId)
      .eq('asset', 'TYT');

    return { success: true, lockId: lock.id };

  } catch (error) {
    console.error('Lock TYT error:', error);
    return { success: false, error: 'Failed to lock TYT' };
  }
}

export async function unlockTYT(
  lockId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: lock } = await supabase
      .from('vetyt_locks')
      .select('*')
      .eq('id', lockId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!lock) {
      return { success: false, error: 'Lock not found or already unlocked' };
    }

    const unlockDate = new Date(lock.unlock_date);
    if (unlockDate > new Date()) {
      return { success: false, error: 'Lock period has not ended yet' };
    }

    await supabase
      .from('vetyt_locks')
      .update({
        status: 'unlocked',
        unlocked_at: new Date().toISOString()
      })
      .eq('id', lockId);

    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('asset', 'TYT')
      .maybeSingle();

    if (wallet) {
      const lockedAmount = parseFloat(lock.locked_amount_tyt);
      await supabase
        .from('custodial_wallets')
        .update({
          balance: (parseFloat(wallet.balance) + lockedAmount).toString(),
          locked_balance: (parseFloat(wallet.locked_balance || '0') - lockedAmount).toString()
        })
        .eq('user_id', userId)
        .eq('asset', 'TYT');
    }

    return { success: true };

  } catch (error) {
    console.error('Unlock TYT error:', error);
    return { success: false, error: 'Failed to unlock TYT' };
  }
}

export async function getUserVotingPower(userId: string): Promise<number> {
  const { data: locks } = await supabase
    .from('vetyt_locks')
    .select('voting_power')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!locks || locks.length === 0) {
    return 0;
  }

  return locks.reduce((sum, lock) => sum + parseFloat(lock.voting_power), 0);
}

export async function createProposal(
  userId: string,
  title: string,
  description: string,
  proposalType: GovernanceProposal['proposalType'],
  votingDurationDays: number = 7
): Promise<{ success: boolean; error?: string; proposalId?: string }> {
  try {
    const votingPower = await getUserVotingPower(userId);
    const minVotingPowerRequired = 10000;

    if (votingPower < minVotingPowerRequired) {
      return {
        success: false,
        error: `Minimum ${minVotingPowerRequired} voting power required to create proposals`
      };
    }

    const votingEndsAt = new Date();
    votingEndsAt.setDate(votingEndsAt.getDate() + votingDurationDays);

    const { data: proposal, error: proposalError } = await supabase
      .from('governance_proposals')
      .insert({
        creator_id: userId,
        title,
        description,
        proposal_type: proposalType,
        status: 'active',
        voting_ends_at: votingEndsAt.toISOString(),
        execution_delay_days: 2
      })
      .select()
      .single();

    if (proposalError) {
      return { success: false, error: proposalError.message };
    }

    return { success: true, proposalId: proposal.id };

  } catch (error) {
    console.error('Create proposal error:', error);
    return { success: false, error: 'Failed to create proposal' };
  }
}

export async function voteOnProposal(
  proposalId: string,
  userId: string,
  vote: 'for' | 'against' | 'abstain'
): Promise<{ success: boolean; error?: string }> {
  try {
    const votingPower = await getUserVotingPower(userId);

    if (votingPower === 0) {
      return { success: false, error: 'You need to lock TYT to vote' };
    }

    const { data: proposal } = await supabase
      .from('governance_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('status', 'active')
      .maybeSingle();

    if (!proposal) {
      return { success: false, error: 'Proposal not found or voting has ended' };
    }

    const votingEndsAt = new Date(proposal.voting_ends_at);
    if (votingEndsAt < new Date()) {
      return { success: false, error: 'Voting period has ended' };
    }

    const { data: existingVote } = await supabase
      .from('governance_votes')
      .select('id')
      .eq('proposal_id', proposalId)
      .eq('voter_id', userId)
      .maybeSingle();

    if (existingVote) {
      return { success: false, error: 'You have already voted on this proposal' };
    }

    await supabase
      .from('governance_votes')
      .insert({
        proposal_id: proposalId,
        voter_id: userId,
        vote_choice: vote,
        voting_power: votingPower.toString()
      });

    const voteColumn = vote === 'for' ? 'votes_for' : vote === 'against' ? 'votes_against' : 'votes_abstain';
    await supabase
      .from('governance_proposals')
      .update({
        [voteColumn]: parseFloat(proposal[voteColumn]) + votingPower
      })
      .eq('id', proposalId);

    return { success: true };

  } catch (error) {
    console.error('Vote error:', error);
    return { success: false, error: 'Failed to cast vote' };
  }
}

export async function getActiveProposals(): Promise<GovernanceProposal[]> {
  const { data } = await supabase
    .from('governance_proposals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getUserVotes(userId: string): Promise<any[]> {
  const { data } = await supabase
    .from('governance_votes')
    .select(`
      *,
      governance_proposals (*)
    `)
    .eq('voter_id', userId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function finalizeProposal(proposalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: proposal } = await supabase
      .from('governance_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('status', 'active')
      .maybeSingle();

    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    const votingEndsAt = new Date(proposal.voting_ends_at);
    if (votingEndsAt > new Date()) {
      return { success: false, error: 'Voting period has not ended' };
    }

    const totalVotes = parseFloat(proposal.votes_for) + parseFloat(proposal.votes_against);
    const quorum = 100000;

    if (totalVotes < quorum) {
      await supabase
        .from('governance_proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId);

      return { success: false, error: 'Quorum not met' };
    }

    const forPercentage = (parseFloat(proposal.votes_for) / totalVotes) * 100;
    const requiredPercentage = 60;

    const newStatus = forPercentage >= requiredPercentage ? 'passed' : 'rejected';

    await supabase
      .from('governance_proposals')
      .update({ status: newStatus })
      .eq('id', proposalId);

    return { success: true };

  } catch (error) {
    console.error('Finalize proposal error:', error);
    return { success: false, error: 'Failed to finalize proposal' };
  }
}
