require('dotenv').config();
const express = require('express');
const cors = require('cors');
const visitorRoutes = require('./routes/visitorRoutes');
const staffRoutes = require('./routes/staffRoutes');
const http = require('http');
require('./cron/autoSignOut');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/staff', staffRoutes);
app.use('/api/visitor', visitorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Trakar backend running on port ${PORT}`));

