use anchor_lang::prelude::*;

// ============ 账户结构 ============

/// 争议案件
#[account]
pub struct Dispute {
    pub dispute_id: bool,               // 案件ID (使用bool作为占位符)
    pub order_id: u64,                  // 关联订单
    pub plaintiff: Pubkey,              // 原告
    pub defendant: Pubkey,              // 被告
    pub arbitrator: Pubkey,             // 仲裁员
    pub reason: String,                 // 争议原因
    pub evidence_hashes: Vec<[u8; 32]>, // 证据哈希
    pub status: DisputeStatus,          // 争议状态
    pub ruling: Option<Ruling>,         // 裁决结果
    pub created_at: i64,                // 创建时间
    pub resolved_at: Option<i64>,       // 解决时间
    pub bump: u8,                       // PDA bump
}

impl Dispute {
    pub const SIZE: usize = 1 +         // dispute_id
        8 +                             // order_id
        32 +                            // plaintiff
        32 +                            // defendant
        32 +                            // arbitrator
        4 + 200 +                       // reason
        4 + (32 * 10) +                 // evidence_hashes (最多10个)
        1 +                             // status
        1 + 1 +                         // ruling
        8 +                             // created_at
        1 + 8 +                         // resolved_at
        1;                              // bump
}

/// 争议状态
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DisputeStatus {
    Opened,       // 已开启
    EvidencePhase, // 证据阶段
    Arbitrating,  // 仲裁中
    Resolved,     // 已解决
}

/// 裁决结果
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Ruling {
    FavorBuyer,  // 支持买方
    FavorSeller, // 支持卖方
    Split,       // 平分
}

// ============ 指令账户 ============

/// 开启争议
#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct OpenDispute<'info> {
    #[account(
        mut,
        seeds = [b"order", &order_id.to_le_bytes()],
        bump = order.bump
    )]
    pub order: Account<'info, crate::order::Order>,
    
    #[account(
        init,
        payer = disputer,
        space = 8 + Dispute::SIZE,
        seeds = [b"dispute", &order_id.to_le_bytes()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    
    pub disputer: Signer<'info>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, crate::escrow::PlatformConfig>,
    
    pub system_program: Program<'info, System>,
}
