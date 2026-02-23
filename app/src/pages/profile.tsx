import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2P } from '@/context/P2PContext';

export default function ProfilePage() {
  const { publicKey } = useWallet();
  const { myOrders } = useP2P();
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');

  const profile = {
    username: 'Trader001',
    reputation: 245,
    level: 3,
    totalTrades: 156,
    completedTrades: 152,
    completionRate: 97.4,
  };

  const getLevelInfo = (level: number) => {
    const levels = [
      { name: '新手', color: 'bg-green-600', icon: '🌱' },
      { name: '普通', color: 'bg-blue-600', icon: '🌿' },
      { name: '优秀', color: 'bg-purple-600', icon: '⭐' },
      { name: '卓越', color: 'bg-pink-600', icon: '💎' },
      { name: '大神', color: 'bg-yellow-600', icon: '👑' },
    ];
    return levels[level - 1] || levels[0];
  };

  const levelInfo = getLevelInfo(profile.level);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-3xl">
            {levelInfo.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <span className={`${levelInfo.color} px-2 py-1 rounded text-xs`}>
                Lv{profile.level} {levelInfo.name}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">信誉分</div>
            <div className="text-xl font-bold">{profile.reputation}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">总交易</div>
            <div className="text-xl font-bold">{profile.totalTrades}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">完成率</div>
            <div className="text-xl font-bold">{profile.completionRate}%</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">等级特权</div>
            <div className="text-xl font-bold">手续费 0.3%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2 px-4 ${
            activeTab === 'orders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-400'
          }`}
        >
          我的订单 ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-4 ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-400'
          }`}
        >
          交易历史
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'orders' ? (
          myOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无订单，去创建或接单吧！
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            order.type === 'buy' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          {order.type === 'buy' ? '买入' : '卖出'}
                        </span>
                        <span className="text-sm text-gray-400">
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div>
                          {order.amount} TPOT @ {order.price} SOL
                        </div>
                        <div className="text-sm text-gray-400">
                          支付方式: {order.paymentMethod}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            交易历史功能开发中...
          </div>
        )}
      </div>
    </div>
  );
}
