import TronWeb from 'tronweb';
import { ethers } from 'ethers';

interface VerifyPaymentParams {
  txHash: string;
  chain: 'trc20' | 'erc20';
  expectedReceiver: string;
  expectedAmount: number;
}

interface VerifyResult {
  success: boolean;
  error?: string;
  amount?: number;
  sender?: string;
}

// USDT 合约地址
const USDT_CONTRACTS = {
  trc20: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // TRON mainnet
  erc20: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum mainnet
};

// TRON 客户端
const tronWeb = new TronWeb({
  fullHost: process.env.TRON_RPC_URL || 'https://api.trongrid.io',
});

// Ethereum 客户端
const ethProvider = new ethers.JsonRpcProvider(
  process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'
);

/**
 * 验证 TRC20 USDT 付款
 */
async function verifyTrc20Payment(params: VerifyPaymentParams): Promise<VerifyResult> {
  const { txHash, expectedReceiver, expectedAmount } = params;

  try {
    console.log(`Verifying TRC20 payment: ${txHash}`);

    // 获取交易信息
    const tx = await tronWeb.trx.getTransactionInfo(txHash);
    
    if (!tx) {
      return { success: false, error: 'Transaction not found' };
    }

    // 解析 TRC20 转账日志
    const contractAddress = USDT_CONTRACTS.trc20;
    
    // 查找 Transfer 事件
    for (const log of tx.log || []) {
      // TRC20 Transfer 事件签名
      if (log.address === tronWeb.address.toHex(contractAddress)) {
        // 解析 topics
        // topic[0] = Transfer(address,address,uint256)
        // topic[1] = from (padded)
        // topic[2] = to (padded)
        // data = amount
        
        const topics = log.topics;
        if (topics && topics.length >= 3) {
          const fromAddress = '0x' + topics[1].slice(24);
          const toAddress = '0x' + topics[2].slice(24);
          
          // 转换为 Base58
          const toBase58 = tronWeb.address.fromHex('41' + topics[2].slice(2));
          
          // 检查接收地址
          if (toBase58 === expectedReceiver) {
            // 解析金额 (6 decimals for USDT)
            const amountHex = log.data;
            const amount = parseInt(amountHex, 16) / 1e6;
            
            console.log(`TRC20 Payment found: ${amount} USDT to ${toBase58}`);
            
            return {
              success: true,
              amount,
              sender: fromAddress,
            };
          }
        }
      }
    }

    return { success: false, error: 'No USDT transfer to expected receiver' };

  } catch (error) {
    console.error('TRC20 verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

/**
 * 验证 ERC20 USDT 付款
 */
async function verifyErc20Payment(params: VerifyPaymentParams): Promise<VerifyResult> {
  const { txHash, expectedReceiver, expectedAmount } = params;

  try {
    console.log(`Verifying ERC20 payment: ${txHash}`);

    // 获取交易回执
    const receipt = await ethProvider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { success: false, error: 'Transaction not found or not confirmed' };
    }

    if (receipt.status !== 1) {
      return { success: false, error: 'Transaction failed' };
    }

    const contractAddress = USDT_CONTRACTS.erc20;

    // Transfer 事件签名
    const transferEventSignature = ethers.id('Transfer(address,address,uint256)');

    // 查找 Transfer 事件
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        if (log.topics[0] === transferEventSignature) {
          const fromAddress = '0x' + log.topics[1].slice(26);
          const toAddress = '0x' + log.topics[2].slice(26);

          // 检查接收地址
          if (toAddress.toLowerCase() === expectedReceiver.toLowerCase()) {
            // 解析金额 (6 decimals for USDT)
            const amount = BigInt(log.data) / BigInt(1e6);
            const amountNumber = Number(amount);

            console.log(`ERC20 Payment found: ${amountNumber} USDT to ${toAddress}`);

            return {
              success: true,
              amount: amountNumber,
              sender: fromAddress,
            };
          }
        }
      }
    }

    return { success: false, error: 'No USDT transfer to expected receiver' };

  } catch (error) {
    console.error('ERC20 verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

/**
 * 验证 USDT 付款（自动选择链）
 */
export async function verifyUsdtPayment(params: VerifyPaymentParams): Promise<VerifyResult> {
  const { chain } = params;

  if (chain === 'trc20') {
    return verifyTrc20Payment(params);
  } else if (chain === 'erc20') {
    return verifyErc20Payment(params);
  } else {
    return { success: false, error: 'Unsupported chain' };
  }
}

/**
 * 获取 USDT 地址余额
 */
export async function getUsdtBalance(address: string, chain: 'trc20' | 'erc20'): Promise<number> {
  try {
    if (chain === 'trc20') {
      const contract = await tronWeb.contract().at(USDT_CONTRACTS.trc20);
      const balance = await contract.balanceOf(address).call();
      return Number(balance) / 1e6;
    } else {
      const contract = new ethers.Contract(
        USDT_CONTRACTS.erc20,
        ['function balanceOf(address) view returns (uint256)'],
        ethProvider
      );
      const balance = await contract.balanceOf(address);
      return Number(balance) / 1e6;
    }
  } catch (error) {
    console.error('Get USDT balance error:', error);
    return 0;
  }
}

/**
 * 监控地址的 USDT 转入（用于后台轮询）
 */
export async function checkRecentTransfers(
  address: string, 
  chain: 'trc20' | 'erc20',
  sinceTimestamp: number
): Promise<Array<{ txHash: string; amount: number; sender: string; timestamp: number }>> {
  // 这个功能需要使用第三方 API（如 TronGrid API 或 Etherscan API）
  // 这里返回空数组，实际使用时需要实现
  return [];
}
