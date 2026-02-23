import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.get('/api/v1/orders', async (req, res) => {
  try {
    // TODO: 从数据库获取订单
    const orders = [];
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/v1/orders', async (req, res) => {
  try {
    const { type, amount, price, paymentMethod } = req.body;
    // TODO: 创建订单
    res.json({ success: true, data: { id: Date.now().toString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/v1/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 获取订单详情
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/v1/users/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    // TODO: 获取用户资料
    res.json({ success: true, data: { wallet, reputation: 100, level: 2 } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/v1/market/stats', async (req, res) => {
  try {
    // TODO: 获取市场统计
    res.json({
      success: true,
      data: {
        totalOrders: 1234,
        totalVolume: 567890,
        activeOrders: 45,
        avgPrice: 0.0012,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// WebSocket
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });
  
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 TPOT-P2P API running on port ${PORT}`);
});
