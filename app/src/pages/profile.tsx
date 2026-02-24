'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useP2PStore, USDT_CHAIN_LABELS, STATUS_INFO } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { shortenAddress, formatNumber, getTimeAgo } from '@/lib/theme';

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const { currentUser, myOrders } = useP2PStore();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  const profile = {
    level: 3,
    totalTrades: 156,
    completionRate: 97.4,
    reputation: 245,
  };

  const getLevelInfo = (level: number) => {
    const levels = [
      { name: t('Beginner', '新手'), color: 'from-green-500 to-emerald-600', icon: '🌱' },
      { name: t('Regular', '普通'), color: 'from-blue-500 to-cyan-600', icon: '🌿' },
      { name: t('Excellent', '优秀'), color: 'from-purple-500 to-violet-600', icon: '⭐' },
      { name: t('Master', '卓越'), color: 'from-pink-500 to-rose-600', icon: '💎' },
      { name: t('Legend', '大神'), color: 'from-yellow-500 to-orange-600', icon: '👑' },
    ];
    return levels[level - 1] || levels[0];
  };

  const levelInfo = getLevelInfo(profile.level);
  const activeOrders = myOrders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const historyOrders = myOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20 md:pb-0">
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
            <div className="sm:hidden">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-xs !py-1.5 !px-3" />
            </div>
            <div className="hidden sm:block">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl !text-sm !py-2 !px-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 md:max-w-4xl md:mx-auto">
        {!connected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl mb-4">
              👤
            </div>
            <h2 className="text-xl font-bold mb-2">{t('Connect Wallet', '连接钱包')}</h2>
            <p className="text-gray-400 text-sm mb-6">{t('Connect your wallet to view your profile', '连接钱包查看您的个人资料')}</p>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-xl" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 md:p-6 border border-blue-500/20 mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${levelInfo.color} flex items-center justify-center text-3xl shadow-lg`}>
                  {levelInfo.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h1 className="font-bold text-lg">{currentUser?.nickname || t('Trader', '交易者')}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${levelInfo.color}`}>
                      Lv{profile.level} {levelInfo.name}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm font-mono mt-1">
                    {publicKey && shortenAddress(publicKey.toString(), 8)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold">{profile.reputation}</div>
                  <div className="text-xs text-gray-500">{t('Rep', '信誉')}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold">{profile.totalTrades}</div>
                  <div className="text-xs text-gray-500">{t('Trades', '交易')}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{profile.completionRate}%</div>
                  <div className="text-xs text-gray-500">{t('Rate', '完成率')}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">0.3%</div>
                  <div className="text-xs text-gray-500">{t('Fee', '费率')}</div>
                </div>
              </div>
            </div>

            <div className="flex bg-white/5 rounded-xl p-1 mb-4">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${
                  activeTab === 'active' ? 'bg-blue-500 text-white' : 'text-gray-400'
                }`}
              >
                {t('Active Orders', '进行中')} ({activeOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${
                  activeTab === 'history' ? 'bg-blue-500 text-white' : 'text-gray-400'
                }`}
              >
                {t('History', '历史')} ({historyOrders.length})
              </button>
            </div>

            <div className="space-y-2">
              {(activeTab === 'active' ? activeOrders : historyOrders).length === 0 ? (
                <div className="bg-white/5 rounded-xl p-8 text-center border border-white/5">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'active' 
                      ? t('No active orders', '暂无进行中的订单')
                      : t('No order history', '暂无历史订单')}
                  </p>
                  <Link href="/trade" className="inline-block mt-4 px-4 py-2 bg-blue-500 rounded-lg text-sm font-medium">
                    {t('Go Trade', '去交易')} →
                  </Link>
                </div>
              ) : (
                (activeTab === 'active' ? activeOrders : historyOrders).map((order) => (
                  <div key={order.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {order.type === 'buy' ? t('Buy', '买') : t('Sell', '卖')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.status === 'matched' ? 'bg-purple-500/20 text-purple-400' :
                          order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {language === 'en' ? STATUS_INFO[order.status].label : STATUS_INFO[order.status].labelZh}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{getTimeAgo(new Date(order.createdAt))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{formatNumber(order.tokenAmount, 0)} TPOT</div>
                        <div className="text-xs text-gray-500">@ ${order.price} · {USDT_CHAIN_LABELS[order.makerUsdtChain].name.split('-')[1]}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-400">{formatNumber(order.usdtAmount)} USDT</div>
                        <div className="text-xs text-gray-500">{t('Total', '总计')}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium text-gray-300 mb-3">{t('Quick Actions', '快捷操作')}</div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/trade" className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t('Trade', '交易')}</div>
                    <div className="text-xs text-gray-500">{t('Buy or Sell TPOT', '买卖 TPOT')}</div>
                  </div>
                </Link>
                <Link href="/trade" className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t('Post Order', '发布订单')}</div>
                    <div className="text-xs text-gray-500">{t('Create buy/sell order', '创建买卖单')}</div>
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 md:hidden z-40">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-1 px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-0.5">{t('Home', '首页')}</span>
          </Link>
          <Link href="/trade" className="flex flex-col items-center py-1 px-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs mt-0.5">{t('Trade', '交易')}</span>
          </Link>
          <div className="flex flex-col items-center py-1 px-4 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-0.5">{t('Profile', '我的')}</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
