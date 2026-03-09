/**
 * ============================================
 * Player Controller (First-Person)
 * ============================================
 * Handles:
 * - WASD movement on the ground plane
 * - Mouse look (via pointer lock)
 * - Shooting (left click) and knife attack
 * - Weapon switching (Q key or scroll wheel)
 * - Weapon/item model display (gun/flashlight/knife in view)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, GAME_CONSTANTS } from '../../store/gameStore';
import { moveWithLevelCollisions } from '../../game/levelData';
import WeaponModel from './WeaponModel';

function Player() {
  const { camera } = useThree();
  const playerRef = useRef();
  const isMouseDown = useRef(false);

  // ---- Input state (not reactive, for performance) ----
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const direction = useRef(new THREE.Vector3());
  const frontVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const playerPos = useRef(new THREE.Vector3(0, 1.6, 0));

  const gameState = useGameStore((s) => s.gameState);

  // ---- Keyboard input handlers ----
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) keys.current[key] = true;

      // Q to switch weapon
      if (key === 'q' && !e.repeat) {
        useGameStore.getState().switchWeapon();
      }

      // R to reload the gun from reserve ammo
      if (key === 'r' && !e.repeat) {
        useGameStore.getState().reload();
      }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) keys.current[key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ---- Mouse look handler ----
  useEffect(() => {
    const onMouseMove = (e) => {
      if (document.pointerLockElement && gameState === 'playing') {
        euler.current.setFromQuaternion(camera.quaternion);
        euler.current.y -= e.movementX * 0.002;
        euler.current.x -= e.movementY * 0.002;
        // Clamp vertical look
        euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x));
        camera.quaternion.setFromEuler(euler.current);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [camera, gameState]);

  // ---- Mouse click handler (shoot / knife) ----
  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.button === 0 && gameState === 'playing' && document.pointerLockElement) {
        isMouseDown.current = true;
        const state = useGameStore.getState();
        if (state.currentWeapon === 'rifle' || state.currentWeapon === 'pistol') {
          // Shoot in the direction the camera is facing
          const dir = new THREE.Vector3(0, 0, -1);
          dir.applyQuaternion(camera.quaternion);
          const origin = [playerPos.current.x, playerPos.current.y, playerPos.current.z];
          state.shoot(origin, [dir.x, dir.y, dir.z]);
        } else if (state.currentWeapon === 'knife') {
          state.knifeAttack();
        }
      }
    };

    const onMouseUp = (e) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      }
    };

    // ---- Scroll wheel to switch weapons ----
    const onWheel = (e) => {
      if (gameState === 'playing') {
        useGameStore.getState().switchWeapon();
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('wheel', onWheel);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('wheel', onWheel);
    };
  }, [camera, gameState]);

  // ---- Player movement each frame ----
  useFrame(() => {
    if (gameState !== 'playing') return;

    if (document.pointerLockElement && isMouseDown.current) {
      const state = useGameStore.getState();
      if (state.currentWeapon === 'rifle' && state.rifleAmmo > 0 && !state.isReloading) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(camera.quaternion);
        const origin = [playerPos.current.x, playerPos.current.y, playerPos.current.z];
        state.shoot(origin, [dir.x, dir.y, dir.z]);
      }
    }

    const speed = GAME_CONSTANTS.PLAYER_SPEED;

    // Calculate movement direction from key inputs
    frontVector.current.set(0, 0, (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0));
    sideVector.current.set((keys.current.a ? 1 : 0) - (keys.current.d ? 1 : 0), 0, 0);

    direction.current
      .subVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(new THREE.Euler(0, euler.current.y, 0));

    const candidatePosition = [
      playerPos.current.x + direction.current.x,
      1.6,
      playerPos.current.z + direction.current.z,
    ];
    const resolvedPosition = moveWithLevelCollisions(
      [playerPos.current.x, 1.6, playerPos.current.z],
      candidatePosition,
      GAME_CONSTANTS.PLAYER_RADIUS,
    );

    playerPos.current.x = resolvedPosition[0];
    playerPos.current.z = resolvedPosition[2];
    playerPos.current.y = 1.6; // Player eye height

    // Apply position to camera
    camera.position.copy(playerPos.current);

    // Store position in game state for enemy AI and collision
    useGameStore.getState().setPlayerPosition([
      playerPos.current.x,
      playerPos.current.y,
      playerPos.current.z,
    ]);
  });

  return (
    <group ref={playerRef}>
      {/* Weapon model attached to camera view */}
      <WeaponModel />
    </group>
  );
}

export default Player;
