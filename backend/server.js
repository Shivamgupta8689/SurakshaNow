require('dotenv').config();
const express = require('express');
const cors = require('cors');
const geminiRoutes = require('./routes/geminiRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/gemini', geminiRoutes);

// General route
app.get('/', (req, res) => {
  res.send('SurakshaNow Backend API is running.');
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
