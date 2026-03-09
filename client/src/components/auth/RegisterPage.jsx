/**
 * ============================================
 * Register Page Component
 * ============================================
 * Form for creating a new player account
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { registerUser } from '../../services/api';
import './Auth.css';

function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useGameStore((s) => s.setUser);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ---- Client-side validation ----
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(username, email, password);
      setUser(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card auth-card">
        <h2 className="auth-title">CREATE ACCOUNT</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              className="input"
              type="text"
              placeholder="Choose a username (3-20 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              minLength={3}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Choose a password (6+ chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              className="input"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'REGISTER'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <button className="btn btn-outline auth-back" onClick={() => navigate('/')}>
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
