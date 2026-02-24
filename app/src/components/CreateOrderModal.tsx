'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, UsdtChain, Order } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button, Input, Card, Divider } from '@/components/ui';
import { formatNumber } from '@/lib/theme';

interface Props {
  onClose: () => void;
}

export const CreateOrderModal = ({ onClose }: Props) => {
  const { publicKey } = useWallet();
  const { currentUser, addOrder, activeTab } = useP2PStore();
  const { language } = useLanguage();

  const orderType = activeTab;
  const [tokenAmount, setTokenAmount] = useState('');
  const [price, setPrice] = useState('0.5');
  const [usdtChain, setUsdtChain] = useState<UsdtChain>('trc20');
  const [minUsdt, setMinUsdt] = useState('100');
  const [maxUsdt, setMaxUsdt] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const usdtAmount = tokenAmount && price ? parseFloat(tokenAmount) * parseFloat(price) : 0;
  const fee = tokenAmount ? parseFloat(tokenAmount) * PLATFORM_CONFIG.FEE_RATE : 0;
  const maxAvailable = usdtAmount || 0;

  const userUsdtAddress = currentUser?.paymentAddresses.find(a => a.chain === usdtChain)?.address;

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCreate = async () => {
    if (!publicKey || !tokenAmount || !price) return;
    
    setLoading(true);
    try {
      const newOrder: Order = {
        id: Date.now().toString(),
        type: orderType,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maker: publicKey.toString(),
        makerNickname: currentUser?.nickname || 'You',
        makerUsdtAddress: userUsdtAddress || '',
        makerUsdtChain: usdtChain,
        tokenAmount: parseFloat(tokenAmount),
        price: parseFloat(price),
        usdtAmount,
        feeRate: PLATFORM_CONFIG.FEE_RATE,
        fee,
        minUsdt: parseFloat(minUsdt) || 100,
        maxUsdt: parseFloat(maxUsdt) || usdtAmount,
      };
      
      addOrder(newOrder);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isBuyOrder = orderType === 'buy';
  const isValid = tokenAmount && price && parseFloat(tokenAmount) > 0 && parseFloat(price) > 0;

  const quickAmounts = [1000, 5000, 10000, 50000];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#12121a] w-full md:max-w-lg md:rounded-2xl rounded-t-3xl border-t md:border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuyOrder ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <span className="text-xl">{isBuyOrder ? '📈' : '📉'}</span>
            </div>
            <div>
              <h2 className="font-bold">
                {isBuyOrder ? t('Post Buy Order', '发布买单') : t('Post Sell Order', '发布卖单')}
              </h2>
              <p className="text-xs text-gray-500">
                {isBuyOrder ? t('Receive TPOT, pay USDT', '收 TPOT，付 USDT') : t('Receive USDT, send TPOT', '收 USDT，付 TPOT')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-5">
            {!userUsdtAddress && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-amber-400 text-sm font-medium">{t('USDT Address Required', '需要设置收款地址')}</p>
                    <p className="text-amber-400/70 text-xs mt-1">{t('Set receiving address in Settings first', '请先在设置中设置收款地址')}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">{t('Amount', '数量')} (TPOT)</label>
                <span className="text-xs text-gray-500">{t('Available', '可用')}: 100,000</span>
              </div>
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xl font-medium focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="0.00"
                inputMode="decimal"
              />
              <div className="flex space-x-2 mt-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTokenAmount(amt.toString())}
                    className="flex-1 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition"
                  >
                    {formatNumber(amt, 0)}
                  </button>
                ))}
                <button
                  onClick={() => setTokenAmount('100000')}
                  className="flex-1 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition"
                >
                  {t('Max', '全部')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('Price', '单价')} (USDT/TPOT)</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xl font-medium focus:outline-none focus:border-blue-500 transition-colors pr-20"
                  step="0.01"
                  inputMode="decimal"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USDT</div>
              </div>
              <div className="flex space-x-2 mt-2">
                {[0.48, 0.50, 0.52].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrice(p.toString())}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition ${price === p.toString() ? 'bg-blue-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {p.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('USDT Chain', 'USDT 链')}</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(USDT_CHAIN_LABELS).map(([key, { name }]) => (
                  <button
                    key={key}
                    onClick={() => setUsdtChain(key as UsdtChain)}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                      usdtChain === key 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {name.split('-')[1] || name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('Transaction Limits', '交易限额')} (USDT)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    value={minUsdt}
                    onChange={(e) => setMinUsdt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={t('Min', '最小')}
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={maxUsdt}
                    onChange={(e) => setMaxUsdt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={maxAvailable.toFixed(0) || t('Max', '最大')}
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {isValid && (
          <div className="border-t border-white/5 p-4 bg-gradient-to-b from-transparent to-[#12121a]/50">
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">{t('Order Summary', '订单摘要')}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${isBuyOrder ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isBuyOrder ? t('Buy', '买') : t('Sell', '卖')}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('Total Value', '总价值')}</span>
                  <span className="font-medium">{formatNumber(usdtAmount)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('Platform Fee', '平台费')} (1%)</span>
                  <span className="text-gray-400">{formatNumber(fee)} TPOT</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="text-gray-400">{isBuyOrder ? t('You Pay', '您付') : t('You Receive', '您得')}</span>
                  <span className={`font-bold text-lg ${isBuyOrder ? 'text-green-400' : 'text-blue-400'}`}>
                    {formatNumber(usdtAmount)} USDT
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5 bg-[#12121a]">
          <button
            onClick={handleCreate}
            disabled={!isValid || loading}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              isBuyOrder
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98]'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('Creating...', '创建中...')}
              </span>
            ) : (
              isBuyOrder ? t('Post Buy Order', '发布买单') : t('Post Sell Order', '发布卖单')
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
