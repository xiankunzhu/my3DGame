/**
 * ============================================
 * Score Routes
 * ============================================
 * Manages high scores and leaderboards
 * POST /api/scores      - Submit a new score
 * GET  /api/scores/top  - Get top scores (leaderboard)
 * GET  /api/scores/me   - Get current user's scores
 */

const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/scores
 * Submit a game score (requires authentication)
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { score, enemiesKilled, survivalTime } = req.body;

    if (score === undefined || score < 0) {
      return res.status(400).json({ error: 'Valid score is required' });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO high_scores (user_id, score, enemies_killed, survival_time) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, score, enemiesKilled || 0, survivalTime || 0);

    res.status(201).json({
      message: 'Score submitted',
      scoreId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Score submission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/scores/top
 * Get the top 50 high scores for the leaderboard
 */
router.get('/top', (req, res) => {
  try {
    const db = getDb();
    const scores = db.prepare(`
      SELECT 
        h.id, h.score, h.enemies_killed, h.survival_time, h.played_at,
        u.username
      FROM high_scores h
      JOIN users u ON h.user_id = u.id
      ORDER BY h.score DESC
      LIMIT 50
    `).all();

    res.json({ scores });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/scores/me
 * Get the authenticated user's personal best scores
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const scores = db.prepare(`
      SELECT id, score, enemies_killed, survival_time, played_at
      FROM high_scores
      WHERE user_id = ?
      ORDER BY score DESC
      LIMIT 20
    `).all(req.user.id);

    // Also get the user's best score
    const best = db.prepare(`
      SELECT MAX(score) as best_score, SUM(enemies_killed) as total_kills, COUNT(*) as games_played
      FROM high_scores WHERE user_id = ?
    `).get(req.user.id);

    res.json({ scores, stats: best });
  } catch (err) {
    console.error('User scores error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
