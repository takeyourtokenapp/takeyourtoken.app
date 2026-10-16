import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Download, Share2, ExternalLink, Shield, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Certificate {
  id: string;
  token_id: string;
  certificate_type: string;
  track_id: string | null;
  quest_id: string | null;
  title: string;
  description: string | null;
  issued_at: string;
  metadata_uri: string | null;
  image_url: string | null;
  is_soulbound: boolean;
  blockchain_tx_hash: string | null;
  minted_at: string | null;
  track?: { title: string; slug: string } | null;
}

export default function Certificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) loadCertificates();
  }, [user]);

  async function loadCertificates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academy_certificates')
        .select(`
          *,
          track:academy_tracks(title, slug)
        `)
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTypeColor(type: string) {
    const colors: Record<string, string> = {
      track_completion: 'from-gold-500 to-amber-600 border-gold-400',
      quest_milestone: 'from-blue-500 to-cyan-500 border-blue-400',
      achievement: 'from-purple-500 to-pink-500 border-purple-400',
      platform_milestone: 'from-green-500 to-emerald-500 border-green-400'
    };
    return colors[type] || colors.track_completion;
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'track_completion': return Award;
      case 'quest_milestone': return CheckCircle;
      case 'achievement': return Shield;
      default: return Award;
    }
  }

  function handleShare(cert: Certificate) {
    const url = `${window.location.origin}/verify/${cert.token_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Award className="w-8 h-8 text-gold-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Achievement Certificates</h1>
          <p className="text-tertiary-text">Your Soulbound NFT certificates - permanent proof of achievement</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/50 rounded-xl">
          <Shield className="w-5 h-5 text-gold-400" />
          <span className="font-bold text-gold-400">{certificates.length} Earned</span>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
          <Award className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Certificates Yet</h3>
          <p className="text-tertiary-text mb-6">Complete Academy tracks and quests to earn your first Soulbound NFT certificate</p>
          <Link to="/app/academy" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/50">
            <Award size={18} /> Go to Academy
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => {
            const Icon = getTypeIcon(cert.certificate_type);
            return (
              <div
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="bg-secondary border border-secondary hover:border-gold-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] group"
              >
                <div className={`bg-gradient-to-br ${getTypeColor(cert.certificate_type)} p-6 rounded-xl mb-4 text-center border-2 shadow-lg`}>
                  <Icon className="w-16 h-16 mx-auto text-white mb-2" />
                  <div className="text-xs uppercase tracking-wider font-bold text-white/80">
                    {cert.certificate_type.replace(/_/g, ' ')}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-gold-400 transition-colors">{cert.title}</h3>
                {cert.description && <p className="text-sm text-tertiary-text mb-4 line-clamp-2">{cert.description}</p>}

                {cert.track && (
                  <div className="text-xs text-blue-400 mb-3">Track: {cert.track.title}</div>
                )}

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="text-tertiary-text">{new Date(cert.issued_at).toLocaleDateString()}</div>
                  {cert.is_soulbound && (
                    <div className="flex items-center gap-1 text-xs text-gold-400">
                      <Shield size={12} /> Soulbound
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(cert); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-tertiary hover:bg-secondary rounded-lg text-sm transition-colors"
                  >
                    <Share2 size={14} /> {copied ? 'Copied!' : 'Share'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-tertiary hover:bg-secondary rounded-lg text-sm transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>

                {cert.blockchain_tx_hash ? (
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle size={12} /> Minted on-chain
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-400">
                    <Clock size={12} /> Pending mint
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedCert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCert(null)}>
          <div className="bg-secondary border-2 border-gold-500 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className={`bg-gradient-to-br ${getTypeColor(selectedCert.certificate_type)} p-8 rounded-xl mb-6 text-center border-2 shadow-2xl`}>
              {(() => { const Icon = getTypeIcon(selectedCert.certificate_type); return <Icon className="w-24 h-24 mx-auto text-white mb-4" />; })()}
              <div className="text-sm uppercase tracking-wider font-bold text-white/80 mb-2">
                {selectedCert.certificate_type.replace(/_/g, ' ')} Certificate
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedCert.title}</h2>
              {selectedCert.description && <p className="text-white/90">{selectedCert.description}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-tertiary rounded-xl">
                <span className="text-tertiary-text">Token ID</span>
                <span className="font-mono font-bold text-sm">{selectedCert.token_id}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-tertiary rounded-xl">
                <span className="text-tertiary-text">Issued Date</span>
                <span className="font-bold">{new Date(selectedCert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {selectedCert.blockchain_tx_hash && (
                <div className="flex items-center justify-between p-4 bg-tertiary rounded-xl">
                  <span className="text-tertiary-text">Blockchain TX</span>
                  <span className="font-mono text-xs text-green-400">{selectedCert.blockchain_tx_hash.slice(0, 24)}...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => handleShare(selectedCert)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-xl transition-all">
                <Share2 size={18} /> Copy Verify Link
              </button>
              <button onClick={() => setSelectedCert(null)} className="flex-1 px-6 py-3 bg-tertiary hover:bg-secondary font-bold rounded-xl transition-all">
                Close
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <div className="font-bold text-blue-400 mb-1">Soulbound NFT</div>
                  <div className="text-secondary-text">This certificate is permanently bound to your wallet and cannot be transferred or sold. It serves as immutable proof of your achievement on the blockchain.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
