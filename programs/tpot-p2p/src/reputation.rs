use anchor_lang::prelude::*;

// ============ 账户结构 ============

/// 用户资料
#[account]
pub struct UserProfile {
    pub wallet: Pubkey,           // 钱包地址
    pub username: Option<String>, // 用户名
    pub avatar: Option<String>,   // 头像URL
    pub kyc_level: u8,            // KYC等级
    pub reputation: u32,          // 信誉分
    pub total_trades: u32,        // 总交易次数
    pub total_orders: u32,        // 总挂单数
    pub completed_trades: u32,    // 完成交易数
    pub cancelled_trades: u32,    // 取消交易数
    pub disputed_trades: u32,     // 争议交易数
    pub completion_rate: u32,     // 完成率 (基点)
    pub created_at: i64,          // 创建时间
    pub updated_at: i64,          // 更新时间
    pub is_verified: bool,        // 是否认证
    pub is_banned: bool,          // 是否封禁
    pub bump: u8,                 // PDA bump
}

impl UserProfile {
    pub const SIZE: usize =
        32 + 1 + 4 + 16 + 1 + 4 + 32 + 1 + 4 + 4 + 4 + 4 + 4 + 4 + 8 + 8 + 1 + 1 + 1;
}

// ============ 辅助函数 ============

impl UserProfile {
    /// 计算信誉等级
    pub fn get_level(&self) -> u8 {
        match self.reputation {
            0..=50 => 1,
            51..=100 => 2,
            101..=200 => 3,
            201..=500 => 4,
            _ => 5,
        }
    }

    /// 更新完成率
    pub fn update_completion_rate(&mut self) {
        if self.total_trades > 0 {
            self.completion_rate =
                (self.completed_trades as u32 * 10000) / self.total_trades as u32;
        }
    }

    /// 添加信誉分
    pub fn add_reputation(&mut self, points: u32) {
        self.reputation = self.reputation.saturating_add(points);
    }

    /// 扣除信誉分
    pub fn subtract_reputation(&mut self, points: u32) {
        self.reputation = self.reputation.saturating_sub(points);
    }
}

/// 信誉记录
#[account]
pub struct ReputationRecord {
    pub user: Pubkey,          // 用户
    pub change: i32,           // 变化 (正数增加，负数减少)
    pub reason: String,        // 原因
    pub order_id: Option<u64>, // 关联订单
    pub created_at: i64,       // 创建时间
}

impl ReputationRecord {
    pub const SIZE: usize = 32 +    // user
        4 +                         // change
        4 + 100 +                   // reason
        1 + 8 +                     // order_id
        8; // created_at
}
