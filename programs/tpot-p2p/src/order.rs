use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

// ============ 账户结构 ============

/// 订单账户
#[account]
pub struct Order {
    pub order_id: u64,              // 订单ID
    pub maker: Pubkey,              // 挂单者
    pub taker: Option<Pubkey>,      // 接单者
    pub order_type: OrderType,      // 订单类型
    pub token_mint: Pubkey,         // 代币地址
    pub amount: u64,                // 数量
    pub price: u64,                 // 单价 (相对于SOL或USDT)
    pub total_value: u64,           // 总价值
    pub payment_method: String,     // 支付方式
    pub status: OrderStatus,        // 订单状态
    pub escrow_account: Pubkey,     // 托管账户
    pub created_at: i64,            // 创建时间
    pub expires_at: i64,            // 过期时间
    pub payment_time: Option<i64>,  // 付款时间
    pub completed_at: Option<i64>,  // 完成时间
    pub cancelled_at: Option<i64>,  // 取消时间
    pub payment_proof: Option<String>, // 付款凭证
    pub cancel_reason: Option<String>, // 取消原因
    pub min_limit: u64,             // 最小限额
    pub max_limit: u64,             // 最大限额
    pub bump: u8,                   // PDA bump
}

impl Order {
    pub const SIZE: usize = 8 +    // discriminator
        8 +                         // order_id
        32 +                        // maker
        1 + 32 +                    // taker (Option<Pubkey>)
        1 +                         // order_type
        32 +                        // token_mint
        8 +                         // amount
        8 +                         // price
        8 +                         // total_value
        4 + 50 +                    // payment_method (String)
        1 +                         // status
        32 +                        // escrow_account
        8 +                         // created_at
        8 +                         // expires_at
        1 + 8 +                     // payment_time
        1 + 8 +                     // completed_at
        1 + 8 +                     // cancelled_at
        1 + 4 + 200 +               // payment_proof
        1 + 4 + 100 +               // cancel_reason
        8 +                         // min_limit
        8 +                         // max_limit
        1;                          // bump
}

/// 订单类型
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OrderType {
    Buy,   // 买单
    Sell,  // 卖单
}

/// 订单状态
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OrderStatus {
    Pending,     // 待匹配
    Matched,     // 已匹配
    Paid,        // 已付款
    Released,    // 已释放
    Completed,   // 已完成
    Cancelled,   // 已取消
    Disputed,    // 有争议
    Arbitrated,  // 已仲裁
}

// ============ 指令账户 ============

/// 初始化
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::SIZE,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// 创建买单
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateBuyOrder<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + Order::SIZE,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,
    
    #[account(mut)]
    pub maker: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", maker.key().as_ref()],
        bump
    )]
    pub maker_profile: Account<'info, UserProfile>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub system_program: Program<'info, System>,
}

/// 创建卖单
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateSellOrder<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + Order::SIZE,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, Order>,
    
    #[account(
        init,
        payer = maker,
        space = 8 + EscrowAccount::SIZE,
        seeds = [b"escrow", &order_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    
    #[account(mut)]
    pub maker: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", maker.key().as_ref()],
        bump
    )]
    pub maker_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub maker_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = maker,
        token::mint = token_mint,
        token::authority = escrow,
        seeds = [b"escrow_token", &order_id.to_le_bytes()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// 接单
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct TakeOrder<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    
    #[account(
        init_if_needed,
        payer = taker,
        space = 8 + EscrowAccount::SIZE,
        seeds = [b"escrow", &order_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    
    #[account(mut)]
    pub taker: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", taker.key().as_ref()],
        bump
    )]
    pub taker_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub taker_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(
        init_if_needed,
        payer = taker,
        token::mint = token_mint,
        token::authority = escrow,
        seeds = [b"escrow_token", &order_id.to_le_bytes()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// 确认付款
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct ConfirmPayment<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    
    pub payer: Signer<'info>,
}

/// 释放代币
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct ReleaseTokens<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    
    #[account(
        mut,
        seeds = [b"escrow", &order_id.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", order.maker.as_ref()],
        bump
    )]
    pub maker_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"profile", order.taker.unwrap().as_ref()],
        bump
    )]
    pub taker_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_token_account: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub token_program: Program<'info, Token>,
}

/// 取消订单
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CancelOrder<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    
    #[account(
        mut,
        seeds = [b"escrow", &order_id.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    
    pub canceler: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"profile", canceler.key().as_ref()],
        bump
    )]
    pub canceler_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub maker_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

/// 暂停
#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(mut)]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub authority: Signer<'info>,
}

/// 恢复
#[derive(Accounts)]
pub struct Resume<'info> {
    #[account(mut)]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub authority: Signer<'info>,
}
