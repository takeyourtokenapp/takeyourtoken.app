import { useState } from 'react';
import {
  Heart,
  Users,
  Award,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Target,
  Activity
} from 'lucide-react';
import ImpactReportsDashboard from '../../components/ImpactReportsDashboard';
import DonationWidget from '../../components/DonationWidget';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  category: string;
  hospital: string;
  image: string;
}

interface Grant {
  id: string;
  title: string;
  institution: string;
  amount: number;
  date: string;
  status: 'approved' | 'in-progress' | 'completed';
  description: string;
  impact: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Advanced MRI Equipment for Tel Aviv Medical Center',
    description: 'Fund cutting-edge 3T MRI scanner for early brain tumor detection in children. This equipment will enable earlier diagnosis and better treatment planning.',
    goal: 500000,
    raised: 387250,
    donors: 1243,
    endDate: '2024-12-31',
    status: 'active',
    category: 'Equipment',
    hospital: 'Tel Aviv Medical Center',
    image: 'mri'
  },
  {
    id: 'camp-2',
    title: 'Clinical Trial: Novel Immunotherapy Protocol',
    description: 'Support Phase II clinical trial for groundbreaking immunotherapy targeting pediatric glioblastoma. Early results show 40% improvement in progression-free survival.',
    goal: 750000,
    raised: 623100,
    endDate: '2025-03-15',
    status: 'active',
    category: 'Research',
    hospital: 'Johns Hopkins Hospital',
    image: 'research'
  },
  {
    id: 'camp-3',
    title: 'Family Support Program 2024',
    description: 'Provide housing, meals, and emotional support for families traveling for treatment. Help families stay together during the most difficult time.',
    goal: 150000,
    raised: 150000,
    donors: 892,
    endDate: '2024-06-30',
    status: 'completed',
    category: 'Support',
    hospital: 'Multiple Locations',
    image: 'support'
  },
  {
    id: 'camp-4',
    title: 'Pediatric Neurosurgery Fellowship Program',
    description: 'Train the next generation of pediatric neurosurgeons specializing in brain tumor treatment. Two-year fellowship at leading institutions.',
    goal: 300000,
    raised: 145600,
    endDate: '2025-09-01',
    status: 'active',
    category: 'Education',
    hospital: 'Multiple Institutions',
    image: 'education'
  }
];

const GRANTS: Grant[] = [
  {
    id: 'grant-1',
    title: 'Genomic Profiling of Pediatric Brain Tumors',
    institution: 'Stanford Medicine',
    amount: 180000,
    date: '2024-01-15',
    status: 'in-progress',
    description: 'Comprehensive genomic analysis of 200+ pediatric brain tumor samples to identify targeted therapy opportunities.',
    impact: 'Expected to identify 3-5 new therapeutic targets'
  },
  {
    id: 'grant-2',
    title: 'CAR-T Cell Therapy Development',
    institution: 'Memorial Sloan Kettering',
    amount: 250000,
    date: '2024-03-01',
    status: 'in-progress',
    description: 'Develop novel CAR-T cell therapy specifically designed for pediatric brain tumors with blood-brain barrier penetration.',
    impact: 'Phase I trials scheduled for Q3 2025'
  },
  {
    id: 'grant-3',
    title: 'MRI-Guided Focused Ultrasound Research',
    institution: 'Boston Children\'s Hospital',
    amount: 120000,
    date: '2023-09-15',
    status: 'completed',
    description: 'Non-invasive focused ultrasound for drug delivery across blood-brain barrier in pediatric patients.',
    impact: 'Published in Nature Medicine, 5 patients treated successfully'
  },
  {
    id: 'grant-4',
    title: 'Liquid Biopsy Early Detection Study',
    institution: 'UC San Francisco',
    amount: 95000,
    date: '2024-05-20',
    status: 'approved',
    description: 'Develop blood-based biomarkers for early detection of brain tumors in high-risk pediatric populations.',
    impact: 'Study launching Q1 2025, 500 participants'
  }
];

const PARTNERS = [
  { name: 'Tel Aviv Medical Center', country: 'Israel', patients: 47 },
  { name: 'Johns Hopkins Hospital', country: 'USA', patients: 32 },
  { name: 'Great Ormond Street Hospital', country: 'UK', patients: 28 },
  { name: 'Boston Children\'s Hospital', country: 'USA', patients: 41 },
  { name: 'Hospital for Sick Children', country: 'Canada', patients: 23 },
  { name: 'Charité Berlin', country: 'Germany', patients: 19 }
];

export default function Foundation() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'grants' | 'impact'>('overview');
  const [donationAmount, setDonationAmount] = useState('100');

  const totalRaised = 256890;
  const familiesHelped = 127;
  const grantsAwarded = 4;
  const activeResearch = 3;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 border border-pink-500/50 rounded-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">TYT Children's Brain Cancer Foundation</h1>
            <p className="text-gray-300">Research. Support. Hope. Making a difference in children's lives.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 border border-pink-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 text-pink-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-pink-400">${totalRaised.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">Total Donated (Lifetime)</p>
          </div>

          <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-6">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-blue-400">{familiesHelped}</p>
            <p className="text-sm text-gray-400 mt-1">Families Assisted</p>
          </div>

          <div className="bg-gray-900/50 border border-amber-500/30 rounded-lg p-6">
            <Award className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-3xl font-bold text-amber-400">{grantsAwarded}</p>
            <p className="text-sm text-gray-400 mt-1">Research Grants</p>
          </div>

          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6">
            <Activity className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-3xl font-bold text-green-400">{activeResearch}</p>
            <p className="text-sm text-gray-400 mt-1">Active Clinical Trials</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Heart },
            { id: 'campaigns', label: 'Campaigns', icon: Target },
            { id: 'grants', label: 'Research Grants', icon: Award },
            { id: 'impact', label: 'Impact Report', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <DonationWidget />
                <div className="space-y-6">
                  <ImpactReportsDashboard />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  The TYT Children's Brain Cancer Research & Support Foundation is dedicated to funding groundbreaking research,
                  supporting families, and advancing treatment options for children battling brain tumors. Every transaction on
                  the TakeYourToken platform automatically contributes 1% to our foundation, creating a sustainable funding model
                  for pediatric brain cancer research.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                    <Target className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="font-bold mb-2">Research Funding</h3>
                    <p className="text-sm text-gray-400">
                      Support cutting-edge clinical trials and innovative treatment development
                    </p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                    <Users className="w-8 h-8 text-green-400 mb-3" />
                    <h3 className="font-bold mb-2">Family Support</h3>
                    <p className="text-sm text-gray-400">
                      Provide housing, meals, and emotional assistance during treatment
                    </p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                    <Building2 className="w-8 h-8 text-purple-400 mb-3" />
                    <h3 className="font-bold mb-2">Hospital Partnerships</h3>
                    <p className="text-sm text-gray-400">
                      Collaborate with leading medical centers worldwide
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-900/20 to-red-900/20 border border-pink-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Make a Direct Donation</h3>
                <p className="text-gray-300 mb-4">
                  Your donation goes directly to funding research, supporting families, and saving lives.
                </p>
                <div className="flex gap-4 mb-4">
                  {['50', '100', '250', '500'].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setDonationAmount(amount)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        donationAmount === amount
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    placeholder="Custom amount"
                  />
                </div>
                <button className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  Donate ${donationAmount} USDT
                </button>
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Active Campaigns</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg">
                    All
                  </button>
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600">
                    Equipment
                  </button>
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600">
                    Research
                  </button>
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600">
                    Support
                  </button>
                </div>
              </div>

              {CAMPAIGNS.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}

          {activeTab === 'grants' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Research Grants Awarded</h2>
              {GRANTS.map(grant => (
                <GrantCard key={grant.id} grant={grant} />
              ))}
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">2024 Impact Report</h2>
                <p className="text-gray-300 mb-6">
                  Since launch, the TYT Foundation has made significant strides in supporting pediatric brain cancer
                  research and families in need.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-400" />
                    Hospital Partners
                  </h3>
                  <div className="space-y-3">
                    {PARTNERS.map(partner => (
                      <div key={partner.name} className="flex items-center justify-between py-2 border-b border-gray-700">
                        <div>
                          <p className="font-semibold">{partner.name}</p>
                          <p className="text-sm text-gray-400">{partner.country}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">{partner.patients}</p>
                          <p className="text-xs text-gray-400">patients</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Transparency</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">All donations tracked on blockchain</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">Quarterly public reports published</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">Direct hospital partnerships</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">Third-party audited financials</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Download Reports</h3>
                    <div className="space-y-2">
                      <a href="#" className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span>Q3 2024 Impact Report</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                      <a href="#" className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span>2024 Financial Audit</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
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

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = (campaign.raised / campaign.goal) * 100;
  const daysLeft = Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-semibold text-blue-400">
              {campaign.category}
            </span>
            {campaign.status === 'completed' && (
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs font-semibold text-green-400">
                Completed
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
          <p className="text-gray-400 text-sm mb-3">{campaign.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Building2 className="w-4 h-4" />
            <span>{campaign.hospital}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="font-bold">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-red-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-pink-400">${campaign.raised.toLocaleString()}</p>
            <p className="text-sm text-gray-400">raised of ${campaign.goal.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{campaign.donors}</p>
            <p className="text-sm text-gray-400">donors</p>
          </div>
          {campaign.status === 'active' && (
            <div className="text-right">
              <p className="text-xl font-bold text-amber-400">{daysLeft}</p>
              <p className="text-sm text-gray-400">days left</p>
            </div>
          )}
        </div>
      </div>

      <button className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
        <Heart className="w-5 h-5" />
        {campaign.status === 'completed' ? 'View Details' : 'Donate to Campaign'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function GrantCard({ grant }: { grant: Grant }) {
  const statusColors = {
    approved: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    'in-progress': 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    completed: 'bg-green-500/20 border-green-500/50 text-green-400'
  };

  const statusIcons = {
    approved: CheckCircle,
    'in-progress': Activity,
    completed: Award
  };

  const StatusIcon = statusIcons[grant.status];

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 border rounded-full text-xs font-semibold flex items-center gap-1 ${statusColors[grant.status]}`}>
              <StatusIcon className="w-3 h-3" />
              {grant.status.replace('-', ' ').toUpperCase()}
            </span>
            <span className="text-sm text-gray-400">{grant.date}</span>
          </div>
          <h3 className="text-xl font-bold mb-2">{grant.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Building2 className="w-4 h-4" />
            <span>{grant.institution}</span>
          </div>
          <p className="text-gray-400 mb-3">{grant.description}</p>
          <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">{grant.impact}</p>
          </div>
        </div>
        <div className="ml-6 text-right">
          <p className="text-3xl font-bold text-amber-400">${(grant.amount / 1000)}K</p>
          <p className="text-sm text-gray-400">Grant Amount</p>
        </div>
      </div>
    </div>
  );
}
