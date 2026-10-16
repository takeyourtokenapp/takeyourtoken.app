import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Building2, Calendar, DollarSign, CheckCircle, Activity, Award, ExternalLink, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Grant {
  id: string;
  grant_number: string;
  title: string;
  description: string;
  principal_investigator: string;
  total_amount_usd: number;
  disbursed_amount_usd: number;
  remaining_amount_usd: number;
  start_date: string;
  end_date: string;
  status: string;
  research_area: string;
  target_age_group: string | null;
  tumor_types: string[] | null;
  milestone_count: number;
  completed_milestones: number;
  proposal_url: string | null;
  expected_outcomes: string | null;
  partner: { name: string } | null;
}

export default function Grants() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    loadGrants();
  }, []);

  async function loadGrants() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('foundation_grants')
        .select(`
          *,
          partner:foundation_research_partners(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrants(data || []);
    } catch (error) {
      console.error('Error loading grants:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGrants = statusFilter === 'all' ? grants : grants.filter(g => g.status === statusFilter);

  const totalAwarded = grants.reduce((s, g) => s + parseFloat(String(g.total_amount_usd)), 0);
  const totalDisbursed = grants.reduce((s, g) => s + parseFloat(String(g.disbursed_amount_usd)), 0);
  const activeCount = grants.filter(g => g.status === 'active' || g.status === 'in_progress').length;
  const completedCount = grants.filter(g => g.status === 'completed').length;

  function getStatusColor(status: string) {
    switch (status) {
      case 'application': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      default: return 'bg-tertiary text-tertiary-text border-secondary';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'application': return FileText;
      case 'approved': return CheckCircle;
      case 'in_progress': return Activity;
      case 'completed': return Award;
      default: return FileText;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FileText className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Foundation Grants</h1>
          <p className="text-tertiary-text">Research grants funding pediatric brain cancer research and treatment development</p>
        </div>
        <button
          onClick={() => setShowApplicationForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <FileText size={18} /> Apply for Grant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary-text">Total Awarded</span>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">${(totalAwarded / 1000).toFixed(0)}K</div>
          <div className="text-sm text-tertiary-text mt-1">{grants.length} grants</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Disbursed</span>
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">${(totalDisbursed / 1000).toFixed(0)}K</div>
          <div className="text-sm text-tertiary-text mt-1">{((totalDisbursed / totalAwarded) * 100 || 0).toFixed(0)}% of total</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Active Research</span>
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{activeCount}</div>
          <div className="text-sm text-tertiary-text mt-1">in progress</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Completed</span>
            <Award className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{completedCount}</div>
          <div className="text-sm text-tertiary-text mt-1">projects done</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'application', 'approved', 'in_progress', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              statusFilter === s ? 'bg-blue-500 text-white' : 'bg-tertiary text-tertiary-text hover:bg-secondary'
            }`}
          >
            {s === 'all' ? 'All Grants' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filteredGrants.length === 0 ? (
        <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
          <FileText className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Grants Found</h3>
          <p className="text-tertiary-text">Grant applications will appear here once submitted and reviewed</p>
          <Link to="/app/foundation" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-500/20 text-blue-400 font-semibold rounded-xl transition-all">
            Visit Foundation Page
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrants.map(grant => {
            const StatusIcon = getStatusIcon(grant.status);
            const progress = grant.milestone_count > 0 ? (grant.completed_milestones / grant.milestone_count) * 100 : 0;
            const fundProgress = parseFloat(String(grant.total_amount_usd)) > 0
              ? (parseFloat(String(grant.disbursed_amount_usd)) / parseFloat(String(grant.total_amount_usd))) * 100
              : 0;

            return (
              <div key={grant.id} className="bg-secondary rounded-xl p-6 border border-secondary hover:border-blue-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 border rounded-full text-xs font-semibold flex items-center gap-1 capitalize ${getStatusColor(grant.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {grant.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-tertiary-text">{grant.grant_number}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{grant.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-tertiary-text mb-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {grant.partner?.name || 'Independent Researcher'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(grant.start_date).toLocaleDateString()} - {new Date(grant.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-tertiary-text">
                      <span className="font-semibold">PI:</span> {grant.principal_investigator}
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-3xl font-bold text-blue-400">${(parseFloat(String(grant.total_amount_usd)) / 1000).toFixed(0)}K</div>
                    <div className="text-sm text-tertiary-text">Total Award</div>
                  </div>
                </div>

                <p className="text-tertiary-text text-sm mb-4">{grant.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-tertiary rounded-lg p-3">
                    <div className="text-xs text-tertiary-text">Research Area</div>
                    <div className="text-sm font-semibold">{grant.research_area}</div>
                  </div>
                  {grant.target_age_group && (
                    <div className="bg-tertiary rounded-lg p-3">
                      <div className="text-xs text-tertiary-text">Age Group</div>
                      <div className="text-sm font-semibold">{grant.target_age_group}</div>
                    </div>
                  )}
                  <div className="bg-tertiary rounded-lg p-3">
                    <div className="text-xs text-tertiary-text">Milestones</div>
                    <div className="text-sm font-semibold">{grant.completed_milestones}/{grant.milestone_count}</div>
                  </div>
                  {grant.tumor_types && grant.tumor_types.length > 0 && (
                    <div className="bg-tertiary rounded-lg p-3">
                      <div className="text-xs text-tertiary-text">Tumor Types</div>
                      <div className="text-sm font-semibold truncate">{grant.tumor_types.join(', ')}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-tertiary-text">Funding Disbursement</span>
                    <span className="font-bold">{fundProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(fundProgress, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-tertiary-text">
                    <span>${parseFloat(String(grant.disbursed_amount_usd)).toLocaleString()} disbursed</span>
                    <span>${parseFloat(String(grant.remaining_amount_usd || 0)).toLocaleString()} remaining</span>
                  </div>
                </div>

                {grant.expected_outcomes && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-green-400 mb-1">Expected Outcomes</div>
                        <div className="text-sm text-secondary-text">{grant.expected_outcomes}</div>
                      </div>
                    </div>
                  </div>
                )}

                {grant.proposal_url && (
                  <a
                    href={grant.proposal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink size={14} /> View Full Proposal
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showApplicationForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowApplicationForm(false)}>
          <div className="bg-secondary rounded-xl border border-secondary max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Grant Application</h2>
            <p className="text-tertiary-text mb-6">Submit a research grant application for pediatric brain cancer research funding.</p>
            <GrantApplicationForm onClose={() => setShowApplicationForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function GrantApplicationForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Grant applications are stored as foundation_grants with status 'application'
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const grantNumber = `GRA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { error } = await supabase.from('foundation_grants').insert({
        grant_number: grantNumber,
        title,
        description,
        principal_investigator: user.email || 'Unknown',
        total_amount_usd: parseFloat(amount) || 0,
        remaining_amount_usd: parseFloat(amount) || 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'application',
        research_area: researchArea,
        partner_id: null
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
        <p className="text-tertiary-text mb-6">Your grant application has been submitted for review. You will be notified of the decision.</p>
        <button onClick={onClose} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl">Close</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Project Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Novel Immunotherapy for Pediatric Glioblastoma"
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Research Area</label>
        <input value={researchArea} onChange={e => setResearchArea(e.target.value)} placeholder="e.g. Immunotherapy, Genomics, Imaging"
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe your research project..."
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Requested Amount (USD)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000"
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all" />
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || !title || !researchArea || !description}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
        ) : (
          <>Submit Application</>
        )}
      </button>
    </div>
  );
}
