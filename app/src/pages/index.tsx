'use client';

import React from 'react';
import { useWallet } from '@/components/WalletProvider';

export default function HomePage() {
  const { connected, publicKey } = useWallet();

  const stats = [
    { label: '总交易量', value: '1,234,567 TPOT', change: '+12.5%' },
    { label: '活跃订单', value: '45', change: '+5' },
    { label: '用户数', value: '2,847', change: '+234' },
    { label: '平均价格', value: '0.0012 SOL', change: '+2.3%' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          🎰 TPOT P2P 交易平台
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          安全、快速、低成本的 TPOT 代币交易
        </p>
        {connected ? (
          <div className="bg-green-900/30 p-4 rounded-lg">
            <p className="text-green-400">✅ 已连接钱包</p>
            <p className="text-sm text-gray-400 mt-2">
              地址: {publicKey?.slice(0, 20)}...
            </p>
          </div>
        ) : (
          <p className="text-gray-400">请先连接钱包开始交易</p>
        )}
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-lg">
            <div className="text-sm text-gray-400">{stat.label}</div>
            <div className="text-2xl font-bold mt-1">{stat.value}</div>
            <div className="text-sm text-green-400 mt-1">{stat.change}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">🔒 安全托管</h3>
          <p className="text-gray-400">智能合约托管资金，交易安全有保障</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">⚡ 快速交易</h3>
          <p className="text-gray-400">基于 Solana 高速网络，秒级确认</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">💰 低手续费</h3>
          <p className="text-gray-400">仅 0.5% 平台费，VIP用户更低</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">🌍 全球交易</h3>
          <p className="text-gray-400">支持多种支付方式，24/7 交易</p>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">🚧 P2P 交易功能开发中</h2>
        <p className="text-gray-300">
          智能合约已部署到 Localnet，Devnet 部署即将完成
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Program ID: 7ER1mftqvLzhZYQUPgjWoqqDiTYvrELiU8Qorh52b8Z6
        </p>
      </section>
    </div>
  );
}
