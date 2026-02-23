import { Router } from 'express';
import { db } from '../config/database';

const router = Router();

// 获取订单列表
router.get('/', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (type) {
      params.push(type);
      query += ` AND order_type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.rowCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 创建订单
router.post('/', async (req, res) => {
  try {
    const {
      order_id,
      maker,
      order_type,
      token_mint,
      amount,
      price,
      payment_method,
    } = req.body;

    const result = await db.query(
      `INSERT INTO orders (order_id, maker, order_type, token_mint, amount, price, payment_method, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '24 hours')
       RETURNING *`,
      [order_id, maker, order_type, token_mint, amount, price, payment_method]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 获取订单详情
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await db.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 更新订单状态
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
