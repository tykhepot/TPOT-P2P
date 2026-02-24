use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{EscrowAccount, PlatformConfig, UserProfile};

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
    pub expires_at: i64,
    pub min_limit: u64,
    pub max_limit: u64,
    pub bump: u8,
}

impl Order {
    pub const SIZE: usize = 8 + 8 + 32 + 1 + 32 + 1 + 32 + 8 + 8 + 4 + 16 + 1 + 8 + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OrderType {
    Buy,
    Sell,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OrderStatus {
    Pending,
    Matched,
    Paid,
    Released,
    Completed,
    Cancelled,
    Disputed,
    Arbitrated,
}

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

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateBuyOrder<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + Order::SIZE,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init_if_needed,
        payer = maker,
        space = 8 + UserProfile::SIZE,
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

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateSellOrder<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + Order::SIZE,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub order: Box<Account<'info, Order>>,
    #[account(
        init,
        payer = maker,
        space = 8 + EscrowAccount::SIZE,
        seeds = [b"escrow", order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Box<Account<'info, EscrowAccount>>,
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init_if_needed,
        payer = maker,
        space = 8 + UserProfile::SIZE,
        seeds = [b"profile", maker.key().as_ref()],
        bump
    )]
    pub maker_profile: Box<Account<'info, UserProfile>>,
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct DepositEscrow<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        mut,
        seeds = [b"escrow", order_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(mut)]
    pub maker_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = maker,
        token::mint = token_mint,
        token::authority = escrow,
        seeds = [b"escrow_token", order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct TakeOrder<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        init_if_needed,
        payer = taker,
        space = 8 + EscrowAccount::SIZE,
        seeds = [b"escrow", order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(
        init_if_needed,
        payer = taker,
        space = 8 + UserProfile::SIZE,
        seeds = [b"profile", taker.key().as_ref()],
        bump
    )]
    pub taker_profile: Account<'info, UserProfile>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct ConfirmPayment<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct ReleaseTokens<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        mut,
        seeds = [b"escrow", order_id.to_le_bytes().as_ref()],
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

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CancelOrder<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        mut,
        seeds = [b"escrow", order_id.to_le_bytes().as_ref()],
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
    pub seller_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(mut)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Resume<'info> {
    #[account(mut)]
    pub platform_config: Account<'info, PlatformConfig>,
    pub authority: Signer<'info>,
}
