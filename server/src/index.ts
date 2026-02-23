import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import ordersRouter from './routes/orders';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// API路由
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/users', usersRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
async function start() {
  try {
    await initDatabase();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 TPOT-P2P API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
