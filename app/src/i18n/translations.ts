// 国际化配置
export const translations = {
  en: {
    // Header
    title: 'TPOT P2P',
    trade: 'Trade',
    navOrders: 'Orders',
    wallet: 'Wallet',
    paymentAccounts: 'Payment Accounts',
    connectWallet: 'Connect Wallet',
    
    // Tabs
    buy: 'Buy TPOT',
    sell: 'Sell TPOT',
    
    // Order List
    price: 'Price',
    available: 'Available',
    limit: 'Limit',
    paymentMethod: 'Payment',
    allPayments: 'All Payments',
    createAd: 'Create Ad',
    noOrders: 'No orders available',
    
    // Order Card
    orderCount: 'orders',
    completion: 'completion',
    
    // Create Order Modal
    createP2PAd: 'Create P2P Ad',
    iWantTo: 'I want to',
    enterAmount: 'Enter amount',
    pricePerTPOT: 'Price per TPOT (USDT)',
    totalValue: 'Total Value',
    minLimit: 'Min Limit (USDT)',
    maxLimit: 'Max Limit (USDT)',
    paymentMethods: 'Payment Methods',
    paymentTimeout: 'Payment Timeout',
    minutes: 'minutes',
    messageToTraders: 'Message to Traders (Optional)',
    anySpecialRequirements: 'Any special requirements...',
    cancel: 'Cancel',
    creating: 'Creating...',
    
    // Order Detail Modal
    created: 'Created',
    ago: 'ago',
    trades: 'trades',
    positive: 'positive',
    enterAmountTo: 'Enter amount to',
    processing: 'Processing...',
    status: 'Status',
    releaseTPOT: 'Release TPOT',
    chat: 'Chat',
    noMessagesYet: 'No messages yet',
    typeMessage: 'Type a message...',
    send: 'Send',
    close: 'Close',
    
    // Payment Account Modal
    paymentAccountsTitle: 'Payment Accounts',
    noPaymentAccounts: 'No payment accounts added yet',
    remove: 'Remove',
    accountHolderName: 'Account Holder Name',
    accountNumber: 'Account Number / Wallet Address',
    addAccount: 'Add Account',
    addPaymentAccount: 'Add Payment Account',
    done: 'Done',
    
    // Status
    pending: 'Pending',
    paid: 'Paid',
    released: 'Released',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
    
    // Warnings
    pleaseConnectWallet: 'Please connect your wallet to start trading',
    
    // New: Escrow
    escrowed: 'Escrowed',
    amountSent: 'Amount Sent',
    amountReceived: 'Amount Received',
    confirmRelease: 'Confirm Release',
    contactSupport: 'Contact Support',
    waitingForPayment: 'Waiting for Payment',
    paymentDetected: 'Payment Detected',
    amountMismatch: 'Amount Mismatch',
    waitingSellerConfirm: 'Waiting for Seller Confirmation',
  },
  zh: {
    // Header
    title: 'TPOT P2P',
    trade: '交易',
    navOrders: '订单',
    wallet: '钱包',
    paymentAccounts: '收款账户',
    connectWallet: '连接钱包',
    
    // Tabs
    buy: '买入 TPOT',
    sell: '卖出 TPOT',
    
    // Order List
    price: '价格',
    available: '可用',
    limit: '限额',
    paymentMethod: '支付方式',
    allPayments: '全部支付',
    createAd: '发布广告',
    noOrders: '暂无订单',
    
    // Order Card
    orderCount: '订单',
    completion: '完成率',
    
    // Create Order Modal
    createP2PAd: '创建P2P广告',
    iWantTo: '我要',
    enterAmount: '输入数量',
    pricePerTPOT: '单价 (USDT)',
    totalValue: '总价值',
    minLimit: '最小限额 (USDT)',
    maxLimit: '最大限额 (USDT)',
    paymentMethods: '支付方式',
    paymentTimeout: '付款时限',
    minutes: '分钟',
    messageToTraders: '给交易者的留言 (可选)',
    anySpecialRequirements: '任何特殊要求...',
    cancel: '取消',
    creating: '创建中...',
    
    // Order Detail Modal
    created: '创建于',
    ago: '前',
    trades: '交易',
    positive: '好评',
    enterAmountTo: '输入要',
    processing: '处理中...',
    status: '状态',
    releaseTPOT: '释放TPOT',
    chat: '聊天',
    noMessagesYet: '暂无消息',
    typeMessage: '输入消息...',
    send: '发送',
    close: '关闭',
    
    // Payment Account Modal
    paymentAccountsTitle: '收款账户',
    noPaymentAccounts: '暂无收款账户',
    remove: '删除',
    accountHolderName: '账户名',
    accountNumber: '账户号/钱包地址',
    addAccount: '添加账户',
    addPaymentAccount: '添加收款账户',
    done: '完成',
    
    // Status
    pending: '待付款',
    paid: '已付款',
    released: '已释放',
    completed: '已完成',
    cancelled: '已取消',
    disputed: '争议中',
    
    // Warnings
    pleaseConnectWallet: '请先连接钱包开始交易',
    
    // New: Escrow
    escrowed: '已托管',
    amountSent: '已发送金额',
    amountReceived: '已收到金额',
    confirmRelease: '确认释放',
    contactSupport: '联系客服',
    waitingForPayment: '等待付款',
    paymentDetected: '已检测到付款',
    amountMismatch: '金额不匹配',
    waitingSellerConfirm: '等待卖家确认',
  }
};

export type Language = 'en' | 'zh';
export type TranslationKey = keyof typeof translations.en;
