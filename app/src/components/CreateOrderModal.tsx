'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, UsdtChain, Order } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';

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

  const usdtAmount = tokenAmount && price ? parseFloat(tokenAmount) * parseFloat(price) : 0;
  const fee = tokenAmount ? parseFloat(tokenAmount) * PLATFORM_CONFIG.FEE_RATE : 0;

  const userUsdtAddress = currentUser?.paymentAddresses.find(a => a.chain === usdtChain)?.address;

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold">
              {isBuyOrder ? t('Post Buy Order', '发布买单') : t('Post Sell Order', '发布卖单')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isBuyOrder 
                ? t('You want to buy TPOT with USDT', '您想用 USDT 购买 TPOT')
                : t('You want to sell TPOT for USDT', '您想卖出 TPOT 获得 USDT')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Order Type Indicator */}
          <div className={`flex items-center space-x-3 p-4 rounded-2xl ${isBuyOrder ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <span className="text-2xl">{isBuyOrder ? '📈' : '📉'}</span>
            <div>
              <div className={`font-medium ${isBuyOrder ? 'text-green-400' : 'text-red-400'}`}>
                {isBuyOrder ? t('Buy Order', '买单') : t('Sell Order', '卖单')}
              </div>
              <div className="text-sm text-gray-400">
                {isBuyOrder 
                  ? t('You will receive TPOT and pay USDT', '您将收到 TPOT 并支付 USDT')
                  : t('You will receive USDT and send TPOT', '您将收到 USDT 并发送 TPOT')}
              </div>
            </div>
          </div>

          {/* USDT Address Warning */}
          {!userUsdtAddress && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <span>⚠️</span>
                <span className="font-medium">{t('Payment address required', '需要设置收款地址')}</span>
              </div>
              <p className="text-sm text-amber-200/60 mt-1">
                {t('Please set your USDT receiving address in Settings first', '请先在设置中填写您的 USDT 收款地址')}
              </p>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('Amount', '数量')} (TPOT)
            </label>
            <div className="relative">
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 transition"
                placeholder="10000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">TPOT</span>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('Price', '单价')} (USDT/TPOT)
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 transition"
                step="0.01"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">USDT</span>
            </div>
          </div>

          {/* Chain Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('USDT Chain', 'USDT 链')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(USDT_CHAIN_LABELS).map(([key, { name }]) => (
                <button
                  key={key}
                  onClick={() => setUsdtChain(key as UsdtChain)}
                  className={`py-3 rounded-xl transition ${
                    usdtChain === key 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* User's USDT Address */}
          {userUsdtAddress && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-2">
                {t('Your receiving address:', '您的收款地址：')}
              </div>
              <div className="font-mono text-sm break-all text-gray-300">{userUsdtAddress}</div>
            </div>
          )}

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('Min Limit', '最小限额')} (USDT)
              </label>
              <input
                type="number"
                value={minUsdt}
                onChange={(e) => setMinUsdt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('Max Limit', '最大限额')} (USDT)
              </label>
              <input
                type="number"
                value={maxUsdt}
                onChange={(e) => setMaxUsdt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                placeholder={usdtAmount.toString()}
              />
            </div>
          </div>

          {/* Summary */}
          {tokenAmount && (
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-5 space-y-3 border border-blue-500/20">
              <div className="text-sm font-medium text-gray-300 mb-3">{t('Order Summary', '订单摘要')}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('Total USDT', '总计 USDT')}</span>
                <span className="font-medium">{usdtAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('Platform Fee (1%)', '平台手续费 (1%)')}</span>
                <span>{fee.toFixed(2)} TPOT</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-gray-400">
                  {isBuyOrder ? t('You will pay', '您将支付') : t('Counterparty receives', '对方收到')}
                </span>
                <span className="font-medium text-green-400">{usdtAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">
                  {isBuyOrder ? t('You will receive', '您将收到') : t('Counterparty receives', '对方收到')}
                </span>
                <span className="font-medium text-blue-400">{(parseFloat(tokenAmount) - fee).toFixed(2)} TPOT</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleCreate}
            disabled={!tokenAmount || !price || loading}
            className={`w-full py-4 rounded-xl font-medium text-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isBuyOrder
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/25'
            }`}
          >
            {loading 
              ? t('Creating...', '创建中...')
              : (isBuyOrder ? t('Post Buy Order', '发布买单') : t('Post Sell Order', '发布卖单'))}
          </button>
        </div>
      </div>
    </div>
  );
};
