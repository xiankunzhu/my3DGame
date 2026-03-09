/**
 * ============================================
 * Game Scene (Three.js / R3F)
 * ============================================
 * Main 3D scene containing all game objects:
 * - Ground/terrain with textures
 * - Player controller (first-person)
 * - Enemies with AI movement
 * - Supplies
 * - Lighting and atmosphere
 * - Collision detection
 * - Game loop logic
 */

import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, GAME_CONSTANTS } from '../../store/gameStore';
import Player from './Player';
import Enemy from './Enemy';
import Supply from './Supply';
import Bullet from './Bullet';
import Ground from './Ground';
import Buildings from './Buildings';

const DAY_SKY_COLOR = new THREE.Color('#87ceeb');
const NIGHT_SKY_COLOR = new THREE.Color('#02040a');
const DAY_FOG_COLOR = new THREE.Color('#9cb2c3');
const NIGHT_FOG_COLOR = new THREE.Color('#02040a');

function getDayNightState(elapsedMs) {
  const totalCycleDuration = GAME_CONSTANTS.DAY_DURATION_MS + GAME_CONSTANTS.NIGHT_DURATION_MS;
  const cycleTime = elapsedMs % totalCycleDuration;
  const isNight = cycleTime >= GAME_CONSTANTS.DAY_DURATION_MS;

  if (!isNight) {
    const phaseProgress = cycleTime / GAME_CONSTANTS.DAY_DURATION_MS;
    return {
      isNight: false,
      phaseProgress,
      lightStrength: Math.sin(phaseProgress * Math.PI),
      skyBlend: Math.sin(phaseProgress * Math.PI),
    };
  }

  const phaseProgress = (cycleTime - GAME_CONSTANTS.DAY_DURATION_MS) / GAME_CONSTANTS.NIGHT_DURATION_MS;
  return {
    isNight: true,
    phaseProgress,
    lightStrength: Math.sin(phaseProgress * Math.PI),
    skyBlend: 0,
  };
}

function getSunPosition(progress) {
  const angle = progress * Math.PI;
  return [Math.cos(angle) * 120, Math.sin(angle) * 90 + 6, -35];
}

function getMoonPosition(progress) {
  const angle = progress * Math.PI;
  return [Math.cos(angle + Math.PI) * 120, Math.sin(angle) * 72 + 10, 35];
}

function CelestialBody({ position, color, size, emissiveIntensity, glowDistance }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={emissiveIntensity * 2} distance={glowDistance} />
    </group>
  );
}

function GameScene() {
  const { scene } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const [dayNightState, setDayNightState] = useState(() => getDayNightState(0));

  // ---- Refs for game timing ----
  const lastEnemySpawn = useRef(0);
  const lastSupplySpawn = useRef(0);
  const lastSurvivalTick = useRef(0);
  const lastEnemyAttack = useRef({});
  const lastCycleVisualUpdate = useRef(0);
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();
  const hemisphereLightRef = useRef();

  // ---- Main game loop ----
  useFrame((state) => {
    if (gameState !== 'playing') return;

    const time = state.clock.getElapsedTime() * 1000;
    const store = useGameStore.getState();
    const cycle = getDayNightState(time);
    const skyColor = NIGHT_SKY_COLOR.clone().lerp(DAY_SKY_COLOR, cycle.skyBlend);
    const fogColor = NIGHT_FOG_COLOR.clone().lerp(DAY_FOG_COLOR, cycle.skyBlend);

    scene.background = skyColor;
    if (scene.fog) {
      scene.fog.color.copy(fogColor);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = cycle.isNight
        ? 0.12 + cycle.lightStrength * 0.08
        : 0.22 + cycle.lightStrength * 0.28;
    }

    if (directionalLightRef.current) {
      const lightPosition = cycle.isNight ? getMoonPosition(cycle.phaseProgress) : getSunPosition(cycle.phaseProgress);
      directionalLightRef.current.position.set(lightPosition[0], lightPosition[1], lightPosition[2]);
      directionalLightRef.current.intensity = cycle.isNight ? 0.08 : 0.35 + cycle.lightStrength * 1.05;
      directionalLightRef.current.color.set(cycle.isNight ? '#8da8d6' : '#fff4c2');
    }

    if (hemisphereLightRef.current) {
      hemisphereLightRef.current.intensity = cycle.isNight
        ? 0.08 + cycle.lightStrength * 0.12
        : 0.18 + cycle.lightStrength * 0.22;
      hemisphereLightRef.current.color.set(cycle.isNight ? '#1c3050' : '#87ceeb');
      hemisphereLightRef.current.groundColor.set(cycle.isNight ? '#101014' : '#362907');
    }

    if (store.isNight !== cycle.isNight) {
      store.setNightMode(cycle.isNight);
    }

    if (time - lastCycleVisualUpdate.current > 100) {
      setDayNightState(cycle);
      lastCycleVisualUpdate.current = time;
    }

    const enemySpawnInterval = cycle.isNight
      ? GAME_CONSTANTS.SPAWN_INTERVAL / GAME_CONSTANTS.NIGHT_ENEMY_MULTIPLIER
      : GAME_CONSTANTS.SPAWN_INTERVAL;

    // ---- Spawn enemies periodically ----
    if (time - lastEnemySpawn.current > enemySpawnInterval) {
      store.spawnEnemy(store.playerPosition);
      lastEnemySpawn.current = time;
    }

    // ---- Spawn supplies periodically ----
    if (time - lastSupplySpawn.current > GAME_CONSTANTS.SUPPLY_SPAWN_INTERVAL) {
      store.spawnSupply(store.playerPosition);
      lastSupplySpawn.current = time;
    }

    // ---- Update survival time every second ----
    if (time - lastSurvivalTick.current > 1000) {
      store.incrementSurvivalTime();
      lastSurvivalTick.current = time;
    }

    // ---- Update enemy positions (move toward player) ----
    store.updateEnemyPositions(store.playerPosition);

    // ---- Update bullet positions ----
    store.updateBullets();

    // ---- Check bullet-enemy collisions ----
    const bullets = store.bullets;
    const enemies = store.enemies;
    for (const bullet of bullets) {
      for (const enemy of enemies) {
        const dx = bullet.position[0] - enemy.position[0];
        const dy = bullet.position[1] - enemy.position[1];
        const dz = bullet.position[2] - enemy.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.2) {
          // Bullet hit enemy
          const bulletDamage = bullet.weaponType === 'pistol'
            ? GAME_CONSTANTS.PISTOL_DAMAGE
            : GAME_CONSTANTS.GUN_DAMAGE;
          store.damageEnemy(enemy.id, bulletDamage);
          store.removeBullet(bullet.id);
          break;
        }
      }
    }

    // ---- Check enemy attacks on player ----
    for (const enemy of enemies) {
      if (enemy.isAttacking) {
        const lastAttack = lastEnemyAttack.current[enemy.id] || 0;
        if (time - lastAttack > 1000) { // Attack once per second
          store.damagePlayer(GAME_CONSTANTS.ENEMY_DAMAGE * (enemy.damageMultiplier || 1));
          lastEnemyAttack.current[enemy.id] = time;
        }
      }
    }

    // ---- Check knife attacks on nearby enemies ----
    if (store.isKnifing && store.currentWeapon === 'knife') {
      const playerPos = store.playerPosition;
      for (const enemy of enemies) {
        const dx = playerPos[0] - enemy.position[0];
        const dz = playerPos[2] - enemy.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < GAME_CONSTANTS.KNIFE_RANGE) {
          store.damageEnemy(enemy.id, GAME_CONSTANTS.KNIFE_DAMAGE);
        }
      }
    }

    // ---- Check supply collection ----
    const playerPos = store.playerPosition;
    for (const supply of store.supplies) {
      const dx = playerPos[0] - supply.position[0];
      const dz = playerPos[2] - supply.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2) {
        store.collectSupply(supply.id);
      }
    }
  });

  // ---- Get current game objects ----
  const enemies = useGameStore((s) => s.enemies);
  const supplies = useGameStore((s) => s.supplies);
  const bullets = useGameStore((s) => s.bullets);
  const sunPosition = dayNightState.isNight ? [0, -120, 0] : getSunPosition(dayNightState.phaseProgress);
  const moonPosition = dayNightState.isNight ? getMoonPosition(dayNightState.phaseProgress) : [0, -120, 0];
  const fogArgs = [
    NIGHT_FOG_COLOR.clone().lerp(DAY_FOG_COLOR, dayNightState.skyBlend).getStyle(),
    30,
    120,
  ];

  return (
    <>
      {/* ---- Lighting ---- */}
      <ambientLight ref={ambientLightRef} intensity={0.4} />
      <directionalLight
        ref={directionalLightRef}
        position={[30, 50, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight
        ref={hemisphereLightRef}
        skyColor="#87ceeb"
        groundColor="#362907"
        intensity={0.3}
      />

      {/* ---- Sky ---- */}
      <Sky sunPosition={sunPosition} turbidity={10} rayleigh={dayNightState.isNight ? 0.25 : 2} />

      {/* ---- Celestial bodies ---- */}
      {!dayNightState.isNight && (
        <CelestialBody
          position={sunPosition}
          color="#ffd76a"
          size={5}
          emissiveIntensity={2.4}
          glowDistance={180}
        />
      )}
      {dayNightState.isNight && (
        <>
          <CelestialBody
            position={moonPosition}
            color="#dbe9ff"
            size={3.2}
            emissiveIntensity={1.05}
            glowDistance={120}
          />
          <Stars radius={320} depth={80} count={4500} factor={4} saturation={0} fade speed={0.2} />
        </>
      )}

      {/* ---- Fog for atmosphere ---- */}
      <fog attach="fog" args={fogArgs} />

      {/* ---- Ground ---- */}
      <Ground playerPosition={playerPosition} />

      {/* ---- Buildings/obstacles ---- */}
      <Buildings playerPosition={playerPosition} />

      {/* ---- Player (first-person controller) ---- */}
      <Player />

      {/* ---- Enemies ---- */}
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}

      {/* ---- Supplies ---- */}
      {supplies.map((supply) => (
        <Supply key={supply.id} supply={supply} />
      ))}

      {/* ---- Bullets ---- */}
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} bullet={bullet} />
      ))}
    </>
  );
}

export default GameScene;
