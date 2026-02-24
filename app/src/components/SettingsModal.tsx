'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, UsdtChain } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { shortenAddress } from '@/lib/theme';

interface Props {
  onClose: () => void;
}

const CHAIN_ICONS: Record<UsdtChain, string> = {
  trc20: '🔶',
  erc20: '💠',
  bep20: '🟡',
  sol: '◎',
};

export const SettingsModal = ({ onClose }: Props) => {
  const { publicKey } = useWallet();
  const { currentUser, setPaymentAddress, myOrders } = useP2PStore();
  const { language } = useLanguage();
  
  const [addresses, setAddresses] = useState<Record<UsdtChain, string>>({
    trc20: '',
    erc20: '',
    bep20: '',
    sol: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeChain, setActiveChain] = useState<UsdtChain | null>(null);

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (currentUser) {
      const newAddresses: Record<UsdtChain, string> = {
        trc20: '',
        erc20: '',
        bep20: '',
        sol: '',
      };
      currentUser.paymentAddresses.forEach(a => {
        newAddresses[a.chain] = a.address;
      });
      setAddresses(newAddresses);
    }
  }, [currentUser]);

  const canModify = myOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length === 0;
  const hasChanges = currentUser?.paymentAddresses.some(a => a.address !== addresses[a.chain]) ?? false;

  const handleSave = async () => {
    if (!canModify) return;
    
    setSaving(true);
    try {
      Object.entries(addresses).forEach(([chain, address]) => {
        if (address) {
          setPaymentAddress(chain as UsdtChain, address);
        }
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#12121a] w-full md:max-w-lg md:rounded-2xl rounded-t-3xl border-t md:border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold">{t('Payment Settings', '收款设置')}</h2>
              <p className="text-xs text-gray-500">{t('Manage your receiving addresses', '管理您的收款地址')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-lg">
                  ◎
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t('Solana Wallet', 'Solana 钱包')}</div>
                  <div className="font-mono text-xs text-gray-400 truncate">
                    {publicKey ? shortenAddress(publicKey.toString(), 8) : '-'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  <div>{t('TPOT', 'TPOT')}</div>
                  <div className="text-green-400">{t('Auto', '自动')}</div>
                </div>
              </div>
            </div>

            {!canModify && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="text-amber-400 text-sm font-medium">{t('Cannot Modify', '无法修改')}</p>
                    <p className="text-amber-400/60 text-xs mt-0.5">
                      {t('Complete or cancel active orders first', '请先完成或取消进行中的订单')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{t('USDT Addresses', 'USDT 收款地址')}</span>
                <span className="text-xs text-gray-500">{t('Required for trading', '交易需要')}</span>
              </div>
              
              <div className="space-y-2">
                {(Object.keys(USDT_CHAIN_LABELS) as UsdtChain[]).map((chain) => (
                  <div 
                    key={chain} 
                    className={`bg-white/5 rounded-xl p-3 transition-colors ${activeChain === chain ? 'bg-white/10' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-base">
                        {CHAIN_ICONS[chain]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400">{USDT_CHAIN_LABELS[chain].name}</div>
                        <input
                          type="text"
                          value={addresses[chain]}
                          onChange={(e) => setAddresses({ ...addresses, [chain]: e.target.value })}
                          onFocus={() => setActiveChain(chain)}
                          onBlur={() => setActiveChain(null)}
                          disabled={!canModify}
                          className="w-full bg-transparent font-mono text-sm focus:outline-none disabled:opacity-50 mt-0.5"
                          placeholder={
                            chain === 'trc20' ? 'TRX...' :
                            chain === 'erc20' ? '0x...' :
                            chain === 'bep20' ? '0x...' :
                            'Solana...'
                          }
                        />
                      </div>
                      {addresses[chain] && (
                        <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-blue-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <span>📋</span>
                <span className="text-xs font-medium text-gray-300">{t('Platform Info', '平台信息')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-gray-500">{t('Trading Fee', '手续费')}</div>
                  <div className="font-medium">{PLATFORM_CONFIG.FEE_RATE * 100}%</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-gray-500">{t('Timeout', '超时')}</div>
                  <div className="font-medium">{PLATFORM_CONFIG.PAYMENT_TIMEOUT}m</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#12121a]">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-medium transition text-sm"
            >
              {t('Cancel', '取消')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !canModify}
              className={`flex-1 py-3 rounded-xl font-medium transition-all text-sm ${
                hasChanges && canModify
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]'
                  : 'bg-white/10 text-gray-400'
              } disabled:opacity-50`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('Saving...', '保存中...')}
                </span>
              ) : (
                t('Save', '保存')
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
