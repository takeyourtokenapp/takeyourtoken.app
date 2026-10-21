import { useState } from 'react';
import { X, Zap, TrendingUp, Info, CheckCircle } from 'lucide-react';

interface MinerUpgradeModalProps {
  miner: {
    id: string;
    name: string;
    powerTH: number;
    efficiencyWTH: number;
    tier: string;
  };
  onClose: () => void;
  onUpgrade: (type: 'hashrate' | 'efficiency', amount: number) => Promise<void>;
}

export default function MinerUpgradeModal({ miner, onClose, onUpgrade }: MinerUpgradeModalProps) {
  const [upgradeType, setUpgradeType] = useState<'hashrate' | 'efficiency'>('hashrate');
  const [amount, setAmount] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const calculateHashrateUpgradeCost = (th: number) => {
    const basePrice = 45;
    const premium = 1.1;
    return (th * basePrice * premium).toFixed(2);
  };

  const calculateEfficiencyUpgradeCost = (currentEff: number, targetEff: number) => {
    const improvement = currentEff - targetEff;
    const costPerPoint = 250;
    return (improvement * costPerPoint).toFixed(0);
  };

  const efficiencyTiers = [
    { name: 'Standard', value: miner.efficiencyWTH, cost: 0 },
    { name: 'Pro', value: Math.max(25, miner.efficiencyWTH - 3), cost: 750 },
    { name: 'Elite', value: Math.max(22, miner.efficiencyWTH - 6), cost: 1500 },
    { name: 'Ultimate', value: Math.max(19, miner.efficiencyWTH - 9), cost: 2250 },
  ];

  const currentTierIndex = efficiencyTiers.findIndex(t => t.value === miner.efficiencyWTH);
  const availableTiers = efficiencyTiers.slice(currentTierIndex + 1);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      if (upgradeType === 'hashrate') {
        await onUpgrade('hashrate', parseFloat(amount));
      } else {
        const selectedTier = efficiencyTiers.find(t => t.value === parseFloat(amount));
        if (selectedTier) {
          await onUpgrade('efficiency', selectedTier.value);
        }
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const costTYT = upgradeType === 'hashrate'
    ? calculateHashrateUpgradeCost(parseFloat(amount))
    : calculateEfficiencyUpgradeCost(miner.efficiencyWTH, parseFloat(amount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-owl-navy via-owl-slate to-black border-2 border-gold-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-gold-glow">
        <div className="sticky top-0 bg-gradient-to-r from-gold-900/50 to-amber-900/50 backdrop-blur-glass border-b border-gold-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-owl-gradient bg-clip-text text-transparent">
              Upgrade Miner
            </h2>
            <p className="text-sm text-gray-400">{miner.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gold-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-green-400 mb-2">Upgrade Successful!</h3>
            <p className="text-gray-300">Your miner has been upgraded</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setUpgradeType('hashrate')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  upgradeType === 'hashrate'
                    ? 'border-gold-500 bg-gold-500/20 shadow-gold-glow'
                    : 'border-gray-700 hover:border-gold-700'
                }`}
              >
                <Zap className={`mx-auto mb-2 ${upgradeType === 'hashrate' ? 'text-gold-400' : 'text-gray-400'}`} size={32} />
                <div className="font-bold">Hashrate Upgrade</div>
                <div className="text-sm text-gray-400">Add more TH/s</div>
              </button>

              <button
                onClick={() => setUpgradeType('efficiency')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  upgradeType === 'efficiency'
                    ? 'border-gold-500 bg-gold-500/20 shadow-gold-glow'
                    : 'border-gray-700 hover:border-gold-700'
                }`}
              >
                <TrendingUp className={`mx-auto mb-2 ${upgradeType === 'efficiency' ? 'text-gold-400' : 'text-gray-400'}`} size={32} />
                <div className="font-bold">Efficiency Upgrade</div>
                <div className="text-sm text-gray-400">Reduce W/TH</div>
              </button>
            </div>

            {upgradeType === 'hashrate' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Add TH/s</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    max="500"
                    step="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/50 transition-all"
                  />
                  <div className="mt-2 flex gap-2">
                    {[10, 25, 50, 100].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className="px-3 py-1 bg-gray-800 hover:bg-gold-500/20 border border-gray-700 hover:border-gold-500 rounded-lg text-sm transition-all"
                      >
                        +{preset} TH/s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-owl-slate/50 rounded-xl p-4 border border-gold-800">
                  <div className="flex items-center gap-2 mb-3 text-gold-400">
                    <Info size={18} />
                    <span className="font-semibold">Upgrade Details</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Hashrate:</span>
                      <span className="font-semibold">{miner.powerTH} TH/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">New Hashrate:</span>
                      <span className="font-semibold text-gold-400">{miner.powerTH + parseFloat(amount)} TH/s</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-700 pt-2">
                      <span className="text-gray-400">Upgrade Cost:</span>
                      <span className="font-bold text-lg">{costTYT} TYT</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Includes 10% premium. Tokens will be burned.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Select Efficiency Tier</label>
                  <div className="space-y-3">
                    {availableTiers.length > 0 ? availableTiers.map(tier => (
                      <button
                        key={tier.name}
                        onClick={() => setAmount(tier.value.toString())}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          amount === tier.value.toString()
                            ? 'border-gold-500 bg-gold-500/20 shadow-gold-glow'
                            : 'border-gray-700 hover:border-gold-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg">{tier.name}</span>
                          <span className="text-gold-400 font-bold">{tier.cost} TYT</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            {miner.efficiencyWTH} W/TH → <span className="text-green-400">{tier.value} W/TH</span>
                          </span>
                          <span className="text-green-400">
                            {((miner.efficiencyWTH - tier.value) / miner.efficiencyWTH * 100).toFixed(1)}% savings
                          </span>
                        </div>
                      </button>
                    )) : (
                      <div className="text-center py-8 text-gray-400">
                        <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Your miner is already at maximum efficiency!</p>
                      </div>
                    )}
                  </div>
                </div>

                {availableTiers.length > 0 && (
                  <div className="bg-owl-slate/50 rounded-xl p-4 border border-gold-800">
                    <div className="flex items-center gap-2 mb-3 text-green-400">
                      <TrendingUp size={18} />
                      <span className="font-semibold">Annual Savings Estimate</span>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current electricity cost:</span>
                        <span>${(miner.powerTH * miner.efficiencyWTH * 24 * 0.065 / 1000 * 365).toFixed(0)}/year</span>
                      </div>
                      {amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">New electricity cost:</span>
                          <span className="text-green-400">
                            ${(miner.powerTH * parseFloat(amount) * 24 * 0.065 / 1000 * 365).toFixed(0)}/year
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={isProcessing || (upgradeType === 'efficiency' && availableTiers.length === 0)}
              className="w-full py-4 bg-owl-gradient hover:shadow-gold-glow rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Upgrade for ${costTYT} TYT`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
