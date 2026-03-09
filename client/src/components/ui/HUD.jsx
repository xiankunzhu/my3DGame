/**
 * ============================================
 * HUD Component (Heads-Up Display)
 * ============================================
 * Displays game info overlaid on the 3D view:
 * - Health bar (top of screen)
 * - Ammo count
 * - Current weapon indicator
 * - Score display
 * - Survival timer
 * - Controls hint
 */

import React from 'react';
import { useGameStore, GAME_CONSTANTS } from '../../store/gameStore';
import './HUD.css';

function HUD() {
  const playerHealth = useGameStore((s) => s.playerHealth);
  const rifleAmmo = useGameStore((s) => s.rifleAmmo);
  const rifleReserveAmmo = useGameStore((s) => s.rifleReserveAmmo);
  const pistolAmmo = useGameStore((s) => s.pistolAmmo);
  const pistolReserveAmmo = useGameStore((s) => s.pistolReserveAmmo);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const isReloading = useGameStore((s) => s.isReloading);
  const score = useGameStore((s) => s.score);
  const enemiesKilled = useGameStore((s) => s.enemiesKilled);
  const survivalTime = useGameStore((s) => s.survivalTime);

  // ---- Format survival time as MM:SS ----
  const minutes = Math.floor(survivalTime / 60).toString().padStart(2, '0');
  const seconds = (survivalTime % 60).toString().padStart(2, '0');

  // ---- Health bar color based on health percentage ----
  const healthPercent = (playerHealth / GAME_CONSTANTS.PLAYER_MAX_HEALTH) * 100;
  const healthColor = healthPercent > 50 ? '#22c55e' : healthPercent > 25 ? '#f59e0b' : '#ef4444';
  const isFirearm = currentWeapon === 'rifle' || currentWeapon === 'pistol';

  const ammo = currentWeapon === 'rifle' ? rifleAmmo : pistolAmmo;
  const reserveAmmo = currentWeapon === 'rifle' ? rifleReserveAmmo : pistolReserveAmmo;
  const magazineSize = currentWeapon === 'rifle'
    ? GAME_CONSTANTS.RIFLE_MAGAZINE_SIZE
    : GAME_CONSTANTS.PISTOL_MAGAZINE_SIZE;
  const weaponLabel = currentWeapon === 'rifle'
    ? '🔫 RIFLE'
    : currentWeapon === 'pistol'
      ? '🔹 HANDGUN'
      : currentWeapon === 'flashlight'
        ? '🔦 FLASHLIGHT'
      : '🔪 KNIFE';

  return (
    <div className="hud">
      {/* ---- Health Bar (Top of Screen) ---- */}
      <div className="hud-health-container">
        <div className="hud-health-label">HP</div>
        <div className="hud-health-bar">
          <div
            className="hud-health-fill"
            style={{
              width: `${healthPercent}%`,
              backgroundColor: healthColor,
            }}
          />
        </div>
        <div className="hud-health-text">{playerHealth}/{GAME_CONSTANTS.PLAYER_MAX_HEALTH}</div>
      </div>

      {/* ---- Score & Time (Top Right) ---- */}
      <div className="hud-top-right">
        <div className="hud-score">SCORE: {score}</div>
        <div className="hud-kills">KILLS: {enemiesKilled}</div>
        <div className="hud-time">{minutes}:{seconds}</div>
      </div>

      {/* ---- Weapon & Ammo (Bottom Right) ---- */}
      <div className="hud-weapon-panel">
        <div className="hud-weapon-name">{weaponLabel}</div>
        {isFirearm && (
          <div className="hud-ammo">
            <span className="hud-ammo-count">{ammo}</span>
            <span className="hud-ammo-max">/{magazineSize}</span>
            <div className="hud-ammo-reserve">RESERVE: {reserveAmmo}</div>
            <div className="hud-ammo-reserve">
              {currentWeapon === 'rifle' ? 'AUTO' : 'SEMI-AUTO'}
            </div>
            {isReloading && <div className="hud-ammo-reserve">RELOADING...</div>}
          </div>
        )}
        {currentWeapon === 'knife' && (
          <div className="hud-ammo">
            <span className="hud-ammo-label">MELEE</span>
          </div>
        )}
        {currentWeapon === 'flashlight' && (
          <div className="hud-ammo">
            <span className="hud-ammo-label">UTILITY</span>
            <div className="hud-ammo-reserve">AUTO-ON AT NIGHT</div>
          </div>
        )}
      </div>

      {/* ---- Controls Hint (Bottom Left) ---- */}
      <div className="hud-controls">
        <div>WASD - Move</div>
        <div>Mouse - Look</div>
        <div>Click - Attack</div>
        <div>Q/Scroll - Switch Weapon</div>
        <div>R - Reload</div>
        <div>ESC - Pause</div>
      </div>
    </div>
  );
}

export default HUD;
