import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Camera, FileText, User, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

type KYCTier = 'none' | 'tier1' | 'tier2' | 'tier3';
type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface KYCVerificationProps {
  onComplete?: () => void;
}

export default function KYCVerification({ onComplete }: KYCVerificationProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentTier, setCurrentTier] = useState<KYCTier>('none');
  const [status, setStatus] = useState<KYCStatus>('none');
  const [selectedTier, setSelectedTier] = useState<KYCTier>('tier1');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: ''
  });
  const [documents, setDocuments] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
    proofOfAddress: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
    proofOfAddress: null
  });
  const [uploading, setUploading] = useState(false);

  const tiers = [
    {
      id: 'tier1' as KYCTier,
      name: 'Tier 1 - Basic',
      limit: '$1,000/day',
      requirements: [
        'Full name',
        'Date of birth',
        'Email verification',
        'Phone number'
      ],
      icon: User,
      color: 'amber'
    },
    {
      id: 'tier2' as KYCTier,
      name: 'Tier 2 - Standard',
      limit: '$10,000/day',
      requirements: [
        'Government ID (front & back)',
        'Selfie verification',
        'Address confirmation',
        'Tier 1 completion'
      ],
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'tier3' as KYCTier,
      name: 'Tier 3 - VIP',
      limit: '$50,000/day',
      requirements: [
        'Proof of address document',
        'Enhanced due diligence',
        'Video verification',
        'Tier 2 completion'
      ],
      icon: Camera,
      color: 'purple'
    }
  ];

  const handleFileSelect = (type: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showToast('Only JPG, PNG, and PDF files are allowed', 'error');
        return;
      }

      setDocuments(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in to verify your identity', 'error');
      return;
    }

    // Validate required fields based on tier
    if (selectedTier === 'tier1') {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phoneNumber) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
    }

    if (selectedTier === 'tier2') {
      if (!documents.idFront || !documents.idBack || !documents.selfie) {
        showToast('Please upload all required documents', 'error');
        return;
      }
    }

    if (selectedTier === 'tier3') {
      if (!documents.proofOfAddress) {
        showToast('Please upload proof of address', 'error');
        return;
      }
    }

    setUploading(true);

    try {
      // Upload documents to Supabase Storage (if any)
      const documentUrls: Record<string, string> = {};

      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const fileName = `${user.id}/${key}_${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(fileName, file);

          if (uploadError) {
            throw new Error(`Failed to upload ${key}: ${uploadError.message}`);
          }

          documentUrls[key] = uploadData.path;
        }
      }

      // Create KYC submission
      const { error: kycError } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: user.id,
          tier: selectedTier,
          status: 'pending',
          personal_info: formData,
          document_urls: documentUrls,
          submitted_at: new Date().toISOString()
        });

      if (kycError) {
        throw kycError;
      }

      showToast('KYC verification submitted successfully! We will review your documents within 24-48 hours.', 'success');
      setStatus('pending');

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to submit KYC verification', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50">
            <CheckCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Identity Verification</h2>
            <p className="text-gray-400">Increase your withdrawal limits with KYC verification</p>
          </div>
        </div>

        {status === 'pending' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-400">Verification In Progress</p>
                <p className="text-sm text-gray-300 mt-1">
                  Your documents are being reviewed. This usually takes 24-48 hours. We'll notify you via email once the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-400">Verification Approved</p>
                <p className="text-sm text-gray-300 mt-1">
                  Your {currentTier.toUpperCase()} verification has been approved. You can now withdraw up to the tier limit.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.id;
          const isCompleted = currentTier === tier.id && status === 'approved';

          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              disabled={isCompleted || status === 'pending'}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `border-${tier.color}-500 bg-${tier.color}-500/10`
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              } ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full bg-${tier.color}-500/20 flex items-center justify-center border border-${tier.color}-500/50`}>
                  <Icon className={`w-5 h-5 text-${tier.color}-400`} />
                </div>
                {isCompleted && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
              </div>

              <h3 className="font-bold mb-2">{tier.name}</h3>
              <p className="text-sm text-gray-400 mb-4">Limit: {tier.limit}</p>

              <ul className="space-y-2">
                {tier.requirements.map((req, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-gray-600">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Verification Form */}
      {status !== 'approved' && status !== 'pending' && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">
            Complete {tiers.find(t => t.id === selectedTier)?.name} Verification
          </h3>

          {/* Personal Information */}
          <div className="mb-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address (Tier 2+) */}
          {(selectedTier === 'tier2' || selectedTier === 'tier3') && (
            <div className="mb-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Address Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code *</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Document Uploads (Tier 2+) */}
          {(selectedTier === 'tier2' || selectedTier === 'tier3') && (
            <div className="mb-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Document Uploads
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTier === 'tier2' && (
                  <>
                    <DocumentUpload
                      label="ID Front *"
                      file={documents.idFront}
                      onChange={handleFileSelect('idFront')}
                    />
                    <DocumentUpload
                      label="ID Back *"
                      file={documents.idBack}
                      onChange={handleFileSelect('idBack')}
                    />
                    <DocumentUpload
                      label="Selfie with ID *"
                      file={documents.selfie}
                      onChange={handleFileSelect('selfie')}
                    />
                  </>
                )}
                {selectedTier === 'tier3' && (
                  <DocumentUpload
                    label="Proof of Address *"
                    file={documents.proofOfAddress}
                    onChange={handleFileSelect('proofOfAddress')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Submit Verification'}
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            By submitting, you agree to our terms and conditions. Your data is encrypted and securely stored.
          </p>
        </form>
      )}
    </div>
  );
}

function DocumentUpload({ label, file, onChange }: {
  label: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="relative">
        <input
          type="file"
          onChange={onChange}
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          className="hidden"
          id={label}
        />
        <label
          htmlFor={label}
          className="flex items-center justify-center gap-2 px-4 py-8 bg-gray-900 border-2 border-dashed border-gray-700 hover:border-amber-500 rounded-lg cursor-pointer transition-colors"
        >
          {file ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-400">Click to upload</span>
              <span className="text-xs text-gray-500">Max 5MB</span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
