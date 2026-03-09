/**
 * ============================================
 * Authentication Middleware
 * ============================================
 * Verifies JWT tokens for protected routes
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'my3dgame-secret-key-change-in-production';

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches the decoded user info to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
