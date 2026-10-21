import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wallet,
  Cpu,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Database,
  ShoppingCart,
  Zap,
  Crown,
  Users,
  Calendar,
  Award,
  Activity,
  DollarSign,
  Flame
} from 'lucide-react';
import type { CustodialWallet, NFTMiner, DailyReward, UserProfile, VIPLevel } from '../../types/database';
import MinerPerformanceWidget from '../../components/MinerPerformanceWidget';
import RewardsSummaryWidget from '../../components/RewardsSummaryWidget';
import NetworkStatsWidget from '../../components/NetworkStatsWidget';

export default function Dashboard() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<CustodialWallet[]>([]);
  const [miners, setMiners] = useState<NFTMiner[]>([]);
  const [recentRewards, setRecentRewards] = useState<DailyReward[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vipLevel, setVIPLevel] = useState<VIPLevel | null>(null);
  const [serviceButtonCooldown, setServiceButtonCooldown] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pressingService, setPressingService] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [walletsRes, minersRes, rewardsRes, profileRes] = await Promise.all([
        supabase
          .from('custodial_wallets')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('nft_miners')
          .select('*')
          .eq('owner_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('daily_rewards')
          .select('*')
          .order('reward_date', { ascending: false })
          .limit(7),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (walletsRes.data) setWallets(walletsRes.data);
      if (minersRes.data) setMiners(minersRes.data);
      if (rewardsRes.data) setRecentRewards(rewardsRes.data);

      if (profileRes.data) {
        setProfile(profileRes.data);

        const vipRes = await supabase
          .from('vip_levels')
          .select('*')
          .eq('level', profileRes.data.vip_level)
          .maybeSingle();

        if (vipRes.data) setVIPLevel(vipRes.data);

        if (profileRes.data.service_button_last_pressed) {
          const lastPressed = new Date(profileRes.data.service_button_last_pressed).getTime();
          const cooldownMs = 24 * 60 * 60 * 1000;
          const timeSince = Date.now() - lastPressed;
          const remaining = Math.max(0, cooldownMs - timeSince);
          setServiceButtonCooldown(remaining);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceButtonCooldown > 0) {
      const timer = setInterval(() => {
        setServiceButtonCooldown(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [serviceButtonCooldown]);

  const handleServiceButton = async () => {
    if (!user || !profile || serviceButtonCooldown > 0 || pressingService) return;

    setPressingService(true);
    try {
      const rewardAmount = vipLevel ? parseFloat(vipLevel.service_button_reward) : 10;

      await supabase
        .from('user_profiles')
        .update({
          service_button_last_pressed: new Date().toISOString(),
          service_button_presses: (profile.service_button_presses || 0) + 1
        })
        .eq('user_id', user.id);

      const tytWallet = wallets.find(w => w.asset === 'TYT');
      if (tytWallet) {
        const newBalance = parseFloat(tytWallet.balance) + rewardAmount;
        await supabase
          .from('custodial_wallets')
          .update({ balance: newBalance.toString() })
          .eq('id', tytWallet.id);
      }

      setServiceButtonCooldown(24 * 60 * 60 * 1000);
      await loadDashboardData();
    } catch (error) {
      console.error('Error pressing service button:', error);
    } finally {
      setPressingService(false);
    }
  };

  const formatCooldown = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const totalHashrate = miners.reduce((sum, miner) => sum + miner.hashrate_th, 0);
  const avgEfficiency = miners.length > 0
    ? miners.reduce((sum, miner) => sum + miner.efficiency_w_per_th, 0) / miners.length
    : 0;

  const todayReward = recentRewards[0];
  const weeklyRewards = recentRewards.reduce(
    (sum, reward) => sum + parseFloat(reward.net_btc),
    0
  );

  const nextVipLevel = vipLevel && profile ? (
    vipLevel.level < 10 ? vipLevel.level + 1 : null
  ) : null;

  const vipProgress = profile && vipLevel && nextVipLevel ? (
    ((profile.total_spent - parseFloat(vipLevel.min_spent)) /
      (parseFloat(vipLevel.max_spent) - parseFloat(vipLevel.min_spent))) * 100
  ) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-white font-semibold">{user?.email?.split('@')[0]}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile && vipLevel && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs text-gray-400">VIP Level</div>
                <div className="font-bold text-amber-400">{vipLevel.level}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">BTC Balance</div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {wallets.find(w => w.asset === 'BTC')?.balance || '0.00000000'}
          </div>
          <div className="text-xs text-gray-500">
            ≈ ${(parseFloat(wallets.find(w => w.asset === 'BTC')?.balance || '0') * 95000).toFixed(2)} USD
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">TYT Balance</div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {parseFloat(wallets.find(w => w.asset === 'TYT')?.balance || '0').toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">
            For maintenance discounts
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">Total Hashrate</div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {totalHashrate.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            {miners.length} active miner{miners.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">Daily Reward</div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {todayReward ? parseFloat(todayReward.net_btc).toFixed(8) : '0.00000000'}
          </div>
          <div className="text-xs text-gray-500">
            Weekly: {weeklyRewards.toFixed(8)} BTC
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">Efficiency</div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {avgEfficiency.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            W/TH avg efficiency
          </div>
        </div>
      </div>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Service Button</h3>
                  <p className="text-sm text-gray-400">Press daily to earn {vipLevel ? parseFloat(vipLevel.service_button_reward) : 10} TYT</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Total Presses</div>
                <div className="text-2xl font-bold text-amber-400">{profile.service_button_presses || 0}</div>
              </div>
            </div>

            <button
              onClick={handleServiceButton}
              disabled={serviceButtonCooldown > 0 || pressingService}
              className={`w-full py-6 rounded-xl font-bold text-lg transition-all ${
                serviceButtonCooldown > 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-xl hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] text-white'
              }`}
            >
              {pressingService ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : serviceButtonCooldown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Available in {formatCooldown(serviceButtonCooldown)}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6" />
                  Press Now to Earn TYT
                </span>
              )}
            </button>
          </div>

          {vipLevel && nextVipLevel && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">VIP Progress</h3>
                  <p className="text-sm text-gray-400">Level {vipLevel.level} → {nextVipLevel}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-bold text-amber-400">{Math.min(100, vipProgress).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, vipProgress)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Current Benefits</div>
                    <div className="text-sm font-semibold text-amber-400">
                      {parseFloat(vipLevel.maintenance_discount).toFixed(0)}% Discount
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Total Spent</div>
                    <div className="text-sm font-semibold text-white">
                      ${parseFloat(profile.total_spent).toFixed(2)}
                    </div>
                  </div>
                </div>

                <Link
                  to="/app/settings"
                  className="block text-center py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold hover:bg-amber-500/30 transition-all"
                >
                  View All Benefits
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {miners.length === 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/50 rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 bg-amber-500/20 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-amber-400 mb-2">Start Your Mining Journey</h3>
              <p className="text-gray-300 mb-4 max-w-2xl">
                You don't have any active miners yet. Purchase your first NFT miner from the marketplace to start earning daily BTC rewards. Each miner provides stable, passive income with transparent ROI calculations.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/app/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:shadow-xl hover:shadow-amber-500/50 transition-all"
                >
                  <ShoppingCart size={20} />
                  Browse Marketplace
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/app/academy"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <NetworkStatsWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MinerPerformanceWidget />
        <RewardsSummaryWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">Recent Rewards</h2>
            </div>
            <Link
              to="/app/rewards"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          {recentRewards.length > 0 ? (
            <div className="space-y-3">
              {recentRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div className="text-sm font-semibold">
                        {new Date(reward.reward_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-green-400">
                      +{parseFloat(reward.net_btc).toFixed(8)} BTC
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Gross: {parseFloat(reward.gross_btc).toFixed(8)} BTC</span>
                    <span>Maint: {parseFloat(reward.maintenance_cost_btc).toFixed(8)} BTC</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-center">No rewards yet.<br />Start mining to earn BTC!</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Cpu className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold">My Miners</h2>
            </div>
            <Link
              to="/app/miners"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Manage All
              <ArrowRight size={16} />
            </Link>
          </div>

          {miners.length > 0 ? (
            <div className="space-y-3">
              {miners.slice(0, 3).map((miner) => (
                <div
                  key={miner.id}
                  className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="font-semibold">Miner #{miner.id.slice(0, 8)}</div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold uppercase">
                      {miner.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-gray-900/50 rounded">
                      <div className="text-xs text-gray-400 mb-1">Hashrate</div>
                      <div className="font-bold text-amber-400">{miner.hashrate_th} TH/s</div>
                    </div>
                    <div className="text-center p-2 bg-gray-900/50 rounded">
                      <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                      <div className="font-bold text-blue-400">{miner.efficiency_w_per_th} W/TH</div>
                    </div>
                    <div className="text-center p-2 bg-gray-900/50 rounded">
                      <div className="text-xs text-gray-400 mb-1">Power</div>
                      <div className="font-bold text-white">Lv.{miner.power_level}</div>
                    </div>
                  </div>
                </div>
              ))}
              {miners.length > 3 && (
                <div className="text-center text-sm text-gray-400 py-2">
                  +{miners.length - 3} more miner{miners.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Cpu className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-center">No miners yet.<br />Purchase your first miner!</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/app/marketplace"
            className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl hover:from-amber-500/10 hover:to-orange-500/10 border border-gray-700 hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-all">
                <ShoppingCart className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-lg mb-1">Buy Miners</div>
                <div className="text-sm text-gray-400">Browse marketplace for NFT miners</div>
              </div>
            </div>
          </Link>

          <Link
            to="/app/academy"
            className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl hover:from-blue-500/10 hover:to-cyan-500/10 border border-gray-700 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-all">
                <Award className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-lg mb-1">Learn & Earn</div>
                <div className="text-sm text-gray-400">Complete courses for TYT rewards</div>
              </div>
            </div>
          </Link>

          <Link
            to="/app/wallet"
            className="group p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl hover:from-green-500/10 hover:to-emerald-500/10 border border-gray-700 hover:border-green-500/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-all">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="font-bold text-lg mb-1">Manage Wallet</div>
                <div className="text-sm text-gray-400">Deposits, withdrawals & swaps</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {profile && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Account Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Member Since</div>
              <div className="font-bold text-white">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Total Spent</div>
              <div className="font-bold text-amber-400">${parseFloat(profile.total_spent).toFixed(2)}</div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Referrals</div>
              <div className="font-bold text-green-400">{profile.referral_count || 0}</div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">KYC Status</div>
              <div className={`font-bold ${profile.kyc_status === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                {profile.kyc_status || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
