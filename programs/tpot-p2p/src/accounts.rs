use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

// ============ 账户结构 ============

/// 用户资料
#[account]
pub struct UserProfile {
    pub wallet: Pubkey,             // 钱包地址
    pub username: Option<String>,   // 用户名 (32字符)
    pub avatar: Option<String>,     // 头像URL (100字符)
    pub kyc_level: u8,              // KYC等级
    pub reputation: u32,            // 信誉分 (0-1000)
    pub total_trades: u32,          // 总交易次数
    pub total_orders: u32,          // 总挂单数
    pub completed_trades: u32,      // 完成交易数
    pub cancelled_trades: u32,      // 取消交易数
    pub disputed_trades: u32,       // 争议交易数
    pub completion_rate: u32,       // 完成率 (基点, 0-10000)
    pub created_at: i64,            // 创建时间
    pub updated_at: i64,            // 更新时间
    pub is_verified: bool,          // 是否认证
    pub is_banned: bool,            // 是否封禁
    pub bump: u8,                   // PDA bump
}

impl UserProfile {
    pub const SIZE: usize = 32 +    // wallet
        (1 + 4 + 32) +              // username (Option<String>)
        (1 + 4 + 100) +             // avatar (Option<String>)
        1 +                         // kyc_level
        4 +                         // reputation
        4 +                         // total_trades
        4 +                         // total_orders
        4 +                         // completed_trades
        4 +                         // cancelled_trades
        4 +                         // disputed_trades
        4 +                         // completion_rate
        8 +                         // created_at
        8 +                         // updated_at
        1 +                         // is_verified
        1 +                         // is_banned
        1;                          // bump

    pub fn get_level(&self) -> u8 {
        match self.reputation {
            0..=50 => 1,
            51..=100 => 2,
            101..=200 => 3,
            201..=500 => 4,
            _ => 5,
        }
    }
}

/// 平台配置
#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,      // 管理员
    pub platform_fee: u64,      // 平台手续费 (基点)
    pub dispute_fee: u64,       // 争议手续费 (基点)
    pub total_volume: u64,      // 总交易量
    pub total_orders: u64,      // 总订单数
    pub paused: bool,           // 是否暂停
    pub bump: u8,               // PDA bump
}

impl PlatformConfig {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

// ============ 指令账户结构 ============

/// 开启争议
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct OpenDispute<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, crate::Order>,
    
    #[account(
        init,
        payer = disputer,
        space = 8 + crate::Dispute::SIZE,
        seeds = [b"dispute", &order_id.to_le_bytes()],
        bump
    )]
    pub dispute: Account<'info, crate::Dispute>,
    
    #[account(mut)]
    pub disputer: Signer<'info>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub system_program: Program<'info, System>,
}

/// 解决争议
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, crate::Order>,
    
    #[account(
        mut,
        seeds = [b"dispute", &order_id.to_le_bytes()],
        bump = dispute.bump
    )]
    pub dispute: Account<'info, crate::Dispute>,
    
    #[account(
        mut,
        seeds = [b"escrow", &order_id.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, crate::EscrowAccount>,
    
    pub arbitrator: Signer<'info>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub token_program: Program<'info, Token>,
}

/// 创建用户资料
#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserProfile::SIZE,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// 更新用户资料
#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, UserProfile>,
    
    pub user: Signer<'info>,
}
