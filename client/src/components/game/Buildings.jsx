/**
 * ============================================
 * Buildings / Obstacles Component
 * ============================================
 * Procedurally placed blocks and structures
 * scattered around the map for cover and decoration.
 * Includes crates, walls, and simple buildings.
 */

import React, { useMemo } from 'react';
import { getChunkIndex, getVisibleLevelObjects } from '../../game/levelData';

function Buildings({ playerPosition }) {
  const chunkX = getChunkIndex(playerPosition[0]);
  const chunkZ = getChunkIndex(playerPosition[2]);
  const { structures, barrels } = useMemo(
    () => getVisibleLevelObjects(playerPosition, 1),
    [chunkX, chunkZ],
  );

  return (
    <group>
      {structures.map((item) => {
        switch (item.type) {
          case 'crate':
            return <Crate key={item.id} {...item} />;
          case 'wall':
            return <Wall key={item.id} {...item} />;
          case 'building':
            return <Building key={item.id} {...item} />;
          default:
            return null;
        }
      })}

      {/* ---- Some barrels for decoration ---- */}
      {barrels.map((barrel) => (
        <Barrel key={barrel.id} position={barrel.position} />
      ))}
    </group>
  );
}

/**
 * Wooden crate mesh
 */
function Crate({ position, scale, rotation }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial color="#8B6914" roughness={0.85} />
    </mesh>
  );
}

/**
 * Concrete wall segment
 */
function Wall({ position, scale, rotation }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial color="#6a6a7a" roughness={0.9} metalness={0} />
    </mesh>
  );
}

/**
 * Simple building (large textured block)
 */
function Building({ position, scale }) {
  return (
    <group position={position}>
      {/* Main structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={scale} />
        <meshStandardMaterial color="#5a5a6a" roughness={0.8} />
      </mesh>
      {/* Roof (slightly larger) */}
      <mesh position={[0, scale[1] / 2 + 0.15, 0]} castShadow>
        <boxGeometry args={[scale[0] + 0.4, 0.3, scale[2] + 0.4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.7} />
      </mesh>
      {/* Window decorations */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * scale[0] * 0.3, 0.3, scale[2] / 2 + 0.01]}>
          <planeGeometry args={[0.6, 0.8]} />
          <meshBasicMaterial color="#1a3a5a" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Metal barrel
 */
function Barrel({ position }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
      <meshStandardMaterial color="#4a6a4a" metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

export default Buildings;
