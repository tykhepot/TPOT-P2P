const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  // 验证托管
  async verifyEscrow(orderId: string, txHash: string) {
    const res = await fetch(`${API_BASE}/api/verify-escrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txHash }),
    });
    return res.json();
  },

  // 验证付款
  async verifyPayment(orderId: string, txHash: string) {
    const res = await fetch(`${API_BASE}/api/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txHash }),
    });
    return res.json();
  },

  // 获取订单列表
  async getOrders() {
    const res = await fetch(`${API_BASE}/api/orders`);
    return res.json();
  },

  // 获取单个订单
  async getOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
    return res.json();
  },

  // 创建订单
  async createOrder(data: any) {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 接单
  async takeOrder(orderId: string, data: { buyer: string; buyerNickname: string }) {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/take`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 取消订单
  async cancelOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
      method: 'POST',
    });
    return res.json();
  },

  // 手动放行
  async releaseOrder(orderId: string, sellerPublicKey: string) {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerPublicKey }),
    });
    return res.json();
  },

  // 获取用户信息
  async getUser(publicKey: string) {
    const res = await fetch(`${API_BASE}/api/users/${publicKey}`);
    return res.json();
  },

  // 更新用户信息
  async updateUser(publicKey: string, data: any) {
    const res = await fetch(`${API_BASE}/api/users/${publicKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
