import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tpot_p2p',
});

export const db = {
  async connect() {
    await pool.connect();
    await this.initTables();
  },

  async initTables() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        public_key VARCHAR(66) UNIQUE NOT NULL,
        nickname VARCHAR(50),
        usdt_trc20_address VARCHAR(64),
        usdt_erc20_address VARCHAR(64),
        total_trades INTEGER DEFAULT 0,
        completion_rate DECIMAL(5,2) DEFAULT 100,
        positive_rate DECIMAL(5,2) DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(20) PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        
        seller VARCHAR(66) NOT NULL,
        seller_nickname VARCHAR(50),
        seller_usdt_address VARCHAR(64) NOT NULL,
        seller_usdt_chain VARCHAR(10) NOT NULL,
        
        buyer VARCHAR(66),
        buyer_nickname VARCHAR(50),
        
        token_amount DECIMAL(20, 2) NOT NULL,
        price DECIMAL(10, 4) NOT NULL,
        usdt_amount DECIMAL(20, 2) NOT NULL,
        
        fee_rate DECIMAL(5, 4) DEFAULT 0.01,
        fee DECIMAL(20, 2),
        buyer_receives DECIMAL(20, 2),
        
        escrow_tx_hash VARCHAR(100),
        escrow_confirmed_at TIMESTAMP,
        
        payment_tx_hash VARCHAR(100),
        payment_detected_amount DECIMAL(20, 2),
        payment_submitted_at TIMESTAMP,
        payment_confirmed_at TIMESTAMP,
        
        min_usdt DECIMAL(20, 2),
        max_usdt DECIMAL(20, 2),
        payment_timeout INTEGER DEFAULT 30,
        
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL,
        sender VARCHAR(66) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(10) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `);
  },

  // Orders
  async getOrder(id: string) {
    const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async getOpenOrders(chain?: string) {
    let query = 'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC';
    const params: any[] = ['escrow_confirmed'];
    
    if (chain) {
      query = 'SELECT * FROM orders WHERE status = $1 AND seller_usdt_chain = $2 ORDER BY created_at DESC';
      params.push(chain);
    }
    
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getOrdersByUser(publicKey: string) {
    const res = await pool.query(
      'SELECT * FROM orders WHERE seller = $1 OR buyer = $1 ORDER BY created_at DESC',
      [publicKey]
    );
    return res.rows;
  },

  async createOrder(order: any) {
    const res = await pool.query(
      `INSERT INTO orders (
        id, type, status, seller, seller_nickname, seller_usdt_address, seller_usdt_chain,
        token_amount, price, usdt_amount, fee_rate, fee, buyer_receives,
        min_usdt, max_usdt, payment_timeout, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        order.id, order.type, order.status || 'pending_escrow',
        order.seller, order.sellerNickname, order.sellerUsdtAddress, order.sellerUsdtChain,
        order.tokenAmount, order.price, order.usdtAmount,
        order.feeRate, order.fee, order.buyerReceives,
        order.minUsdt, order.maxUsdt, order.paymentTimeout,
        order.expiresAt
      ]
    );
    return res.rows[0];
  },

  async updateOrder(id: string, updates: Record<string, any>) {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    
    const res = await pool.query(
      `UPDATE orders SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return res.rows[0];
  },

  // Users
  async getUser(publicKey: string) {
    const res = await pool.query('SELECT * FROM users WHERE public_key = $1', [publicKey]);
    return res.rows[0] || null;
  },

  async upsertUser(user: any) {
    const res = await pool.query(
      `INSERT INTO users (public_key, nickname, usdt_trc20_address, usdt_erc20_address)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (public_key) DO UPDATE SET
         nickname = EXCLUDED.nickname,
         usdt_trc20_address = EXCLUDED.usdt_trc20_address,
         usdt_erc20_address = EXCLUDED.usdt_erc20_address,
         updated_at = NOW()
       RETURNING *`,
      [user.publicKey, user.nickname, user.usdtTrc20, user.usdtErc20]
    );
    return res.rows[0];
  },

  // Messages
  async getMessages(orderId: string) {
    const res = await pool.query(
      'SELECT * FROM messages WHERE order_id = $1 ORDER BY created_at ASC',
      [orderId]
    );
    return res.rows;
  },

  async addMessage(orderId: string, sender: string, content: string, type: string = 'text') {
    const res = await pool.query(
      'INSERT INTO messages (order_id, sender, content, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [orderId, sender, content, type]
    );
    return res.rows[0];
  },
};
