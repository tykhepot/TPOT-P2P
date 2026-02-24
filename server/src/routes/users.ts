import { Router } from 'express';
import { db } from '../db';

const router = Router();

// 获取用户信息
router.get('/:publicKey', async (req, res) => {
  try {
    const user = await db.getUser(req.params.publicKey);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 更新用户信息
router.post('/', async (req, res) => {
  try {
    const { publicKey, nickname, usdtTrc20, usdtErc20 } = req.body;
    
    // 检查用户是否有进行中的订单
    const orders = await db.getOrdersByUser(publicKey);
    const activeOrders = orders.filter((o: any) => 
      !['completed', 'cancelled'].includes(o.status)
    );
    
    if (activeOrders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot modify payment address while having active orders' 
      });
    }
    
    const user = await db.upsertUser({
      publicKey,
      nickname,
      usdtTrc20,
      usdtErc20,
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
