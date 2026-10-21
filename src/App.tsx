import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import CookieConsent from './components/CookieConsent';
import AnnouncementBanner from './components/AnnouncementBanner';
import LiveSupportWidget from './components/LiveSupportWidget';
import EnhancedPriceTicker from './components/EnhancedPriceTicker';
import PublicLayout from './components/PublicLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Roadmap from './pages/Roadmap';
import Help from './pages/Help';
import FoundationPublic from './pages/Foundation';
import Tokenomics from './pages/Tokenomics';
import VIP from './pages/VIP';
import Community from './pages/Community';
import SupabaseTest from './pages/SupabaseTest';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Miners from './pages/app/Miners';
import MinerDetail from './pages/app/MinerDetail';
import Rewards from './pages/app/Rewards';
import WalletNew from './pages/app/WalletNew';
import Marketplace from './pages/app/Marketplace';
import Academy from './pages/app/Academy';
import Foundation from './pages/app/Foundation';
import Settings from './pages/app/Settings';
import Profile from './pages/app/Profile';
import Transactions from './pages/app/Transactions';
import Referrals from './pages/app/Referrals';
import TYTTrading from './pages/app/TYTTrading';
import AdminWithdrawals from './pages/app/AdminWithdrawals';
import AdminUsers from './pages/app/AdminUsers';
import Notifications from './pages/app/Notifications';
import Governance from './pages/app/Governance';
import MiningStatsDashboard from './components/MiningStatsDashboard';
import Certificates from './pages/app/Certificates';
import BurnReports from './pages/app/BurnReports';
import Avatars from './pages/app/Avatars';
import DataCenter from './pages/app/DataCenter';
import Calculators from './pages/app/Calculators';
import CharityStaking from './pages/app/CharityStaking';
import Leaderboard from './pages/app/Leaderboard';
import KYC from './pages/app/KYC';
import Quests from './pages/app/Quests';
import Grants from './pages/app/Grants';
import Clans from './pages/app/Clans';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <>
      <AnnouncementBanner />
      <EnhancedPriceTicker />
      <CookieConsent />
      <LiveSupportWidget />
      <Routes>
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout showFooter={false}><Login /></PublicLayout>} />
      <Route path="/signup" element={<PublicLayout showFooter={false}><Signup /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/roadmap" element={<PublicLayout><Roadmap /></PublicLayout>} />
      <Route path="/help" element={<PublicLayout><Help /></PublicLayout>} />
      <Route path="/foundation" element={<PublicLayout><FoundationPublic /></PublicLayout>} />
      <Route path="/tokenomics" element={<PublicLayout><Tokenomics /></PublicLayout>} />
      <Route path="/vip" element={<PublicLayout><VIP /></PublicLayout>} />
      <Route path="/community" element={<PublicLayout><Community /></PublicLayout>} />
      <Route path="/test-supabase" element={<SupabaseTest />} />

      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="miners" element={<Miners />} />
                <Route path="miners/:id" element={<MinerDetail />} />
                <Route path="mining-stats" element={<MiningStatsDashboard />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="marketplace" element={<Marketplace />} />
                <Route path="wallet" element={<WalletNew />} />
                <Route path="tyt-trading" element={<TYTTrading />} />
                <Route path="academy" element={<Academy />} />
                <Route path="calculators" element={<Calculators />} />
                <Route path="charity-staking" element={<CharityStaking />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="foundation" element={<Foundation />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="governance" element={<Governance />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="burn-reports" element={<BurnReports />} />
                <Route path="avatars" element={<Avatars />} />
                <Route path="data-center" element={<DataCenter />} />
                <Route path="kyc" element={<KYC />} />
                <Route path="quests" element={<Quests />} />
                <Route path="grants" element={<Grants />} />
                <Route path="clans" element={<Clans />} />
                <Route path="admin/withdrawals" element={<AdminWithdrawals />} />
                <Route path="admin/users" element={<AdminUsers />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
