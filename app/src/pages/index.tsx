import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

export default function HomePage() {
  const { publicKey } = useWallet();

  const stats = [
    { label: '总交易量', value: '1,234,567 TPOT', change: '+12.5%' },
    { label: '活跃订单', value: '45', change: '+5' },
    { label: '用户数', value: '2,847', change: '+234' },
    { label: '平均价格', value: '0.0012 SOL', change: '+2.3%' },
  ];

  const features = [
    {
      icon: '🔒',
      title: '安全托管',
      description: '智能合约托管资金，交易安全有保障',
    },
    {
      icon: '⚡',
      title: '快速交易',
      description: '基于 Solana 高速网络，秒级确认',
    },
    {
      icon: '💰',
      title: '低手续费',
      description: '仅 0.5% 平台费，VIP用户更低',
    },
    {
      icon: '🌍',
      title: '全球交易',
      description: '支持多种支付方式，24/7 交易',
    },
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
        <div className="flex justify-center space-x-4">
          <Link
            href="/trade"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium"
          >
            开始交易
          </Link>
          <Link
            href="/guide"
            className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg font-medium"
          >
            使用指南
          </Link>
        </div>
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

      {/* Features Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">为什么选择 TPOT P2P?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold mb-6">交易流程</h2>
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {[
            { step: 1, title: '创建订单', desc: '选择买入或卖出' },
            { step: 2, title: '匹配交易', desc: '等待对手方' },
            { step: 3, title: '付款确认', desc: '线下转账并确认' },
            { step: 4, title: '释放代币', desc: '托管资金释放' },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                {item.step}
              </div>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-400">{item.desc}</div>
              </div>
              {index < 3 && (
                <div className="hidden md:block text-gray-600 mx-4">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">准备好开始交易了吗?</h2>
        <p className="text-gray-300 mb-6">
          连接钱包，立即体验去中心化 P2P 交易
        </p>
        {publicKey ? (
          <Link
            href="/trade"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium inline-block"
          >
            前往交易
          </Link>
        ) : (
          <div className="text-gray-400">
            请先连接钱包
          </div>
        )}
      </section>
    </div>
  );
}
