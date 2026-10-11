import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Vote,
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  Lock,
  AlertCircle,
  Info
} from 'lucide-react';
import ProposalCard from '../../components/ProposalCard';

export default function Governance() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'rejected'>('all');

  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    totalVoters: 0,
    userVotingPower: 0
  });

  useEffect(() => {
    if (user) {
      loadGovernance();
    }
  }, [user]);

  const loadGovernance = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [proposalsRes, votesRes, userPowerRes] = await Promise.all([
        supabase
          .from('governance_proposals')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('governance_votes')
          .select('proposal_id')
          .eq('user_id', user.id),
        supabase
          .from('ve_tyt_locks')
          .select('tyt_amount, voting_power')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (proposalsRes.error) throw proposalsRes.error;

      const proposalsData = proposalsRes.data || [];
      const userVotes = new Set((votesRes.data || []).map(v => v.proposal_id));

      const proposalsWithUserVote = proposalsData.map(p => ({
        ...p,
        userHasVoted: userVotes.has(p.id)
      }));

      setProposals(proposalsWithUserVote);

      const uniqueVoters = await supabase
        .from('governance_votes')
        .select('user_id', { count: 'exact', head: false });

      const uniqueVoterCount = uniqueVoters.data
        ? new Set(uniqueVoters.data.map(v => v.user_id)).size
        : 0;

      setStats({
        totalProposals: proposalsData.length,
        activeProposals: proposalsData.filter(p => p.status === 'active').length,
        totalVoters: uniqueVoterCount,
        userVotingPower: userPowerRes.data?.voting_power || userPowerRes.data?.tyt_amount || 0
      });
    } catch (err) {
      console.error('Error loading governance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, voteType: 'for' | 'against') => {
    if (!user || stats.userVotingPower === 0) {
      alert('You need to lock TYT tokens to gain voting power');
      return;
    }

    try {
      const { error } = await supabase
        .from('governance_votes')
        .insert({
          proposal_id: proposalId,
          user_id: user.id,
          vote_type: voteType,
          voting_power: stats.userVotingPower
        });

      if (error) {
        if (error.code === '23505') {
          alert('You have already voted on this proposal');
        } else {
          throw error;
        }
        return;
      }

      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        const updateField = voteType === 'for' ? 'votes_for' : 'votes_against';
        await supabase
          .from('governance_proposals')
          .update({
            [updateField]: proposal[updateField] + stats.userVotingPower,
            total_votes: proposal.total_votes + stats.userVotingPower
          })
          .eq('id', proposalId);
      }

      await loadGovernance();
      alert(`Vote submitted successfully!`);
    } catch (err) {
      console.error('Error voting:', err);
      alert('Failed to submit vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Governance</h1>
          <p className="text-gray-400">
            Shape the future of TYT through decentralized governance
          </p>
        </div>
        <Link
          to="/app/governance/create"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 rounded-xl font-bold hover:shadow-lg hover:shadow-gold-500/50 transition-all"
          onClick={(e) => {
            e.preventDefault();
            alert('Proposal creation will be available after smart contract deployment');
          }}
        >
          <Plus className="w-5 h-5" />
          Create Proposal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Vote className="w-5 h-5" />
            <span className="text-sm">Total Proposals</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalProposals}</p>
        </div>

        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Active Proposals</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.activeProposals}</p>
        </div>

        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">Total Voters</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats.totalVoters}</p>
        </div>

        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Lock className="w-5 h-5" />
            <span className="text-sm">Your Voting Power</span>
          </div>
          <p className="text-2xl font-bold text-gold-400">
            {stats.userVotingPower.toLocaleString()}
          </p>
        </div>
      </div>

      {stats.userVotingPower === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                Get Voting Power with veTYT
              </h3>
              <p className="text-sm text-blue-400/80 mb-4">
                Lock your TYT tokens to receive veTYT (vote-escrowed TYT) and participate in governance.
                The longer you lock, the more voting power you gain.
              </p>
              <Link
                to="/app/staking"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Lock className="w-4 h-4" />
                Lock TYT Tokens
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gold-500 text-navy-900'
                : 'bg-navy-700 text-white hover:bg-navy-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-gold-500 text-navy-900'
                : 'bg-navy-700 text-white hover:bg-navy-600'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'passed'
                ? 'bg-gold-500 text-navy-900'
                : 'bg-navy-700 text-white hover:bg-navy-600'
            }`}
          >
            Passed
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-gold-500 text-navy-900'
                : 'bg-navy-700 text-white hover:bg-navy-600'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-12 text-center">
          {proposals.length === 0 ? (
            <>
              <Vote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Proposals Yet</h3>
              <p className="text-gray-400 mb-6">
                Be the first to create a governance proposal
              </p>
              <button
                onClick={() => alert('Proposal creation will be available after smart contract deployment')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 rounded-xl font-bold hover:shadow-lg hover:shadow-gold-500/50 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create First Proposal
              </button>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No {filter} Proposals</h3>
              <p className="text-gray-400">
                Try adjusting your filter
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onVote={handleVote}
              userVotingPower={stats.userVotingPower}
            />
          ))}
        </div>
      )}
    </div>
  );
}
