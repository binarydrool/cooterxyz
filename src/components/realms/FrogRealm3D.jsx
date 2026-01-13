"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile } from '@/hooks/useGameInput';
import CoolFrog from './frog/CoolFrog';
import Flower from './frog/Flower';
import Essence from './frog/Essence';
import AEIOU from '../characters/AEIOU';
import { useInventory } from '@/hooks/useInventory';
import { useAudio, SOUNDS } from '@/hooks/useAudio';

// Difficulty settings - EPIC survival adventure! 3 SECOND IDLE = DEATH!
const DIFFICULTY_SETTINGS = {
  beginner: { padCount: 2400, jumpRange: 6, idleTime: 3, fishInterval: 8000, padsPerAttack: 2, fishSpeed: 0.4, dragonflyCount: 1, dragonflySpeed: 1.2 },
  easy: { padCount: 2400, jumpRange: 5.5, idleTime: 3, fishInterval: 7000, padsPerAttack: 2, fishSpeed: 0.5, dragonflyCount: 2, dragonflySpeed: 1.5 },
  normal: { padCount: 2400, jumpRange: 5, idleTime: 3, fishInterval: 6000, padsPerAttack: 3, fishSpeed: 0.6, dragonflyCount: 2, dragonflySpeed: 1.8 },
  hard: { padCount: 2400, jumpRange: 5, idleTime: 3, fishInterval: 5000, padsPerAttack: 3, fishSpeed: 0.7, dragonflyCount: 3, dragonflySpeed: 2.2 },
  expert: { padCount: 2400, jumpRange: 4.5, idleTime: 3, fishInterval: 4000, padsPerAttack: 4, fishSpeed: 0.8, dragonflyCount: 4, dragonflySpeed: 2.5 },
  master: { padCount: 2400, jumpRange: 4.5, idleTime: 3, fishInterval: 3500, padsPerAttack: 4, fishSpeed: 0.9, dragonflyCount: 5, dragonflySpeed: 3 },
  impossible: { padCount: 2400, jumpRange: 4, idleTime: 3, fishInterval: 3000, padsPerAttack: 5, fishSpeed: 1.0, dragonflyCount: 6, dragonflySpeed: 3.5 },
};

const POND_SIZE = 200;
const PAD_MIN_DISTANCE = 2.2; // Tight but no overlap
const PAD_MAX_DISTANCE = 4.5;
const BASE_FLOWER_COUNT = 12; // Fewer flowers for better performance
const ESSENCE_COUNT = 3;
const MIN_DISTANCE_FROM_START = 20; // Essences closer to start
const AEIOU_MIN_DISTANCE = 25; // AEIOU much easier to find!

// Pond holes - areas with NO lily pads (creates paths/maze)
const POND_HOLES = [
  { x: 20, z: 20, radius: 12 },
  { x: -25, z: 15, radius: 10 },
  { x: 30, z: -20, radius: 14 },
  { x: -15, z: -30, radius: 11 },
  { x: 0, z: 40, radius: 13 },
  { x: 45, z: 0, radius: 12 },
  { x: -40, z: -10, radius: 10 },
  { x: 10, z: -50, radius: 15 },
  { x: -30, z: 45, radius: 11 },
  { x: 50, z: 35, radius: 13 },
  { x: -50, z: -40, radius: 12 },
  { x: 35, z: 55, radius: 10 },
];
const PAD_RESPAWN_TIME = 10000; // 10 seconds
const WARNING_TIME = 1500; // 1.5 seconds before pad destruction

const LOTUS_COLORS = ['#FFD700', '#4169E1', '#FF69B4'];
const FLOWER_TYPES = ['lotus', 'waterlily', 'purple', 'yellow'];

// Power-up configuration - reasonable amounts
const POWERUP_CONFIG = {
  coinCount: 20,           // Regular coins - +10 points
  bigCoinCount: 8,         // Big coins - +50 points
  invincibilityCount: 3,   // Shields - 5 second immunity
  extraLifeCount: 3,       // Hearts - +1 life
  speedBoostCount: 3,      // Speed ups - 8 seconds faster
  timeFreezeCount: 2,      // Freeze time - 5 seconds fish stop
  magnetCount: 2,          // Magnets - 10 seconds auto-collect
};

// N64 style vibrant power-up colors
const POWERUP_COLORS = {
  coin: '#FFCC00',
  bigCoin: '#FFFF00',
  invincibility: '#00FFFF',
  extraLife: '#FF4488',
  speedBoost: '#44FF44',
  timeFreeze: '#AADDFF',
  magnet: '#CC44FF',
};

const POWERUP_DURATIONS = {
  invincibility: 5000,
  speedBoost: 8000,
  timeFreeze: 5000,
  magnet: 10000,
};

// Generate lily pads using connected network algorithm
function generateLilyPads(count, jumpRange) {
  const pads = [];

  // Start pad at center
  pads.push({
    id: 0,
    x: 0,
    z: 0,
    size: 1.2,
    type: 'lilypad',
    hasLotus: false,
    lotusColor: null,
    eaten: false,
    isBeingAttacked: false,
    hasAEIOU: false,
    hasEssence: false,
  });

  // Generate connected network - each new pad spawns within jump distance of existing pad
  for (let i = 1; i < count; i++) {
    // Pick a random existing pad as parent
    const parentPad = pads[Math.floor(Math.random() * pads.length)];

    // Generate new pad within jump distance
    const angle = Math.random() * Math.PI * 2;
    const distance = PAD_MIN_DISTANCE + Math.random() * (jumpRange - PAD_MIN_DISTANCE);

    let x = parentPad.x + Math.cos(angle) * distance;
    let z = parentPad.z + Math.sin(angle) * distance;

    // Keep within bounds
    x = Math.max(-POND_SIZE / 2, Math.min(POND_SIZE / 2, x));
    z = Math.max(-POND_SIZE / 2, Math.min(POND_SIZE / 2, z));

    // Check if in a pond hole (no pads allowed here - creates paths!)
    let inPondHole = false;
    for (const hole of POND_HOLES) {
      const dx = hole.x - x;
      const dz = hole.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < hole.radius) {
        inPondHole = true;
        break;
      }
    }
    if (inPondHole) continue;

    // Check not too close to existing pads - no overlap!
    let tooClose = false;
    for (const existingPad of pads) {
      const dx = existingPad.x - x;
      const dz = existingPad.z - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = (existingPad.size + 0.8) * 1.3; // Pads can't touch!
      if (dist < Math.max(PAD_MIN_DISTANCE, minDist)) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // Random chance for lotus flower
    const hasLotus = Math.random() < 0.2;
    const lotusColor = hasLotus ? LOTUS_COLORS[Math.floor(Math.random() * LOTUS_COLORS.length)] : null;

    pads.push({
      id: i,
      x,
      z,
      size: 0.7 + Math.random() * 0.3,
      type: 'lilypad',
      hasLotus,
      lotusColor,
      eaten: false,
      isBeingAttacked: false,
      hasAEIOU: false,
      hasEssence: false,
    });
  }

  // Place AEIOU - ALWAYS place it, pick from furthest pads
  const sortedByDistance = [...pads]
    .filter(p => p.id > 0)
    .sort((a, b) => {
      const distA = Math.sqrt(a.x * a.x + a.z * a.z);
      const distB = Math.sqrt(b.x * b.x + b.z * b.z);
      return distB - distA; // Sort by distance descending
    });

  // Pick from top 10 furthest pads (or all if less than 10)
  const topFurthest = sortedByDistance.slice(0, Math.min(10, sortedByDistance.length));
  if (topFurthest.length > 0) {
    const aeiouPad = topFurthest[Math.floor(Math.random() * topFurthest.length)];
    aeiouPad.hasAEIOU = true;
    console.log('AEIOU placed at pad:', aeiouPad.id, 'position:', aeiouPad.x, aeiouPad.z);
  }

  // Place essences - ALWAYS place 3 essences on random pads (not AEIOU's pad, not start pad)
  const validEssencePads = pads.filter(p => p.id > 0 && !p.hasAEIOU);
  const shuffled = [...validEssencePads].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(ESSENCE_COUNT, shuffled.length); i++) {
    shuffled[i].hasEssence = true;
    console.log('Essence placed at pad:', shuffled[i].id, 'position:', shuffled[i].x, shuffled[i].z);
  }

  return pads;
}

// Generate decorative flowers
function generateFlowers(count, existingPads) {
  const flowers = [];
  const attempts = count * 10; // Max attempts to place flowers

  for (let i = 0; i < attempts && flowers.length < count; i++) {
    const x = (Math.random() - 0.5) * POND_SIZE * 0.9;
    const z = (Math.random() - 0.5) * POND_SIZE * 0.9;

    // Check not overlapping with lily pads
    let overlapping = false;
    for (const pad of existingPads) {
      const dx = pad.x - x;
      const dz = pad.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        overlapping = true;
        break;
      }
    }

    // Check not overlapping with other flowers
    for (const flower of flowers) {
      const dx = flower.x - x;
      const dz = flower.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        overlapping = true;
        break;
      }
    }

    if (!overlapping) {
      flowers.push({
        id: flowers.length,
        x,
        z,
        type: FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)],
        size: 0.8 + Math.random() * 0.4,
      });
    }
  }

  return flowers;
}

// Find safest pad for respawn
function findSafeRespawnPad(pads, recentAttacks) {
  const scoredPads = pads
    .filter(p => !p.eaten && !p.isBeingAttacked && !p.hasAEIOU)
    .map(pad => {
      let safetyScore = 100;

      // Penalize pads near recent fish attacks
      for (const attack of recentAttacks) {
        const dx = pad.x - attack.x;
        const dz = pad.z - attack.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 20) {
          safetyScore -= (20 - dist) * 2;
        }
      }

      // Prefer pads closer to center (easier area)
      const distFromCenter = Math.sqrt(pad.x * pad.x + pad.z * pad.z);
      safetyScore -= distFromCenter * 0.05;

      return { pad, safetyScore };
    });

  scoredPads.sort((a, b) => b.safetyScore - a.safetyScore);
  return scoredPads[0]?.pad || pads[0];
}

// Animated Fish Attack visual at a pad location - simplified for performance
function FishAttackVisual({ position, isActive }) {
  if (!isActive) return null;

  // Simplified static visual - no animation
  return (
    <group position={[position[0], -0.5, position[2]]}>
      {/* Simple fish silhouette */}
      <mesh>
        <sphereGeometry args={[0.8, 6, 6]} />
        <meshBasicMaterial color="#1a3a5c" transparent opacity={0.7} />
      </mesh>
      {/* Red eyes */}
      <mesh position={[-0.2, 0.3, 0.4]}>
        <sphereGeometry args={[0.15, 4, 4]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0.2, 0.3, 0.4]}>
        <sphereGeometry args={[0.15, 4, 4]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

// Lily Pad component - OPTIMIZED bright circles
function LilyPad({ pad, isPlayerHere }) {
  if (pad.eaten) return null;

  // Bright visible colors
  const color = isPlayerHere ? '#66ff66' : pad.isBeingAttacked ? '#ff4444' : '#33dd33';

  return (
    <group position={[pad.x, 0, pad.z]}>
      {/* Bright circular pad */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[pad.size, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Darker center spot */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[pad.size * 0.2, 8]} />
        <meshBasicMaterial color="#228822" />
      </mesh>
      {/* Bright glow when player is here */}
      {isPlayerHere && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[pad.size * 0.9, pad.size * 1.1, 16]} />
          <meshBasicMaterial color="#aaffaa" />
        </mesh>
      )}
      {/* Red warning when being attacked */}
      {pad.isBeingAttacked && (
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[pad.size, pad.size * 1.3, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// AEIOU wrapper - small and simple, no beacon
function AEIOUOnPad({ pad, found, allEssencesCollected }) {
  // Don't show if no pad, already found, or essences not yet collected
  if (!pad || found || !allEssencesCollected) return null;

  return (
    <group position={[pad.x, 0.2, pad.z]}>
      {/* AEIOU character - small */}
      <AEIOU
        position={[0, 0, 0]}
        scale={0.5}
        variant="realm"
        glowIntensity={0.3}
        found={found}
      />
    </group>
  );
}

// Monster Fish - SMOOTH jaw attack animation
function MonsterFish({ fishState, playerPos, gamePaused }) {
  const groupRef = useRef();
  const shadowRef = useRef();
  const jawRef = useRef();
  const swimAngle = useRef(Math.random() * Math.PI * 2);
  const fishPosRef = useRef({ x: playerPos[0], z: playerPos[2] });
  const jawYRef = useRef(-2); // Jaw starts underwater

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (gamePaused) return;

    const isAttacking = fishState.phase === 'rising' || fishState.phase === 'striking';
    const isDiving = fishState.phase === 'diving';

    // SMOOTH jaw animation - only jaws come up!
    if (jawRef.current) {
      let targetY = -2; // Hidden underwater
      if (fishState.phase === 'rising') {
        targetY = -0.5; // Rising up
      } else if (fishState.phase === 'striking') {
        targetY = 1.2; // SNAP! Jaws above water
      } else if (isDiving) {
        targetY = -0.5; // Going back down
      }
      // Smooth interpolation
      jawYRef.current += (targetY - jawYRef.current) * 0.08;
      jawRef.current.position.y = jawYRef.current;

      // Jaw snapping animation when striking
      if (fishState.phase === 'striking') {
        const snap = Math.sin(Date.now() * 0.02) * 0.4;
        jawRef.current.children.forEach((child, i) => {
          if (i === 0) child.rotation.x = snap; // Upper jaw
          if (i === 1) child.rotation.x = -snap; // Lower jaw
        });
      }
    }

    // Fish body stays DEEP underwater - only shadow visible
    if (fishState.phase === 'swimming') {
      swimAngle.current += delta * 0.25;
      const radius = 10 + Math.sin(swimAngle.current * 0.3) * 3;
      const targetX = playerPos[0] + Math.cos(swimAngle.current) * radius;
      const targetZ = playerPos[2] + Math.sin(swimAngle.current) * radius;
      fishPosRef.current.x += (targetX - fishPosRef.current.x) * 0.015;
      fishPosRef.current.z += (targetZ - fishPosRef.current.z) * 0.015;
    }

    // Update group position for attacks
    if (groupRef.current) {
      if (isAttacking || isDiving) {
        groupRef.current.position.x = fishState.targetX;
        groupRef.current.position.z = fishState.targetZ;
      } else {
        groupRef.current.position.x = fishPosRef.current.x;
        groupRef.current.position.z = fishPosRef.current.z;
      }
    }

    // Update shadow
    if (shadowRef.current) {
      const shadowX = isAttacking || isDiving ? fishState.targetX : fishPosRef.current.x;
      const shadowZ = isAttacking || isDiving ? fishState.targetZ : fishPosRef.current.z;
      shadowRef.current.position.x = shadowX;
      shadowRef.current.position.z = shadowZ;
      const shadowScale = isAttacking ? 3 : 1.5;
      shadowRef.current.scale.set(shadowScale, shadowScale, 1);
      shadowRef.current.material.opacity = isAttacking ? 0.5 : 0.2;
    }
  });

  const isAttacking = fishState.phase === 'rising' || fishState.phase === 'striking' || fishState.phase === 'diving';

  return (
    <>
      {/* Shadow on water - always visible */}
      <mesh ref={shadowRef} position={[fishPosRef.current.x, -0.02, fishPosRef.current.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>

      <group ref={groupRef} position={[fishPosRef.current.x, 0, fishPosRef.current.z]}>
        {/* JAWS - the only part that comes up! */}
        <group ref={jawRef} position={[0, -2, 0]}>
          {/* Upper jaw */}
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.8]} />
            <meshBasicMaterial color="#2a5a4a" />
          </mesh>
          {/* Lower jaw */}
          <mesh position={[0, -0.35, 0.1]}>
            <boxGeometry args={[1.0, 0.25, 0.7]} />
            <meshBasicMaterial color="#3a6a5a" />
          </mesh>
          {/* Sharp teeth on upper jaw */}
          {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
            <mesh key={`up-${i}`} position={[x, -0.2, 0.3]}>
              <coneGeometry args={[0.06, 0.2, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
          {/* Sharp teeth on lower jaw */}
          {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
            <mesh key={`lo-${i}`} position={[x, -0.15, 0.25]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.05, 0.18, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
          {/* Angry eyes on sides */}
          <mesh position={[-0.5, 0.1, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={isAttacking ? "#ff0000" : "#880000"} />
          </mesh>
          <mesh position={[0.5, 0.1, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={isAttacking ? "#ff0000" : "#880000"} />
          </mesh>
        </group>
      </group>
    </>
  );
}

// Simple decorative lily flower - optimized for performance
function LilyFlower({ position, type = 'lotus', size = 1 }) {
  // Color based on type
  const colors = {
    lotus: { petals: '#ff88aa', center: '#ffdd44' },
    waterlily: { petals: '#ffffff', center: '#ffee66' },
    purple: { petals: '#aa66dd', center: '#ffcc44' },
    yellow: { petals: '#ffdd55', center: '#ff8844' },
  };
  const color = colors[type] || colors.lotus;

  return (
    <group position={[position[0], 0, position[2]]} scale={size * 1.5}>
      {/* Single leaf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[1.2, 8]} />
        <meshStandardMaterial color="#228833" roughness={0.7} />
      </mesh>

      {/* Simple flower - just 4 petals + center */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 4) * Math.PI * 2) * 0.3,
            0.15,
            Math.sin((i / 4) * Math.PI * 2) * 0.3
          ]}
          rotation={[-0.5, (i / 4) * Math.PI * 2, 0]}
        >
          <sphereGeometry args={[0.25, 4, 4]} />
          <meshBasicMaterial color={color.petals} />
        </mesh>
      ))}

      {/* Flower center */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshBasicMaterial color={color.center} />
      </mesh>
    </group>
  );
}

// Animated water ripple - WHITE, thin, transparent
function WaterRipple({ position, delay = 0 }) {
  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = ((clock.elapsedTime + delay) % 3) / 3; // 3 second cycle
    ringRef.current.scale.setScalar(0.2 + t * 4);
    ringRef.current.material.opacity = 0.25 * (1 - t); // Visible white
  });

  return (
    <mesh ref={ringRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.92, 1.0, 12]} /> {/* Thin grey ring */}
      <meshBasicMaterial color="#888888" transparent opacity={0.3} /> {/* GREY */}
    </mesh>
  );
}

// Water surface - N64 style vibrant pond
function Water({ playerPos }) {
  // Fewer ripples for better performance
  const ripplePositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 5; i++) {
      positions.push({
        offset: [(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25],
        delay: Math.random() * 2,
      });
    }
    return positions;
  }, []);

  return (
    <>
      {/* Deep dark water - N64 dark blue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[POND_SIZE * 2, POND_SIZE * 2]} />
        <meshBasicMaterial color="#001133" />
      </mesh>
      {/* Mid water layer - rich blue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[POND_SIZE * 2, POND_SIZE * 2]} />
        <meshBasicMaterial color="#003366" transparent opacity={0.95} />
      </mesh>
      {/* Surface water - vibrant N64 blue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={[POND_SIZE * 2, POND_SIZE * 2]} />
        <meshStandardMaterial color="#2277aa" roughness={0.3} metalness={0.2} transparent opacity={0.97} />
      </mesh>
      {/* Subtle ripples near player */}
      {ripplePositions.map((rip, i) => (
        <WaterRipple
          key={i}
          position={[
            (playerPos?.[0] || 0) + rip.offset[0],
            -0.1,
            (playerPos?.[2] || 0) + rip.offset[1]
          ]}
          delay={rip.delay}
        />
      ))}
    </>
  );
}

// Dragonfly enemy - KILLER buzzing nightmare!
function Dragonfly({ id, position, targetPos, speed, onHitPlayer, gamePaused }) {
  const groupRef = useRef();
  const posRef = useRef([position[0], position[1], position[2]]);
  const wingsRef = useRef();
  const aggroRef = useRef(false);
  const hitCooldownRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // PAUSE when game hasn't started or is paused!
    if (gamePaused) {
      // Just gentle wing flapping while waiting
      if (wingsRef.current) {
        wingsRef.current.rotation.x = Math.sin(Date.now() * 0.01) * 0.3;
      }
      return;
    }

    // Decrease hit cooldown
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta;
    }

    // Fast wing flapping - faster when aggro
    if (wingsRef.current) {
      const flapSpeed = aggroRef.current ? 0.06 : 0.03;
      wingsRef.current.rotation.x = Math.sin(Date.now() * flapSpeed) * 0.5;
    }

    const pos = posRef.current;
    const dx = targetPos[0] - pos[0];
    const dz = targetPos[2] - pos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Get aggressive when close!
    aggroRef.current = dist < 15;
    const actualSpeed = aggroRef.current ? speed * 1.8 : speed;

    const moveAngle = Math.atan2(dx, dz);
    // Aggressive zigzag when hunting
    const zigzag = aggroRef.current ? Math.sin(Date.now() * 0.01) * 0.3 : 0;
    pos[0] += (Math.sin(moveAngle) + zigzag) * actualSpeed * delta;
    pos[2] += Math.cos(moveAngle) * actualSpeed * delta;
    // Dive lower when attacking!
    const attackHeight = aggroRef.current ? 0.8 : 2;
    const bob = Math.sin(Date.now() * 0.01) * 0.2;
    groupRef.current.position.set(pos[0], attackHeight + bob, pos[2]);
    groupRef.current.rotation.y = moveAngle;

    // HIT detection - BIG hitbox for reliable damage
    if (dist < 3.5 && hitCooldownRef.current <= 0) {
      // Call the hit handler
      if (onHitPlayer) {
        onHitPlayer(id);
      }
      // Set cooldown and respawn far away
      hitCooldownRef.current = 2; // 2 second cooldown
      const newAngle = Math.random() * Math.PI * 2;
      const respawnDist = 25 + Math.random() * 15;
      pos[0] = targetPos[0] + Math.cos(newAngle) * respawnDist;
      pos[2] = targetPos[2] + Math.sin(newAngle) * respawnDist;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], 2, position[2]]}>
      {/* Main body - chunky N64 style */}
      <mesh>
        <capsuleGeometry args={[0.25, 0.6, 6, 12]} />
        <meshStandardMaterial color="#cc2222" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Head - big and menacing */}
      <mesh position={[0, 0, 0.5]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#dd3333" roughness={0.4} />
      </mesh>

      {/* Big angry eyes */}
      <mesh position={[-0.15, 0.1, 0.7]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      <mesh position={[0.15, 0.1, 0.7]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      {/* Black pupils */}
      <mesh position={[-0.15, 0.1, 0.82]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.15, 0.1, 0.82]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Tail segments - striped N64 style */}
      <mesh position={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
        <meshStandardMaterial color="#aa1111" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.9]}>
        <capsuleGeometry args={[0.12, 0.3, 4, 8]} />
        <meshStandardMaterial color="#cc3333" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -1.2]}>
        <coneGeometry args={[0.1, 0.3, 6]} />
        <meshStandardMaterial color="#aa1111" roughness={0.5} />
      </mesh>

      {/* Wings group - animated */}
      <group ref={wingsRef}>
        {/* Left wings */}
        <mesh position={[-0.5, 0.2, 0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.8, 0.02, 0.25]} />
          <meshBasicMaterial color="#88ddff" transparent opacity={0.5} />
        </mesh>
        <mesh position={[-0.4, 0.15, -0.3]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.6, 0.02, 0.2]} />
          <meshBasicMaterial color="#88ddff" transparent opacity={0.4} />
        </mesh>
        {/* Right wings */}
        <mesh position={[0.5, 0.2, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.8, 0.02, 0.25]} />
          <meshBasicMaterial color="#88ddff" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.4, 0.15, -0.3]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.6, 0.02, 0.2]} />
          <meshBasicMaterial color="#88ddff" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// Power-up collectible - floating animated pickups
function PowerUp({ powerUp }) {
  const groupRef = useRef();
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (powerUp.collected || !groupRef.current) return;

    // Float and rotate
    const float = Math.sin(clock.elapsedTime * 2 + powerUp.id) * 0.1;
    groupRef.current.position.y = 0.6 + float;

    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 1.5;
    }
  });

  if (powerUp.collected) return null;

  const color = POWERUP_COLORS[powerUp.type];

  const getShape = () => {
    switch (powerUp.type) {
      case 'coin':
        return (
          <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          </mesh>
        );
      case 'bigCoin':
        return (
          <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.06, 16]} />
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        );
      case 'invincibility':
        return (
          <mesh ref={meshRef}>
            <icosahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        );
      case 'extraLife':
        return (
          <mesh ref={meshRef}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.4} />
          </mesh>
        );
      case 'speedBoost':
        return (
          <mesh ref={meshRef}>
            <coneGeometry args={[0.18, 0.4, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
        );
      case 'timeFreeze':
        return (
          <mesh ref={meshRef}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
          </mesh>
        );
      case 'magnet':
        return (
          <mesh ref={meshRef}>
            <torusGeometry args={[0.15, 0.06, 8, 16]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
          </mesh>
        );
      default:
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
    }
  };

  return (
    <group ref={groupRef} position={[powerUp.x, 0.6, powerUp.z]}>
      {getShape()}
    </group>
  );
}

// Generate power-ups on lily pads
function generatePowerUps(lilyPads) {
  const powerUps = [];
  const availablePads = lilyPads.filter(p => !p.hasAEIOU && !p.hasEssence && p.id !== 0);
  const shuffled = [...availablePads].sort(() => Math.random() - 0.5);

  let idCounter = 0;
  const addPowerUp = (type, count) => {
    for (let i = 0; i < count && shuffled.length > 0; i++) {
      const pad = shuffled.pop();
      if (pad) {
        powerUps.push({
          id: idCounter++,
          type,
          x: pad.x,
          z: pad.z,
          padId: pad.id,
          collected: false,
        });
      }
    }
  };

  addPowerUp('coin', POWERUP_CONFIG.coinCount);
  addPowerUp('bigCoin', POWERUP_CONFIG.bigCoinCount);
  addPowerUp('invincibility', POWERUP_CONFIG.invincibilityCount);
  addPowerUp('extraLife', POWERUP_CONFIG.extraLifeCount);
  addPowerUp('speedBoost', POWERUP_CONFIG.speedBoostCount);
  addPowerUp('timeFreeze', POWERUP_CONFIG.timeFreezeCount);
  addPowerUp('magnet', POWERUP_CONFIG.magnetCount);

  return powerUps;
}

// Ambient floating particles (fireflies/sparkles)
function AmbientParticles({ playerPos }) {
  const particlesRef = useRef([]);

  // Generate particle positions around player
  const particles = useMemo(() => {
    const p = [];
    for (let i = 0; i < 15; i++) {
      p.push({
        id: i,
        offsetX: (Math.random() - 0.5) * 30,
        offsetZ: (Math.random() - 0.5) * 30,
        baseY: 0.5 + Math.random() * 2,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        size: 0.04 + Math.random() * 0.04,
      });
    }
    return p;
  }, []);

  return (
    <group>
      {particles.map((particle) => (
        <FloatingParticle
          key={particle.id}
          playerPos={playerPos}
          offset={[particle.offsetX, particle.baseY, particle.offsetZ]}
          speed={particle.speed}
          phase={particle.phase}
          size={particle.size}
        />
      ))}
    </group>
  );
}

// Single floating particle
function FloatingParticle({ playerPos, offset, speed, phase, size }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime * speed + phase;
    // Float and drift
    meshRef.current.position.x = (playerPos?.[0] || 0) + offset[0] + Math.sin(t * 0.5) * 2;
    meshRef.current.position.y = offset[1] + Math.sin(t) * 0.3;
    meshRef.current.position.z = (playerPos?.[2] || 0) + offset[2] + Math.cos(t * 0.3) * 2;
    // Pulse glow
    const pulse = 0.4 + Math.sin(t * 2) * 0.3;
    meshRef.current.material.opacity = pulse;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshBasicMaterial color="#aaffaa" transparent opacity={0.5} />
    </mesh>
  );
}

// Camera following player - N64 style fixed angle (Zelda/Mario style)
function FollowCamera({ target }) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3(0, 15, -15));

  useFrame(() => {
    if (target) {
      // Fixed angle camera - always behind in -Z direction, looking toward +Z
      // This keeps controls consistent: W=up on screen, S=down, A=left, D=right
      const cameraHeight = 12;
      const cameraDistance = 10;

      const targetPosition = new THREE.Vector3(
        target[0],
        cameraHeight,
        target[2] - cameraDistance  // Always behind in -Z
      );

      // Smooth camera follow
      currentPosition.current.lerp(targetPosition, 0.08);
      camera.position.copy(currentPosition.current);

      // Look at player, slightly forward
      camera.lookAt(target[0], 0, target[2] + 2);
    }
  });

  return null;
}

// Idle danger indicator component
function IdleDangerIndicator({ timeOnPad, maxTime, position }) {
  const progress = timeOnPad / maxTime;
  if (progress < 0.5) return null;

  return (
    <group position={[position[0], 0.5, position[2]]}>
      {/* Warning ring that grows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.5 + progress * 0.5, 32]} />
        <meshBasicMaterial
          color={progress > 0.8 ? "#ff0000" : "#ffaa00"}
          transparent
          opacity={0.5 + progress * 0.5}
        />
      </mesh>
    </group>
  );
}

// Direction compass around player - shows which way is up/down/left/right
function DirectionCompass({ position }) {
  return (
    <group position={[position[0], 0.3, position[2]]}>
      {/* Forward arrow (up on screen = +Z) */}
      <group position={[0, 0, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <coneGeometry args={[0.3, 0.6, 4]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
        </mesh>
      </group>
      {/* Back arrow */}
      <group position={[0, 0, -3]} rotation={[-Math.PI / 2, Math.PI, 0]}>
        <mesh>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshBasicMaterial color="#888888" transparent opacity={0.4} />
        </mesh>
      </group>
      {/* Left arrow */}
      <group position={[-3, 0, 0]} rotation={[-Math.PI / 2, Math.PI / 2, 0]}>
        <mesh>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshBasicMaterial color="#888888" transparent opacity={0.4} />
        </mesh>
      </group>
      {/* Right arrow */}
      <group position={[3, 0, 0]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]}>
        <mesh>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshBasicMaterial color="#888888" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// Arrow pointing to AEIOU
function AEIOUPointer({ playerPos, aeiouPos }) {
  if (!aeiouPos) return null;

  const dx = aeiouPos[0] - playerPos[0];
  const dz = aeiouPos[2] - playerPos[2];
  const angle = Math.atan2(dx, dz);
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Only show if AEIOU is far away
  if (distance < 10) return null;

  return (
    <group position={[playerPos[0], 2, playerPos[2]]} rotation={[0, angle, 0]}>
      {/* Pointer arrow */}
      <group position={[0, 0, 4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.4, 0.8, 4]} />
          <meshBasicMaterial color="#ff00ff" transparent opacity={0.8} />
        </mesh>
        {/* Distance text would go here but we'll use HUD instead */}
      </group>
    </group>
  );
}

// Main game scene
function GameScene({
  lilyPads,
  flowers,
  playerPos,
  playerRotation,
  isJumping,
  currentPadId,
  fishState,
  onFishAttackComplete,
  collectedEssences,
  gameWon,
  timeOnPad,
  idleTime,
  shakingPadId,
  dragonflies,
  dragonflySpeed,
  onDragonflyHit,
  powerUps,
  activePowerUps,
  gamePaused, // CRITICAL: pause enemies until game starts!
  hasPyramidShard,
}) {
  const aeiouPad = lilyPads.find(p => p.hasAEIOU);

  return (
    <>
      {/* N64 style bright lighting */}
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#ffffdd" castShadow />
      <directionalLight position={[-5, 15, -5]} intensity={0.4} color="#88aaff" />
      {/* Rim light for that classic look */}
      <directionalLight position={[0, 5, -15]} intensity={0.3} color="#ffccaa" />

      {/* Vibrant sky - classic N64 blue gradient feel */}
      <color attach="background" args={['#4499cc']} />

      {/* Distance fog - N64 style */}
      <fog attach="fog" args={['#3388bb', 20, 80]} />

      {/* Water with ripples */}
      <Water playerPos={playerPos} />

      {/* Ambient firefly particles */}
      <AmbientParticles playerPos={playerPos} />

      {/* Lily pads */}
      {lilyPads.map((pad) => (
        <LilyPad
          key={pad.id}
          pad={pad}
          isPlayerHere={pad.id === currentPadId}
        />
      ))}

      {/* Decorative lily flowers - beautiful but can't jump on! */}
      {flowers.map((flower) => (
        <LilyFlower
          key={`flower-${flower.id}`}
          position={[flower.x, 0, flower.z]}
          type={flower.type}
          size={flower.size}
        />
      ))}

      {/* Essences - green crystals */}
      {lilyPads.filter(p => p.hasEssence).map((pad) => (
        <Essence
          key={`essence-${pad.id}`}
          position={[pad.x, 0, pad.z]}
          collected={collectedEssences.includes(pad.id)}
        />
      ))}

      {/* AEIOU - visible from start for testing! Only render if shard not collected */}
      {!hasPyramidShard && aeiouPad && (
        <AEIOUOnPad
          pad={aeiouPad}
          found={gameWon}
          allEssencesCollected={true}
        />
      )}

      {/* Monster Fish */}
      <MonsterFish
        fishState={fishState}
        playerPos={playerPos}
        onAttackComplete={onFishAttackComplete}
        gamePaused={gamePaused}
      />

      {/* Player */}
      <CoolFrog position={playerPos} rotation={playerRotation} isJumping={isJumping} />

      {/* Dragonfly enemies */}
      {dragonflies.map((fly) => (
        <Dragonfly
          key={fly.id}
          id={fly.id}
          position={[fly.x, 1.5, fly.z]}
          targetPos={playerPos}
          speed={dragonflySpeed}
          onHitPlayer={onDragonflyHit}
          gamePaused={gamePaused}
        />
      ))}

      {/* Power-ups */}
      {powerUps.map((powerUp) => (
        <PowerUp
          key={powerUp.id}
          powerUp={powerUp}
          playerPos={playerPos}
          hasMagnet={activePowerUps.magnet}
        />
      ))}

      {/* Camera */}
      <FollowCamera target={playerPos} />
    </>
  );
}

// Main component
export default function FrogRealm3D({
  difficulty = 'normal',
  freeMode = false,
  onComplete,
  onDeath,
  onExit,
  onQuit,
  onToggleFreeMode,
  onNavigateRealm,
  hasPyramidShard = false,
}) {
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
  const { addEssence } = useInventory();
  const { playSound, startSwampMusic, stopSwampMusic, initialized } = useAudio();

  // Generate level
  const [lilyPads, setLilyPads] = useState(() => generateLilyPads(settings.padCount, settings.jumpRange));
  // More flowers at higher difficulty levels!
  const flowerMultiplier = { beginner: 1, easy: 1.2, normal: 1.5, hard: 2, expert: 2.5, master: 3, impossible: 4 };
  const flowerCount = Math.floor(BASE_FLOWER_COUNT * (flowerMultiplier[difficulty] || 1));
  const [flowers] = useState(() => generateFlowers(flowerCount, lilyPads));

  // Initialize power-ups when lily pads are created
  useEffect(() => {
    setPowerUps(generatePowerUps(lilyPads));
  }, [lilyPads]);

  // Game state
  const [playerPos, setPlayerPos] = useState([0, 0.5, 0]);
  const [playerRotation, setPlayerRotation] = useState(0);
  const [currentPadId, setCurrentPadId] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [hasJumpedOnce, setHasJumpedOnce] = useState(false);
  const [collectedEssences, setCollectedEssences] = useState([]);
  const [showAeiouReveal, setShowAeiouReveal] = useState(false);
  const [timeOnPad, setTimeOnPad] = useState(0);
  const [shakingPadId, setShakingPadId] = useState(null);
  const [recentAttacks, setRecentAttacks] = useState([]);
  const [noValidJumpTime, setNoValidJumpTime] = useState(0);

  // Power-ups state
  const [powerUps, setPowerUps] = useState([]);
  const [activePowerUps, setActivePowerUps] = useState({
    invincibility: false,
    speedBoost: false,
    timeFreeze: false,
    magnet: false,
  });
  const [powerUpTimers, setPowerUpTimers] = useState({
    invincibility: 0,
    speedBoost: 0,
    timeFreeze: 0,
    magnet: 0,
  });

  // Fish state
  const [fishState, setFishState] = useState({
    x: 0,
    z: 0,
    rotation: 0,
    phase: 'swimming',
    targetX: 0,
    targetZ: 0,
    targetPadId: null,
  });

  // Dragonfly enemies - spawn around player
  const [dragonflies] = useState(() => {
    const flies = [];
    for (let i = 0; i < settings.dragonflyCount; i++) {
      const angle = (i / settings.dragonflyCount) * Math.PI * 2;
      const dist = 15 + Math.random() * 20;
      flies.push({
        id: i,
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
      });
    }
    return flies;
  });

  const isMobile = useIsMobile();
  const timeOnPadRef = useRef(0);
  const targetPadRef = useRef(null);
  const lastDragonflyHitRef = useRef(0); // Prevent rapid hits
  const lastRibbitRef = useRef(0); // For random ribbit sounds
  const [screenShake, setScreenShake] = useState(false); // Visual damage feedback

  // Handle start game from intro modal
  const handleStartGame = useCallback(() => {
    setShowIntroModal(false);
    setGameStarted(true);
    // Start swamp music
    startSwampMusic();
  }, [startSwampMusic]);

  // Stop music on unmount
  useEffect(() => {
    return () => {
      stopSwampMusic();
    };
  }, [stopSwampMusic]);

  // Random frog ribbit when idle (adds personality!)
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || isJumping || isPaused) return;

    const ribbitCheck = setInterval(() => {
      const now = Date.now();
      // Random chance to ribbit every few seconds when not jumping
      if (now - lastRibbitRef.current > 3000 && Math.random() < 0.15) {
        lastRibbitRef.current = now;
        playSound(SOUNDS.FROG_RIBBIT);
      }
    }, 1000);

    return () => clearInterval(ribbitCheck);
  }, [gameStarted, gameOver, gameWon, isJumping, isPaused, playSound]);

  // Timer - only run when game has started
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || isPaused) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameWon, isPaused]);

  // Power-up timer countdown - only run when game started
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || isPaused) return;

    const interval = setInterval(() => {
      setPowerUpTimers(prev => {
        const updated = { ...prev };
        let changed = false;

        Object.keys(updated).forEach(key => {
          if (updated[key] > 0) {
            updated[key] = Math.max(0, updated[key] - 100);
            changed = true;
            if (updated[key] === 0) {
              setActivePowerUps(a => ({ ...a, [key]: false }));
            }
          }
        });

        return changed ? updated : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver, gameWon, isPaused]);

  // Idle timer (time on current pad) - only run when game started
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || isPaused || isJumping || !hasJumpedOnce) {
      timeOnPadRef.current = 0;
      setTimeOnPad(0);
      return;
    }

    const interval = setInterval(() => {
      // Time freeze pauses the idle timer
      if (activePowerUps.timeFreeze) return;

      timeOnPadRef.current += 0.1;
      setTimeOnPad(timeOnPadRef.current);

      // Warning shake at 2/3 of idle time
      if (timeOnPadRef.current > settings.idleTime * 0.66 && timeOnPadRef.current < settings.idleTime * 0.7) {
        setShakingPadId(currentPadId);
      }

      // Fish attack when idle too long - DRAMATIC ATTACK + EAT LILY PAD!
      if (timeOnPadRef.current >= settings.idleTime) {
        const playerPad = lilyPads.find(p => p.id === currentPadId);
        if (playerPad && !playerPad.hasAEIOU) {
          // Fish rises dramatically!
          playSound(SOUNDS.FISH_ATTACK);
          setFishState(prev => ({
            ...prev,
            phase: 'rising',
            targetX: playerPad.x,
            targetZ: playerPad.z,
            targetPadId: playerPad.id,
          }));

          // Fish strikes and EATS the lily pad!
          setTimeout(() => {
            setFishState(prev => ({ ...prev, phase: 'striking' }));
            handlePlayerHit();
            // DESTROY the lily pad - fish eats it!
            setLilyPads(pads => pads.map(p =>
              p.id === currentPadId ? { ...p, eaten: true, isBeingAttacked: false } : p
            ));
            // Respawn pad after delay
            setTimeout(() => {
              setLilyPads(pads => pads.map(p =>
                p.id === currentPadId ? { ...p, eaten: false } : p
              ));
            }, PAD_RESPAWN_TIME);

            setTimeout(() => {
              setFishState(prev => ({ ...prev, phase: 'diving' }));
              setTimeout(() => {
                setFishState(prev => ({ ...prev, phase: 'swimming' }));
              }, 500);
            }, 500);
          }, 800);
        } else {
          handlePlayerHit();
        }
        timeOnPadRef.current = 0;
        setTimeOnPad(0);
        setShakingPadId(null);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver, gameWon, isPaused, isJumping, hasJumpedOnce, currentPadId, settings.idleTime, activePowerUps.timeFreeze]);

  // Fish swimming AI and random pad attacks - only when game started
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || isPaused) return;

    let swimInterval;
    let attackTimeout;

    // Swim around
    swimInterval = setInterval(() => {
      if (fishState.phase === 'swimming') {
        setFishState(prev => ({
          ...prev,
          x: prev.x + (Math.random() - 0.5) * 4,
          z: prev.z + (Math.random() - 0.5) * 4,
          rotation: prev.rotation + (Math.random() - 0.5) * 0.5,
        }));
      }
    }, 500);

    // Schedule attack
    const scheduleAttack = () => {
      if (!hasJumpedOnce) {
        attackTimeout = setTimeout(scheduleAttack, 1000);
        return;
      }

      const delay = settings.fishInterval + Math.random() * 2000;

      attackTimeout = setTimeout(() => {
        if (gameOver || gameWon) return;

        // Pick random pads to attack
        const availablePads = lilyPads.filter(p => !p.eaten && !p.isBeingAttacked && !p.hasAEIOU);
        if (availablePads.length === 0) return;

        const attackCount = Math.min(settings.padsPerAttack, availablePads.length);
        const shuffled = [...availablePads].sort(() => Math.random() - 0.5);
        const padsToAttack = shuffled.slice(0, attackCount);

        // Mark pads as being attacked
        setLilyPads(pads => pads.map(p =>
          padsToAttack.find(ap => ap.id === p.id) ? { ...p, isBeingAttacked: true } : p
        ));

        // After warning time, destroy pads
        setTimeout(() => {
          padsToAttack.forEach(targetPad => {
            // Check if player is on this pad
            if (targetPad.id === currentPadId) {
              handlePlayerHit();
            }

            // Destroy pad
            setLilyPads(pads => pads.map(p =>
              p.id === targetPad.id ? { ...p, eaten: true, isBeingAttacked: false } : p
            ));

            // Record attack for respawn safety scoring
            setRecentAttacks(prev => [...prev.slice(-10), { x: targetPad.x, z: targetPad.z, time: Date.now() }]);

            // Respawn pad after delay
            setTimeout(() => {
              setLilyPads(pads => pads.map(p =>
                p.id === targetPad.id ? { ...p, eaten: false } : p
              ));
            }, PAD_RESPAWN_TIME);
          });
        }, WARNING_TIME);

        // Also occasionally attack player's pad directly (40% chance)
        if (Math.random() < 0.4 && hasJumpedOnce) {
          const playerPad = lilyPads.find(p => p.id === currentPadId);
          if (playerPad && !playerPad.hasAEIOU) {
            // Play fish attack warning sound!
            playSound(SOUNDS.FISH_ATTACK);

            setFishState(prev => ({
              ...prev,
              phase: 'rising',
              targetX: playerPad.x,
              targetZ: playerPad.z,
              targetPadId: playerPad.id,
            }));

            setTimeout(() => {
              setFishState(prev => ({ ...prev, phase: 'striking' }));
              if (currentPadId === playerPad.id && !isJumping) {
                handlePlayerHit();
              }
              setTimeout(() => {
                setFishState(prev => ({ ...prev, phase: 'diving' }));
              }, 500);
            }, 1000);
          }
        }

        scheduleAttack();
      }, delay);
    };

    scheduleAttack();

    return () => {
      clearInterval(swimInterval);
      clearTimeout(attackTimeout);
    };
  }, [gameOver, gameWon, isPaused, currentPadId, settings.fishInterval, settings.padsPerAttack, lilyPads, hasJumpedOnce, isJumping, playSound]);

  // Handle player getting hit
  const handlePlayerHit = useCallback(() => {
    // Invincibility protection
    if (activePowerUps.invincibility) return;

    // Play damage sound
    playSound(SOUNDS.FROG_DAMAGE);
    playSound(SOUNDS.FROG_SPLASH);

    // Screen shake effect!
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);

    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setGameOver(true);
        playSound(SOUNDS.GAME_OVER);
        stopSwampMusic();
      } else {
        // Respawn on safe pad
        const safePad = findSafeRespawnPad(lilyPads, recentAttacks);
        setPlayerPos([safePad.x, 0.5, safePad.z]);
        setCurrentPadId(safePad.id);
        timeOnPadRef.current = 0;
        setTimeOnPad(0);
      }
      return newLives;
    });
  }, [lilyPads, recentAttacks, activePowerUps.invincibility, playSound, stopSwampMusic]);

  // Handle dragonfly collision - lose life and respawn!
  const handleDragonflyHit = useCallback((dragonflyId) => {
    // Invincibility protection
    if (activePowerUps.invincibility) return;

    const now = Date.now();
    // Prevent rapid hits (1.5 second cooldown)
    if (now - lastDragonflyHitRef.current < 1500) return;
    lastDragonflyHitRef.current = now;

    // Play hit sounds
    playSound(SOUNDS.DRAGONFLY_BUZZ);
    playSound(SOUNDS.FROG_DAMAGE);

    // Screen shake effect!
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);

    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setGameOver(true);
        playSound(SOUNDS.GAME_OVER);
        stopSwampMusic();
      } else {
        // RESPAWN on a safe pad!
        const safePad = findSafeRespawnPad(lilyPads, recentAttacks);
        setPlayerPos([safePad.x, 0.5, safePad.z]);
        setCurrentPadId(safePad.id);
        timeOnPadRef.current = 0;
        setTimeOnPad(0);
      }
      return newLives;
    });
  }, [activePowerUps.invincibility, lilyPads, recentAttacks, playSound, stopSwampMusic]);

  // Check if current pad was destroyed while standing
  useEffect(() => {
    if (isJumping || gameOver || gameWon) return;
    const currentPad = lilyPads.find(p => p.id === currentPadId);
    if (currentPad && currentPad.eaten) {
      handlePlayerHit();
    }
  }, [lilyPads, currentPadId, isJumping, gameOver, gameWon, handlePlayerHit]);

  // Find nearest pad in direction - SCREEN RELATIVE
  const findNearestPad = useCallback((direction) => {
    const current = lilyPads.find(p => p.id === currentPadId);
    if (!current) return null;

    // Camera is BEHIND player looking FORWARD (+Z direction)
    // W = jump AWAY from camera (up on screen) = -Z direction
    // S = jump TOWARD camera (down on screen) = +Z direction
    // A = left on screen = -X direction, D = right on screen = +X direction
    let targetDirX = 0;
    let targetDirZ = 0;

    if (direction === 'forward') { targetDirZ = -1; }  // W = away from camera (up on screen)
    else if (direction === 'back') { targetDirZ = 1; }  // S = toward camera (down on screen)
    else if (direction === 'left') { targetDirX = 1; }  // A = left on screen (+X)
    else if (direction === 'right') { targetDirX = -1; } // D = right on screen (-X)
    else return null;

    let bestPad = null;
    let bestScore = Infinity;

    lilyPads.forEach((pad) => {
      if (pad.id === currentPadId || pad.eaten) return;

      const dx = pad.x - current.x;
      const dz = pad.z - current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > settings.jumpRange || dist < 0.5) return;

      // Calculate how well this pad matches the desired direction
      const normalizedDx = dx / dist;
      const normalizedDz = dz / dist;

      // Dot product with target direction (higher = better alignment)
      const alignment = normalizedDx * targetDirX + normalizedDz * targetDirZ;

      // Must be at least somewhat in the right direction (45 degree cone)
      if (alignment < 0.5) return;

      // Score: prefer closer pads that are well aligned
      // Lower score = better (closer distance, better alignment inverted)
      const score = dist * (2 - alignment);

      if (score < bestScore) {
        bestScore = score;
        bestPad = pad;
      }
    });

    return bestPad;
  }, [lilyPads, currentPadId, settings.jumpRange]);

  // Check if player has any valid jumps
  const hasValidJumps = useCallback(() => {
    const directions = ['forward', 'back', 'left', 'right'];
    return directions.some(dir => findNearestPad(dir) !== null);
  }, [findNearestPad]);

  // Emergency pad spawning when trapped
  useEffect(() => {
    if (gameOver || gameWon || isJumping) {
      setNoValidJumpTime(0);
      return;
    }

    if (!hasValidJumps()) {
      setNoValidJumpTime(t => t + 0.1);

      // After 5 seconds trapped, spawn emergency pad
      if (noValidJumpTime > 5) {
        const currentPad = lilyPads.find(p => p.id === currentPadId);
        if (currentPad) {
          const angle = Math.random() * Math.PI * 2;
          const distance = PAD_MIN_DISTANCE + 1;
          const newPad = {
            id: lilyPads.length,
            x: currentPad.x + Math.cos(angle) * distance,
            z: currentPad.z + Math.sin(angle) * distance,
            size: 1,
            type: 'lilypad',
            hasLotus: false,
            lotusColor: null,
            eaten: false,
            isBeingAttacked: false,
            hasAEIOU: false,
            hasEssence: false,
          };
          setLilyPads(pads => [...pads, newPad]);
          setNoValidJumpTime(0);
        }
      }
    } else {
      setNoValidJumpTime(0);
    }
  }, [gameOver, gameWon, isJumping, hasValidJumps, noValidJumpTime, currentPadId, lilyPads]);

  // Jump to pad
  const jumpToPad = useCallback((targetPad) => {
    if (isJumping || gameOver || gameWon) return;

    // Play hop sound!
    playSound(SOUNDS.FROG_HOP);

    setIsJumping(true);
    setHasJumpedOnce(true);
    timeOnPadRef.current = 0;
    setTimeOnPad(0);
    setShakingPadId(null);
    targetPadRef.current = targetPad;

    const current = lilyPads.find(p => p.id === currentPadId);
    if (!current) return;

    setPlayerRotation(Math.atan2(targetPad.x - current.x, targetPad.z - current.z));

    // Animate jump
    const startPos = [current.x, 0.5, current.z];
    const endPos = [targetPad.x, 0.5, targetPad.z];
    const duration = 350;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Check if target pad was destroyed mid-jump
      const currentTargetPad = lilyPads.find(p => p.id === targetPadRef.current?.id);
      if (currentTargetPad && currentTargetPad.eaten) {
        // Fall in water!
        setIsJumping(false);
        handlePlayerHit();
        return;
      }

      // Parabolic jump
      const height = Math.sin(t * Math.PI) * 2;
      const x = startPos[0] + (endPos[0] - startPos[0]) * t;
      const z = startPos[2] + (endPos[2] - startPos[2]) * t;

      setPlayerPos([x, 0.5 + height, z]);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setPlayerPos(endPos);
        setCurrentPadId(targetPad.id);
        setIsJumping(false);
        setScore(s => s + 10);

        // Check essence collection
        if (targetPad.hasEssence && !collectedEssences.includes(targetPad.id)) {
          const newCount = collectedEssences.length + 1;
          setCollectedEssences(prev => [...prev, targetPad.id]);
          addEssence('forest');
          setScore(s => s + 50);
          playSound(SOUNDS.COLLECT_ESSENCE);

          // Check if ALL essences collected - AEIOU APPEARS!
          if (newCount >= ESSENCE_COUNT) {
            setShowAeiouReveal(true);
            playSound(SOUNDS.POWERUP); // Dramatic reveal sound
            setTimeout(() => setShowAeiouReveal(false), 4000);
          }
        }

        // Check power-up collection
        setPowerUps(prev => {
          const updated = prev.map(powerUp => {
            if (powerUp.collected) return powerUp;

            // Check if near this power-up
            const dx = endPos[0] - powerUp.x;
            const dz = endPos[2] - powerUp.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 2) {
              // Collect power-up
              switch (powerUp.type) {
                case 'coin':
                  setScore(s => s + 10);
                  playSound(SOUNDS.COIN_COLLECT);
                  break;
                case 'bigCoin':
                  setScore(s => s + 50);
                  playSound(SOUNDS.COIN_COLLECT);
                  break;
                case 'invincibility':
                  setActivePowerUps(a => ({ ...a, invincibility: true }));
                  setPowerUpTimers(t => ({ ...t, invincibility: POWERUP_DURATIONS.invincibility }));
                  setScore(s => s + 25);
                  playSound(SOUNDS.POWERUP);
                  break;
                case 'extraLife':
                  setLives(l => Math.min(l + 1, 5));
                  setScore(s => s + 25);
                  playSound(SOUNDS.POWERUP);
                  break;
                case 'speedBoost':
                  setActivePowerUps(a => ({ ...a, speedBoost: true }));
                  setPowerUpTimers(t => ({ ...t, speedBoost: POWERUP_DURATIONS.speedBoost }));
                  setScore(s => s + 25);
                  playSound(SOUNDS.POWERUP);
                  break;
                case 'timeFreeze':
                  setActivePowerUps(a => ({ ...a, timeFreeze: true }));
                  setPowerUpTimers(t => ({ ...t, timeFreeze: POWERUP_DURATIONS.timeFreeze }));
                  setScore(s => s + 25);
                  playSound(SOUNDS.POWERUP);
                  break;
                case 'magnet':
                  setActivePowerUps(a => ({ ...a, magnet: true }));
                  setPowerUpTimers(t => ({ ...t, magnet: POWERUP_DURATIONS.magnet }));
                  setScore(s => s + 25);
                  playSound(SOUNDS.POWERUP);
                  break;
              }
              return { ...powerUp, collected: true };
            }
            return powerUp;
          });
          return updated;
        });

        // Check win condition (reached AEIOU) - auto-complete and return to clock
        if (targetPad.hasAEIOU) {
          setGameWon(true);
          playSound(SOUNDS.VICTORY);
          stopSwampMusic();
          // Auto-complete after a short delay for visual feedback
          setTimeout(() => {
            onComplete?.({ score: score + 10, time, difficulty, essences: collectedEssences.length, lives });
          }, 500);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isJumping, gameOver, gameWon, lilyPads, currentPadId, collectedEssences, addEssence, handlePlayerHit, playSound, stopSwampMusic]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') {
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pac-Man style controls: up=up, down=down, left=left, right=right (absolute directions)
  // Hold direction to keep jumping that way
  const lastJumpTimeRef = useRef(0);
  const JUMP_COOLDOWN = 180; // FAST! Frog is quicker than enemies!

  // Global input handler for both keyboard and mobile joystick - only when game started
  useEffect(() => {
    if (!gameStarted || gameOver || gameWon || isJumping || isPaused) return;

    const checkInput = () => {
      const now = Date.now();
      if (now - lastJumpTimeRef.current < JUMP_COOLDOWN) return;

      const input = getInput();
      const threshold = 0.3;
      let direction = null;

      // Simple controls: W/Up = forward (up on screen), S/Down = back, A/Left = left, D/Right = right
      const absX = Math.abs(input.x);
      const absY = Math.abs(input.y);

      // Pick the dominant direction
      if (absY > threshold || absX > threshold) {
        if (absY > absX) {
          // W/Up (negative Y in input) = forward (up on screen toward +Z)
          // S/Down (positive Y in input) = back (down on screen toward -Z)
          direction = input.y < 0 ? 'forward' : 'back';
        } else {
          // A/Left (negative X) = left, D/Right (positive X) = right
          direction = input.x > 0 ? 'right' : 'left';
        }
      }

      if (direction) {
        const target = findNearestPad(direction);
        if (target) {
          lastJumpTimeRef.current = now;
          jumpToPad(target);
        }
      }
    };

    const interval = setInterval(checkInput, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameWon, isPaused, isJumping, findNearestPad, jumpToPad]);

  const handleFishAttackComplete = useCallback(() => {
    setFishState(prev => ({ ...prev, phase: 'swimming' }));
  }, []);

  // Proper restart handler
  const handleRestart = useCallback(() => {
    const newPads = generateLilyPads(settings.padCount, settings.jumpRange);
    setLilyPads(newPads);
    setPlayerPos([0, 0.5, 0]);
    setPlayerRotation(0);
    setCurrentPadId(0);
    setTime(0);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(false);
    setIsJumping(false);
    setShowIntroModal(true);
    setGameStarted(false);
    setHasJumpedOnce(false);
    setCollectedEssences([]);
    timeOnPadRef.current = 0;
    setTimeOnPad(0);
    setShakingPadId(null);
    setRecentAttacks([]);
    setNoValidJumpTime(0);
    setFishState({
      x: 0, z: 0, rotation: 0, phase: 'swimming',
      targetX: 0, targetZ: 0, targetPadId: null,
    });
    // Reset power-ups
    setActivePowerUps({
      invincibility: false,
      speedBoost: false,
      timeFreeze: false,
      magnet: false,
    });
    setPowerUpTimers({
      invincibility: 0,
      speedBoost: 0,
      timeFreeze: 0,
      magnet: 0,
    });
  }, [settings.padCount, settings.jumpRange]);

  const handlePause = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const handleQuit = onQuit || onExit;

  const formatTime = (t) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const padsRemaining = lilyPads.filter(p => !p.eaten).length;
  const essencesCollected = collectedEssences.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 100,
      animation: screenShake ? 'screenShake 0.3s ease-out' : 'none',
    }}>
      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        dpr={1}
        shadows={false}
      >
        <PerspectiveCamera makeDefault position={[0, 30, 0]} fov={60} />
        <GameScene
          lilyPads={lilyPads}
          flowers={flowers}
          playerPos={playerPos}
          playerRotation={playerRotation}
          isJumping={isJumping}
          currentPadId={currentPadId}
          fishState={fishState}
          onFishAttackComplete={handleFishAttackComplete}
          collectedEssences={collectedEssences}
          gameWon={gameWon}
          timeOnPad={timeOnPad}
          idleTime={settings.idleTime}
          shakingPadId={shakingPadId}
          dragonflies={dragonflies}
          dragonflySpeed={settings.dragonflySpeed}
          onDragonflyHit={handleDragonflyHit}
          powerUps={powerUps}
          activePowerUps={activePowerUps}
          gamePaused={!gameStarted || isPaused || gameOver || gameWon || showIntroModal}
          hasPyramidShard={hasPyramidShard}
        />
      </Canvas>

      {/* HUD */}
      <GameHUD
        freeMode={freeMode}
        onToggleFreeMode={onToggleFreeMode}
        collectibles={{ current: essencesCollected, total: ESSENCE_COUNT }}
        collectibleIcon="essence"
        coins={score}
        time={time}
        lives={lives}
        maxLives={3}
        isPaused={isPaused}
        onPause={handlePause}
        onRestart={handleRestart}
        onQuit={handleQuit}
        realmName="Frog Pond"
        currentRealm="frog"
        onNavigateRealm={onNavigateRealm}
      />

      {/* Active Power-ups Display */}
      {(activePowerUps.invincibility || activePowerUps.speedBoost || activePowerUps.timeFreeze || activePowerUps.magnet) && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1100,
        }}>
          {activePowerUps.invincibility && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(0, 255, 255, 0.8)',
              borderRadius: '20px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              <span style={{ fontSize: '18px' }}>🛡️</span>
              <span>{Math.ceil(powerUpTimers.invincibility / 1000)}s</span>
            </div>
          )}
          {activePowerUps.speedBoost && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(0, 255, 0, 0.8)',
              borderRadius: '20px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <span>{Math.ceil(powerUpTimers.speedBoost / 1000)}s</span>
            </div>
          )}
          {activePowerUps.timeFreeze && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              color: '#000',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              <span style={{ fontSize: '18px' }}>❄️</span>
              <span>{Math.ceil(powerUpTimers.timeFreeze / 1000)}s</span>
            </div>
          )}
          {activePowerUps.magnet && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(153, 50, 204, 0.8)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              <span style={{ fontSize: '18px' }}>🧲</span>
              <span>{Math.ceil(powerUpTimers.magnet / 1000)}s</span>
            </div>
          )}
        </div>
      )}

      {/* Intro Modal - game paused until dismissed */}
      {showIntroModal && (
        <IntroModal realm="frog" onStart={handleStartGame} />
      )}

      {/* AEIOU REVEALED notification - dramatic announcement! */}
      {showAeiouReveal && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '30px 50px',
          background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.95) 0%, rgba(100, 0, 200, 0.95) 100%)',
          borderRadius: '20px',
          zIndex: 2500,
          textAlign: 'center',
          border: '3px solid #ff88ff',
          boxShadow: '0 0 60px rgba(255, 0, 255, 0.8), 0 0 100px rgba(255, 0, 255, 0.4)',
          animation: 'pulse 0.5s infinite',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>✨🐸✨</div>
          <div style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', textShadow: '0 0 20px #ff00ff' }}>
            AEIOU HAS APPEARED!
          </div>
          <div style={{ color: '#ffccff', fontSize: '16px', marginTop: '10px' }}>
            Find the glowing beacon and rescue AEIOU!
          </div>
        </div>
      )}

      {/* Idle danger warning */}
      {timeOnPad > settings.idleTime * 0.66 && !isJumping && hasJumpedOnce && (
        <div style={{
          position: 'fixed',
          top: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 24px',
          background: timeOnPad > settings.idleTime * 0.9 ? 'rgba(255, 0, 0, 0.9)' : 'rgba(255, 150, 0, 0.8)',
          borderRadius: '12px',
          zIndex: 1100,
          animation: 'pulse 0.3s infinite',
        }}>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            {timeOnPad > settings.idleTime * 0.9 ? 'MOVE NOW!' : 'Fish incoming - MOVE!'}
          </span>
        </div>
      )}

      {/* Warning when fish is attacking pads */}
      {fishState.phase === 'rising' && (
        <div style={{
          position: 'fixed',
          top: '160px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 24px',
          background: 'rgba(255, 0, 0, 0.8)',
          borderRadius: '12px',
          zIndex: 1100,
          animation: 'pulse 0.3s infinite',
        }}>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="6" ry="4" fill="#2c5a7c" />
              <path d="M2 8 L0 5 L0 11 Z" fill="#2c5a7c" />
              <circle cx="11" cy="7" r="1" fill="#ff0000" />
            </svg>
            FISH ATTACKING!
          </span>
        </div>
      )}

      {/* Controls hint - desktop only */}
      {!isMobile && !showIntroModal && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '8px',
          color: '#888',
          fontSize: '12px',
          zIndex: 1100,
        }}>
          W/Up: Forward | S/Down: Back | A/Left: Left | D/Right: Right | Essences: {essencesCollected}/{ESSENCE_COUNT}
        </div>
      )}

      {/* Win Screen - Brief celebration before auto-returning to clock */}
      {gameWon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 50, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ marginBottom: '20px', animation: 'bounce 0.5s ease-out' }}>
            <svg width="100" height="100" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
              <circle cx="5" cy="5" r="2.5" fill="#4ade80" />
              <circle cx="11" cy="5" r="2.5" fill="#4ade80" />
              <circle cx="5" cy="4.5" r="1" fill="#333" />
              <circle cx="11" cy="4.5" r="1" fill="#333" />
              <path d="M6 11 Q8 13 10 11" stroke="#333" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <h1 style={{
            color: '#4ade80',
            fontSize: '48px',
            marginBottom: '16px',
            textShadow: '0 0 30px rgba(74, 222, 128, 0.8)',
            animation: 'pulse 0.5s ease-out'
          }}>
            AEIOU Found!
          </h1>
          <p style={{ color: '#88ff88', fontSize: '18px', marginBottom: '8px' }}>
            Returning to clock...
          </p>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}>
          <div style={{ marginBottom: '20px' }}>
            <svg width="80" height="80" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="8" rx="6" ry="4" fill="#2c5a7c" />
              <path d="M2 8 L0 5 L0 11 Z" fill="#2c5a7c" />
              <circle cx="11" cy="7" r="1.5" fill="#ff0000" />
              <path d="M8 10 Q9 11 10 10" stroke="#1a3a5c" strokeWidth="0.5" fill="none" />
            </svg>
          </div>
          <h1 style={{ color: '#ef4444', fontSize: '36px', marginBottom: '16px' }}>
            Eaten by the Fish!
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
            The monster fish got you...
          </p>
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '24px' }}>
            Score: {score} | Essences: {essencesCollected}/{ESSENCE_COUNT}
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleRestart}
              style={{
                padding: '14px 32px',
                background: '#4ade80',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleQuit}
              style={{
                padding: '14px 32px',
                background: '#333',
                border: '1px solid #555',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          50% { transform: scale(1.1) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-8px, -5px); }
          20% { transform: translate(8px, 5px); }
          30% { transform: translate(-6px, 4px); }
          40% { transform: translate(6px, -4px); }
          50% { transform: translate(-4px, 3px); }
          60% { transform: translate(4px, -2px); }
          70% { transform: translate(-2px, 2px); }
          80% { transform: translate(2px, -1px); }
          90% { transform: translate(-1px, 1px); }
        }
      `}</style>
    </div>
  );
}
