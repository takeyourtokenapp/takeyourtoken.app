import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Bell, Key, AlertCircle, CheckCircle2, Save, FileText } from 'lucide-react';
import KYCStatus from '../../components/KYCStatus';

type Tab = 'account' | 'security' | 'kyc' | 'notifications';

export default function Settings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'account');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    notifications_email: true,
    notifications_push: true,
    two_factor_enabled: false
  });

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab && ['account', 'security', 'kyc', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadProfile();
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
        setFormData({
          username: data.username || '',
          email: user.email || '',
          notifications_email: true,
          notifications_push: true,
          two_factor_enabled: false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username
        })
        .eq('id', user!.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </span>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'kyc', label: 'KYC Verification', icon: FileText },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as Tab)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gold-500/20 text-gold-400 border-b-2 border-gold-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Account ID</label>
                    <input
                      type="text"
                      value={user?.id || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg opacity-50 cursor-not-allowed font-mono text-sm"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gold-500 to-amber-500 rounded-lg font-semibold hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="font-semibold mb-1 flex items-center gap-2">
                        <Key className="w-5 h-5 text-gold-400" />
                        Two-Factor Authentication
                      </div>
                      <div className="text-sm text-gray-400">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all">
                      Enable
                    </button>
                  </div>

                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Active Sessions
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      You are currently signed in on this device
                    </div>
                    <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-all">
                      Sign Out All Devices
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div>
              <KYCStatus />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="font-semibold mb-1">Email Notifications</div>
                      <div className="text-sm text-gray-400">
                        Receive updates about your account via email
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications_email}
                      onChange={(e) => setFormData({ ...formData, notifications_email: e.target.checked })}
                      className="w-6 h-6 rounded border-gray-700 bg-gray-900 text-gold-500 focus:ring-gold-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="font-semibold mb-1">Push Notifications</div>
                      <div className="text-sm text-gray-400">
                        Receive push notifications for important events
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications_push}
                      onChange={(e) => setFormData({ ...formData, notifications_push: e.target.checked })}
                      className="w-6 h-6 rounded border-gray-700 bg-gray-900 text-gold-500 focus:ring-gold-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
