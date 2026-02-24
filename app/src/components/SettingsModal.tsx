'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, UsdtChain } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  onClose: () => void;
}

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

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold">{t('Payment Settings', '收款设置')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('Set your USDT receiving addresses', '设置您的 USDT 收款地址')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Solana Address */}
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">◎</span>
              <span className="text-sm font-medium">{t('Solana Address (Auto)', 'Solana 地址（自动）')}</span>
            </div>
            <div className="font-mono text-sm break-all text-gray-300">
              {publicKey?.toString() || '-'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {t('You will receive TPOT here', '您将在这里收到 TPOT')}
            </div>
          </div>

          {/* Warning */}
          {!canModify && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <span>⚠️</span>
                <span className="font-medium">{t('Cannot Modify', '无法修改')}</span>
              </div>
              <p className="text-sm text-amber-200/60 mt-1">
                {t('You have active orders. Complete or cancel them first.', '您有进行中的订单，请先完成或取消。')}
              </p>
            </div>
          )}

          {/* USDT Addresses */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-300">{t('USDT Receiving Addresses', 'USDT 收款地址')}</div>
            
            {(Object.keys(USDT_CHAIN_LABELS) as UsdtChain[]).map((chain) => (
              <div key={chain}>
                <label className="block text-sm text-gray-400 mb-2">
                  {USDT_CHAIN_LABELS[chain].name}
                </label>
                <input
                  type="text"
                  value={addresses[chain]}
                  onChange={(e) => setAddresses({ ...addresses, [chain]: e.target.value })}
                  disabled={!canModify}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 transition"
                  placeholder={
                    chain === 'trc20' ? 'TRX...' :
                    chain === 'erc20' ? '0x...' :
                    chain === 'bep20' ? '0x...' :
                    'Solana address...'
                  }
                />
              </div>
            ))}
          </div>

          {/* Platform Info */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <span>📋</span>
              <span className="text-sm font-medium">{t('Platform Info', '平台信息')}</span>
            </div>
            <div className="text-xs text-gray-400">
              <div className="flex justify-between mb-1">
                <span>{t('Trading Fee', '交易手续费')}</span>
                <span>{PLATFORM_CONFIG.FEE_RATE * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Payment Timeout', '付款超时')}</span>
                <span>{PLATFORM_CONFIG.PAYMENT_TIMEOUT} {t('minutes', '分钟')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-medium transition"
          >
            {t('Cancel', '取消')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canModify}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 rounded-xl font-medium disabled:opacity-50 transition"
          >
            {saving ? t('Saving...', '保存中...') : t('Save', '保存')}
          </button>
        </div>
      </div>
    </div>
  );
};
