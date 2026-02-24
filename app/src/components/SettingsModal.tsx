'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, UsdtChain } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  onClose: () => void;
}

export const SettingsModal: FC<Props> = ({ onClose }) => {
  const { publicKey } = useWallet();
  const { currentUser, setPaymentAddress, canModifyPaymentAddress } = useP2PStore();
  const { t, language } = useLanguage();
  
  const [trc20Address, setTrc20Address] = useState('');
  const [erc20Address, setErc20Address] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const trc20 = currentUser.paymentAddresses.find(a => a.chain === 'trc20');
      const erc20 = currentUser.paymentAddresses.find(a => a.chain === 'erc20');
      setTrc20Address(trc20?.address || '');
      setErc20Address(erc20?.address || '');
    }
  }, [currentUser]);

  const canModify = canModifyPaymentAddress();

  const handleSave = async () => {
    if (!canModify) return;
    
    setSaving(true);
    try {
      if (trc20Address) {
        setPaymentAddress('trc20', trc20Address);
      }
      if (erc20Address) {
        setPaymentAddress('erc20', erc20Address);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">
            {language === 'en' ? 'Payment Settings' : '收款设置'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Solana Address (Auto) */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">
              {language === 'en' ? 'Your Solana Address (Auto)' : '您的 Solana 地址（自动）'}
            </div>
            <div className="font-mono text-sm break-all">
              {publicKey?.toString() || '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {language === 'en' ? 'You will receive TPOT here' : '您将在这里收到 TPOT'}
            </div>
          </div>

          {/* Can Modify Warning */}
          {!canModify && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ {language === 'en' 
                  ? 'You have active orders. Cannot modify payment addresses.'
                  : '您有进行中的订单，无法修改收款地址。'}
              </p>
            </div>
          )}

          {/* TRC20 Address */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {USDT_CHAIN_LABELS.trc20.icon} {USDT_CHAIN_LABELS.trc20.name}
            </label>
            <input
              type="text"
              value={trc20Address}
              onChange={(e) => setTrc20Address(e.target.value)}
              disabled={!canModify}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono disabled:opacity-50"
              placeholder="TRX..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {language === 'en' 
                ? 'Buyers will send USDT to this address'
                : '买家将向此地址发送 USDT'}
            </div>
          </div>

          {/* ERC20 Address */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {USDT_CHAIN_LABELS.erc20.icon} {USDT_CHAIN_LABELS.erc20.name}
            </label>
            <input
              type="text"
              value={erc20Address}
              onChange={(e) => setErc20Address(e.target.value)}
              disabled={!canModify}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono disabled:opacity-50"
              placeholder="0x..."
            />
          </div>

          {/* Platform Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-sm text-blue-400 mb-2">
              {language === 'en' ? 'Platform Escrow Address' : '平台托管地址'}
            </div>
            <div className="font-mono text-xs break-all">
              {PLATFORM_CONFIG.ESCROW_ACCOUNT}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {language === 'en' 
                ? `Fee: ${PLATFORM_CONFIG.FEE_RATE * 100}% (deducted from TPOT)`
                : `手续费：${PLATFORM_CONFIG.FEE_RATE * 100}%（从 TPOT 扣除）`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-medium"
          >
            {language === 'en' ? 'Cancel' : '取消'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canModify}
            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {saving 
              ? (language === 'en' ? 'Saving...' : '保存中...')
              : (language === 'en' ? 'Save' : '保存')}
          </button>
        </div>
      </div>
    </div>
  );
};
