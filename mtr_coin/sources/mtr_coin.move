module mtr_coin::mtr_coin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::TxContext;

    /// The type identifier of MTR coin
    public struct MTR_COIN has drop {}

    /// Module initializer is called once on module publish
    fun init(witness: MTR_COIN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            6,
            b"MTR",
            b"Meter Token",
            b"Meter Token for Bridge",
            option::none(),
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx));
    }

    public entry fun mint(
        treasury: &mut TreasuryCap<MTR_COIN>, 
        amount: u64, 
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    public entry fun burn(
        treasury: &mut TreasuryCap<MTR_COIN>,
        coin: Coin<MTR_COIN>
    ) {
        coin::burn(treasury, coin);
    }
}