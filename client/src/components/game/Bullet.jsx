/**
 * ============================================
 * Bullet Component
 * ============================================
 * Renders a bullet projectile as a small
 * glowing sphere traveling in a direction
 */

import React from 'react';

function Bullet({ bullet }) {
  return (
    <mesh position={bullet.position}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial color="#ffaa00" />
      {/* Bullet trail glow */}
      <pointLight color="#ffaa00" intensity={3} distance={3} />
    </mesh>
  );
}

export default React.memo(Bullet);
