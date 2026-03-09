/**
 * ============================================
 * Leaderboard Component
 * ============================================
 * Displays top 50 high scores from the server
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopScores } from '../../services/api';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTopScores()
      .then((data) => {
        setScores(data.scores || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Could not load leaderboard. Is the server running?');
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container">
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">🏆 LEADERBOARD</h1>

        {loading && <p className="text-muted">Loading scores...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && scores.length === 0 && (
          <p className="text-muted">No scores yet. Be the first to play!</p>
        )}

        {scores.length > 0 && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Score</th>
                <th>Kills</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((entry, index) => (
                <tr key={entry.id} className={index < 3 ? `top-${index + 1}` : ''}>
                  <td className="rank">{index + 1}</td>
                  <td className="player">{entry.username}</td>
                  <td className="score">{entry.score}</td>
                  <td>{entry.enemies_killed}</td>
                  <td>
                    {Math.floor(entry.survival_time / 60)}:{(entry.survival_time % 60).toString().padStart(2, '0')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button className="btn btn-secondary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
          ← BACK TO MENU
        </button>
      </div>
    </div>
  );
}

export default Leaderboard;
