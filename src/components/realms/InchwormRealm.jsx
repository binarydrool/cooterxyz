"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile, setActionState } from '@/hooks/useGameInput';
import { useAudio, SOUNDS } from '@/hooks/useAudio';

// Difficulty settings - nectar goals and hazard density scale with difficulty
const DIFFICULTY_SETTINGS = {
  beginner: { nectarGoal: 500, hazardDensity: 0.3, windStrength: 0, timeLimit: 180, healingFlowers: 5 },
  easy: { nectarGoal: 1000, hazardDensity: 0.4, windStrength: 0.3, timeLimit: 160, healingFlowers: 4 },
  normal: { nectarGoal: 2000, hazardDensity: 0.5, windStrength: 0.5, timeLimit: 140, healingFlowers: 3 },
  hard: { nectarGoal: 3500, hazardDensity: 0.6, windStrength: 0.7, timeLimit: 120, healingFlowers: 2 },
  expert: { nectarGoal: 5000, hazardDensity: 0.7, windStrength: 0.8, timeLimit: 100, healingFlowers: 2 },
  master: { nectarGoal: 7500, hazardDensity: 0.8, windStrength: 0.9, timeLimit: 90, healingFlowers: 1 },
  impossible: { nectarGoal: 10000, hazardDensity: 1.0, windStrength: 1.0, timeLimit: 80, healingFlowers: 0 },
};

// Flight constants
const BUTTERFLY_SPEED = 8;
const BUTTERFLY_VERTICAL_SPEED = 5;
const BUTTERFLY_SIZE = 0.3;
const WORLD_SIZE = 100;
const WORLD_HEIGHT = 30;

// Collectible values
const NECTAR_VALUE = 100;
const POLLEN_VALUE = 250;
const DEWDROP_VALUE = 500;

// Garden zones
const ZONES = {
  meadow: { start: 0, end: 35, name: 'Meadow' },
  forest: { start: 35, end: 70, name: 'Flower Forest' },
  heart: { start: 70, end: 100, name: 'Heart Garden' },
};

// Butterfly player with iridescent wings
function Butterfly({ position, rotation, isFlying }) {
  const groupRef = useRef();
  const wingPhase = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      wingPhase.current += delta * (isFlying ? 15 : 8);
      const wingAngle = Math.sin(wingPhase.current) * 0.6;

      // Animate wings on children
      const leftWing = groupRef.current.children[1];
      const rightWing = groupRef.current.children[2];
      if (leftWing) leftWing.rotation.y = wingAngle;
      if (rightWing) rightWing.rotation.y = -wingAngle;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Body - cyan/teal color matching Miles */}
      <mesh castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color="#00CED1" emissive="#00CED1" emissiveIntensity={0.3} />
      </mesh>

      {/* Left wing - iridescent */}
      <group position={[0.15, 0.05, 0]}>
        <mesh rotation={[0, 0.3, 0.2]}>
          <planeGeometry args={[0.5, 0.35]} />
          <meshStandardMaterial
            color="#00CED1"
            emissive="#7FFFD4"
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      {/* Right wing - iridescent */}
      <group position={[-0.15, 0.05, 0]}>
        <mesh rotation={[0, -0.3, 0.2]}>
          <planeGeometry args={[0.5, 0.35]} />
          <meshStandardMaterial
            color="#00CED1"
            emissive="#7FFFD4"
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      {/* Antennae */}
      <mesh position={[0.03, 0.22, 0.08]} rotation={[0.3, 0, 0.2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.15]} />
        <meshStandardMaterial color="#004040" />
      </mesh>
      <mesh position={[-0.03, 0.22, 0.08]} rotation={[0.3, 0, -0.2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.15]} />
        <meshStandardMaterial color="#004040" />
      </mesh>

      {/* Sparkle trail effect */}
      {isFlying && (
        <pointLight color="#00CED1" intensity={1} distance={2} decay={2} />
      )}
    </group>
  );
}

// Giant flower - decorative environment
const FlowerMemo = ({ position, color, petalCount = 6, size = 1 }) => {
  const petals = useMemo(() => {
    const pts = [];
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      pts.push({ angle, key: i });
    }
    return pts;
  }, [petalCount]);

  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, size * 2, 0]}>
        <cylinderGeometry args={[0.1 * size, 0.15 * size, size * 4]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Flower head */}
      <group position={[0, size * 4, 0]}>
        {/* Petals */}
        {petals.map(({ angle, key }) => (
          <mesh
            key={key}
            position={[Math.cos(angle) * size * 0.8, 0, Math.sin(angle) * size * 0.8]}
            rotation={[Math.PI / 6, angle, 0]}
          >
            <sphereGeometry args={[size * 0.6, 8, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        ))}
        {/* Center */}
        <mesh>
          <sphereGeometry args={[size * 0.4, 12, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// Nectar droplet collectible
function NectarDroplet({ position, onCollect, collected }) {
  const meshRef = useRef();
  const bobOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + bobOffset) * 0.15;
    }
  });

  if (collected) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight color="#FFD700" intensity={0.8} distance={3} />
    </group>
  );
}

// Cyan essence collectible (required - 3 per realm)
function CyanEssence({ position, onCollect, collected }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.03;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  if (collected) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#00CED1"
          emissive="#00CED1"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight color="#00CED1" intensity={2} distance={5} />
    </group>
  );
}

// Dragonfly hazard - patrols and pushes player back
function Dragonfly({ position, patrolRadius, speed, onHit, playerPos }) {
  const groupRef = useRef();
  const angle = useRef(Math.random() * Math.PI * 2);
  const wingPhase = useRef(0);
  const baseY = position[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    angle.current += speed * delta;
    wingPhase.current += delta * 30;

    const x = position[0] + Math.cos(angle.current) * patrolRadius;
    const z = position[2] + Math.sin(angle.current) * patrolRadius;
    const y = baseY + Math.sin(angle.current * 2) * 0.5;

    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y = angle.current + Math.PI / 2;

    // Check collision with player
    if (playerPos) {
      const dx = x - playerPos[0];
      const dy = y - playerPos[1];
      const dz = z - playerPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.0) {
        onHit({ x: -Math.cos(angle.current), z: -Math.sin(angle.current) });
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      {/* Wings */}
      <mesh position={[0.2, 0.05, 0]} rotation={[0, 0, Math.sin(wingPhase.current) * 0.3]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshStandardMaterial color="#ADD8E6" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.2, 0.05, 0]} rotation={[0, 0, -Math.sin(wingPhase.current) * 0.3]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshStandardMaterial color="#ADD8E6" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Spider web hazard - slows player
function SpiderWeb({ position, size = 2 }) {
  return (
    <group position={position}>
      <mesh rotation={[0, Math.random() * Math.PI, 0]}>
        <ringGeometry args={[0, size, 8, 1]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Web strands */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.02, 0.02, size]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// Healing flower - restores health
function HealingFlower({ position, onHeal, used }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current && !used) {
      meshRef.current.rotation.y += 0.01;
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  if (used) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[0.4]} />
        <meshStandardMaterial
          color="#FF69B4"
          emissive="#FF69B4"
          emissiveIntensity={0.6}
        />
      </mesh>
      <pointLight color="#FF69B4" intensity={1.5} distance={4} />
    </group>
  );
}

// AEIOU/Dimitrius at the end of the realm
function Dimitrius({ position }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Simple gnome representation */}
      <mesh ref={meshRef}>
        <coneGeometry args={[0.5, 1.2, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.3, 12, 8]} />
        <meshStandardMaterial color="#FFE4B5" />
      </mesh>
      {/* Glow */}
      <pointLight color="#FFD700" intensity={2} distance={8} />
    </group>
  );
}

// Main game scene
function GameScene({ difficulty, onGameOver, onEssenceCollected, onScoreChange }) {
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
  const [gameState, setGameState] = useState('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(settings.timeLimit);
  const [essencesCollected, setEssencesCollected] = useState(0);
  const [isFlying, setIsFlying] = useState(true);
  const [inWeb, setInWeb] = useState(false);

  const butterflyPos = useRef([0, 10, 5]);
  const butterflyRot = useRef(0);
  const velocity = useRef([0, 0, 0]);
  const pushback = useRef({ x: 0, z: 0, time: 0 });

  // Generate flowers for environment
  const flowers = useMemo(() => {
    const flowerList = [];
    const flowerColors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4', '#DDA0DD'];

    for (let i = 0; i < 50; i++) {
      const zone = i < 20 ? 'meadow' : i < 40 ? 'forest' : 'heart';
      const zRange = ZONES[zone];
      flowerList.push({
        id: i,
        position: [
          (Math.random() - 0.5) * WORLD_SIZE * 0.8,
          0,
          zRange.start + Math.random() * (zRange.end - zRange.start),
        ],
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        size: 1 + Math.random() * 2,
        petalCount: 5 + Math.floor(Math.random() * 4),
      });
    }
    return flowerList;
  }, []);

  // Generate nectar droplets
  const [nectarDroplets, setNectarDroplets] = useState(() => {
    const droplets = [];
    for (let i = 0; i < 60; i++) {
      droplets.push({
        id: i,
        position: [
          (Math.random() - 0.5) * WORLD_SIZE * 0.7,
          5 + Math.random() * 15,
          Math.random() * WORLD_SIZE,
        ],
        collected: false,
      });
    }
    return droplets;
  });

  // Generate cyan essences (3 required)
  const [essences, setEssences] = useState(() => {
    return [
      { id: 0, position: [15, 12, 25], collected: false },  // Meadow
      { id: 1, position: [-20, 15, 55], collected: false }, // Flower Forest
      { id: 2, position: [0, 18, 85], collected: false },   // Heart Garden
    ];
  });

  // Generate dragonflies based on difficulty
  const dragonflies = useMemo(() => {
    const count = Math.floor(5 * settings.hazardDensity);
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        position: [
          (Math.random() - 0.5) * WORLD_SIZE * 0.6,
          8 + Math.random() * 10,
          20 + Math.random() * 60,
        ],
        patrolRadius: 5 + Math.random() * 10,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
    return list;
  }, [settings.hazardDensity]);

  // Generate spider webs
  const webs = useMemo(() => {
    const count = Math.floor(8 * settings.hazardDensity);
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        position: [
          (Math.random() - 0.5) * WORLD_SIZE * 0.6,
          5 + Math.random() * 12,
          10 + Math.random() * 70,
        ],
        size: 2 + Math.random() * 2,
      });
    }
    return list;
  }, [settings.hazardDensity]);

  // Generate healing flowers
  const [healingFlowers, setHealingFlowers] = useState(() => {
    const list = [];
    for (let i = 0; i < settings.healingFlowers; i++) {
      list.push({
        id: i,
        position: [
          (Math.random() - 0.5) * WORLD_SIZE * 0.5,
          6 + Math.random() * 8,
          15 + i * 20,
        ],
        used: false,
      });
    }
    return list;
  });

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          setGameState('gameover');
          onGameOver({ won: false, score, lives, essencesCollected });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score, lives, essencesCollected, onGameOver]);

  // Main game loop
  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    const input = getInput();
    const speedMult = inWeb ? 0.3 : 1.0; // Slow down in web
    const actualSpeed = BUTTERFLY_SPEED * speedMult;

    // Handle pushback from dragonfly
    if (pushback.current.time > 0) {
      butterflyPos.current[0] += pushback.current.x * 10 * delta;
      butterflyPos.current[2] += pushback.current.z * 10 * delta;
      pushback.current.time -= delta;
    }

    // Horizontal movement
    let moveX = 0;
    let moveZ = 0;

    if (input.up) moveZ = actualSpeed * delta;
    if (input.down) moveZ = -actualSpeed * delta;
    if (input.left) moveX = -actualSpeed * delta;
    if (input.right) moveX = actualSpeed * delta;

    // Vertical movement
    if (input.jump) {
      butterflyPos.current[1] += BUTTERFLY_VERTICAL_SPEED * delta;
    }
    if (input.sprint) {
      butterflyPos.current[1] -= BUTTERFLY_VERTICAL_SPEED * delta;
    }

    // Apply wind (based on difficulty)
    if (settings.windStrength > 0) {
      const windX = Math.sin(state.clock.elapsedTime * 0.5) * settings.windStrength * delta;
      const windZ = Math.cos(state.clock.elapsedTime * 0.3) * settings.windStrength * 0.5 * delta;
      moveX += windX;
      moveZ += windZ;
    }

    // Update position
    butterflyPos.current[0] += moveX;
    butterflyPos.current[2] += moveZ;

    // Update rotation to face movement direction
    if (moveX !== 0 || moveZ !== 0) {
      butterflyRot.current = Math.atan2(moveX, moveZ);
      setIsFlying(true);
    } else {
      setIsFlying(false);
    }

    // Clamp to world bounds
    butterflyPos.current[0] = Math.max(-WORLD_SIZE/2, Math.min(WORLD_SIZE/2, butterflyPos.current[0]));
    butterflyPos.current[1] = Math.max(2, Math.min(WORLD_HEIGHT, butterflyPos.current[1]));
    butterflyPos.current[2] = Math.max(0, Math.min(WORLD_SIZE, butterflyPos.current[2]));

    // Check nectar collection
    nectarDroplets.forEach((droplet, i) => {
      if (!droplet.collected) {
        const dx = droplet.position[0] - butterflyPos.current[0];
        const dy = droplet.position[1] - butterflyPos.current[1];
        const dz = droplet.position[2] - butterflyPos.current[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.0) {
          setNectarDroplets(prev => prev.map((d, idx) => idx === i ? { ...d, collected: true } : d));
          setScore(prev => {
            const newScore = prev + NECTAR_VALUE;
            onScoreChange(newScore);
            return newScore;
          });
        }
      }
    });

    // Check essence collection
    essences.forEach((essence, i) => {
      if (!essence.collected) {
        const dx = essence.position[0] - butterflyPos.current[0];
        const dy = essence.position[1] - butterflyPos.current[1];
        const dz = essence.position[2] - butterflyPos.current[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.5) {
          setEssences(prev => prev.map((e, idx) => idx === i ? { ...e, collected: true } : e));
          setEssencesCollected(prev => prev + 1);
          onEssenceCollected('cyan');
          setScore(prev => {
            const newScore = prev + 500;
            onScoreChange(newScore);
            return newScore;
          });
        }
      }
    });

    // Check healing flowers
    healingFlowers.forEach((flower, i) => {
      if (!flower.used && lives < 3) {
        const dx = flower.position[0] - butterflyPos.current[0];
        const dy = flower.position[1] - butterflyPos.current[1];
        const dz = flower.position[2] - butterflyPos.current[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.2) {
          setHealingFlowers(prev => prev.map((f, idx) => idx === i ? { ...f, used: true } : f));
          setLives(prev => Math.min(3, prev + 1));
        }
      }
    });

    // Check spider web collision
    let inAnyWeb = false;
    webs.forEach(web => {
      const dx = web.position[0] - butterflyPos.current[0];
      const dy = web.position[1] - butterflyPos.current[1];
      const dz = web.position[2] - butterflyPos.current[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < web.size) {
        inAnyWeb = true;
      }
    });
    setInWeb(inAnyWeb);

    // Check win condition - reached Heart Garden end with all essences and enough score
    const allEssencesCollected = essences.every(e => e.collected);
    if (butterflyPos.current[2] > 90 && allEssencesCollected && score >= settings.nectarGoal) {
      setGameState('won');
      onGameOver({ won: true, score, lives, essencesCollected: 3 });
    }
  });

  const handleDragonflyHit = useCallback((direction) => {
    pushback.current = { x: direction.x, z: direction.z, time: 0.5 };
    setLives(prev => {
      if (prev <= 1) {
        setGameState('gameover');
        onGameOver({ won: false, score, lives: 0, essencesCollected });
        return 0;
      }
      return prev - 1;
    });
  }, [score, essencesCollected, onGameOver]);

  return (
    <>
      {/* Lighting - soft morning light */}
      <ambientLight intensity={0.5} color="#FFF8E7" />
      <directionalLight position={[50, 80, 30]} intensity={1.2} color="#FFFAF0" castShadow />
      <hemisphereLight args={['#87CEEB', '#228B22', 0.4]} />

      {/* Sky gradient */}
      <mesh position={[0, 50, 50]}>
        <sphereGeometry args={[150, 32, 16]} />
        <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
      </mesh>

      {/* Ground - lush garden floor */}
      <mesh position={[0, 0, 50]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE * 1.5, WORLD_SIZE * 1.5]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Flowers (environment decoration) */}
      {flowers.map(flower => (
        <FlowerMemo
          key={flower.id}
          position={flower.position}
          color={flower.color}
          size={flower.size}
          petalCount={flower.petalCount}
        />
      ))}

      {/* Nectar droplets */}
      {nectarDroplets.map(droplet => (
        <NectarDroplet
          key={droplet.id}
          position={droplet.position}
          collected={droplet.collected}
        />
      ))}

      {/* Cyan essences */}
      {essences.map(essence => (
        <CyanEssence
          key={essence.id}
          position={essence.position}
          collected={essence.collected}
        />
      ))}

      {/* Dragonflies */}
      {dragonflies.map(df => (
        <Dragonfly
          key={df.id}
          position={df.position}
          patrolRadius={df.patrolRadius}
          speed={df.speed}
          onHit={handleDragonflyHit}
          playerPos={butterflyPos.current}
        />
      ))}

      {/* Spider webs */}
      {webs.map(web => (
        <SpiderWeb key={web.id} position={web.position} size={web.size} />
      ))}

      {/* Healing flowers */}
      {healingFlowers.map(flower => (
        <HealingFlower
          key={flower.id}
          position={flower.position}
          used={flower.used}
        />
      ))}

      {/* Dimitrius at the Heart Garden */}
      <Dimitrius position={[0, 2, 95]} />

      {/* Butterfly player */}
      <Butterfly
        position={butterflyPos.current}
        rotation={butterflyRot.current}
        isFlying={isFlying}
      />

      {/* Camera follows butterfly */}
      <PerspectiveCamera
        makeDefault
        position={[
          butterflyPos.current[0],
          butterflyPos.current[1] + 5,
          butterflyPos.current[2] - 10,
        ]}
        rotation={[-0.3, 0, 0]}
        fov={60}
      />

      {/* Floating pollen particles (limited for performance) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            butterflyPos.current[0] + (Math.random() - 0.5) * 20,
            butterflyPos.current[1] + (Math.random() - 0.5) * 10,
            butterflyPos.current[2] + Math.random() * 15,
          ]}
        >
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

// Main component
export default function InchwormRealm({ onExit, onEssenceCollected, onShardCollected, difficulty = 'normal' }) {
  const [showIntro, setShowIntro] = useState(true);
  const [gameState, setGameState] = useState('intro');
  const [score, setScore] = useState(0);
  const [gameResult, setGameResult] = useState(null);

  const handleStartGame = useCallback(() => {
    setShowIntro(false);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback((result) => {
    setGameResult(result);
    setGameState(result.won ? 'won' : 'lost');

    if (result.won && onShardCollected) {
      onShardCollected('inchworm');
    }
  }, [onShardCollected]);

  const handleEssenceCollected = useCallback((type) => {
    if (onEssenceCollected) {
      onEssenceCollected(type);
    }
  }, [onEssenceCollected]);

  const handleScoreChange = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  const handleExit = useCallback(() => {
    if (onExit) onExit();
  }, [onExit]);

  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Intro Modal */}
      {showIntro && (
        <IntroModal
          realmName="The Metamorphosis"
          realmDescription="Transform into a beautiful butterfly! Fly through the magical garden, collect nectar droplets, and find all 3 cyan essences. Reach AEIOU in the Heart Garden to claim the Mind Shard!"
          difficulty={difficulty}
          onStart={handleStartGame}
          onBack={handleExit}
          animal="miles"
          tips={[
            "WASD to fly in any direction",
            "SPACE to fly higher, SHIFT to descend",
            "Collect golden nectar droplets for points",
            "Find all 3 glowing cyan essences!",
            "Avoid dragonflies - they push you back!",
            "Spider webs slow you down",
            "Pink healing flowers restore health",
            `Score ${settings.nectarGoal} points to win`,
          ]}
        />
      )}

      {/* Game Canvas */}
      {!showIntro && (
        <Canvas shadows>
          <GameScene
            difficulty={difficulty}
            onGameOver={handleGameOver}
            onEssenceCollected={handleEssenceCollected}
            onScoreChange={handleScoreChange}
          />
        </Canvas>
      )}

      {/* HUD */}
      {!showIntro && gameState === 'playing' && (
        <GameHUD
          score={score}
          lives={3}
          time={settings.timeLimit}
          onPause={handleExit}
          realmName="The Metamorphosis"
          targetScore={settings.nectarGoal}
        />
      )}

      {/* Win/Lose overlay */}
      {(gameState === 'won' || gameState === 'lost') && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 100,
        }}>
          <h1 style={{ fontSize: '48px', color: gameState === 'won' ? '#00CED1' : '#ff4444', textShadow: '0 0 20px currentColor' }}>
            {gameState === 'won' ? 'METAMORPHOSIS COMPLETE!' : 'GAME OVER'}
          </h1>
          <p style={{ fontSize: '24px', marginTop: '10px' }}>Score: {score}</p>
          {gameState === 'won' && (
            <>
              <p style={{ fontSize: '20px', color: '#00CED1', marginTop: '10px' }}>
                Cyan Essence Collected!
              </p>
              <p style={{ fontSize: '18px', color: '#FFD700', marginTop: '5px' }}>
                Pyramid Shard Layer 4 Acquired - "From the Chrysalis"
              </p>
            </>
          )}
          {gameState === 'lost' && gameResult && (
            <p style={{ fontSize: '16px', color: '#888', marginTop: '10px' }}>
              {score < settings.nectarGoal
                ? `Need ${settings.nectarGoal - score} more nectar points`
                : 'Collect all 3 cyan essences and reach the Heart Garden!'}
            </p>
          )}
          <button
            onClick={handleExit}
            style={{
              marginTop: '30px',
              padding: '15px 40px',
              fontSize: '18px',
              background: 'linear-gradient(135deg, #00CED1 0%, #008B8B 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#fff',
              boxShadow: '0 0 15px rgba(0, 206, 209, 0.5)',
            }}
          >
            Return to Clock
          </button>
        </div>
      )}
    </div>
  );
}
