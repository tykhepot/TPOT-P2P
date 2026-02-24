'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, UsdtChain, Order } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  onClose: () => void;
}

export const CreateOrderModal: FC<Props> = ({ onClose }) => {
  const { publicKey } = useWallet();
  const { currentUser, addOrder } = useP2PStore();
  const { language } = useLanguage();

  const [step, setStep] = useState(1); // 1: 填写信息, 2: 托管转账, 3: 确认
  const [tokenAmount, setTokenAmount] = useState('');
  const [price, setPrice] = useState('0.5');
  const [usdtChain, setUsdtChain] = useState<UsdtChain>('trc20');
  const [minUsdt, setMinUsdt] = useState('100');
  const [maxUsdt, setMaxUsdt] = useState('');
  const [escrowTxHash, setEscrowTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  const usdtAmount = tokenAmount && price 
    ? parseFloat(tokenAmount) * parseFloat(price)
    : 0;

  const fee = tokenAmount 
    ? parseFloat(tokenAmount) * PLATFORM_CONFIG.FEE_RATE
    : 0;

  const buyerReceives = tokenAmount 
    ? parseFloat(tokenAmount) - fee
    : 0;

  const sellerUsdtAddress = currentUser?.paymentAddresses.find(a => a.chain === usdtChain)?.address;

  const handleCreate = () => {
    if (!publicKey || !tokenAmount || !price || !sellerUsdtAddress) return;
    setStep(2);
  };

  const handleConfirmEscrow = async () => {
    if (!escrowTxHash) return;
    
    setLoading(true);
    try {
      // TODO: 验证链上交易
      
      const newOrder: Order = {
        id: Date.now().toString(),
        type: 'sell',
        status: 'pending_escrow',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        
        seller: publicKey!.toString(),
        sellerNickname: 'You',
        sellerUsdtAddress: sellerUsdtAddress || '',
        sellerUsdtChain: usdtChain,
        
        tokenAmount: parseFloat(tokenAmount),
        price: parseFloat(price),
        usdtAmount,
        
        feeRate: PLATFORM_CONFIG.FEE_RATE,
        fee,
        buyerReceives,
        
        escrowTxHash,
        
        minUsdt: parseFloat(minUsdt) || 100,
        maxUsdt: parseFloat(maxUsdt) || usdtAmount,
        
        paymentTimeout: PLATFORM_CONFIG.PAYMENT_TIMEOUT,
      };
      
      addOrder(newOrder);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">
            {language === 'en' ? 'Sell TPOT' : '卖出 TPOT'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Step 1: Fill Info */}
        {step === 1 && (
          <div className="p-4 space-y-4">
            {/* Check if seller has USDT address */}
            {!sellerUsdtAddress && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  ⚠️ {language === 'en' 
                    ? 'Please set your USDT receiving address first in Settings'
                    : '请先在设置中填写您的 USDT 收款地址'}
                </p>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'en' ? 'Amount (TPOT)' : '数量 (TPOT)'}
              </label>
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                placeholder="10000"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'en' ? 'Price (USDT/TPOT)' : '单价 (USDT/TPOT)'}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                step="0.01"
              />
            </div>

            {/* Chain */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'en' ? 'USDT Chain' : 'USDT 链'}
              </label>
              <div className="flex space-x-2">
                {Object.entries(USDT_CHAIN_LABELS).map(([key, { name, icon }]) => (
                  <button
                    key={key}
                    onClick={() => setUsdtChain(key as UsdtChain)}
                    className={`flex-1 py-3 rounded-lg ${
                      usdtChain === key ? 'bg-blue-600' : 'bg-gray-800'
                    }`}
                  >
                    {icon} {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Seller's USDT Address */}
            {sellerUsdtAddress && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">
                  {language === 'en' ? 'Your USDT receiving address:' : '您的 USDT 收款地址：'}
                </div>
                <div className="font-mono text-sm break-all">{sellerUsdtAddress}</div>
              </div>
            )}

            {/* Summary */}
            {tokenAmount && (
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === 'en' ? 'Total USDT' : '总计 USDT'}</span>
                  <span>{usdtAmount.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === 'en' ? 'Fee (1%)' : '手续费 (1%)'}</span>
                  <span>{fee.toFixed(2)} TPOT</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-400">{language === 'en' ? 'Buyer receives' : '买家收到'}</span>
                  <span className="text-green-400">{buyerReceives.toFixed(2)} TPOT</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!tokenAmount || !price || !sellerUsdtAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {language === 'en' ? 'Next: Escrow TPOT' : '下一步：托管 TPOT'}
            </button>
          </div>
        )}

        {/* Step 2: Escrow */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm mb-3">
                📦 {language === 'en' 
                  ? 'Please transfer your TPOT to platform escrow account:'
                  : '请将您的 TPOT 转入平台托管账户：'}
              </p>
              
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <div className="text-xs text-gray-400 mb-1">
                  {language === 'en' ? 'Escrow Address:' : '托管地址：'}
                </div>
                <div className="font-mono text-sm break-all">
                  {PLATFORM_CONFIG.ESCROW_ACCOUNT}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(PLATFORM_CONFIG.ESCROW_ACCOUNT)}
                  className="text-blue-400 text-xs mt-2"
                >
                  {language === 'en' ? 'Copy' : '复制'}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">
                  {language === 'en' ? 'Amount to send:' : '发送数量：'}
                </div>
                <div className="text-xl font-bold">{tokenAmount} TPOT</div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {language === 'en' ? 'Transaction Hash (after transfer):' : '交易 Hash（转账后）：'}
              </label>
              <input
                type="text"
                value={escrowTxHash}
                onChange={(e) => setEscrowTxHash(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono"
                placeholder="5J8k..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg"
              >
                {language === 'en' ? 'Back' : '返回'}
              </button>
              <button
                onClick={handleConfirmEscrow}
                disabled={!escrowTxHash || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg disabled:opacity-50"
              >
                {loading 
                  ? (language === 'en' ? 'Verifying...' : '验证中...')
                  : (language === 'en' ? 'Confirm Escrow' : '确认托管')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="p-4 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-2">
              {language === 'en' ? 'Order Created!' : '订单已创建！'}
            </h3>
            <p className="text-gray-400 mb-4">
              {language === 'en' 
                ? 'Your sell order is now live. Waiting for buyers.'
                : '您的卖单已上线，等待买家接单。'}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg"
            >
              {language === 'en' ? 'Done' : '完成'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
