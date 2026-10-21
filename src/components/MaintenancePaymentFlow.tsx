import { useState, useEffect } from 'react';
import { Zap, Flame, TrendingDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface MaintenancePaymentFlowProps {
  minerId: string;
  minerName: string;
  baseCost: number;
  onPaymentComplete?: () => void;
}

interface PaymentOption {
  currency: 'TYT' | 'USDT' | 'BTC';
  amount: number;
  discount: number;
  savings: number;
  burnAmount?: number;
}

interface UserBalances {
  TYT: number;
  USDT: number;
  BTC: number;
}

export function MaintenancePaymentFlow({
  minerId,
  minerName,
  baseCost,
  onPaymentComplete,
}: MaintenancePaymentFlowProps) {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [balances, setBalances] = useState<UserBalances>({ TYT: 0, USDT: 0, BTC: 0 });
  const [selectedCurrency, setSelectedCurrency] = useState<'TYT' | 'USDT' | 'BTC'>('TYT');
  const [tytDiscount, setTytDiscount] = useState(0);
  const [vipDiscount, setVipDiscount] = useState(0);
  const [serviceButtonDiscount, setServiceButtonDiscount] = useState(0);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    calculatePaymentOptions();
  }, [baseCost, tytDiscount, vipDiscount, serviceButtonDiscount]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, vip_level')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile) return;

      // Get wallet balances
      const { data: wallets } = await supabase
        .from('custodial_wallets')
        .select('asset, balance')
        .eq('user_id', profile.id)
        .in('asset', ['TYT', 'USDT', 'BTC']);

      if (wallets) {
        const newBalances: UserBalances = { TYT: 0, USDT: 0, BTC: 0 };
        wallets.forEach(w => {
          if (w.asset === 'TYT' || w.asset === 'USDT' || w.asset === 'BTC') {
            newBalances[w.asset] = parseFloat(w.balance);
          }
        });
        setBalances(newBalances);
      }

      // Get TYT holdings discount
      const { data: discountTier } = await supabase
        .rpc('get_user_maintenance_discount', { p_user_id: profile.id })
        .single();

      if (discountTier) {
        setTytDiscount(discountTier.discount_percentage || 0);
      }

      // Get VIP discount
      const { data: vipTier } = await supabase
        .from('vip_tiers')
        .select('maintenance_discount_percent')
        .eq('level', profile.vip_level || 0)
        .single();

      if (vipTier) {
        setVipDiscount(vipTier.maintenance_discount_percent || 0);
      }

      // Check service button status (daily -3%)
      const { data: serviceButton } = await supabase
        .from('game_wars_service_buttons')
        .select('last_pressed_at')
        .eq('user_id', profile.id)
        .single();

      if (serviceButton?.last_pressed_at) {
        const lastPressed = new Date(serviceButton.last_pressed_at);
        const today = new Date();
        if (lastPressed.toDateString() === today.toDateString()) {
          setServiceButtonDiscount(3);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePaymentOptions = () => {
    const options: PaymentOption[] = [];

    // TYT Payment (20% base discount + burns)
    const tytBaseDiscount = 20;
    const tytTotalDiscount = Math.min(
      tytBaseDiscount + tytDiscount + vipDiscount + serviceButtonDiscount,
      50 // Max 50% total discount
    );
    const tytFinalCost = baseCost * (1 - tytTotalDiscount / 100);
    const tytAmount = tytFinalCost / 0.05; // Assuming 1 TYT = $0.05
    const tytBurnAmount = tytAmount * 0.5; // 50% of TYT payment is burned

    options.push({
      currency: 'TYT',
      amount: tytAmount,
      discount: tytTotalDiscount,
      savings: baseCost - tytFinalCost,
      burnAmount: tytBurnAmount,
    });

    // USDT Payment (standard)
    const usdtTotalDiscount = vipDiscount + serviceButtonDiscount;
    const usdtFinalCost = baseCost * (1 - usdtTotalDiscount / 100);

    options.push({
      currency: 'USDT',
      amount: usdtFinalCost,
      discount: usdtTotalDiscount,
      savings: baseCost - usdtFinalCost,
    });

    // BTC Payment (standard)
    const btcTotalDiscount = vipDiscount + serviceButtonDiscount;
    const btcFinalCost = baseCost * (1 - btcTotalDiscount / 100);
    const btcAmount = btcFinalCost / 95000; // Assuming BTC = $95,000

    options.push({
      currency: 'BTC',
      amount: btcAmount,
      discount: btcTotalDiscount,
      savings: baseCost - btcFinalCost,
    });

    setPaymentOptions(options);
  };

  const handlePayment = async () => {
    const option = paymentOptions.find(o => o.currency === selectedCurrency);
    if (!option) return;

    // Check balance
    if (balances[selectedCurrency] < option.amount) {
      showToast(`Insufficient ${selectedCurrency} balance`, 'error');
      return;
    }

    setIsPaying(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Create maintenance invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('maintenance_invoices')
        .insert({
          user_id: profile.id,
          miner_id: minerId,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          base_cost_usd: baseCost,
          tyt_discount_percent: selectedCurrency === 'TYT' ? 20 : 0,
          service_discount_percent: serviceButtonDiscount,
          vip_discount_percent: vipDiscount,
          total_discount_percent: option.discount,
          final_cost_usd: baseCost - option.savings,
          payment_currency: selectedCurrency,
          payment_amount: option.amount,
          status: 'paid',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Deduct from wallet
      const { error: deductError } = await supabase.rpc('deduct_from_wallet', {
        p_user_id: profile.id,
        p_asset: selectedCurrency,
        p_amount: option.amount,
      });

      if (deductError) throw deductError;

      // Record transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: profile.id,
          type: 'maintenance_payment',
          asset: selectedCurrency,
          amount: `-${option.amount}`,
          status: 'completed',
          metadata: {
            miner_id: minerId,
            miner_name: minerName,
            invoice_id: invoice.id,
            discount_applied: option.discount,
            burn_amount: option.burnAmount || 0,
          },
        });

      if (txError) throw txError;

      // If TYT payment, record burn
      if (selectedCurrency === 'TYT' && option.burnAmount) {
        await supabase.from('token_burns').insert({
          amount_tyt: option.burnAmount,
          burn_type: 'maintenance_payment',
          status: 'pending',
          metadata: {
            miner_id: minerId,
            invoice_id: invoice.id,
          },
        });
      }

      // Update miner last maintenance paid
      await supabase
        .from('nft_miners')
        .update({
          last_maintenance_paid_at: new Date().toISOString(),
          total_maintenance_paid: (await supabase
            .from('nft_miners')
            .select('total_maintenance_paid')
            .eq('id', minerId)
            .single()
          ).data.total_maintenance_paid + option.amount,
        })
        .eq('id', minerId);

      showToast('Maintenance paid successfully!', 'success');

      // Refresh balances
      await loadUserData();

      if (onPaymentComplete) {
        onPaymentComplete();
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      showToast(err.message || 'Payment failed', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto" />
      </div>
    );
  }

  const selectedOption = paymentOptions.find(o => o.currency === selectedCurrency);

  return (
    <div className="space-y-6">
      {/* Payment Options */}
      <div className="space-y-3">
        {paymentOptions.map((option) => {
          const isSelected = option.currency === selectedCurrency;
          const hasBalance = balances[option.currency] >= option.amount;

          return (
            <button
              key={option.currency}
              onClick={() => setSelectedCurrency(option.currency)}
              disabled={!hasBalance}
              className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : hasBalance
                  ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {option.currency === 'TYT' && <Zap className="w-6 h-6 text-yellow-400" />}
                  {option.currency === 'USDT' && <span className="w-6 h-6 text-2xl">💵</span>}
                  {option.currency === 'BTC' && <span className="w-6 h-6 text-2xl">₿</span>}
                  <div>
                    <div className="font-bold text-white text-lg">Pay with {option.currency}</div>
                    <div className="text-sm text-gray-400">
                      Balance: {balances[option.currency].toFixed(option.currency === 'BTC' ? 8 : 2)} {option.currency}
                    </div>
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-6 h-6 text-yellow-400" />}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {option.amount.toFixed(option.currency === 'BTC' ? 8 : 2)} {option.currency}
                  </div>
                  {option.savings > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingDown className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Save ${option.savings.toFixed(2)} ({option.discount}% discount)
                      </span>
                    </div>
                  )}
                  {option.burnAmount && (
                    <div className="flex items-center gap-2 mt-1">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-orange-400">
                        {option.burnAmount.toFixed(2)} TYT will be burned
                      </span>
                    </div>
                  )}
                </div>
                {!hasBalance && (
                  <span className="text-sm text-red-400 font-medium">Insufficient Balance</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Discount Breakdown */}
      {selectedOption && selectedOption.discount > 0 && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="font-medium text-green-400 mb-3">Discount Breakdown</div>
          <div className="space-y-2 text-sm">
            {selectedCurrency === 'TYT' && (
              <div className="flex justify-between text-gray-300">
                <span>TYT Payment Bonus</span>
                <span className="text-green-400">−20%</span>
              </div>
            )}
            {tytDiscount > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>TYT Holdings Discount</span>
                <span className="text-green-400">−{tytDiscount}%</span>
              </div>
            )}
            {vipDiscount > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>VIP Discount</span>
                <span className="text-green-400">−{vipDiscount}%</span>
              </div>
            )}
            {serviceButtonDiscount > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>Service Button (Today)</span>
                <span className="text-green-400">−{serviceButtonDiscount}%</span>
              </div>
            )}
            <div className="pt-2 border-t border-green-500/20 flex justify-between font-bold">
              <span className="text-white">Total Discount</span>
              <span className="text-green-400">−{selectedOption.discount}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Base Cost</span>
            <span className="text-white font-medium">${baseCost.toFixed(2)}</span>
          </div>
          {selectedOption && selectedOption.savings > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Discount</span>
              <span className="text-green-400 font-medium">−${selectedOption.savings.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-700 flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-yellow-400">
              {selectedOption
                ? `${selectedOption.amount.toFixed(selectedCurrency === 'BTC' ? 8 : 2)} ${selectedCurrency}`
                : `$${baseCost.toFixed(2)}`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={isPaying || !selectedOption || balances[selectedCurrency] < (selectedOption?.amount || 0)}
        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPaying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Pay {selectedOption?.amount.toFixed(selectedCurrency === 'BTC' ? 8 : 2)} {selectedCurrency}
          </>
        )}
      </button>
    </div>
  );
}
