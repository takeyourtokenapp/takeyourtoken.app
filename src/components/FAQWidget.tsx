import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQWidgetProps {
  items?: FAQItem[];
  maxItems?: number;
  showSearch?: boolean;
  compact?: boolean;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'What is TYT token and how does it work?',
    answer: 'TYT (Take Your Token) is our native utility token built on Solana blockchain. It provides discounts on maintenance fees (up to 20%), governance voting rights, and exclusive access to premium features. When you pay maintenance with TYT, tokens are automatically burned, creating deflationary pressure.',
    category: 'token'
  },
  {
    id: '2',
    question: 'How do NFT miners generate Bitcoin rewards?',
    answer: 'Each NFT miner represents real mining capacity in our partner data centers. Your miner processes Bitcoin transactions 24/7, earning daily BTC rewards proportional to your hashrate (TH/s). Rewards are calculated daily after electricity and service fees are deducted.',
    category: 'mining'
  },
  {
    id: '3',
    question: 'What are the maintenance fees and how do I pay them?',
    answer: 'Maintenance fees cover electricity costs and service fees. You can pay with TYT (20% discount), USDT, or BTC. Fees are deducted automatically from your daily rewards. If rewards don\'t cover fees, your miner remains active for 30 days while you can add funds.',
    category: 'fees'
  },
  {
    id: '4',
    question: 'How does the Foundation support children with brain cancer?',
    answer: 'TYT Children\'s Brain Cancer Research & Support Foundation receives 1% from every transaction in our ecosystem. Funds support medical research, family assistance, equipment purchases, and clinical trials. All donations are transparently tracked on blockchain.',
    category: 'foundation'
  },
  {
    id: '5',
    question: 'What KYC verification levels exist and what are the limits?',
    answer: 'KYC Level 0: $100/day withdrawal. Level 1 (Basic): $1,000/day. Level 2 (Standard): $10,000/day. Level 3 (VIP): Unlimited withdrawals. Verification requires ID document, selfie, and proof of address (Levels 2-3).',
    category: 'kyc'
  },
  {
    id: '6',
    question: 'How long does it take to break even on a miner purchase?',
    answer: 'Break-even time depends on Bitcoin price, network difficulty, and your miner\'s efficiency. Typically, miners break even in 6-12 months. Use our Income Calculator to estimate ROI based on current market conditions.',
    category: 'roi'
  }
];

export default function FAQWidget({
  items = DEFAULT_FAQS,
  maxItems = 6,
  showSearch = true,
  compact = false
}: FAQWidgetProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items
    .filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, maxItems);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle className="w-6 h-6 text-blue-400" />
        <h3 className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>
          Frequently Asked Questions
        </h3>
      </div>

      {showSearch && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      )}

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden transition-all hover:border-gray-600"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-left transition-colors hover:bg-gray-800/50"
              >
                <span className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
                  {item.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0 ml-3" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-700">
                  <p className={`text-gray-300 leading-relaxed ${compact ? 'text-sm' : 'text-base'}`}>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No questions found matching your search.</p>
        </div>
      )}

      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 mb-3">Still have questions?</p>
          <a
            href="/help"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            Visit Help Center
          </a>
        </div>
      )}
    </div>
  );
}

export function FAQSection({ items, title }: { items: FAQItem[]; title?: string }) {
  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
      )}
      <FAQWidget items={items} showSearch={true} compact={false} />
    </div>
  );
}

export function CompactFAQ({ items, maxItems = 3 }: { items?: FAQItem[]; maxItems?: number }) {
  return (
    <FAQWidget items={items} maxItems={maxItems} showSearch={false} compact={true} />
  );
}
