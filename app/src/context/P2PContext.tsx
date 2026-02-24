import { FC, ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface Order {
  id: string;
  maker: string;
  taker?: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'matched' | 'paid' | 'completed' | 'cancelled';
  createdAt: number;
}

interface P2PContextType {
  orders: Order[];
  myOrders: Order[];
  loading: boolean;
  createOrder: (type: 'buy' | 'sell', amount: number, price: number, paymentMethod: string) => Promise<void>;
  takeOrder: (orderId: string) => Promise<void>;
  confirmPayment: (orderId: string, proof: string) => Promise<void>;
  releaseTokens: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const P2PContext = createContext<P2PContextType | null>(null);

// Program ID for TPOT-P2P
const PROGRAM_ID = new PublicKey('7ER1mftqvLzhZYQUPgjWoqqDiTYvrELiU8Qorh52b8Z6');
const TPOT_MINT = new PublicKey('5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b');

export const P2PProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟订单数据（实际应该从链上或后端获取）
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: '1',
        maker: 'Seller1xxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'sell',
        amount: 1000,
        price: 0.001,
        total: 1,
        paymentMethod: '支付宝',
        status: 'pending',
        createdAt: Date.now() - 3600000,
      },
      {
        id: '2',
        maker: 'Seller2xxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'sell',
        amount: 5000,
        price: 0.0012,
        total: 6,
        paymentMethod: '微信',
        status: 'pending',
        createdAt: Date.now() - 1800000,
      },
      {
        id: '3',
        maker: 'Buyer1xxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'buy',
        amount: 2000,
        price: 0.0009,
        total: 1.8,
        paymentMethod: '银行卡',
        status: 'pending',
        createdAt: Date.now() - 900000,
      },
    ];
    setOrders(mockOrders);
  }, []);

  const myOrders = orders.filter(
    (o) => publicKey && (o.maker === publicKey.toString() || o.taker === publicKey.toString())
  );

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 从链上或后端获取订单
      console.log('Refreshing orders...');
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    }
    setLoading(false);
  }, []);

  const createOrder = useCallback(async (
    type: 'buy' | 'sell',
    amount: number,
    price: number,
    paymentMethod: string
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    try {
      const newOrder: Order = {
        id: Date.now().toString(),
        maker: publicKey.toString(),
        type,
        amount,
        price,
        total: amount * price,
        paymentMethod,
        status: 'pending',
        createdAt: Date.now(),
      };

      // TODO: 调用智能合约创建订单
      console.log('Creating order:', newOrder);
      
      // 添加到本地订单列表
      setOrders((prev) => [...prev, newOrder]);
      
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
    setLoading(false);
  }, [publicKey, signTransaction]);

  const takeOrder = useCallback(async (orderId: string) => {
    if (!publicKey || !signTransaction) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    try {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, taker: publicKey.toString(), status: 'matched' }
            : o
        )
      );
      console.log('Taking order:', orderId);
    } catch (error) {
      console.error('Failed to take order:', error);
      throw error;
    }
    setLoading(false);
  }, [publicKey, signTransaction]);

  const confirmPayment = useCallback(async (orderId: string, proof: string) => {
    if (!publicKey || !signTransaction) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    try {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'paid' } : o
        )
      );
      console.log('Confirming payment:', orderId, proof);
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw error;
    }
    setLoading(false);
  }, [publicKey, signTransaction]);

  const releaseTokens = useCallback(async (orderId: string) => {
    if (!publicKey || !signTransaction) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    try {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'completed' } : o
        )
      );
      console.log('Releasing tokens:', orderId);
    } catch (error) {
      console.error('Failed to release tokens:', error);
      throw error;
    }
    setLoading(false);
  }, [publicKey, signTransaction]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!publicKey || !signTransaction) {
      throw new Error('请先连接钱包');
    }

    setLoading(true);
    try {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' } : o
        )
      );
      console.log('Cancelling order:', orderId);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
    setLoading(false);
  }, [publicKey, signTransaction]);

  return (
    <P2PContext.Provider
      value={{
        orders,
        myOrders,
        loading,
        createOrder,
        takeOrder,
        confirmPayment,
        releaseTokens,
        cancelOrder,
        refreshOrders,
      }}
    >
      {children}
    </P2PContext.Provider>
  );
};

export const useP2P = () => {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error('useP2P must be used within P2PProvider');
  }
  return context;
};
