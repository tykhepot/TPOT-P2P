import { create } from 'zustand';

// 平台配置
export const PLATFORM_CONFIG = {
  // 固定的平台托管地址
  ESCROW_ACCOUNT: 'PLATf0rmEscrow11111111111111111111',
  // 手续费率 1%
  FEE_RATE: 0.01,
  // TPOT 代币地址
  TPOT_MINT: '5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b',
  // 付款超时（分钟）
  PAYMENT_TIMEOUT: 30,
  // 自动放行超时（小时）
  AUTO_RELEASE_TIMEOUT: 24,
};

// 类型定义
export type OrderType = 'buy' | 'sell';
export type UsdtChain = 'trc20' | 'erc20';

export type OrderStatus = 
  | 'pending_escrow'     // 等待卖家托管 TPOT
  | 'escrow_confirmed'   // 托管已确认，待接单
  | 'matched'            // 已匹配，等待买家付款
  | 'payment_submitted'  // 买家声称已付款，待确认
  | 'payment_confirmed'  // 链上确认收到付款
  | 'amount_mismatch'    // 金额不匹配
  | 'releasing'          // 正在释放 TPOT
  | 'completed'          // 交易完成
  | 'cancelled'          // 已取消
  | 'disputed';          // 争议中

// 用户收款地址
export interface PaymentAddress {
  chain: UsdtChain;
  address: string;
  updatedAt: Date;
}

// 用户
export interface User {
  publicKey: string;
  nickname: string;
  avatar?: string;
  
  // 收款地址（卖家设置）
  paymentAddresses: PaymentAddress[];
  canModifyPayment: boolean; // 是否可以修改收款地址
  
  // 信誉
  totalTrades: number;
  completionRate: number;
  positiveRate: number;
  
  createdAt: Date;
}

// 订单
export interface Order {
  id: string;
  
  // 基本信息
  type: OrderType;
  status: OrderStatus;
  createdAt: Date;
  expiresAt: Date;
  
  // 卖家信息
  seller: string;
  sellerNickname: string;
  sellerUsdtAddress: string;  // 卖家的 USDT 收款地址（买家看到）
  sellerUsdtChain: UsdtChain;
  
  // 买家信息
  buyer?: string;
  buyerNickname?: string;
  
  // 交易信息
  tokenAmount: number;        // 卖家托管的 TPOT 数量
  price: number;              // 单价（USDT/TPOT）
  usdtAmount: number;         // 总 USDT 金额
  
  // 手续费
  feeRate: number;            // 费率
  fee: number;                // 手续费（TPOT）
  buyerReceives: number;      // 买家实际收到（TPOT）
  
  // 托管信息
  escrowTxHash?: string;      // 托管交易 Hash
  escrowConfirmedAt?: Date;
  
  // 付款信息
  paymentTxHash?: string;     // 付款交易 Hash
  paymentSubmittedAt?: Date;
  paymentDetectedAmount?: number; // 链上检测到的金额
  paymentConfirmedAt?: Date;
  
  // 限额
  minUsdt: number;
  maxUsdt: number;
  
  // 超时
  paymentTimeout: number;     // 付款超时（分钟）
}

// 聊天消息
export interface Message {
  id: string;
  orderId: string;
  sender: string;
  content: string;
  type: 'text' | 'image' | 'system';
  timestamp: Date;
}

// Store
interface P2PState {
  // 用户
  currentUser: User | null;
  
  // 订单
  orders: Order[];
  myOrders: Order[];
  selectedOrder: Order | null;
  
  // 聊天
  messages: Record<string, Message[]>;
  
  // UI
  loading: boolean;
  activeTab: 'buy' | 'sell';
  
  // 用户操作
  setCurrentUser: (user: User | null) => void;
  setPaymentAddress: (chain: UsdtChain, address: string) => void;
  canModifyPaymentAddress: () => boolean;
  
  // 订单操作
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  selectOrder: (order: Order | null) => void;
  
  // 聊天操作
  addMessage: (orderId: string, message: Message) => void;
  
  // UI 操作
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: 'buy' | 'sell') => void;
}

export const useP2PStore = create<P2PState>((set, get) => ({
  // 初始状态
  currentUser: null,
  orders: [],
  myOrders: [],
  selectedOrder: null,
  messages: {},
  loading: false,
  activeTab: 'buy',
  
  // 用户操作
  setCurrentUser: (user) => set({ currentUser: user }),
  
  setPaymentAddress: (chain, address) => set((state) => {
    if (!state.currentUser) return state;
    
    const existing = state.currentUser.paymentAddresses.find(a => a.chain === chain);
    let newAddresses: PaymentAddress[];
    
    if (existing) {
      newAddresses = state.currentUser.paymentAddresses.map(a =>
        a.chain === chain ? { ...a, address, updatedAt: new Date() } : a
      );
    } else {
      newAddresses = [...state.currentUser.paymentAddresses, {
        chain,
        address,
        updatedAt: new Date(),
      }];
    }
    
    return {
      currentUser: { ...state.currentUser, paymentAddresses: newAddresses }
    };
  }),
  
  canModifyPaymentAddress: () => {
    const state = get();
    if (!state.currentUser) return false;
    // 检查是否有进行中的订单
    const activeOrders = state.myOrders.filter(o =>
      !['completed', 'cancelled'].includes(o.status)
    );
    return activeOrders.length === 0;
  },
  
  // 订单操作
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
    myOrders: [order, ...state.myOrders],
  })),
  
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o),
    myOrders: state.myOrders.map(o => o.id === id ? { ...o, ...updates } : o),
    selectedOrder: state.selectedOrder?.id === id
      ? { ...state.selectedOrder, ...updates }
      : state.selectedOrder,
  })),
  
  selectOrder: (order) => set({ selectedOrder: order }),
  
  // 聊天操作
  addMessage: (orderId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [orderId]: [...(state.messages[orderId] || []), message],
    },
  })),
  
  // UI 操作
  setLoading: (loading) => set({ loading }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));

// USDT 链标签
export const USDT_CHAIN_LABELS: Record<UsdtChain, { name: string; icon: string; network: string }> = {
  trc20: { name: 'USDT-TRC20', icon: '₮', network: 'TRON' },
  erc20: { name: 'USDT-ERC20', icon: '₮', network: 'Ethereum' },
};

// 状态标签
export const STATUS_INFO: Record<OrderStatus, { label: string; color: string; desc: string }> = {
  pending_escrow: { label: 'Pending Escrow', color: 'yellow', desc: 'Waiting for seller to deposit TPOT' },
  escrow_confirmed: { label: 'Escrowed', color: 'blue', desc: 'TPOT escrowed, waiting for buyer' },
  matched: { label: 'Matched', color: 'purple', desc: 'Buyer matched, waiting for payment' },
  payment_submitted: { label: 'Payment Submitted', color: 'orange', desc: 'Buyer claimed payment sent' },
  payment_confirmed: { label: 'Payment Confirmed', color: 'green', desc: 'Payment confirmed on chain' },
  amount_mismatch: { label: 'Amount Mismatch', color: 'red', desc: 'Payment amount does not match' },
  releasing: { label: 'Releasing', color: 'cyan', desc: 'Releasing TPOT to buyer' },
  completed: { label: 'Completed', color: 'gray', desc: 'Trade completed' },
  cancelled: { label: 'Cancelled', color: 'gray', desc: 'Trade cancelled' },
  disputed: { label: 'Disputed', color: 'red', desc: 'Under dispute review' },
};
