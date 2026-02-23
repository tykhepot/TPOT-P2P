import { Pool } from 'pg';
import { Redis } from 'redis';

// 数据库配置
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tpot_p2p',
});

// Redis配置
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// 数据库初始化
export async function initDatabase() {
  const client = await db.connect();
  try {
    // 创建订单表
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(64) UNIQUE NOT NULL,
        maker VARCHAR(44) NOT NULL,
        taker VARCHAR(44),
        order_type VARCHAR(10) NOT NULL,
        token_mint VARCHAR(44) NOT NULL,
        amount NUMERIC(20, 9) NOT NULL,
        price NUMERIC(20, 9) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        escrow_account VARCHAR(44),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP
      )
    `);

    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        wallet VARCHAR(44) UNIQUE NOT NULL,
        username VARCHAR(32),
        avatar VARCHAR(200),
        reputation INTEGER DEFAULT 0,
        total_trades INTEGER DEFAULT 0,
        completed_trades INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 创建交易记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        buyer VARCHAR(44) NOT NULL,
        seller VARCHAR(44) NOT NULL,
        amount NUMERIC(20, 9) NOT NULL,
        price NUMERIC(20, 9) NOT NULL,
        fee NUMERIC(20, 9),
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
