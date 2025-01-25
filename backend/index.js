import express from 'express';
import cors from 'cors';
import ethRoutes from './routes/ethRoutes.js';
import suiRoutes from './routes/suiRoutes.js';
import bridgeRoutes from './routes/bridgeRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.options('*', cors(corsOptions));

function authorize(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  
  const apiKey = req.headers["x-api-key"];
  if (apiKey === process.env.API_KEY) {
    next()
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
}

// admin only with api key
app.use("/api/eth", authorize, ethRoutes);
app.use("/api/sui", authorize, suiRoutes);

// public
app.use("/api/bridge", bridgeRoutes);

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port 3001");
});