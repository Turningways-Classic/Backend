//Raji@olalekan1234
const express = require('express');
const cors = require('cors');
const logsRouter = require('./routes/logs');
const newUserRouter = require('./routes/newUser');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/logs', logsRouter);
app.use('/api/new-user', newUserRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config();
