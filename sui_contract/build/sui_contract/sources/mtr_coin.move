module sui_contract::mtr_coin;

use sui::coin::{Coin, Self, TreasuryCap};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use std::option;

public struct MTR_COIN has drop {}

fun init(witness: MTR_COIN, ctx: &mut TxContext) {
		let (treasury, metadata) = coin::create_currency(
				witness,
				6,
				b"MTR",
				b"MTR",
				b"MTR",
				option::none(),
				ctx,
		);
		transfer::public_freeze_object(metadata);
		transfer::public_transfer(treasury, ctx.sender());
}

public fun mint(
		treasury_cap: &mut TreasuryCap<MTR_COIN>,
		amount: u64,
		recipient: address,
		ctx: &mut TxContext,
){
		let coin = coin::mint(treasury_cap, amount, ctx);
		transfer::public_transfer(coin, recipient);
}

public fun burn(
        treasury_cap: &mut TreasuryCap<MTR_COIN>,
        coin: &mut Coin<MTR_COIN>,
        amount: u64,
        ctx: &mut TxContext,
) {
        let cut_coin = coin::split(coin, amount, ctx);
        let _amount_burned = coin::burn(treasury_cap, cut_coin);
}