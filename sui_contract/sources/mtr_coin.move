module sui_contract::mtr_coin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option;

    /// The type identifier of MTR coin
    public struct MTR_COIN has drop {}

    /// Module initializer is called once on module publish
    fun init(witness: MTR_COIN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            6,                  // Decimals
            b"MTR",            // Symbol
            b"MTR Token",      // Name
            b"Bridge Token",   // Description
            option::none(),    // Icon URL
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx));
    }

    /// Manager can mint new coins
    public fun mint(
        treasury_cap: &mut TreasuryCap<MTR_COIN>, 
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// Manager can burn coins
    public fun burn(
        treasury_cap: &mut TreasuryCap<MTR_COIN>,
        coin: Coin<MTR_COIN>,
        _ctx: &mut TxContext
    ) {
        coin::burn(treasury_cap, coin);
    }

    #[test_only]
    /// Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(MTR_COIN {}, ctx)
    }
} 