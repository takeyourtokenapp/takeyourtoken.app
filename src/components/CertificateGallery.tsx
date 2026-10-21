import { useState, useEffect } from 'react';
import { Award, Download, Share2, ExternalLink, Check, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  verification_code: string;
  skills_earned: string[];
  endorsements: number;
  is_public: boolean;
  template: {
    name: string;
    description: string;
    category: string;
    rarity: string;
    skill_points: number;
  };
}

export default function CertificateGallery() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (user) {
      loadCertificates();
    }
  }, [user]);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('academy_certificates')
        .select(`
          *,
          template:cert_template_id (
            name,
            description,
            category,
            rarity,
            skill_points
          )
        `)
        .eq('user_id', user?.id)
        .order('issued_date', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'from-gray-500 to-gray-600 border-gray-400',
      uncommon: 'from-green-500 to-emerald-500 border-green-400',
      rare: 'from-blue-500 to-cyan-500 border-blue-400',
      epic: 'from-purple-500 to-pink-500 border-purple-400',
      legendary: 'from-yellow-500 to-amber-500 border-yellow-400'
    };
    return colors[rarity] || colors.common;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      blockchain: '⛓️',
      defi: '💰',
      nft: '🎨',
      security: '🔐',
      development: '💻'
    };
    return icons[category] || '🎓';
  };

  const handleShare = (cert: Certificate) => {
    const url = `${window.location.origin}/verify/${cert.verification_code}`;
    navigator.clipboard.writeText(url);
  };

  const handleDownload = (cert: Certificate) => {
    console.log('Download certificate:', cert.certificate_number);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
        <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">No Certificates Yet</h3>
        <p className="text-gray-400 mb-6">
          Complete Academy lessons to earn your first Soulbound NFT certificate!
        </p>
        <a
          href="/app/academy"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-black font-bold rounded-xl transition-all"
        >
          Start Learning
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Your Certificates</h2>
          <p className="text-gray-400">Soulbound NFTs - Non-transferable proof of achievement</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/50 rounded-xl">
          <Shield className="w-5 h-5 text-gold-400" />
          <span className="font-bold text-gold-400">{certificates.length} Earned</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            onClick={() => setSelectedCert(cert)}
            className="bg-gray-800 border-2 border-gray-700 hover:border-gold-500 rounded-2xl p-6 cursor-pointer transition-all hover:scale-105 group"
          >
            <div className={`bg-gradient-to-r ${getRarityColor(cert.template.rarity)} p-4 rounded-xl mb-4 text-center border-2 shadow-lg`}>
              <div className="text-6xl mb-2">{getCategoryIcon(cert.template.category)}</div>
              <div className="text-xs uppercase tracking-wider font-bold text-white/80">
                {cert.template.rarity}
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-gold-400 transition-colors">
              {cert.template.name}
            </h3>

            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {cert.template.description}
            </p>

            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-400" />
                <span className="text-gray-400">{cert.template.skill_points} XP</span>
              </div>
              <div className="text-gray-500">
                {new Date(cert.issued_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {cert.skills_earned.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg border border-blue-500/30"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(cert);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(cert);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCert && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="bg-gray-900 border-2 border-gold-500 rounded-2xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-r ${getRarityColor(selectedCert.template.rarity)} p-8 rounded-xl mb-6 text-center border-2 shadow-2xl`}>
              <div className="text-8xl mb-4">{getCategoryIcon(selectedCert.template.category)}</div>
              <div className="text-sm uppercase tracking-wider font-bold text-white/80 mb-2">
                {selectedCert.template.rarity} Certificate
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{selectedCert.template.name}</h2>
              <p className="text-white/90">{selectedCert.template.description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-gray-400">Certificate Number</span>
                <span className="font-mono font-bold">{selectedCert.certificate_number}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-gray-400">Verification Code</span>
                <span className="font-mono font-bold">{selectedCert.verification_code}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <span className="text-gray-400">Issued Date</span>
                <span className="font-bold">{new Date(selectedCert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div className="p-4 bg-gray-800 rounded-xl">
                <div className="text-gray-400 mb-2">Skills Acquired</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCert.skills_earned.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 flex items-center gap-2"
                    >
                      <Check size={14} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(selectedCert)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-black font-bold rounded-xl transition-all"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/verify/${selectedCert.verification_code}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
                >
                  <ExternalLink size={18} />
                  Verify Public
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <div className="font-bold text-blue-400 mb-1">Soulbound NFT</div>
                  <div className="text-gray-300">
                    This certificate is permanently bound to your wallet and cannot be transferred or sold.
                    It serves as immutable proof of your achievement on the blockchain.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
