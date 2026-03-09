/**
 * ============================================
 * Main Menu Component
 * ============================================
 * Landing page with game title and navigation
 * to play, login, register, and leaderboard
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import './MainMenu.css';

function MainMenu() {
  const navigate = useNavigate();
  const user = useGameStore((s) => s.user);
  const logout = useGameStore((s) => s.logout);

  return (
    <div className="main-menu">
      {/* Background particles effect */}
      <div className="menu-bg-particles" />

      <div className="menu-content">
        {/* ---- Game Title ---- */}
        <h1 className="menu-title">
          <span className="title-accent">3D</span> SURVIVAL
          <br />
          <span className="title-sub">SHOOTER</span>
        </h1>

        <p className="menu-tagline">
          Fight enemies. Collect supplies. Survive.
        </p>

        {/* ---- Menu Buttons ---- */}
        <div className="menu-buttons">
          <button
            className="btn btn-primary btn-large menu-btn"
            onClick={() => navigate('/play')}
          >
            ▶ PLAY GAME
          </button>

          <button
            className="btn btn-secondary menu-btn"
            onClick={() => navigate('/leaderboard')}
          >
            🏆 LEADERBOARD
          </button>
        </div>

        {/* ---- Auth Section ---- */}
        <div className="menu-auth">
          {user ? (
            <div className="menu-user-info">
              <span className="menu-welcome">Welcome, <strong>{user.username}</strong></span>
              <button className="btn btn-outline menu-btn-small" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="menu-auth-buttons">
              <button
                className="btn btn-outline menu-btn-small"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button
                className="btn btn-outline menu-btn-small"
                onClick={() => navigate('/register')}
              >
                Register
              </button>
              <p className="menu-auth-hint">Login to save your high scores!</p>
            </div>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="menu-footer">
          <p>Built with React + Three.js | WebGL Powered</p>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
