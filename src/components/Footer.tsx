import { Heart, Mail, Twitter, Github, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* О проекте */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/6d629383-acba-4396-8f01-4715f914aada.png" alt="TYT" className="w-10 h-10" />
              <div>
                <h3 className="font-bold text-lg">Take Your Token</h3>
                <p className="text-xs text-gray-400">Owl Warrior Ecosystem</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Web3 Mining Platform поддерживающий исследования детских опухолей мозга
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/takeyourtoken" target="_blank" rel="noopener noreferrer"
                 className="w-8 h-8 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition-colors">
                <Twitter size={16} />
              </a>
              <a href="https://github.com/takeyourtoken" target="_blank" rel="noopener noreferrer"
                 className="w-8 h-8 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition-colors">
                <Github size={16} />
              </a>
              <a href="https://t.me/takeyourtoken" target="_blank" rel="noopener noreferrer"
                 className="w-8 h-8 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition-colors">
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Платформа */}
          <div>
            <h4 className="font-bold mb-4 text-amber-400">Платформа</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/app/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/app/miners" className="text-gray-400 hover:text-white transition-colors">
                  Мои Майнеры
                </Link>
              </li>
              <li>
                <Link to="/app/marketplace" className="text-gray-400 hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/app/wallet" className="text-gray-400 hover:text-white transition-colors">
                  Кошелёк
                </Link>
              </li>
              <li>
                <Link to="/app/academy" className="text-gray-400 hover:text-white transition-colors">
                  Академия
                </Link>
              </li>
              <li>
                <Link to="/tokenomics" className="text-gray-400 hover:text-white transition-colors">
                  Tokenomics
                </Link>
              </li>
              <li>
                <Link to="/vip" className="text-gray-400 hover:text-white transition-colors">
                  VIP Levels
                </Link>
              </li>
            </ul>
          </div>

          {/* Компания */}
          <div>
            <h4 className="font-bold mb-4 text-amber-400">Компания</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-gray-400 hover:text-white transition-colors">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link to="/app/foundation" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  Фонд <Heart size={12} className="text-pink-400" />
                </Link>
              </li>
              <li>
                <a href="mailto:hello@takeyourtoken.app" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  Контакты <Mail size={12} />
                </a>
              </li>
              <li>
                <a href="mailto:press@takeyourtoken.app" className="text-gray-400 hover:text-white transition-colors">
                  Для СМИ
                </a>
              </li>
            </ul>
          </div>

          {/* Юридическое */}
          <div>
            <h4 className="font-bold mb-4 text-amber-400">Юридическое</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#cookies" className="text-gray-400 hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="mailto:legal@takeyourtoken.app" className="text-gray-400 hover:text-white transition-colors">
                  Legal Inquiries
                </a>
              </li>
              <li>
                <a href="mailto:compliance@takeyourtoken.app" className="text-gray-400 hover:text-white transition-colors">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Foundation Notice */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-pink-400 mb-2">TYT Children's Brain Cancer Research & Support Foundation</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Каждая транзакция на платформе автоматически поддерживает исследования и лечение опухолей мозга у детей.
                  Вместе мы финансируем прорывные научные исследования и помогаем семьям по всему миру.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  <span>🏥 Партнёрство с ведущими клиниками</span>
                  <span>🔬 Финансирование исследований</span>
                  <span>💝 Поддержка семей</span>
                  <span>📊 Полная прозрачность</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-amber-400">⚠️ Risk Disclosure:</strong> Cryptocurrency mining involves financial risk.
              Past performance does not guarantee future results. Mining rewards are variable and depend on network difficulty,
              Bitcoin price, and operational costs. NFT miners are digital service access tokens, not investment securities.
              Please read our <Link to="/terms" className="text-amber-400 hover:underline">Terms of Service</Link> carefully before participating.
            </p>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            TakeYourToken operates as a digital mining service platform. All services are provided "as is" without warranties.
            The platform is not available to residents of sanctioned jurisdictions or where cryptocurrency services are prohibited.
            KYC verification may be required for certain features and withdrawal limits.
            By using this platform, you agree to our <Link to="/terms" className="text-gray-400 hover:text-white">Terms</Link> and
            acknowledge our <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Take Your Token. All rights reserved.
            <span className="mx-2">•</span>
            Built with <Heart size={12} className="inline text-pink-400" /> for a better future
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Platform Version 2.0 • Last Updated: December 12, 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
