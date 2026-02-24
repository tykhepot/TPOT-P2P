import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

import { verifyEscrow } from './services/solana';
import { verifyUsdtPayment } from './services/usdt';
import { db } from './db';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://tykhepot.com',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`Client ${socket.id} joined order ${orderId}`);
  });
  
  socket.on('leave_order', (orderId: string) => {
    socket.leave(`order:${orderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 订单状态更新通知
export const notifyOrderUpdate = (orderId: string, update: any) => {
  io.to(`order:${orderId}`).emit('order_update', update);
};

// 托管验证接口
app.post('/api/verify-escrow', async (req, res) => {
  try {
    const { orderId, txHash } = req.body;
    
    console.log(`Verifying escrow for order ${orderId}, tx: ${txHash}`);
    
    // 获取订单信息
    const order = await db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // 验证 Solana 交易
    const verification = await verifyEscrow({
      txHash,
      expectedSender: order.seller,
      expectedReceiver: process.env.PLATFORM_ESCROW_ACCOUNT!,
      expectedMint: process.env.TPOT_MINT!,
      expectedAmount: order.token_amount,
    });
    
    if (verification.success) {
      // 更新订单状态
      await db.updateOrder(orderId, {
        status: 'escrow_confirmed',
        escrow_tx_hash: txHash,
        escrow_confirmed_at: new Date(),
      });
      
      // 通知前端
      notifyOrderUpdate(orderId, {
        status: 'escrow_confirmed',
        escrowTxHash: txHash,
      });
      
      res.json({ 
        success: true, 
        message: 'Escrow verified successfully',
        order: await db.getOrder(orderId)
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: verification.error 
      });
    }
  } catch (error) {
    console.error('Escrow verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// USDT 付款验证接口
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { orderId, txHash } = req.body;
    
    const order = await db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // 验证 USDT 付款
    const verification = await verifyUsdtPayment({
      txHash,
      chain: order.usdt_chain,
      expectedReceiver: order.seller_usdt_address,
      expectedAmount: order.usdt_amount,
    });
    
    if (verification.success) {
      const detectedAmount = verification.amount || 0;
      const expectedAmount = order.usdt_amount;
      
      // 检查金额是否匹配
      if (detectedAmount === expectedAmount) {
        // 金额匹配 - 自动放行
        await db.updateOrder(orderId, {
          status: 'payment_confirmed',
          payment_tx_hash: txHash,
          payment_detected_amount: detectedAmount,
          payment_confirmed_at: new Date(),
        });
        
        // TODO: 调用智能合约释放 TPOT
        
        notifyOrderUpdate(orderId, {
          status: 'payment_confirmed',
          paymentTxHash: txHash,
          detectedAmount,
        });
        
      } else {
        // 金额不匹配 - 等待卖家确认
        await db.updateOrder(orderId, {
          status: 'amount_mismatch',
          payment_tx_hash: txHash,
          payment_detected_amount: detectedAmount,
        });
        
        notifyOrderUpdate(orderId, {
          status: 'amount_mismatch',
          expectedAmount,
          detectedAmount,
        });
      }
      
      res.json({ 
        success: true, 
        amountMatch: detectedAmount === expectedAmount,
        expectedAmount,
        detectedAmount,
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: verification.error 
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 卖家手动放行
app.post('/api/orders/:orderId/release', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sellerPublicKey } = req.body;
    
    const order = await db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // 验证是卖家本人
    if (order.seller !== sellerPublicKey) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // 只有 amount_mismatch 状态才能手动放行
    if (order.status !== 'amount_mismatch') {
      return res.status(400).json({ error: 'Cannot release in current status' });
    }
    
    // 更新状态为 releasing
    await db.updateOrder(orderId, { status: 'releasing' });
    
    // TODO: 调用智能合约释放 TPOT
    
    // 更新状态为 completed
    await db.updateOrder(orderId, { 
      status: 'completed',
      completed_at: new Date(),
    });
    
    notifyOrderUpdate(orderId, { status: 'completed' });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Release error:', error);
    res.status(500).json({ error: 'Release failed' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await db.connect();
    console.log('✅ Database connected');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 TPOT-P2P API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
