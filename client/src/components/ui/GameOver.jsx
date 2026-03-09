/**
 * ============================================
 * Game Over Screen
 * ============================================
 * Displayed when the player's health reaches zero.
 * Shows final score, stats, and options to
 * play again or return to menu.
 * Submits score to server if logged in.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { submitScore } from '../../services/api';
import './GameOver.css';

function GameOver() {
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const enemiesKilled = useGameStore((s) => s.enemiesKilled);
  const survivalTime = useGameStore((s) => s.survivalTime);
  const startGame = useGameStore((s) => s.startGame);
  const user = useGameStore((s) => s.user);
  const token = useGameStore((s) => s.token);

  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // ---- Format survival time ----
  const minutes = Math.floor(survivalTime / 60).toString().padStart(2, '0');
  const seconds = (survivalTime % 60).toString().padStart(2, '0');

  // ---- Submit score to server if logged in ----
  useEffect(() => {
    if (user && token && !scoreSubmitted && score > 0) {
      submitScore(score, enemiesKilled, survivalTime)
        .then(() => setScoreSubmitted(true))
        .catch((err) => console.error('Failed to submit score:', err));
    }
  }, [user, token, score, enemiesKilled, survivalTime, scoreSubmitted]);

  const handlePlayAgain = () => {
    setScoreSubmitted(false);
    startGame();
    document.body.requestPointerLock?.();
  };

  const handleMainMenu = () => {
    navigate('/');
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-content">
        <h1 className="gameover-title">GAME OVER</h1>

        {/* ---- Stats ---- */}
        <div className="gameover-stats">
          <div className="stat-row">
            <span className="stat-label">SCORE</span>
            <span className="stat-value stat-score">{score}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">ENEMIES KILLED</span>
            <span className="stat-value">{enemiesKilled}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">SURVIVAL TIME</span>
            <span className="stat-value">{minutes}:{seconds}</span>
          </div>
        </div>

        {/* ---- Score submission status ---- */}
        {user && scoreSubmitted && (
          <p className="gameover-saved">✅ Score saved to leaderboard!</p>
        )}
        {!user && (
          <p className="gameover-hint">Login to save your scores!</p>
        )}

        {/* ---- Action Buttons ---- */}
        <div className="gameover-buttons">
          <button className="btn btn-primary btn-large" onClick={handlePlayAgain}>
            ▶ PLAY AGAIN
          </button>
          <button className="btn btn-secondary" onClick={handleMainMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOver;
