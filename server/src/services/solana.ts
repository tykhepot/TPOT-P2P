import { Connection, PublicKey, TransactionResponse } from '@solana/web3.js';

interface VerifyEscrowParams {
  txHash: string;
  expectedSender: string;
  expectedReceiver: string;
  expectedMint: string;
  expectedAmount: number;
}

interface VerifyResult {
  success: boolean;
  error?: string;
  actualAmount?: number;
}

// Solana RPC 连接
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

/**
 * 验证 TPOT 托管交易
 */
export async function verifyEscrow(params: VerifyEscrowParams): Promise<VerifyResult> {
  const { txHash, expectedSender, expectedReceiver, expectedMint, expectedAmount } = params;

  try {
    console.log(`Verifying escrow transaction: ${txHash}`);

    // 获取交易详情
    const tx = await connection.getTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { success: false, error: 'Transaction not found' };
    }

    // 检查交易是否成功
    if (tx.meta?.err) {
      return { success: false, error: 'Transaction failed' };
    }

    // 检查发送方
    const sender = tx.transaction.message.staticAccountKeys[0].toString();
    if (sender !== expectedSender) {
      return { 
        success: false, 
        error: `Wrong sender. Expected ${expectedSender}, got ${sender}` 
      };
    }

    // 解析 SPL Token 转账
    const preBalances = tx.meta.preTokenBalances || [];
    const postBalances = tx.meta.postTokenBalances || [];

    // 查找托管账户的余额变化
    let transferAmount = 0;
    let foundReceiver = false;
    let foundMint = false;

    for (const postBalance of postBalances) {
      const preBalance = preBalances.find(
        pre => pre.accountIndex === postBalance.accountIndex
      );
      
      const preAmount = preBalance ? Number(preBalance.uiTokenAmount.amount) : 0;
      const postAmount = Number(postBalance.uiTokenAmount.amount);
      const diff = postAmount - preAmount;

      // 正数表示接收代币
      if (diff > 0) {
        // 检查接收地址
        const accountKey = tx.transaction.message.staticAccountKeys[postBalance.accountIndex];
        if (accountKey.toString() === expectedReceiver) {
          foundReceiver = true;
          transferAmount = diff;
        }
        
        // 检查代币
        if (postBalance.mint === expectedMint) {
          foundMint = true;
        }
      }
    }

    if (!foundReceiver) {
      return { success: false, error: 'Transfer not found to escrow account' };
    }

    if (!foundMint) {
      return { success: false, error: 'Wrong token mint' };
    }

    // 检查金额（允许有微小误差）
    const tolerance = 0.01; // 1% 容差
    const minExpected = expectedAmount * (1 - tolerance);
    
    if (transferAmount < minExpected) {
      return { 
        success: false, 
        error: `Insufficient amount. Expected >= ${minExpected}, got ${transferAmount}` 
      };
    }

    console.log(`Escrow verified: ${transferAmount} tokens from ${sender}`);

    return {
      success: true,
      actualAmount: transferAmount,
    };

  } catch (error) {
    console.error('Escrow verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

/**
 * 监控托管账户的 TPOT 余额
 */
export async function getEscrowBalance(escrowAccount: string): Promise<number> {
  try {
    const publicKey = new PublicKey(escrowAccount);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: new PublicKey(process.env.TPOT_MINT!) }
    );

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
    return Number(balance.amount);
  } catch (error) {
    console.error('Get escrow balance error:', error);
    return 0;
  }
}

/**
 * 获取交易确认状态
 */
export async function getTransactionStatus(txHash: string): Promise<string> {
  try {
    const status = await connection.getSignatureStatus(txHash);
    
    if (!status) {
      return 'not_found';
    }
    
    if (status.err) {
      return 'failed';
    }
    
    if (status.confirmationStatus === 'finalized') {
      return 'finalized';
    }
    
    if (status.confirmationStatus === 'confirmed') {
      return 'confirmed';
    }
    
    return 'pending';
  } catch (error) {
    console.error('Get transaction status error:', error);
    return 'error';
  }
}
