import { useState, useEffect } from 'react';
import {
  Crown,
  TrendingUp,
  DollarSign,
  Percent,
  Zap,
  ChevronRight,
  ChevronUp,
  Calculator,
  Gift,
  Shield
} from 'lucide-react';

interface VIPTier {
  level: number;
  name: string;
  minSpent: number;
  maxSpent: number;
  maintenanceDiscount: number;
  serviceButtonReward: number;
  referralBonus: number;
  prioritySupport: boolean;
  exclusiveAccess: boolean;
}

const VIP_TIERS: VIPTier[] = [
  { level: 1, name: 'Bronze', minSpent: 0, maxSpent: 999, maintenanceDiscount: 2, serviceButtonReward: 10, referralBonus: 5, prioritySupport: false, exclusiveAccess: false },
  { level: 2, name: 'Silver', minSpent: 1000, maxSpent: 4999, maintenanceDiscount: 5, serviceButtonReward: 20, referralBonus: 7, prioritySupport: false, exclusiveAccess: false },
  { level: 3, name: 'Gold', minSpent: 5000, maxSpent: 14999, maintenanceDiscount: 9, serviceButtonReward: 35, referralBonus: 10, prioritySupport: true, exclusiveAccess: false },
  { level: 4, name: 'Platinum', minSpent: 15000, maxSpent: 49999, maintenanceDiscount: 13, serviceButtonReward: 50, referralBonus: 12, prioritySupport: true, exclusiveAccess: true },
  { level: 5, name: 'Diamond', minSpent: 50000, maxSpent: Infinity, maintenanceDiscount: 18, serviceButtonReward: 100, referralBonus: 15, prioritySupport: true, exclusiveAccess: true }
];

interface CalculatorInputs {
  monthlyMaintenanceCost: number;
  currentTier: number;
  tytPayment: boolean;
}

interface SavingsCalculation {
  monthlySavings: number;
  yearlySavings: number;
  dailyServiceReward: number;
  yearlyServiceReward: number;
  totalYearlyBenefit: number;
}

export default function VIPBenefitsCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    monthlyMaintenanceCost: 500,
    currentTier: 1,
    tytPayment: true
  });
  const [savings, setSavings] = useState<SavingsCalculation | null>(null);
  const [showTierDetails, setShowTierDetails] = useState(false);

  useEffect(() => {
    calculateSavings();
  }, [inputs]);

  function calculateSavings() {
    const tier = VIP_TIERS[inputs.currentTier - 1];
    if (!tier) return;

    let discountRate = tier.maintenanceDiscount / 100;

    if (inputs.tytPayment) {
      discountRate += 0.20;
    }

    const monthlySavings = inputs.monthlyMaintenanceCost * discountRate;
    const yearlySavings = monthlySavings * 12;

    const dailyServiceReward = tier.serviceButtonReward;
    const yearlyServiceReward = dailyServiceReward * 365;

    setSavings({
      monthlySavings,
      yearlySavings,
      dailyServiceReward,
      yearlyServiceReward,
      totalYearlyBenefit: yearlySavings + yearlyServiceReward * 0.05
    });
  }

  const currentTier = VIP_TIERS[inputs.currentTier - 1];
  const nextTier = inputs.currentTier < 5 ? VIP_TIERS[inputs.currentTier] : null;

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Calculator className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold">VIP Benefits Calculator</h3>
          <p className="text-xs text-gray-400">Calculate your potential savings</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Monthly Maintenance Cost (USD)</label>
          <input
            type="number"
            value={inputs.monthlyMaintenanceCost}
            onChange={(e) => setInputs({ ...inputs, monthlyMaintenanceCost: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none"
            min="0"
            step="50"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Current VIP Tier</label>
          <div className="grid grid-cols-5 gap-2">
            {VIP_TIERS.map((tier) => (
              <button
                key={tier.level}
                onClick={() => setInputs({ ...inputs, currentTier: tier.level })}
                className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                  inputs.currentTier === tier.level
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                {tier.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Pay with TYT (+20% discount)</label>
          <button
            onClick={() => setInputs({ ...inputs, tytPayment: !inputs.tytPayment })}
            className={`w-12 h-6 rounded-full transition-all ${
              inputs.tytPayment ? 'bg-amber-500' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transform transition-all ${
                inputs.tytPayment ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {savings && currentTier && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Percent className="w-4 h-4" />
                Monthly Savings
              </div>
              <div className="text-xl font-bold text-green-400">
                ${savings.monthlySavings.toFixed(2)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                Yearly Savings
              </div>
              <div className="text-xl font-bold text-amber-400">
                ${savings.yearlySavings.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Service Button Rewards</span>
              <span className="text-sm text-amber-400">{savings.dailyServiceReward} TYT/day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Yearly TYT Rewards</span>
              <span className="text-sm font-bold text-amber-400">{savings.yearlyServiceReward.toLocaleString()} TYT</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Total Yearly Benefit</div>
                <div className="text-2xl font-bold text-amber-400">
                  ${savings.totalYearlyBenefit.toFixed(2)}
                </div>
              </div>
              <Gift className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowTierDetails(!showTierDetails)}
        className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1"
      >
        {showTierDetails ? 'Hide' : 'Show'} Tier Details
        {showTierDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {showTierDetails && (
        <div className="mt-4 space-y-3">
          {VIP_TIERS.map((tier) => (
            <div
              key={tier.level}
              className={`p-4 rounded-lg border ${
                inputs.currentTier === tier.level
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className={`w-4 h-4 ${inputs.currentTier === tier.level ? 'text-amber-400' : 'text-gray-500'}`} />
                  <span className="font-semibold">{tier.name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  ${tier.minSpent.toLocaleString()}
                  {tier.maxSpent !== Infinity && ` - $${tier.maxSpent.toLocaleString()}`}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-green-400" />
                  <span>{tier.maintenanceDiscount}% discount</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{tier.serviceButtonReward} TYT/day</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-blue-400" />
                  <span>{tier.referralBonus}% referral</span>
                </div>
                {tier.prioritySupport && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>Priority</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nextTier && (
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Upgrade to {nextTier.name}</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Spend ${(nextTier.minSpent).toLocaleString()} to unlock
            </span>
            <span className="text-xs text-amber-400">
              +{nextTier.maintenanceDiscount - currentTier.maintenanceDiscount}% more discount
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
