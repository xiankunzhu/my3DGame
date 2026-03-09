/**
 * ============================================
 * Server Entry Point
 * ============================================
 * Express server that handles:
 * - User authentication (login/register)
 * - High score storage and retrieval
 * - Player data management
 * - Serving the built client in production
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware Setup ----
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ---- Initialize Database ----
initializeDatabase();

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

// ---- Serve Static Files in Production ----
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`🎮 Game server running on http://localhost:${PORT}`);
});

module.exports = app;
