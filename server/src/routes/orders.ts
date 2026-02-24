import { Router } from 'express';
import { db } from '../db';

const router = Router();

// 获取所有开放订单
router.get('/', async (req, res) => {
  try {
    const { chain } = req.query;
    const orders = await db.getOpenOrders(chain as string);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 获取单个订单
router.get('/:id', async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 创建订单
router.post('/', async (req, res) => {
  try {
    const order = await db.createOrder(req.body);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 更新订单
router.patch('/:id', async (req, res) => {
  try {
    const order = await db.updateOrder(req.params.id, req.body);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// 获取用户订单
router.get('/user/:publicKey', async (req, res) => {
  try {
    const orders = await db.getOrdersByUser(req.params.publicKey);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// 获取订单消息
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await db.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 发送消息
router.post('/:id/messages', async (req, res) => {
  try {
    const { sender, content, type } = req.body;
    const message = await db.addMessage(req.params.id, sender, content, type);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
