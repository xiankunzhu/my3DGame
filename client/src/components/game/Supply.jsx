/**
 * ============================================
 * Supply Component
 * ============================================
 * Renders collectible supply items on the ground:
 * - Ammo crate (blue, spinning)
 * - Health pack (green, spinning)
 * Automatically collected when player walks near
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function Supply({ supply }) {
  const meshRef = useRef();

  // ---- Floating & spinning animation ----
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y = time * 2;
    meshRef.current.position.y = supply.position[1] + Math.sin(time * 3) * 0.15;
  });

  const isAmmo = supply.type === 'ammo';
  const color = isAmmo ? '#3b82f6' : '#22c55e';

  return (
    <group position={[supply.position[0], 0, supply.position[2]]}>
      <mesh ref={meshRef} position={[0, supply.position[1], 0]} castShadow>
        {isAmmo ? (
          // Ammo crate - small box shape
          <boxGeometry args={[0.6, 0.4, 0.4]} />
        ) : (
          // Health pack - cross-like shape approximated by box
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.2}
          roughness={0.5}
        />
      </mesh>

      {/* Glow ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, 0.8, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={2} />
      </mesh>

      {/* Health pack cross decoration */}
      {!isAmmo && (
        <>
          <mesh position={[0, supply.position[1], 0]} ref={null}>
            <boxGeometry args={[0.5, 0.12, 0.15]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, supply.position[1], 0]}>
            <boxGeometry args={[0.15, 0.12, 0.5]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </>
      )}

      {/* Point light for glow effect */}
      <pointLight
        position={[0, 1, 0]}
        color={color}
        intensity={2}
        distance={4}
      />
    </group>
  );
}

export default React.memo(Supply);
