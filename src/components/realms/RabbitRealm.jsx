"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile, setActionState } from '@/hooks/useGameInput';

// Difficulty settings - optimized for 25x25 maze (smaller = faster)
const DIFFICULTY_SETTINGS = {
  beginner: { foxCount: 1, foxSpeed: 1.0, powerUpDuration: 20, carrots: 15, foxSpawnRate: 90 },
  easy: { foxCount: 2, foxSpeed: 1.2, powerUpDuration: 18, carrots: 20, foxSpawnRate: 80 },
  normal: { foxCount: 2, foxSpeed: 1.4, powerUpDuration: 15, carrots: 25, foxSpawnRate: 70 },
  hard: { foxCount: 3, foxSpeed: 1.6, powerUpDuration: 12, carrots: 30, foxSpawnRate: 60 },
  expert: { foxCount: 3, foxSpeed: 1.8, powerUpDuration: 10, carrots: 35, foxSpawnRate: 50 },
  master: { foxCount: 4, foxSpeed: 2.0, powerUpDuration: 8, carrots: 40, foxSpawnRate: 45 },
  impossible: { foxCount: 5, foxSpeed: 2.5, powerUpDuration: 6, carrots: 45, foxSpawnRate: 40 },
};

// Carrot respawn delay in seconds
const CARROT_RESPAWN_TIME = 8;
const INVISIBILITY_DURATION = 5;
const MAX_FOXES = 4;

// Maze generation - balanced: feels like a maze but easy to navigate
function generateMaze(width, height) {
  const maze = Array(height).fill(null).map(() => Array(width).fill(1));

  function carve(x, y) {
    maze[y][x] = 0;
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
        maze[y + dy/2][x + dx/2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Add extra paths for easier navigation (balanced)
  for (let i = 0; i < width * height / 6; i++) {
    const x = 1 + Math.floor(Math.random() * (width - 2));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    maze[y][x] = 0;
  }

  return maze;
}

// Instanced Hay Bales - ALL walls in ONE draw call for massive performance
function HayBaleInstances({ maze, mazeSize }) {
  const meshRef = useRef();

  const count = useMemo(() => {
    let c = 0;
    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        if (maze[y]?.[x] === 1) c++;
      }
    }
    return c;
  }, [maze, mazeSize]);

  useEffect(() => {
    if (!meshRef.current) return;

    const tempObject = new THREE.Object3D();
    let i = 0;

    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        if (maze[y]?.[x] === 1) {
          tempObject.position.set(x + 0.5, 0.5, y + 0.5);
          tempObject.scale.set(0.7, 1, 0.7);
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(i, tempObject.matrix);
          i++;
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [maze, mazeSize]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#c9a227" />
    </instancedMesh>
  );
}

// Simple pumpkin - PERFORMANCE OPTIMIZED (2 meshes only)
function Pumpkin({ position, scale = 0.3 }) {
  const color = useMemo(() => `hsl(${25 + Math.random() * 15}, 80%, 48%)`, []);
  return (
    <group position={position} scale={scale}>
      <mesh scale={[1, 0.7, 1]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.3, 4]} />
        <meshBasicMaterial color="#5D4E37" />
      </mesh>
    </group>
  );
}

// Simple grass ground - PERFORMANCE OPTIMIZED
function GrassGround({ size }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size/2, -0.01, size/2]}>
      <planeGeometry args={[size + 8, size + 8]} />
      <meshBasicMaterial color="#6b8c4a" />
    </mesh>
  );
}

// Colors matching clock rabbit exactly
const FUR_COLOR = "#e8dcd0"; // Warm cream/beige
const FUR_DARK = "#c4b5a5"; // Darker fur for shading
const FUR_LIGHT = "#f0e6dc"; // Light cream for chest
const INNER_EAR = "#e8b4b4"; // Pink inner ear
const NOSE_COLOR = "#d4a5a5"; // Pink nose
const EYE_COLOR = "#2a1810"; // Dark brown eyes

// Rabbit Player - SIMPLE and FAST
function Rabbit({ position, rotation, isPoweredUp, isInvisible, jumpHeight, isMoving }) {
  const groupRef = useRef();

  const furColor = isPoweredUp ? "#ffd700" : isInvisible ? "#88ddff" : FUR_COLOR;
  const opacity = isInvisible ? 0.5 : 1;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
      groupRef.current.position.y = jumpHeight + (isMoving ? Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.1 : 0);
      groupRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], jumpHeight, position[2]]} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.32, 8, 6]} />
        <meshBasicMaterial color={furColor} transparent={isInvisible} opacity={opacity} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.6, 0.15]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshBasicMaterial color={furColor} transparent={isInvisible} opacity={opacity} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.1, 0.85, 0.05]}>
        <capsuleGeometry args={[0.05, 0.25, 2, 4]} />
        <meshBasicMaterial color={furColor} transparent={isInvisible} opacity={opacity} />
      </mesh>
      <mesh position={[0.1, 0.85, 0.05]}>
        <capsuleGeometry args={[0.05, 0.25, 2, 4]} />
        <meshBasicMaterial color={furColor} transparent={isInvisible} opacity={opacity} />
      </mesh>
      {/* Inner ears */}
      <mesh position={[-0.1, 0.85, 0.07]}>
        <capsuleGeometry args={[0.025, 0.18, 2, 3]} />
        <meshBasicMaterial color={INNER_EAR} />
      </mesh>
      <mesh position={[0.1, 0.85, 0.07]}>
        <capsuleGeometry args={[0.025, 0.18, 2, 3]} />
        <meshBasicMaterial color={INNER_EAR} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.65, 0.3]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[0.08, 0.65, 0.3]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshBasicMaterial color={EYE_COLOR} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.55, 0.35]}>
        <sphereGeometry args={[0.03, 4, 3]} />
        <meshBasicMaterial color={NOSE_COLOR} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.32, -0.28]}>
        <sphereGeometry args={[0.1, 4, 4]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
}

// Fox Enemy - OPTIMIZED (fewer meshes)
function Fox({ position, rotation, isScared, isActive }) {
  if (!isActive) return null;

  const mainColor = isScared ? "#6666ff" : "#ff6b35";
  const bellyColor = isScared ? "#8888ff" : "#ffaa77";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 3, 5]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.48, 0.22]}>
        <sphereGeometry args={[0.17, 6, 5]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.42, 0.38]} rotation={[-0.3, 0, 0]}>
        <coneGeometry args={[0.09, 0.2, 4]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.07, 0.52, 0.32]}>
        <sphereGeometry args={[0.04, 5, 4]} />
        <meshBasicMaterial color={isScared ? "#ffffff" : "#ffff00"} />
      </mesh>
      <mesh position={[0.07, 0.52, 0.32]}>
        <sphereGeometry args={[0.04, 5, 4]} />
        <meshBasicMaterial color={isScared ? "#ffffff" : "#ffff00"} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.12, 0.65, 0.15]} rotation={[0.2, 0, -0.4]}>
        <coneGeometry args={[0.06, 0.16, 3]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      <mesh position={[0.12, 0.65, 0.15]} rotation={[0.2, 0, 0.4]}>
        <coneGeometry args={[0.06, 0.16, 3]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.32, -0.3]} rotation={[-0.6, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.4, 3, 4]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      <mesh position={[0, 0.5, -0.55]}>
        <sphereGeometry args={[0.08, 4, 4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// Carrot collectible - detailed!
function Carrot({ position, collected, isGolden, isGhost, isLife, respawnProgress }) {
  if (collected) return null;

  const carrotColor = isGolden ? "#ffd700" : isGhost ? "#00ffff" : isLife ? "#22cc22" : "#ff7b00";
  const leafColor = isGhost ? "#00aa88" : "#2d8a2d";
  const opacity = isGhost ? 0.7 : 1;

  return (
    <group position={position}>
      {/* Carrot body */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.4, 8]} />
        <meshBasicMaterial color={carrotColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      {/* Carrot rings */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.08, 0.015, 4, 12]} />
        <meshBasicMaterial color={isGolden ? "#ffaa00" : "#cc5500"} transparent={isGhost} opacity={opacity} />
      </mesh>
      {/* Leaves */}
      <mesh position={[-0.04, 0.22, 0]} rotation={[-0.3, 0, -0.2]}>
        <capsuleGeometry args={[0.02, 0.12, 3, 4]} />
        <meshBasicMaterial color={leafColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.24, 0]} rotation={[-0.15, 0, 0]}>
        <capsuleGeometry args={[0.02, 0.14, 3, 4]} />
        <meshBasicMaterial color={leafColor} transparent={isGhost} opacity={opacity} />
      </mesh>
      <mesh position={[0.04, 0.22, 0]} rotation={[-0.3, 0, 0.2]}>
        <capsuleGeometry args={[0.02, 0.12, 3, 4]} />
        <meshBasicMaterial color={leafColor} transparent={isGhost} opacity={opacity} />
      </mesh>
    </group>
  );
}

// Coin collectible - OPTIMIZED
function Coin({ position, collected }) {
  if (collected) return null;

  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.12, 0.12, 0.04, 8]} />
      <meshBasicMaterial color="#ffd700" />
    </mesh>
  );
}

// Power pellet - OPTIMIZED
function PowerPellet({ position, collected }) {
  if (collected) return null;

  return (
    <mesh position={position}>
      <octahedronGeometry args={[0.18, 0]} />
      <meshBasicMaterial color="#ffd700" />
    </mesh>
  );
}

// Elf character - OPTIMIZED
function Elf({ position, found }) {
  if (found) return null;

  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.12, 0.25, 3, 4]} />
        <meshBasicMaterial color="#228b22" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshBasicMaterial color="#ffdab9" />
      </mesh>

      {/* Pointy hat */}
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.1, 0.25, 4]} />
        <meshBasicMaterial color="#ff4500" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.04, 0.68, 0.1]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.04, 0.68, 0.1]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.12, 0.65, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.03, 0.08, 3]} />
        <meshBasicMaterial color="#ffdab9" />
      </mesh>
      <mesh position={[0.12, 0.65, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.03, 0.08, 3]} />
        <meshBasicMaterial color="#ffdab9" />
      </mesh>

      {/* Key */}
      <group position={[0.15, 0.4, 0.1]} rotation={[0, 0, 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 4]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <torusGeometry args={[0.04, 0.015, 4, 6]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      </group>
    </group>
  );
}

// Particle burst effect - disabled for performance
function ParticleBurst({ onComplete }) {
  // Call onComplete immediately to clean up
  useEffect(() => {
    onComplete?.();
  }, [onComplete]);
  return null;
}

// Camera that follows the player
function FollowCamera({ target }) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3(22, 12, 30));
  const currentLookAt = useRef(new THREE.Vector3());

  useFrame(() => {
    if (target) {
      const targetPosition = new THREE.Vector3(
        target[0],
        target[1] + 10,
        target[2] + 9
      );

      currentPosition.current.lerp(targetPosition, 0.06);
      camera.position.copy(currentPosition.current);

      const lookAtTarget = new THREE.Vector3(target[0], target[1], target[2]);
      currentLookAt.current.lerp(lookAtTarget, 0.08);
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
}

// No decorations for maximum performance
const generateDecorationPositions = () => ({ pumpkins: [] });

// Main game scene
function GameScene({
  maze,
  mazeSize,
  playerPos,
  playerRotation,
  isPoweredUp,
  isInvisible,
  jumpHeight,
  isMoving,
  foxes,
  carrots,
  coins,
  powerPellets,
  particles,
  onParticleComplete,
  elfPos,
  elfFound,
}) {
  // Generate decoration positions once
  const decorations = useMemo(() => generateDecorationPositions(mazeSize), [mazeSize]);

  return (
    <>
      {/* Lighting - simple */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 15, 10]} intensity={0.6} />

      {/* Sky/Background */}
      <color attach="background" args={['#87CEEB']} />

      {/* Grass Ground */}
      <GrassGround size={mazeSize} />

      {/* A few pumpkins for decoration */}
      {decorations.pumpkins.map((p, i) => (
        <Pumpkin key={`pumpkin-${i}`} position={p.position} scale={p.scale} />
      ))}

      {/* Hay bale maze walls - INSTANCED for performance */}
      <HayBaleInstances maze={maze} mazeSize={mazeSize} />

      {/* Elf - find him to get the key! */}
      <Elf position={elfPos} found={elfFound} />

      {/* Player */}
      <Rabbit
        position={playerPos}
        rotation={playerRotation}
        isPoweredUp={isPoweredUp}
        isInvisible={isInvisible}
        jumpHeight={jumpHeight}
        isMoving={isMoving}
      />

      {/* Foxes */}
      {foxes.map((fox, i) => (
        <Fox
          key={fox.id || i}
          position={[fox.x, 0, fox.z]}
          rotation={fox.rotation}
          isScared={isPoweredUp}
          isActive={fox.active}
        />
      ))}

      {/* Carrots */}
      {carrots.map((carrot, i) => (
        <Carrot
          key={`carrot-${carrot.id || i}`}
          position={[carrot.x, 0.45, carrot.z]}
          collected={carrot.collected}
          isGolden={carrot.isGolden}
          isGhost={carrot.isGhost}
          isLife={carrot.isLife}
          respawnProgress={carrot.respawnProgress || 0}
        />
      ))}

      {/* Coins */}
      {coins.map((coin, i) => (
        <Coin
          key={`coin-${i}`}
          position={[coin.x, 0.35, coin.z]}
          collected={coin.collected}
        />
      ))}

      {/* Power Pellets */}
      {powerPellets.map((pellet, i) => (
        <PowerPellet
          key={`pellet-${i}`}
          position={[pellet.x, 0.5, pellet.z]}
          collected={pellet.collected}
        />
      ))}

      {/* Particle effects */}
      {particles.map((p) => (
        <ParticleBurst
          key={p.id}
          position={[p.x, p.y, p.z]}
          color={p.color}
          onComplete={() => onParticleComplete(p.id)}
        />
      ))}

      {/* Camera */}
      <FollowCamera target={playerPos} />
    </>
  );
}

// Main component
export default function RabbitRealm({
  difficulty = 'normal',
  onComplete,
  onDeath,
  onExit,
}) {
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
  const mazeSize = 25; // Smaller = much faster performance

  // Game state
  const [maze, setMaze] = useState(() => generateMaze(mazeSize, mazeSize));
  const [playerPos, setPlayerPos] = useState([1.5, 0, 1.5]);
  const [playerRotation, setPlayerRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isPoweredUp, setIsPoweredUp] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [invisibleTimer, setInvisibleTimer] = useState(0);

  // Jump state
  const [isJumping, setIsJumping] = useState(false);
  const [jumpHeight, setJumpHeight] = useState(0);
  const [jumpVelocity, setJumpVelocity] = useState(0);

  const [foxes, setFoxes] = useState([]);
  const [carrots, setCarrots] = useState([]);
  const [coins, setCoins] = useState([]);
  const [powerPellets, setPowerPellets] = useState([]);
  const [particles, setParticles] = useState([]);

  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [carrotsCollected, setCarrotsCollected] = useState(0);
  const [health, setHealth] = useState(3); // 3 hits before game over
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [invincibleTimer, setInvincibleTimer] = useState(0);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // Elf position - placed far from start in the maze
  const [elfPos] = useState(() => {
    // Find a position far from start (start is at 1.5, 0, 1.5)
    // Place elf in the opposite corner area of the maze
    const farX = mazeSize - 2.5 + (Math.random() - 0.5) * 2;
    const farZ = mazeSize - 2.5 + (Math.random() - 0.5) * 2;
    return [farX, 0, farZ];
  });
  const [elfFound, setElfFound] = useState(false);

  // Fox spawning
  const [lastFoxSpawnTime, setLastFoxSpawnTime] = useState(0);
  const foxIdRef = useRef(0);
  const carrotIdRef = useRef(0);

  const keysRef = useRef({});
  const lastUpdateRef = useRef(Date.now());
  const particleIdRef = useRef(0);
  const isMobile = useIsMobile();

  // Mobile input now handled globally by useGameInput

  // Handle start game from intro modal
  const handleStartGame = useCallback(() => {
    setShowIntroModal(false);
    setGameStarted(true);
  }, []);

  // Get open cells for spawning
  const getOpenCells = useCallback(() => {
    const openCells = [];
    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        if (maze[y][x] === 0 && !(x === 1 && y === 1)) {
          openCells.push({ x: x + 0.5, z: y + 0.5 });
        }
      }
    }
    return openCells;
  }, [maze, mazeSize]);

  // Handle game restart
  const handleRestart = useCallback(() => {
    // Generate new maze
    const newMaze = generateMaze(mazeSize, mazeSize);
    setMaze(newMaze);

    // Reset player state
    setPlayerPos([1.5, 0, 1.5]);
    setPlayerRotation(0);
    setIsMoving(false);
    setIsPoweredUp(false);
    setIsInvisible(false);
    setPowerUpTimer(0);
    setInvisibleTimer(0);
    setIsJumping(false);
    setJumpHeight(0);
    setJumpVelocity(0);

    // Reset game state
    setScore(0);
    setCoinsCollected(0);
    setCarrotsCollected(0);
    setHealth(3);
    setTime(0);
    setIsPaused(false);
    setGameOver(false);
    setGameWon(false);
    setInvincibleTimer(0);
    setElfFound(false);
    setLastFoxSpawnTime(0);
    setParticles([]);
    setShowIntroModal(true);
    setGameStarted(false);

    // Reset refs
    keysRef.current = {};
    lastUpdateRef.current = Date.now();
  }, [mazeSize]);

  // Initialize game objects
  useEffect(() => {
    const openCells = getOpenCells();
    const shuffled = [...openCells].sort(() => Math.random() - 0.5);

    // Place carrots (some golden, some ghost, some life-giving) - scaled for bigger arena
    const newCarrots = shuffled.slice(0, settings.carrots).map((pos, i) => ({
      ...pos,
      id: ++carrotIdRef.current,
      collected: false,
      isGolden: i < 3, // 3 golden carrots
      isGhost: i >= 3 && i < 6, // 3 ghost carrots for invisibility
      isLife: i >= 6 && i < 8, // 2 green life carrots
      respawnProgress: 0,
      respawnTime: 0,
    }));
    setCarrots(newCarrots);

    // Place coins - fewer for performance
    const coinCells = shuffled.slice(settings.carrots, settings.carrots + 20);
    setCoins(coinCells.map(pos => ({ ...pos, collected: false })));

    // Place power pellets in corners
    const pelletPositions = [
      { x: 1.5, z: 1.5 },
      { x: mazeSize - 1.5, z: 1.5 },
      { x: 1.5, z: mazeSize - 1.5 },
      { x: mazeSize - 1.5, z: mazeSize - 1.5 },
    ];
    setPowerPellets(pelletPositions.map(pos => ({ ...pos, collected: false })));

    // Place initial foxes
    const foxCells = shuffled.slice(-settings.foxCount - 5, -5);
    setFoxes(foxCells.map(pos => ({
      id: ++foxIdRef.current,
      x: pos.x,
      z: pos.z,
      rotation: Math.random() * Math.PI * 2,
      active: true,
      respawnTimer: 0,
    })));
  }, [maze, settings, getOpenCells, mazeSize]);

  // Spawn particles
  const spawnParticles = useCallback((x, y, z, color) => {
    setParticles(prev => [...prev, {
      id: ++particleIdRef.current,
      x, y, z, color,
    }]);
  }, []);

  const removeParticle = useCallback((id) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  // Simple wall check - is this cell a wall?
  const isWall = useCallback((cellX, cellZ) => {
    if (cellX < 0 || cellX >= mazeSize || cellZ < 0 || cellZ >= mazeSize) return true;
    return maze[cellZ]?.[cellX] === 1;
  }, [maze, mazeSize]);

  // Check collision - walls 0.7 visual, smaller hitbox for smooth gameplay
  const checkCollision = useCallback((x, z) => {
    const playerRadius = 0.15;  // Smaller = easier to navigate
    const wallHalf = 0.32;      // Slightly smaller than visual for forgiving gameplay

    const cellX = Math.floor(x);
    const cellZ = Math.floor(z);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = cellX + dx;
        const cz = cellZ + dz;

        if (isWall(cx, cz)) {
          const wallX = cx + 0.5;
          const wallZ = cz + 0.5;

          const nearX = Math.max(wallX - wallHalf, Math.min(x, wallX + wallHalf));
          const nearZ = Math.max(wallZ - wallHalf, Math.min(z, wallZ + wallHalf));

          const dx2 = x - nearX;
          const dz2 = z - nearZ;

          if (dx2 * dx2 + dz2 * dz2 < playerRadius * playerRadius) {
            return true;
          }
        }
      }
    }
    return false;
  }, [isWall]);

  // PAC-MAN STYLE movement - STRONG lane centering for easy turning
  const movePlayer = useCallback((currentX, currentZ, moveX, moveZ, delta) => {
    const speed = 7;

    // Get current cell center
    const cellX = Math.floor(currentX);
    const cellZ = Math.floor(currentZ);
    const centerX = cellX + 0.5;
    const centerZ = cellZ + 0.5;

    // Distance from center
    const xOffset = currentX - centerX;
    const zOffset = currentZ - centerZ;

    let newX = currentX;
    let newZ = currentZ;

    // Determine primary direction
    const movingHorizontal = Math.abs(moveX) > Math.abs(moveZ);
    const movingVertical = Math.abs(moveZ) > Math.abs(moveX);

    if (movingHorizontal) {
      // Moving left/right - STRONGLY center on Z axis
      const moveAmount = moveX * speed * delta;

      // Snap Z toward center (fast centering)
      if (Math.abs(zOffset) > 0.02) {
        newZ = centerZ + zOffset * 0.7; // Strong pull to center (keep 70% of offset, lose 30%)
      } else {
        newZ = centerZ; // Snap when very close
      }

      // Try to move in X
      const tryX = currentX + moveAmount;
      if (!checkCollision(tryX, newZ)) {
        newX = tryX;
      } else if (!checkCollision(tryX, centerZ)) {
        // Can move if perfectly centered
        newX = tryX;
        newZ = centerZ;
      }
      // If still blocked, just stay centered (no X movement)
    }
    else if (movingVertical) {
      // Moving up/down - STRONGLY center on X axis
      const moveAmount = moveZ * speed * delta;

      // Snap X toward center (fast centering)
      if (Math.abs(xOffset) > 0.02) {
        newX = centerX + xOffset * 0.7; // Strong pull to center
      } else {
        newX = centerX; // Snap when very close
      }

      // Try to move in Z
      const tryZ = currentZ + moveAmount;
      if (!checkCollision(newX, tryZ)) {
        newZ = tryZ;
      } else if (!checkCollision(centerX, tryZ)) {
        // Can move if perfectly centered
        newX = centerX;
        newZ = tryZ;
      }
      // If still blocked, just stay centered (no Z movement)
    }

    // Final safety check
    if (checkCollision(newX, newZ)) {
      // Try just the centering without movement
      const centeredX = Math.abs(xOffset) < 0.1 ? centerX : currentX;
      const centeredZ = Math.abs(zOffset) < 0.1 ? centerZ : currentZ;
      if (!checkCollision(centeredX, centeredZ)) {
        return [centeredX, centeredZ];
      }
      return [currentX, currentZ];
    }

    return [newX, newZ];
  }, [checkCollision]);

  // Spawn a new fox
  const spawnFox = useCallback(() => {
    if (foxes.filter(f => f.active).length >= MAX_FOXES) return;

    const openCells = getOpenCells();
    // Pick a cell far from player
    const farCells = openCells.filter(cell => {
      const dx = cell.x - playerPos[0];
      const dz = cell.z - playerPos[2];
      return Math.sqrt(dx * dx + dz * dz) > 5;
    });

    if (farCells.length === 0) return;

    const pos = farCells[Math.floor(Math.random() * farCells.length)];
    setFoxes(prev => [...prev, {
      id: ++foxIdRef.current,
      x: pos.x,
      z: pos.z,
      rotation: Math.random() * Math.PI * 2,
      active: true,
      respawnTimer: 0,
    }]);
  }, [foxes, getOpenCells, playerPos]);

  // Game loop - only run when game has started
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const gameLoop = setInterval(() => {
      const now = Date.now();
      const delta = Math.min((now - lastUpdateRef.current) / 1000, 0.05);
      lastUpdateRef.current = now;

      setTime(prev => prev + delta);

      // Update invincibility
      if (invincibleTimer > 0) {
        setInvincibleTimer(prev => Math.max(0, prev - delta));
      }

      // Update power-up timer
      if (isPoweredUp) {
        setPowerUpTimer(prev => {
          const newTimer = prev - delta;
          if (newTimer <= 0) {
            setIsPoweredUp(false);
            return 0;
          }
          return newTimer;
        });
      }

      // Update invisibility timer
      if (isInvisible) {
        setInvisibleTimer(prev => {
          const newTimer = prev - delta;
          if (newTimer <= 0) {
            setIsInvisible(false);
            return 0;
          }
          return newTimer;
        });
      }

      // Handle jump physics
      if (isJumping || jumpHeight > 0) {
        setJumpVelocity(prev => prev - delta * 18); // gravity
        setJumpHeight(prev => {
          const newHeight = Math.max(0, prev + jumpVelocity * delta);
          if (newHeight === 0 && prev > 0) {
            setIsJumping(false);
            setJumpVelocity(0);
          }
          return newHeight;
        });
      }

      // Spawn new foxes over time
      setTime(currentTime => {
        if (currentTime - lastFoxSpawnTime > settings.foxSpawnRate) {
          setLastFoxSpawnTime(currentTime);
          spawnFox();
        }
        return currentTime;
      });

      // Handle carrot respawning
      setCarrots(prev => prev.map(carrot => {
        if (carrot.collected && carrot.respawnTime > 0) {
          const newRespawnTime = carrot.respawnTime - delta;
          if (newRespawnTime <= 0) {
            // Respawn the carrot
            return {
              ...carrot,
              collected: false,
              respawnTime: 0,
              respawnProgress: 0,
            };
          }
          return {
            ...carrot,
            respawnTime: newRespawnTime,
            respawnProgress: 1 - (newRespawnTime / CARROT_RESPAWN_TIME),
          };
        }
        return carrot;
      }));

      // Player movement - PAC-MAN style with lane centering
      const input = getInput();
      const moveX = input.x;
      const moveZ = -input.y;

      const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const isMovingNow = magnitude > 0.1;

      // Handle jump
      if (input.jump && !isJumping && jumpHeight === 0) {
        setIsJumping(true);
        setJumpVelocity(7);
        setActionState('jump', false);
      }

      setIsMoving(isMovingNow);

      if (isMovingNow) {
        setPlayerRotation(Math.atan2(moveX, moveZ));

        setPlayerPos(prev => {
          const [newX, newZ] = movePlayer(prev[0], prev[2], moveX, moveZ, delta);
          return [newX, prev[1], newZ];
        });
      }

      // Update foxes with AI
      setFoxes(prev => prev.map(fox => {
        if (!fox.active) {
          if (fox.respawnTimer > 0) {
            return { ...fox, respawnTimer: fox.respawnTimer - delta };
          }
          // Respawn at random far location
          return { ...fox, active: true, x: mazeSize / 2, z: mazeSize / 2 };
        }

        const dx = playerPos[0] - fox.x;
        const dz = playerPos[2] - fox.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.1) {
          const foxSpeed = settings.foxSpeed * (isPoweredUp ? 0.3 : 1);
          let dirX = dx / dist;
          let dirZ = dz / dist;

          if (isPoweredUp) {
            dirX = -dirX;
            dirZ = -dirZ;
          }

          // Add some randomness for less aggressive pursuit
          dirX += (Math.random() - 0.5) * 0.5;
          dirZ += (Math.random() - 0.5) * 0.5;
          const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
          dirX /= len;
          dirZ /= len;

          let newX = fox.x + dirX * foxSpeed * delta;
          let newZ = fox.z + dirZ * foxSpeed * delta;

          if (checkCollision(newX, fox.z)) {
            newX = fox.x;
            const altDir = Math.random() > 0.5 ? 1 : -1;
            newX = fox.x + altDir * foxSpeed * delta * 0.5;
            if (checkCollision(newX, fox.z)) newX = fox.x;
          }
          if (checkCollision(newX, newZ)) {
            newZ = fox.z;
          }

          const rotation = Math.atan2(newX - fox.x, newZ - fox.z);

          return { ...fox, x: newX, z: newZ, rotation: rotation || fox.rotation };
        }

        return fox;
      }));

      // Check fox collisions
      setFoxes(prev => {
        let playerHit = false;
        const newFoxes = prev.map(fox => {
          if (!fox.active) return fox;

          const dx = playerPos[0] - fox.x;
          const dz = playerPos[2] - fox.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 0.55) {
            // Check if player is jumping over the fox
            if (jumpHeight > 0.5) {
              // Successfully jumped over!
              spawnParticles(fox.x, 0.5, fox.z, '#88ff88');
              setScore(prev => prev + 50);
              return fox; // Fox is fine, player jumped over
            }

            if (isPoweredUp) {
              spawnParticles(fox.x, 0.5, fox.z, '#6666ff');
              setScore(prev => prev + 200);
              return { ...fox, active: false, respawnTimer: 8 };
            } else if (isInvisible) {
              // Fox can't see us, ignore collision
              return fox;
            } else if (invincibleTimer <= 0) {
              playerHit = true;
            }
          }
          return fox;
        });

        if (playerHit) {
          setHealth(prev => {
            const newHealth = prev - 1;
            if (newHealth <= 0) {
              setGameOver(true);
              onDeath?.({ carrotsCollected, coinsCollected, time, score });
            } else {
              // Don't reset position, just give invincibility
              setInvincibleTimer(1.5);
              spawnParticles(playerPos[0], 0.5, playerPos[2], '#ff4444');
            }
            return newHealth;
          });
        }

        return newFoxes;
      });

      // Check carrot collection
      setCarrots(prev => {
        const newCarrots = prev.map(carrot => {
          if (carrot.collected) return carrot;

          const dx = playerPos[0] - carrot.x;
          const dz = playerPos[2] - carrot.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < 0.45) {
            // Life carrot restores health
            if (carrot.isLife) {
              setHealth(prev => Math.min(prev + 1, 3)); // Max 3 health
              spawnParticles(carrot.x, 0.5, carrot.z, '#22ff22');
              setScore(prev => prev + 50);
            } else if (carrot.isGhost) {
              // Ghost carrot gives invisibility
              setIsInvisible(true);
              setInvisibleTimer(INVISIBILITY_DURATION);
              spawnParticles(carrot.x, 0.5, carrot.z, '#00ffff');
              setScore(prev => prev + 25);
            } else {
              spawnParticles(carrot.x, 0.5, carrot.z, carrot.isGolden ? '#ffd700' : '#ff7b00');
              setScore(prev => prev + (carrot.isGolden ? 100 : 10));
            }

            setCarrotsCollected(prev => prev + 1);

            return {
              ...carrot,
              collected: true,
              respawnTime: CARROT_RESPAWN_TIME,
              respawnProgress: 0,
            };
          }
          return carrot;
        });

        return newCarrots;
      });

      // Check coin collection
      setCoins(prev => prev.map(coin => {
        if (coin.collected) return coin;

        const dx = playerPos[0] - coin.x;
        const dz = playerPos[2] - coin.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.4) {
          spawnParticles(coin.x, 0.35, coin.z, '#ffd700');
          setScore(prev => prev + 5);
          setCoinsCollected(prev => prev + 1);
          return { ...coin, collected: true };
        }
        return coin;
      }));

      // Check power pellet collection
      setPowerPellets(prev => prev.map(pellet => {
        if (pellet.collected) return pellet;

        const dx = playerPos[0] - pellet.x;
        const dz = playerPos[2] - pellet.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
          spawnParticles(pellet.x, 0.5, pellet.z, '#ffd700');
          setIsPoweredUp(true);
          setPowerUpTimer(settings.powerUpDuration);
          setScore(prev => prev + 50);
          return { ...pellet, collected: true };
        }
        return pellet;
      }));

      // Check elf collision - win condition!
      if (!elfFound && !gameWon) {
        const dx = playerPos[0] - elfPos[0];
        const dz = playerPos[2] - elfPos[2];
        if (Math.sqrt(dx * dx + dz * dz) < 0.6) {
          setElfFound(true);
          setGameWon(true);
          spawnParticles(elfPos[0], 0.5, elfPos[2], '#88ff88');
          setScore(prev => prev + 500);
          onComplete?.({ carrotsCollected, coinsCollected, time, score: score + 500 });
        }
      }

    }, 1000 / 30); // 30fps for better performance

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, gameWon, isPaused, isPoweredUp, isInvisible, playerPos, maze, settings, checkCollision, movePlayer, spawnParticles, onDeath, onComplete, time, score, invincibleTimer, isJumping, jumpHeight, jumpVelocity, lastFoxSpawnTime, spawnFox, carrotsCollected, coinsCollected, mazeSize, elfPos, elfFound]);

  // Keyboard input for pause only (movement and jump handled by global useGameInput)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') setIsPaused(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatTime = (t) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeFoxCount = foxes.filter(f => f.active).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 100,
    }}>
      <Canvas
        gl={{ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' }}
        dpr={isMobile ? 1 : [1, 1.5]}
      >
        <PerspectiveCamera makeDefault position={[22, 12, 30]} fov={55} />
        <GameScene
          maze={maze}
          mazeSize={mazeSize}
          playerPos={playerPos}
          playerRotation={playerRotation}
          isPoweredUp={isPoweredUp}
          isInvisible={isInvisible}
          jumpHeight={jumpHeight}
          isMoving={isMoving}
          foxes={foxes}
          carrots={carrots}
          coins={coins}
          powerPellets={powerPellets}
          particles={particles}
          onParticleComplete={removeParticle}
          elfPos={elfPos}
          elfFound={elfFound}
        />
      </Canvas>

      {/* HUD */}
      <GameHUD
        collectibles={{ current: carrotsCollected, total: 999 }}
        collectibleIcon="carrot"
        coins={score}
        time={time}
        lives={health}
        maxLives={3}
        isPaused={isPaused}
        onPause={() => setIsPaused(p => !p)}
        onRestart={handleRestart}
        onQuit={onExit}
        realmName="The Burrow"
        currentRealm="rabbit"
      />

      {/* Intro Modal - game paused until dismissed */}
      {showIntroModal && (
        <IntroModal realm="rabbit" onStart={handleStartGame} />
      )}

      {/* Duplicate stats bar removed - GameHUD now handles all stats display */}

      {/* Objective hint */}
      <div style={{
        position: 'fixed',
        top: '130px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '6px 14px',
        background: elfFound ? 'rgba(34, 197, 94, 0.3)' : 'rgba(136, 255, 136, 0.2)',
        borderRadius: '12px',
        color: elfFound ? '#22c55e' : '#88ff88',
        fontSize: '12px',
        zIndex: 1100,
        border: elfFound ? '1px solid #22c55e' : '1px solid rgba(136, 255, 136, 0.4)',
      }}>
        {elfFound ? '[OK] AEIOU Found!' : 'Find AEIOU and the Essence!'}
      </div>

      {/* Controls hint - desktop only */}
      {!isMobile && !showIntroModal && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '8px',
          color: '#888',
          fontSize: '12px',
          zIndex: 1100,
        }}>
          WASD/Arrows: Move | Space: Jump | Find AEIOU and the Essence!
        </div>
      )}

      {/* Mobile controls are now handled globally by GlobalMobileControls in Game.jsx */}

      {/* Power-up timer */}
      {isPoweredUp && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 28px',
          background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
          borderRadius: '25px',
          color: '#000',
          fontWeight: 700,
          fontSize: '18px',
          zIndex: 1100,
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
          animation: 'pulse 0.5s ease-in-out infinite',
        }}>
          POWER UP! {Math.ceil(powerUpTimer)}s
        </div>
      )}

      {/* Invisibility timer */}
      {isInvisible && (
        <div style={{
          position: 'fixed',
          bottom: isPoweredUp ? '150px' : '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 28px',
          background: 'linear-gradient(135deg, #00ffff 0%, #0088aa 100%)',
          borderRadius: '25px',
          color: '#000',
          fontWeight: 700,
          fontSize: '18px',
          zIndex: 1100,
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
          animation: 'pulse 0.5s ease-in-out infinite',
        }}>
          INVISIBLE! {Math.ceil(invisibleTimer)}s
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
          background: 'rgba(0, 0, 0, 0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>
            <svg width="80" height="80" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="9" rx="5" ry="4" fill="#ff6b35" />
              <path d="M4 5 L5 8 L3 5 Z" fill="#ff6b35" />
              <path d="M12 5 L11 8 L13 5 Z" fill="#ff6b35" />
              <circle cx="6" cy="8" r="1" fill="#333" />
              <circle cx="10" cy="8" r="1" fill="#333" />
            </svg>
          </div>
          <h1 style={{ color: '#ef4444', fontSize: '42px', marginBottom: '16px', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
            Caught!
          </h1>
          <div style={{
            display: 'flex',
            gap: '30px',
            marginBottom: '24px',
            fontSize: '24px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff7b00', fontSize: '36px', fontWeight: 700 }}>{carrotsCollected}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Carrots</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffd700', fontSize: '36px', fontWeight: 700 }}>{coinsCollected}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Coins</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '36px', fontWeight: 700 }}>{formatTime(time)}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffd700', fontSize: '36px', fontWeight: 700 }}>{score}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Score</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleRestart}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
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
              onClick={onExit}
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

      {/* Win Screen */}
      {gameWon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <svg width="60" height="60" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="10" rx="3" ry="4" fill="#228B22" />
              <circle cx="8" cy="5" r="2.5" fill="#FDBF6F" />
              <path d="M8 2 L6 5 L10 5 Z" fill="#DC143C" />
            </svg>
            <svg width="40" height="60" viewBox="0 0 16 16" fill="none">
              <rect x="7" y="6" width="2" height="8" fill="#ffd700" />
              <circle cx="8" cy="5" r="3" fill="none" stroke="#ffd700" strokeWidth="2" />
              <rect x="9" y="10" width="3" height="1.5" fill="#ffd700" />
              <rect x="9" y="12" width="2" height="1.5" fill="#ffd700" />
            </svg>
          </div>
          <h1 style={{ color: '#4ade80', fontSize: '42px', marginBottom: '16px', textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}>
            Key Found!
          </h1>
          <p style={{ color: '#888', fontSize: '16px', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
            The Elf has given you the Dimensional Key! You can now mint it as an NFT.
          </p>
          <div style={{
            display: 'flex',
            gap: '30px',
            marginBottom: '24px',
            fontSize: '24px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff7b00', fontSize: '36px', fontWeight: 700 }}>{carrotsCollected}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Carrots</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffd700', fontSize: '36px', fontWeight: 700 }}>{coinsCollected}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Coins</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '36px', fontWeight: 700 }}>{formatTime(time)}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffd700', fontSize: '36px', fontWeight: 700 }}>{score}</div>
              <div style={{ color: '#888', fontSize: '14px' }}>Score</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={onExit}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
              }}
            >
              Mint Key
            </button>
            <button
              onClick={handleRestart}
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
              Play Again
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
