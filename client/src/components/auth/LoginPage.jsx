/**
 * ============================================
 * Login Page Component
 * ============================================
 * Form for user authentication with
 * username/email and password
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { loginUser } from '../../services/api';
import './Auth.css';

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useGameStore((s) => s.setUser);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(username, password);
      setUser(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card auth-card">
        <h2 className="auth-title">LOGIN</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              className="input"
              type="text"
              placeholder="Enter username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <button className="btn btn-outline auth-back" onClick={() => navigate('/')}>
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
