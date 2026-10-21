import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Zap,
  GraduationCap,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Vote,
  Users,
  Gift,
  Bell,
  User,
  Receipt,
  Flame,
  Sparkles,
  Server,
  ChevronDown,
  ChevronRight,
  Award,
  BookOpen,
  Target,
  Banknote,
  PieChart,
  MessageCircle,
  Calculator,
  Trophy,
  ArrowLeftRight,
  RefreshCw,
  Shield,
  FileCheck,
  DollarSign,
  type LucideIcon
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  items: {
    path: string;
    icon: LucideIcon;
    label: string;
  }[];
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['mining', 'finance']);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const navGroups: NavGroup[] = [
    {
      id: 'mining',
      label: 'Mining Ecosystem',
      icon: Cpu,
      color: 'amber',
      items: [
        { path: '/app', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/app/miners', icon: Cpu, label: 'My Miners' },
        { path: '/app/data-center', icon: Server, label: 'Data Centers' },
        { path: '/app/rewards', icon: TrendingUp, label: 'Rewards' },
        { path: '/app/marketplace', icon: ShoppingCart, label: 'Marketplace' },
      ]
    },
    {
      id: 'finance',
      label: 'Finance & Token',
      icon: Banknote,
      color: 'green',
      items: [
        { path: '/app/wallet', icon: Wallet, label: 'Wallet' },
        { path: '/app/transactions', icon: Receipt, label: 'Transactions' },
        { path: '/app/tyt-trading', icon: Zap, label: 'TYT Trading' },
        { path: '/app/burn-reports', icon: Flame, label: 'Burn Reports' },
        { path: '/app/governance', icon: Vote, label: 'Governance' },
      ]
    },
    {
      id: 'academy',
      label: 'Academy',
      icon: GraduationCap,
      color: 'blue',
      items: [
        { path: '/app/academy', icon: BookOpen, label: 'Lessons' },
        { path: '/app/quests', icon: Target, label: 'Quests' },
        { path: '/app/calculators', icon: Calculator, label: 'Calculators' },
        { path: '/app/certificates', icon: Award, label: 'Certificates' },
        { path: '/app/avatars', icon: Sparkles, label: 'Owl Avatars' },
      ]
    },
    {
      id: 'foundation',
      label: 'Foundation',
      icon: Heart,
      color: 'pink',
      items: [
        { path: '/app/foundation', icon: Heart, label: 'Overview' },
        { path: '/app/grants', icon: DollarSign, label: 'Grants' },
        { path: '/app/charity-staking', icon: Gift, label: 'Charity Staking' },
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      color: 'cyan',
      items: [
        { path: '/app/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { path: '/app/clans', icon: Shield, label: 'Clans & Wars' },
        { path: '/app/referrals', icon: Users, label: 'Referrals' },
        { path: '/community', icon: MessageCircle, label: 'Forum' },
      ]
    },
  ];

  const accountItems = [
    { path: '/app/profile', icon: User, label: 'Profile' },
    { path: '/app/kyc', icon: FileCheck, label: 'KYC Verification' },
    { path: '/app/notifications', icon: Bell, label: 'Notifications' },
    { path: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === path;
    }
    if (path.includes('#')) {
      return location.pathname === path.split('#')[0];
    }
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => isActive(item.path));
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
      pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
      cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
    };
    return colors[color] || colors.amber;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-owl-dark via-owl-navy to-black text-white">
      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 backdrop-blur-glass border-r border-gold-800 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-gold-800">
              <Link to="/app" className="flex items-center gap-3 group">
                <img src="/6d629383-acba-4396-8f01-4715f914aada.png" alt="TYT" className="w-10 h-10 group-hover:drop-shadow-[0_0_10px_rgba(210,164,76,0.6)] transition-all" />
                <div>
                  <span className="text-xl font-bold bg-owl-gradient bg-clip-text text-transparent">TakeYourToken</span>
                  <div className="text-xs text-gray-400">Owl Warrior Platform</div>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                {navGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isExpanded = expandedGroups.includes(group.id);
                  const groupActive = isGroupActive(group);
                  const colorClasses = getColorClasses(group.color, groupActive);

                  return (
                    <div key={group.id} className="mb-1">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                          groupActive
                            ? `${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border}`
                            : 'hover:bg-gray-800/50 text-gray-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GroupIcon size={18} className={groupActive ? colorClasses.text : ''} />
                          <span className="text-sm font-semibold">{group.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-1 ml-3 pl-3 border-l border-gray-700/50 space-y-0.5">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                                  active
                                    ? `${colorClasses.bg} ${colorClasses.text}`
                                    : 'hover:bg-gray-800/30 text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                <Icon size={16} />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-700/50 mt-4 pt-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </div>
                <div className="space-y-0.5 mt-1">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                          active
                            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                            : 'hover:bg-gray-800/30 text-gray-400 hover:text-gray-200 border border-transparent'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>

            <div className="p-3 border-t border-gold-800">
              <div className="mb-3 p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{user?.email?.split('@')[0]}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all text-sm"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 lg:ml-72">
          <header className="sticky top-0 z-40 backdrop-blur-glass border-b border-gold-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gold-400 hover:text-gold-300"
              >
                <Menu size={24} />
              </button>

              <div className="flex items-center gap-4 ml-auto">
                <Link
                  to="/app/notifications"
                  className="relative p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <Bell size={20} className="text-gray-400" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                </Link>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">Worker Owl</span>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6">
            {children}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
