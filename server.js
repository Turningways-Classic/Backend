
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const logsRouter = require('./routes/logs');
const appointmentRouter = require('./routes/appointments')
const guestRouter = require('./routes/guestAuth')
const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/auth', authRouter);
app.use('/api/auth', authRouter);

app.use('/api/logs', authenticate, logsRouter);
app.use('/api/appointments', authenticate, appointmentRouter);
app.use('/api/guest/create',  guestRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));