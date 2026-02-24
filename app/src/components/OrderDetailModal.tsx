'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, USDT_CHAIN_LABELS, STATUS_INFO } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui';
import { formatNumber, shortenAddress, getTimeAgo } from '@/lib/theme';

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
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const order = orders.find(o => o.id === orderId);
  const orderMessages = messages[orderId] || [];

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [orderMessages]);

  if (!order) return null;

  const isMyOrder = publicKey && order.maker === publicKey.toString();
  const canTrade = connected && !isMyOrder && order.status === 'pending';
  const isBuyOrder = order.type === 'buy';
  const statusInfo = STATUS_INFO[order.status];

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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minTpot = order.minUsdt / order.price;
  const maxTpot = Math.min(order.maxUsdt / order.price, order.tokenAmount);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#12121a] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col animate-fade-in">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                isBuyOrder ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {isBuyOrder ? '📈' : '📉'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold">
                    {isBuyOrder ? t('Buy Order', '买单') : t('Sell Order', '卖单')}
                  </h2>
                  <Badge variant={isBuyOrder ? 'buy' : 'sell'}>
                    {isBuyOrder ? t('Buy', '买') : t('Sell', '卖')}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                  <span>#{order.id.slice(-6)}</span>
                  <span>·</span>
                  <span>{getTimeAgo(order.createdAt)}</span>
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

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                {order.makerNickname[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium truncate">{order.makerNickname}</span>
                  {isMyOrder && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 shrink-0">
                      {t('You', '您')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  156 {t('trades', '交易')} · 98% {t('completion', '完成率')}
                </div>
              </div>
              <div className={`text-right shrink-0 ${isBuyOrder ? 'text-green-400' : 'text-red-400'}`}>
                <div className="text-lg font-bold">${order.price}</div>
                <div className="text-xs text-gray-500">USDT/TPOT</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{t('Price', '价格')}</div>
                <div className="text-lg font-bold">{order.price}</div>
                <div className="text-xs text-gray-500">USDT</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{t('Available', '可用')}</div>
                <div className="text-lg font-bold">{formatNumber(order.tokenAmount, 0)}</div>
                <div className="text-xs text-gray-500">TPOT</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{t('Total', '总额')}</div>
                <div className="text-lg font-bold">{formatNumber(order.usdtAmount, 0)}</div>
                <div className="text-xs text-gray-500">USDT</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">{t('Limit', '限额')}</div>
                <div className="font-medium text-sm">{order.minUsdt} - {order.maxUsdt} USDT</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">{t('Payment', '支付')}</div>
                <div className="font-medium text-sm">{USDT_CHAIN_LABELS[order.makerUsdtChain].name.split('-')[1]}</div>
              </div>
            </div>

            {canTrade && (
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
                <h4 className="font-medium mb-3 flex items-center space-x-2 text-sm">
                  <span>🎯</span>
                  <span>{isBuyOrder ? t('Sell to this buyer', '卖给这个买家') : t('Buy from this seller', '从这个卖家购买')}</span>
                </h4>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t('Amount (TPOT)', '数量 (TPOT)')}
                  </label>
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={`${Math.ceil(minTpot)} - ${Math.floor(maxTpot)}`}
                  />
                  {inputAmount && (
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-gray-500">{t('You will pay/receive', '您将支付/收到')}</span>
                      <span className="text-green-400 font-medium">{(parseFloat(inputAmount) * order.price).toFixed(2)} USDT</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleTakeOrder}
                  disabled={!inputAmount || loading}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98] ${
                    isBuyOrder
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-lg hover:shadow-red-500/30'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30'
                  }`}
                >
                  {loading ? t('Processing...', '处理中...') : (isBuyOrder ? t('Sell TPOT', '卖出 TPOT') : t('Buy TPOT', '买入 TPOT'))}
                </button>
              </div>
            )}

            {order.status === 'matched' && order.taker === publicKey?.toString() && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                <h4 className="font-medium mb-3 flex items-center space-x-2 text-amber-400 text-sm">
                  <span>💳</span>
                  <span>{t('Payment Information', '付款信息')}</span>
                </h4>
                
                <div className="bg-white/5 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-500">{t('Amount to send', '发送金额')}</div>
                      <div className="text-2xl font-bold text-amber-400">{order.usdtAmount} USDT</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{t('Network', '网络')}</div>
                      <div className="font-medium">{USDT_CHAIN_LABELS[order.makerUsdtChain].name.split('-')[1]}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">{t("Recipient's Address", '收款地址')}</div>
                      <div className="font-mono text-xs break-all text-gray-300">{order.makerUsdtAddress}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.makerUsdtAddress || '')}
                      className="ml-2 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition shrink-0"
                    >
                      {copied ? t('Copied', '已复制') : t('Copy', '复制')}
                    </button>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 mb-3">
                  ⚠️ {t('Send exactly the specified amount.', '请精确发送指定金额。')}
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t('Transaction Hash', '交易哈希')}
                  </label>
                  <input
                    type="text"
                    value={paymentTxHash}
                    onChange={(e) => setPaymentTxHash(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-xs focus:outline-none focus:border-blue-500"
                    placeholder={order.makerUsdtChain === 'trc20' ? 'Txyz...' : '0x...'}
                  />
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={!paymentTxHash || loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 py-3 rounded-xl font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {loading ? t('Processing...', '处理中...') : t('I have paid', '我已付款')}
                </button>
              </div>
            )}

            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium flex items-center space-x-2">
                  <span>💬</span>
                  <span>{t('Chat', '聊天')}</span>
                </div>
                <span className="text-xs text-gray-500">{orderMessages.length} {t('messages', '条消息')}</span>
              </div>
              <div ref={chatRef} className="bg-white/5 rounded-xl h-28 overflow-y-auto p-3 space-y-2">
                {orderMessages.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs py-6">
                    {t('No messages yet', '暂无消息')}
                  </div>
                ) : (
                  orderMessages.map((msg) => (
                    <div key={msg.id} className={`text-xs ${msg.sender === publicKey?.toString() ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-block rounded-lg px-2.5 py-1.5 max-w-[85%] ${
                        msg.sender === publicKey?.toString() ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'
                      }`}>
                        {msg.content}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder={t('Type a message...', '输入消息...')}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-4 py-2 rounded-xl transition text-sm"
                >
                  {t('Send', '发送')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#12121a]">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs ${
              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              order.status === 'matched' ? 'bg-purple-500/20 text-purple-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                order.status === 'pending' ? 'bg-yellow-400' :
                order.status === 'matched' ? 'bg-purple-400' :
                'bg-gray-400'
              }`}></span>
              <span>{language === 'en' ? statusInfo.label : statusInfo.labelZh}</span>
            </div>
            <button
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-xl font-medium transition text-sm"
            >
              {t('Close', '关闭')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
