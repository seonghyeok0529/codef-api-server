const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

const realEstateRouter = require('./routes/realEstate');

const encryptRouter = require('./routes/encrypt');
app.use('/encrypt', encryptRouter);

app.use('/real-estate', realEstateRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
