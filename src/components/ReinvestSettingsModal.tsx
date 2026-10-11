import { useState, useEffect } from 'react';
import { X, Info, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ReinvestSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReinvestSettingsModal({ isOpen, onClose }: ReinvestSettingsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    auto_reinvest_enabled: false,
    reinvest_percentage: 50,
    min_balance_to_reinvest: 0.001,
    reinvest_frequency_days: 7
  });

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_reinvest_settings')
        .select('auto_reinvest_enabled, reinvest_percentage, min_balance_to_reinvest, reinvest_frequency_days')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          auto_reinvest_enabled: data.auto_reinvest_enabled ?? false,
          reinvest_percentage: data.reinvest_percentage ?? 50,
          min_balance_to_reinvest: data.min_balance_to_reinvest ?? 0.001,
          reinvest_frequency_days: data.reinvest_frequency_days ?? 7
        });
      }
    } catch (error) {
      console.error('Error loading reinvest settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_reinvest_settings')
        .upsert({
          user_id: user.id,
          auto_reinvest_enabled: settings.auto_reinvest_enabled,
          reinvest_percentage: settings.reinvest_percentage,
          min_balance_to_reinvest: settings.min_balance_to_reinvest,
          reinvest_frequency_days: settings.reinvest_frequency_days,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Error saving reinvest settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const projectedBonus = settings.auto_reinvest_enabled
    ? (settings.reinvest_percentage / 100) * 0.05 * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-cyan-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Auto-Reinvest Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading settings...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300 space-y-1">
                  <p className="font-semibold text-cyan-300">How Auto-Reinvest Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    <li>Automatically uses your BTC rewards to purchase more hashrate</li>
                    <li>Get +5% bonus TH/s on all reinvested amounts</li>
                    <li>Compound your mining power for exponential growth</li>
                    <li>Can be enabled/disabled anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div>
                  <h3 className="font-semibold text-white">Enable Auto-Reinvest</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Automatically reinvest your BTC rewards into more hashrate
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, auto_reinvest_enabled: !prev.auto_reinvest_enabled }))}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.auto_reinvest_enabled ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.auto_reinvest_enabled ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {settings.auto_reinvest_enabled && (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm font-medium text-gray-300">
                      <span>Reinvest Percentage</span>
                      <span className="text-cyan-400">{settings.reinvest_percentage}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={settings.reinvest_percentage}
                      onChange={(e) => setSettings(prev => ({ ...prev, reinvest_percentage: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Percentage of daily BTC rewards to automatically reinvest
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Minimum Balance to Reinvest (BTC)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      max="1"
                      value={settings.min_balance_to_reinvest}
                      onChange={(e) => setSettings(prev => ({ ...prev, min_balance_to_reinvest: parseFloat(e.target.value) || 0.001 }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-xs text-gray-400">
                      Only reinvest when accumulated balance reaches this amount
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Reinvest Frequency (days)
                    </label>
                    <select
                      value={settings.reinvest_frequency_days}
                      onChange={(e) => setSettings(prev => ({ ...prev, reinvest_frequency_days: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value={1}>Daily</option>
                      <option value={7}>Weekly</option>
                      <option value={14}>Bi-weekly</option>
                      <option value={30}>Monthly</option>
                    </select>
                    <p className="text-xs text-gray-400">
                      How often to execute automatic reinvestments
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold text-green-300">Reinvest Bonus</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">
                        With current settings, you will reinvest <span className="font-bold text-white">{settings.reinvest_percentage}%</span> of your BTC rewards
                      </p>
                      <p className="text-green-400 font-semibold">
                        +{projectedBonus.toFixed(2)}% bonus hashrate on reinvested amount!
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Example: If you reinvest 0.01 BTC worth of hashrate, you get 0.0105 BTC worth of TH/s
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
