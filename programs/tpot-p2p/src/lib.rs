use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};

declare_id!("6YYc6JKwDftka6eWAALmAwNoprnz8ZCh3AZFbSdn4LVu");

pub const PLATFORM_FEE: u64 = 50;
pub const DISPUTE_FEE: u64 = 100;

// ============ 账户结构 ============

#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub platform_fee: u64,
    pub dispute_fee: u64,
    pub total_volume: u64,
    pub total_orders: u64,
    pub paused: bool,
    pub bump: u8,
}

#[account]
pub struct Order {
    pub order_id: u64,
    pub maker: Pubkey,
    pub taker: Option<Pubkey>,
    pub order_type: OrderType,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub price: u64,
    pub payment_method: String,
    pub status: OrderStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct UserProfile {
    pub wallet: Pubkey,
    pub reputation: u32,
    pub total_trades: u32,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OrderType {
    Buy,
    Sell,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OrderStatus {
    Pending,
    Matched,
    Completed,
    Cancelled,
}

// ============ 指令账户结构 ============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateOrder<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", &order_id.to_le_bytes()[..]],
        bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        init_if_needed,
        payer = maker,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", maker.key().as_ref()],
        bump
    )]
    pub maker_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct TakeOrder<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()[..]],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub taker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CancelOrder<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()[..]],
        bump = order.bump,
        close = canceler
    )]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub canceler: Signer<'info>,
}

// ============ Space traits ============

impl Space for PlatformConfig {
    const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

impl Space for Order {
    const INIT_SPACE: usize = 8 + 32 + 33 + 1 + 32 + 8 + 8 + 50 + 1 + 8 + 1;
}

impl Space for UserProfile {
    const INIT_SPACE: usize = 32 + 4 + 4 + 1;
}

// ============ 程序逻辑 ============

#[program]
pub mod tpot_p2p {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, platform_fee: u64, dispute_fee: u64) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.platform_fee = platform_fee;
        config.dispute_fee = dispute_fee;
        config.total_volume = 0;
        config.total_orders = 0;
        config.paused = false;
        config.bump = ctx.bumps.platform_config;
        Ok(())
    }

    pub fn create_order(
        ctx: Context<CreateOrder>,
        order_id: u64,
        order_type: OrderType,
        amount: u64,
        price: u64,
        payment_method: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        order.order_id = order_id;
        order.maker = ctx.accounts.maker.key();
        order.taker = None;
        order.order_type = order_type;
        order.token_mint = Pubkey::default();
        order.amount = amount;
        order.price = price;
        order.payment_method = payment_method;
        order.status = OrderStatus::Pending;
        order.created_at = Clock::get()?.unix_timestamp;
        order.bump = ctx.bumps.order;

        let profile = &mut ctx.accounts.maker_profile;
        profile.wallet = ctx.accounts.maker.key();
        profile.total_trades += 1;
        profile.bump = ctx.bumps.maker_profile;

        ctx.accounts.platform_config.total_orders += 1;
        Ok(())
    }

    pub fn take_order(ctx: Context<TakeOrder>, _order_id: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        require!(order.status == OrderStatus::Pending, CustomError::OrderNotPending);
        order.taker = Some(ctx.accounts.taker.key());
        order.status = OrderStatus::Matched;
        Ok(())
    }

    pub fn cancel_order(ctx: Context<CancelOrder>, _order_id: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        require!(order.status == OrderStatus::Pending, CustomError::OrderNotPending);
        order.status = OrderStatus::Cancelled;
        Ok(())
    }
}

#[error_code]
pub enum CustomError {
    #[msg("Order is not pending")]
    OrderNotPending,
}
