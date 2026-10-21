import { useState } from 'react';
import { Heart, TrendingUp, Info, Lock, Unlock, Award, DollarSign } from 'lucide-react';

interface CharityStakingProps {
  userTYTBalance: number;
  currentStake: number;
  totalStaked: number;
  annualYield: number;
  foundationReceived: number;
  onStake: (amount: number, duration: number) => Promise<void>;
  onUnstake: () => Promise<void>;
}

export default function CharityStaking({
  userTYTBalance,
  currentStake,
  totalStaked,
  annualYield,
  foundationReceived,
  onStake,
  onUnstake
}: CharityStakingProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState(365);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);

  const stakeDurations = [
    { days: 30, multiplier: 1.0, label: '1 Month' },
    { days: 90, multiplier: 1.25, label: '3 Months' },
    { days: 180, multiplier: 1.5, label: '6 Months' },
    { days: 365, multiplier: 2.0, label: '1 Year' }
  ];

  const selectedDuration = stakeDurations.find(d => d.days === stakeDuration)!;
  const amount = parseFloat(stakeAmount) || 0;
  const estimatedYield = (amount * annualYield * selectedDuration.multiplier) / 365 * stakeDuration;
  const foundationAmount = estimatedYield;

  const handleStake = async () => {
    if (amount <= 0 || amount > userTYTBalance) return;

    setIsStaking(true);
    try {
      await onStake(amount, stakeDuration);
      setStakeAmount('');
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    setIsUnstaking(true);
    try {
      await onUnstake();
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsUnstaking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-owl-slate via-gray-900 to-black border-2 border-pink-700 rounded-2xl p-6 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-pink-500/20 rounded-xl border border-pink-500">
          <Heart size={28} className="text-pink-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Charity Staking</h3>
          <p className="text-sm text-gray-400">Stake TYT, earn yield, 100% goes to Foundation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-pink-400" />
            <span className="text-sm text-gray-400">Total Staked (Global)</span>
          </div>
          <div className="text-2xl font-bold text-pink-400">{totalStaked.toLocaleString()} TYT</div>
          <div className="text-xs text-gray-500 mt-1">${(totalStaked * 0.05).toLocaleString()}</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-400" />
            <span className="text-sm text-gray-400">Annual Yield</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{(annualYield * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Dynamic rate</div>
        </div>

        <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-gold-400" />
            <span className="text-sm text-gray-400">Foundation Received</span>
          </div>
          <div className="text-2xl font-bold text-gold-400">{foundationReceived.toLocaleString()} TYT</div>
          <div className="text-xs text-gray-500 mt-1">${(foundationReceived * 0.05).toLocaleString()}</div>
        </div>
      </div>

      {currentStake > 0 ? (
        <div className="bg-owl-slate/50 rounded-xl p-6 border border-pink-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Your Active Stake</div>
              <div className="text-3xl font-bold text-pink-400">{currentStake.toLocaleString()} TYT</div>
            </div>
            <div className="p-4 bg-pink-500/20 rounded-xl">
              <Lock size={32} className="text-pink-400" />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Stake Duration:</span>
              <span className="font-semibold">365 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Days Remaining:</span>
              <span className="font-semibold text-amber-400">245 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Yield:</span>
              <span className="font-semibold text-green-400">+{(currentStake * annualYield).toFixed(2)} TYT</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-gray-400">Goes to Foundation:</span>
              <span className="font-bold text-pink-400">100%</span>
            </div>
          </div>

          <button
            onClick={handleUnstake}
            disabled={isUnstaking}
            className="w-full mt-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUnstaking ? (
              <>
                <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                Unstaking...
              </>
            ) : (
              <>
                <Unlock size={20} />
                Emergency Unstake (Lose Rewards)
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Stake Amount</label>
            <div className="relative">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                max={userTYTBalance}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg pr-20 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition-all"
              />
              <button
                onClick={() => setStakeAmount(userTYTBalance.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500 rounded text-sm font-semibold transition-all"
              >
                MAX
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Available: {userTYTBalance.toLocaleString()} TYT
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Lock Duration</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stakeDurations.map(duration => (
                <button
                  key={duration.days}
                  onClick={() => setStakeDuration(duration.days)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    stakeDuration === duration.days
                      ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                      : 'border-gray-700 hover:border-pink-700'
                  }`}
                >
                  <div className="text-lg font-bold mb-1">{duration.label}</div>
                  <div className="text-sm text-pink-400">{duration.multiplier}x yield</div>
                </button>
              ))}
            </div>
          </div>

          {amount > 0 && (
            <div className="bg-owl-slate/50 rounded-xl p-4 border border-pink-800">
              <div className="flex items-center gap-2 mb-3 text-pink-400">
                <Award size={18} />
                <span className="font-semibold">Staking Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Stake:</span>
                  <span className="font-semibold">{amount.toLocaleString()} TYT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-semibold">{selectedDuration.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yield Multiplier:</span>
                  <span className="font-semibold text-green-400">{selectedDuration.multiplier}x</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-400">Estimated Yield:</span>
                  <span className="font-bold text-green-400">+{estimatedYield.toFixed(2)} TYT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Donated to Foundation:</span>
                  <span className="font-bold text-pink-400">{foundationAmount.toFixed(2)} TYT</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                  <span>Estimated USD Value:</span>
                  <span>${(foundationAmount * 0.05).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
            <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <div className="font-semibold text-blue-400">How Charity Staking Works:</div>
              <ul className="space-y-1 text-gray-300 list-disc list-inside">
                <li>Lock your TYT for a fixed period</li>
                <li>Earn yield based on platform revenue</li>
                <li>100% of your yield goes to the Foundation</li>
                <li>Longer locks = higher multiplier</li>
                <li>Principal returned after lock period</li>
                <li>Early unstake forfeits all rewards</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleStake}
            disabled={isStaking || amount <= 0 || amount > userTYTBalance}
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-pink-800 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStaking ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Staking...
              </>
            ) : (
              <>
                <Heart size={20} />
                Stake for Charity
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
