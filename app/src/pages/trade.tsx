'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useP2PStore, Order, USDT_CHAIN_LABELS, UsdtChain } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { SettingsModal } from '@/components/SettingsModal';

export default function TradePage() {
  const { publicKey, connected } = useWallet();
  const { orders, activeTab, setActiveTab, setCurrentUser, currentUser } = useP2PStore();
  const { language, setLanguage } = useLanguage();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<UsdtChain | ''>('');

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
      {
        id: '1',
        type: 'sell',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000),
        expiresAt: new Date(Date.now() + 82800000),
        maker: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        makerNickname: 'Alice',
        makerUsdtAddress: 'TRX7aN2XxXxXxXxXxXxXxXxXxXxXxXxXxX',
        makerUsdtChain: 'trc20',
        tokenAmount: 10000,
        price: 0.5,
        usdtAmount: 5000,
        feeRate: 0.01,
        fee: 100,
        minUsdt: 100,
        maxUsdt: 5000,
      },
      {
        id: '2',
        type: 'sell',
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() + 79200000),
        maker: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdavVLumpY2Mr',
        makerNickname: 'Bob',
        makerUsdtAddress: '0x1234567890abcdef',
        makerUsdtChain: 'erc20',
        tokenAmount: 50000,
        price: 0.52,
        usdtAmount: 26000,
        feeRate: 0.01,
        fee: 500,
        minUsdt: 1000,
        maxUsdt: 26000,
      },
      {
        id: '3',
        type: 'buy',
        status: 'pending',
        createdAt: new Date(Date.now() - 1800000),
        expiresAt: new Date(Date.now() + 84600000),
        maker: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694eD',
        makerNickname: 'Charlie',
        makerUsdtAddress: 'TRC20BuyerAddress123',
        makerUsdtChain: 'trc20',
        tokenAmount: 20000,
        price: 0.48,
        usdtAmount: 9600,
        feeRate: 0.01,
        fee: 200,
        minUsdt: 500,
        maxUsdt: 9600,
      },
      {
        id: '4',
        type: 'buy',
        status: 'pending',
        createdAt: new Date(Date.now() - 5400000),
        expiresAt: new Date(Date.now() + 81000000),
        maker: '2ZjxXA3mBNxs33xQXt8rHHpDvhWXGPs5xjWhLfP5nQxL',
        makerNickname: 'Diana',
        makerUsdtAddress: '0xBuyerERC20Address',
        makerUsdtChain: 'erc20',
        tokenAmount: 30000,
        price: 0.49,
        usdtAmount: 14700,
        feeRate: 0.01,
        fee: 300,
        minUsdt: 1000,
        maxUsdt: 14700,
      },
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
              T
            </div>
            <div>
              <h1 className="text-lg font-bold">TPOT P2P</h1>
              <p className="text-xs text-gray-500">Peer-to-Peer Trading</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-sm rounded-md transition ${language === 'en' ? 'bg-white/10' : 'hover:bg-white/5'}`}>EN</button>
              <button onClick={() => setLanguage('zh')} className={`px-3 py-1.5 text-sm rounded-md transition ${language === 'zh' ? 'bg-white/10' : 'hover:bg-white/5'}`}>中</button>
            </div>
            
            {connected && (
              <button onClick={() => setShowSettingsModal(true)} className="p-2 hover:bg-white/5 rounded-lg transition">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-sm !py-2 !px-4 !font-medium" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Warning Banner */}
        {!connected && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="font-medium text-amber-200">{t('Connect Wallet to Trade', '连接钱包开始交易')}</p>
                <p className="text-sm text-amber-200/60">{t('Connect your Solana wallet to buy or sell TPOT', '连接您的 Solana 钱包以买卖 TPOT')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-sm text-gray-400 mb-1">{t('Best Buy Price', '最高买价')}</div>
            <div className="text-2xl font-bold text-green-400">0.52 USDT</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-sm text-gray-400 mb-1">{t('Best Sell Price', '最低卖价')}</div>
            <div className="text-2xl font-bold text-red-400">0.48 USDT</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-sm text-gray-400 mb-1">{t('24h Volume', '24小时交易量')}</div>
            <div className="text-2xl font-bold">125,000 TPOT</div>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex bg-white/5 rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                activeTab === 'buy' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <span className="text-lg">📈</span>
              <span>{t('Buy Market', '买入市场')}</span>
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                activeTab === 'sell' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <span className="text-lg">📉</span>
              <span>{t('Sell Market', '卖出市场')}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as UsdtChain | '')}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">{t('All Chains', '全部链')}</option>
              {Object.entries(USDT_CHAIN_LABELS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            {connected && (
              <button
                onClick={() => setShowCreateModal(true)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition shadow-lg ${
                  activeTab === 'buy' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/25'
                }`}
              >
                <span>+</span>
                <span>{activeTab === 'buy' ? t('Post Buy Order', '发布买单') : t('Post Sell Order', '发布卖单')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
          <div className="flex items-start space-x-3">
            <span className="text-xl">💡</span>
            <div className="text-sm text-gray-400">
              {activeTab === 'buy' 
                ? t('These are sell orders from sellers. Pick one to buy TPOT with USDT.', '这些是卖家的卖单，选择一个用 USDT 购买 TPOT。')
                : t('These are buy orders from buyers. Pick one to sell your TPOT for USDT.', '这些是买家的买单，选择一个卖出您的 TPOT 获得 USDT。')}
            </div>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/5">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-400 mb-2">{t('No orders available', '暂无订单')}</p>
              {connected && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {t('Be the first to post an order', '成为第一个发布订单的人')}
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                      {order.makerNickname[0]}
                    </div>
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        <span>{order.makerNickname}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.type === 'sell' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {order.type === 'sell' ? t('Seller', '卖家') : t('Buyer', '买家')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        156 {t('trades', '交易')} · 98% {t('completion', '完成率')}
                      </div>
                    </div>
                  </div>

                  {/* Price & Amount */}
                  <div className="flex-1 grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('Price', '价格')}</div>
                      <div className="text-xl font-bold">{order.price} <span className="text-sm text-gray-400">USDT</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('Amount', '数量')}</div>
                      <div className="text-xl font-bold">{order.tokenAmount.toLocaleString()} <span className="text-sm text-gray-400">TPOT</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{t('Limit', '限额')}</div>
                      <div className="text-lg font-medium text-gray-300">{order.minUsdt} - {order.maxUsdt} <span className="text-sm text-gray-400">USDT</span></div>
                    </div>
                  </div>

                  {/* Chain & Action */}
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/5 rounded-xl px-4 py-2 text-sm">
                      {USDT_CHAIN_LABELS[order.makerUsdtChain].name}
                    </div>
                    <button className={`px-6 py-2.5 rounded-xl font-medium transition ${
                      activeTab === 'buy' 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}>
                      {activeTab === 'buy' ? t('Buy', '买入') : t('Sell', '卖出')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} />}
      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}
