"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile } from '@/hooks/useGameInput';

// Difficulty settings - more wolves at higher difficulty
const DIFFICULTY_SETTINGS = {
  BEGINNER: { wolfCount: 2, forestSize: 35, wolfSpeed: 4, safeHeight: 2.5 },
  EASY: { wolfCount: 3, forestSize: 40, wolfSpeed: 5, safeHeight: 2.5 },
  NORMAL: { wolfCount: 4, forestSize: 45, wolfSpeed: 6, safeHeight: 3 },
  HARD: { wolfCount: 5, forestSize: 50, wolfSpeed: 7, safeHeight: 3.5 },
  EXPERT: { wolfCount: 6, forestSize: 55, wolfSpeed: 8, safeHeight: 4 },
  MASTER: { wolfCount: 7, forestSize: 60, wolfSpeed: 9, safeHeight: 4.5 },
  IMPOSSIBLE: { wolfCount: 8, forestSize: 65, wolfSpeed: 10, safeHeight: 5 },
};

// Input is now handled globally via useGameInput hook

// Generate forest with trees, rocks
function generateForest(size) {
  const trees = [];
  const rocks = [];
  const fireflies = [];

  // Generate trees - denser forest
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * (size - 10);
    trees.push({
      id: `tree-${i}`,
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
      height: 5 + Math.random() * 8,
      radius: 0.3 + Math.random() * 0.4,
      foliageSize: 2 + Math.random() * 2,
    });
  }

  // Generate rocks
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * (size - 8);
    rocks.push({
      id: `rock-${i}`,
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
      scale: 0.5 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  // Generate fireflies (fewer, more eerie)
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * (size - 5);
    fireflies.push({
      id: `firefly-${i}`,
      position: [Math.cos(angle) * radius, 1 + Math.random() * 4, Math.sin(angle) * radius],
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1,
    });
  }

  return { trees, rocks, fireflies };
}

// 3D Owl character
function Owl({ position, rotation, isFlying, isInDanger }) {
  const groupRef = useRef();
  const wingRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(new THREE.Vector3(...position), 0.15);
      groupRef.current.rotation.y = rotation;
    }
    // Wing flapping - faster when in danger
    if (wingRef.current) {
      const flapSpeed = isInDanger ? 20 : (isFlying ? 10 : 2);
      wingRef.current.rotation.z = Math.sin(clock.elapsedTime * flapSpeed) * 0.5;
    }
  });

  const bodyColor = isInDanger ? '#8B0000' : '#5D4037';
  const eyeColor = isInDanger ? '#ff0000' : '#FFD700';

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* Belly */}
      <mesh position={[0, -0.05, 0.15]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#D7CCC8" roughness={0.9} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.35, 0.1]} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* Face disc */}
      <mesh position={[0, 0.35, 0.3]}>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial color="#EFEBE9" roughness={0.9} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.08, 0.38, 0.35]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0.08, 0.38, 0.35]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>

      {/* Pupils */}
      <mesh position={[-0.08, 0.38, 0.42]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.08, 0.38, 0.42]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Ear tufts */}
      <mesh position={[-0.15, 0.55, 0.05]} rotation={[0, 0, -0.3]} castShadow>
        <coneGeometry args={[0.06, 0.2, 4]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      <mesh position={[0.15, 0.55, 0.05]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.06, 0.2, 4]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0.28, 0.38]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshStandardMaterial color="#FF8F00" />
      </mesh>

      {/* Wings */}
      <group ref={wingRef}>
        <mesh position={[-0.35, 0.05, 0]} rotation={[0, 0, -0.5]} castShadow>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color="#4E342E" roughness={0.8} />
        </mesh>
        <mesh position={[0.35, 0.05, 0]} rotation={[0, 0, 0.5]} castShadow>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color="#4E342E" roughness={0.8} />
        </mesh>
      </group>

      {/* Tail */}
      <mesh position={[0, -0.1, -0.35]} rotation={[-0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.15, 0.3, 6]} />
        <meshStandardMaterial color="#4E342E" />
      </mesh>

      {/* Danger glow */}
      {isInDanger && (
        <pointLight position={[0, 0, 0]} color="#ff0000" intensity={2} distance={3} />
      )}
    </group>
  );
}

// Scary wolf enemy
function Wolf({ wolf, playerPosition }) {
  const groupRef = useRef();
  const [runPhase, setRunPhase] = useState(0);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(new THREE.Vector3(wolf.position[0], wolf.position[1], wolf.position[2]), 0.1);

      // Face the player
      const dx = playerPosition[0] - wolf.position[0];
      const dz = playerPosition[2] - wolf.position[2];
      groupRef.current.rotation.y = Math.atan2(dx, dz);

      // Running animation
      setRunPhase(clock.elapsedTime * 15);
    }
  });

  const legOffset = Math.sin(runPhase) * 0.3;
  const bodyBob = Math.abs(Math.sin(runPhase)) * 0.1;

  return (
    <group ref={groupRef} position={wolf.position}>
      {/* Body */}
      <mesh position={[0, 0.5 + bodyBob, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 8, 12]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.6 + bodyBob, 0.45]} castShadow>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>

      {/* Snout */}
      <mesh position={[0, 0.55 + bodyBob, 0.65]} rotation={[-0.2, 0, 0]} castShadow>
        <coneGeometry args={[0.1, 0.25, 6]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
      </mesh>

      {/* Glowing red eyes */}
      <mesh position={[-0.08, 0.65 + bodyBob, 0.55]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0.08, 0.65 + bodyBob, 0.55]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.12, 0.8 + bodyBob, 0.4]} rotation={[0.3, 0, -0.2]} castShadow>
        <coneGeometry args={[0.05, 0.15, 4]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
      <mesh position={[0.12, 0.8 + bodyBob, 0.4]} rotation={[0.3, 0, 0.2]} castShadow>
        <coneGeometry args={[0.05, 0.15, 4]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Front legs */}
      <mesh position={[-0.15, 0.25 + legOffset, 0.2]} castShadow>
        <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
      <mesh position={[0.15, 0.25 - legOffset, 0.2]} castShadow>
        <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Back legs */}
      <mesh position={[-0.15, 0.25 - legOffset, -0.25]} castShadow>
        <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
      <mesh position={[0.15, 0.25 + legOffset, -0.25]} castShadow>
        <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0.5 + bodyBob, -0.5]} rotation={[-0.8, 0, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Eye glow lights */}
      <pointLight position={[0, 0.6, 0.6]} color="#ff0000" intensity={0.8} distance={3} />
    </group>
  );
}

// Hidden Elf - the goal
function Elf({ position, isFound }) {
  const groupRef = useRef();
  const [bobOffset] = useState(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (groupRef.current && !isFound) {
      // Gentle floating
      groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + bobOffset) * 0.1;
      groupRef.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  if (isFound) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 8, 12]} />
        <meshStandardMaterial color="#2E8B57" roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color="#FDBF6F" roughness={0.8} />
      </mesh>

      {/* Pointy elf hat */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#228B22" roughness={0.7} />
      </mesh>

      {/* Hat tip with glow */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.06, 1.02, 0.15]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh position={[0.06, 1.02, 0.15]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>

      {/* Arms out */}
      <mesh position={[-0.3, 0.6, 0]} rotation={[0, 0, -0.8]} castShadow>
        <capsuleGeometry args={[0.05, 0.25, 4, 8]} />
        <meshStandardMaterial color="#2E8B57" />
      </mesh>
      <mesh position={[0.3, 0.6, 0]} rotation={[0, 0, 0.8]} castShadow>
        <capsuleGeometry args={[0.05, 0.25, 4, 8]} />
        <meshStandardMaterial color="#2E8B57" />
      </mesh>

      {/* Magical glow */}
      <pointLight position={[0, 1.2, 0]} color="#00ff88" intensity={2} distance={8} />

      {/* Sparkle particles */}
      <mesh position={[0.3, 1.3, 0.3]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      <mesh position={[-0.25, 1.5, -0.2]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <mesh position={[0.15, 1.7, 0.15]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color="#ff88ff" />
      </mesh>
    </group>
  );
}

// Tree component
function Tree({ tree }) {
  return (
    <group position={tree.position}>
      {/* Trunk */}
      <mesh position={[0, tree.height / 2, 0]} castShadow>
        <cylinderGeometry args={[tree.radius * 0.6, tree.radius, tree.height, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      {/* Dark foliage - spooky but visible */}
      <mesh position={[0, tree.height, 0]} castShadow>
        <coneGeometry args={[tree.foliageSize, tree.foliageSize * 2, 8]} />
        <meshStandardMaterial color="#1a5a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, tree.height + tree.foliageSize * 0.8, 0]} castShadow>
        <coneGeometry args={[tree.foliageSize * 0.7, tree.foliageSize * 1.5, 8]} />
        <meshStandardMaterial color="#2a6a2a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Rock
function Rock({ rock }) {
  return (
    <mesh position={rock.position} rotation={[0, rock.rotation, 0]} scale={rock.scale} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#3D3D3D" roughness={0.9} />
    </mesh>
  );
}

// Firefly
function Firefly({ firefly }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.elapsedTime * firefly.speed + firefly.phase;
      meshRef.current.position.x = firefly.position[0] + Math.sin(t) * 0.5;
      meshRef.current.position.y = firefly.position[1] + Math.sin(t * 1.5) * 0.3;
      meshRef.current.position.z = firefly.position[2] + Math.cos(t * 0.8) * 0.5;
      const blink = Math.sin(t * 3) > 0.7 ? 1 : 0.2;
      meshRef.current.material.opacity = blink;
    }
  });

  return (
    <mesh ref={meshRef} position={firefly.position}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshBasicMaterial color="#88ff88" transparent opacity={0.8} />
    </mesh>
  );
}

// Dark sky with moon
function DarkSky() {
  const starsRef = useRef();

  const starPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 400; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.4;
      const r = 100;
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + 30,
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    return new Float32Array(positions);
  }, []);

  useFrame(({ clock }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.elapsedTime * 0.001;
    }
  });

  return (
    <>
      {/* Night sky - dark but not pitch black */}
      <mesh>
        <sphereGeometry args={[120, 32, 32]} />
        <meshBasicMaterial color="#1a1a2f" side={THREE.BackSide} />
      </mesh>

      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starPositions.length / 3}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.4} color="#aaaaaa" sizeAttenuation={false} />
      </points>

      {/* Blood moon - brighter glow */}
      <group position={[-30, 20, -50]}>
        <mesh>
          <sphereGeometry args={[6, 32, 32]} />
          <meshBasicMaterial color="#cc3333" />
        </mesh>
        <mesh>
          <sphereGeometry args={[8, 32, 32]} />
          <meshBasicMaterial color="#cc3333" transparent opacity={0.2} />
        </mesh>
        <pointLight color="#ff4444" intensity={1.0} distance={200} />
      </group>
    </>
  );
}

// Ground with fog
function Ground({ size }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <circleGeometry args={[size + 15, 32]} />
        <meshStandardMaterial color="#0a1a0a" roughness={1} />
      </mesh>
      {/* Fog effect - lighter for better visibility */}
      <fog attach="fog" args={['#1a1a2a', 15, 80]} />
    </>
  );
}

// Camera controller
function CameraController({ target, rotation }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const distance = 10;
    const height = 5;
    const offsetX = Math.sin(rotation) * distance;
    const offsetZ = Math.cos(rotation) * distance;

    targetPos.current.set(
      target[0] - offsetX,
      target[1] + height,
      target[2] - offsetZ
    );

    camera.position.lerp(targetPos.current, 0.05);
    camera.lookAt(target[0], target[1], target[2]);
  });

  return null;
}

// Game scene
function GameScene({ forestData, playerState, wolves, elfState, onElfFound, isInDanger }) {
  const { trees, rocks, fireflies } = forestData;

  return (
    <>
      <DarkSky />
      <Ground size={forestData.size || 45} />

      {/* Ambient light - dim but visible */}
      <ambientLight intensity={0.35} />

      {/* Blood moon light - brighter for visibility */}
      <directionalLight
        position={[-30, 20, -50]}
        intensity={0.5}
        color="#cc4444"
        castShadow
      />

      {/* Additional fill light to help see */}
      <directionalLight
        position={[20, 15, 20]}
        intensity={0.25}
        color="#6666aa"
      />

      {/* Trees */}
      {trees.map(tree => (
        <Tree key={tree.id} tree={tree} />
      ))}

      {/* Rocks */}
      {rocks.map(rock => (
        <Rock key={rock.id} rock={rock} />
      ))}

      {/* Fireflies */}
      {fireflies.map(firefly => (
        <Firefly key={firefly.id} firefly={firefly} />
      ))}

      {/* Wolves! */}
      {wolves.map((wolf, i) => (
        <Wolf key={i} wolf={wolf} playerPosition={playerState?.position || [0, 0, 0]} />
      ))}

      {/* Hidden Elf */}
      <Elf position={elfState.position} isFound={elfState.found} />

      {/* Owl */}
      {playerState && (
        <Owl
          position={playerState.position}
          rotation={playerState.rotation}
          isFlying={!playerState.onGround}
          isInDanger={isInDanger}
        />
      )}

      {/* Camera */}
      {playerState && (
        <CameraController
          target={playerState.position}
          rotation={playerState.rotation}
        />
      )}
    </>
  );
}

// Main component
export default function OwlRealm3D({
  difficulty = 'NORMAL',
  freeMode = false,
  onComplete,
  onExit,
  onQuit,
  onToggleFreeMode,
  onNavigateRealm,
}) {
  const [gameState, setGameState] = useState('playing');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [lives, setLives] = useState(3);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [warning, setWarning] = useState('');
  const [isInDanger, setIsInDanger] = useState(false);
  const [elfFound, setElfFound] = useState(false);

  const forestDataRef = useRef(null);
  const playerRef = useRef({
    position: [0, 5, 0],
    velocity: [0, 0, 0],
    rotation: 0,
    onGround: false,
  });
  const wolvesRef = useRef([]);
  const elfRef = useRef({ position: [20, 1, 20], found: false });

  const [playerState, setPlayerState] = useState(null);
  const [wolves, setWolves] = useState([]);
  const [elfState, setElfState] = useState({ position: [20, 1, 20], found: false });

  const isMobile = useIsMobile();

  // Handle start game from intro modal
  const handleStartGame = useCallback(() => {
    setShowIntroModal(false);
    setGameStarted(true);
  }, []);

  // Mobile input now handled globally by useGameInput

  // Initialize game
  useEffect(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;
    const forest = generateForest(settings.forestSize);
    forest.size = settings.forestSize;
    forestDataRef.current = forest;

    // Place elf far from start, hidden among trees
    const elfAngle = Math.random() * Math.PI * 2;
    const elfRadius = settings.forestSize * 0.6 + Math.random() * 10;
    elfRef.current = {
      position: [Math.cos(elfAngle) * elfRadius, 1, Math.sin(elfAngle) * elfRadius],
      found: false,
    };

    // Spawn wolves around the forest
    const initialWolves = [];
    for (let i = 0; i < settings.wolfCount; i++) {
      const angle = (i / settings.wolfCount) * Math.PI * 2;
      const radius = 15 + Math.random() * 15;
      initialWolves.push({
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        velocity: [0, 0, 0],
        howlTimer: Math.random() * 5,
      });
    }
    wolvesRef.current = initialWolves;

    playerRef.current = {
      position: [0, 5, 0],
      velocity: [0, 0, 0],
      rotation: 0,
      onGround: false,
    };

    setPlayerState({ ...playerRef.current });
    setWolves([...initialWolves]);
    setElfState({ ...elfRef.current });
    setLives(3);
    setTime(0);
    setScore(0);
    setGameState('playing');
    setElfFound(false);
  }, [difficulty]);

  // Timer - only run when game has started
  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameState]);

  // Keyboard input for pause (movement handled by global useGameInput)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'escape') {
        setGameState(gs => gs === 'playing' ? 'paused' : 'playing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Main game loop - only run when game has started
  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') return;

    let animationId;
    let lastTime = performance.now();
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;

    const update = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!forestDataRef.current) {
        animationId = requestAnimationFrame(update);
        return;
      }

      const player = playerRef.current;
      const currentWolves = wolvesRef.current;
      const elf = elfRef.current;

      const gravity = 12;
      const flySpeed = 10;
      const turnSpeed = 3;
      const liftForce = 15;

      // Get input from global system
      const input = getInput();

      // Rotation based on x axis
      if (input.x < -0.3) player.rotation += turnSpeed * dt;
      if (input.x > 0.3) player.rotation -= turnSpeed * dt;

      // Forward/back based on y axis
      let moveForward = 0;
      if (input.y > 0.3) moveForward = flySpeed;
      if (input.y < -0.3) moveForward = -flySpeed * 0.5;

      player.velocity[0] = Math.sin(player.rotation) * moveForward;
      player.velocity[2] = Math.cos(player.rotation) * moveForward;

      // Vertical movement - jump button for lift, sprint for descend
      if (input.jump) {
        player.velocity[1] = liftForce;
      } else if (input.sprint) {
        player.velocity[1] = -liftForce;
      } else {
        player.velocity[1] -= gravity * dt;
      }

      // Apply velocity
      player.position[0] += player.velocity[0] * dt;
      player.position[1] += player.velocity[1] * dt;
      player.position[2] += player.velocity[2] * dt;

      // Ground collision
      if (player.position[1] < 1.5) {
        player.position[1] = 1.5;
        player.velocity[1] = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }

      // Height limit
      if (player.position[1] > 20) {
        player.position[1] = 20;
        player.velocity[1] = 0;
      }

      // Boundary
      const boundary = settings.forestSize;
      const dist = Math.sqrt(player.position[0] ** 2 + player.position[2] ** 2);
      if (dist > boundary) {
        const angle = Math.atan2(player.position[0], player.position[2]);
        player.position[0] = Math.sin(angle) * boundary;
        player.position[2] = Math.cos(angle) * boundary;
      }

      // Check if in danger zone (too low)
      const dangerHeight = settings.safeHeight;
      const inDanger = player.position[1] < dangerHeight;
      setIsInDanger(inDanger);

      if (inDanger) {
        setWarning("FLY HIGHER! WOLVES BELOW!");
      } else {
        setWarning("");
      }

      // Wolf AI - chase player when they're low, pace otherwise
      currentWolves.forEach((wolf, i) => {
        const dx = player.position[0] - wolf.position[0];
        const dz = player.position[2] - wolf.position[2];
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);

        // Wolves speed up when player is low
        let speed = settings.wolfSpeed;
        if (player.position[1] < dangerHeight + 2) {
          speed = settings.wolfSpeed * 1.5; // Faster when prey is close!
        }

        // Chase toward player (on ground)
        if (distToPlayer > 1) {
          const chaseDir = Math.atan2(dx, dz);
          wolf.position[0] += Math.sin(chaseDir) * speed * dt;
          wolf.position[2] += Math.cos(chaseDir) * speed * dt;
        }

        // Keep on ground and in bounds
        wolf.position[1] = 0;
        const wolfDist = Math.sqrt(wolf.position[0] ** 2 + wolf.position[2] ** 2);
        if (wolfDist > boundary) {
          const angle = Math.atan2(wolf.position[0], wolf.position[2]);
          wolf.position[0] = Math.sin(angle) * boundary;
          wolf.position[2] = Math.cos(angle) * boundary;
        }

        // Check collision with player - wolves can jump/lunge when player is low!
        // The lower the player, the larger the catch radius (wolves can leap)
        const playerHeight = player.position[1];
        const catchRadius = playerHeight < 2 ? 2.5 : (playerHeight < dangerHeight ? 2.0 : 1.2);
        const wolfReach = 2.5; // Wolves can jump up this high

        if (playerHeight < wolfReach && distToPlayer < catchRadius) {
          // Wolf caught the owl!
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('lost');
            } else {
              // Respawn player at safe height, away from wolves
              const respawnAngle = Math.random() * Math.PI * 2;
              player.position = [Math.sin(respawnAngle) * 5, 10, Math.cos(respawnAngle) * 5];
              player.velocity = [0, 0, 0];
            }
            return newLives;
          });
        }
      });

      // Check if found elf
      if (!elf.found) {
        const elfDx = player.position[0] - elf.position[0];
        const elfDy = player.position[1] - elf.position[1];
        const elfDz = player.position[2] - elf.position[2];
        const elfDist = Math.sqrt(elfDx * elfDx + elfDy * elfDy + elfDz * elfDz);

        if (elfDist < 3) {
          elf.found = true;
          setElfFound(true);
          setElfState({ ...elf });
          const newScore = score + 1000;
          setScore(newScore);
          // After brief celebration, immediately return to clock for shard ceremony
          setTimeout(() => {
            if (onComplete) {
              const timeBonus = Math.max(0, 300 - time) * 5;
              const livesBonus = lives * 200;
              const finalScore = newScore + timeBonus + livesBonus;
              onComplete({ score: finalScore, time, difficulty, lives });
            }
          }, 1500);
        }

        // Distance hints
        if (elfDist < 10) {
          setWarning(prev => prev || "The elf's magic is very strong here!");
        } else if (elfDist < 20) {
          setWarning(prev => prev || "You sense magical energy nearby...");
        }
      }

      setPlayerState({ ...player });
      setWolves([...currentWolves]);
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, gameState, difficulty]);

  const handlePause = useCallback(() => {
    setGameState(gs => gs === 'playing' ? 'paused' : 'playing');
  }, []);

  const handleRestart = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;
    const forest = generateForest(settings.forestSize);
    forest.size = settings.forestSize;
    forestDataRef.current = forest;

    const elfAngle = Math.random() * Math.PI * 2;
    const elfRadius = settings.forestSize * 0.6 + Math.random() * 10;
    elfRef.current = {
      position: [Math.cos(elfAngle) * elfRadius, 1, Math.sin(elfAngle) * elfRadius],
      found: false,
    };

    const initialWolves = [];
    for (let i = 0; i < settings.wolfCount; i++) {
      const angle = (i / settings.wolfCount) * Math.PI * 2;
      const radius = 15 + Math.random() * 15;
      initialWolves.push({
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        velocity: [0, 0, 0],
        howlTimer: Math.random() * 5,
      });
    }
    wolvesRef.current = initialWolves;

    playerRef.current = {
      position: [0, 5, 0],
      velocity: [0, 0, 0],
      rotation: 0,
      onGround: false,
    };

    setPlayerState({ ...playerRef.current });
    setWolves([...initialWolves]);
    setElfState({ ...elfRef.current });
    setLives(3);
    setTime(0);
    setScore(0);
    setWarning('');
    setElfFound(false);
    setShowIntroModal(true);
    setGameStarted(false);
    setGameState('playing');
  }, [difficulty]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      const timeBonus = Math.max(0, 300 - time) * 5;
      const livesBonus = lives * 200;
      const finalScore = score + timeBonus + livesBonus;
      onComplete({ score: finalScore, time, difficulty, lives });
    }
  }, [onComplete, difficulty, score, time, lives]);

  const handleQuit = onQuit || onExit;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a15', zIndex: 100 }}>
      <GameHUD
        freeMode={freeMode}
        onToggleFreeMode={onToggleFreeMode}
        collectibles={{ current: elfFound ? 1 : 0, total: 1 }}
        collectibleIcon="feather"
        coins={score}
        time={time}
        lives={lives}
        maxLives={3}
        isPaused={gameState === 'paused'}
        onPause={handlePause}
        onRestart={handleRestart}
        onQuit={handleQuit}
        realmName="Dark Forest"
        currentRealm="owl"
        onNavigateRealm={onNavigateRealm}
      />

      {/* Intro Modal */}
      {showIntroModal && <IntroModal realm="owl" onStart={handleStartGame} />}

      {/* Warning display */}
      {warning && !showIntroModal && (
        <div style={{
          position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
          padding: '12px 28px', background: isInDanger ? 'rgba(139, 0, 0, 0.9)' : 'rgba(0, 100, 0, 0.8)',
          borderRadius: '12px',
          color: isInDanger ? '#fff' : '#00ff88',
          fontSize: '18px', fontWeight: 'bold',
          border: isInDanger ? '2px solid #ff0000' : '1px solid #00ff88',
          zIndex: 1100,
          animation: isInDanger ? 'pulse 0.5s infinite' : 'none',
        }}>
          {warning}
        </div>
      )}

      {/* Height indicator */}
      {!showIntroModal && (
        <div style={{
          position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)',
          width: '20px', height: '200px', background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '10px', border: '1px solid #333', zIndex: 1100,
        }}>
          {/* Danger zone */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(DIFFICULTY_SETTINGS[difficulty]?.safeHeight || 3) / 20 * 100}%`,
            background: 'rgba(139, 0, 0, 0.5)', borderRadius: '0 0 10px 10px',
          }} />
          {/* Current height marker */}
          <div style={{
            position: 'absolute', left: '-5px', right: '-5px',
            bottom: `${Math.min(100, ((playerState?.position[1] || 5) / 20) * 100)}%`,
            height: '4px', background: isInDanger ? '#ff0000' : '#00ff88',
            borderRadius: '2px', transition: 'bottom 0.1s',
          }} />
          <div style={{
            position: 'absolute', left: '30px', bottom: '0',
            color: '#ff4444', fontSize: '10px', whiteSpace: 'nowrap',
          }}>DANGER</div>
          <div style={{
            position: 'absolute', left: '30px', top: '0',
            color: '#00ff88', fontSize: '10px', whiteSpace: 'nowrap',
          }}>SAFE</div>
        </div>
      )}

      {/* Elf found notification */}
      {elfFound && gameState === 'playing' && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          padding: '30px 50px', background: 'rgba(0, 50, 0, 0.95)', borderRadius: '20px',
          zIndex: 1200, border: '3px solid #00ff88', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '10px' }}>
            <svg width="64" height="64" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="10" rx="3" ry="4" fill="#228B22" />
              <circle cx="8" cy="5" r="2.5" fill="#FDBF6F" />
              <path d="M8 2 L6 5 L10 5 Z" fill="#DC143C" />
              <circle cx="7" cy="5" r="0.5" fill="#333" />
              <circle cx="9" cy="5" r="0.5" fill="#333" />
            </svg>
          </div>
          <div style={{ color: '#00ff88', fontSize: '28px', fontWeight: 'bold' }}>ELF FOUND!</div>
          <div style={{ color: '#aaa', fontSize: '14px', marginTop: '10px' }}>
            You escaped the Dark Forest!
          </div>
        </div>
      )}

      {/* Controls hint */}
      {!isMobile && !showIntroModal && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          padding: '8px 16px', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '8px',
          color: '#555', fontSize: '12px',
        }}>
          WASD: Fly | SPACE: Rise | SHIFT: Dive | Find the Elf!
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: 0 }}>
        <Canvas
          shadows={!isMobile}
          camera={{ fov: 60 }}
          gl={{ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' }}
          dpr={isMobile ? 1 : [1, 1.5]}
        >
          {forestDataRef.current && (
            <GameScene
              forestData={forestDataRef.current}
              playerState={playerState}
              wolves={wolves}
              elfState={elfState}
              isInDanger={isInDanger}
            />
          )}
        </Canvas>
      </div>

      {/* Win overlay */}
      {gameState === 'won' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(4px)', zIndex: 1000,
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #1a3a1a 0%, #0a1a0a 100%)',
            borderRadius: '12px', padding: '40px', textAlign: 'center', minWidth: '300px',
            border: '1px solid #00ff88',
          }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <svg width="48" height="48" viewBox="0 0 16 16" fill="none">
                <ellipse cx="8" cy="9" rx="5" ry="5" fill="#8B4513" />
                <circle cx="5.5" cy="7" r="2.5" fill="#FFF8DC" />
                <circle cx="10.5" cy="7" r="2.5" fill="#FFF8DC" />
                <circle cx="5.5" cy="7" r="1.2" fill="#FFD700" />
                <circle cx="10.5" cy="7" r="1.2" fill="#FFD700" />
                <path d="M7 10 L8 12 L9 10" fill="#FF8C00" />
              </svg>
              <svg width="48" height="48" viewBox="0 0 16 16" fill="none">
                <ellipse cx="8" cy="10" rx="3" ry="4" fill="#228B22" />
                <circle cx="8" cy="5" r="2.5" fill="#FDBF6F" />
                <path d="M8 2 L6 5 L10 5 Z" fill="#DC143C" />
              </svg>
            </div>
            <h2 style={{ color: '#00ff88', fontSize: '28px', marginBottom: '24px' }}>
              You Escaped!
            </h2>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.8 }}>
              <div>Score: <span style={{ color: '#ffd700' }}>{score}</span></div>
              <div>Time: <span style={{ color: '#fff' }}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span></div>
              <div>Lives Remaining: <span style={{ color: '#4ade80' }}>{lives}/3</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleRestart} style={{
                padding: '12px 24px', background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                color: '#fff', fontSize: '14px', cursor: 'pointer',
              }}>Play Again</button>
              {!freeMode && (
                <button onClick={handleComplete} style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #4B0082 0%, #2E0854 100%)',
                  border: 'none', borderRadius: '6px',
                  color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>Claim Shard</button>
              )}
              <button onClick={handleQuit} style={{
                padding: '12px 24px', background: 'rgba(255, 100, 100, 0.2)',
                border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '6px',
                color: '#ff8888', fontSize: '14px', cursor: 'pointer',
              }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Lose overlay */}
      {gameState === 'lost' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(4px)', zIndex: 1000,
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #3a1a1a 0%, #1a0a0a 100%)',
            borderRadius: '12px', padding: '40px', textAlign: 'center', minWidth: '300px',
            border: '1px solid #8B0000',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 16 16" fill="none">
                <ellipse cx="8" cy="9" rx="5" ry="4" fill="#2d2d2d" />
                <ellipse cx="8" cy="6" rx="3" ry="2.5" fill="#3a3a3a" />
                <path d="M5 4 L6 6 L4 5 Z" fill="#2d2d2d" />
                <path d="M11 4 L10 6 L12 5 Z" fill="#2d2d2d" />
                <circle cx="6" cy="5.5" r="0.8" fill="#ff0000" />
                <circle cx="10" cy="5.5" r="0.8" fill="#ff0000" />
              </svg>
            </div>
            <h2 style={{ color: '#8B0000', fontSize: '28px', marginBottom: '24px' }}>
              The Wolves Got You!
            </h2>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              Fly higher to stay safe from the wolves!
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleRestart} style={{
                padding: '12px 24px', background: 'linear-gradient(135deg, #8B0000 0%, #5a0000 100%)',
                border: 'none', borderRadius: '6px',
                color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>Try Again</button>
              <button onClick={handleQuit} style={{
                padding: '12px 24px', background: 'rgba(255, 100, 100, 0.2)',
                border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '6px',
                color: '#ff8888', fontSize: '14px', cursor: 'pointer',
              }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile controls are now handled globally by GlobalMobileControls in Game.jsx */}
    </div>
  );
}
