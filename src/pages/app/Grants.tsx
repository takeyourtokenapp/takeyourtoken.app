import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Users, Calendar, ExternalLink, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Grant {
  id: string;
  title: string;
  description: string;
  amount_usd: number;
  grant_type: string;
  institution_name: string;
  country: string;
  status: string;
  approved_at: string;
  disbursed_at: string;
  impact_report_url: string;
  children_helped: number;
  research_areas: string[];
}

export default function Grants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [stats, setStats] = useState({
    totalGrants: 0,
    totalAmount: 0,
    childrenHelped: 0,
    activeGrants: 0,
  });

  useEffect(() => {
    loadGrants();
    loadStats();
  }, []);

  const loadGrants = async () => {
    const { data, error } = await supabase
      .from('foundation_grants')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (data) {
      setGrants(data);
    }
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('foundation_grants')
      .select('amount_usd, children_helped, status')
      .eq('status', 'approved');

    if (data) {
      const totalAmount = data.reduce((sum, g) => sum + parseFloat(g.amount_usd || '0'), 0);
      const childrenHelped = data.reduce((sum, g) => sum + (g.children_helped || 0), 0);
      const activeGrants = data.filter((g) => !g.status.includes('completed')).length;

      setStats({
        totalGrants: data.length,
        totalAmount,
        childrenHelped,
        activeGrants,
      });
    }
  };

  const filteredGrants = grants.filter((grant) => {
    if (filter === 'active') return grant.status === 'approved' || grant.status === 'in_progress';
    if (filter === 'completed') return grant.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Foundation Grants</h1>
        <p className="text-gray-400">Transparent funding for children's brain cancer research</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Heart className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalGrants}</div>
              <div className="text-sm text-gray-400">Total Grants</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">${(stats.totalAmount / 1000).toFixed(0)}K</div>
              <div className="text-sm text-gray-400">Total Funding</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.childrenHelped}</div>
              <div className="text-sm text-gray-400">Children Helped</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#D2A44C]/20 to-yellow-600/20 rounded-xl p-6 border border-[#D2A44C]/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D2A44C]/20 rounded-lg">
              <Calendar className="w-6 h-6 text-[#D2A44C]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.activeGrants}</div>
              <div className="text-sm text-gray-400">Active Grants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            filter === 'all' ? 'bg-[#D2A44C] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Grants
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg transition-all ${
            filter === 'active' ? 'bg-[#D2A44C] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg transition-all ${
            filter === 'completed' ? 'bg-[#D2A44C] text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Grants List */}
      <div className="space-y-6">
        {filteredGrants.map((grant) => (
          <div
            key={grant.id}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-[#D2A44C]/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{grant.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(grant.status)}`}>
                    {grant.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-400 mb-2">{grant.institution_name}</p>
                <p className="text-sm text-gray-500">{grant.country}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#D2A44C]">
                  ${grant.amount_usd.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Grant Amount</div>
              </div>
            </div>

            <p className="text-gray-300 mb-4">{grant.description}</p>

            {grant.research_areas && grant.research_areas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {grant.research_areas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700/50">
              <div>
                <div className="text-sm text-gray-400">Type</div>
                <div className="text-white font-medium capitalize">{grant.grant_type.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Approved</div>
                <div className="text-white font-medium">
                  {new Date(grant.approved_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Children Helped</div>
                <div className="text-white font-medium">{grant.children_helped || 'TBD'}</div>
              </div>
              <div>
                {grant.impact_report_url && (
                  <a
                    href={grant.impact_report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#D2A44C] hover:text-yellow-400 transition-colors"
                  >
                    <span className="text-sm font-medium">Impact Report</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGrants.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Grants Found</h3>
          <p className="text-gray-400">Check back later for new funding opportunities!</p>
        </div>
      )}
    </div>
  );
}
