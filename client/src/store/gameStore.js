/**
 * ============================================
 * Game State Store (Zustand)
 * ============================================
 * Central state management for the entire game.
 * Manages: player state, enemies, weapons, score,
 * game status, UI state, and user authentication.
 */

import { create } from 'zustand';
import { moveWithLevelCollisions, segmentHitsLevel } from '../game/levelData';

const FIREARM_WEAPONS = ['rifle', 'pistol'];
const WEAPON_CYCLE = ['rifle', 'pistol', 'flashlight', 'knife'];

function getWeaponAmmoKeys(weapon) {
  if (weapon === 'rifle') {
    return {
      ammoKey: 'rifleAmmo',
      reserveAmmoKey: 'rifleReserveAmmo',
      magazineSize: GAME_CONSTANTS.RIFLE_MAGAZINE_SIZE,
      fireInterval: GAME_CONSTANTS.RIFLE_FIRE_INTERVAL,
    };
  }

  if (weapon === 'pistol') {
    return {
      ammoKey: 'pistolAmmo',
      reserveAmmoKey: 'pistolReserveAmmo',
      magazineSize: GAME_CONSTANTS.PISTOL_MAGAZINE_SIZE,
      fireInterval: GAME_CONSTANTS.PISTOL_FIRE_INTERVAL,
    };
  }

  return null;
}

// ---- Game Constants ----
export const GAME_CONSTANTS = {
  PLAYER_MAX_HEALTH: 100,
  PLAYER_SPEED: 0.15,
  PLAYER_RADIUS: 0.5,
  DAY_DURATION_MS: 5 * 60 * 1000,
  NIGHT_DURATION_MS: 3 * 60 * 1000,
  NIGHT_ENEMY_MULTIPLIER: 1.5,
  RIFLE_MAGAZINE_SIZE: 30,
  RIFLE_MAX_RESERVE_AMMO: 150,
  RIFLE_START_AMMO: 30,
  RIFLE_START_RESERVE_AMMO: 90,
  PISTOL_MAGAZINE_SIZE: 12,
  PISTOL_MAX_RESERVE_AMMO: 48,
  PISTOL_START_AMMO: 12,
  PISTOL_START_RESERVE_AMMO: 24,
  RELOAD_TIME: 1200,
  RIFLE_FIRE_INTERVAL: 90,
  PISTOL_FIRE_INTERVAL: 180,
  GUN_DAMAGE: 25,
  PISTOL_DAMAGE: 18,
  KNIFE_DAMAGE: 15,
  KNIFE_RANGE: 2.5,
  ENEMY_DAMAGE: 10,
  ENEMY_SPEED: 0.04,
  ENEMY_RADIUS: 0.6,
  ENEMY_HEALTH: 50,
  BULLET_RADIUS: 0.08,
  KILL_SCORE: 100,
  SUPPLY_AMMO_AMOUNT: 10,
  SUPPLY_HEALTH_AMOUNT: 25,
  SPAWN_INTERVAL: 3000, // ms between enemy spawns
  SUPPLY_SPAWN_INTERVAL: 8000, // ms between supply spawns
  MAP_SIZE: 50,
  MAX_ENEMIES: 15,
};

/**
 * Main game store using Zustand for reactive state management
 */
export const useGameStore = create((set, get) => ({
  // ---- Authentication State ----
  user: JSON.parse(localStorage.getItem('gameUser') || 'null'),
  token: localStorage.getItem('gameToken') || null,

  setUser: (user, token) => {
    if (user && token) {
      localStorage.setItem('gameUser', JSON.stringify(user));
      localStorage.setItem('gameToken', token);
    } else {
      localStorage.removeItem('gameUser');
      localStorage.removeItem('gameToken');
    }
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('gameUser');
    localStorage.removeItem('gameToken');
    set({ user: null, token: null });
  },

  // ---- Game Status ----
  gameState: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
  setGameState: (gameState) => set({ gameState }),

  // ---- Player State ----
  playerHealth: GAME_CONSTANTS.PLAYER_MAX_HEALTH,
  playerPosition: [0, 0, 0],
  playerRotation: 0,

  // ---- Weapon State ----
  currentWeapon: 'rifle', // 'rifle' | 'pistol' | 'flashlight' | 'knife'
  rifleAmmo: GAME_CONSTANTS.RIFLE_START_AMMO,
  rifleReserveAmmo: GAME_CONSTANTS.RIFLE_START_RESERVE_AMMO,
  pistolAmmo: GAME_CONSTANTS.PISTOL_START_AMMO,
  pistolReserveAmmo: GAME_CONSTANTS.PISTOL_START_RESERVE_AMMO,
  isShooting: false,
  isKnifing: false,
  isReloading: false,

  // ---- Score & Stats ----
  score: 0,
  enemiesKilled: 0,
  survivalTime: 0,
  isNight: false,

  // ---- Enemies ----
  enemies: [],
  nextEnemyId: 1,

  // ---- Supplies ----
  supplies: [],
  nextSupplyId: 1,

  // ---- Bullets (visual projectiles) ----
  bullets: [],
  nextBulletId: 1,

  /**
   * Start a new game - reset all game state
   */
  startGame: () => set({
    gameState: 'playing',
    playerHealth: GAME_CONSTANTS.PLAYER_MAX_HEALTH,
    playerPosition: [0, 0, 0],
    currentWeapon: 'rifle',
    rifleAmmo: GAME_CONSTANTS.RIFLE_START_AMMO,
    rifleReserveAmmo: GAME_CONSTANTS.RIFLE_START_RESERVE_AMMO,
    pistolAmmo: GAME_CONSTANTS.PISTOL_START_AMMO,
    pistolReserveAmmo: GAME_CONSTANTS.PISTOL_START_RESERVE_AMMO,
    score: 0,
    enemiesKilled: 0,
    survivalTime: 0,
    isNight: false,
    enemies: [],
    supplies: [],
    bullets: [],
    nextEnemyId: 1,
    nextSupplyId: 1,
    nextBulletId: 1,
    isShooting: false,
    isKnifing: false,
    isReloading: false,
  }),

  /**
   * End the game (player died)
   */
  endGame: () => {
    set({ gameState: 'gameover' });
  },

  /**
   * Toggle night mode and scale active enemies accordingly
   */
  setNightMode: (isNight) => {
    const state = get();
    if (state.isNight === isNight) return;

    const multiplier = GAME_CONSTANTS.NIGHT_ENEMY_MULTIPLIER;
    const updatedEnemies = state.enemies.map((enemy) => {
      if (isNight) {
        return {
          ...enemy,
          health: enemy.health * multiplier,
          maxHealth: enemy.maxHealth * multiplier,
          damageMultiplier: multiplier,
        };
      }

      const nextMaxHealth = enemy.maxHealth / multiplier;
      return {
        ...enemy,
        health: Math.min(enemy.health / multiplier, nextMaxHealth),
        maxHealth: nextMaxHealth,
        damageMultiplier: 1,
      };
    });

    set({
      isNight,
      enemies: updatedEnemies,
    });
  },

  /**
   * Switch between rifle, pistol, flashlight, and knife
   */
  switchWeapon: () => {
    const current = get().currentWeapon;
    const currentIndex = WEAPON_CYCLE.indexOf(current);
    const nextWeapon = WEAPON_CYCLE[(currentIndex + 1) % WEAPON_CYCLE.length];
    set({ currentWeapon: nextWeapon });
  },

  /**
   * Fire the current firearm - creates a bullet and decrements ammo
   */
  shoot: (origin, direction) => {
    const state = get();
    const weaponStats = getWeaponAmmoKeys(state.currentWeapon);

    if (
      !weaponStats
      || state.isShooting
      || state.isReloading
    ) return false;

    if (state[weaponStats.ammoKey] <= 0) return false;

    const bulletId = state.nextBulletId;
    set({
      [weaponStats.ammoKey]: state[weaponStats.ammoKey] - 1,
      isShooting: true,
      nextBulletId: bulletId + 1,
      bullets: [...state.bullets, {
        id: bulletId,
        weaponType: state.currentWeapon,
        position: [...origin],
        direction: [...direction],
        speed: 1.5,
        lifetime: 60, // frames
      }],
    });

    // Reset shooting flag after a short delay (fire rate limiter)
    setTimeout(() => set({ isShooting: false }), weaponStats.fireInterval);
    return true;
  },

  /**
   * Reload the currently equipped firearm from reserve ammo
   */
  reload: () => {
    const state = get();
    const weaponStats = getWeaponAmmoKeys(state.currentWeapon);

    if (!weaponStats) {
      return false;
    }

    const currentAmmo = state[weaponStats.ammoKey];
    const reserveAmmo = state[weaponStats.reserveAmmoKey];
    const missingAmmo = weaponStats.magazineSize - currentAmmo;

    if (
      state.isReloading
      || currentAmmo >= weaponStats.magazineSize
      || reserveAmmo <= 0
      || missingAmmo <= 0
    ) {
      return false;
    }

    set({ isReloading: true });

    setTimeout(() => {
      const latestState = get();
      const latestWeaponStats = getWeaponAmmoKeys(latestState.currentWeapon) || weaponStats;
      const latestAmmo = latestState[weaponStats.ammoKey];
      const latestReserveAmmo = latestState[weaponStats.reserveAmmoKey];
      const latestMissingAmmo = latestWeaponStats.magazineSize - latestAmmo;
      const ammoToLoad = Math.min(latestMissingAmmo, latestReserveAmmo);

      set({
        [weaponStats.ammoKey]: latestAmmo + ammoToLoad,
        [weaponStats.reserveAmmoKey]: latestReserveAmmo - ammoToLoad,
        isReloading: false,
      });
    }, GAME_CONSTANTS.RELOAD_TIME);

    return true;
  },

  /**
   * Knife attack - damages nearby enemies
   */
  knifeAttack: () => {
    const state = get();
    if (state.currentWeapon !== 'knife' || state.isKnifing) return;
    set({ isKnifing: true });
    setTimeout(() => set({ isKnifing: false }), 400);
  },

  /**
   * Update bullet positions each frame
   */
  updateBullets: () => {
    const state = get();
    const updatedBullets = state.bullets
      .map((b) => {
        const nextPosition = [
          b.position[0] + b.direction[0] * b.speed,
          b.position[1] + b.direction[1] * b.speed,
          b.position[2] + b.direction[2] * b.speed,
        ];

        if (segmentHitsLevel(b.position, nextPosition, GAME_CONSTANTS.BULLET_RADIUS)) {
          return null;
        }

        return {
          ...b,
          position: nextPosition,
          lifetime: b.lifetime - 1,
        };
      })
      .filter(Boolean)
      .filter(b => b.lifetime > 0);
    set({ bullets: updatedBullets });
  },

  /**
   * Spawn a new enemy at a random position around the map edge
   */
  spawnEnemy: (playerPos = [0, 0, 0]) => {
    const state = get();
    if (state.enemies.length >= GAME_CONSTANTS.MAX_ENEMIES) return;

    const angle = Math.random() * Math.PI * 2;
    const minDistance = GAME_CONSTANTS.MAP_SIZE * 0.3;
    const maxDistance = GAME_CONSTANTS.MAP_SIZE * 0.6;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = playerPos[0] + Math.cos(angle) * distance;
    const z = playerPos[2] + Math.sin(angle) * distance;

    const id = state.nextEnemyId;
    const enemyHealth = state.isNight
      ? GAME_CONSTANTS.ENEMY_HEALTH * GAME_CONSTANTS.NIGHT_ENEMY_MULTIPLIER
      : GAME_CONSTANTS.ENEMY_HEALTH;
    set({
      nextEnemyId: id + 1,
      enemies: [...state.enemies, {
        id,
        position: [x, 0, z],
        health: enemyHealth,
        maxHealth: enemyHealth,
        damageMultiplier: state.isNight ? GAME_CONSTANTS.NIGHT_ENEMY_MULTIPLIER : 1,
        isAttacking: false,
      }],
    });
  },

  /**
   * Damage an enemy by ID
   */
  damageEnemy: (enemyId, damage) => {
    const state = get();
    let killed = false;
    const updatedEnemies = state.enemies.map(e => {
      if (e.id === enemyId) {
        const newHealth = e.health - damage;
        if (newHealth <= 0) killed = true;
        return { ...e, health: Math.max(0, newHealth) };
      }
      return e;
    }).filter(e => e.health > 0);

    const newState = { enemies: updatedEnemies };
    if (killed) {
      newState.score = state.score + GAME_CONSTANTS.KILL_SCORE;
      newState.enemiesKilled = state.enemiesKilled + 1;
    }
    set(newState);
    return killed;
  },

  /**
   * Damage the player
   */
  damagePlayer: (damage) => {
    const state = get();
    const newHealth = Math.max(0, state.playerHealth - damage);
    set({ playerHealth: newHealth });
    // Check for game over
    if (newHealth <= 0) {
      get().endGame();
    }
  },

  /**
   * Spawn a supply (ammo or health) at a random position
   */
  spawnSupply: (playerPos = [0, 0, 0]) => {
    const state = get();
    const halfMap = GAME_CONSTANTS.MAP_SIZE * 0.4;
    const x = playerPos[0] + (Math.random() - 0.5) * 2 * halfMap;
    const z = playerPos[2] + (Math.random() - 0.5) * 2 * halfMap;
    const type = Math.random() > 0.5 ? 'ammo' : 'health';

    const id = state.nextSupplyId;
    set({
      nextSupplyId: id + 1,
      supplies: [...state.supplies, {
        id,
        position: [x, 0.5, z],
        type,
      }],
    });
  },

  /**
   * Collect a supply item
   */
  collectSupply: (supplyId) => {
    const state = get();
    const supply = state.supplies.find(s => s.id === supplyId);
    if (!supply) return;

    const newState = {
      supplies: state.supplies.filter(s => s.id !== supplyId),
    };

    if (supply.type === 'ammo') {
      newState.rifleReserveAmmo = Math.min(
        GAME_CONSTANTS.RIFLE_MAX_RESERVE_AMMO,
        state.rifleReserveAmmo + GAME_CONSTANTS.SUPPLY_AMMO_AMOUNT,
      );
      newState.pistolReserveAmmo = Math.min(
        GAME_CONSTANTS.PISTOL_MAX_RESERVE_AMMO,
        state.pistolReserveAmmo + Math.ceil(GAME_CONSTANTS.SUPPLY_AMMO_AMOUNT / 2),
      );
    } else if (supply.type === 'health') {
      newState.playerHealth = Math.min(
        GAME_CONSTANTS.PLAYER_MAX_HEALTH,
        state.playerHealth + GAME_CONSTANTS.SUPPLY_HEALTH_AMOUNT
      );
    }

    set(newState);
  },

  /**
   * Update player position (called from game loop)
   */
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),

  /**
   * Increment survival time (called every second)
   */
  incrementSurvivalTime: () => set((s) => ({ survivalTime: s.survivalTime + 1 })),

  /**
   * Update enemy positions (move toward player)
   */
  updateEnemyPositions: (playerPos) => {
    const state = get();
    const updated = state.enemies.map(enemy => {
      const dx = playerPos[0] - enemy.position[0];
      const dz = playerPos[2] - enemy.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist === 0) {
        return enemy;
      }

      if (dist < 1.5) {
        // Enemy is close enough to attack
        return { ...enemy, isAttacking: true };
      }

      // Move toward player
      const speed = GAME_CONSTANTS.ENEMY_SPEED;
      const nextPosition = [
        enemy.position[0] + (dx / dist) * speed,
        enemy.position[1],
        enemy.position[2] + (dz / dist) * speed,
      ];
      const resolvedPosition = moveWithLevelCollisions(
        enemy.position,
        nextPosition,
        GAME_CONSTANTS.ENEMY_RADIUS,
      );
      const blocked = resolvedPosition[0] === enemy.position[0] && resolvedPosition[2] === enemy.position[2];

      return {
        ...enemy,
        isAttacking: false,
        position: resolvedPosition,
        blocked,
      };
    });
    set({ enemies: updated });
  },

  /**
   * Remove a bullet by ID
   */
  removeBullet: (bulletId) => {
    set((state) => ({
      bullets: state.bullets.filter(b => b.id !== bulletId),
    }));
  },
}));
