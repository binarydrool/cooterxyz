"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile } from '@/hooks/useGameInput';
import AEIOU from '../characters/AEIOU';

// Game constants
const ARENA_SIZE = 200;
const CAT_SPEED = 35; // Base cat speed - much faster than fish (fish are 3-6)
const SPRINT_SPEED = 55; // Sprint speed - extremely fast for escaping
const TURN_SPEED = 4; // Rotation speed (radians per second) - smoother turning
const STAMINA_MAX = 10;
const STAMINA_RECHARGE_RATE = 4;
const SAFE_SPAWN_RADIUS = 50;
const MIN_ITEM_DISTANCE = 20;
const FOOTPRINT_LIFETIME = 2.0; // Seconds before footprints fade
const FOOTPRINT_INTERVAL = 0.35; // Time between footprints
const PAW_OFFSET = 0.3; // Horizontal offset for alternating left/right paws
const MOVEMENT_SMOOTHNESS = 0.7; // Higher = more responsive - very snappy controls
const CAMERA_SMOOTHNESS = 0.15; // Camera follow smoothness (faster to keep up)
const MAX_FOOTPRINTS = 15; // Limit footprints for performance
const RESPAWN_INVINCIBILITY = 2.0; // Seconds of invincibility after respawn
const OBSTACLE_COUNT = 15; // Number of obstacles in arena

// Difficulty settings with hunt radius (awareness) and light radius (damage)
const DIFFICULTY_SETTINGS = {
  beginner: { lives: 5, fishCount: 5, seekerCount: 0, lightRadius: 12, huntRadius: 24, gracePeriod: 0.5, fishSpeed: 3, parTime: 300 },
  easy: { lives: 5, fishCount: 8, seekerCount: 1, lightRadius: 11, huntRadius: 22, gracePeriod: 0.4, fishSpeed: 3.5, parTime: 270 },
  normal: { lives: 4, fishCount: 12, seekerCount: 2, lightRadius: 10, huntRadius: 20, gracePeriod: 0.3, fishSpeed: 4, parTime: 240 },
  hard: { lives: 3, fishCount: 16, seekerCount: 4, lightRadius: 10, huntRadius: 20, gracePeriod: 0.2, fishSpeed: 4.5, parTime: 210 },
  expert: { lives: 3, fishCount: 20, seekerCount: 6, lightRadius: 9, huntRadius: 18, gracePeriod: 0.1, fishSpeed: 5, parTime: 180 },
  master: { lives: 2, fishCount: 25, seekerCount: 10, lightRadius: 8, huntRadius: 16, gracePeriod: 0, fishSpeed: 5.5, parTime: 150 },
  impossible: { lives: 2, fishCount: 30, seekerCount: 15, lightRadius: 8, huntRadius: 16, gracePeriod: 0, fishSpeed: 6, parTime: 120 },
  NORMAL: { lives: 4, fishCount: 12, seekerCount: 2, lightRadius: 10, huntRadius: 20, gracePeriod: 0.3, fishSpeed: 4, parTime: 240 },
};

// Power-up types
const POWERUP_TYPES = {
  gold: { color: '#ffd700', effect: 'coins', duration: 0, value: 50 },
  blue: { color: '#00bfff', effect: 'invincibility', duration: 5 },
  pink: { color: '#ff69b4', effect: 'extraLife', duration: 0 },
  white: { color: '#ffffff', effect: 'speed', duration: 8 },
  purple: { color: '#9932cc', effect: 'reveal', duration: 10 },
};

// Input is now handled globally via useGameInput hook

// Spawn position generator
function getRandomSpawnPosition(existingPositions) {
  let pos;
  let valid = false;
  let attempts = 0;
  while (!valid && attempts < 100) {
    pos = {
      x: (Math.random() - 0.5) * (ARENA_SIZE - 20),
      z: (Math.random() - 0.5) * (ARENA_SIZE - 20)
    };
    // Check not near start
    if (Math.sqrt(pos.x * pos.x + pos.z * pos.z) < SAFE_SPAWN_RADIUS) {
      attempts++;
      continue;
    }
    // Check not near existing items
    valid = existingPositions.every(existing =>
      Math.sqrt(Math.pow(pos.x - existing.x, 2) + Math.pow(pos.z - existing.z, 2)) > MIN_ITEM_DISTANCE
    );
    attempts++;
  }
  return pos || { x: 50, z: 50 };
}

// Find safest respawn position - farthest from all enemies
function findSafeRespawnPosition(fishList) {
  let bestPoint = [0, 0, 0];
  let bestMinDistance = 0;
  const halfArena = ARENA_SIZE / 2 - 10;

  // Sample 100 random points to find the safest one
  for (let i = 0; i < 100; i++) {
    const testPoint = {
      x: (Math.random() - 0.5) * (halfArena * 2),
      z: (Math.random() - 0.5) * (halfArena * 2)
    };

    // Find distance to nearest fish
    let minDistToFish = Infinity;
    for (const fish of fishList) {
      const dx = testPoint.x - fish.x;
      const dz = testPoint.z - fish.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDistToFish) {
        minDistToFish = dist;
      }
    }

    // Keep this point if it's farther from all fish
    if (minDistToFish > bestMinDistance) {
      bestMinDistance = minDistToFish;
      bestPoint = [testPoint.x, 0, testPoint.z];
    }
  }

  return bestPoint;
}

// Generate anglerfish with different patrol patterns
function generateFish(settings) {
  const fish = [];
  const patternTypes = ['wanderer', 'circler', 'liner'];

  for (let i = 0; i < settings.fishCount; i++) {
    const isSeeker = i < settings.seekerCount;
    const pattern = isSeeker ? 'seeker' : patternTypes[i % patternTypes.length];
    const pos = getRandomSpawnPosition(fish.map(f => ({ x: f.x, z: f.z })));

    fish.push({
      id: `fish-${i}`,
      x: pos.x,
      z: pos.z,
      y: 3 + Math.random() * 2,
      speed: settings.fishSpeed + (Math.random() - 0.5),
      lightRadius: settings.lightRadius,
      huntRadius: settings.huntRadius || settings.lightRadius * 2, // Hunt radius for awareness
      pattern,
      isSeeker,
      isChasing: false,
      direction: Math.random() * Math.PI * 2,
      wanderTimer: 5 + Math.random() * 5,
      orbitCenter: { x: pos.x, z: pos.z },
      orbitRadius: 10 + Math.random() * 10,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.3 + Math.random() * 0.3,
    });
  }

  return fish;
}

// Generate collectibles including power-up fish
function generateCollectibles(settings) {
  const positions = [];

  // 3 Essences
  const essences = [];
  for (let i = 0; i < 3; i++) {
    const pos = getRandomSpawnPosition(positions);
    positions.push(pos);
    essences.push({
      id: `essence-${i}`,
      x: pos.x,
      z: pos.z,
      y: 1,
      collected: false,
    });
  }

  // Dimitrius
  const dimPos = getRandomSpawnPosition(positions);
  positions.push(dimPos);
  const dimitrius = {
    x: dimPos.x,
    z: dimPos.z,
    y: 0,
  };

  // 30 coins
  const coins = [];
  for (let i = 0; i < 30; i++) {
    const pos = getRandomSpawnPosition(positions);
    positions.push(pos);
    coins.push({
      id: `coin-${i}`,
      x: pos.x,
      z: pos.z,
      y: 0.5,
      collected: false,
    });
  }

  // Power-up fish (15-25 randomly scattered)
  const powerUps = [];
  const powerUpTypes = ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', // 7 gold (coins)
                        'blue', 'blue', 'blue', // 3 invincibility
                        'pink', 'pink', // 2 extra life
                        'white', 'white', 'white', // 3 speed boost
                        'purple', 'purple', 'purple', 'purple']; // 4 reveal

  for (let i = 0; i < powerUpTypes.length; i++) {
    const pos = getRandomSpawnPosition(positions);
    positions.push(pos);
    powerUps.push({
      id: `powerup-${i}`,
      x: pos.x,
      z: pos.z,
      y: 1,
      type: powerUpTypes[i],
      collected: false,
    });
  }

  return { essences, dimitrius, coins, powerUps };
}

// DARK VOID with subtle grid - visible floor grid pattern
function ArenaFloor() {
  const gridLines = useMemo(() => {
    const lines = [];
    const spacing = 10; // Grid spacing
    const halfSize = ARENA_SIZE / 2;

    // Generate grid lines
    for (let i = -halfSize; i <= halfSize; i += spacing) {
      // Horizontal lines (along X axis)
      lines.push({ start: [-halfSize, i], end: [halfSize, i] });
      // Vertical lines (along Z axis)
      lines.push({ start: [i, -halfSize], end: [i, halfSize] });
    }
    return lines;
  }, []);

  return (
    <group>
      {/* Dark floor base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE]} />
        <meshStandardMaterial
          color="#050505"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Grid lines - subtle green glow */}
      {gridLines.map((line, i) => {
        const midX = (line.start[0] + line.end[0]) / 2;
        const midZ = (line.start[1] + line.end[1]) / 2;
        const isHorizontal = line.start[1] === line.end[1];
        const length = isHorizontal ? ARENA_SIZE : ARENA_SIZE;

        return (
          <mesh
            key={i}
            position={[midX, 0.01, midZ]}
            rotation={[-Math.PI / 2, 0, isHorizontal ? 0 : Math.PI / 2]}
          >
            <planeGeometry args={[length, 0.15]} />
            <meshBasicMaterial color="#003300" transparent opacity={0.4} />
          </mesh>
        );
      })}

      {/* Arena boundary glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[ARENA_SIZE / 2 - 2, ARENA_SIZE / 2, 64]} />
        <meshBasicMaterial color="#004400" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Generate random obstacles
function generateObstacles() {
  const obstacles = [];
  const types = ['pillar', 'rock', 'wall'];

  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    let x, z;
    let valid = false;
    let attempts = 0;

    // Find valid position not too close to center (spawn point)
    while (!valid && attempts < 50) {
      x = (Math.random() - 0.5) * (ARENA_SIZE - 40);
      z = (Math.random() - 0.5) * (ARENA_SIZE - 40);

      // Don't place too close to spawn
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter > 25) {
        valid = true;
      }
      attempts++;
    }

    if (valid) {
      obstacles.push({
        id: `obstacle-${i}`,
        x,
        z,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.6,
      });
    }
  }

  return obstacles;
}

// Obstacles component - pillars, rocks, walls that block movement
function Obstacles({ obstacles }) {
  return (
    <group>
      {obstacles.map((obs) => {
        if (obs.type === 'pillar') {
          return (
            <group key={obs.id} position={[obs.x, 0, obs.z]}>
              {/* Dark pillar */}
              <mesh position={[0, 2 * obs.scale, 0]}>
                <cylinderGeometry args={[1.5 * obs.scale, 2 * obs.scale, 4 * obs.scale, 8]} />
                <meshStandardMaterial color="#111111" roughness={0.9} metalness={0.1} />
              </mesh>
              {/* Subtle glow at base */}
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.8 * obs.scale, 2.5 * obs.scale, 16]} />
                <meshBasicMaterial color="#002200" transparent opacity={0.3} />
              </mesh>
            </group>
          );
        } else if (obs.type === 'rock') {
          return (
            <group key={obs.id} position={[obs.x, 0, obs.z]} rotation={[0, obs.rotation, 0]}>
              {/* Irregular rock shape using multiple spheres */}
              <mesh position={[0, 1.2 * obs.scale, 0]}>
                <dodecahedronGeometry args={[2 * obs.scale, 0]} />
                <meshStandardMaterial color="#0a0a0a" roughness={1} metalness={0} />
              </mesh>
              <mesh position={[0.5 * obs.scale, 0.8 * obs.scale, 0.3 * obs.scale]}>
                <dodecahedronGeometry args={[1.2 * obs.scale, 0]} />
                <meshStandardMaterial color="#080808" roughness={1} metalness={0} />
              </mesh>
            </group>
          );
        } else {
          // Wall segment
          return (
            <group key={obs.id} position={[obs.x, 0, obs.z]} rotation={[0, obs.rotation, 0]}>
              <mesh position={[0, 1.5 * obs.scale, 0]}>
                <boxGeometry args={[6 * obs.scale, 3 * obs.scale, 1 * obs.scale]} />
                <meshStandardMaterial color="#0c0c0c" roughness={0.95} metalness={0.05} />
              </mesh>
              {/* Edge glow */}
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6.5 * obs.scale, 1.5 * obs.scale]} />
                <meshBasicMaterial color="#001a00" transparent opacity={0.25} />
              </mesh>
            </group>
          );
        }
      })}
    </group>
  );
}


// Paw print trail - simplified for performance
// Only render main pad + glow, no individual toe beans (too many draw calls)
function Footprints({ footprints, time }) {
  return (
    <group>
      {footprints.map((fp, i) => {
        const age = time - fp.time;
        const opacity = Math.max(0, 1 - age / FOOTPRINT_LIFETIME);
        if (opacity <= 0.05) return null;

        // Calculate paw offset based on alternating left/right
        const offsetX = fp.isLeft ? -PAW_OFFSET : PAW_OFFSET;
        const perpAngle = fp.angle + Math.PI / 2;
        const pawX = fp.x + Math.sin(perpAngle) * offsetX;
        const pawZ = fp.z + Math.cos(perpAngle) * offsetX;

        return (
          <group key={i} position={[pawX, 0.02, pawZ]} rotation={[0, -fp.angle, 0]}>
            {/* Main paw pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.2, 8]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={opacity * 0.6} />
            </mesh>
            {/* Outer glow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
              <circleGeometry args={[0.35, 8]} />
              <meshBasicMaterial color="#00ffcc" transparent opacity={opacity * 0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// SHADOW CAT - Solid black silhouette with glowing green eyes
// PERFORMANCE: Using meshBasicMaterial for black body (no lighting needed), reduced geometry segments
function Cat({ position, facingAngle, isHit, isSprinting, isInvincible, time, eyeTrail }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(position[0], position[1] + 0.3, position[2]);
    groupRef.current.rotation.y = facingAngle;
  });

  const eyeColor = isHit ? '#ff0000' : (isInvincible ? '#00bfff' : '#00ff00'); // Green eyes, blue when invincible
  const eyeIntensity = isInvincible ? 5 : 4;

  return (
    <group ref={groupRef}>
      {/* SOLID BLACK BODY - using BasicMaterial for performance (black doesn't need lighting) */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.4, 0.6, 4, 8]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      {/* SOLID BLACK HEAD */}
      <mesh position={[0, 0.7, 0.25]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      {/* SOLID BLACK EARS */}
      <mesh position={[-0.15, 0.95, 0.2]} rotation={[0.3, 0, -0.2]}>
        <coneGeometry args={[0.1, 0.2, 4]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      <mesh position={[0.15, 0.95, 0.2]} rotation={[0.3, 0, 0.2]}>
        <coneGeometry args={[0.1, 0.2, 4]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      {/* GLOWING GREEN EYES - the only visible part */}
      <mesh position={[-0.1, 0.75, 0.48]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0.1, 0.75, 0.48]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>

      {/* Eye outer glow */}
      <mesh position={[-0.1, 0.75, 0.47]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshBasicMaterial color={eyeColor} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.1, 0.75, 0.47]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshBasicMaterial color={eyeColor} transparent opacity={0.3} />
      </mesh>

      {/* SINGLE EYE GLOW - merged into one light for performance */}
      <pointLight position={[0, 0.75, 0.5]} color={eyeColor} intensity={eyeIntensity} distance={6} />

      {/* SOLID BLACK TAIL - animated */}
      <mesh position={[0, 0.4, -0.5]} rotation={[-0.8 + Math.sin(time * 5) * 0.2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.02, 0.6, 6]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      {/* SOLID BLACK LEGS */}
      {[[-0.15, 0.15], [0.15, 0.15], [-0.15, -0.15], [0.15, -0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}

      {/* Sprint effect - subtle green trail (no extra light for performance) */}
      {isSprinting && (
        <mesh position={[0, 0.3, -0.6]}>
          <coneGeometry args={[0.15, 0.6, 4]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Invincibility aura */}
      {isInvincible && (
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshBasicMaterial color="#00bfff" transparent opacity={0.15 + Math.sin(time * 10) * 0.1} />
        </mesh>
      )}
    </group>
  );
}

// Anglerfish enemy - hunt radius for awareness, light radius for damage
function Anglerfish({ fish, time, catPosition, settings }) {
  const groupRef = useRef();
  const fishRef = useRef({ ...fish });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const f = fishRef.current;

    // Calculate distance to cat
    const dx = catPosition[0] - f.x;
    const dz = catPosition[2] - f.z;
    const distToCat = Math.sqrt(dx * dx + dz * dz);

    // HUNT RADIUS = awareness zone (starts chasing)
    // LIGHT RADIUS = damage zone (causes harm)
    const huntRadius = f.huntRadius || 20;

    // Chase behavior based on HUNT RADIUS
    if (!f.isChasing && distToCat < huntRadius) {
      f.isChasing = true; // Cat entered awareness zone!
    } else if (f.isChasing && distToCat > huntRadius * 1.2) {
      f.isChasing = false; // Cat escaped, return to patrol
    }

    // Movement speed based on fish settings
    const patrolSpeed = f.speed * 0.4; // Slow patrol
    const chaseSpeed = f.speed; // Full speed when chasing

    if (f.isChasing) {
      // Pursue the cat but still slower than cat
      if (distToCat > 2) {
        f.x += (dx / distToCat) * chaseSpeed * delta;
        f.z += (dz / distToCat) * chaseSpeed * delta;
        f.direction = Math.atan2(dz, dx);
      }
    } else {
      // Patrol behavior based on pattern
      if (f.pattern === 'seeker') {
        // Seeker fish move more actively even when not chasing
        f.wanderTimer -= delta;
        if (f.wanderTimer <= 0) {
          f.direction = Math.random() * Math.PI * 2;
          f.wanderTimer = 3 + Math.random() * 4;
        }
        f.x += Math.cos(f.direction) * patrolSpeed * 1.5 * delta;
        f.z += Math.sin(f.direction) * patrolSpeed * 1.5 * delta;
      } else if (f.pattern === 'circler') {
        // Orbit around spawn point
        f.orbitAngle += f.orbitSpeed * delta;
        f.x = f.orbitCenter.x + Math.cos(f.orbitAngle) * f.orbitRadius;
        f.z = f.orbitCenter.z + Math.sin(f.orbitAngle) * f.orbitRadius;
        f.direction = f.orbitAngle + Math.PI / 2;
      } else {
        // Wanderer - random patrol
        f.wanderTimer -= delta;
        if (f.wanderTimer <= 0) {
          f.direction = Math.random() * Math.PI * 2;
          f.wanderTimer = 6 + Math.random() * 6;
        }
        f.x += Math.cos(f.direction) * patrolSpeed * delta;
        f.z += Math.sin(f.direction) * patrolSpeed * delta;
      }
    }

    // Bounce off boundaries
    const halfArena = ARENA_SIZE / 2 - 5;
    if (Math.abs(f.x) > halfArena) {
      f.x = Math.sign(f.x) * halfArena;
      f.direction = Math.PI - f.direction;
    }
    if (Math.abs(f.z) > halfArena) {
      f.z = Math.sign(f.z) * halfArena;
      f.direction = -f.direction;
    }

    // Update visual position with slight bobbing
    const bobY = f.y + Math.sin(time * 2 + f.id.charCodeAt(5)) * 0.3;
    groupRef.current.position.set(f.x, bobY, f.z);
    groupRef.current.rotation.y = f.direction + Math.PI / 2;

    // Update ref for collision detection
    fish.x = f.x;
    fish.z = f.z;
    fish.isChasing = f.isChasing;
  });

  // PERFORMANCE: Reduced from 4 lights to 1 per fish
  const pulseIntensity = 2 + Math.sin(time * 3 + fish.id.charCodeAt(5)) * 0.8;

  return (
    <group ref={groupRef} position={[fish.x, fish.y, fish.z]}>
      {/* Anglerfish body - using BasicMaterial with emissive-like color for performance */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[1.0, 8, 8]} />
        <meshBasicMaterial color="#2a3545" />
      </mesh>

      {/* Body details - bioluminescent spots - reduced count */}
      {[0, 2, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * 1.26) * 0.8,
            Math.sin(i * 1.1) * 0.5,
            Math.sin(i * 1.26) * 0.8
          ]}
        >
          <sphereGeometry args={[0.1, 4, 4]} />
          <meshBasicMaterial color="#66ffaa" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Lower jaw */}
      <mesh position={[0, -0.4, 0.8]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.6, 0.25, 0.5]} />
        <meshBasicMaterial color="#2a3545" />
      </mesh>

      {/* Teeth - reduced count */}
      {[-0.15, 0.15].map((offset, i) => (
        <mesh key={i} position={[offset, -0.15, 1.0]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.05, 0.2, 3]} />
          <meshBasicMaterial color="#ffffcc" />
        </mesh>
      ))}

      {/* Lure stalk */}
      <mesh position={[0, 0.7, 0.6]} rotation={[-0.5, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.02, 0.8, 4]} />
        <meshBasicMaterial color="#88ff88" />
      </mesh>

      {/* Glowing lure (the dangerous light source) */}
      <mesh position={[0, 1.1, 0.9]}>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshBasicMaterial color="#eeffaa" />
      </mesh>

      {/* Lure glow halo - single layer for performance */}
      <mesh position={[0, 1.1, 0.9]}>
        <sphereGeometry args={[0.5, 6, 6]} />
        <meshBasicMaterial color="#ccff66" transparent opacity={0.4} />
      </mesh>

      {/* SINGLE PRIMARY LIGHT - the only light per fish for performance */}
      <pointLight
        position={[0, 0, 0]}
        color="#ccff66"
        intensity={pulseIntensity * 10}
        distance={fish.lightRadius * 1.5}
        decay={2}
      />

      {/* Eyes - glowing red */}
      <mesh position={[-0.4, 0.25, 0.75]}>
        <sphereGeometry args={[0.15, 4, 4]} />
        <meshBasicMaterial color="#ff3333" />
      </mesh>
      <mesh position={[0.4, 0.25, 0.75]}>
        <sphereGeometry args={[0.15, 4, 4]} />
        <meshBasicMaterial color="#ff3333" />
      </mesh>

      {/* Fins - simplified */}
      <mesh position={[-0.8, 0, -0.3]} rotation={[0, 0.5, Math.sin(time * 5) * 0.3]}>
        <boxGeometry args={[0.6, 0.04, 0.5]} />
        <meshBasicMaterial color="#4a5a7a" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.8, 0, -0.3]} rotation={[0, -0.5, -Math.sin(time * 5) * 0.3]}>
        <boxGeometry args={[0.6, 0.04, 0.5]} />
        <meshBasicMaterial color="#4a5a7a" transparent opacity={0.9} />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0, -1.1]} rotation={[0, 0, Math.sin(time * 4) * 0.2]}>
        <coneGeometry args={[0.4, 0.6, 4]} />
        <meshBasicMaterial color="#2a3545" />
      </mesh>
    </group>
  );
}

// Amber Essence collectible
function Essence({ item, time, playerPos, onCollect }) {
  const groupRef = useRef();
  const [collected, setCollected] = useState(false);

  useFrame(() => {
    if (!groupRef.current || collected) return;

    groupRef.current.rotation.y = time * 0.8;
    groupRef.current.position.y = item.y + Math.sin(time * 2) * 0.2 + 0.5;

    // Collection check
    const dx = playerPos[0] - item.x;
    const dz = playerPos[2] - item.z;
    if (Math.sqrt(dx * dx + dz * dz) < 2) {
      setCollected(true);
      onCollect(item.id, 'essence');
    }
  });

  if (collected || item.collected) return null;

  return (
    <group ref={groupRef} position={[item.x, item.y + 0.5, item.z]}>
      {/* Main gem */}
      <mesh>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#FFA500"
          emissive="#ff8800"
          emissiveIntensity={0.8}
          metalness={0.5}
          roughness={0.1}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh rotation={[Math.PI / 4, time, 0]}>
        <torusGeometry args={[0.6, 0.03, 8, 32]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.7} />
      </mesh>

      {/* Glow */}
      <pointLight color="#ffaa00" intensity={2} distance={15} />

      {/* Particles */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(time * 2 + i * 1.57) * 0.8,
            Math.cos(time * 3 + i) * 0.5,
            Math.cos(time * 2 + i * 1.57) * 0.8
          ]}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color="#ffdd00" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Coin collectible
function Coin({ item, time, playerPos, onCollect }) {
  const meshRef = useRef();
  const [collected, setCollected] = useState(false);

  useFrame(() => {
    if (!meshRef.current || collected) return;

    meshRef.current.rotation.y = time * 3;
    meshRef.current.position.y = item.y + Math.sin(time * 2 + item.x) * 0.1;

    const dx = playerPos[0] - item.x;
    const dz = playerPos[2] - item.z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
      setCollected(true);
      onCollect(item.id, 'coin');
    }
  });

  if (collected || item.collected) return null;

  return (
    <mesh ref={meshRef} position={[item.x, item.y, item.z]}>
      <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
      <meshStandardMaterial
        color="#ffd700"
        metalness={0.8}
        roughness={0.2}
        emissive="#aa8800"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// Power-up fish collectible - small glowing fish that grant effects
function PowerUpFish({ item, time, playerPos, onCollect }) {
  const groupRef = useRef();
  const [collected, setCollected] = useState(false);

  const powerUpConfig = POWERUP_TYPES[item.type] || POWERUP_TYPES.gold;

  useFrame(() => {
    if (!groupRef.current || collected) return;

    // Slow swimming motion
    groupRef.current.rotation.y = time * 1.5 + item.x;
    groupRef.current.position.y = item.y + Math.sin(time * 2 + item.z) * 0.3;
    groupRef.current.position.x = item.x + Math.sin(time * 0.5 + item.z) * 0.5;
    groupRef.current.position.z = item.z + Math.cos(time * 0.5 + item.x) * 0.5;

    const dx = playerPos[0] - item.x;
    const dz = playerPos[2] - item.z;
    if (Math.sqrt(dx * dx + dz * dz) < 2) {
      setCollected(true);
      onCollect(item.id, 'powerup', item.type);
    }
  });

  if (collected || item.collected) return null;

  return (
    <group ref={groupRef} position={[item.x, item.y, item.z]}>
      {/* Small fish body */}
      <mesh>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color={powerUpConfig.color} transparent opacity={0.9} />
      </mesh>

      {/* Fish tail */}
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.2, 0.3, 3]} />
        <meshBasicMaterial color={powerUpConfig.color} transparent opacity={0.8} />
      </mesh>

      {/* Eye */}
      <mesh position={[0.15, 0.08, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Glow */}
      <pointLight color={powerUpConfig.color} intensity={1.5} distance={8} />

      {/* Outer glow sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color={powerUpConfig.color} transparent opacity={0.2} />
      </mesh>

      {/* Sparkle particles */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(time * 3 + i * 2.1) * 0.6,
            Math.cos(time * 4 + i) * 0.4,
            Math.cos(time * 3 + i * 2.1) * 0.6
          ]}
        >
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshBasicMaterial color={powerUpConfig.color} />
        </mesh>
      ))}
    </group>
  );
}

// AEIOU (the elf) - HIDDEN in the shadows, auto-triggers on contact
function Dimitrius({ position, found, playerPos, onInteract }) {
  const groupRef = useRef();
  const hasTriggered = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current || found || hasTriggered.current) return;

    // Subtle bobbing - very subtle so he's harder to see
    groupRef.current.rotation.y = clock.elapsedTime * 0.3;
    groupRef.current.position.y = position[1] + 0.3 + Math.sin(clock.elapsedTime * 0.5) * 0.1;

    // Auto-trigger when player gets close - no button needed
    const dx = playerPos[0] - position[0];
    const dz = playerPos[2] - position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 3) {
      hasTriggered.current = true;
      onInteract();
    }
  });

  if (found) return null;

  return (
    <group ref={groupRef} position={[position[0], position[1] + 0.3, position[2]]}>
      {/* AEIOU - small and subtle, hidden in darkness */}
      <AEIOU
        position={[0, 0, 0]}
        scale={0.6}
        animate={false}
        variant="realm"
        glowIntensity={0.3}
      />

      {/* Very subtle glow - just barely visible if you look closely */}
      <pointLight color="#9966ff" intensity={0.5} distance={8} />

      {/* Tiny sparkle effect - only visible up close */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshBasicMaterial color="#aa88ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// Third person camera with SMOOTH DAMPING - Tank controls (turn+forward)
function ThirdPersonCamera({ target, facingAngle, enabled }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 6, 12));
  const smoothLook = useRef(new THREE.Vector3(0, 0.5, 0));

  useFrame(() => {
    if (!enabled) return;

    const cameraDistance = 12;
    const cameraHeight = 6;

    // Target camera position behind the cat based on facing angle
    const targetCamX = target[0] - Math.sin(facingAngle) * cameraDistance;
    const targetCamZ = target[2] - Math.cos(facingAngle) * cameraDistance;
    const targetCamY = target[1] + cameraHeight;

    // Smooth camera position with damping
    smoothPos.current.x += (targetCamX - smoothPos.current.x) * CAMERA_SMOOTHNESS;
    smoothPos.current.y += (targetCamY - smoothPos.current.y) * CAMERA_SMOOTHNESS;
    smoothPos.current.z += (targetCamZ - smoothPos.current.z) * CAMERA_SMOOTHNESS;

    camera.position.copy(smoothPos.current);

    // Smooth look target - look ahead of where the cat is facing
    const lookAhead = 8;
    const targetLookX = target[0] + Math.sin(facingAngle) * lookAhead;
    const targetLookZ = target[2] + Math.cos(facingAngle) * lookAhead;

    smoothLook.current.x += (targetLookX - smoothLook.current.x) * CAMERA_SMOOTHNESS;
    smoothLook.current.y += (target[1] + 0.5 - smoothLook.current.y) * CAMERA_SMOOTHNESS;
    smoothLook.current.z += (targetLookZ - smoothLook.current.z) * CAMERA_SMOOTHNESS;

    camera.lookAt(smoothLook.current);
  });

  return null;
}

// Bird's eye camera - Pac-Man style top-down view with smooth follow
// Controls: W=up, S=down, A=left, D=right (directional movement, screen-relative)
function BirdsEyeCamera({ target, enabled }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 50, 0));

  useFrame(() => {
    if (!enabled) return;

    // Follow player from directly above with smooth damping
    const targetPos = new THREE.Vector3(
      target[0],
      50, // Good height for top-down view
      target[2]
    );

    // Smooth camera position
    smoothPos.current.x += (targetPos.x - smoothPos.current.x) * CAMERA_SMOOTHNESS * 1.5;
    smoothPos.current.y += (targetPos.y - smoothPos.current.y) * CAMERA_SMOOTHNESS;
    smoothPos.current.z += (targetPos.z - smoothPos.current.z) * CAMERA_SMOOTHNESS * 1.5;

    camera.position.copy(smoothPos.current);

    // Set camera up vector for correct top-down orientation (north at top of screen)
    camera.up.set(0, 0, -1);

    // Look straight down at player position
    camera.lookAt(smoothPos.current.x, 0, smoothPos.current.z);
  });

  return null;
}

// Mini-map component
function MiniMap({ catPos, fishList, essences, dimitrius, foundDimitrius, collectedEssences }) {
  const mapSize = 150;
  const mapScale = mapSize / ARENA_SIZE;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '16px',
      width: `${mapSize}px`,
      height: `${mapSize}px`,
      background: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 9998,
    }}>
      {/* Cat (center) */}
      <div style={{
        position: 'absolute',
        left: mapSize / 2 - 4,
        top: mapSize / 2 - 4,
        width: '8px',
        height: '8px',
        background: '#00ff00',
        borderRadius: '50%',
        boxShadow: '0 0 6px #00ff00',
        zIndex: 10,
      }} />

      {/* Fish with light radius */}
      {fishList.map((fish, i) => {
        const relX = (fish.x - catPos[0]) * mapScale + mapSize / 2;
        const relZ = (fish.z - catPos[2]) * mapScale + mapSize / 2;
        const radius = fish.lightRadius * mapScale;

        if (relX < -20 || relX > mapSize + 20 || relZ < -20 || relZ > mapSize + 20) return null;

        return (
          <div key={i}>
            {/* Light radius circle */}
            <div style={{
              position: 'absolute',
              left: relX - radius,
              top: relZ - radius,
              width: radius * 2,
              height: radius * 2,
              border: '1px solid rgba(255, 255, 0, 0.3)',
              borderRadius: '50%',
              background: 'rgba(255, 255, 0, 0.1)',
            }} />
            {/* Fish center */}
            <div style={{
              position: 'absolute',
              left: relX - 3,
              top: relZ - 3,
              width: '6px',
              height: '6px',
              background: '#ffff00',
              borderRadius: '50%',
            }} />
          </div>
        );
      })}

      {/* Essences */}
      {essences.filter(e => !collectedEssences.includes(e.id)).map((essence, i) => {
        const relX = (essence.x - catPos[0]) * mapScale + mapSize / 2;
        const relZ = (essence.z - catPos[2]) * mapScale + mapSize / 2;

        if (relX < 0 || relX > mapSize || relZ < 0 || relZ > mapSize) return null;

        return (
          <div key={i} style={{
            position: 'absolute',
            left: relX - 4,
            top: relZ - 4,
            width: '8px',
            height: '8px',
            background: '#ff8800',
            borderRadius: '50%',
            boxShadow: '0 0 4px #ff8800',
          }} />
        );
      })}

      {/* Dimitrius */}
      {!foundDimitrius && (
        <div style={{
          position: 'absolute',
          left: (dimitrius.x - catPos[0]) * mapScale + mapSize / 2 - 4,
          top: (dimitrius.z - catPos[2]) * mapScale + mapSize / 2 - 4,
          width: '8px',
          height: '8px',
          background: '#9933ff',
          borderRadius: '50%',
          boxShadow: '0 0 6px #9933ff',
        }} />
      )}

      {/* Mini-map label */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '4px',
        fontSize: '9px',
        color: '#666',
      }}>
        RADAR
      </div>
    </div>
  );
}

// Detection warning overlay
function DetectionWarning({ intensity }) {
  if (intensity <= 0) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      border: `${Math.floor(intensity * 30)}px solid rgba(255, 0, 0, ${intensity * 0.5})`,
      boxSizing: 'border-box',
      zIndex: 1040,
    }} />
  );
}

// Main game scene
function GameScene({
  fishList,
  collectibles,
  playerState,
  footprints,
  time,
  cameraMode,
  onCollect,
  onFindDimitrius,
  settings,
  obstacles,
}) {
  return (
    <>
      {/* PURE BLACK VOID - no ambient light, only fish provide light */}
      <color attach="background" args={['#000000']} />

      {/* Very minimal ambient - just enough to see the cat silhouette */}
      <ambientLight intensity={0.03} color="#001100" />

      {/* No directional light - darkness is the theme */}

      {/* Dark floor with grid */}
      <ArenaFloor />

      {/* Obstacles - solid objects that block movement */}
      <Obstacles obstacles={obstacles} />

      {/* Footprints trail - glowing green */}
      <Footprints footprints={footprints} time={time} />

      {/* Anglerfish - the ONLY major light sources */}
      {fishList.map((fish) => (
        <Anglerfish
          key={fish.id}
          fish={fish}
          time={time}
          catPosition={playerState.position}
          settings={settings}
        />
      ))}

      {/* Essences - amber glow */}
      {collectibles.essences.map((essence) => (
        <Essence
          key={essence.id}
          item={essence}
          time={time}
          playerPos={playerState.position}
          onCollect={onCollect}
        />
      ))}

      {/* Coins */}
      {collectibles.coins.map((coin) => (
        <Coin
          key={coin.id}
          item={coin}
          time={time}
          playerPos={playerState.position}
          onCollect={onCollect}
        />
      ))}

      {/* Power-up fish */}
      {collectibles.powerUps && collectibles.powerUps.map((powerUp) => (
        <PowerUpFish
          key={powerUp.id}
          item={powerUp}
          time={time}
          playerPos={playerState.position}
          onCollect={onCollect}
        />
      ))}

      {/* AEIOU (Dimitrius) - hidden in shadows, auto-triggers on contact */}
      <Dimitrius
        position={[collectibles.dimitrius.x, 0, collectibles.dimitrius.z]}
        found={playerState.foundDimitrius}
        playerPos={playerState.position}
        onInteract={onFindDimitrius}
      />

      {/* Shadow Cat - solid black with glowing green eyes */}
      <Cat
        position={playerState.position}
        facingAngle={playerState.facingAngle}
        isHit={playerState.isHit}
        isSprinting={playerState.isSprinting}
        isInvincible={playerState.isInvincible}
        time={time}
      />

      {/* Cameras */}
      <ThirdPersonCamera
        target={playerState.position}
        facingAngle={playerState.facingAngle}
        enabled={cameraMode === 'third'}
      />
      <BirdsEyeCamera
        target={playerState.position}
        enabled={cameraMode === 'birds'}
      />
    </>
  );
}

// Main component
export default function CatRealm3D({
  difficulty = 'NORMAL',
  freeMode = false,
  onComplete,
  onQuit,
  onToggleFreeMode,
  onNavigateRealm,
}) {
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;
  const isMobile = useIsMobile();

  const [gameState, setGameState] = useState('ready');
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(settings.lives);
  const [cameraMode, setCameraMode] = useState('third');
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [stamina, setStamina] = useState(STAMINA_MAX);
  const [essencesCollected, setEssencesCollected] = useState([]);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [detectionWarning, setDetectionWarning] = useState(0);
  const [showDimitriusMsg, setShowDimitriusMsg] = useState(false);
  const [graceTimer, setGraceTimer] = useState(0);
  const [footprints, setFootprints] = useState([]);

  // Power-up state
  const [invincibilityTimer, setInvincibilityTimer] = useState(0);
  const [speedBoostTimer, setSpeedBoostTimer] = useState(0);
  const [revealTimer, setRevealTimer] = useState(0);
  const [respawnInvincibility, setRespawnInvincibility] = useState(0);
  const [powerUpMessage, setPowerUpMessage] = useState('');

  // Smooth movement state
  const targetPosRef = useRef([0, 0, 0]);

  const fishListRef = useRef([]);
  const collectiblesRef = useRef(null);
  const obstaclesRef = useRef([]);
  const initialPlayerState = {
    position: [0, 0, 0],
    targetPosition: [0, 0, 0],
    velocity: [0, 0, 0],
    isHit: false,
    isSprinting: false,
    isInvincible: false,
    foundDimitrius: false,
    facingAngle: 0,
  };
  const playerStateRef = useRef({ ...initialPlayerState });
  const [playerState, setPlayerState] = useState({ ...initialPlayerState });

  // Initialize game
  useEffect(() => {
    fishListRef.current = generateFish(settings);
    collectiblesRef.current = generateCollectibles(settings);
    obstaclesRef.current = generateObstacles();
    playerStateRef.current = {
      position: [0, 0, 0],
      targetPosition: [0, 0, 0],
      velocity: [0, 0, 0],
      isHit: false,
      isSprinting: false,
      isInvincible: false,
      foundDimitrius: false,
      facingAngle: 0,
    };
    setPlayerState({ ...playerStateRef.current });
    setLives(settings.lives);
    setStamina(STAMINA_MAX);
    setEssencesCollected([]);
    setCoinsCollected(0);
    setScore(0);
    setTime(0);
  }, [settings]);

  // Handle start game from intro modal
  const handleStartGame = useCallback(() => {
    setShowIntroModal(false);
    setGameStarted(true);
    setGameState('playing');
  }, []);

  // Keyboard input for camera mode and pause (movement handled by global useGameInput)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '1') setCameraMode('third');
      if (e.key === '2') setCameraMode('birds');
      if (e.key === 'Escape') setGameState(gs => gs === 'playing' ? 'paused' : 'playing');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Game loop - only run when game has started
  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') return;

    const interval = setInterval(() => {
      const delta = 1 / 60;
      setTime(t => t + delta);

      const player = playerStateRef.current;

      // Get input from global system (works for both keyboard and mobile joystick)
      const input = getInput();

      // Timer countdowns
      setGraceTimer(gt => Math.max(0, gt - delta));
      setInvincibilityTimer(t => Math.max(0, t - delta));
      setSpeedBoostTimer(t => Math.max(0, t - delta));
      setRevealTimer(t => Math.max(0, t - delta));
      setRespawnInvincibility(t => Math.max(0, t - delta));

      // Update invincibility state
      player.isInvincible = invincibilityTimer > 0 || respawnInvincibility > 0;

      // DIFFERENT CONTROLS BASED ON CAMERA MODE
      let targetX = player.targetPosition[0];
      let targetZ = player.targetPosition[2];
      let isMoving = false;

      if (cameraMode === 'birds') {
        // BIRD'S EYE: PAC-MAN STYLE - directional movement
        // Use x/y from joystick or keyboard directly
        let moveX = input.x;
        let moveZ = -input.y; // Invert Y: up on screen = -Z in 3D space

        // Check if there's significant movement
        const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (magnitude > 0.1) {
          isMoving = true;
          // Cat faces direction of movement
          player.facingAngle = Math.atan2(moveX, moveZ);
        }

        // Apply speed
        const speed = (input.sprint && stamina > 0) ? SPRINT_SPEED : CAT_SPEED;
        const boostedSpeed = speedBoostTimer > 0 ? speed * 1.5 : speed;

        targetX = player.position[0] + moveX * boostedSpeed * delta;
        targetZ = player.position[2] + moveZ * boostedSpeed * delta;

      } else {
        // THIRD PERSON: CAR-LIKE CONTROLS
        // W/Up = forward, S/Down = backward, A/D or Left/Right = turn
        // Turning is continuous and works while moving (like a car)

        // Always allow turning - continuous rotation while key is held
        const turnAmount = input.x * TURN_SPEED * delta;
        player.facingAngle -= turnAmount;

        // Movement in facing direction
        let moveSpeed = 0;
        if (input.y > 0.1) moveSpeed = 1;        // Forward
        if (input.y < -0.1) moveSpeed = -0.4;    // Backward (slower)

        if (Math.abs(moveSpeed) > 0 || Math.abs(input.x) > 0.1) {
          isMoving = Math.abs(moveSpeed) > 0;
        }

        // Apply speed - sprinting only when moving forward
        const baseSpeed = (input.sprint && stamina > 0 && moveSpeed > 0) ? SPRINT_SPEED : CAT_SPEED;
        const boostedSpeed = speedBoostTimer > 0 ? baseSpeed * 1.5 : baseSpeed;
        const speed = boostedSpeed * moveSpeed;

        targetX = player.position[0] + Math.sin(player.facingAngle) * speed * delta;
        targetZ = player.position[2] + Math.cos(player.facingAngle) * speed * delta;
      }

      // Sprint handling
      const canSprint = input.sprint && stamina > 0 && isMoving;
      player.isSprinting = canSprint;

      if (canSprint) {
        setStamina(s => Math.max(0, s - delta));
      } else if (stamina < STAMINA_MAX) {
        setStamina(s => Math.min(STAMINA_MAX, s + delta * STAMINA_RECHARGE_RATE));
      }

      // SMOOTH MOVEMENT with lerping
      player.targetPosition[0] = targetX;
      player.targetPosition[2] = targetZ;

      // Lerp current position toward target
      player.position[0] += (targetX - player.position[0]) * MOVEMENT_SMOOTHNESS;
      player.position[2] += (targetZ - player.position[2]) * MOVEMENT_SMOOTHNESS;

      // Add paw prints when moving (alternating left/right)
      if (isMoving) {
        player.footprintTimer = (player.footprintTimer || 0) + delta;
        if (player.footprintTimer >= FOOTPRINT_INTERVAL) {
          player.footprintTimer = 0;
          // Toggle left/right paw
          player.isLeftPaw = !player.isLeftPaw;
          setFootprints(prev => {
            const newPrints = [...prev, {
              x: player.position[0],
              z: player.position[2],
              angle: player.facingAngle,
              time: time,
              isLeft: player.isLeftPaw
            }];
            // Keep only recent footprints, limit total count for performance
            const filtered = newPrints.filter(fp => time - fp.time < FOOTPRINT_LIFETIME);
            return filtered.slice(-MAX_FOOTPRINTS);
          });
        }
      }

      // Boundary collision
      const halfArena = ARENA_SIZE / 2 - 1;
      player.position[0] = Math.max(-halfArena, Math.min(halfArena, player.position[0]));
      player.position[2] = Math.max(-halfArena, Math.min(halfArena, player.position[2]));

      // Obstacle collision - push player out of obstacles
      for (const obs of obstaclesRef.current) {
        const dx = player.position[0] - obs.x;
        const dz = player.position[2] - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Collision radius depends on obstacle type
        let collisionRadius = 3 * obs.scale;
        if (obs.type === 'wall') {
          // Walls are longer - check box collision
          const cosR = Math.cos(obs.rotation);
          const sinR = Math.sin(obs.rotation);
          // Rotate point into obstacle's local space
          const localX = dx * cosR + dz * sinR;
          const localZ = -dx * sinR + dz * cosR;
          const halfWidth = 3.5 * obs.scale;
          const halfDepth = 1.5 * obs.scale;

          if (Math.abs(localX) < halfWidth && Math.abs(localZ) < halfDepth) {
            // Push out along shortest axis
            if (Math.abs(localX) / halfWidth > Math.abs(localZ) / halfDepth) {
              const pushX = (halfWidth - Math.abs(localX) + 0.5) * Math.sign(localX);
              player.position[0] += pushX * cosR;
              player.position[2] += -pushX * sinR;
            } else {
              const pushZ = (halfDepth - Math.abs(localZ) + 0.5) * Math.sign(localZ);
              player.position[0] += pushZ * sinR;
              player.position[2] += pushZ * cosR;
            }
          }
        } else if (dist < collisionRadius) {
          // Circular collision for pillars and rocks
          const pushDist = collisionRadius - dist + 0.5;
          const pushX = (dx / dist) * pushDist;
          const pushZ = (dz / dist) * pushDist;
          player.position[0] += pushX;
          player.position[2] += pushZ;
        }
      }

      // Light detection
      let minLightDist = Infinity;
      let detected = false;

      for (const fish of fishListRef.current) {
        const dx = player.position[0] - fish.x;
        const dz = player.position[2] - fish.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < fish.lightRadius) {
          detected = true;
          break;
        }

        // Warning when getting close
        const warningDist = fish.lightRadius + 3;
        if (dist < warningDist && dist < minLightDist) {
          minLightDist = dist;
        }
      }

      // Detection warning intensity
      if (minLightDist < Infinity) {
        const closestFish = fishListRef.current.reduce((closest, fish) => {
          const dx = player.position[0] - fish.x;
          const dz = player.position[2] - fish.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          return dist < closest.dist ? { dist, radius: fish.lightRadius } : closest;
        }, { dist: Infinity, radius: 10 });

        const warningIntensity = Math.max(0, 1 - (closestFish.dist - closestFish.radius) / 3);
        setDetectionWarning(warningIntensity);
      } else {
        setDetectionWarning(0);
      }

      // Handle detection - LIGHT RADIUS causes damage (not hunt radius)
      // Invincibility from power-ups or respawn protects you
      const isProtected = player.isInvincible;

      if (detected && graceTimer <= 0 && !player.isHit && !isProtected) {
        if (settings.gracePeriod > 0) {
          setGraceTimer(settings.gracePeriod);
        } else {
          // Caught! Respawn at safe location
          player.isHit = true;
          setTimeout(() => {
            player.isHit = false;
            // Find safe respawn position away from all enemies
            const safePos = findSafeRespawnPosition(fishListRef.current);
            player.position = [...safePos];
            player.targetPosition = [...safePos];
            player.velocity = [0, 0, 0];
            // Grant respawn invincibility
            setRespawnInvincibility(RESPAWN_INVINCIBILITY);
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState('lost');
              }
              return newLives;
            });
            setPlayerState({ ...player });
          }, 1000);
        }
      }

      // Check grace period expired while in light
      if (graceTimer > 0 && graceTimer - delta <= 0 && detected && !player.isHit && !isProtected) {
        player.isHit = true;
        setTimeout(() => {
          player.isHit = false;
          // Find safe respawn position away from all enemies
          const safePos = findSafeRespawnPosition(fishListRef.current);
          player.position = [...safePos];
          player.targetPosition = [...safePos];
          player.velocity = [0, 0, 0];
          // Grant respawn invincibility
          setRespawnInvincibility(RESPAWN_INVINCIBILITY);
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('lost');
            }
            return newLives;
          });
          setPlayerState({ ...player });
        }, 1000);
      }

      setPlayerState({ ...player });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameStarted, gameState, stamina, graceTimer, settings.gracePeriod, cameraMode, invincibilityTimer, speedBoostTimer, respawnInvincibility, time]);

  const handleCollect = useCallback((id, type, powerUpType) => {
    if (type === 'essence') {
      setEssencesCollected(prev => [...prev, id]);
      setScore(s => s + 500);
    } else if (type === 'coin') {
      setCoinsCollected(c => c + 1);
      setScore(s => s + 100);
    } else if (type === 'powerup') {
      // Handle power-up effects
      const config = POWERUP_TYPES[powerUpType];
      if (!config) return;

      switch (config.effect) {
        case 'coins':
          setScore(s => s + (config.value || 50));
          setPowerUpMessage(`+${config.value || 50} Coins!`);
          break;
        case 'invincibility':
          setInvincibilityTimer(config.duration);
          setPowerUpMessage(`Invincible for ${config.duration}s!`);
          break;
        case 'extraLife':
          setLives(l => l + 1);
          setPowerUpMessage('+1 Life!');
          break;
        case 'speed':
          setSpeedBoostTimer(config.duration);
          setPowerUpMessage(`Speed Boost for ${config.duration}s!`);
          break;
        case 'reveal':
          setRevealTimer(config.duration);
          setPowerUpMessage(`Essences Revealed for ${config.duration}s!`);
          break;
        default:
          break;
      }

      // Clear message after 2 seconds
      setTimeout(() => setPowerUpMessage(''), 2000);
    }
  }, []);

  const handleFindDimitrius = useCallback(() => {
    if (playerStateRef.current.foundDimitrius) return;

    playerStateRef.current.foundDimitrius = true;
    setScore(s => s + 1000);
    setPlayerState({ ...playerStateRef.current });

    // Immediately complete the game and return to clock mode (like bunny game)
    // This triggers the victory ceremony with AEIOU giving the shard
    onComplete?.({
      score: score + 1000,
      time,
      lives,
      essencesCollected: essencesCollected.length,
      coinsCollected
    });
  }, [score, time, lives, essencesCollected.length, coinsCollected, onComplete]);

  const handleRestart = useCallback(() => {
    fishListRef.current = generateFish(settings);
    collectiblesRef.current = generateCollectibles(settings);
    obstaclesRef.current = generateObstacles();
    playerStateRef.current = {
      position: [0, 0, 0],
      targetPosition: [0, 0, 0],
      velocity: [0, 0, 0],
      isHit: false,
      isSprinting: false,
      isInvincible: false,
      foundDimitrius: false,
      facingAngle: 0,
    };
    setPlayerState({ ...playerStateRef.current });
    setTime(0);
    setScore(0);
    setLives(settings.lives);
    setStamina(STAMINA_MAX);
    setEssencesCollected([]);
    setCoinsCollected(0);
    setFootprints([]);
    setShowIntroModal(true);
    setGameStarted(false);
    setGameState('ready');
    setGraceTimer(0);
    // Reset power-up timers
    setInvincibilityTimer(0);
    setSpeedBoostTimer(0);
    setRevealTimer(0);
    setRespawnInvincibility(0);
    setPowerUpMessage('');
  }, [settings]);

  if (!collectiblesRef.current) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: '#000000' }}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        gl={{ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' }}
        dpr={isMobile ? 1 : [1, 1.5]}
      >
        <GameScene
          fishList={fishListRef.current}
          collectibles={collectiblesRef.current}
          playerState={playerState}
          footprints={footprints}
          time={time}
          cameraMode={cameraMode}
          onCollect={handleCollect}
          onFindDimitrius={handleFindDimitrius}
          settings={settings}
          obstacles={obstaclesRef.current}
        />
      </Canvas>

      {/* Detection warning */}
      <DetectionWarning intensity={detectionWarning} />

      {/* Mini-map */}
      <MiniMap
        catPos={playerState.position}
        fishList={fishListRef.current}
        essences={collectiblesRef.current.essences}
        dimitrius={collectiblesRef.current.dimitrius}
        foundDimitrius={playerState.foundDimitrius}
        collectedEssences={essencesCollected}
      />

      {/* Mobile controls are now handled globally by GlobalMobileControls in Game.jsx */}

      <GameHUD
        freeMode={freeMode}
        onToggleFreeMode={onToggleFreeMode}
        collectibles={{ current: essencesCollected.length, total: 3 }}
        collectibleIcon="crystal"
        coins={score}
        time={time}
        lives={lives}
        maxLives={settings.lives}
        isPaused={gameState === 'paused'}
        onPause={() => setGameState(gs => gs === 'playing' ? 'paused' : 'playing')}
        onRestart={handleRestart}
        onQuit={onQuit}
        realmName="Shadow Hunt"
        currentRealm="cat"
        onNavigateRealm={onNavigateRealm}
      />

      {/* Stamina bar - glowing green theme */}
      <div style={{
        position: 'fixed',
        top: '100px',
        left: '16px',
        width: '120px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid #00ff0033',
      }}>
        <div style={{ color: '#00ff88', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>
          Stamina
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: '#111',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(stamina / STAMINA_MAX) * 100}%`,
            height: '100%',
            background: stamina > 1 ? '#00ff88' : '#ff6b6b',
            boxShadow: stamina > 1 ? '0 0 8px #00ff88' : '0 0 8px #ff6b6b',
            transition: 'width 0.1s',
          }} />
        </div>
      </div>

      {/* Active power-up indicators */}
      <div style={{
        position: 'fixed',
        top: '160px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {invincibilityTimer > 0 && (
          <div style={{
            background: 'rgba(0, 191, 255, 0.3)',
            border: '1px solid #00bfff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#00bfff',
          }}>
            Invincible: {Math.ceil(invincibilityTimer)}s
          </div>
        )}
        {speedBoostTimer > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid #ffffff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#ffffff',
          }}>
            Speed: {Math.ceil(speedBoostTimer)}s
          </div>
        )}
        {revealTimer > 0 && (
          <div style={{
            background: 'rgba(153, 50, 204, 0.3)',
            border: '1px solid #9932cc',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#9932cc',
          }}>
            Reveal: {Math.ceil(revealTimer)}s
          </div>
        )}
        {respawnInvincibility > 0 && (
          <div style={{
            background: 'rgba(0, 255, 136, 0.2)',
            border: '1px solid #00ff88',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#00ff88',
          }}>
            Protected: {Math.ceil(respawnInvincibility)}s
          </div>
        )}
      </div>

      {/* Power-up message */}
      {powerUpMessage && (
        <div style={{
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ff88',
          borderRadius: '10px',
          padding: '15px 30px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#00ff88',
          textShadow: '0 0 10px #00ff88',
          zIndex: 1100,
        }}>
          {powerUpMessage}
        </div>
      )}

      {/* Objectives panel */}
      <div style={{
        position: 'fixed',
        top: '230px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.75)',
        borderRadius: '12px',
        padding: '14px 18px',
        minWidth: '180px',
        border: '1px solid #33333350',
      }}>
        <div style={{ color: '#666', fontSize: '10px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Objectives
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: essencesCollected.length >= 3 ? '#4ade80' : '#FFA500', fontSize: '14px' }}>
            {essencesCollected.length >= 3 ? '[x]' : '[ ]'}
          </span>
          <span style={{ color: essencesCollected.length >= 3 ? '#4ade80' : '#FFA500', fontSize: '13px' }}>
            Essences: {essencesCollected.length}/3
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: playerState.foundDimitrius ? '#4ade80' : '#9966ff', fontSize: '14px' }}>
            {playerState.foundDimitrius ? '[x]' : '[ ]'}
          </span>
          <span style={{ color: playerState.foundDimitrius ? '#4ade80' : '#9966ff', fontSize: '13px' }}>
            {playerState.foundDimitrius ? 'AEIOU Found' : 'Find AEIOU'}
          </span>
        </div>

        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '11px' }}>
            Coins: <span style={{ color: '#ffd700' }}>{coinsCollected}</span>
          </div>
        </div>
      </div>

      {/* Controls hint - changes based on camera mode */}
      <div style={{
        position: 'fixed',
        bottom: '60px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '11px',
        color: '#888',
        border: '1px solid #00ff0022',
      }}>
        {cameraMode === 'third' ? (
          <>
            <div style={{ color: '#00ff88', marginBottom: '6px', fontWeight: 'bold' }}>Third Person (Tank Controls)</div>
            <div style={{ color: '#00ffcc' }}>A/D or ←/→: Turn left/right</div>
            <div style={{ color: '#00ffcc' }}>W or ↑: Move forward</div>
            <div style={{ color: '#00ffcc' }}>S or ↓: Move backward</div>
          </>
        ) : (
          <>
            <div style={{ color: '#00ff88', marginBottom: '6px', fontWeight: 'bold' }}>Bird's Eye (Pac-Man Controls)</div>
            <div style={{ color: '#00ffcc' }}>W or ↑: Move up</div>
            <div style={{ color: '#00ffcc' }}>S or ↓: Move down</div>
            <div style={{ color: '#00ffcc' }}>A or ←: Move left</div>
            <div style={{ color: '#00ffcc' }}>D or →: Move right</div>
          </>
        )}
        <div style={{ marginTop: '6px' }}>SPACE/SHIFT: Sprint</div>
        <div>E: Interact</div>
        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #333', color: '#aaa' }}>
          [1] Third Person  [2] Bird's Eye
        </div>
        <div style={{ marginTop: '6px', color: '#ff4444' }}>
          Stay out of the light!
        </div>
      </div>

      {/* Intro Modal - game paused until dismissed */}
      {showIntroModal && (
        <IntroModal realm="cat" onStart={handleStartGame} />
      )}

      {/* AEIOU message */}
      {showDimitriusMsg && (
        <div style={{
          position: 'fixed',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '25px 40px',
          background: 'rgba(50, 0, 80, 0.95)',
          borderRadius: '12px',
          zIndex: 1200,
          border: '2px solid #9933ff',
          textAlign: 'center',
        }}>
          <div style={{ color: '#cc99ff', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            AEIOU Found!
          </div>
          <div style={{ color: '#9966ff', fontSize: '14px', fontStyle: 'italic', marginBottom: '8px' }}>
            "You found me in the shadows, clever cat."
          </div>
          <div style={{ color: '#ffd700', fontSize: '13px' }}>
            +1000 points | Amber Pyramid Shard obtained
          </div>
          {essencesCollected.length < 3 && (
            <div style={{ color: '#ff8800', fontSize: '12px', marginTop: '10px' }}>
              Collect {3 - essencesCollected.length} more essence(s) to complete!
            </div>
          )}
        </div>
      )}

      {/* Game over / win overlay */}
      {(gameState === 'won' || gameState === 'lost') && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
        }}>
          <div style={{
            padding: '50px 70px',
            background: gameState === 'won' ? 'rgba(0, 50, 0, 0.9)' : 'rgba(50, 0, 0, 0.9)',
            borderRadius: '20px',
            textAlign: 'center',
            border: `2px solid ${gameState === 'won' ? '#00ff00' : '#ff4444'}`,
            minWidth: '380px',
          }}>
            {/* Eyes */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '20px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: gameState === 'won' ? '#00ff00' : '#ff0000',
                borderRadius: '50%',
                boxShadow: `0 0 20px ${gameState === 'won' ? '#00ff00' : '#ff0000'}`,
              }} />
              <div style={{
                width: '24px',
                height: '24px',
                background: gameState === 'won' ? '#00ff00' : '#ff0000',
                borderRadius: '50%',
                boxShadow: `0 0 20px ${gameState === 'won' ? '#00ff00' : '#ff0000'}`,
              }} />
            </div>

            <h2 style={{
              color: gameState === 'won' ? '#00ff00' : '#ff4444',
              fontSize: '32px',
              marginBottom: '25px'
            }}>
              {gameState === 'won' ? 'Hunt Complete!' : 'Caught!'}
            </h2>

            <div style={{ color: '#888', fontSize: '15px', marginBottom: '25px', lineHeight: 2 }}>
              <div>Score: <span style={{ color: '#ffd700' }}>{score}</span></div>
              <div>Essences: <span style={{ color: '#ff8800' }}>{essencesCollected.length}/3</span></div>
              <div>Time: <span style={{ color: '#fff' }}>
                {Math.floor(time / 60)}:{(Math.floor(time) % 60).toString().padStart(2, '0')}
              </span></div>
              {gameState === 'won' && time < settings.parTime && (
                <div style={{ color: '#4ade80' }}>
                  Time Bonus: +{Math.floor((settings.parTime - time) * 10)}
                </div>
              )}
              {gameState === 'won' && lives === settings.lives && (
                <div style={{ color: '#4ade80' }}>No Death Bonus: +2000</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={handleRestart}
                style={{
                  padding: '14px 32px',
                  background: gameState === 'won' ? '#00aa00' : '#aa0000',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Play Again
              </button>
              <button
                onClick={onQuit}
                style={{
                  padding: '14px 32px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid #444',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
