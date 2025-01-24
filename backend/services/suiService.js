const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { SuiClient } = require('@mysten/sui.js/client');
const { fromB64 } = require('@mysten/sui.js/utils');
require('dotenv').config();

// Configurare
const FULLNODE_URL = 'https://fullnode.devnet.sui.io:443';
const suiClient = new SuiClient({ url: FULLNODE_URL });

// Citește variabilele de mediu
const PACKAGE_ID = process.env.SUI_PACKAGE_OBJECT_ID;
const TREASURY_CAP = process.env.SUI_TREASURYCAP_OBJECT_ID;
const MNEMONIC = process.env.SUI_SEED_PHRASE;

if (!PACKAGE_ID || !TREASURY_CAP || !MNEMONIC) {
    console.error("Missing required environment variables for SUI service");
    process.exit(1);
}

// Creează keypair din seed phrase
const keypair = Ed25519Keypair.deriveKeypair(MNEMONIC);

const truncateAmount = (amount) => {
    return Math.floor(amount * 1e6) / 1e6;
};

const to6decimals = (amount) => {
    return truncateAmount(amount) * 1e6;
}

const mint = async (recipientAddress, amount) => {
    try {
        console.log(`Minting ${amount} MTR to ${recipientAddress}`);
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${PACKAGE_ID}::mtr_coin::mint`,
            arguments: [
                tx.pure(TREASURY_CAP),
                tx.pure(Math.floor(Number(amount) * 1e6)), // Convert to smallest unit
                tx.pure(recipientAddress)
            ]
        });

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
        });

        console.log("Mint transaction result:", result);
        return result.digest;
    } catch (error) {
        console.error("Error in SUI mint:", error);
        throw error;
    }
};

const burn = async (senderAddress, amount) => {
    try {
        console.log('Burn parameters:', {
            PACKAGE_ID,
            TREASURY_CAP,
            senderAddress,
            amount: Math.floor(Number(amount) * 1e6)
        });
        
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${PACKAGE_ID}::mtr_coin::burn`,
            arguments: [
                tx.pure(TREASURY_CAP),
                tx.pure(Math.floor(Number(amount) * 1e6)), // Convert to smallest unit
                tx.pure(senderAddress)
            ]
        });

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
        });

        console.log("Burn transaction result:", result);
        return result.digest;
    } catch (error) {
        console.error("Detailed error in SUI burn:", {
            error: error.message,
            stack: error.stack,
            details: error
        });
        throw error;
    }
};

module.exports = { mint, burn };
