use anchor_lang::prelude::*;

// ============ 账户结构 ============

/// 平台配置
#[account]
pub struct PlatformConfig {
    pub authority: Pubkey, // 管理员
    pub platform_fee: u64, // 平台手续费 (基点)
    pub dispute_fee: u64,  // 争议手续费 (基点)
    pub paused: bool,      // 是否暂停
    pub bump: u8,          // PDA bump
}

impl PlatformConfig {
    pub const SIZE: usize = 32 + 8 + 8 + 1 + 1;
}

/// 托管账户
#[account]
pub struct EscrowAccount {
    pub order_id: u64,                       // 关联订单
    pub seller: Pubkey,                      // 卖家
    pub buyer: Pubkey,                       // 买家
    pub token_mint: Pubkey,                  // 代币类型
    pub amount: u64,                         // 托管数量
    pub status: EscrowStatus,                // 托管状态
    pub created_at: i64,                     // 创建时间
    pub release_signature: Option<[u8; 64]>, // 释放签名
    pub bump: u8,                            // PDA bump
}

impl EscrowAccount {
    pub const SIZE: usize = 8 +     // order_id
        32 +                        // seller
        32 +                        // buyer
        32 +                        // token_mint
        8 +                         // amount
        1 +                         // status
        8 +                         // created_at
        1 + 64 +                    // release_signature
        1; // bump
}

/// 托管状态
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Locked,   // 已锁定
    Released, // 已释放
    Refunded, // 已退款
    Disputed, // 争议中
}
