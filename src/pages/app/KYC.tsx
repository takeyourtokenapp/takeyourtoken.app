import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Clock, Camera, FileCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type DocumentType = 'passport' | 'id_card' | 'drivers_license' | 'proof_of_address' | 'selfie';
type DocumentStatus = 'pending' | 'approved' | 'rejected';

interface KYCDocument {
  id: string;
  document_type: DocumentType;
  document_url: string;
  status: DocumentStatus;
  rejection_reason?: string;
  uploaded_at: string;
  reviewed_at?: string;
}

const DOCUMENT_TYPES: Record<DocumentType, { label: string; icon: any; description: string }> = {
  passport: {
    label: 'Passport',
    icon: FileText,
    description: 'Upload a clear photo of your passport main page',
  },
  id_card: {
    label: 'National ID Card',
    icon: FileText,
    description: 'Upload both front and back sides of your ID',
  },
  drivers_license: {
    label: "Driver's License",
    icon: FileText,
    description: 'Upload both front and back sides of your license',
  },
  proof_of_address: {
    label: 'Proof of Address',
    icon: FileCheck,
    description: 'Upload a recent utility bill, bank statement, or official document',
  },
  selfie: {
    label: 'Selfie Verification',
    icon: Camera,
    description: 'Upload a selfie holding your ID document',
  },
};

export default function KYC() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [kyc, setKyc] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadKYCStatus();
      loadDocuments();
    }
  }, [user]);

  const loadKYCStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setKyc(data);
    }
  };

  const loadDocuments = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (data) {
      setDocuments(data);
    }
  };

  const handleFileUpload = async (type: DocumentType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(type);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: dbError } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        document_type: type,
        document_url: urlData.publicUrl,
        status: 'pending',
      });

      if (dbError) throw dbError;

      // Update KYC status
      await supabase.from('kyc_verifications').upsert({
        user_id: user.id,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
      });

      alert('Document uploaded successfully!');
      loadDocuments();
      loadKYCStatus();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Approved</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Pending Review</span>
          </div>
        );
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      case 'pending_review':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const hasDocument = (type: DocumentType) => {
    return documents.some((doc) => doc.document_type === type);
  };

  const getDocumentStatus = (type: DocumentType) => {
    return documents.find((doc) => doc.document_type === type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
        <p className="text-gray-400">Complete your identity verification to unlock all features</p>
      </div>

      {/* KYC Status Card */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Verification Status</h2>
            <div className={`text-lg font-medium ${getKYCStatusColor(kyc?.status || 'not_submitted')}`}>
              {kyc?.status === 'approved' && 'Verified ✓'}
              {kyc?.status === 'pending_review' && 'Pending Review'}
              {kyc?.status === 'rejected' && 'Verification Failed'}
              {!kyc?.status && 'Not Started'}
            </div>
            {kyc?.tier && (
              <div className="text-sm text-gray-400 mt-1">KYC Tier: {kyc.tier}</div>
            )}
          </div>
          {kyc?.status === 'approved' && (
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          )}
        </div>

        {kyc?.rejection_reason && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">
              <strong>Rejection Reason:</strong> {kyc.rejection_reason}
            </p>
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">Important Guidelines</h3>
        <ul className="space-y-1 text-sm text-gray-300">
          <li>• All documents must be clear and readable</li>
          <li>• Accepted formats: JPG, PNG, PDF</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Documents must be valid and not expired</li>
          <li>• Selfie must clearly show your face and ID</li>
        </ul>
      </div>

      {/* Document Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.entries(DOCUMENT_TYPES) as [DocumentType, typeof DOCUMENT_TYPES[DocumentType]][]).map(
          ([type, info]) => {
            const Icon = info.icon;
            const docStatus = getDocumentStatus(type);
            const isUploading = uploading === type;

            return (
              <div
                key={type}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#D2A44C]/20 rounded-lg">
                    <Icon className="w-6 h-6 text-[#D2A44C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{info.label}</h3>
                    <p className="text-sm text-gray-400 mb-4">{info.description}</p>

                    {docStatus ? (
                      <div className="space-y-3">
                        {getStatusBadge(docStatus.status)}
                        {docStatus.rejection_reason && (
                          <p className="text-sm text-red-400">{docStatus.rejection_reason}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Uploaded: {new Date(docStatus.uploaded_at).toLocaleDateString()}
                        </div>
                        {docStatus.status === 'rejected' && (
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(type, e)}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <span className="inline-block px-4 py-2 bg-[#D2A44C] text-white rounded-lg cursor-pointer hover:bg-yellow-600 transition-all text-sm">
                              Re-upload
                            </span>
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(type, e)}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
                            isUploading
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-[#D2A44C] text-white cursor-pointer hover:bg-yellow-600'
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Document
                            </>
                          )}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* KYC Benefits */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Verification Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-[#D2A44C] font-bold mb-2">Tier 1</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• $1,000/day withdrawal</div>
              <div>• Basic trading</div>
              <div>• Standard features</div>
            </div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-[#D2A44C] font-bold mb-2">Tier 2</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• $10,000/day withdrawal</div>
              <div>• Advanced trading</div>
              <div>• Priority support</div>
            </div>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-[#D2A44C] font-bold mb-2">Tier 3</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• Unlimited withdrawals</div>
              <div>• VIP features</div>
              <div>• Dedicated manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
