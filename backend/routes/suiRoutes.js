import express from 'express';
import * as suiService from '../services/suiService.js';

const router = express.Router();

router.post("/mint", async (req, res) => {
    try {
        const { address, amount } = req.body;
        const txHash = await suiService.mint(address, amount);
        res.json({ message: "Minted successfully", transactionHash: txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/burn", async (req, res) => {
    try {
        const { address, amount } = req.body;
        const txHash = await suiService.burn(address, amount);
        res.json({ message: "Burned successfully", transactionHash: txHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;