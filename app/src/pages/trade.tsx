'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useP2PStore, Order, USDT_CHAIN_LABELS, UsdtChain } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import Link from 'next/link';

export default function TradePage() {
  const { publicKey, connected } = useWallet();
  const { orders, activeTab, setActiveTab, setCurrentUser, currentUser } = useP2PStore();
  const { language, setLanguage } = useLanguage();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<UsdtChain | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (publicKey && !currentUser) {
      setCurrentUser({
        publicKey: publicKey.toString(),
        nickname: publicKey.toString().slice(0, 6) + '...' + publicKey.toString().slice(-4),
        paymentAddresses: [],
        totalTrades: 0,
        completionRate: 100,
        positiveRate: 100,
        createdAt: new Date(),
      });
    }
  }, [publicKey, currentUser, setCurrentUser]);

  useEffect(() => {
    const mockOrders: Order[] = [
      { id: '1', type: 'sell', status: 'pending', createdAt: new Date(Date.now() - 3600000), expiresAt: new Date(Date.now() + 82800000), maker: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', makerNickname: 'Alice', makerUsdtAddress: 'TRX7aN2XxXxXxXxXxXxXxXxXxXxXxXxXxX', makerUsdtChain: 'trc20', tokenAmount: 10000, price: 0.5, usdtAmount: 5000, feeRate: 0.01, fee: 100, minUsdt: 100, maxUsdt: 5000 },
      { id: '2', type: 'sell', status: 'pending', createdAt: new Date(Date.now() - 7200000), expiresAt: new Date(Date.now() + 79200000), maker: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdavVLumpY2Mr', makerNickname: 'Bob', makerUsdtAddress: '0x1234567890abcdef', makerUsdtChain: 'erc20', tokenAmount: 50000, price: 0.52, usdtAmount: 26000, feeRate: 0.01, fee: 500, minUsdt: 1000, maxUsdt: 26000 },
      { id: '3', type: 'buy', status: 'pending', createdAt: new Date(Date.now() - 1800000), expiresAt: new Date(Date.now() + 84600000), maker: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694eD', makerNickname: 'Charlie', makerUsdtAddress: 'TRC20BuyerAddress123', makerUsdtChain: 'trc20', tokenAmount: 20000, price: 0.48, usdtAmount: 9600, feeRate: 0.01, fee: 200, minUsdt: 500, maxUsdt: 9600 },
      { id: '4', type: 'buy', status: 'pending', createdAt: new Date(Date.now() - 5400000), expiresAt: new Date(Date.now() + 81000000), maker: '2ZjxXA3mBNxs33xQXt8rHHpDvhWXGPs5xjWhLfP5nQxL', makerNickname: 'Diana', makerUsdtAddress: '0xBuyerERC20Address', makerUsdtChain: 'erc20', tokenAmount: 30000, price: 0.49, usdtAmount: 14700, feeRate: 0.01, fee: 300, minUsdt: 1000, maxUsdt: 14700 },
    ];
    useP2PStore.setState({ orders: mockOrders });
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.type !== activeTab) return false;
      if (order.status !== 'pending') return false;
      if (selectedChain && order.makerUsdtChain !== selectedChain) return false;
      return true;
    });
  }, [orders, activeTab, selectedChain]);

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
              T
            </div>
            <span className="font-bold text-base md:text-lg">TPOT P2P</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs rounded transition ${language === 'en' ? 'bg-white/10' : ''}`}>EN</button>
              <button onClick={() => setLanguage('zh')} className={`px-2 py-1 text-xs rounded transition ${language === 'zh' ? 'bg-white/10' : ''}`}>中</button>
            </div>
            
            {connected && (
              <button onClick={() => setShowSettingsModal(true)} className="p-2 hover:bg-white/5 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <div className="sm:hidden">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-xs !py-1.5 !px-3" />
            </div>
            <div className="hidden sm:block">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-sm !py-2 !px-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 md:max-w-6xl md:mx-auto">
        {/* Warning Banner */}
        {!connected && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔐</span>
              <div>
                <p className="font-medium text-amber-200 text-sm">{t('Connect Wallet to Trade', '连接钱包开始交易')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Market Stats - Compact on mobile */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
          <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5 text-center">
            <div className="text-xs text-gray-400 mb-0.5">{t('Buy', '买价')}</div>
            <div className="text-base md:text-xl font-bold text-green-400">0.52</div>
            <div className="text-xs text-gray-500">USDT</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5 text-center">
            <div className="text-xs text-gray-400 mb-0.5">{t('Sell', '卖价')}</div>
            <div className="text-base md:text-xl font-bold text-red-400">0.48</div>
            <div className="text-xs text-gray-500">USDT</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5 text-center">
            <div className="text-xs text-gray-400 mb-0.5">{t('24h Vol', '24h量')}</div>
            <div className="text-base md:text-xl font-bold">125K</div>
            <div className="text-xs text-gray-500">TPOT</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 md:py-3 rounded-lg font-medium transition text-sm md:text-base ${
              activeTab === 'buy' ? 'bg-green-500 text-white' : 'text-gray-400'
            }`}
          >
            <span>📈</span>
            <span>{t('Buy', '买入')}</span>
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 md:py-3 rounded-lg font-medium transition text-sm md:text-base ${
              activeTab === 'sell' ? 'bg-red-500 text-white' : 'text-gray-400'
            }`}
          >
            <span>📉</span>
            <span>{t('Sell', '卖出')}</span>
          </button>
        </div>

        {/* Filter & Create Row */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{selectedChain ? USDT_CHAIN_LABELS[selectedChain].name : t('Filter', '筛选')}</span>
            {selectedChain && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
          </button>

          {connected && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === 'buy' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-red-500 to-rose-600'
              }`}
            >
              <span>+</span>
              <span className="hidden sm:inline">{activeTab === 'buy' ? t('Post Buy', '发买单') : t('Post Sell', '发卖单')}</span>
              <span className="sm:hidden">{t('Post', '发布')}</span>
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
            <div className="text-xs text-gray-400 mb-2">{t('Select Chain', '选择链')}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setSelectedChain(''); setShowFilters(false); }}
                className={`py-2 rounded-lg text-sm transition ${!selectedChain ? 'bg-blue-500 text-white' : 'bg-white/5'}`}
              >
                {t('All', '全部')}
              </button>
              {Object.entries(USDT_CHAIN_LABELS).map(([key, { name }]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedChain(key as UsdtChain); setShowFilters(false); }}
                  className={`py-2 rounded-lg text-sm transition ${selectedChain === key ? 'bg-blue-500 text-white' : 'bg-white/5'}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Order List - Mobile Optimized */}
        <div className="space-y-2 md:space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center border border-white/5">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-400 text-sm">{t('No orders', '暂无订单')}</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="bg-white/5 active:bg-white/10 border border-white/5 rounded-xl p-3 md:p-4 transition cursor-pointer"
              >
                {/* Mobile Layout */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                      {order.makerNickname[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{order.makerNickname}</div>
                      <div className="text-xs text-gray-500">156 {t('trades', '交易')} · 98%</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${order.type === 'sell' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {order.type === 'sell' ? t('Sell', '卖') : t('Buy', '买')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-400">{t('Price', '价格')}: </span>
                    <span className="font-bold">{order.price}</span>
                    <span className="text-gray-400 text-xs"> USDT</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">{t('Avail', '可用')}: </span>
                    <span className="font-bold">{order.tokenAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <div className="text-xs text-gray-400">
                    {t('Limit', '限额')}: {order.minUsdt}-{order.maxUsdt} USDT
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-white/5 px-2 py-1 rounded">
                      {USDT_CHAIN_LABELS[order.makerUsdtChain].name.split('-')[1]}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-lg font-medium ${
                      activeTab === 'buy' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {activeTab === 'buy' ? t('Buy', '买入') : t('Sell', '卖出')} →
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 md:hidden z-40">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-1 px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5">{t('Home', '首页')}</span>
          </Link>
          <div className="flex flex-col items-center py-1 px-4 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs mt-0.5">{t('Trade', '交易')}</span>
          </div>
          <Link href="/profile" className="flex flex-col items-center py-1 px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-0.5">{t('Profile', '我的')}</span>
          </Link>
        </div>
      </nav>

      {/* Floating Action Button - Mobile */}
      {connected && (
        <button
          onClick={() => setShowCreateModal(true)}
          className={`fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-30 ${
            activeTab === 'buy' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30'
              : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'
          }`}
        >
          +
        </button>
      )}

      {/* Modals */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} />}
      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}
