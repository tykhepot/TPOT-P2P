use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount, Mint};

// 模块导入  
pub mod accounts;
pub mod order;
pub mod escrow;
pub mod dispute;
pub mod reputation;
pub mod utils;

// 重新导出
pub use accounts::*;
pub use order::*;
pub use escrow::*;
pub use dispute::*;
pub use reputation::*;
pub use utils::*;

// 常量定义
pub const PLATFORM_FEE: u64 = 50;
pub const DISPUTE_FEE: u64 = 100;
pub const ESCROW_TIMEOUT: i64 = 3600;
pub const PAYMENT_TIMEOUT: i64 = 1800;
pub const MIN_REPUTATION: u32 = 0;
pub const MAX_ORDER_AMOUNT: u64 = 1_000_000_000_000;

declare_id!("TPOTP2P11111111111111111111111111111111111");

#[program]
pub mod tpot_p2p {
    use super::*;

    /// 初始化平台配置
    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee: u64,
        dispute_fee: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.platform_fee = platform_fee;
        config.dispute_fee = dispute_fee;
        config.paused = false;
        config.bump = ctx.bumps.platform_config;
        
        emit!(PlatformInitialized {
            authority: ctx.accounts.authority.key(),
            platform_fee,
        });
        
        Ok(())
    }

    /// 创建买单
    pub fn create_buy_order(
        ctx: Context<CreateBuyOrder>,
        order_id: u64,
        amount: u64,
        price: u64,
        payment_method: String,
        min_limit: u64,
        max_limit: u64,
    ) -> Result<()> {
        // 验证输入
        require!(amount > 0, P2PError::InvalidAmount);
        require!(price > 0, P2PError::InvalidPrice);
        require!(min_limit <= max_limit, P2PError::InvalidLimit);
        require!(payment_method.len() <= 50, P2PError::PaymentMethodTooLong);
        
        // 检查平台状态
        let config = &ctx.accounts.platform_config;
        require!(!config.paused, P2PError::PlatformPaused);
        
        // 创建订单
        let order = &mut ctx.accounts.order;
        order.order_id = order_id;
        order.maker = ctx.accounts.maker.key();
        order.taker = None;
        order.order_type = OrderType::Buy;
        order.token_mint = ctx.accounts.token_mint.key();
        order.amount = amount;
        order.price = price;
        order.total_value = amount * price;
        order.payment_method = payment_method;
        order.status = OrderStatus::Pending;
        order.escrow_account = Pubkey::default();
        order.created_at = Clock::get()?.unix_timestamp;
        order.expires_at = Clock::get()?.unix_timestamp + 86400; // 24小时过期
        order.min_limit = min_limit;
        order.max_limit = max_limit;
        order.bump = ctx.bumps.order;
        
        // 更新用户统计
        let maker_profile = &mut ctx.accounts.maker_profile;
        maker_profile.total_orders += 1;
        
        emit!(OrderCreated {
            order_id,
            maker: ctx.accounts.maker.key(),
            order_type: OrderType::Buy,
            amount,
            price,
        });
        
        Ok(())
    }

    /// 创建卖单
    pub fn create_sell_order(
        ctx: Context<CreateSellOrder>,
        order_id: u64,
        amount: u64,
        price: u64,
        payment_method: String,
        min_limit: u64,
        max_limit: u64,
    ) -> Result<()> {
        // 验证输入
        require!(amount > 0, P2PError::InvalidAmount);
        require!(price > 0, P2PError::InvalidPrice);
        require!(min_limit <= max_limit, P2PError::InvalidLimit);
        require!(payment_method.len() <= 50, P2PError::PaymentMethodTooLong);
        
        // 检查平台状态
        let config = &ctx.accounts.platform_config;
        require!(!config.paused, P2PError::PlatformPaused);
        
        // 将代币锁定到托管账户
        let seeds = &[
            b"escrow",
            &order_id.to_le_bytes(),
            &[ctx.bumps.escrow],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.maker_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;
        
        // 创建订单
        let order = &mut ctx.accounts.order;
        order.order_id = order_id;
        order.maker = ctx.accounts.maker.key();
        order.taker = None;
        order.order_type = OrderType::Sell;
        order.token_mint = ctx.accounts.token_mint.key();
        order.amount = amount;
        order.price = price;
        order.total_value = amount * price;
        order.payment_method = payment_method;
        order.status = OrderStatus::Pending;
        order.escrow_account = ctx.accounts.escrow.key();
        order.created_at = Clock::get()?.unix_timestamp;
        order.expires_at = Clock::get()?.unix_timestamp + 86400;
        order.min_limit = min_limit;
        order.max_limit = max_limit;
        order.bump = ctx.bumps.order;
        
        // 更新托管账户状态
        let escrow = &mut ctx.accounts.escrow;
        escrow.order_id = order_id;
        escrow.seller = ctx.accounts.maker.key();
        escrow.buyer = Pubkey::default();
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.amount = amount;
        escrow.status = EscrowStatus::Locked;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;
        
        // 更新用户统计
        let maker_profile = &mut ctx.accounts.maker_profile;
        maker_profile.total_orders += 1;
        
        emit!(OrderCreated {
            order_id,
            maker: ctx.accounts.maker.key(),
            order_type: OrderType::Sell,
            amount,
            price,
        });
        
        emit!(EscrowLocked {
            order_id,
            amount,
            seller: ctx.accounts.maker.key(),
        });
        
        Ok(())
    }

    /// 接单
    pub fn take_order(ctx: Context<TakeOrder>, order_id: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let config = &ctx.accounts.platform_config;
        
        // 验证订单状态
        require!(order.status == OrderStatus::Pending, P2PError::OrderNotPending);
        require!(order.taker.is_none(), P2PError::OrderAlreadyTaken);
        
        // 检查是否过期
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time < order.expires_at, P2PError::OrderExpired);
        
        // 如果是买单，接单者需要锁定代币
        if order.order_type == OrderType::Buy {
            let seeds = &[
                b"escrow",
                &order_id.to_le_bytes(),
                &[ctx.bumps.escrow],
            ];
            let signer_seeds = &[&seeds[..]];
            
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.taker_token_account.to_account_info(),
                        to: ctx.accounts.escrow_token_account.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                order.amount,
            )?;
            
            // 更新托管账户
            let escrow = &mut ctx.accounts.escrow;
            escrow.order_id = order_id;
            escrow.seller = ctx.accounts.taker.key();
            escrow.buyer = order.maker;
            escrow.amount = order.amount;
            escrow.status = EscrowStatus::Locked;
            escrow.created_at = current_time;
        }
        
        // 更新订单状态
        order.taker = Some(ctx.accounts.taker.key());
        order.status = OrderStatus::Matched;
        order.escrow_account = ctx.accounts.escrow.key();
        
        // 更新用户统计
        let taker_profile = &mut ctx.accounts.taker_profile;
        taker_profile.total_orders += 1;
        
        emit!(OrderTaken {
            order_id,
            taker: ctx.accounts.taker.key(),
        });
        
        Ok(())
    }

    /// 确认付款
    pub fn confirm_payment(
        ctx: Context<ConfirmPayment>,
        order_id: u64,
        payment_proof: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        
        // 验证订单状态
        require!(order.status == OrderStatus::Matched, P2PError::OrderNotMatched);
        
        // 验证是否是买方
        let is_buyer = match order.order_type {
            OrderType::Buy => order.maker == ctx.accounts.payer.key(),
            OrderType::Sell => order.taker.unwrap() == ctx.accounts.payer.key(),
        };
        require!(is_buyer, P2PError::NotBuyer);
        
        // 更新订单状态
        order.status = OrderStatus::Paid;
        order.payment_proof = Some(payment_proof);
        order.payment_time = Some(Clock::get()?.unix_timestamp);
        
        emit!(PaymentConfirmed {
            order_id,
            payer: ctx.accounts.payer.key(),
        });
        
        Ok(())
    }

    /// 释放代币
    pub fn release_tokens(ctx: Context<ReleaseTokens>, order_id: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let escrow = &mut ctx.accounts.escrow;
        let config = &ctx.accounts.platform_config;
        
        // 验证订单状态
        require!(order.status == OrderStatus::Paid, P2PError::OrderNotPaid);
        
        // 验证是否是卖方
        let is_seller = match order.order_type {
            OrderType::Buy => order.taker.unwrap() == ctx.accounts.seller.key(),
            OrderType::Sell => order.maker == ctx.accounts.seller.key(),
        };
        require!(is_seller, P2PError::NotSeller);
        
        // 计算手续费
        let fee = order.total_value * config.platform_fee / 10000;
        let release_amount = order.amount - (fee * order.amount / order.total_value);
        
        // 确定接收者
        let buyer = match order.order_type {
            OrderType::Buy => order.maker,
            OrderType::Sell => order.taker.unwrap(),
        };
        
        // 释放代币给买方
        let seeds = &[
            b"escrow",
            &order_id.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: escrow.to_account_info(),
                },
                signer_seeds,
            ),
            release_amount,
        )?;
        
        // 转移手续费到平台
        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.fee_token_account.to_account_info(),
                        authority: escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                order.amount - release_amount,
            )?;
        }
        
        // 更新状态
        order.status = OrderStatus::Completed;
        order.completed_at = Some(Clock::get()?.unix_timestamp);
        escrow.status = EscrowStatus::Released;
        
        // 更新信誉
        let maker_profile = &mut ctx.accounts.maker_profile;
        maker_profile.total_trades += 1;
        maker_profile.reputation = maker_profile.reputation.saturating_add(2);
        
        let taker_profile = &mut ctx.accounts.taker_profile;
        taker_profile.total_trades += 1;
        taker_profile.reputation = taker_profile.reputation.saturating_add(2);
        
        emit!(TokensReleased {
            order_id,
            buyer,
            amount: release_amount,
        });
        
        emit!(OrderCompleted {
            order_id,
            buyer,
            seller: ctx.accounts.seller.key(),
        });
        
        Ok(())
    }

    /// 取消订单
    pub fn cancel_order(ctx: Context<CancelOrder>, order_id: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        
        // 验证订单状态
        require!(
            order.status == OrderStatus::Pending || order.status == OrderStatus::Matched,
            P2PError::OrderCannotCancel
        );
        
        // 验证权限
        let is_maker = order.maker == ctx.accounts.canceler.key();
        let is_taker = order.taker.map(|t| t == ctx.accounts.canceler.key()).unwrap_or(false);
        require!(is_maker || is_taker, P2PError::NotAuthorized);
        
        // 如果有托管，退还代币
        if order.escrow_account != Pubkey::default() {
            let escrow = &ctx.accounts.escrow;
            
            let seeds = &[
                b"escrow",
                &order_id.to_le_bytes(),
                &[escrow.bump],
            ];
            let signer_seeds = &[&seeds[..]];
            
            // 确定退还给谁
            let refund_account = match order.order_type {
                OrderType::Buy => ctx.accounts.seller_token_account.to_account_info(),
                OrderType::Sell => ctx.accounts.maker_token_account.to_account_info(),
            };
            
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: refund_account,
                        authority: escrow.to_account_info(),
                    },
                    signer_seeds,
                ),
                escrow.amount,
            )?;
        }
        
        // 更新状态
        order.status = OrderStatus::Cancelled;
        order.cancelled_at = Some(Clock::get()?.unix_timestamp);
        order.cancel_reason = Some("User cancelled".to_string());
        
        // 更新信誉（取消会扣分）
        let canceler_profile = &mut ctx.accounts.canceler_profile;
        canceler_profile.reputation = canceler_profile.reputation.saturating_sub(5);
        
        emit!(OrderCancelled {
            order_id,
            canceler: ctx.accounts.canceler.key(),
        });
        
        Ok(())
    }

    /// 开启争议
    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        order_id: u64,
        reason: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let config = &ctx.accounts.platform_config;
        
        // 验证订单状态
        require!(order.status == OrderStatus::Paid, P2PError::OrderNotPaid);
        
        // 验证权限
        let is_participant = order.maker == ctx.accounts.disputer.key()
            || order.taker.map(|t| t == ctx.accounts.disputer.key()).unwrap_or(false);
        require!(is_participant, P2PError::NotParticipant);
        
        // 创建争议
        let dispute = &mut ctx.accounts.dispute;
        dispute.dispute_id = ctx.accounts.dispute.to_account_info().key() == ctx.accounts.dispute.key();
        dispute.order_id = order_id;
        dispute.plaintiff = ctx.accounts.disputer.key();
        dispute.defendant = if order.maker == ctx.accounts.disputer.key() {
            order.taker.unwrap()
        } else {
            order.maker
        };
        dispute.arbitrator = config.authority;
        dispute.reason = reason;
        dispute.evidence_hashes = Vec::new();
        dispute.status = DisputeStatus::Opened;
        dispute.ruling = None;
        dispute.created_at = Clock::get()?.unix_timestamp;
        dispute.resolved_at = None;
        dispute.bump = ctx.bumps.dispute;
        
        // 更新订单状态
        order.status = OrderStatus::Disputed;
        
        emit!(DisputeOpened {
            order_id,
            plaintiff: ctx.accounts.disputer.key(),
            reason: dispute.reason.clone(),
        });
        
        Ok(())
    }

    /// 解决争议
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        order_id: u64,
        ruling: Ruling,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let dispute = &mut ctx.accounts.dispute;
        let escrow = &ctx.accounts.escrow;
        let config = &ctx.accounts.platform_config;
        
        // 验证权限
        require!(
            ctx.accounts.arbitrator.key() == config.authority,
            P2PError::NotArbitrator
        );
        
        // 验证争议状态
        require!(dispute.status == DisputeStatus::Opened, P2PError::DisputeNotOpen);
        
        let seeds = &[
            b"escrow",
            &order_id.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        
        // 根据裁决释放资金
        match ruling {
            Ruling::FavorBuyer => {
                // 释放给买方
                let buyer = match order.order_type {
                    OrderType::Buy => order.maker,
                    OrderType::Sell => order.taker.unwrap(),
                };
                
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow_token_account.to_account_info(),
                            to: ctx.accounts.buyer_token_account.to_account_info(),
                            authority: escrow.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    escrow.amount,
                )?;
            }
            Ruling::FavorSeller => {
                // 退还给卖方
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow_token_account.to_account_info(),
                            to: ctx.accounts.seller_token_account.to_account_info(),
                            authority: escrow.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    escrow.amount,
                )?;
            }
            Ruling::Split => {
                // 平分
                let half = escrow.amount / 2;
                
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow_token_account.to_account_info(),
                            to: ctx.accounts.buyer_token_account.to_account_info(),
                            authority: escrow.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    half,
                )?;
                
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow_token_account.to_account_info(),
                            to: ctx.accounts.seller_token_account.to_account_info(),
                            authority: escrow.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    half,
                )?;
            }
        }
        
        // 更新状态
        dispute.status = DisputeStatus::Resolved;
        dispute.ruling = Some(ruling.clone());
        dispute.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        order.status = OrderStatus::Arbitrated;
        order.completed_at = Some(Clock::get()?.unix_timestamp);
        
        // 更新信誉
        match ruling {
            Ruling::FavorBuyer => {
                // 买方胜诉
            }
            Ruling::FavorSeller => {
                // 卖方胜诉
            }
            Ruling::Split => {
                // 平分
            }
        }
        
        emit!(DisputeResolved {
            order_id,
            ruling: ruling.clone(),
        });
        
        emit!(OrderCompleted {
            order_id,
            buyer: order.taker.unwrap(),
            seller: order.maker,
        });
        
        Ok(())
    }

    /// 暂停平台
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            P2PError::NotAuthorized
        );
        config.paused = true;
        Ok(())
    }

    /// 恢复平台
    pub fn resume(ctx: Context<Resume>) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            P2PError::NotAuthorized
        );
        config.paused = false;
        Ok(())
    }
}
