
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const logsRouter = require('./routes/logs');
const appointmentRouter = require('./routes/appointments')
const newUserRouter = require('./routes/guestAuth');
const staffRouter = require('./routes/staff');
const adminRouter = require('./routes/admin'); // Admin management
const app = express();

app.use(cors());
app.use(express.json());



app.use('/api/logs', authenticate, logsRouter);
app.use('/api/appointments', authenticate, appointmentRouter);

app.use('/api/new-user', newUserRouter); // SRM-01 (User registration)
app.use('/api/staff', staffRouter); // SRM-02 (Staff management)
app.use('/api/auth', authRouter); // All authentication (login) endpoints
app.use('/api/admin', adminRouter); // Admin-specific endpoints

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));