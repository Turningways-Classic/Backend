//Raji@olalekan1234
const express = require('express');
const cors = require('cors');
const logsRouter = require('./routes/logs');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/logs', logsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
