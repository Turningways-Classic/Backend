//Raji@olalekan1234
const express = require('express');
const cors = require('cors');
const app = express();

// Routes
const logsRouter = require('./routes/logs');
const newUserRouter = require('./routes/newUser');
const staffRouter = require('./routes/staff'); // Add this line

app.use(cors());
app.use(express.json());

// Existing routes
app.use('/api/logs', logsRouter);
app.use('/api/new-user', newUserRouter);
app.use('/api/staff', staffRouter); // Add this line

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

