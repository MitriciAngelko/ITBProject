import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { fromB64 } from '@mysten/sui.js/utils';
import dotenv from 'dotenv';
dotenv.config();

// Configurare
const FULLNODE_URL = 'https://fullnode.devnet.sui.io:443';
const suiClient = new SuiClient({ url: FULLNODE_URL });

// Citește variabilele de mediu
const PACKAGE_ID = process.env.SUI_PACKAGE_OBJECT_ID;
const TREASURY_CAP = process.env.SUI_TREASURYCAP_OBJECT_ID.split("::")[0];
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
        console.log("Mint parameters:", {
            PACKAGE_ID,
            TREASURY_CAP,
            recipientAddress,
            amount
        });

        // Verifică dacă pachetul există
        const packageInfo = await suiClient.getObject({
            id: PACKAGE_ID,
            options: { showContent: true }
        });
        
        console.log("Package info:", packageInfo);

        if (!packageInfo || packageInfo.error) {
            throw new Error(`Invalid package ID: ${PACKAGE_ID}`);
        }

        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${PACKAGE_ID}::mtr_coin::mint`,
            arguments: [
                tx.pure(TREASURY_CAP),
                tx.pure(Math.floor(Number(amount) * 1e6)),
                tx.pure(recipientAddress)
            ]
        });

        console.log("Transaction block:", tx);

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true
            }
        });

        console.log("Mint transaction result:", result);
        return result.digest;
    } catch (error) {
        console.error("Detailed error in SUI mint:", {
            error: error.message,
            stack: error.stack,
            details: error
        });
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
        
        // Preluăm toate monedele MTR ale utilizatorului
        const coins = await suiClient.getCoins({
            owner: senderAddress,
            coinType: `${PACKAGE_ID}::mtr_coin::MTR_COIN`
        });

        if (!coins.data || coins.data.length === 0) {
            throw new Error('No MTR coins found in wallet');
        }

        // Adăugăm monedele la tranzacție
        const [primaryCoin, ...mergeCoins] = coins.data;
        const coinInput = tx.object(primaryCoin.coinObjectId);
        
        // Mergem toate monedele într-una singură dacă există mai multe
        if (mergeCoins.length > 0) {
            mergeCoins.forEach(coin => {
                tx.mergeCoins(coinInput, tx.object(coin.coinObjectId));
            });
        }

        // Calculăm suma pentru ardere
        const amountToSplit = Math.floor(Number(amount) * 1e6);

        // Separăm suma exactă pentru ardere
        const [burnCoin] = tx.splitCoins(coinInput, [tx.pure(amountToSplit)]);
        
        // Apelăm funcția burn
        tx.moveCall({
            target: `${PACKAGE_ID}::mtr_coin::burn`,
            arguments: [
                tx.object(TREASURY_CAP),
                burnCoin
            ]
        });

        const result = await suiClient.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true
            }
        });

        console.log("Burn transaction result:", result);
        return result.digest;
    } catch (error) {
        console.error("Detailed error in SUI burn:", error);
        throw error;
    }
};

export { mint, burn };
