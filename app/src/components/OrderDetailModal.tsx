'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useP2PStore, PLATFORM_CONFIG, USDT_CHAIN_LABELS, STATUS_INFO } from '@/store/p2pStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  orderId: string;
  onClose: () => void;
}

export const OrderDetailModal: FC<Props> = ({ orderId, onClose }) => {
  const { publicKey, connected } = useWallet();
  const { orders, updateOrder, messages, addMessage } = useP2PStore();
  const { language } = useLanguage();
  
  const [inputAmount, setInputAmount] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [paymentTxHash, setPaymentTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  const order = orders.find(o => o.id === orderId);
  const orderMessages = messages[orderId] || [];

  if (!order) return null;

  const isMyOrder = publicKey && order.seller === publicKey.toString();
  const canTrade = connected && !isMyOrder;

  const handleTakeOrder = async () => {
    if (!inputAmount) return;
    setLoading(true);
    try {
      updateOrder(orderId, {
        buyer: publicKey?.toString(),
        buyerNickname: 'You',
        status: 'matched',
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
        paymentSubmittedAt: new Date(),
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
      type: 'text',
      timestamp: new Date(),
    });
    setInputMessage('');
  };

  const statusInfo = STATUS_INFO[order.status];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold">
              {order.type === 'buy' ? (language === 'en' ? 'Buy' : '买入') : (language === 'en' ? 'Sell' : '卖出')} TPOT
            </h2>
            <p className="text-sm text-gray-400">
              #{order.id} • {formatDistanceToNow(order.createdAt)} {language === 'en' ? 'ago' : '前'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Seller Info */}
          <div className="flex items-center space-x-4 bg-gray-800/50 rounded-lg p-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold">
              {order.sellerNickname[0]}
            </div>
            <div>
              <div className="font-medium">{order.sellerNickname}</div>
              <div className="text-sm text-gray-400">
                {language === 'en' ? 'Seller' : '卖家'} • 156 {language === 'en' ? 'trades' : '交易'} • 98%
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">{language === 'en' ? 'Price' : '价格'}</div>
                <div className="text-xl font-bold">{order.price} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">{language === 'en' ? 'Available' : '可用'}</div>
                <div className="text-xl font-bold">{order.tokenAmount.toLocaleString()} TPOT</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">{language === 'en' ? 'Limit' : '限额'}</div>
                <div className="font-medium">{order.minUsdt} - {order.maxUsdt} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">{language === 'en' ? 'Payment' : '支付'}</div>
                <div className="font-medium">
                  {USDT_CHAIN_LABELS[order.sellerUsdtChain].icon} {USDT_CHAIN_LABELS[order.sellerUsdtChain].name}
                </div>
              </div>
            </div>
          </div>

          {/* Fee Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{language === 'en' ? 'Fee (1%)' : '手续费 (1%)'}</span>
              <span>{order.fee} TPOT</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">{language === 'en' ? 'You receive' : '您收到'}</span>
              <span className="text-green-400">{order.buyerReceives} TPOT</span>
            </div>
          </div>

          {/* Payment Info (After matched) */}
          {(order.status === 'matched' || order.status === 'payment_submitted') && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-medium mb-3">
                📋 {language === 'en' ? 'Payment Information' : '付款信息'}
              </h4>
              
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <div className="text-sm text-gray-400 mb-1">
                  {language === 'en' ? 'Amount to send:' : '发送金额：'}
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {order.usdtAmount} USDT
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <div className="text-sm text-gray-400 mb-1">
                  {language === 'en' ? 'Network:' : '网络：'}
                </div>
                <div className="font-medium">
                  {USDT_CHAIN_LABELS[order.sellerUsdtChain].name}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <div className="text-sm text-gray-400 mb-1">
                  {language === 'en' ? "Seller's Address:" : '卖家地址：'}
                </div>
                <div className="font-mono text-sm break-all">
                  {order.sellerUsdtAddress}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(order.sellerUsdtAddress)}
                  className="text-blue-400 text-xs mt-2"
                >
                  {language === 'en' ? 'Copy' : '复制'}
                </button>
              </div>

              <div className="text-sm text-red-400">
                ⚠️ {language === 'en' 
                  ? `Send exactly ${order.usdtAmount} USDT, or seller must manually confirm`
                  : `请精确发送 ${order.usdtAmount} USDT，否则需卖家手动确认`}
              </div>
            </div>
          )}

          {/* Payment Confirmation */}
          {order.status === 'matched' && canTrade && (
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {language === 'en' ? 'Transaction Hash (after payment):' : '交易 Hash（付款后）：'}
                </label>
                <input
                  type="text"
                  value={paymentTxHash}
                  onChange={(e) => setPaymentTxHash(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 font-mono"
                  placeholder={order.sellerUsdtChain === 'trc20' ? 'Txyz...' : '0x...'}
                />
              </div>
              <button
                onClick={handleConfirmPayment}
                disabled={!paymentTxHash || loading}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {loading 
                  ? (language === 'en' ? 'Processing...' : '处理中...')
                  : (language === 'en' ? 'I have paid' : '我已付款')}
              </button>
            </div>
          )}

          {/* Chat */}
          <div className="border-t border-gray-800 pt-4">
            <div className="text-sm font-medium mb-2">
              💬 {language === 'en' ? 'Chat' : '聊天'}
            </div>
            <div className="bg-gray-800/50 rounded-lg h-32 overflow-y-auto p-3 space-y-2">
              {orderMessages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  {language === 'en' ? 'No messages yet' : '暂无消息'}
                </div>
              ) : (
                orderMessages.map((msg) => (
                  <div key={msg.id} className={`text-sm ${msg.sender === publicKey?.toString() ? 'text-right' : 'text-left'}`}>
                    <span className="inline-block bg-gray-700 rounded-lg px-3 py-2 max-w-[80%]">
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
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                placeholder={language === 'en' ? 'Type a message...' : '输入消息...'}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                {language === 'en' ? 'Send' : '发送'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-medium"
          >
            {language === 'en' ? 'Close' : '关闭'}
          </button>
        </div>
      </div>
    </div>
  );
};
