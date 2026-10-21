import { useState } from 'react';
import { Vote, Info, AlertCircle, CheckCircle, Calendar, Users } from 'lucide-react';

interface ProposalCreationFormProps {
  userVeTYT: number;
  requiredVeTYT: number;
  onSubmit: (proposal: ProposalData) => Promise<void>;
  onClose: () => void;
}

export interface ProposalData {
  title: string;
  description: string;
  type: 'discount_curve' | 'maintenance_rate' | 'burn_schedule' | 'foundation_allocation' | 'new_feature';
  votingDuration: number;
  quorumRequired: number;
  proposedChanges: Record<string, any>;
}

export default function ProposalCreationForm({ userVeTYT, requiredVeTYT, onSubmit, onClose }: ProposalCreationFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<ProposalData>({
    title: '',
    description: '',
    type: 'discount_curve',
    votingDuration: 7,
    quorumRequired: 4,
    proposedChanges: {}
  });

  const proposalTypes = [
    {
      id: 'discount_curve',
      name: 'Adjust Discount Curve',
      description: 'Modify VIP tier discount percentages',
      icon: '📊',
      fields: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
    },
    {
      id: 'maintenance_rate',
      name: 'Change Maintenance Rates',
      description: 'Adjust daily maintenance fees',
      icon: '⚙️',
      fields: ['baseRate', 'region']
    },
    {
      id: 'burn_schedule',
      name: 'Modify Burn Schedule',
      description: 'Change burn frequency or percentage',
      icon: '🔥',
      fields: ['frequency', 'marketplaceFee', 'upgradesFee']
    },
    {
      id: 'foundation_allocation',
      name: 'Foundation Allocation',
      description: 'Adjust charity allocation percentages',
      icon: '❤️',
      fields: ['nftSales', 'marketplace', 'maintenance', 'reinvest']
    },
    {
      id: 'new_feature',
      name: 'New Feature Proposal',
      description: 'Propose a new platform feature',
      icon: '✨',
      fields: ['featureName', 'implementation', 'budget']
    }
  ];

  const selectedType = proposalTypes.find(t => t.id === formData.type);
  const canCreateProposal = userVeTYT >= requiredVeTYT;

  const handleSubmit = async () => {
    if (!canCreateProposal) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error('Failed to create proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-owl-navy via-owl-slate to-black border-2 border-gold-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-gold-glow">
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-glass border-b border-gold-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Vote size={28} className="text-gold-400" />
                Create Governance Proposal
              </h2>
              <p className="text-sm text-gray-400">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gold-400 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-green-400 mb-2">Proposal Submitted!</h3>
            <p className="text-gray-300 mb-4">Your proposal is now open for community discussion.</p>
            <div className="bg-owl-slate/50 rounded-xl p-4 border border-gold-800 inline-block">
              <div className="text-sm text-gray-400">Voting starts in</div>
              <div className="text-2xl font-bold text-gold-400">72 hours</div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {!canCreateProposal && (
              <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-400 mb-1">Insufficient veTYT</div>
                  <div className="text-sm text-gray-300">
                    You need {requiredVeTYT.toLocaleString()} veTYT to create a proposal.
                    You currently have {userVeTYT.toLocaleString()} veTYT.
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-3 px-4 py-2 bg-gold-500 hover:bg-gold-600 rounded-lg font-semibold text-sm transition-all"
                  >
                    Lock TYT to earn veTYT
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Select Proposal Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposalTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id as any })}
                      disabled={!canCreateProposal}
                      className={`p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.type === type.id
                          ? 'border-gold-500 bg-gold-500/20 shadow-gold-glow'
                          : 'border-gray-700 hover:border-gold-700'
                      }`}
                    >
                      <div className="text-4xl mb-2">{type.icon}</div>
                      <div className="font-bold mb-1">{type.name}</div>
                      <div className="text-sm text-gray-400">{type.description}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canCreateProposal}
                  className="w-full py-3 bg-owl-gradient hover:shadow-gold-glow rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Proposal Details</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Proposal Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Increase Gold Tier Discount to 10%"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/50 transition-all"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">{formData.title.length}/100</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Explain the rationale behind your proposal, expected benefits, and potential impacts..."
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/50 transition-all resize-none"
                    maxLength={2000}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/2000</div>
                </div>

                <div className="bg-owl-slate/50 rounded-xl p-4 border border-gold-800">
                  <div className="flex items-center gap-2 mb-3 text-blue-400">
                    <Info size={18} />
                    <span className="font-semibold">Proposal Settings</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Voting Duration</label>
                      <select
                        value={formData.votingDuration}
                        onChange={(e) => setFormData({ ...formData, votingDuration: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={21}>21 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Quorum Required</label>
                      <select
                        value={formData.quorumRequired}
                        onChange={(e) => setFormData({ ...formData, quorumRequired: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                      >
                        <option value={4}>4%</option>
                        <option value={5}>5%</option>
                        <option value={10}>10%</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.title || !formData.description}
                    className="flex-1 py-3 bg-owl-gradient hover:shadow-gold-glow rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review Proposal →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-bold text-lg">Review & Submit</h3>

                <div className="bg-owl-slate/50 rounded-xl p-6 border border-gold-800 space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Type</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedType?.icon}</span>
                      <span className="font-bold">{selectedType?.name}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Title</div>
                    <div className="font-bold text-lg">{formData.title}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Description</div>
                    <div className="text-sm whitespace-pre-wrap">{formData.description}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                    <div className="text-center">
                      <Calendar size={20} className="mx-auto mb-1 text-blue-400" />
                      <div className="text-xs text-gray-400">Duration</div>
                      <div className="font-bold">{formData.votingDuration} days</div>
                    </div>
                    <div className="text-center">
                      <Users size={20} className="mx-auto mb-1 text-purple-400" />
                      <div className="text-xs text-gray-400">Quorum</div>
                      <div className="font-bold">{formData.quorumRequired}%</div>
                    </div>
                    <div className="text-center">
                      <Vote size={20} className="mx-auto mb-1 text-gold-400" />
                      <div className="text-xs text-gray-400">Approval</div>
                      <div className="font-bold">60%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Info size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-amber-400 mb-1">Important Notes:</div>
                    <ul className="space-y-1 text-gray-300 list-disc list-inside">
                      <li>3-day discussion period before voting starts</li>
                      <li>Proposal deposit: {requiredVeTYT.toLocaleString()} veTYT (refunded if passed)</li>
                      <li>60% approval threshold required</li>
                      <li>2-day timelock after approval before execution</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all"
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-owl-gradient hover:shadow-gold-glow rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Proposal'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
