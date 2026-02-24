-- TPOT P2P 数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  public_key VARCHAR(66) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  avatar_url TEXT,
  
  -- USDT 收款地址
  usdt_trc20_address VARCHAR(64),
  usdt_erc20_address VARCHAR(66),
  
  -- 信誉数据
  total_trades INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 100.00,
  positive_rate DECIMAL(5,2) DEFAULT 100.00,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(20) PRIMARY KEY,
  
  -- 类型
  type VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_escrow',
  
  -- 卖家信息
  seller VARCHAR(66) NOT NULL,
  seller_nickname VARCHAR(50),
  seller_usdt_address VARCHAR(64) NOT NULL,
  seller_usdt_chain VARCHAR(10) NOT NULL CHECK (seller_usdt_chain IN ('trc20', 'erc20')),
  
  -- 买家信息
  buyer VARCHAR(66),
  buyer_nickname VARCHAR(50),
  
  -- 交易数量
  token_amount DECIMAL(20, 6) NOT NULL,
  price DECIMAL(20, 6) NOT NULL,
  usdt_amount DECIMAL(20, 6) NOT NULL,
  
  -- 手续费
  fee_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0100,
  fee DECIMAL(20, 6) NOT NULL,
  buyer_receives DECIMAL(20, 6) NOT NULL,
  
  -- 限额
  min_usdt DECIMAL(20, 6),
  max_usdt DECIMAL(20, 6),
  
  -- 交易哈希
  escrow_tx_hash VARCHAR(100),
  escrow_confirmed_at TIMESTAMP,
  payment_tx_hash VARCHAR(100),
  payment_detected_amount DECIMAL(20, 6),
  payment_confirmed_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id),
  sender VARCHAR(66) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(10) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer);
CREATE INDEX IF NOT EXISTS idx_users_public_key ON users(public_key);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);

-- 插入测试数据
INSERT INTO users (public_key, nickname, usdt_trc20_address)
VALUES 
  ('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'Alice', 'TRX7aN2XxXxXxXxXxXxXxXxXxXxXxXxXxX'),
  ('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdavVLumpY2Mr', 'Bob', 'TRX9bN2YyYyYyYyYyYyYyYyYyYyYyYyYyYy');

-- 订单状态说明：
-- pending_escrow: 等待卖家托管 TPOT
-- escrow_confirmed: 托管已确认，待接单
-- matched: 已匹配，等待付款
-- payment_submitted: 买家声称已付款
-- payment_confirmed: 链上确认付款
-- amount_mismatch: 金额不匹配
-- releasing: 正在释放 TPOT
-- completed: 交易完成
-- cancelled: 已取消
-- disputed: 争议中
