import { Pool } from 'pg';

// 数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tpot_p2p',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

export const db = {
  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    try {
      const client = await pool.connect();
      console.log('Database connected successfully');
      client.release();
      
      // 创建表
      await this.createTables();
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  },

  /**
   * 创建数据表
   */
  async createTables(): Promise<void> {
    await pool.query(`
      -- 用户表
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        public_key VARCHAR(66) UNIQUE NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(255),
        usdt_trc20_address VARCHAR(34),
        usdt_erc20_address VARCHAR(42),
        total_trades INTEGER DEFAULT 0,
        completion_rate DECIMAL(5,2) DEFAULT 100,
        positive_rate DECIMAL(5,2) DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- 订单表
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(20) PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending_escrow',
        
        -- 卖家信息
        seller VARCHAR(66) NOT NULL,
        seller_nickname VARCHAR(50),
        seller_usdt_address VARCHAR(100) NOT NULL,
        seller_usdt_chain VARCHAR(10) NOT NULL,
        
        -- 买家信息
        buyer VARCHAR(66),
        buyer_nickname VARCHAR(50),
        
        -- 交易信息
        token_amount DECIMAL(20, 2) NOT NULL,
        price DECIMAL(10, 4) NOT NULL,
        usdt_amount DECIMAL(20, 2) NOT NULL,
        
        -- 手续费
        fee_rate DECIMAL(5, 4) DEFAULT 0.01,
        fee DECIMAL(20, 2),
        buyer_receives DECIMAL(20, 2),
        
        -- 限额
        min_usdt DECIMAL(20, 2),
        max_usdt DECIMAL(20, 2),
        
        -- 托管信息
        escrow_tx_hash VARCHAR(100),
        escrow_confirmed_at TIMESTAMP,
        
        -- 付款信息
        payment_tx_hash VARCHAR(100),
        payment_submitted_at TIMESTAMP,
        payment_detected_amount DECIMAL(20, 2),
        payment_confirmed_at TIMESTAMP,
        
        -- 时间
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        completed_at TIMESTAMP,
        
        -- 外键
        CONSTRAINT fk_seller FOREIGN KEY (seller) REFERENCES users(public_key),
        CONSTRAINT fk_buyer FOREIGN KEY (buyer) REFERENCES users(public_key)
      );

      -- 聊天消息表
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL,
        sender VARCHAR(66) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(10) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller);
      CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer);
      CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id);
    `);
    
    console.log('Database tables created');
  },

  // ==================== 用户操作 ====================

  async getUser(publicKey: string) {
    const result = await pool.query(
      'SELECT * FROM users WHERE public_key = $1',
      [publicKey]
    );
    return result.rows[0] || null;
  },

  async createUser(data: {
    publicKey: string;
    nickname?: string;
    usdtTrc20Address?: string;
    usdtErc20Address?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO users (public_key, nickname, usdt_trc20_address, usdt_erc20_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.publicKey, data.nickname, data.usdtTrc20Address, data.usdtErc20Address]
    );
    return result.rows[0];
  },

  async updateUser(publicKey: string, data: {
    nickname?: string;
    usdtTrc20Address?: string;
    usdtErc20Address?: string;
  }) {
    const fields = [];
    const values = [publicKey];
    let i = 2;

    if (data.nickname !== undefined) {
      fields.push(`nickname = $${i++}`);
      values.push(data.nickname);
    }
    if (data.usdtTrc20Address !== undefined) {
      fields.push(`usdt_trc20_address = $${i++}`);
      values.push(data.usdtTrc20Address);
    }
    if (data.usdtErc20Address !== undefined) {
      fields.push(`usdt_erc20_address = $${i++}`);
      values.push(data.usdtErc20Address);
    }

    fields.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE public_key = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // ==================== 订单操作 ====================

  async getOrder(id: string) {
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getOrders(filters?: {
    status?: string;
    type?: string;
    seller?: string;
    buyer?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const values: any[] = [];
    let i = 1;

    if (filters?.status) {
      query += ` AND status = $${i++}`;
      values.push(filters.status);
    }
    if (filters?.type) {
      query += ` AND type = $${i++}`;
      values.push(filters.type);
    }
    if (filters?.seller) {
      query += ` AND seller = $${i++}`;
      values.push(filters.seller);
    }
    if (filters?.buyer) {
      query += ` AND buyer = $${i++}`;
      values.push(filters.buyer);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${i++}`;
      values.push(filters.limit);
    }
    if (filters?.offset) {
      query += ` OFFSET $${i++}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  },

  async createOrder(data: {
    id: string;
    type: string;
    seller: string;
    sellerNickname: string;
    sellerUsdtAddress: string;
    sellerUsdtChain: string;
    tokenAmount: number;
    price: number;
    usdtAmount: number;
    feeRate: number;
    fee: number;
    buyerReceives: number;
    minUsdt: number;
    maxUsdt: number;
    expiresAt: Date;
  }) {
    const result = await pool.query(
      `INSERT INTO orders (
        id, type, seller, seller_nickname, seller_usdt_address, seller_usdt_chain,
        token_amount, price, usdt_amount, fee_rate, fee, buyer_receives,
        min_usdt, max_usdt, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        data.id, data.type, data.seller, data.sellerNickname, data.sellerUsdtAddress,
        data.sellerUsdtChain, data.tokenAmount, data.price, data.usdtAmount,
        data.feeRate, data.fee, data.buyerReceives, data.minUsdt, data.maxUsdt, data.expiresAt
      ]
    );
    return result.rows[0];
  },

  async updateOrder(id: string, data: Record<string, any>) {
    const fields = [];
    const values = [id];
    let i = 2;

    for (const [key, value] of Object.entries(data)) {
      // 转换 camelCase 到 snake_case
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${dbKey} = $${i++}`);
      values.push(value);
    }

    const result = await pool.query(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // ==================== 消息操作 ====================

  async getMessages(orderId: string) {
    const result = await pool.query(
      'SELECT * FROM messages WHERE order_id = $1 ORDER BY created_at ASC',
      [orderId]
    );
    return result.rows;
  },

  async createMessage(data: {
    orderId: string;
    sender: string;
    content: string;
    type?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO messages (order_id, sender, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.orderId, data.sender, data.content, data.type || 'text']
    );
    return result.rows[0];
  },

  // ==================== 辅助方法 ====================

  /**
   * 检查用户是否有进行中的订单
   */
  async hasActiveOrders(publicKey: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM orders 
       WHERE (seller = $1 OR buyer = $1) 
       AND status NOT IN ('completed', 'cancelled')`,
      [publicKey]
    );
    return Number(result.rows[0].count) > 0;
  },
};
