/**
 * ============================================
 * Enemy Component
 * ============================================
 * Renders a simple humanoid enemy with:
 * - Procedural 3D human model (head, body, arms, legs)
 * - Health bar floating above
 * - Walking animation toward the player
 * - Attack animation when in range
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';

function Enemy({ enemy }) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const isNight = useGameStore((s) => s.isNight);

  // ---- Walking / attack animation ----
  useFrame((state) => {
    if (!groupRef.current) return;

    // Update position from game state
    groupRef.current.position.set(
      enemy.position[0],
      0,
      enemy.position[2]
    );

    // Face the direction of movement
    const time = state.clock.getElapsedTime();

    // Simple walk cycle animation
    const walkSpeed = enemy.isAttacking ? 8 : 4;
    const legSwing = Math.sin(time * walkSpeed) * 0.5;

    if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -legSwing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x = legSwing * 0.7;

    // Attack animation - arms swing forward
    if (enemy.isAttacking && rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(time * 10) * 1.0 - 0.5;
    }
  });

  // ---- Health bar percentage ----
  const healthPercent = enemy.health / enemy.maxHealth;
  const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
  const healthBarOpacity = isNight ? 0.42 : 0.95;
  const healthBarBackground = isNight ? 'rgba(20, 24, 32, 0.75)' : '#333';

  return (
    <group ref={groupRef}>
      {/* ---- Health Bar (HTML overlay) ---- */}
      <Html position={[0, 2.8, 0]} center distanceFactor={10}>
        <div style={{
          width: '60px',
          height: '6px',
          background: healthBarBackground,
          borderRadius: '3px',
          overflow: 'hidden',
          opacity: healthBarOpacity,
          boxShadow: isNight ? '0 0 4px rgba(0, 0, 0, 0.35)' : '0 0 6px rgba(0, 0, 0, 0.45)',
        }}>
          <div style={{
            width: `${healthPercent * 100}%`,
            height: '100%',
            background: healthColor,
            transition: 'width 0.2s',
            filter: isNight ? 'brightness(0.6)' : 'none',
          }} />
        </div>
      </Html>

      {/* ---- Humanoid Body ---- */}
      {/* Head */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[0.4, 0.45, 0.4]} />
        <meshStandardMaterial color="#c4956a" />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color="#8b0000" /> {/* Dark red shirt */}
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.55, 1.7, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.8, 0]}>
          <boxGeometry args={[0.2, 0.15, 0.2]} />
          <meshStandardMaterial color="#c4956a" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.55, 1.7, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.8, 0]}>
          <boxGeometry args={[0.2, 0.15, 0.2]} />
          <meshStandardMaterial color="#c4956a" />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.2, 0.8, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#2a2a4a" /> {/* Dark pants */}
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.85, 0.05]}>
          <boxGeometry args={[0.3, 0.15, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.2, 0.8, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#2a2a4a" />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.85, 0.05]}>
          <boxGeometry args={[0.3, 0.15, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}

export default React.memo(Enemy);
