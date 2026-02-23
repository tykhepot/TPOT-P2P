import { Router } from 'express';
import { db } from '../config/database';

const router = Router();

// 获取用户资料
router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const result = await db.query(
      'SELECT * FROM users WHERE wallet = $1',
      [wallet]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 创建或更新用户
router.post('/', async (req, res) => {
  try {
    const { wallet, username, avatar } = req.body;

    const result = await db.query(
      `INSERT INTO users (wallet, username, avatar)
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet) DO UPDATE
       SET username = COALESCE($2, users.username),
           avatar = COALESCE($3, users.avatar),
           updated_at = NOW()
       RETURNING *`,
      [wallet, username, avatar]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 获取用户订单
router.get('/:wallet/orders', async (req, res) => {
  try {
    const { wallet } = req.params;
    const result = await db.query(
      'SELECT * FROM orders WHERE maker = $1 OR taker = $1 ORDER BY created_at DESC',
      [wallet]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 获取用户统计
router.get('/:wallet/stats', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
       FROM orders 
       WHERE maker = $1 OR taker = $1`,
      [wallet]
    );

    res.json({ success: true, data: stats.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
