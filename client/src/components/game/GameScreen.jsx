/**
 * ============================================
 * Game Screen Component
 * ============================================
 * The main game view that contains:
 * - 3D Canvas with Three.js scene
 * - HUD overlay (health, ammo, score)
 * - Game Over screen
 * - Pause menu
 */

import React, { useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import GameScene from './GameScene';
import HUD from '../ui/HUD';
import GameOver from '../ui/GameOver';
import PauseMenu from '../ui/PauseMenu';
import './GameScreen.css';

function GameScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const startGame = useGameStore((s) => s.startGame);
  const setGameState = useGameStore((s) => s.setGameState);

  // ---- Start the game when component mounts ----
  useEffect(() => {
    startGame();

    // Lock pointer for FPS controls
    const handleClick = () => {
      if (gameState === 'playing') {
        document.body.requestPointerLock?.();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ---- Handle pause with Escape key ----
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      const current = useGameStore.getState().gameState;
      if (current === 'playing') {
        setGameState('paused');
        document.exitPointerLock?.();
      } else if (current === 'paused') {
        setGameState('playing');
        document.body.requestPointerLock?.();
      }
    }
  }, [setGameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameState === 'gameover') {
      document.exitPointerLock?.();
    }
  }, [gameState]);

  return (
    <div className={`game-screen ${gameState === 'gameover' ? 'game-screen--cursor-visible' : ''}`}>
      {/* 3D Canvas - WebGL rendering via Three.js */}
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 200, position: [0, 2, 5] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1a1a2e' }}
      >
        <GameScene />
      </Canvas>

      {/* HUD Overlay - always visible during gameplay */}
      {gameState === 'playing' && <HUD />}

      {/* Game Over screen overlay */}
      {gameState === 'gameover' && <GameOver />}

      {/* Pause menu overlay */}
      {gameState === 'paused' && <PauseMenu />}

      {/* Crosshair - center of screen during gameplay */}
      {gameState === 'playing' && (
        <div className="crosshair">
          <div className="crosshair-dot" />
          <div className="crosshair-line crosshair-top" />
          <div className="crosshair-line crosshair-bottom" />
          <div className="crosshair-line crosshair-left" />
          <div className="crosshair-line crosshair-right" />
        </div>
      )}
    </div>
  );
}

export default GameScreen;
