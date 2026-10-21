import { useState } from 'react';
import { TrendingUp, Info, Save, CheckCircle2 } from 'lucide-react';

interface ReinvestSettingsProps {
  currentPercent: number;
  estimatedDailyBTC: number;
  onSave: (percent: number) => Promise<void>;
}

export default function ReinvestSettings({ currentPercent, estimatedDailyBTC, onSave }: ReinvestSettingsProps) {
  const [reinvestPercent, setReinvestPercent] = useState(currentPercent);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(reinvestPercent);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save reinvest settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const reinvestedBTC = estimatedDailyBTC * (reinvestPercent / 100);
  const creditedBTC = estimatedDailyBTC * (1 - reinvestPercent / 100);

  const calculateCompounding = (days: number) => {
    const btcPrice = 95000;
    const thCost = 45;
    const dailyReinvest = reinvestedBTC * btcPrice;
    const thPerDay = dailyReinvest / thCost;
    const totalTH = thPerDay * days;
    const bonusTH = totalTH * 0.05;
    return {
      totalTH: (totalTH + bonusTH).toFixed(2),
      bonusTH: bonusTH.toFixed(2),
      extraDaily: (totalTH * 0.0001 * 0.95).toFixed(8)
    };
  };

  const compound30 = calculateCompounding(30);
  const compound365 = calculateCompounding(365);

  return (
    <div className="bg-gradient-to-br from-owl-slate via-gray-900 to-black border-2 border-gold-700 rounded-2xl p-6 shadow-gold-glow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gold-500/20 rounded-xl border border-gold-500">
          <TrendingUp size={24} className="text-gold-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Auto-Reinvest Settings</h3>
          <p className="text-sm text-gray-400">Compound your earnings automatically</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Reinvest Percentage</label>
            <span className="text-3xl font-bold text-gold-400">{reinvestPercent}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={reinvestPercent}
            onChange={(e) => setReinvestPercent(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
            style={{
              background: `linear-gradient(to right, #D2A44C 0%, #D2A44C ${reinvestPercent}%, #374151 ${reinvestPercent}%, #374151 100%)`
            }}
          />

          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0% (All to wallet)</span>
            <span>50%</span>
            <span>100% (Full reinvest)</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-4">
            {[0, 25, 50, 75, 100].map(preset => (
              <button
                key={preset}
                onClick={() => setReinvestPercent(preset)}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  reinvestPercent === preset
                    ? 'bg-gold-500 text-white shadow-gold-glow'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Daily to Wallet</div>
            <div className="text-2xl font-bold text-green-400">{creditedBTC.toFixed(8)} BTC</div>
            <div className="text-xs text-gray-500 mt-1">${(creditedBTC * 95000).toFixed(2)}</div>
          </div>

          <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Daily Reinvested</div>
            <div className="text-2xl font-bold text-gold-400">{reinvestedBTC.toFixed(8)} BTC</div>
            <div className="text-xs text-gray-500 mt-1">${(reinvestedBTC * 95000).toFixed(2)}</div>
          </div>
        </div>

        {reinvestPercent > 0 && (
          <div className="bg-owl-slate/50 rounded-xl p-4 border border-gold-800 space-y-4">
            <div className="flex items-center gap-2 text-gold-400">
              <Info size={18} />
              <span className="font-semibold">Compounding Projections (+5% Bonus)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">After 30 Days:</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Added Hashrate:</span>
                    <span className="font-semibold text-gold-400">+{compound30.totalTH} TH/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bonus TH:</span>
                    <span className="font-semibold text-green-400">+{compound30.bonusTH} TH/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Extra Daily:</span>
                    <span className="font-semibold">+{compound30.extraDaily} BTC</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-400">After 1 Year:</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Added Hashrate:</span>
                    <span className="font-semibold text-gold-400">+{compound365.totalTH} TH/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bonus TH:</span>
                    <span className="font-semibold text-green-400">+{compound365.bonusTH} TH/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Extra Daily:</span>
                    <span className="font-semibold">+{compound365.extraDaily} BTC</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
              Reinvested BTC automatically purchases additional TH/s at market rate.
              You receive a 5% bonus on all reinvest purchases. Projections based on
              current BTC price ($95,000) and average miner efficiency.
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || saved || reinvestPercent === currentPercent}
          className="w-full py-3 bg-owl-gradient hover:shadow-gold-glow rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved ? (
            <>
              <CheckCircle2 size={20} />
              Settings Saved!
            </>
          ) : isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Reinvest Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
