import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Calendar, Shield, Award, TrendingUp, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TransactionService from '../../utils/transactionService';

interface Profile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  kyc_level: number;
  vip_tier: string;
  referral_code: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setEditForm({
          username: data.username || '',
          full_name: data.full_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    const txStats = await TransactionService.getUserTransactionStats(user.id);
    setStats(txStats);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          full_name: editForm.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getVIPColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'from-amber-700 to-orange-700';
      case 'silver': return 'from-gray-400 to-gray-500';
      case 'gold': return 'from-amber-400 to-yellow-500';
      case 'platinum': return 'from-cyan-400 to-blue-500';
      case 'diamond': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getKYCStatus = (level: number) => {
    switch (level) {
      case 0: return { text: 'Not Verified', color: 'text-gray-400', bg: 'bg-gray-500/20' };
      case 1: return { text: 'Tier 1 Verified', color: 'text-blue-400', bg: 'bg-blue-500/20' };
      case 2: return { text: 'Tier 2 Verified', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 3: return { text: 'Tier 3 Verified', color: 'text-purple-400', bg: 'bg-purple-500/20' };
      default: return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Profile not found</p>
      </div>
    );
  }

  const kycStatus = getKYCStatus(profile.kyc_level);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/50"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        {/* Banner */}
        <div className={`h-32 bg-gradient-to-r ${getVIPColor(profile.vip_tier)}`}></div>

        {/* Content */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-6 -mt-20 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-4 border-gray-900 flex items-center justify-center shadow-xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 mt-16 md:mt-0">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/50 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditForm({
                          username: profile.username || '',
                          full_name: profile.full_name || ''
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{profile.username || 'User'}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${kycStatus.bg} ${kycStatus.color} border border-current`}>
                      {kycStatus.text}
                    </span>
                  </div>
                  {profile.full_name && (
                    <p className="text-gray-400 mb-4">{profile.full_name}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className={`bg-gradient-to-br ${getVIPColor(profile.vip_tier)} bg-opacity-20 border border-current rounded-xl p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6" />
                <span className="font-bold">VIP Status</span>
              </div>
              <p className="text-2xl font-bold">{profile.vip_tier || 'None'}</p>
              <p className="text-xs text-gray-400 mt-1">Your membership tier</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-blue-400" />
                <span className="font-bold">KYC Level</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">Tier {profile.kyc_level}</p>
              <p className="text-xs text-gray-400 mt-1">Verification status</p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <span className="font-bold">Referral Code</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{profile.referral_code}</p>
              <p className="text-xs text-gray-400 mt-1">Share to earn rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Activity Statistics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Deposits"
              value={`$${stats.totalDeposits.toFixed(2)}`}
              color="green"
            />
            <StatCard
              label="Total Withdrawals"
              value={`$${stats.totalWithdrawals.toFixed(2)}`}
              color="red"
            />
            <StatCard
              label="Mining Rewards"
              value={`$${stats.totalMiningRewards.toFixed(2)}`}
              color="blue"
            />
            <StatCard
              label="Foundation Contributions"
              value={`$${stats.foundationContributions.toFixed(2)}`}
              color="pink"
            />
            <StatCard
              label="Maintenance Paid"
              value={`$${stats.totalMaintenancePaid.toFixed(2)}`}
              color="amber"
            />
            <StatCard
              label="NFT Purchases"
              value={`$${stats.totalNFTPurchases.toFixed(2)}`}
              color="purple"
            />
            <StatCard
              label="NFT Sales"
              value={`$${stats.totalNFTSales.toFixed(2)}`}
              color="cyan"
            />
            <StatCard
              label="Net Profit"
              value={`$${(stats.totalMiningRewards - stats.totalMaintenancePaid).toFixed(2)}`}
              color="emerald"
            />
          </div>
        </div>
      )}

      {/* Security Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Security & Privacy</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div>
              <h3 className="font-semibold mb-1">Two-Factor Authentication (2FA)</h3>
              <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/50">
              Enable
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div>
              <h3 className="font-semibold mb-1">Change Password</h3>
              <p className="text-sm text-gray-400">Update your password regularly for security</p>
            </div>
            <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              Change
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div>
              <h3 className="font-semibold mb-1">Download Your Data</h3>
              <p className="text-sm text-gray-400">Export all your personal data (GDPR compliance)</p>
            </div>
            <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              Download
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/50">
            <div>
              <h3 className="font-semibold mb-1 text-red-400">Delete Account</h3>
              <p className="text-sm text-gray-400">Permanently delete your account and data</p>
            </div>
            <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/50">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: any = {
    green: 'bg-green-500/10 border-green-500/50 text-green-400',
    red: 'bg-red-500/10 border-red-500/50 text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    pink: 'bg-pink-500/10 border-pink-500/50 text-pink-400',
    amber: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/50 text-purple-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
