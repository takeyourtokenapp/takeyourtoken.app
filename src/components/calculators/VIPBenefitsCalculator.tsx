import { useState } from 'react';
import { Crown, Percent, DollarSign, TrendingUp, Award } from 'lucide-react';

type VIPTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface TierInfo {
  name: string;
  discount: number;
  color: string;
  minMonthly: number;
}

const VIP_TIERS: Record<VIPTier, TierInfo> = {
  none: { name: 'No VIP', discount: 0, color: 'text-gray-400', minMonthly: 0 },
  bronze: { name: 'Bronze', discount: 2, color: 'text-orange-600', minMonthly: 100 },
  silver: { name: 'Silver', discount: 5, color: 'text-gray-300', minMonthly: 500 },
  gold: { name: 'Gold', discount: 9, color: 'text-yellow-400', minMonthly: 1500 },
  platinum: { name: 'Platinum', discount: 13, color: 'text-cyan-400', minMonthly: 5000 },
  diamond: { name: 'Diamond', discount: 18, color: 'text-purple-400', minMonthly: 15000 }
};

export default function VIPBenefitsCalculator() {
  const [tier, setTier] = useState<VIPTier>('none');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState('1000');
  const [tytPayment, setTytPayment] = useState(true);
  const [serviceButton, setServiceButton] = useState(true);

  const calculateSavings = () => {
    const maintenanceNum = parseFloat(monthlyMaintenance) || 0;

    const vipDiscount = VIP_TIERS[tier].discount;
    const tytDiscount = tytPayment ? 20 : 0;
    const serviceDiscount = serviceButton ? 3 : 0;

    const totalDiscount = Math.min(vipDiscount + tytDiscount + serviceDiscount, 35);

    const savings = maintenanceNum * (totalDiscount / 100);
    const finalCost = maintenanceNum - savings;

    const yearlySavings = savings * 12;
    const yearlyMaintenance = maintenanceNum * 12;

    return {
      vipDiscount,
      tytDiscount,
      serviceDiscount,
      totalDiscount,
      monthlySavings: savings.toFixed(2),
      finalMonthlyCost: finalCost.toFixed(2),
      yearlySavings: yearlySavings.toFixed(2),
      yearlyMaintenance: yearlyMaintenance.toFixed(2)
    };
  };

  const results = calculateSavings();

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">VIP Benefits Calculator</h3>
          <p className="text-sm text-gray-400">Calculate your potential savings</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Monthly Maintenance Cost ($)
          </label>
          <input
            type="number"
            value={monthlyMaintenance}
            onChange={(e) => setMonthlyMaintenance(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            step="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Select VIP Tier
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(VIP_TIERS) as VIPTier[]).map((tierKey) => {
              const tierInfo = VIP_TIERS[tierKey];
              return (
                <button
                  key={tierKey}
                  onClick={() => setTier(tierKey)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                    tier === tierKey
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 hover:border-purple-700'
                  }`}
                >
                  <div className={`font-semibold text-sm ${tierInfo.color}`}>
                    {tierInfo.name}
                  </div>
                  <div className="text-xs text-gray-500">{tierInfo.discount}%</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="font-semibold mb-3">Additional Discounts</h4>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={tytPayment}
                  onChange={(e) => setTytPayment(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="font-semibold">Pay in TYT</div>
                  <div className="text-xs text-gray-400">20% discount + auto-burn</div>
                </div>
              </div>
              <div className="text-amber-400 font-bold">-20%</div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={serviceButton}
                  onChange={(e) => setServiceButton(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold">Service Button</div>
                  <div className="text-xs text-gray-400">Daily 3% discount</div>
                </div>
              </div>
              <div className="text-blue-400 font-bold">-3%</div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-lg">Savings Summary</h4>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Total Discount
            </span>
            <span className="text-4xl font-bold text-purple-400">{results.totalDiscount}%</span>
          </div>
          <div className="text-sm text-gray-400">
            Maximum platform discount: 35%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Monthly Savings
            </div>
            <div className="text-2xl font-bold text-green-400">${results.monthlySavings}</div>
            <div className="text-xs text-gray-500 mt-1">Final: ${results.finalMonthlyCost}/mo</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              Yearly Savings
            </div>
            <div className="text-2xl font-bold text-amber-400">${results.yearlySavings}</div>
            <div className="text-xs text-gray-500 mt-1">Total: ${results.yearlyMaintenance}/yr</div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h5 className="font-semibold mb-3">Discount Breakdown</h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">VIP {VIP_TIERS[tier].name}</span>
              <span className="font-semibold text-purple-400">{results.vipDiscount}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">TYT Payment</span>
              <span className={`font-semibold ${tytPayment ? 'text-amber-400' : 'text-gray-600'}`}>
                {tytPayment ? results.tytDiscount : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Service Button</span>
              <span className={`font-semibold ${serviceButton ? 'text-blue-400' : 'text-gray-600'}`}>
                {serviceButton ? results.serviceDiscount : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="font-semibold">Total Discount</span>
              <span className="font-bold text-purple-400">{results.totalDiscount}%</span>
            </div>
          </div>
        </div>

        {tier !== 'none' && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Award className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-purple-400 mb-1">
                  {VIP_TIERS[tier].name} VIP Requirements
                </div>
                <div className="text-gray-300">
                  Minimum ${VIP_TIERS[tier].minMonthly}/month in transactions or maintenance to maintain this tier.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
