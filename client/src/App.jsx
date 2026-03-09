/**
 * ============================================
 * Main App Component
 * ============================================
 * Handles routing between game, auth, and menu screens
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import MainMenu from './components/ui/MainMenu';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import GameScreen from './components/game/GameScreen';
import Leaderboard from './components/ui/Leaderboard';

function App() {
  const user = useGameStore((state) => state.user);

  return (
    <div className="app">
      <Routes>
        {/* Main menu - landing page */}
        <Route path="/" element={<MainMenu />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Game route - the actual 3D game */}
        <Route path="/play" element={<GameScreen />} />
        
        {/* Leaderboard */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
