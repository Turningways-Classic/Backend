require('dotenv').config();
const express = require('express');
const cors = require('cors');
const visitorRoutes = require('./routes/visitorRoutes');
const generalRoutes = require('./routes/generalRoutes');
const staffRoutes = require('./routes/staffRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
require('./cron/autoSignOut');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/staff', staffRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api', generalRoutes);
app.use('/api/superadmin', superAdminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Trakar backend running on port ${PORT}`));