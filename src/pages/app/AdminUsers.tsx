import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Search,
  Filter,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  MoreVertical,
  Download,
  RefreshCw
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  kyc_level: number;
  kyc_status: string;
  is_active: boolean;
  is_admin: boolean;
  rank_score: number;
  owl_rank: string;
  created_at: string;
  last_seen: string | null;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKYC, setFilterKYC] = useState<'all' | '0' | '1' | '2' | '3'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) {
        const usersWithEmails = await Promise.all(
          profilesData.map(async (profile) => {
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
            return {
              ...profile,
              email: authData?.user?.email || 'N/A',
              last_seen: authData?.user?.last_sign_in_at || null
            };
          })
        );
        setUsers(usersWithEmails);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleUpdateKYC = async (userId: string, level: number, status: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ kyc_level: level, kyc_status: status })
        .eq('id', userId);

      await loadUsers();
    } catch (error) {
      console.error('Error updating KYC:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKYC = filterKYC === 'all' || user.kyc_level === parseInt(filterKYC);
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' ? user.is_active : !user.is_active);

    return matchesSearch && matchesKYC && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    kyc0: users.filter(u => u.kyc_level === 0).length,
    kyc1: users.filter(u => u.kyc_level === 1).length,
    kyc2: users.filter(u => u.kyc_level === 2).length,
    kyc3: users.filter(u => u.kyc_level === 3).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-gray-400">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-gray-400">Manage user accounts, KYC verification, and access control</p>
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
          <Users className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.active}</div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-6">
          <Shield className="w-8 h-8 text-amber-400 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.kyc2 + stats.kyc3}</div>
          <div className="text-sm text-gray-400">Verified (KYC 2-3)</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
          <Mail className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold mb-1">{stats.kyc0 + stats.kyc1}</div>
          <div className="text-sm text-gray-400">Pending (KYC 0-1)</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={filterKYC}
            onChange={(e) => setFilterKYC(e.target.value as any)}
            className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All KYC Levels</option>
            <option value="0">KYC Level 0</option>
            <option value="1">KYC Level 1</option>
            <option value="2">KYC Level 2</option>
            <option value="3">KYC Level 3</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-400">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-400">Email</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-400">KYC Level</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-400">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-400">Rank</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-400">Joined</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      user.kyc_level === 0 ? 'bg-gray-700 text-gray-300' :
                      user.kyc_level === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                      user.kyc_level === 2 ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    }`}>
                      Level {user.kyc_level}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {user.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="text-sm capitalize">{user.owl_rank}</div>
                    <div className="text-xs text-gray-500">{user.rank_score} XP</div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="text-sm">{new Date(user.created_at).toLocaleDateString()}</div>
                    {user.last_seen && (
                      <div className="text-xs text-gray-500">
                        Last: {new Date(user.last_seen).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetails(true);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No users found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">User Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Full Name</label>
                  <div className="font-semibold">{selectedUser.full_name || 'Not set'}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <div className="font-semibold">{selectedUser.email}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">User ID</label>
                  <div className="font-mono text-sm">{selectedUser.id}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Owl Rank</label>
                  <div className="font-semibold capitalize">{selectedUser.owl_rank} ({selectedUser.rank_score} XP)</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">KYC Status</label>
                  <div className="font-semibold">Level {selectedUser.kyc_level} - {selectedUser.kyc_status}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Account Status</label>
                  <div className="font-semibold">{selectedUser.is_active ? '✅ Active' : '❌ Inactive'}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Joined</label>
                  <div className="font-semibold">{new Date(selectedUser.created_at).toLocaleString()}</div>
                </div>
                {selectedUser.last_seen && (
                  <div>
                    <label className="text-sm text-gray-400">Last Seen</label>
                    <div className="font-semibold">{new Date(selectedUser.last_seen).toLocaleString()}</div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-700">
                <label className="text-sm text-gray-400 mb-2 block">Update KYC Level</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(level => (
                    <button
                      key={level}
                      onClick={() => handleUpdateKYC(selectedUser.id, level, 'approved')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        selectedUser.kyc_level === level
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Level {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  selectedUser.is_active
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
