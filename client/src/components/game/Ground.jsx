/**
 * ============================================
 * Ground Component
 * ============================================
 * Renders an expanding ground plane made of chunks.
 * New chunks are added as the player approaches
 * the edge of the explored area.
 */

import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { GAME_CONSTANTS } from '../../store/gameStore';
import { getChunkSeason, SEASON_GROUND_COLORS } from '../../game/levelData';

const EDGE_LOAD_MARGIN = 8;

function getChunkIndex(value, chunkSize) {
  return Math.floor((value + chunkSize / 2) / chunkSize);
}

function getChunkKey(chunkX, chunkZ) {
  return `${chunkX},${chunkZ}`;
}

function Ground({ playerPosition }) {
  const chunkSize = GAME_CONSTANTS.MAP_SIZE;
  const [loadedChunks, setLoadedChunks] = useState(() => new Set(['0,0']));

  // ---- Create a procedural ground texture ----
  const groundTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color (dark grass/dirt)
    ctx.fillStyle = '#3a5a2c';
    ctx.fillRect(0, 0, 512, 512);

    // Add some noise/variation
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 4 + 1;
      const brightness = Math.random() * 30 - 15;
      const r = 58 + brightness;
      const g = 90 + brightness;
      const b = 44 + brightness;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, []);

  useEffect(() => {
    const chunkX = getChunkIndex(playerPosition[0], chunkSize);
    const chunkZ = getChunkIndex(playerPosition[2], chunkSize);
    const centerX = chunkX * chunkSize;
    const centerZ = chunkZ * chunkSize;
    const nearEdgeX = Math.abs(playerPosition[0] - centerX) > (chunkSize / 2 - EDGE_LOAD_MARGIN);
    const nearEdgeZ = Math.abs(playerPosition[2] - centerZ) > (chunkSize / 2 - EDGE_LOAD_MARGIN);

    setLoadedChunks((previous) => {
      const next = new Set(previous);
      next.add(getChunkKey(chunkX, chunkZ));

      if (nearEdgeX || nearEdgeZ) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          for (let zOffset = -1; zOffset <= 1; zOffset += 1) {
            next.add(getChunkKey(chunkX + xOffset, chunkZ + zOffset));
          }
        }
      }

      return next;
    });
  }, [playerPosition, chunkSize]);

  const chunkMeshes = useMemo(
    () => Array.from(loadedChunks).map((key) => {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      const season = getChunkSeason(chunkX, chunkZ);
      return {
        key,
        position: [chunkX * chunkSize, 0, chunkZ * chunkSize],
        groundColor: SEASON_GROUND_COLORS[season],
      };
    }),
    [loadedChunks, chunkSize],
  );

  return (
    <group>
      {chunkMeshes.map((chunk) => (
        <mesh
          key={chunk.key}
          rotation={[-Math.PI / 2, 0, 0]}
          position={chunk.position}
          receiveShadow
        >
          <planeGeometry args={[chunkSize, chunkSize]} />
          <meshStandardMaterial
            map={groundTexture}
            color={chunk.groundColor}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

export default Ground;
