'use client';

import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b0b] to-[#1a1a1a] text-white">
      <header className="p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-500">{t('title')}</h1>
          <div className="flex items-center space-x-3">
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
            <WalletMultiButton className="!bg-blue-600 !rounded-lg !text-sm" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">
            TPOT P2P Trading
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            {language === 'en' 
              ? 'Secure, fast peer-to-peer trading with USDT'
              : '安全、快速的USDT点对点交易'}
          </p>

          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => router.push('/trade')}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-medium text-lg"
            >
              {language === 'en' ? 'Start Trading' : '开始交易'}
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800/50 p-6 rounded-lg text-left">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-medium mb-2">
                {language === 'en' ? 'Escrow Protection' : '托管保护'}
              </h3>
              <p className="text-sm text-gray-400">
                {language === 'en' 
                  ? 'TPOT locked in smart contract until payment confirmed'
                  : 'TPOT锁定在智能合约中，直到付款确认'}
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg text-left">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-medium mb-2">
                {language === 'en' ? 'On-chain Monitoring' : '链上监控'}
              </h3>
              <p className="text-sm text-gray-400">
                {language === 'en'
                  ? 'Automatic release when USDT payment detected'
                  : '检测到USDT付款后自动释放'}
              </p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg text-left">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-medium mb-2">
                {language === 'en' ? 'Real-time Chat' : '实时聊天'}
              </h3>
              <p className="text-sm text-gray-400">
                {language === 'en'
                  ? 'Communicate directly with buyer/seller'
                  : '直接与买家/卖家沟通'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 p-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2024 TykhePot. All rights reserved.</p>
          <p className="mt-2">
            {language === 'en' ? 'Contract' : '合约'}: 7ER1mftqvLzhZYQUPgjWoqqDiTYvrELiU8Qorh52b8Z6
          </p>
        </div>
      </footer>
    </div>
  );
}
