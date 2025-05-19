const express = require('express');
const cors = require('cors');
const app = express();

// Routes
const logsRouter = require('./routes/logs');
const newUserRouter = require('./routes/newUser');
const staffRouter = require('./routes/staff');
const authRouter = require('./routes/auth'); // Main auth router
const adminRouter = require('./routes/admin'); // Admin management

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/logs', logsRouter); // Existing logs endpoint
app.use('/api/new-user', newUserRouter); // SRM-01 (User registration)
app.use('/api/staff', staffRouter); // SRM-02 (Staff management)
app.use('/api/auth', authRouter); // All authentication (login) endpoints
app.use('/api/admin', adminRouter); // Admin-specific endpoints

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));