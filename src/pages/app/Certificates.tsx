import { useState, useEffect } from 'react';
import CertificateGallery from '../../components/CertificateGallery';
import { GraduationCap, Shield, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface CertificateStats {
  totalCertificates: number;
  totalSkills: number;
  totalXP: number;
}

export default function Certificates() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CertificateStats>({
    totalCertificates: 0,
    totalSkills: 0,
    totalXP: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      const { data: certificates, error: certError } = await supabase
        .from('academy_certificates')
        .select('skills_earned, template:cert_template_id(skill_points)')
        .eq('user_id', user?.id);

      if (certError) throw certError;

      const totalCertificates = certificates?.length || 0;

      const allSkills = new Set<string>();
      let totalXP = 0;

      certificates?.forEach((cert) => {
        if (cert.skills_earned && Array.isArray(cert.skills_earned)) {
          cert.skills_earned.forEach((skill: string) => allSkills.add(skill));
        }

        if (cert.template && typeof cert.template === 'object' && 'skill_points' in cert.template) {
          totalXP += (cert.template.skill_points as number) || 0;
        }
      });

      setStats({
        totalCertificates,
        totalSkills: allSkills.size,
        totalXP
      });
    } catch (error) {
      console.error('Error loading certificate stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-gold-400 to-gold-500 rounded-2xl">
            <GraduationCap size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">My Certificates</h1>
            <p className="text-xl text-gray-400">Your Soulbound NFT achievements</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-gray-400">Total Certificates</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                stats.totalCertificates
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-purple-400" />
              <span className="text-sm text-gray-400">Total Skills</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                stats.totalSkills
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <span className="text-sm text-gray-400">Total XP Earned</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                stats.totalXP.toLocaleString()
              )}
            </div>
          </div>
        </div>
      </div>

      <CertificateGallery />

      <div className="mt-12 bg-gradient-to-r from-gold-900/20 to-amber-900/20 border border-gold-500/30 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <Shield className="w-12 h-12 text-gold-400 flex-shrink-0" />
          <div>
            <h3 className="text-2xl font-bold mb-3">What are Soulbound NFTs?</h3>
            <p className="text-gray-300 mb-4">
              Soulbound NFTs are non-transferable tokens that represent your achievements and credentials.
              Unlike regular NFTs, they cannot be sold or transferred, making them perfect for certifications,
              diplomas, and proof of skill.
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gold-400 rounded-full" />
                <span>Permanently linked to your wallet</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gold-400 rounded-full" />
                <span>Verifiable on-chain proof of achievement</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gold-400 rounded-full" />
                <span>Can be shared publicly for verification</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gold-400 rounded-full" />
                <span>Build your Web3 resume and skill tree</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
