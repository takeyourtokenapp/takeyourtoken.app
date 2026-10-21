import { useState } from 'react';
import {
  Vote,
  Lock,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Award,
  Target,
  Zap,
  Shield
} from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  category: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorumRequired: number;
  startDate: string;
  endDate: string;
  executionDate?: string;
}

export default function Governance() {
  const [activeTab, setActiveTab] = useState<'proposals' | 'my-votes' | 'delegate'>('proposals');
  const [lockAmount, setLockAmount] = useState('1000');
  const [lockPeriod, setLockPeriod] = useState('1-year');

  // Mock user data
  const userTYTBalance = 5000;
  const userVeTYT = 2500;
  const userVotingPower = 0.05; // 0.05%

  const proposals: Proposal[] = [
    {
      id: 'prop-001',
      title: 'Increase Foundation Allocation to 12%',
      description: 'Proposal to increase automatic foundation donations from 10% to 12% of all platform fees. Additional 2% will fund expanded proton therapy access program in Southeast Asia.',
      proposer: '0x742d...f4a2',
      category: 'Foundation',
      status: 'active',
      votesFor: 125000,
      votesAgainst: 23000,
      totalVotes: 148000,
      quorumRequired: 100000,
      startDate: '2024-12-10',
      endDate: '2024-12-17'
    },
    {
      id: 'prop-002',
      title: 'Reduce Maintenance Fee Base Rate by 5%',
      description: 'Lower base maintenance fee from current rate to improve miner profitability. Expected to increase platform adoption and total hashrate by 15-20%.',
      proposer: '0x8a3c...2b91',
      category: 'Economics',
      status: 'active',
      votesFor: 98500,
      votesAgainst: 87200,
      totalVotes: 185700,
      quorumRequired: 100000,
      startDate: '2024-12-08',
      endDate: '2024-12-15'
    },
    {
      id: 'prop-003',
      title: 'Implement Diamond VIP Tier Bonus',
      description: 'Add additional 2% maintenance discount for Diamond VIP members (total 20%). Reward our most loyal community members.',
      proposer: '0x1f2a...c8d4',
      category: 'VIP Program',
      status: 'passed',
      votesFor: 210000,
      votesAgainst: 15000,
      totalVotes: 225000,
      quorumRequired: 100000,
      startDate: '2024-11-25',
      endDate: '2024-12-02',
      executionDate: '2024-12-05'
    },
    {
      id: 'prop-004',
      title: 'Launch TYT Governance Token V2',
      description: 'Upgrade governance contract with quadratic voting, proposal deposits, and execution timelock. Improve security and decentralization.',
      proposer: '0x9d4e...7f31',
      category: 'Governance',
      status: 'rejected',
      votesFor: 45000,
      votesAgainst: 95000,
      totalVotes: 140000,
      quorumRequired: 100000,
      startDate: '2024-11-20',
      endDate: '2024-11-27'
    },
    {
      id: 'prop-005',
      title: 'Add Ethereum L2 Support (Arbitrum, Optimism)',
      description: 'Expand platform to Ethereum Layer 2 networks for lower fees and broader accessibility. Development cost: $120K, timeline: 8 weeks.',
      proposer: '0x6c2b...a1f9',
      category: 'Technical',
      status: 'pending',
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      quorumRequired: 100000,
      startDate: '2024-12-18',
      endDate: '2024-12-25'
    }
  ];

  const votingPowerMultipliers = [
    { period: '1-week', multiplier: '1x', tyt: 1000, veTYT: 1000 },
    { period: '1-month', multiplier: '1.5x', tyt: 1000, veTYT: 1500 },
    { period: '3-months', multiplier: '2x', tyt: 1000, veTYT: 2000 },
    { period: '6-months', multiplier: '3x', tyt: 1000, veTYT: 3000 },
    { period: '1-year', multiplier: '4x', tyt: 1000, veTYT: 4000 },
    { period: '2-years', multiplier: '6x', tyt: 1000, veTYT: 6000 },
    { period: '4-years', multiplier: '10x', tyt: 1000, veTYT: 10000 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/20';
      case 'passed': return 'text-green-400 bg-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/20';
      case 'pending': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Foundation': return 'text-pink-400 bg-pink-500/20';
      case 'Economics': return 'text-amber-400 bg-amber-500/20';
      case 'VIP Program': return 'text-purple-400 bg-purple-500/20';
      case 'Governance': return 'text-blue-400 bg-blue-500/20';
      case 'Technical': return 'text-cyan-400 bg-cyan-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">TYT Governance</h1>
            <p className="text-gray-300">Shape the future of the platform through decentralized governance</p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-gray-400">TYT Balance</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{userTYTBalance.toLocaleString()}</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Locked veTYT</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{userVeTYT.toLocaleString()}</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Voting Power</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{userVotingPower}%</div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Active Voters</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">1,247</div>
          </div>
        </div>
      </div>

      {/* Lock TYT for veTYT */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lock className="w-6 h-6 text-blue-400" />
          Lock TYT for Voting Power
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount to Lock
            </label>
            <input
              type="number"
              value={lockAmount}
              onChange={(e) => setLockAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="1000"
            />
            <div className="text-sm text-gray-500 mt-1">
              Available: {userTYTBalance.toLocaleString()} TYT
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Lock Period
            </label>
            <select
              value={lockPeriod}
              onChange={(e) => setLockPeriod(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              {votingPowerMultipliers.map(option => (
                <option key={option.period} value={option.period}>
                  {option.period.replace('-', ' ')} ({option.multiplier} voting power)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-blue-400 mb-1">Locking Details</div>
              <div className="text-sm text-gray-300">
                Locking {lockAmount} TYT for {lockPeriod.replace('-', ' ')} will give you{' '}
                <span className="font-bold text-blue-400">
                  {(Number(lockAmount) * Number(votingPowerMultipliers.find(v => v.period === lockPeriod)?.multiplier.replace('x', '') || 1)).toLocaleString()} veTYT
                </span>{' '}
                voting power. Your tokens will be locked until the period ends.
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all">
          Lock TYT → Get veTYT
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'proposals'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Proposals ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab('my-votes')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'my-votes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Votes
          </button>
          <button
            onClick={() => setActiveTab('delegate')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'delegate'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Delegation
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'proposals' && (
            <div className="space-y-4">
              {proposals.map(proposal => {
                const percentFor = proposal.totalVotes > 0
                  ? (proposal.votesFor / proposal.totalVotes) * 100
                  : 0;
                const percentAgainst = proposal.totalVotes > 0
                  ? (proposal.votesAgainst / proposal.totalVotes) * 100
                  : 0;
                const quorumMet = proposal.totalVotes >= proposal.quorumRequired;

                return (
                  <div
                    key={proposal.id}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{proposal.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}>
                            {proposal.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(proposal.category)}`}>
                            {proposal.category}
                          </span>
                        </div>
                        <p className="text-gray-400 mb-3">{proposal.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>By: {proposal.proposer}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Ends: {new Date(proposal.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Voting Progress */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            For: {proposal.votesFor.toLocaleString()} ({percentFor.toFixed(1)}%)
                          </span>
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-4 h-4" />
                            Against: {proposal.votesAgainst.toLocaleString()} ({percentAgainst.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${percentFor}%` }}
                          />
                          <div
                            className="bg-red-500 transition-all"
                            style={{ width: `${percentAgainst}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          Quorum: {proposal.totalVotes.toLocaleString()} / {proposal.quorumRequired.toLocaleString()} veTYT
                        </span>
                        {quorumMet ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Quorum Met
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            {((proposal.quorumRequired - proposal.totalVotes) / proposal.quorumRequired * 100).toFixed(0)}% more needed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    {proposal.status === 'active' && (
                      <div className="flex gap-3">
                        <button className="flex-1 px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-all flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Vote For
                        </button>
                        <button className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
                          <XCircle className="w-5 h-5" />
                          Vote Against
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'my-votes' && (
            <div className="text-center py-12">
              <Vote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Votes Yet</h3>
              <p className="text-gray-500">
                You haven't participated in any votes. Lock TYT to get veTYT and start voting!
              </p>
            </div>
          )}

          {activeTab === 'delegate' && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Delegation Coming Soon</h3>
              <p className="text-gray-500">
                Delegate your voting power to trusted community members. Feature launching in Q1 2025.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
