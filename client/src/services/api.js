/**
 * ============================================
 * API Service
 * ============================================
 * Handles all HTTP requests to the backend server.
 * Includes auth token management and error handling.
 */

const API_BASE = '/api';

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('gameToken');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ---- Auth API ----

export async function registerUser(username, email, password) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function loginUser(username, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

// ---- Scores API ----

export async function submitScore(score, enemiesKilled, survivalTime) {
  return apiRequest('/scores', {
    method: 'POST',
    body: JSON.stringify({ score, enemiesKilled, survivalTime }),
  });
}

export async function getTopScores() {
  return apiRequest('/scores/top');
}

export async function getMyScores() {
  return apiRequest('/scores/me');
}
