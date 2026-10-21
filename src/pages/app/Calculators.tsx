import { Calculator } from 'lucide-react';
import MiningROICalculator from '../../components/calculators/MiningROICalculator';
import VIPBenefitsCalculator from '../../components/calculators/VIPBenefitsCalculator';

export default function Calculators() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-amber-400" />
          Interactive Calculators
        </h1>
        <p className="text-gray-400">
          Plan your mining strategy and calculate potential returns
        </p>
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        <MiningROICalculator />
        <VIPBenefitsCalculator />
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold mb-4">About These Calculators</h3>
        <div className="space-y-3 text-gray-300">
          <p>
            <span className="font-semibold text-amber-400">Mining ROI Calculator:</span> Calculate your expected returns based on hashrate,
            efficiency, and electricity costs. This tool helps you make informed decisions about miner purchases and upgrades.
          </p>
          <p>
            <span className="font-semibold text-purple-400">VIP Benefits Calculator:</span> Discover how much you can save with VIP tiers,
            TYT payments, and service button activation. Maximize your profitability by optimizing discount combinations.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
            <div className="font-semibold text-blue-400 mb-2">Important Notes</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All calculations are estimates and may vary based on network conditions</li>
              <li>Bitcoin price volatility can significantly impact returns</li>
              <li>Network difficulty adjusts every 2016 blocks (~2 weeks)</li>
              <li>Actual rewards may differ from projections</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
