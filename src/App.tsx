import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AoiProvider } from './contexts/AoiContext';
import { AoiControlProvider } from './contexts/AoiControlContext';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { ComponentErrorBoundary } from './components/ComponentErrorBoundary';
import CookieConsent from './components/CookieConsent';
import AnnouncementBanner from './components/AnnouncementBanner';
import LiveSupportWidget from './components/LiveSupportWidget';
import EnhancedPriceTicker from './components/EnhancedPriceTicker';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Public pages - loaded eagerly for fast initial load
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Lazy load all other pages with retry logic
const Terms = lazyWithRetry(() => import('./pages/Terms'), 'Terms');
const Privacy = lazyWithRetry(() => import('./pages/Privacy'), 'Privacy');
const About = lazyWithRetry(() => import('./pages/About'), 'About');
const Roadmap = lazyWithRetry(() => import('./pages/Roadmap'), 'Roadmap');
const Help = lazyWithRetry(() => import('./pages/Help'), 'Help');
const FoundationPublic = lazyWithRetry(() => import('./pages/Foundation'), 'Foundation');
const Tokenomics = lazyWithRetry(() => import('./pages/Tokenomics'), 'Tokenomics');
const VIP = lazyWithRetry(() => import('./pages/VIP'), 'VIP');
const Community = lazyWithRetry(() => import('./pages/Community'), 'Community');

// App pages - lazy loaded with retry logic
const Dashboard = lazyWithRetry(() => import('./pages/app/Dashboard'), 'Dashboard');
const Miners = lazyWithRetry(() => import('./pages/app/Miners'), 'Miners');
const MinerDetail = lazyWithRetry(() => import('./pages/app/MinerDetail'), 'MinerDetail');
const Rewards = lazyWithRetry(() => import('./pages/app/Rewards'), 'Rewards');
const WalletUnified = lazyWithRetry(() => import('./pages/app/WalletUnified'), 'WalletUnified');
const Marketplace = lazyWithRetry(() => import('./pages/app/Marketplace'), 'Marketplace');
const Academy = lazyWithRetry(() => import('./pages/app/Academy'), 'Academy');
const Foundation = lazyWithRetry(() => import('./pages/app/Foundation'), 'Foundation');
const Settings = lazyWithRetry(() => import('./pages/app/Settings'), 'Settings');
const Profile = lazyWithRetry(() => import('./pages/app/Profile'), 'Profile');
const Transactions = lazyWithRetry(() => import('./pages/app/Transactions'), 'Transactions');
const Referrals = lazyWithRetry(() => import('./pages/app/Referrals'), 'Referrals');
const TYTTrading = lazyWithRetry(() => import('./pages/app/TYTTrading'), 'TYTTrading');
const AdminWithdrawals = lazyWithRetry(() => import('./pages/app/AdminWithdrawals'), 'AdminWithdrawals');
const AdminUsers = lazyWithRetry(() => import('./pages/app/AdminUsers'), 'AdminUsers');
const AdminDashboard = lazyWithRetry(() => import('./pages/app/AdminDashboard'), 'AdminDashboard');
const AdminMessages = lazyWithRetry(() => import('./pages/app/AdminMessages'), 'AdminMessages');
const Notifications = lazyWithRetry(() => import('./pages/app/Notifications'), 'Notifications');
const Governance = lazyWithRetry(() => import('./pages/app/Governance'), 'Governance');
const MiningStatsDashboard = lazyWithRetry(() => import('./components/MiningStatsDashboard'), 'MiningStatsDashboard');
const Certificates = lazyWithRetry(() => import('./pages/app/Certificates'), 'Certificates');
const BurnReports = lazyWithRetry(() => import('./pages/app/BurnReports'), 'BurnReports');
const Avatars = lazyWithRetry(() => import('./pages/app/Avatars'), 'Avatars');
const DataCenter = lazyWithRetry(() => import('./pages/app/DataCenter'), 'DataCenter');
const Calculators = lazyWithRetry(() => import('./pages/app/Calculators'), 'Calculators');
const CharityStaking = lazyWithRetry(() => import('./pages/app/CharityStaking'), 'CharityStaking');
const Leaderboard = lazyWithRetry(() => import('./pages/app/Leaderboard'), 'Leaderboard');
const KYC = lazyWithRetry(() => import('./pages/app/KYC'), 'KYC');
const Quests = lazyWithRetry(() => import('./pages/app/Quests'), 'Quests');
const Grants = lazyWithRetry(() => import('./pages/app/Grants'), 'Grants');
const Clans = lazyWithRetry(() => import('./pages/app/Clans'), 'Clans');
const Swap = lazyWithRetry(() => import('./pages/app/Swap'), 'Swap');
const Bridge = lazyWithRetry(() => import('./pages/app/Bridge'), 'Bridge');
const AdminContracts = lazyWithRetry(() => import('./pages/app/AdminContracts'), 'AdminContracts');
const AoiProfile = lazyWithRetry(() => import('./pages/app/AoiProfile'), 'AoiProfile');
const Orbital = lazyWithRetry(() => import('./pages/app/Orbital'), 'Orbital');
const MarketplaceActions = lazyWithRetry(() => import('./pages/app/MarketplaceActions'), 'MarketplaceActions');

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-400">Loading...</div>
      </div>
    </div>
  );
}

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
    <GlobalErrorBoundary>
      <AoiProvider>
        <AoiControlProvider>
          <AnnouncementBanner />
          <EnhancedPriceTicker />
          <CookieConsent />
          <LiveSupportWidget />
          <Suspense fallback={<PageLoader />}>
            <Routes>
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout showFooter={false}><Login /></PublicLayout>} />
      <Route path="/signup" element={<PublicLayout showFooter={false}><Signup /></PublicLayout>} />
      <Route path="/forgot-password" element={<PublicLayout showFooter={false}><ForgotPassword /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout showFooter={false}><ResetPassword /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/roadmap" element={<PublicLayout><Roadmap /></PublicLayout>} />
      <Route path="/help" element={<PublicLayout><Help /></PublicLayout>} />
      <Route path="/foundation" element={<PublicLayout><FoundationPublic /></PublicLayout>} />
      <Route path="/tokenomics" element={<PublicLayout><Tokenomics /></PublicLayout>} />
      <Route path="/vip" element={<PublicLayout><VIP /></PublicLayout>} />
      <Route path="/community" element={<PublicLayout><Community /></PublicLayout>} />

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
                <Route path="marketplace/actions" element={<MarketplaceActions />} />
                <Route path="wallet" element={<WalletUnified />} />
                <Route path="swap" element={<Swap />} />
                <Route path="bridge" element={<Bridge />} />
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
                <Route path="orbital" element={<Orbital />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="burn-reports" element={<BurnReports />} />
                <Route path="avatars" element={<Avatars />} />
                <Route path="data-center" element={<DataCenter />} />
                <Route path="kyc" element={<KYC />} />
                <Route path="quests" element={<Quests />} />
                <Route path="grants" element={<Grants />} />
                <Route path="clans" element={<Clans />} />
                <Route path="aoi" element={<AoiProfile />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/messages" element={<AdminMessages />} />
                <Route path="admin/withdrawals" element={<AdminWithdrawals />} />
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin/contracts" element={<AdminContracts />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
        </AoiControlProvider>
      </AoiProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
