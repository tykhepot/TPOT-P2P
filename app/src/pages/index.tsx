'use client';

import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { language, setLanguage } = useLanguage();

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
              T
            </div>
            <span className="text-xl font-bold">TPOT P2P</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-sm rounded-md transition ${language === 'en' ? 'bg-white/10' : 'hover:bg-white/5'}`}>EN</button>
              <button onClick={() => setLanguage('zh')} className={`px-3 py-1.5 text-sm rounded-md transition ${language === 'zh' ? 'bg-white/10' : 'hover:bg-white/5'}`}>中</button>
            </div>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-sm !py-2 !px-4" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm text-gray-400">{t('Decentralized P2P Trading', '去中心化 P2P 交易')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              TPOT P2P
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-gray-300">{t('Trading Platform', '交易平台')}</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {t(
              'Trade TPOT tokens peer-to-peer with USDT. Secure escrow protection, fast settlements, and multiple payment options.',
              '点对点交易 TPOT 代币。安全的托管保护、快速结算、多种支付方式。'
            )}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => router.push('/trade')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-xl font-medium text-lg shadow-lg shadow-blue-500/25 transition"
            >
              {t('Start Trading', '开始交易')} →
            </button>
            <a
              href="https://github.com/tykhepot/tpot-p2p"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl font-medium text-lg transition"
            >
              {t('View on GitHub', '查看 GitHub')}
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { value: '$0.50', label: t('Current Price', '当前价格') },
            { value: '125K+', label: t('24h Volume', '24小时交易量') },
            { value: '1%', label: t('Trading Fee', '交易手续费') },
            { value: '10K+', label: t('Active Users', '活跃用户') },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/5 text-center">
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t('Why Choose TPOT P2P?', '为什么选择 TPOT P2P?')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🔒',
                title: t('Escrow Protection', '托管保护'),
                desc: t('Funds are locked in smart contract until payment is confirmed', '资金锁定在智能合约中，直到付款确认'),
              },
              {
                icon: '⚡',
                title: t('Fast Settlement', '快速结算'),
                desc: t('On-chain monitoring for automatic release when USDT payment detected', '链上监控，检测到 USDT 付款后自动释放'),
              },
              {
                icon: '💬',
                title: t('Direct Communication', '直接沟通'),
                desc: t('Real-time chat between buyers and sellers', '买卖双方实时聊天'),
              },
              {
                icon: '🌐',
                title: t('Multiple Chains', '多链支持'),
                desc: t('Support TRC20, ERC20, BEP20 and SPL USDT', '支持 TRC20、ERC20、BEP20 和 SPL USDT'),
              },
              {
                icon: '📊',
                title: t('Market Orders', '市场订单'),
                desc: t('Post buy or sell orders at your preferred price', '以您期望的价格发布买单或卖单'),
              },
              {
                icon: '🛡️',
                title: t('Reputation System', '信誉系统'),
                desc: t('Trade with confidence based on user history', '基于用户历史放心交易'),
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t('How It Works', '如何交易')}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1', title: t('Connect Wallet', '连接钱包'), desc: t('Connect your Solana wallet', '连接您的 Solana 钱包') },
              { step: '2', title: t('Browse Orders', '浏览订单'), desc: t('Find buy or sell orders', '查找买单或卖单') },
              { step: '3', title: t('Trade Securely', '安全交易'), desc: t('Funds held in escrow', '资金托管保护') },
              { step: '4', title: t('Complete Trade', '完成交易'), desc: t('Automatic release on payment', '付款后自动释放') },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-600">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-8 md:p-12 text-center border border-blue-500/20">
          <h2 className="text-3xl font-bold mb-4">{t('Ready to Trade?', '准备好交易了吗?')}</h2>
          <p className="text-gray-400 mb-6">
            {t('Join thousands of users trading TPOT securely on our P2P platform.', '加入数千名用户在我们的 P2P 平台上安全交易 TPOT。')}
          </p>
          <button
            onClick={() => router.push('/trade')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-xl font-medium text-lg shadow-lg shadow-blue-500/25 transition"
          >
            {t('Start Trading Now', '立即开始交易')} →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 p-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              T
            </div>
            <span className="font-medium">TPOT P2P</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2024 TykhePot. {t('All rights reserved.', '保留所有权利。')}
          </div>
          <div className="text-gray-500 text-sm">
            {t('Contract', '合约')}: 7ER1mftqvLzhZYQUPgjWoqqDiTYvrELiU8Qorh52b8Z6
          </div>
        </div>
      </footer>
    </div>
  );
}
