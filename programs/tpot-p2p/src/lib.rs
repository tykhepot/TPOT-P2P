use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub mod dispute;
pub mod escrow;
pub mod order;
pub mod reputation;
pub mod utils;

pub use dispute::*;
pub use escrow::*;
pub use order::*;
pub use reputation::*;
pub use utils::*;

declare_id!("6YYc6JKwDftka6eWAALmAwNoprnz8ZCh3AZFbSdn4LVu");

pub const PLATFORM_FEE: u64 = 50;
pub const DISPUTE_FEE: u64 = 100;
pub const ORDER_EXPIRY: i64 = 86400;

#[program]
pub mod tpot_p2p {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, platform_fee: u64, dispute_fee: u64) -> Result<()> {
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

    pub fn create_buy_order(
        ctx: Context<CreateBuyOrder>,
        order_id: u64,
        amount: u64,
        price: u64,
        payment_method: String,
        min_limit: u64,
        max_limit: u64,
    ) -> Result<()> {
        require!(
            !ctx.accounts.platform_config.paused,
            P2PError::PlatformPaused
        );
        require!(amount > 0, P2PError::InvalidAmount);
        require!(price > 0, P2PError::InvalidPrice);
        require!(min_limit <= max_limit, P2PError::InvalidLimit);
        require!(payment_method.len() <= 16, P2PError::PaymentMethodTooLong);

        let clock = Clock::get()?;
        let order = &mut ctx.accounts.order;
        order.order_id = order_id;
        order.maker = ctx.accounts.maker.key();
        order.taker = None;
        order.order_type = OrderType::Buy;
        order.token_mint = ctx.accounts.token_mint.key();
        order.amount = amount;
        order.price = price;
        order.payment_method = payment_method.clone();
        order.status = OrderStatus::Pending;
        order.created_at = clock.unix_timestamp;
        order.expires_at = clock.unix_timestamp + ORDER_EXPIRY;
        order.min_limit = min_limit;
        order.max_limit = max_limit;
        order.bump = ctx.bumps.order;

        let profile = &mut ctx.accounts.maker_profile;
        if profile.wallet == Pubkey::default() {
            profile.wallet = ctx.accounts.maker.key();
            profile.bump = ctx.bumps.maker_profile;
        }
        profile.total_orders += 1;
        profile.updated_at = clock.unix_timestamp;

        emit!(OrderCreated {
            order_id,
            maker: ctx.accounts.maker.key(),
            order_type: OrderType::Buy,
            amount,
            price,
        });
        Ok(())
    }

    pub fn create_sell_order(
        ctx: Context<CreateSellOrder>,
        order_id: u64,
        amount: u64,
        price: u64,
        payment_method: String,
        min_limit: u64,
        max_limit: u64,
    ) -> Result<()> {
        require!(amount > 0, P2PError::InvalidAmount);
        require!(price > 0, P2PError::InvalidPrice);
        require!(min_limit <= max_limit, P2PError::InvalidLimit);
        require!(payment_method.len() <= 16, P2PError::PaymentMethodTooLong);

        let clock = Clock::get()?;
        let order = &mut ctx.accounts.order;
        order.order_id = order_id;
        order.maker = ctx.accounts.maker.key();
        order.taker = None;
        order.order_type = OrderType::Sell;
        order.token_mint = ctx.accounts.token_mint.key();
        order.amount = amount;
        order.price = price;
        order.payment_method = payment_method.clone();
        order.status = OrderStatus::Pending;
        order.created_at = clock.unix_timestamp;
        order.expires_at = clock.unix_timestamp + ORDER_EXPIRY;
        order.min_limit = min_limit;
        order.max_limit = max_limit;
        order.bump = ctx.bumps.order;

        let escrow = &mut ctx.accounts.escrow;
        escrow.order_id = order_id;
        escrow.seller = ctx.accounts.maker.key();
        escrow.buyer = Pubkey::default();
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.amount = amount;
        escrow.status = EscrowStatus::Locked;
        escrow.created_at = clock.unix_timestamp;
        escrow.release_signature = None;
        escrow.bump = ctx.bumps.escrow;

        let profile = &mut ctx.accounts.maker_profile;
        if profile.wallet == Pubkey::default() {
            profile.wallet = ctx.accounts.maker.key();
            profile.bump = ctx.bumps.maker_profile;
        }
        profile.total_orders += 1;
        profile.updated_at = clock.unix_timestamp;

        emit!(OrderCreated {
            order_id,
            maker: ctx.accounts.maker.key(),
            order_type: OrderType::Sell,
            amount,
            price,
        });
        Ok(())
    }

    pub fn deposit_escrow(ctx: Context<DepositEscrow>, order_id: u64) -> Result<()> {
        let order = &ctx.accounts.order;
        require!(
            order.order_type == OrderType::Sell,
            P2PError::InvalidOrderType
        );
        require!(
            order.maker == ctx.accounts.maker.key(),
            P2PError::NotAuthorized
        );

        let cpi_accounts = Transfer {
            from: ctx.accounts.maker_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.maker.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            order.amount,
        )?;

        emit!(EscrowLocked {
            order_id,
            amount: order.amount,
            seller: ctx.accounts.maker.key(),
        });
        Ok(())
    }

    pub fn take_order(ctx: Context<TakeOrder>, order_id: u64, amount: u64) -> Result<()> {
        require!(
            !ctx.accounts.platform_config.paused,
            P2PError::PlatformPaused
        );

        let order = &mut ctx.accounts.order;
        require!(
            order.status == OrderStatus::Pending,
            P2PError::OrderNotPending
        );
        require!(order.taker.is_none(), P2PError::OrderAlreadyTaken);

        let clock = Clock::get()?;
        require!(
            !is_order_expired(order.expires_at, clock.unix_timestamp),
            P2PError::OrderExpired
        );
        require!(
            amount >= order.min_limit && amount <= order.max_limit,
            P2PError::InvalidAmount
        );

        order.taker = Some(ctx.accounts.taker.key());
        order.amount = amount;
        order.status = OrderStatus::Matched;

        if order.order_type == OrderType::Buy {
            let escrow = &mut ctx.accounts.escrow;
            escrow.order_id = order_id;
            escrow.seller = order.maker;
            escrow.buyer = ctx.accounts.taker.key();
            escrow.token_mint = order.token_mint;
            escrow.amount = amount;
            escrow.status = EscrowStatus::Locked;
            escrow.created_at = clock.unix_timestamp;
            escrow.bump = ctx.bumps.escrow;
        } else {
            let escrow = &mut ctx.accounts.escrow;
            escrow.buyer = ctx.accounts.taker.key();
        }

        let profile = &mut ctx.accounts.taker_profile;
        if profile.wallet == Pubkey::default() {
            profile.wallet = ctx.accounts.taker.key();
            profile.bump = ctx.bumps.taker_profile;
        }
        profile.total_trades += 1;
        profile.updated_at = clock.unix_timestamp;

        emit!(OrderTaken {
            order_id,
            taker: ctx.accounts.taker.key(),
        });
        Ok(())
    }

    pub fn confirm_payment(
        ctx: Context<ConfirmPayment>,
        order_id: u64,
        _payment_proof: String,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        require!(
            order.status == OrderStatus::Matched,
            P2PError::OrderNotMatched
        );

        let is_buyer = if order.order_type == OrderType::Buy {
            order.maker == ctx.accounts.payer.key()
        } else {
            order.taker.unwrap() == ctx.accounts.payer.key()
        };
        require!(is_buyer, P2PError::NotBuyer);

        order.status = OrderStatus::Paid;

        emit!(PaymentConfirmed {
            order_id,
            payer: ctx.accounts.payer.key(),
        });
        Ok(())
    }

    pub fn release_tokens(ctx: Context<ReleaseTokens>, order_id: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        require!(order.status == OrderStatus::Paid, P2PError::OrderNotPaid);

        let is_seller = if order.order_type == OrderType::Sell {
            order.maker == ctx.accounts.seller.key()
        } else {
            order.taker.unwrap() == ctx.accounts.seller.key()
        };
        require!(is_seller, P2PError::NotSeller);

        let escrow = &mut ctx.accounts.escrow;
        let fee = calculate_fee(order.amount, ctx.accounts.platform_config.platform_fee);
        let release_amount = order.amount.checked_sub(fee).unwrap();

        let order_id_bytes = order_id.to_le_bytes();
        let seeds = &[b"escrow", order_id_bytes.as_ref(), &[escrow.bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            release_amount,
        )?;

        if fee > 0 {
            let fee_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.fee_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    fee_accounts,
                    signer,
                ),
                fee,
            )?;
        }

        order.status = OrderStatus::Completed;
        escrow.status = EscrowStatus::Released;

        let buyer = if order.order_type == OrderType::Sell {
            order.taker.unwrap()
        } else {
            order.maker
        };

        ctx.accounts.maker_profile.completed_trades += 1;
        ctx.accounts.maker_profile.add_reputation(10);
        ctx.accounts.maker_profile.update_completion_rate();

        ctx.accounts.taker_profile.completed_trades += 1;
        ctx.accounts.taker_profile.add_reputation(10);
        ctx.accounts.taker_profile.update_completion_rate();

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

    pub fn cancel_order(ctx: Context<CancelOrder>, order_id: u64, _reason: String) -> Result<()> {
        let order = &mut ctx.accounts.order;

        let can_cancel = order.status == OrderStatus::Pending
            || (order.status == OrderStatus::Matched && order.taker.is_none());
        require!(can_cancel, P2PError::OrderCannotCancel);

        let is_maker = order.maker == ctx.accounts.canceler.key();
        let is_taker = order
            .taker
            .map(|t| t == ctx.accounts.canceler.key())
            .unwrap_or(false);
        require!(is_maker || is_taker, P2PError::NotAuthorized);

        order.status = OrderStatus::Cancelled;

        if order.order_type == OrderType::Sell {
            let escrow = &mut ctx.accounts.escrow;

            let order_id_bytes = order_id.to_le_bytes();
            let seeds = &[b"escrow", order_id_bytes.as_ref(), &[escrow.bump]];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer,
                ),
                order.amount,
            )?;

            escrow.status = EscrowStatus::Refunded;
        }

        ctx.accounts.canceler_profile.cancelled_trades += 1;
        ctx.accounts.canceler_profile.subtract_reputation(5);
        ctx.accounts.canceler_profile.update_completion_rate();

        emit!(OrderCancelled {
            order_id,
            canceler: ctx.accounts.canceler.key(),
        });
        Ok(())
    }

    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        order_id: u64,
        reason: String,
        evidence_hashes: Vec<[u8; 32]>,
    ) -> Result<()> {
        require!(
            !ctx.accounts.platform_config.paused,
            P2PError::PlatformPaused
        );

        let order = &mut ctx.accounts.order;
        require!(
            order.status == OrderStatus::Matched || order.status == OrderStatus::Paid,
            P2PError::OrderNotMatched
        );

        let is_participant = order.maker == ctx.accounts.disputer.key()
            || order
                .taker
                .map(|t| t == ctx.accounts.disputer.key())
                .unwrap_or(false);
        require!(is_participant, P2PError::NotParticipant);

        let clock = Clock::get()?;
        let dispute = &mut ctx.accounts.dispute;
        dispute.dispute_id = true;
        dispute.order_id = order_id;
        dispute.plaintiff = ctx.accounts.disputer.key();
        dispute.defendant = if order.maker == ctx.accounts.disputer.key() {
            order.taker.unwrap()
        } else {
            order.maker
        };
        dispute.arbitrator = ctx.accounts.platform_config.authority;
        dispute.reason = reason.clone();
        dispute.evidence_hashes = evidence_hashes;
        dispute.status = DisputeStatus::Opened;
        dispute.ruling = None;
        dispute.created_at = clock.unix_timestamp;
        dispute.resolved_at = None;
        dispute.bump = ctx.bumps.dispute;

        order.status = OrderStatus::Disputed;

        emit!(DisputeOpened {
            order_id,
            plaintiff: ctx.accounts.disputer.key(),
            reason,
        });
        Ok(())
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        order_id: u64,
        ruling: Ruling,
    ) -> Result<()> {
        require!(
            ctx.accounts.arbitrator.key() == ctx.accounts.platform_config.authority,
            P2PError::NotArbitrator
        );

        let order = &mut ctx.accounts.order;
        require!(
            order.status == OrderStatus::Disputed,
            P2PError::DisputeNotOpen
        );

        let dispute = &mut ctx.accounts.dispute;
        require!(
            dispute.status == DisputeStatus::Opened,
            P2PError::DisputeNotOpen
        );

        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.escrow;
        let order_id_bytes = order_id.to_le_bytes();
        let seeds = &[b"escrow", order_id_bytes.as_ref(), &[escrow.bump]];
        let signer = &[&seeds[..]];

        let transfer_amount = match &ruling {
            Ruling::FavorBuyer => order.amount,
            Ruling::FavorSeller => order.amount,
            Ruling::Split => order.amount / 2,
        };

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            transfer_amount,
        )?;

        escrow.status = match &ruling {
            Ruling::FavorBuyer => EscrowStatus::Released,
            Ruling::FavorSeller => EscrowStatus::Refunded,
            Ruling::Split => EscrowStatus::Released,
        };

        dispute.status = DisputeStatus::Resolved;
        dispute.ruling = Some(ruling.clone());
        dispute.resolved_at = Some(clock.unix_timestamp);

        order.status = OrderStatus::Arbitrated;

        emit!(DisputeResolved { order_id, ruling });
        Ok(())
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.platform_config.authority,
            P2PError::NotAuthorized
        );
        ctx.accounts.platform_config.paused = true;
        Ok(())
    }

    pub fn resume(ctx: Context<Resume>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.platform_config.authority,
            P2PError::NotAuthorized
        );
        ctx.accounts.platform_config.paused = false;
        Ok(())
    }
}
