import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Cpu,
  ShoppingCart,
  Wallet,
  GraduationCap,
  Heart,
  TrendingUp,
  Zap,
  Users,
  Vote,
  MapPin,
  FileText,
  HelpCircle,
  Info,
  Shield,
  Crown,
  LogIn,
  UserPlus,
  Flame,
  Server,
  Sparkles
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  children?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
  }[];
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      label: 'Platform',
      children: [
        { label: 'Dashboard', href: '/app', icon: LayoutDashboard, description: 'Your control center' },
        { label: 'My Miners', href: '/app/miners', icon: Cpu, description: 'Manage NFT miners' },
        { label: 'Marketplace', href: '/app/marketplace', icon: ShoppingCart, description: 'Buy & sell miners' },
        { label: 'Wallet', href: '/app/wallet', icon: Wallet, description: 'Deposits & withdrawals' },
        { label: 'Rewards', href: '/app/rewards', icon: TrendingUp, description: 'Daily BTC rewards' },
        { label: 'Data Centers', href: '/app/data-center', icon: Server, description: 'Live facility streams' },
        { label: 'Burn Reports', href: '/app/burn-reports', icon: Flame, description: 'Token burn statistics' },
      ]
    },
    {
      label: 'Ecosystem',
      children: [
        { label: 'TYT Trading', href: '/app/tyt-trading', icon: Zap, description: 'Swap & trade TYT' },
        { label: 'Academy', href: '/app/academy', icon: GraduationCap, description: 'Learn & earn' },
        { label: 'Foundation', href: '/app/foundation', icon: Heart, description: 'Support children' },
        { label: 'Governance', href: '/app/governance', icon: Vote, description: 'Vote on proposals' },
        { label: 'Owl Avatars', href: '/app/avatars', icon: Sparkles, description: 'Customize your owl' },
        { label: 'Community', href: '/community', icon: Users, description: 'Connect with miners' },
      ]
    },
    {
      label: 'Company',
      children: [
        { label: 'About Us', href: '/about', icon: Info, description: 'Our mission' },
        { label: 'Roadmap', href: '/roadmap', icon: MapPin, description: 'Development plans' },
        { label: 'Tokenomics', href: '/tokenomics', icon: TrendingUp, description: 'TYT token details' },
        { label: 'VIP Program', href: '/vip', icon: Crown, description: 'Exclusive benefits' },
        { label: 'Help Center', href: '/help', icon: HelpCircle, description: 'Get support' },
      ]
    },
    {
      label: 'Legal',
      children: [
        { label: 'Terms of Service', href: '/terms', icon: FileText, description: 'User agreement' },
        { label: 'Privacy Policy', href: '/privacy', icon: Shield, description: 'Data protection' },
      ]
    }
  ];

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-owl-dark/95 backdrop-blur-md border-b border-gold-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/6d629383-acba-4396-8f01-4715f914aada.png"
              alt="TYT"
              className="w-10 h-10 group-hover:drop-shadow-[0_0_10px_rgba(210,164,76,0.6)] transition-all"
            />
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-owl-gradient bg-clip-text text-transparent">
                TakeYourToken
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={closeDropdown}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    openDropdown === item.label
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleDropdownToggle(item.label)}
                >
                  {item.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === item.label && item.children && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2">
                      {item.children.map((child) => {
                        const Icon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={closeDropdown}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800 transition-all group"
                          >
                            <div className="p-2 bg-gold-500/10 rounded-lg group-hover:bg-gold-500/20 transition-colors">
                              <Icon className="w-5 h-5 text-gold-400" />
                            </div>
                            <div>
                              <div className="font-medium text-white group-hover:text-gold-400 transition-colors">
                                {child.label}
                              </div>
                              {child.description && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {child.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to="/app"
                className="px-5 py-2 bg-gradient-to-r from-gold-500 to-amber-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-gold-500/30 transition-all"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gold-500 to-amber-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-gold-500/30 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-800">
            <div className="space-y-2">
              {navItems.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                  >
                    {item.label}
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === item.label && item.children && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => {
                        const Icon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              closeDropdown();
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
                          >
                            <Icon className="w-4 h-4 text-gold-400" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              {user ? (
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-5 py-3 bg-gradient-to-r from-gold-500 to-amber-500 text-black font-semibold rounded-lg"
                >
                  Open App
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-5 py-3 border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-5 py-3 bg-gradient-to-r from-gold-500 to-amber-500 text-black font-semibold rounded-lg"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
