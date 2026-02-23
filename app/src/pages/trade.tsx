import React, { useState } from 'react';
import { useP2P } from '@/context/P2PContext';
import { useWallet } from '@solana/wallet-adapter-react';

export default function TradePage() {
  const { publicKey } = useWallet();
  const { orders, createOrder, takeOrder, cancelOrder, loading } = useP2P();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    price: '',
    paymentMethod: 'SOL',
    minLimit: '',
    maxLimit: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({
        type: activeTab,
        amount: parseFloat(formData.amount),
        price: parseFloat(formData.price),
        paymentMethod: formData.paymentMethod,
      });
      setShowCreate(false);
      setFormData({ amount: '', price: '', paymentMethod: 'SOL', minLimit: '', maxLimit: '' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标签切换 */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('buy')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          买入 TPOT
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          卖出 TPOT
        </button>
      </div>

      {/* 创建订单按钮 */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium"
      >
        {showCreate ? '取消' : '创建订单'}
      </button>

      {/* 创建订单表单 */}
      {showCreate && (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">数量 (TPOT)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
              placeholder="100"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">单价 (SOL)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
              placeholder="0.001"
              step="0.0001"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">支付方式</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
            >
              <option value="SOL">SOL</option>
              <option value="USDT">USDT</option>
              <option value="ALIPAY">支付宝</option>
              <option value="WECHAT">微信</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? '处理中...' : '创建订单'}
          </button>
        </form>
      )}

      {/* 订单列表 */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">
          {activeTab === 'buy' ? '卖单列表' : '买单列表'}
        </h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无订单
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.type === 'buy' ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {order.type === 'buy' ? '买入' : '卖出'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {order.paymentMethod}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg">{order.amount} TPOT</div>
                      <div className="text-sm text-gray-400">@ {order.price} SOL</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <button
                      onClick={() => takeOrder(order.id)}
                      disabled={loading}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm"
                    >
                      {loading ? '处理中...' : '接单'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
