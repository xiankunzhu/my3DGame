/**
 * ============================================
 * Pause Menu Component
 * ============================================
 * Displayed when player presses Escape
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import './PauseMenu.css';

function PauseMenu() {
  const navigate = useNavigate();
  const setGameState = useGameStore((s) => s.setGameState);

  const handleResume = () => {
    setGameState('playing');
    document.body.requestPointerLock?.();
  };

  const handleQuit = () => {
    setGameState('menu');
    navigate('/');
  };

  return (
    <div className="pause-overlay">
      <div className="pause-content">
        <h2 className="pause-title">PAUSED</h2>
        <div className="pause-buttons">
          <button className="btn btn-primary btn-large" onClick={handleResume}>
            ▶ RESUME
          </button>
          <button className="btn btn-secondary" onClick={handleQuit}>
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export default PauseMenu;
