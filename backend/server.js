const express = require('express');
const cors = require('cors');
const bridgeRoutes = require('./routes/bridgeRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/bridge', bridgeRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 