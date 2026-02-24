import { create } from 'zustand';

export const PLATFORM_CONFIG = {
  ESCROW_ACCOUNT: 'PLATf0rmEscrow11111111111111111111',
  FEE_RATE: 0.01,
  TPOT_MINT: '5Mmrkgwppa2kJ93LJNuN5nmaMW3UQAVs2doaRBsjtV5b',
  PAYMENT_TIMEOUT: 30,
  AUTO_RELEASE_TIMEOUT: 24,
};

export type OrderType = 'buy' | 'sell';
export type UsdtChain = 'trc20' | 'erc20' | 'bep20' | 'sol';

export type OrderStatus = 
  | 'pending'
  | 'matched'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'releasing'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface PaymentAddress {
  chain: UsdtChain;
  address: string;
  updatedAt: Date;
}

export interface User {
  publicKey: string;
  nickname: string;
  avatar?: string;
  paymentAddresses: PaymentAddress[];
  totalTrades: number;
  completionRate: number;
  positiveRate: number;
  createdAt: Date;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  createdAt: Date;
  expiresAt: Date;
  
  maker: string;
  makerNickname: string;
  makerUsdtAddress?: string;
  makerUsdtChain: UsdtChain;
  
  taker?: string;
  takerNickname?: string;
  
  tokenAmount: number;
  price: number;
  usdtAmount: number;
  
  feeRate: number;
  fee: number;
  
  minUsdt: number;
  maxUsdt: number;
  
  paymentTxHash?: string;
  escrowTxHash?: string;
}

export interface Message {
  id: string;
  orderId: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface P2PState {
  currentUser: User | null;
  orders: Order[];
  myOrders: Order[];
  selectedOrder: Order | null;
  messages: Record<string, Message[]>;
  loading: boolean;
  activeTab: 'buy' | 'sell';
  
  setCurrentUser: (user: User | null) => void;
  setPaymentAddress: (chain: UsdtChain, address: string) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  selectOrder: (order: Order | null) => void;
  addMessage: (orderId: string, message: Message) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: 'buy' | 'sell') => void;
}

export const useP2PStore = create<P2PState>((set, get) => ({
  currentUser: null,
  orders: [],
  myOrders: [],
  selectedOrder: null,
  messages: {},
  loading: false,
  activeTab: 'buy',
  
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
      newAddresses = [...state.currentUser.paymentAddresses, { chain, address, updatedAt: new Date() }];
    }
    return { currentUser: { ...state.currentUser, paymentAddresses: newAddresses } };
  }),
  
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
    myOrders: [order, ...state.myOrders],
  })),
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o),
    myOrders: state.myOrders.map(o => o.id === id ? { ...o, ...updates } : o),
    selectedOrder: state.selectedOrder?.id === id ? { ...state.selectedOrder, ...updates } : state.selectedOrder,
  })),
  selectOrder: (order) => set({ selectedOrder: order }),
  addMessage: (orderId, message) => set((state) => ({
    messages: { ...state.messages, [orderId]: [...(state.messages[orderId] || []), message] },
  })),
  setLoading: (loading) => set({ loading }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));

export const USDT_CHAIN_LABELS: Record<UsdtChain, { name: string; icon: string; network: string }> = {
  trc20: { name: 'USDT-TRC20', icon: '₮', network: 'TRON' },
  erc20: { name: 'USDT-ERC20', icon: '₮', network: 'Ethereum' },
  bep20: { name: 'USDT-BEP20', icon: '₮', network: 'BSC' },
  sol: { name: 'USDT-SPL', icon: '₮', network: 'Solana' },
};

export const STATUS_INFO: Record<OrderStatus, { label: string; labelZh: string; color: string }> = {
  pending: { label: 'Pending', labelZh: '待接单', color: 'yellow' },
  matched: { label: 'Matched', labelZh: '已匹配', color: 'purple' },
  payment_submitted: { label: 'Payment Submitted', labelZh: '已提交付款', color: 'orange' },
  payment_confirmed: { label: 'Payment Confirmed', labelZh: '已确认付款', color: 'green' },
  releasing: { label: 'Releasing', labelZh: '释放中', color: 'cyan' },
  completed: { label: 'Completed', labelZh: '已完成', color: 'gray' },
  cancelled: { label: 'Cancelled', labelZh: '已取消', color: 'gray' },
  disputed: { label: 'Disputed', labelZh: '争议中', color: 'red' },
};
