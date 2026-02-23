import React, { createContext, useContext, useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// 类型定义
interface Order {
  id: string;
  maker: string;
  taker?: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  paymentMethod: string;
  status: string;
  createdAt: number;
}

interface UserProfile {
  wallet: string;
  username?: string;
  reputation: number;
  totalTrades: number;
  level: number;
}

interface P2PContextType {
  orders: Order[];
  myOrders: Order[];
  profile: UserProfile | null;
  loading: boolean;
  createOrder: (order: Partial<Order>) => Promise<void>;
  takeOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  confirmPayment: (orderId: string) => Promise<void>;
  releaseTokens: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const P2PContext = createContext<P2PContextType | null>(null);

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // 刷新订单列表
  const refreshOrders = async () => {
    setLoading(true);
    try {
      // TODO: 从链上或API获取订单
      const mockOrders: Order[] = [
        {
          id: '1',
          maker: 'xxxxx',
          type: 'sell',
          amount: 100,
          price: 0.001,
          paymentMethod: 'SOL',
          status: 'pending',
          createdAt: Date.now(),
        },
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('刷新订单失败:', error);
    }
    setLoading(false);
  };

  // 创建订单
  const createOrder = async (orderData: Partial<Order>) => {
    if (!publicKey) throw new Error('请先连接钱包');
    setLoading(true);
    try {
      // TODO: 调用智能合约创建订单
      console.log('创建订单:', orderData);
      await refreshOrders();
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
    setLoading(false);
  };

  // 接单
  const takeOrder = async (orderId: string) => {
    if (!publicKey) throw new Error('请先连接钱包');
    setLoading(true);
    try {
      // TODO: 调用智能合约接单
      console.log('接单:', orderId);
      await refreshOrders();
    } catch (error) {
      console.error('接单失败:', error);
      throw error;
    }
    setLoading(false);
  };

  // 取消订单
  const cancelOrder = async (orderId: string) => {
    if (!publicKey) throw new Error('请先连接钱包');
    setLoading(true);
    try {
      // TODO: 调用智能合约取消订单
      console.log('取消订单:', orderId);
      await refreshOrders();
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
    setLoading(false);
  };

  // 确认付款
  const confirmPayment = async (orderId: string) => {
    if (!publicKey) throw new Error('请先连接钱包');
    setLoading(true);
    try {
      // TODO: 调用智能合约确认付款
      console.log('确认付款:', orderId);
      await refreshOrders();
    } catch (error) {
      console.error('确认付款失败:', error);
      throw error;
    }
    setLoading(false);
  };

  // 释放代币
  const releaseTokens = async (orderId: string) => {
    if (!publicKey) throw new Error('请先连接钱包');
    setLoading(true);
    try {
      // TODO: 调用智能合约释放代币
      console.log('释放代币:', orderId);
      await refreshOrders();
    } catch (error) {
      console.error('释放代币失败:', error);
      throw error;
    }
    setLoading(false);
  };

  // 初始化
  useEffect(() => {
    refreshOrders();
  }, []);

  // 更新我的订单
  useEffect(() => {
    if (publicKey) {
      const my = orders.filter(
        (o) => o.maker === publicKey.toString() || o.taker === publicKey.toString()
      );
      setMyOrders(my);
    }
  }, [orders, publicKey]);

  return (
    <P2PContext.Provider
      value={{
        orders,
        myOrders,
        profile,
        loading,
        createOrder,
        takeOrder,
        cancelOrder,
        confirmPayment,
        releaseTokens,
        refreshOrders,
      }}
    >
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error('useP2P must be used within P2PProvider');
  }
  return context;
}
