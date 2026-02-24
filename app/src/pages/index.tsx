'use client';

import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { language, setLanguage } = useLanguage();

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  const features = [
    {
      icon: '🔒',
      title: t('Escrow Protection', '托管保护'),
      desc: t('Funds locked until payment confirmed', '资金锁定直到付款确认'),
    },
    {
      icon: '⚡',
      title: t('Fast Settlement', '快速结算'),
      desc: t('Automatic release on payment', '付款后自动释放'),
    },
    {
      icon: '🌐',
      title: t('Multi-Chain', '多链支持'),
      desc: t('TRC20, ERC20, BEP20, SPL', 'TRC20, ERC20, BEP20, SPL'),
    },
    {
      icon: '💬',
      title: t('Direct Chat', '直接沟通'),
      desc: t('Real-time communication', '实时聊天沟通'),
    },
  ];

  const steps = [
    { step: '1', title: t('Connect', '连接'), desc: t('Solana wallet', 'Solana 钱包') },
    { step: '2', title: t('Browse', '浏览'), desc: t('Find orders', '查找订单') },
    { step: '3', title: t('Trade', '交易'), desc: t('Escrow protected', '托管保护') },
    { step: '4', title: t('Complete', '完成'), desc: t('Auto release', '自动释放') },
  ];

  const stats = [
    { value: '$0.50', label: t('Price', '价格') },
    { value: '125K+', label: t('24h Vol', '24h量') },
    { value: '1%', label: t('Fee', '费率') },
    { value: '10K+', label: t('Users', '用户') },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3 max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
              T
            </div>
            <span className="font-bold text-lg">TPOT P2P</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-sm rounded-md transition ${language === 'en' ? 'bg-white/10' : 'hover:bg-white/5'}`}>EN</button>
              <button onClick={() => setLanguage('zh')} className={`px-3 py-1.5 text-sm rounded-md transition ${language === 'zh' ? 'bg-white/10' : 'hover:bg-white/5'}`}>中</button>
            </div>
            <div className="sm:hidden">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-xs !py-1.5 !px-3" />
            </div>
            <div className="hidden sm:block">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-sm !py-2 !px-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 md:py-16 pb-24 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-3 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-gray-400">{t('Decentralized P2P Trading', '去中心化 P2P 交易')}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                TPOT P2P
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-6 max-w-xl mx-auto">
              {t(
                'Trade TPOT peer-to-peer with USDT. Secure escrow, fast settlements.',
                '点对点交易 TPOT。安全托管，快速结算。'
              )}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => router.push('/trade')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 px-6 py-3 rounded-xl font-medium transition active:scale-[0.98]"
              >
                {t('Start Trading', '开始交易')} →
              </button>
              <a
                href="https://github.com/tykhepot/tpot-p2p"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-medium transition"
              >
                {t('GitHub', 'GitHub')}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:gap-4 mb-10 md:mb-16">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5 text-center">
                <div className="text-base md:text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-10 md:mb-16">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-6">{t('Features', '功能特点')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {features.map((feature, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 md:p-5 border border-white/5 hover:border-white/10 transition">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10 md:mb-16">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-6">{t('How It Works', '如何交易')}</h2>
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {steps.map((item, i) => (
                <div key={i} className="relative">
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-3 md:p-4 border border-blue-500/20 text-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center font-bold mx-auto mb-2">
                      {item.step}
                    </div>
                    <h3 className="font-medium text-xs md:text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 hidden md:block">{item.desc}</p>
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

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 md:p-8 text-center border border-blue-500/20">
            <h2 className="text-xl md:text-2xl font-bold mb-3">{t('Ready to Trade?', '准备好交易了吗?')}</h2>
            <p className="text-gray-400 text-sm mb-4">
              {t('Join thousands trading TPOT securely.', '加入数千名用户安全交易 TPOT。')}
            </p>
            <button
              onClick={() => router.push('/trade')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 px-6 py-3 rounded-xl font-medium transition active:scale-[0.98]"
            >
              {t('Start Trading', '开始交易')} →
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 p-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs">
              T
            </div>
            <span className="font-medium text-sm">TPOT P2P</span>
          </div>
          <div className="text-gray-500 text-xs">
            © 2024 TykhePot
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="hover:text-white transition">
              {language === 'en' ? '中文' : 'EN'}
            </button>
            <span>·</span>
            <a href="https://github.com/tykhepot/tpot-p2p" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 md:hidden z-40">
        <div className="flex items-center justify-around py-2">
          <div className="flex flex-col items-center py-1 px-4 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5">{t('Home', '首页')}</span>
          </div>
          <Link href="/trade" className="flex flex-col items-center py-1 px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs mt-0.5">{t('Trade', '交易')}</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center py-1 px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-0.5">{t('Profile', '我的')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
