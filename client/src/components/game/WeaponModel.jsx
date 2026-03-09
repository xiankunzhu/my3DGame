/**
 * ============================================
 * Weapon Model (First-Person View)
 * ============================================
 * Renders the currently held weapon in the
 * bottom-right of the screen (attached to camera).
 * Supports gun and knife with simple animations.
 */

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

function WeaponModel() {
  const { camera } = useThree();
  const groupRef = useRef();
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const isShooting = useGameStore((s) => s.isShooting);
  const isKnifing = useGameStore((s) => s.isKnifing);
  const isNight = useGameStore((s) => s.isNight);
  const animOffset = useRef(0);

  // ---- Attach weapon to camera each frame ----
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth bob animation while moving
    const time = state.clock.getElapsedTime();
    const bob = Math.sin(time * 5) * 0.01;

    // Position weapon relative to camera
    const offset = new THREE.Vector3(0.3, -0.25 + bob, -0.5);
    offset.applyQuaternion(camera.quaternion);
    groupRef.current.position.copy(camera.position).add(offset);
    groupRef.current.quaternion.copy(camera.quaternion);

    // ---- Shooting recoil animation ----
    if (isShooting && (currentWeapon === 'rifle' || currentWeapon === 'pistol')) {
      const maxKick = currentWeapon === 'rifle' ? 0.1 : 0.07;
      animOffset.current = Math.min(animOffset.current + delta * 20, maxKick);
    } else if (isKnifing && currentWeapon === 'knife') {
      animOffset.current = Math.min(animOffset.current + delta * 15, 0.3);
    } else {
      animOffset.current *= 0.85; // Ease back
    }

    // Apply recoil/swing as local offset
    const recoil = new THREE.Vector3(0, 0, animOffset.current);
    recoil.applyQuaternion(camera.quaternion);
    groupRef.current.position.add(recoil);
  });

  return (
    <group ref={groupRef}>
      {currentWeapon === 'rifle' && <RifleModel />}
      {currentWeapon === 'pistol' && <PistolModel />}
      {currentWeapon === 'flashlight' && <FlashlightModel enabled={isNight} />}
      {currentWeapon === 'knife' && <KnifeModel />}
    </group>
  );
}

/**
 * Simple procedural rifle model
 */
function RifleModel() {
  return (
    <group scale={0.08}>
      {/* Gun barrel */}
      <mesh position={[0, 0, -3]}>
        <boxGeometry args={[0.4, 0.4, 4]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Gun body */}
      <mesh position={[0, -0.3, -0.5]}>
        <boxGeometry args={[0.6, 0.8, 2]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Gun grip */}
      <mesh position={[0, -1, 0.3]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.5, 1.2, 0.5]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.8} />
      </mesh>
      {/* Muzzle flash hint */}
      <mesh position={[0, 0, -5.2]}>
        <cylinderGeometry args={[0.15, 0.25, 0.3, 8]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Simple procedural hand gun model
 */
function PistolModel() {
  return (
    <group scale={0.1} rotation={[0.05, 0.12, -0.05]}>
      {/* Slide */}
      <mesh position={[0, 0.05, -1.5]}>
        <boxGeometry args={[0.45, 0.3, 1.7]} />
        <meshStandardMaterial color="#2f3136" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, -0.15, -0.7]}>
        <boxGeometry args={[0.42, 0.35, 1.2]} />
        <meshStandardMaterial color="#1f2126" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Trigger guard */}
      <mesh position={[0, -0.28, -0.15]}>
        <torusGeometry args={[0.14, 0.04, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1f2126" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Grip */}
      <mesh position={[0, -0.7, 0.15]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.35, 0.95, 0.45]} />
        <meshStandardMaterial color="#4b2e1d" roughness={0.85} />
      </mesh>
      {/* Barrel opening */}
      <mesh position={[0, 0.03, -2.35]}>
        <cylinderGeometry args={[0.08, 0.1, 0.18, 10]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#16181c" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function FlashlightModel({ enabled }) {
  const lightRef = useRef();
  const targetRef = useRef();

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <group scale={0.11} rotation={[0.08, 0.18, -0.1]}>
      <mesh position={[0, -0.1, -1.2]}>
        <cylinderGeometry args={[0.25, 0.22, 2.4, 18]} />
        <meshStandardMaterial color="#2f343a" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, -2.5]}>
        <cylinderGeometry args={[0.3, 0.3, 0.28, 20]} />
        <meshStandardMaterial
          color={enabled ? '#dbe9ff' : '#6a737d'}
          emissive={enabled ? '#dbe9ff' : '#000000'}
          emissiveIntensity={enabled ? 1.6 : 0}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, -0.45, -0.9]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.28, 0.75, 0.38]} />
        <meshStandardMaterial color="#1f2328" metalness={0.45} roughness={0.45} />
      </mesh>
      <spotLight
        ref={lightRef}
        position={[0, 0, -2.35]}
        angle={0.48}
        penumbra={0.85}
        intensity={enabled ? 42 : 0}
        distance={90}
        decay={1.1}
        color="#f5f3d7"
        castShadow
      />
      <pointLight
        position={[0, 0, -1.9]}
        intensity={enabled ? 2.8 : 0}
        distance={16}
        decay={1.6}
        color="#fff4c8"
      />
      <object3D ref={targetRef} position={[0, 0, -28]} />
    </group>
  );
}

/**
 * Simple procedural knife model
 */
function KnifeModel() {
  return (
    <group scale={0.1} rotation={[0, 0, -0.3]}>
      {/* Knife blade */}
      <mesh position={[0, 0, -2.5]}>
        <boxGeometry args={[0.15, 0.6, 3]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Knife handle */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.5, 1.5]} />
        <meshStandardMaterial color="#3d1f00" roughness={0.8} />
      </mesh>
      {/* Guard */}
      <mesh position={[0, 0, -0.9]}>
        <boxGeometry args={[0.5, 0.7, 0.15]} />
        <meshStandardMaterial color="#666" metalness={0.7} />
      </mesh>
    </group>
  );
}

export default WeaponModel;
