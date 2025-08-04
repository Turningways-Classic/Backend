require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const visitorRoutes = require('./routes/visitorRoutes');
const generalRoutes = require('./routes/generalRoutes');
const staffRoutes = require('./routes/staffRoutes');
const orgRoutes = require('./routes/orgRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const superAdminRoutes = require('./routes/superadminRoutes');
require('./cron/autoSignOut');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));



app.use(cors());
app.use(express.json());
app.use('/api/staff', staffRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api', generalRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.get('/staff-signin', (req, res) => {
  res.render('staff-signin');
});
app.get('/staff-logout', (req, res) => {
  res.render('logout');
});
app.use('/api/feedback', feedbackRoutes )
app.use('/api/organization', orgRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Trakar backend running on port ${PORT}`));