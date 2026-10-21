import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallets, useAggregatedBalances, useLedgerHistory, useFeeConfiguration } from '../../hooks/useAPI';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Filter,
  Download,
  Search,
  TrendingUp,
  Info,
  Heart,
  GraduationCap,
  Building2,
  QrCode,
  ExternalLink,
  Loader2,
  Network,
  Clock,
  Lock,
  DollarSign,
  Send,
  Zap,
  CreditCard
} from 'lucide-react';
import type { CustodialWallet } from '../../types/database';
import { calculateDepositFees, processDeposit, formatFeeBreakdown, type FeeBreakdown } from '../../utils/depositFees';
import {
  getSupportedNetworks,
  getDepositAddresses,
  generateDepositAddress,
  getBlockchainDeposits,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  formatDepositAmount,
  getDepositStatusColor,
  getDepositStatusLabel,
  triggerDepositMonitoring,
  type BlockchainNetwork,
  type DepositAddress,
  type BlockchainDeposit
} from '../../utils/blockchainDeposits';
import { DepositModal } from '../../components/DepositModal';
import { DepositAddressCard } from '../../components/DepositAddressCard';
import { WithdrawalForm } from '../../components/WithdrawalForm';
import NetworkSelector from '../../components/NetworkSelector';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'maintenance' | 'purchase' | 'swap' | 'transfer';
  asset: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  tx_hash?: string;
  from_asset?: string;
  to_asset?: string;
}

type Tab = 'overview' | 'deposit' | 'withdraw' | 'swap' | 'stake' | 'history';

export default function Wallet() {
  const { user } = useAuth();
  const { data: wallets = [], isLoading, refetch } = useWallets(user?.id);
  const { data: aggregatedBalances = [] } = useAggregatedBalances(user?.id);
  const { data: ledgerHistory = [] } = useLedgerHistory(user?.id, { limit: 50 });
  const { data: feeConfig } = useFeeConfiguration('deposit.default');

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [copiedAddress, setCopiedAddress] = useState('');

  const [depositAmount, setDepositAmount] = useState('');
  const [depositFees, setDepositFees] = useState<FeeBreakdown | null>(null);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [selectedWithdrawNetwork, setSelectedWithdrawNetwork] = useState('BTC');

  const [swapFromAsset, setSwapFromAsset] = useState('BTC');
  const [swapToAsset, setSwapToAsset] = useState('TYT');
  const [swapAmount, setSwapAmount] = useState('');

  const [selectedDepositNetwork, setSelectedDepositNetwork] = useState('BTC');

  const [txFilter, setTxFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [txView, setTxView] = useState<'internal' | 'blockchain'>('internal');

  const [networks, setNetworks] = useState<BlockchainNetwork[]>([]);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [blockchainDeposits, setBlockchainDeposits] = useState<BlockchainDeposit[]>([]);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [copiedBlockchainAddress, setCopiedBlockchainAddress] = useState('');

  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [derivationPaths, setDerivationPaths] = useState<Record<string, string>>({});

  // Stripe deposit modal
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositModalCurrency, setDepositModalCurrency] = useState<'USD' | 'BTC' | 'USDT'>('USD');

  useEffect(() => {
    const loadBlockchainData = async () => {
      const [networksData, addressesData, depositsData] = await Promise.all([
        getSupportedNetworks(),
        getDepositAddresses(),
        getBlockchainDeposits()
      ]);
      setNetworks(networksData);
      setDepositAddresses(addressesData);
      setBlockchainDeposits(depositsData);
    };
    loadBlockchainData();
  }, []);

  useEffect(() => {
    const loadFees = async () => {
      if (depositAmount && parseFloat(depositAmount) > 0) {
        const fees = await calculateDepositFees(parseFloat(depositAmount), selectedAsset);
        setDepositFees(fees);
      } else {
        setDepositFees(null);
      }
    };

    const debounce = setTimeout(() => {
      loadFees();
    }, 500);

    return () => clearTimeout(debounce);
  }, [depositAmount, selectedAsset]);

  const handleGenerateAddress = async (networkCode: string) => {
    setIsGeneratingAddress(networkCode);
    try {
      const result = await generateDepositAddress(networkCode);
      if (result.success && result.address) {
        const addressesData = await getDepositAddresses();
        setDepositAddresses(addressesData);

        if (result.qr_code) {
          setQrCodes(prev => ({ ...prev, [networkCode]: result.qr_code! }));
        }
        if (result.derivation_path) {
          setDerivationPaths(prev => ({ ...prev, [networkCode]: result.derivation_path! }));
        }

        alert(`Address generated successfully!\n\n${result.address}`);
      } else {
        alert(`Failed to generate address: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating address:', error);
      alert('Failed to generate address. Please try again.');
    } finally {
      setIsGeneratingAddress(null);
    }
  };

  const handleMonitorDeposits = async () => {
    setIsMonitoring(true);
    try {
      const result = await triggerDepositMonitoring();
      if (result.success) {
        const depositsData = await getBlockchainDeposits();
        setBlockchainDeposits(depositsData);
        refetch();
        alert(`Monitoring complete!\nChecked ${result.checked_addresses || 0} addresses\nFound ${result.new_deposits || 0} new deposits`);
      } else {
        alert(`Monitoring failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error monitoring deposits:', error);
      alert('Monitoring failed. Please try again.');
    } finally {
      setIsMonitoring(false);
    }
  };

  const copyBlockchainAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedBlockchainAddress(address);
    setTimeout(() => setCopiedBlockchainAddress(''), 2000);
  };

  const handleDepositSubmit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return;
    }

    setIsProcessingDeposit(true);
    try {
      const result = await processDeposit(
        selectedAsset,
        parseFloat(depositAmount)
      );

      if (result.success) {
        setDepositAmount('');
        setDepositFees(null);
        refetch();
        alert(`Deposit successful! ${result.amount_credited} ${selectedAsset} credited to your wallet.`);
      } else {
        alert(`Deposit failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed. Please try again.');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'reward',
      asset: 'BTC',
      amount: '0.00012345',
      status: 'completed',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      type: 'maintenance',
      asset: 'TYT',
      amount: '150.00',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      type: 'deposit',
      asset: 'USDT',
      amount: '500.00',
      status: 'completed',
      created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '4',
      type: 'swap',
      asset: 'TYT',
      amount: '1000.00',
      status: 'completed',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      from_asset: 'USDT',
      to_asset: 'TYT'
    }
  ];

  const copyToClipboard = (text: string, asset: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(asset);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  const getDepositAddress = (asset: string): string => {
    const addresses: Record<string, string> = {
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      SOL: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      TRX: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
      XRP: 'rN7n7otQDd6FczFgLdZqxrqRq4xQASSKr2',
      TYT: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
      USDT: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9'
    };
    return addresses[asset] || 'Address not available';
  };

  const assetPrices: Record<string, number> = {
    BTC: 95000,
    ETH: 3500,
    SOL: 140,
    TRX: 0.15,
    XRP: 2.5,
    TYT: 0.05,
    USDT: 1
  };

  const totalBalanceUSD = wallets.reduce((sum, wallet) => {
    return sum + parseFloat(wallet.balance) * (assetPrices[wallet.asset] || 0);
  }, 0);

  const filteredTransactions = mockTransactions.filter(tx => {
    if (txFilter !== 'all' && tx.type !== txFilter) return false;
    if (searchTerm && !tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tx.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const selectedWallet = wallets.find(w => w.asset === selectedAsset);
  const swapFromWallet = wallets.find(w => w.asset === swapFromAsset);
  const swapRate = swapFromAsset && swapToAsset ?
    assetPrices[swapFromAsset] / assetPrices[swapToAsset] : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
          <div className="text-gray-400">Loading wallet...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <WalletIcon className="w-8 h-8 text-gold-400" />
            TYT Ecosystem Wallet
          </h1>
          <p className="text-gray-400">Your unified custodial wallet for all TYT operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg font-semibold hover:bg-gold-500/30 transition-all flex items-center gap-2">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gold-500/20 to-amber-500/20 rounded-xl p-8 border border-gold-500/50 shadow-gold-glow">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Portfolio Value
            </div>
            <div className="text-4xl md:text-5xl font-bold bg-owl-gradient bg-clip-text text-transparent mb-2">
              ${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-400">
              Across {wallets.length} assets • Secured by TYT
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">24h Change</div>
            <div className="text-lg font-bold text-green-400">+2.3%</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
        <div className="flex overflow-x-auto border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: WalletIcon },
            { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
            { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
            { id: 'swap', label: 'Swap', icon: ArrowRightLeft },
            { id: 'stake', label: 'Stake', icon: Lock },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-shrink-0 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gold-500/20 text-gold-400 border-b-2 border-gold-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Your Assets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {wallets.map((wallet) => {
                  const usdValue = parseFloat(wallet.balance) * (assetPrices[wallet.asset] || 0);

                  return (
                    <div
                      key={wallet.id}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gold-500/50 transition-all cursor-pointer"
                      onClick={() => setSelectedAsset(wallet.asset)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-amber-500/20 flex items-center justify-center text-xl font-bold text-gold-400">
                            {wallet.asset[0]}
                          </div>
                          <div>
                            <div className="font-bold text-lg">{wallet.asset}</div>
                            <div className="text-xs text-gray-500">Available</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">
                          {parseFloat(wallet.balance).toFixed(wallet.asset === 'BTC' ? 8 : 2)}
                        </div>
                        <div className="text-sm text-gray-400">
                          ≈ ${usdValue.toFixed(2)} USD
                        </div>
                        {parseFloat(wallet.locked_balance) > 0 && (
                          <div className="text-xs text-gold-400 mt-2 flex items-center gap-1">
                            <Lock size={12} />
                            Locked: {parseFloat(wallet.locked_balance).toFixed(wallet.asset === 'BTC' ? 8 : 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setDepositModalCurrency('USD');
                    setIsDepositModalOpen(true);
                  }}
                  className="group p-6 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 rounded-xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors">
                      <CreditCard className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg mb-1">Deposit via Card</div>
                      <div className="text-sm text-gray-400">Instant deposit (Stripe)</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('deposit')}
                  className="group p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                      <ArrowDownLeft className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg mb-1">Deposit Crypto</div>
                      <div className="text-sm text-gray-400">Add funds via blockchain</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="group p-6 bg-gradient-to-br from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                      <ArrowUpRight className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg mb-1">Withdraw</div>
                      <div className="text-sm text-gray-400">Send to external wallet</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('swap')}
                  className="group p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                      <ArrowRightLeft className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg mb-1">Swap</div>
                      <div className="text-sm text-gray-400">Exchange between assets</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Deposit Crypto</h2>
                <p className="text-gray-400">Generate blockchain addresses to receive crypto deposits</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300 space-y-2">
                    <p className="font-semibold text-white">
                      V3 Transparent Fee Structure ({feeConfig?.[0]?.fee_bps_total ? feeConfig[0].fee_bps_total / 100 : 10}%)
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-blue-400" />
                        <span>{feeConfig?.[0]?.protocol_pct || 60}% → Platform Operations (6% of deposit)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart size={12} className="text-pink-400" />
                        <span>{feeConfig?.[0]?.charity_pct || 30}% → Children's Brain Cancer Foundation (3% of deposit)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap size={12} className="text-cyan-400" />
                        <span>{feeConfig?.[0]?.academy_pct || 10}% → Blockchain Academy (1% of deposit)</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      All fee distributions are recorded in immutable ledger for full transparency.
                    </p>
                  </div>
                </div>
              </div>

              <NetworkSelector
                selectedNetwork={selectedDepositNetwork}
                onNetworkSelect={setSelectedDepositNetwork}
                showTokens={true}
              />

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Your Deposit Address</h3>
                  <button
                    onClick={handleMonitorDeposits}
                    disabled={isMonitoring}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isMonitoring ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Check Deposits
                      </>
                    )}
                  </button>
                </div>

                {selectedDepositNetwork && networks.find(n => n.network_code === selectedDepositNetwork) && (
                  <div className="max-w-2xl mx-auto">
                    <DepositAddressCard
                      network={networks.find(n => n.network_code === selectedDepositNetwork)!}
                      address={depositAddresses.find(a => a.network_code === selectedDepositNetwork)?.address}
                      qrCode={qrCodes[selectedDepositNetwork] || ''}
                      derivationPath={depositAddresses.find(a => a.network_code === selectedDepositNetwork)?.derivation_path || derivationPaths[selectedDepositNetwork]}
                      onGenerate={() => handleGenerateAddress(selectedDepositNetwork)}
                      isGenerating={isGeneratingAddress === selectedDepositNetwork}
                    />
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">All Your Addresses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {networks.filter(network => depositAddresses.find(a => a.network_code === network.network_code)).map((network) => {
                    const address = depositAddresses.find(a => a.network_code === network.network_code);

                    return (
                      <div
                        key={network.network_code}
                        onClick={() => setSelectedDepositNetwork(network.network_code)}
                        className="p-4 bg-gray-800/50 border border-gray-700 hover:border-gold-500 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold">{network.network_name}</span>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                            {network.native_symbol}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate">
                          {address?.address}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 group-hover:text-gold-400 transition-colors">
                          Click to view details →
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Withdraw Crypto</h2>
                <p className="text-gray-400">Send funds to an external wallet with KYC-based limits</p>
              </div>

              <NetworkSelector
                selectedNetwork={selectedWithdrawNetwork}
                onNetworkSelect={setSelectedWithdrawNetwork}
                showTokens={true}
              />

              <div className="mt-8 max-w-2xl mx-auto">
                <WithdrawalForm
                  availableAssets={wallets.map(w => ({
                    asset: w.asset,
                    balance: parseFloat(w.balance)
                  }))}
                  onSuccess={() => refetch()}
                />
              </div>
            </div>
          )}

          {activeTab === 'swap' && swapFromWallet && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Swap Assets</h2>
                <p className="text-gray-400">Exchange between different cryptocurrencies</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">From</label>
                <select
                  value={swapFromAsset}
                  onChange={(e) => setSwapFromAsset(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-2"
                >
                  {wallets.map(w => (
                    <option key={w.asset} value={w.asset}>{w.asset}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
                />
                <div className="text-xs text-gray-400 mt-2">
                  Balance: {parseFloat(swapFromWallet.balance).toFixed(8)} {swapFromAsset}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-gold-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">To</label>
                <select
                  value={swapToAsset}
                  onChange={(e) => setSwapToAsset(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-2"
                >
                  {wallets.filter(w => w.asset !== swapFromAsset).map(w => (
                    <option key={w.asset} value={w.asset}>{w.asset}</option>
                  ))}
                </select>
                <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gold-400 font-bold">
                  {swapAmount ? (parseFloat(swapAmount) * swapRate).toFixed(8) : '0.00'}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Rate: 1 {swapFromAsset} = {swapRate.toFixed(8)} {swapToAsset}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                <div className="text-sm text-gray-300">
                  Exchange fee: 0.5%
                </div>
              </div>

              <button
                disabled={!swapAmount || parseFloat(swapAmount) <= 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:from-blue-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Swap Assets
              </button>
            </div>
          )}

          {activeTab === 'stake' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Stake TYT</h2>
                <p className="text-gray-400">Lock TYT tokens to earn rewards and governance power</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { duration: 30, apy: 8, label: '30 Days' },
                  { duration: 90, apy: 15, label: '90 Days' },
                  { duration: 180, apy: 25, label: '180 Days' },
                  { duration: 365, apy: 40, label: '1 Year' }
                ].map(pool => (
                  <div
                    key={pool.duration}
                    className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-gold-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-lg">{pool.label}</div>
                      <div className="text-green-400 font-bold text-xl">{pool.apy}% APY</div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Lock size={14} />
                        <span>Lock period: {pool.duration} days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap size={14} />
                        <span>Daily rewards</span>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition-all">
                      Stake Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Transaction History</h2>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 lg:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full lg:w-64 pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                  <select
                    value={txFilter}
                    onChange={(e) => setTxFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="reward">Rewards</option>
                    <option value="swap">Swaps</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setTxView('internal')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    txView === 'internal'
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Internal
                </button>
                <button
                  onClick={() => setTxView('blockchain')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    txView === 'blockchain'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Blockchain ({blockchainDeposits.length})
                </button>
              </div>

              <div className="space-y-3">
                {txView === 'internal' ? (
                  filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <WalletIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <div key={tx.id} className="p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              tx.type === 'deposit' || tx.type === 'reward' ? 'bg-green-500/20' :
                              tx.type === 'swap' ? 'bg-blue-500/20' :
                              'bg-red-500/20'
                            }`}>
                              {tx.type === 'deposit' || tx.type === 'reward' ? (
                                <ArrowDownLeft className="w-6 h-6 text-green-400" />
                              ) : tx.type === 'swap' ? (
                                <ArrowRightLeft className="w-6 h-6 text-blue-400" />
                              ) : (
                                <ArrowUpRight className="w-6 h-6 text-red-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold capitalize mb-1">
                                {tx.type === 'swap' && tx.from_asset && tx.to_asset
                                  ? `Swap ${tx.from_asset} → ${tx.to_asset}`
                                  : tx.type}
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(tx.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${
                              tx.type === 'deposit' || tx.type === 'reward' ? 'text-green-400' :
                              tx.type === 'swap' ? 'text-blue-400' :
                              'text-red-400'
                            }`}>
                              {tx.type === 'deposit' || tx.type === 'reward' ? '+' :
                               tx.type === 'swap' ? '' : '-'}
                              {tx.amount} {tx.asset}
                            </div>
                            <div className={`text-xs font-semibold mt-1 ${
                              tx.status === 'completed' ? 'text-green-400' :
                              tx.status === 'pending' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {tx.status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  blockchainDeposits.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No blockchain deposits yet</p>
                      <p className="text-sm mt-2">Generate an address and make a deposit to get started</p>
                    </div>
                  ) : (
                    blockchainDeposits.map((deposit) => {
                      const network = networks.find(n => n.network_code === deposit.network_code);
                      return (
                        <div key={deposit.id} className="p-6 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/20">
                                <ArrowDownLeft className="w-6 h-6 text-blue-400" />
                              </div>
                              <div>
                                <div className="font-semibold mb-1">
                                  Blockchain Deposit - {deposit.asset}
                                </div>
                                <div className="text-xs text-gray-400 mb-1">
                                  {deposit.network_code} • {new Date(deposit.detected_at).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={network ? getExplorerTxUrl(network.explorer_url, deposit.tx_hash) : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
                                  >
                                    {deposit.tx_hash.slice(0, 12)}...{deposit.tx_hash.slice(-8)}
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-blue-400">
                                +{formatDepositAmount(deposit.amount, deposit.asset)} {deposit.asset}
                              </div>
                              {deposit.amount_credited && (
                                <div className="text-sm text-green-400 mt-1">
                                  Credited: {formatDepositAmount(deposit.amount_credited, deposit.asset)} {deposit.asset}
                                </div>
                              )}
                              <div className={`text-xs font-semibold mt-1 ${getDepositStatusColor(deposit.status)}`}>
                                {getDepositStatusLabel(deposit.status).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stripe Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        currency={depositModalCurrency}
        onSuccess={() => {
          setIsDepositModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
