'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, USDT_CHAIN_LABELS, STATUS_INFO } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  orderId: string;
  onClose: () => void;
}

export const OrderDetailModal = ({ orderId, onClose }: Props) => {
  const { publicKey, connected } = useWallet();
  const { orders, updateOrder, messages, addMessage } = useP2PStore();
  const { language } = useLanguage();
  
  const [inputAmount, setInputAmount] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [paymentTxHash, setPaymentTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  const order = orders.find(o => o.id === orderId);
  const orderMessages = messages[orderId] || [];

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  if (!order) return null;

  const isMyOrder = publicKey && order.maker === publicKey.toString();
  const canTrade = connected && !isMyOrder && order.status === 'pending';
  const isBuyOrder = order.type === 'buy';

  const handleTakeOrder = async () => {
    if (!inputAmount) return;
    setLoading(true);
    try {
      updateOrder(orderId, {
        taker: publicKey?.toString(),
        takerNickname: 'You',
        status: 'matched',
        tokenAmount: parseFloat(inputAmount),
        usdtAmount: parseFloat(inputAmount) * order.price,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentTxHash) return;
    setLoading(true);
    try {
      updateOrder(orderId, {
        paymentTxHash,
        status: 'payment_submitted',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    addMessage(orderId, {
      id: Date.now().toString(),
      orderId,
      sender: publicKey?.toString() || 'unknown',
      content: inputMessage,
      timestamp: new Date(),
    });
    setInputMessage('');
  };

  const statusInfo = STATUS_INFO[order.status];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isBuyOrder ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {isBuyOrder ? '📈' : '📉'}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isBuyOrder ? t('Buy Order', '买单') : t('Sell Order', '卖单')}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>#{order.id.slice(-6)}</span>
                  <span>·</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'matched' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {language === 'en' ? statusInfo.label : statusInfo.labelZh}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Maker Info */}
          <div className="flex items-center space-x-4 bg-white/5 rounded-2xl p-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl">
              {order.makerNickname[0]}
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center space-x-2">
                <span>{order.makerNickname}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isBuyOrder ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isBuyOrder ? t('Buyer', '买家') : t('Seller', '卖家')}
                </span>
                {isMyOrder && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{t('You', '您')}</span>}
              </div>
              <div className="text-sm text-gray-500">
                156 {t('trades', '交易')} · 98% {t('completion', '完成率')}
              </div>
            </div>
          </div>

          {/* Price & Amount */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{t('Price', '价格')}</div>
              <div className="text-2xl font-bold">{order.price}</div>
              <div className="text-xs text-gray-400">USDT</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{t('Available', '可用')}</div>
              <div className="text-2xl font-bold">{order.tokenAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-400">TPOT</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{t('Total', '总额')}</div>
              <div className="text-2xl font-bold">{order.usdtAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-400">USDT</div>
            </div>
          </div>

          {/* Limits & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-xs text-gray-500 mb-1">{t('Limit', '限额')}</div>
              <div className="font-medium">{order.minUsdt} - {order.maxUsdt} USDT</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-xs text-gray-500 mb-1">{t('Payment Method', '支付方式')}</div>
              <div className="font-medium">{USDT_CHAIN_LABELS[order.makerUsdtChain].name}</div>
            </div>
          </div>

          {/* Take Order Form */}
          {canTrade && (
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-5 border border-blue-500/20">
              <h4 className="font-medium mb-4 flex items-center space-x-2">
                <span>🎯</span>
                <span>{isBuyOrder ? t('Sell to this buyer', '卖给这个买家') : t('Buy from this seller', '从这个卖家购买')}</span>
              </h4>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  {t('Amount (TPOT)', '数量 (TPOT)')}
                </label>
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  placeholder={`${order.minUsdt / order.price} - ${order.maxUsdt / order.price}`}
                />
                {inputAmount && (
                  <div className="text-sm text-gray-400 mt-2">
                    {t('You will pay/receive', '您将支付/收到')}: {(parseFloat(inputAmount) * order.price).toFixed(2)} USDT
                  </div>
                )}
              </div>

              <button
                onClick={handleTakeOrder}
                disabled={!inputAmount || loading}
                className={`w-full py-3 rounded-xl font-medium transition disabled:opacity-50 ${
                  isBuyOrder
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                {loading ? t('Processing...', '处理中...') : (isBuyOrder ? t('Sell TPOT', '卖出 TPOT') : t('Buy TPOT', '买入 TPOT'))}
              </button>
            </div>
          )}

          {/* Payment Info (After matched) */}
          {order.status === 'matched' && order.taker === publicKey?.toString() && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20">
              <h4 className="font-medium mb-4 flex items-center space-x-2 text-amber-400">
                <span>💳</span>
                <span>{t('Payment Information', '付款信息')}</span>
              </h4>
              
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-500 mb-1">{t('Amount to send', '发送金额')}</div>
                <div className="text-3xl font-bold text-amber-400">{order.usdtAmount} USDT</div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-500 mb-1">{t('Network', '网络')}</div>
                <div className="font-medium">{USDT_CHAIN_LABELS[order.makerUsdtChain].name}</div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t("Recipient's Address", '收款地址')}</div>
                    <div className="font-mono text-sm break-all">{order.makerUsdtAddress}</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(order.makerUsdtAddress || '')}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    {t('Copy', '复制')}
                  </button>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 mb-4">
                ⚠️ {t('Send exactly the specified amount. Incorrect amounts may delay the transaction.', '请精确发送指定金额，金额错误可能导致交易延迟。')}
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  {t('Transaction Hash', '交易哈希')}
                </label>
                <input
                  type="text"
                  value={paymentTxHash}
                  onChange={(e) => setPaymentTxHash(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm"
                  placeholder={order.makerUsdtChain === 'trc20' ? 'Txyz...' : '0x...'}
                />
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={!paymentTxHash || loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? t('Processing...', '处理中...') : t('I have paid', '我已付款')}
              </button>
            </div>
          )}

          {/* Chat */}
          <div className="border-t border-white/5 pt-5">
            <div className="text-sm font-medium mb-3 flex items-center space-x-2">
              <span>💬</span>
              <span>{t('Chat', '聊天')}</span>
            </div>
            <div className="bg-white/5 rounded-xl h-32 overflow-y-auto p-3 space-y-2">
              {orderMessages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  {t('No messages yet', '暂无消息')}
                </div>
              ) : (
                orderMessages.map((msg) => (
                  <div key={msg.id} className={`text-sm ${msg.sender === publicKey?.toString() ? 'text-right' : 'text-left'}`}>
                    <span className="inline-block bg-white/10 rounded-lg px-3 py-2 max-w-[80%]">
                      {msg.content}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex space-x-2 mt-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                placeholder={t('Type a message...', '输入消息...')}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2.5 rounded-xl transition"
              >
                {t('Send', '发送')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-medium transition"
          >
            {t('Close', '关闭')}
          </button>
        </div>
      </div>
    </div>
  );
};
