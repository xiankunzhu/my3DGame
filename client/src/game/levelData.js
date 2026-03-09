/**
 * ============================================
 * Level Data & Collision Helpers
 * ============================================
 * Generates deterministic chunk-based level content
 * so the map can keep expanding as the player moves.
 */

export const LEVEL_CHUNK_SIZE = 50;

export const CHUNK_SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter',
};

export const SEASON_GROUND_COLORS = {
  [CHUNK_SEASONS.SPRING]: '#6fa85d',
  [CHUNK_SEASONS.SUMMER]: '#4f7f34',
  [CHUNK_SEASONS.AUTUMN]: '#9a6a2f',
  [CHUNK_SEASONS.WINTER]: '#d8e4ea',
};

const CHUNK_MARGIN = 6;
const chunkCache = new Map();

const BASE_CHUNK_STRUCTURES = [
  { id: 'crate-0', type: 'crate', position: [5, 0.5, -3], scale: [1.1, 1.2, 1.0], rotation: 0.12 },
  { id: 'crate-1', type: 'crate', position: [-8, 0.5, 7], scale: [1.3, 1.1, 1.2], rotation: 0.2 },
  { id: 'crate-2', type: 'crate', position: [12, 0.5, 10], scale: [1.2, 1.0, 1.3], rotation: 0.08 },
  { id: 'crate-3', type: 'crate', position: [-15, 0.5, -12], scale: [1.4, 1.3, 1.2], rotation: 0.16 },
  { id: 'crate-4', type: 'crate', position: [3, 0.5, 15], scale: [1.1, 1.0, 1.4], rotation: 0.24 },
  { id: 'crate-5', type: 'crate', position: [-10, 0.5, -5], scale: [1.2, 1.4, 1.1], rotation: 0.05 },
  { id: 'crate-6', type: 'crate', position: [18, 0.5, -8], scale: [1.3, 1.2, 1.0], rotation: 0.18 },
  { id: 'crate-7', type: 'crate', position: [-6, 0.5, 18], scale: [1.2, 1.1, 1.3], rotation: 0.14 },
  { id: 'crate-8', type: 'crate', position: [8, 0.5, -15], scale: [1.4, 1.2, 1.1], rotation: 0.22 },
  { id: 'crate-9', type: 'crate', position: [-18, 0.5, 3], scale: [1.0, 1.2, 1.0], rotation: 0.11 },
  { id: 'crate-10', type: 'crate', position: [14, 0.5, 5], scale: [1.2, 1.3, 1.2], rotation: 0.19 },
  { id: 'crate-11', type: 'crate', position: [-4, 0.5, -18], scale: [1.3, 1.1, 1.4], rotation: 0.09 },
  { id: 'wall-0', type: 'wall', position: [8, 1.5, 0], scale: [0.5, 3, 6], rotation: 0 },
  { id: 'wall-1', type: 'wall', position: [-12, 1.5, -8], scale: [6, 3, 0.5], rotation: 0 },
  { id: 'wall-2', type: 'wall', position: [0, 1.5, -10], scale: [0.5, 3, 4], rotation: 0.5 },
  { id: 'wall-3', type: 'wall', position: [-5, 1.5, 12], scale: [8, 3, 0.5], rotation: 0.3 },
  { id: 'wall-4', type: 'wall', position: [15, 1.5, -15], scale: [0.5, 3, 5], rotation: 0 },
  { id: 'wall-5', type: 'wall', position: [-18, 1.5, 10], scale: [4, 3, 0.5], rotation: -0.2 },
  { id: 'building-0', type: 'building', position: [-15, 2, -18], scale: [5, 4, 5], rotation: 0 },
  { id: 'building-1', type: 'building', position: [18, 2, 15], scale: [4, 4, 6], rotation: 0 },
  { id: 'building-2', type: 'building', position: [-10, 1.5, 18], scale: [3, 3, 3], rotation: 0 },
  { id: 'building-3', type: 'building', position: [10, 2.5, -18], scale: [6, 5, 4], rotation: 0 },
];

const BASE_CHUNK_BARRELS = [
  { id: 'barrel-0', position: [2, 0.6, -8], radius: 0.45 },
  { id: 'barrel-1', position: [3, 0.6, -7.5], radius: 0.45 },
  { id: 'barrel-2', position: [-7, 0.6, 3], radius: 0.45 },
  { id: 'barrel-3', position: [16, 0.6, 12], radius: 0.45 },
];

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeed(chunkX, chunkZ) {
  return ((chunkX + 2048) * 92837111) ^ ((chunkZ + 2048) * 689287499);
}

export function getChunkSeason(chunkX, chunkZ) {
  const rand = mulberry32(getSeed(chunkX, chunkZ) ^ 0x9e3779b9);
  const roll = rand();

  if (roll < 0.25) return CHUNK_SEASONS.SPRING;
  if (roll < 0.5) return CHUNK_SEASONS.SUMMER;
  if (roll < 0.75) return CHUNK_SEASONS.AUTUMN;
  return CHUNK_SEASONS.WINTER;
}

export function getChunkIndex(value, chunkSize = LEVEL_CHUNK_SIZE) {
  return Math.floor((value + chunkSize / 2) / chunkSize);
}

function getChunkKey(chunkX, chunkZ) {
  return `${chunkX},${chunkZ}`;
}

function createColliderFromStructure(item) {
  return {
    id: item.id,
    shape: 'box',
    x: item.position[0],
    y: item.position[1],
    z: item.position[2],
    height: item.scale[1],
    width: item.scale[0],
    depth: item.scale[2],
    rotation: item.rotation || 0,
  };
}

function createColliderFromBarrel(item) {
  return {
    id: item.id,
    shape: 'circle',
    x: item.position[0],
    y: item.position[1],
    z: item.position[2],
    radius: item.radius,
    height: 1.2,
  };
}

function translatePosition(chunkX, chunkZ, localX, localY, localZ) {
  return [
    chunkX * LEVEL_CHUNK_SIZE + localX,
    localY,
    chunkZ * LEVEL_CHUNK_SIZE + localZ,
  ];
}

function toLocalDistance(placed, x, z) {
  const dx = placed.x - x;
  const dz = placed.z - z;
  return Math.sqrt(dx * dx + dz * dz);
}

function tryPlace(rand, placed, minDistance, generator) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generator(rand);
    const blocked = placed.some((item) => toLocalDistance(item, candidate.x, candidate.z) < (item.radius + candidate.radius + minDistance));
    if (!blocked) {
      placed.push(candidate);
      return candidate;
    }
  }

  return null;
}

function randomRange(rand, min, max) {
  return min + rand() * (max - min);
}

function randomInt(rand, min, max) {
  return Math.floor(randomRange(rand, min, max + 1));
}

function generateProceduralChunk(chunkX, chunkZ) {
  const rand = mulberry32(getSeed(chunkX, chunkZ));
  const structures = [];
  const barrels = [];
  const placed = [];

  const buildingCount = randomInt(rand, 1, 2);
  const wallCount = randomInt(rand, 2, 4);
  const crateCount = randomInt(rand, 4, 7);
  const barrelCount = randomInt(rand, 1, 3);

  for (let index = 0; index < buildingCount; index += 1) {
    const width = randomRange(rand, 3.5, 6.5);
    const depth = randomRange(rand, 3.5, 6.5);
    const height = randomRange(rand, 3.2, 5.5);
    const radius = Math.max(width, depth) * 0.7;
    const placement = tryPlace(rand, placed, 2.5, () => ({
      x: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      z: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      radius,
    }));

    if (placement) {
      structures.push({
        id: `building-${chunkX}-${chunkZ}-${index}`,
        type: 'building',
        position: translatePosition(chunkX, chunkZ, placement.x, height / 2, placement.z),
        scale: [width, height, depth],
        rotation: 0,
      });
    }
  }

  for (let index = 0; index < wallCount; index += 1) {
    const isVertical = rand() > 0.5;
    const width = isVertical ? 0.6 : randomRange(rand, 4, 9);
    const depth = isVertical ? randomRange(rand, 4, 9) : 0.6;
    const height = randomRange(rand, 2.8, 3.6);
    const rotation = rand() > 0.5 ? 0 : randomRange(rand, -0.45, 0.45);
    const radius = Math.max(width, depth) * 0.65;
    const placement = tryPlace(rand, placed, 1.8, () => ({
      x: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      z: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      radius,
    }));

    if (placement) {
      structures.push({
        id: `wall-${chunkX}-${chunkZ}-${index}`,
        type: 'wall',
        position: translatePosition(chunkX, chunkZ, placement.x, height / 2, placement.z),
        scale: [width, height, depth],
        rotation,
      });
    }
  }

  for (let index = 0; index < crateCount; index += 1) {
    const width = randomRange(rand, 0.9, 1.5);
    const depth = randomRange(rand, 0.9, 1.5);
    const height = randomRange(rand, 0.9, 1.4);
    const radius = Math.max(width, depth) * 0.7;
    const placement = tryPlace(rand, placed, 0.8, () => ({
      x: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      z: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      radius,
    }));

    if (placement) {
      structures.push({
        id: `crate-${chunkX}-${chunkZ}-${index}`,
        type: 'crate',
        position: translatePosition(chunkX, chunkZ, placement.x, height / 2, placement.z),
        scale: [width, height, depth],
        rotation: randomRange(rand, -0.3, 0.3),
      });
    }
  }

  for (let index = 0; index < barrelCount; index += 1) {
    const radius = 0.45;
    const placement = tryPlace(rand, placed, 0.6, () => ({
      x: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      z: randomRange(rand, -LEVEL_CHUNK_SIZE / 2 + CHUNK_MARGIN, LEVEL_CHUNK_SIZE / 2 - CHUNK_MARGIN),
      radius,
    }));

    if (placement) {
      barrels.push({
        id: `barrel-${chunkX}-${chunkZ}-${index}`,
        position: translatePosition(chunkX, chunkZ, placement.x, 0.6, placement.z),
        radius,
      });
    }
  }

  return { structures, barrels };
}

export function getChunkContent(chunkX, chunkZ) {
  const key = getChunkKey(chunkX, chunkZ);
  if (chunkCache.has(key)) {
    return chunkCache.get(key);
  }

  let content;
  if (chunkX === 0 && chunkZ === 0) {
    content = {
      structures: BASE_CHUNK_STRUCTURES,
      barrels: BASE_CHUNK_BARRELS,
    };
  } else {
    content = generateProceduralChunk(chunkX, chunkZ);
  }

  const withColliders = {
    ...content,
    colliders: [
      ...content.structures.map(createColliderFromStructure),
      ...content.barrels.map(createColliderFromBarrel),
    ],
  };

  chunkCache.set(key, withColliders);
  return withColliders;
}

function getChunksForArea(minX, maxX, minZ, maxZ) {
  const minChunkX = getChunkIndex(minX);
  const maxChunkX = getChunkIndex(maxX);
  const minChunkZ = getChunkIndex(minZ);
  const maxChunkZ = getChunkIndex(maxZ);
  const chunks = [];

  for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
    for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ += 1) {
      chunks.push([chunkX, chunkZ]);
    }
  }

  return chunks;
}

function getCollidersForArea(minX, maxX, minZ, maxZ) {
  return getChunksForArea(minX, maxX, minZ, maxZ)
    .flatMap(([chunkX, chunkZ]) => getChunkContent(chunkX, chunkZ).colliders);
}

export function getVisibleLevelObjects(playerPosition, radiusChunks = 1) {
  const chunkX = getChunkIndex(playerPosition[0]);
  const chunkZ = getChunkIndex(playerPosition[2]);
  const structures = [];
  const barrels = [];

  for (let xOffset = -radiusChunks; xOffset <= radiusChunks; xOffset += 1) {
    for (let zOffset = -radiusChunks; zOffset <= radiusChunks; zOffset += 1) {
      const chunk = getChunkContent(chunkX + xOffset, chunkZ + zOffset);
      structures.push(...chunk.structures);
      barrels.push(...chunk.barrels);
    }
  }

  return { structures, barrels };
}

function rotatePoint(x, z, cx, cz, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - cx;
  const dz = z - cz;

  return {
    x: dx * cos - dz * sin + cx,
    z: dx * sin + dz * cos + cz,
  };
}

function circleIntersectsBox(x, z, radius, collider) {
  const rotated = rotatePoint(x, z, collider.x, collider.z, -collider.rotation);
  const halfWidth = collider.width / 2;
  const halfDepth = collider.depth / 2;
  const closestX = Math.max(collider.x - halfWidth, Math.min(rotated.x, collider.x + halfWidth));
  const closestZ = Math.max(collider.z - halfDepth, Math.min(rotated.z, collider.z + halfDepth));
  const dx = rotated.x - closestX;
  const dz = rotated.z - closestZ;

  return dx * dx + dz * dz <= radius * radius;
}

function circleIntersectsCircle(x, z, radius, collider) {
  const dx = x - collider.x;
  const dz = z - collider.z;
  const minDistance = radius + collider.radius;
  return dx * dx + dz * dz <= minDistance * minDistance;
}

function sphereIntersectsBox(x, y, z, radius, collider) {
  const rotated = rotatePoint(x, z, collider.x, collider.z, -collider.rotation);
  const halfWidth = collider.width / 2;
  const halfDepth = collider.depth / 2;
  const halfHeight = collider.height / 2;

  const closestX = Math.max(collider.x - halfWidth, Math.min(rotated.x, collider.x + halfWidth));
  const closestY = Math.max(collider.y - halfHeight, Math.min(y, collider.y + halfHeight));
  const closestZ = Math.max(collider.z - halfDepth, Math.min(rotated.z, collider.z + halfDepth));

  const dx = rotated.x - closestX;
  const dy = y - closestY;
  const dz = rotated.z - closestZ;

  return dx * dx + dy * dy + dz * dz <= radius * radius;
}

function sphereIntersectsCylinder(x, y, z, radius, collider) {
  const dx = x - collider.x;
  const dz = z - collider.z;
  const horizontalRadius = radius + collider.radius;
  const halfHeight = collider.height / 2;
  const clampedY = Math.max(collider.y - halfHeight, Math.min(y, collider.y + halfHeight));
  const dy = y - clampedY;

  return (dx * dx + dz * dz <= horizontalRadius * horizontalRadius) && (dy * dy <= radius * radius);
}

function isBlockedByLevel3D(x, y, z, radius = 0) {
  const colliders = getCollidersForArea(x - radius, x + radius, z - radius, z + radius);
  return colliders.some((collider) => {
    if (collider.shape === 'circle') {
      return sphereIntersectsCylinder(x, y, z, radius, collider);
    }

    return sphereIntersectsBox(x, y, z, radius, collider);
  });
}

export function isBlockedByLevel(x, z, radius = 0) {
  const colliders = getCollidersForArea(x - radius, x + radius, z - radius, z + radius);
  return colliders.some((collider) => {
    if (collider.shape === 'circle') {
      return circleIntersectsCircle(x, z, radius, collider);
    }

    return circleIntersectsBox(x, z, radius, collider);
  });
}

export function moveWithLevelCollisions(currentPosition, nextPosition, radius = 0) {
  if (!isBlockedByLevel(nextPosition[0], nextPosition[2], radius)) {
    return nextPosition;
  }

  const slideX = [nextPosition[0], nextPosition[1], currentPosition[2]];
  if (!isBlockedByLevel(slideX[0], slideX[2], radius)) {
    return slideX;
  }

  const slideZ = [currentPosition[0], nextPosition[1], nextPosition[2]];
  if (!isBlockedByLevel(slideZ[0], slideZ[2], radius)) {
    return slideZ;
  }

  return currentPosition;
}

export function segmentHitsLevel(start, end, radius = 0) {
  const dy = (end[1] ?? 0) - (start[1] ?? 0);
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const steps = Math.max(2, Math.ceil(distance / 0.2));

  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const x = start[0] + dx * t;
    const y = (start[1] ?? 0) + dy * t;
    const z = start[2] + dz * t;
    if (isBlockedByLevel3D(x, y, z, radius)) {
      return true;
    }
  }

  return false;
}
