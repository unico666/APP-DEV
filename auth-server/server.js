const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(cookieParser());

// Brute-force protection on the auth endpoints
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, try again later' },
  })
);

app.use('/', authRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.AUTH_PORT || 4000;
app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`Auth Server running on http://localhost:${PORT} (database connected)`);
  } catch (e) {
    console.error('Auth Server running but DATABASE FAILED:', e.message);
  }
});
