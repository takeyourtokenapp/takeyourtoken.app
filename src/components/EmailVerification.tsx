import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface EmailVerificationProps {
  userId: string;
  userEmail: string;
  onVerified?: () => void;
}

export default function EmailVerification({ userId, userEmail, onVerified }: EmailVerificationProps) {
  const toast = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [userId]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.email_confirmed_at) {
        setIsVerified(true);
        if (onVerified) {
          onVerified();
        }
      } else {
        setIsVerified(false);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      });

      if (error) throw error;

      setVerificationSent(true);
      setResendCooldown(60);
      toast.showSuccess('Verification email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Error sending verification:', error);
      toast.showError(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      await supabase.auth.refreshSession();
      await checkVerificationStatus();

      if (isVerified) {
        toast.showSuccess('Email verified successfully!');
      } else {
        toast.showWarning('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      toast.showError('Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-400">Email Verified</h3>
          <p className="text-sm text-gray-400">Your email address has been successfully verified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-400 mb-1">Email Verification Required</h3>
          <p className="text-sm text-gray-300 mb-3">
            To unlock all features and increase your withdrawal limits, please verify your email address.
          </p>
          <div className="bg-black/20 rounded-lg p-3 border border-amber-500/30">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{userEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {verificationSent && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-blue-400 mb-1">Verification Email Sent!</p>
              <p>Check your inbox and spam folder. Click the verification link to complete the process.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <button
          onClick={handleSendVerification}
          disabled={loading || resendCooldown > 0}
          className="px-4 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors border border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : verificationSent ? (
            'Resend Email'
          ) : (
            'Send Verification Email'
          )}
        </button>

        <button
          onClick={handleCheckVerification}
          disabled={loading}
          className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          I've Verified
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-amber-500/30">
        <h4 className="font-semibold text-sm mb-2">Why verify your email?</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Unlock higher KYC tiers and withdrawal limits</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Receive important notifications about your account</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Enable password recovery and account security</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Access exclusive features and promotions</span>
          </li>
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          Didn't receive the email? Check your spam folder or add noreply@takeyourtoken.app to your contacts.
          If you continue having issues, contact{' '}
          <a href="mailto:support@takeyourtoken.app" className="text-blue-400 hover:text-blue-300">
            support@takeyourtoken.app
          </a>
        </p>
      </div>
    </div>
  );
}

export function EmailVerificationBanner({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [isVerified, setIsVerified] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [userId]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsVerified(!!user?.email_confirmed_at);
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  if (isVerified || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-amber-400" />
          <p className="text-sm">
            <span className="font-semibold text-amber-400">Email verification required.</span>{' '}
            <span className="text-gray-300">Please check your inbox to verify {userEmail}</span>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
