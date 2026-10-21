import { Link } from 'react-router-dom';
import {
  Crown,
  Star,
  Zap,
  Gift,
  Shield,
  TrendingUp,
  Users,
  Award,
  Check,
  ArrowRight,
  Sparkles,
  Heart,
  Clock
} from 'lucide-react';
import VIPBenefitsCalculator from '../components/VIPBenefitsCalculator';

export default function VIP() {
  const vipLevels = [
    {
      level: 1,
      name: 'Bronze',
      color: '#CD7F32',
      gradient: 'from-orange-700 to-orange-900',
      minSpent: 0,
      maxSpent: 999,
      maintenanceDiscount: 2,
      serviceButtonReward: 10,
      referralBonus: 0,
      features: [
        'Basic platform access',
        '2% maintenance discount',
        '10 TYT daily service button',
        'Standard support',
        'Community access'
      ]
    },
    {
      level: 2,
      name: 'Silver',
      color: '#C0C0C0',
      gradient: 'from-gray-400 to-gray-600',
      minSpent: 1000,
      maxSpent: 4999,
      maintenanceDiscount: 5,
      serviceButtonReward: 15,
      referralBonus: 1,
      features: [
        'All Bronze benefits',
        '5% maintenance discount',
        '15 TYT daily service button',
        'Priority email support',
        '+1% referral bonus',
        'Marketplace early access'
      ]
    },
    {
      level: 3,
      name: 'Gold',
      color: '#FFD700',
      gradient: 'from-yellow-400 to-yellow-600',
      minSpent: 5000,
      maxSpent: 14999,
      maintenanceDiscount: 9,
      serviceButtonReward: 25,
      referralBonus: 2,
      features: [
        'All Silver benefits',
        '9% maintenance discount',
        '25 TYT daily service button',
        'Priority chat support',
        '+2% referral bonus',
        'Advanced analytics',
        'Monthly bonus rewards'
      ]
    },
    {
      level: 4,
      name: 'Platinum',
      color: '#E5E4E2',
      gradient: 'from-slate-300 to-slate-500',
      minSpent: 15000,
      maxSpent: 49999,
      maintenanceDiscount: 13,
      serviceButtonReward: 40,
      referralBonus: 3,
      features: [
        'All Gold benefits',
        '13% maintenance discount',
        '40 TYT daily service button',
        'Dedicated account manager',
        '+3% referral bonus',
        'Premium academy courses',
        'Exclusive marketplace listings',
        'Quarterly bonus packages'
      ]
    },
    {
      level: 5,
      name: 'Diamond',
      color: '#B9F2FF',
      gradient: 'from-cyan-300 to-blue-500',
      minSpent: 50000,
      maxSpent: 999999999,
      maintenanceDiscount: 18,
      serviceButtonReward: 100,
      referralBonus: 5,
      features: [
        'All Platinum benefits',
        '18% maintenance discount (MAX)',
        '100 TYT daily service button',
        '24/7 VIP support hotline',
        '+5% referral bonus',
        'Governance voting power boost',
        'Exclusive Diamond events',
        'Custom miner configurations',
        'Annual VIP appreciation bonus'
      ]
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Maintenance Discounts',
      description: 'Save up to 18% on all miner maintenance fees when paying with TYT',
      color: 'amber'
    },
    {
      icon: Gift,
      title: 'Daily Service Button',
      description: 'Earn free TYT tokens every 24 hours - up to 100 TYT per day for Diamond members',
      color: 'green'
    },
    {
      icon: Users,
      title: 'Enhanced Referrals',
      description: 'Earn up to +5% bonus on all referral commissions across 4 tier levels',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Priority Support',
      description: 'Get faster responses and dedicated account managers at higher VIP levels',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Exclusive Features',
      description: 'Access premium academy courses, advanced analytics, and marketplace priority',
      color: 'pink'
    },
    {
      icon: Award,
      title: 'Special Events',
      description: 'Invitations to VIP-only events, webinars, and exclusive platform updates',
      color: 'orange'
    }
  ];

  const comparisonFeatures = [
    { name: 'Platform Access', bronze: true, silver: true, gold: true, platinum: true, diamond: true },
    { name: 'Maintenance Discount', bronze: '2%', silver: '5%', gold: '9%', platinum: '13%', diamond: '18%' },
    { name: 'Daily Service Button', bronze: '10', silver: '15', gold: '25', platinum: '40', diamond: '100' },
    { name: 'Referral Bonus', bronze: '0%', silver: '+1%', gold: '+2%', platinum: '+3%', diamond: '+5%' },
    { name: 'Support Level', bronze: 'Standard', silver: 'Priority', gold: 'Priority+', platinum: 'Dedicated', diamond: 'VIP 24/7' },
    { name: 'Academy Access', bronze: 'Basic', silver: 'Standard', gold: 'Advanced', platinum: 'Premium', diamond: 'Full' },
    { name: 'Marketplace Priority', bronze: false, silver: true, gold: true, platinum: true, diamond: true },
    { name: 'Analytics Dashboard', bronze: 'Basic', silver: 'Basic', gold: 'Advanced', platinum: 'Advanced', diamond: 'Custom' },
    { name: 'Governance Voting', bronze: true, silver: true, gold: true, platinum: 'Boost', diamond: 'Max Boost' },
    { name: 'Special Events', bronze: false, silver: false, gold: 'Quarterly', platinum: 'Quarterly', diamond: 'Monthly' }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-cyan-500/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium">VIP Membership Program</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-cyan-400 bg-clip-text text-transparent">
                Exclusive VIP Benefits
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Climb the VIP ladder and unlock incredible rewards, discounts, and exclusive features.
              From Bronze to Diamond, every level brings more value to your mining journey.
            </p>

            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-amber-500/30 transition-all group"
            >
              Start Your VIP Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* VIP Levels Cards */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">VIP Membership Tiers</h2>
            <p className="text-gray-400 text-lg">
              Automatic tier upgrades based on your total platform spending
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {vipLevels.map((tier, index) => (
              <div
                key={tier.level}
                className={`relative bg-gradient-to-br ${tier.gradient} rounded-xl p-6 border-2 hover:scale-105 transition-all ${
                  tier.level === 5 ? 'lg:col-span-2 xl:col-span-1' : ''
                }`}
                style={{ borderColor: tier.color }}
              >
                {tier.level === 5 && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full p-2">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Crown className="w-12 h-12 mx-auto mb-3" style={{ color: tier.color }} />
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="text-sm text-white/80">
                    Level {tier.level}
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
                  <div className="text-xs text-white/60 mb-1">Required Spending</div>
                  <div className="text-lg font-bold text-white">
                    ${tier.minSpent.toLocaleString()}
                    {tier.maxSpent < 999999999 && ` - $${tier.maxSpent.toLocaleString()}`}
                    {tier.maxSpent >= 999999999 && '+'}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Maintenance</span>
                    <span className="font-bold text-white">{tier.maintenanceDiscount}% OFF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Daily Button</span>
                    <span className="font-bold text-white">{tier.serviceButtonReward} TYT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Referral Bonus</span>
                    <span className="font-bold text-white">+{tier.referralBonus}%</span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <div className="text-xs text-white/60 mb-2">Included Features:</div>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/90">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">VIP Member Benefits</h2>
            <p className="text-gray-400 text-lg">
              Exclusive advantages that grow with your VIP level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const colorClasses = {
                amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
                green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
                blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
                purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
                pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
                orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400'
              };

              return (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${colorClasses[benefit.color as keyof typeof colorClasses]} rounded-xl p-6 border`}
                >
                  <Icon className={`w-10 h-10 mb-4 ${colorClasses[benefit.color as keyof typeof colorClasses].split(' ')[3]}`} />
                  <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                  <p className="text-gray-300">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Tier Comparison</h2>
            <p className="text-gray-400 text-lg">
              Compare all features across VIP levels
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Feature</th>
                    {vipLevels.map(tier => (
                      <th
                        key={tier.level}
                        className="text-center py-4 px-4 font-bold"
                        style={{ color: tier.color }}
                      >
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-700 hover:bg-gray-900/50"
                    >
                      <td className="py-4 px-6 text-white font-medium">{feature.name}</td>
                      <td className="py-4 px-4 text-center text-gray-300">
                        {typeof feature.bronze === 'boolean' ? (
                          feature.bronze ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <span className="text-gray-600">-</span>
                        ) : (
                          feature.bronze
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-300">
                        {typeof feature.silver === 'boolean' ? (
                          feature.silver ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <span className="text-gray-600">-</span>
                        ) : (
                          feature.silver
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-300">
                        {typeof feature.gold === 'boolean' ? (
                          feature.gold ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <span className="text-gray-600">-</span>
                        ) : (
                          feature.gold
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-300">
                        {typeof feature.platinum === 'boolean' ? (
                          feature.platinum ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <span className="text-gray-600">-</span>
                        ) : (
                          feature.platinum
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-300">
                        {typeof feature.diamond === 'boolean' ? (
                          feature.diamond ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <span className="text-gray-600">-</span>
                        ) : (
                          feature.diamond
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Calculator */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Calculate Your Savings</h2>
            <p className="text-gray-400 text-lg">
              See how much you can save with VIP benefits
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <VIPBenefitsCalculator />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How VIP Works</h2>
            <p className="text-gray-400 text-lg">
              Simple, automatic, and fair
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Spend on Platform</h3>
              <p className="text-gray-400">
                Purchase miners, upgrades, and services. Every dollar counts toward your VIP level.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Automatic Upgrade</h3>
              <p className="text-gray-400">
                Reach spending thresholds and instantly unlock the next VIP tier with all benefits.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Enjoy Benefits</h3>
              <p className="text-gray-400">
                Save money with discounts, earn daily rewards, and access exclusive features.
              </p>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-bold mb-2 text-amber-400">Lifetime VIP Status</h4>
                <p className="text-gray-300">
                  Once you reach a VIP level, you keep it forever. Your spending is cumulative,
                  and you never lose your tier. As you continue using the platform, you'll
                  naturally progress to higher levels with even better benefits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-500/10 to-cyan-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Crown className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Start Your VIP Journey Today
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Every member starts at Bronze. Begin mining, upgrading, and earning
            your way to Diamond VIP status with exclusive benefits at every step.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
