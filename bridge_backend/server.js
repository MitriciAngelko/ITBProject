const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ... restul codului

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 