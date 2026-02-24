'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useP2PStore, PLATFORM_CONFIG, Order, USDT_CHAIN_LABELS, UsdtChain, STATUS_INFO } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import { formatDistanceToNow } from 'date-fns';

export default function TradePage() {
  const { publicKey, connected } = useWallet();
  const { orders, activeTab, setActiveTab, setCurrentUser, currentUser } = useP2PStore();
  const { language, setLanguage } = useLanguage();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<UsdtChain | ''>('');

  // 初始化用户
  useEffect(() => {
    if (publicKey && !currentUser) {
      setCurrentUser({
        publicKey: publicKey.toString(),
        nickname: publicKey.toString().slice(0, 8),
        paymentAddresses: [],
        canModifyPayment: true,
        totalTrades: 0,
        completionRate: 100,
        positiveRate: 100,
        createdAt: new Date(),
      });
    }
  }, [publicKey, currentUser, setCurrentUser]);

  // Mock 数据
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: '1',
        type: 'sell',
        status: 'escrow_confirmed',
        createdAt: new Date(Date.now() - 3600000),
        expiresAt: new Date(Date.now() + 82800000),
        seller: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        sellerNickname: 'Alice',
        sellerUsdtAddress: 'TRX7aN2XxXxXxXxXxXxXxXxXxXxXxXxXxX',
        sellerUsdtChain: 'trc20',
        tokenAmount: 10000,
        price: 0.5,
        usdtAmount: 5000,
        feeRate: 0.01,
        fee: 100,
        buyerReceives: 9900,
        minUsdt: 100,
        maxUsdt: 5000,
        paymentTimeout: 30,
      },
      {
        id: '2',
        type: 'sell',
        status: 'escrow_confirmed',
        createdAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() + 79200000),
        seller: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdavVLumpY2Mr',
        sellerNickname: 'Bob',
        sellerUsdtAddress: '0x1234567890abcdef',
        sellerUsdtChain: 'erc20',
        tokenAmount: 50000,
        price: 0.52,
        usdtAmount: 26000,
        feeRate: 0.01,
        fee: 500,
        buyerReceives: 49500,
        minUsdt: 1000,
        maxUsdt: 26000,
        paymentTimeout: 30,
      },
    ];
    useP2PStore.setState({ orders: mockOrders });
  }, []);

  // 筛选订单
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.type !== activeTab) return false;
      if (order.status !== 'escrow_confirmed') return false;
      if (selectedChain && order.sellerUsdtChain !== selectedChain) return false;
      return true;
    });
  }, [orders, activeTab, selectedChain]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b0b0b]/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-500">TPOT P2P</h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Switch */}
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm ${language === 'en' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1 text-sm ${language === 'zh' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                中
              </button>
            </div>
            
            {connected && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-sm text-gray-400 hover:text-white"
              >
                {language === 'en' ? 'Settings' : '设置'}
              </button>
            )}
            <WalletMultiButton className="!bg-blue-600 !rounded-lg !text-sm !py-2" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Warning */}
        {!connected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              ⚠️ {language === 'en' 
                ? 'Please connect your wallet to start trading'
                : '请先连接钱包开始交易'}
            </p>
          </div>
        )}

        {/* Tabs & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-2 rounded-lg font-medium ${
                activeTab === 'buy' ? 'bg-green-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {language === 'en' ? 'Buy TPOT' : '买入 TPOT'}
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-6 py-2 rounded-lg font-medium ${
                activeTab === 'sell' ? 'bg-red-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {language === 'en' ? 'Sell TPOT' : '卖出 TPOT'}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as UsdtChain | '')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{language === 'en' ? 'All Chains' : '全部链'}</option>
              {Object.entries(USDT_CHAIN_LABELS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            {connected && activeTab === 'sell' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                + {language === 'en' ? 'Sell TPOT' : '卖出 TPOT'}
              </button>
            )}
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-8 text-center">
              <p className="text-gray-400">
                {language === 'en' ? 'No orders available' : '暂无订单'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50 rounded-lg p-4 transition cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User */}
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold">
                      {order.sellerNickname[0]}
                    </div>
                    <div>
                      <div className="font-medium">{order.sellerNickname}</div>
                      <div className="text-xs text-gray-400">
                        156 {language === 'en' ? 'trades' : '交易'} • 98%
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-400">{language === 'en' ? 'Price' : '价格'}</div>
                      <div className="text-lg font-medium">{order.price} USDT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">{language === 'en' ? 'Available' : '可用'}</div>
                      <div className="text-lg font-medium">{order.tokenAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">{language === 'en' ? 'Limit' : '限额'}</div>
                      <div className="text-sm">{order.minUsdt} - {order.maxUsdt} USDT</div>
                    </div>
                  </div>

                  {/* Chain & Action */}
                  <div className="flex items-center space-x-4">
                    <span className="bg-gray-700 px-3 py-1 rounded text-sm">
                      {USDT_CHAIN_LABELS[order.sellerUsdtChain].icon} {USDT_CHAIN_LABELS[order.sellerUsdtChain].name}
                    </span>
                    <button className={`px-6 py-2 rounded-lg font-medium ${
                      activeTab === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}>
                      {activeTab === 'buy' 
                        ? (language === 'en' ? 'Buy' : '买入')
                        : (language === 'en' ? 'Sell' : '卖出')}
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
