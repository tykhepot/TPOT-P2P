use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{EscrowAccount, Order, PlatformConfig};

#[account]
pub struct Dispute {
    pub dispute_id: bool,
    pub order_id: u64,
    pub plaintiff: Pubkey,
    pub defendant: Pubkey,
    pub arbitrator: Pubkey,
    pub reason: String,
    pub evidence_hashes: Vec<[u8; 32]>,
    pub status: DisputeStatus,
    pub ruling: Option<Ruling>,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub bump: u8,
}

impl Dispute {
    pub const SIZE: usize =
        1 + 8 + 32 + 32 + 32 + 4 + 200 + 4 + (32 * 10) + 1 + 1 + 1 + 8 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DisputeStatus {
    Opened,
    EvidencePhase,
    Arbitrating,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Ruling {
    FavorBuyer,
    FavorSeller,
    Split,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct OpenDispute<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        init,
        payer = disputer,
        space = 8 + Dispute::SIZE,
        seeds = [b"dispute", order_id.to_le_bytes().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub disputer: Signer<'info>,
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"order", order_id.to_le_bytes().as_ref()],
        bump = order.bump
    )]
    pub order: Account<'info, Order>,
    #[account(
        mut,
        seeds = [b"dispute", order_id.to_le_bytes().as_ref()],
        bump = dispute.bump
    )]
    pub dispute: Account<'info, Dispute>,
    #[account(
        mut,
        seeds = [b"escrow", order_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub arbitrator: Signer<'info>,
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
