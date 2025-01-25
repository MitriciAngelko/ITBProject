import express from 'express';
import { ethers } from 'ethers';
import { verifyPersonalMessage } from '@mysten/sui.js/verify';
import * as ethService from '../services/ethService.js';
import * as suiService from '../services/suiService.js';
import { fromB64, toB64 } from '@mysten/sui.js/utils';

const router = express.Router();

async function verifySignature(senderAddress, message, signature, isEthereum) {
    try {
        if (isEthereum) {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === senderAddress.toLowerCase();
        } else {
            // Pentru Sui, signature ar trebui să conțină publicKey și signature
            if (!signature || !signature.signature || !signature.publicKey) {
                console.error("Invalid Sui signature format:", signature);
                return false;
            }

            try {
                const isValid = await verifyPersonalMessage({
                    message: fromB64(signature.message), // Decodează mesajul din base64
                    signature: signature.signature,
                    publicKey: signature.publicKey
                });
                
                console.log("Sui signature verification result:", isValid);
                return isValid;
            } catch (verifyError) {
                console.error("Sui verification error:", verifyError);
                return false;
            }
        }
    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
}

router.post("/eth-to-sui", async (req, res) => {
  try {
    const { senderEthAddress, recipientSuiAddress, amount, message, signature } = req.body;
    console.log('Received request:', { senderEthAddress, recipientSuiAddress, amount, message });

    if (!senderEthAddress || !recipientSuiAddress || !amount || !message || !signature) {
      return res.status(400).json({ 
        error: "Missing required fields",
        received: { senderEthAddress, recipientSuiAddress, amount, message, signature }
      });
    }

    const isValid = await verifySignature(
      senderEthAddress,
      message,
      signature,
      true // isEthereum
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Ethereum signature" });
    }

    console.log("Burning on Ethereum...");
    const ethTxHash = await ethService.burn(senderEthAddress, amount.toString());
    console.log("Ethereum burn successful:", ethTxHash);

    console.log("Minting on SUI...");
    const suiTxHash = await suiService.mint(recipientSuiAddress, amount.toString());
    console.log("SUI mint successful:", suiTxHash);

    res.json({
      message: "ETH to SUI bridge successful",
      ethTxHash,
      suiTxHash,
    });
  } catch (err) {
    console.error('Detailed error:', err);
    res.status(500).json({ 
      error: "ETH to SUI bridge failed", 
      details: err.message,
      stack: err.stack 
    });
  }
});

router.post("/sui-to-eth", async (req, res) => {
  try {
    const { senderSuiAddress, recipientEthAddress, amount, message, signature } = req.body;
    console.log("Received SUI-to-ETH request:", {
      senderSuiAddress,
      recipientEthAddress,
      amount,
      message,
      signature
    });

    if (!senderSuiAddress || !recipientEthAddress || !amount || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isValid = await verifySignature(
      senderSuiAddress,
      message,
      signature,
      false
    );

    if (!isValid) {
      console.error("Invalid signature details:", {
        senderAddress: senderSuiAddress,
        signature: signature
      });
      return res.status(401).json({ error: "Invalid Sui signature" });
    }

    console.log("Burning on SUI...");
    const suiTxHash = await suiService.burn(senderSuiAddress, amount.toString());
    console.log("SUI burn successful:", suiTxHash);

    console.log("Minting on Ethereum...");
    const ethTxHash = await ethService.mint(recipientEthAddress, amount.toString());
    console.log("Ethereum mint successful:", ethTxHash);

    res.json({
      message: "SUI to ETH bridge successful",
      suiTxHash,
      ethTxHash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SUI to ETH bridge failed", details: err.message });
  }
});

export default router;