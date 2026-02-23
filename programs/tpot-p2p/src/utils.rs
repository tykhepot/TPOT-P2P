use anchor_lang::prelude::*;

// ============ 错误码定义 ============

#[error_code]
pub enum P2PError {
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Invalid price")]
    InvalidPrice,
    
    #[msg("Invalid limit values")]
    InvalidLimit,
    
    #[msg("Payment method too long")]
    PaymentMethodTooLong,
    
    #[msg("Platform is paused")]
    PlatformPaused,
    
    #[msg("Order not pending")]
    OrderNotPending,
    
    #[msg("Order already taken")]
    OrderAlreadyTaken,
    
    #[msg("Order expired")]
    OrderExpired,
    
    #[msg("Order not matched")]
    OrderNotMatched,
    
    #[msg("Order not paid")]
    OrderNotPaid,
    
    #[msg("Order cannot be cancelled")]
    OrderCannotCancel,
    
    #[msg("Not authorized")]
    NotAuthorized,
    
    #[msg("Not buyer")]
    NotBuyer,
    
    #[msg("Not seller")]
    NotSeller,
    
    #[msg("Not arbitrator")]
    NotArbitrator,
    
    #[msg("Not participant")]
    NotParticipant,
    
    #[msg("Dispute not open")]
    DisputeNotOpen,
    
    #[msg("Insufficient balance")]
    InsufficientBalance,
    
    #[msg("Insufficient reputation")]
    InsufficientReputation,
    
    #[msg("User banned")]
    UserBanned,
    
    #[msg("Order not found")]
    OrderNotFound,
    
    #[msg("Escrow not found")]
    EscrowNotFound,
}

// ============ 事件定义 ============

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub platform_fee: u64,
}

#[event]
pub struct OrderCreated {
    pub order_id: u64,
    pub maker: Pubkey,
    pub order_type: OrderType,
    pub amount: u64,
    pub price: u64,
}

#[event]
pub struct OrderTaken {
    pub order_id: u64,
    pub taker: Pubkey,
}

#[event]
pub struct PaymentConfirmed {
    pub order_id: u64,
    pub payer: Pubkey,
}

#[event]
pub struct TokensReleased {
    pub order_id: u64,
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct OrderCompleted {
    pub order_id: u64,
    pub buyer: Pubkey,
    pub seller: Pubkey,
}

#[event]
pub struct OrderCancelled {
    pub order_id: u64,
    pub canceler: Pubkey,
}

#[event]
pub struct EscrowLocked {
    pub order_id: u64,
    pub amount: u64,
    pub seller: Pubkey,
}

#[event]
pub struct EscrowReleased {
    pub order_id: u64,
    pub amount: u64,
    pub buyer: Pubkey,
}

#[event]
pub struct DisputeOpened {
    pub order_id: u64,
    pub plaintiff: Pubkey,
    pub reason: String,
}

#[event]
pub struct DisputeResolved {
    pub order_id: u64,
    pub ruling: Ruling,
}

#[event]
pub struct ReputationUpdated {
    pub user: Pubkey,
    pub change: i32,
    pub new_score: u32,
}

// ============ 工具函数 ============

/// 计算手续费
pub fn calculate_fee(amount: u64, fee_rate: u64) -> u64 {
    (amount as u128)
        .checked_mul(fee_rate as u128)
        .unwrap()
        .checked_div(10000)
        .unwrap() as u64
}

/// 验证支付方式
pub fn validate_payment_method(method: &str) -> bool {
    let valid_methods = [
        "SOL", "USDT", "USDC", 
        "ALIPAY", "WECHAT", "BANK",
        "PAYPAL", "REVOLUT"
    ];
    valid_methods.contains(&method.to_uppercase().as_str())
}

/// 检查订单是否过期
pub fn is_order_expired(expires_at: i64, current_time: i64) -> bool {
    current_time >= expires_at
}

/// 计算信誉等级
pub fn calculate_reputation_level(reputation: u32) -> u8 {
    match reputation {
        0..=50 => 1,
        51..=100 => 2,
        101..=200 => 3,
        201..=500 => 4,
        _ => 5,
    }
}

/// 获取等级名称
pub fn get_level_name(level: u8) -> &'static str {
    match level {
        1 => "新手",
        2 => "普通",
        3 => "优秀",
        4 => "卓越",
        5 => "大神",
        _ => "未知",
    }
}

/// 获取等级图标
pub fn get_level_icon(level: u8) -> &'static str {
    match level {
        1 => "🌱",
        2 => "🌿",
        3 => "⭐",
        4 => "💎",
        5 => "👑",
        _ => "❓",
    }
}
