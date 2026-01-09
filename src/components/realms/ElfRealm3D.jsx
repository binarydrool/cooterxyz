"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile, setActionState } from '@/hooks/useGameInput';

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  BEGINNER: { lives: 5, bossHealth: 80, projectileSpeed: 4, gearSpeed: 0.3 },
  EASY: { lives: 4, bossHealth: 100, projectileSpeed: 5, gearSpeed: 0.4 },
  NORMAL: { lives: 3, bossHealth: 120, projectileSpeed: 6, gearSpeed: 0.5 },
  HARD: { lives: 3, bossHealth: 150, projectileSpeed: 7, gearSpeed: 0.6 },
  EXPERT: { lives: 2, bossHealth: 180, projectileSpeed: 8, gearSpeed: 0.7 },
  MASTER: { lives: 2, bossHealth: 200, projectileSpeed: 9, gearSpeed: 0.8 },
  IMPOSSIBLE: { lives: 1, bossHealth: 250, projectileSpeed: 10, gearSpeed: 1.0 },
};

// Input is now handled globally via useGameInput hook

// Generate clocktower structure
function generateClocktower() {
  const platforms = [];
  const gears = [];
  const crystals = [];

  // Base platform
  platforms.push({
    id: 'base',
    position: [0, 0, 0],
    size: [8, 1, 8],
    type: 'stone',
  });

  // Spiral platforms going up the tower
  const levels = 12;
  for (let i = 0; i < levels; i++) {
    const angle = (i / levels) * Math.PI * 4; // 2 full rotations
    const radius = 4 + Math.sin(i * 0.5) * 1;
    const y = 3 + i * 4;

    platforms.push({
      id: `platform-${i}`,
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
      size: [3, 0.5, 3],
      type: i % 3 === 0 ? 'gold' : 'stone',
    });

    // Add gears between platforms
    if (i > 0 && i < levels - 1) {
      gears.push({
        id: `gear-${i}`,
        position: [Math.cos(angle + Math.PI) * 2, y - 1.5, Math.sin(angle + Math.PI) * 2],
        radius: 1.5 + Math.random() * 0.5,
        speed: (Math.random() - 0.5) * 2,
        axis: Math.random() > 0.5 ? 'y' : 'x',
      });
    }

    // Add crystals to collect
    if (i % 2 === 0) {
      crystals.push({
        id: `crystal-${i}`,
        position: [Math.cos(angle) * radius, y + 1.5, Math.sin(angle) * radius],
        collected: false,
        color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'][i % 4],
      });
    }
  }

  // Boss arena at top
  platforms.push({
    id: 'boss-arena',
    position: [0, 52, 0],
    size: [12, 1, 12],
    type: 'boss',
  });

  return { platforms, gears, crystals };
}

// Player character - Elf hero
function Player({ position, rotation, form, isAttacking, isInvincible }) {
  const groupRef = useRef();
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(new THREE.Vector3(...position), 0.15);
      groupRef.current.rotation.y = rotation;
    }
    // Invincibility flash
    if (meshRef.current && isInvincible) {
      meshRef.current.visible = Math.sin(clock.elapsedTime * 20) > 0;
    } else if (meshRef.current) {
      meshRef.current.visible = true;
    }
  });

  const tunicColor = isAttacking ? '#8B0000' : '#2E8B57';

  return (
    <group ref={groupRef} position={position}>
      {/* Body/Tunic */}
      <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 12]} />
        <meshStandardMaterial color={tunicColor} roughness={0.7} />
      </mesh>

      {/* Tunic skirt */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <coneGeometry args={[0.35, 0.4, 8]} />
        <meshStandardMaterial color={tunicColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#FDBF6F" roughness={0.8} />
      </mesh>

      {/* Pointy elf ears */}
      <mesh position={[-0.22, 1.0, 0]} rotation={[0, 0, -0.8]} castShadow>
        <coneGeometry args={[0.06, 0.2, 4]} />
        <meshStandardMaterial color="#FDBF6F" roughness={0.8} />
      </mesh>
      <mesh position={[0.22, 1.0, 0]} rotation={[0, 0, 0.8]} castShadow>
        <coneGeometry args={[0.06, 0.2, 4]} />
        <meshStandardMaterial color="#FDBF6F" roughness={0.8} />
      </mesh>

      {/* Pointy elf hat */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.18, 0.5, 8]} />
        <meshStandardMaterial color="#228B22" roughness={0.6} />
      </mesh>

      {/* Hat tip ball */}
      <mesh position={[0.15, 1.55, 0.1]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>

      {/* Eyes - bright green elf eyes */}
      <mesh position={[-0.07, 1.02, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh position={[0.07, 1.02, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      {/* Belt buckle */}
      <mesh position={[0, 0.35, 0.28]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.35, 0.6, 0]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color="#FDBF6F" roughness={0.8} />
      </mesh>
      <mesh position={[0.35, 0.6, 0]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color="#FDBF6F" roughness={0.8} />
      </mesh>

      {/* Sword when attacking */}
      {isAttacking && (
        <group position={[0.45, 0.7, 0.2]} rotation={[0.3, 0, -0.7]}>
          {/* Blade */}
          <mesh>
            <boxGeometry args={[0.06, 0.9, 0.02]} />
            <meshStandardMaterial color="#E8E8E8" metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Hilt */}
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[0.2, 0.08, 0.05]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          {/* Pommel */}
          <mesh position={[0, -0.55, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Elf magic glow */}
      <pointLight position={[0, 0.8, 0]} color="#00ff88" intensity={0.5} distance={3} />
    </group>
  );
}

// Sun Boss - fiery solar entity
function SunBoss({ position, health, maxHealth, phase, isVulnerable }) {
  const groupRef = useRef();
  const raysRef = useRef();
  const [hover, setHover] = useState(0);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Hovering animation
      setHover(Math.sin(clock.elapsedTime * 2) * 0.3);
      groupRef.current.position.y = position[1] + hover;

      // Spin when attacking - faster as health decreases
      const spinSpeed = 0.3 + (1 - health / maxHealth) * 0.5;
      groupRef.current.rotation.y = clock.elapsedTime * spinSpeed;
    }
    // Animate sun rays
    if (raysRef.current) {
      raysRef.current.rotation.z = clock.elapsedTime * 0.5;
    }
  });

  const healthPercent = health / maxHealth;
  // Sun color changes from bright yellow to angry red as health decreases
  const coreColor = isVulnerable ? '#ff0000' :
    healthPercent > 0.6 ? '#FFD700' :
    healthPercent > 0.3 ? '#FF8C00' : '#FF4500';
  const glowColor = isVulnerable ? '#ff6666' :
    healthPercent > 0.6 ? '#FFFF00' :
    healthPercent > 0.3 ? '#FFA500' : '#FF6347';

  return (
    <group ref={groupRef} position={position}>
      {/* Core sun sphere */}
      <mesh castShadow>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color={coreColor} />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.4} />
      </mesh>

      {/* Outer corona */}
      <mesh>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.15} />
      </mesh>

      {/* Sun rays */}
      <group ref={raysRef}>
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0]}
              rotation={[0, 0, angle]}
            >
              <coneGeometry args={[0.2, 0.8, 4]} />
              <meshBasicMaterial color={glowColor} transparent opacity={0.7} />
            </mesh>
          );
        })}
      </group>

      {/* Angry face when damaged */}
      {healthPercent < 0.7 && (
        <>
          {/* Eyes */}
          <mesh position={[-0.35, 0.2, 1.1]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshBasicMaterial color={isVulnerable ? "#ffffff" : "#000000"} />
          </mesh>
          <mesh position={[0.35, 0.2, 1.1]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshBasicMaterial color={isVulnerable ? "#ffffff" : "#000000"} />
          </mesh>
          {/* Angry mouth */}
          <mesh position={[0, -0.3, 1.0]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.25, 0.05, 8, 12, Math.PI]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </>
      )}

      {/* Vulnerable indicator - cracks showing */}
      {isVulnerable && (
        <mesh>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshBasicMaterial color="#ff0000" wireframe />
        </mesh>
      )}

      {/* Boss aura light */}
      <pointLight position={[0, 0, 0]} color={coreColor} intensity={3} distance={15} />

      {/* Health bar above boss */}
      <group position={[0, 3, 0]}>
        {/* Background */}
        <mesh>
          <boxGeometry args={[2.5, 0.3, 0.1]} />
          <meshBasicMaterial color="#333" />
        </mesh>
        {/* Health */}
        <mesh position={[(healthPercent - 1) * 1.15, 0, 0.06]}>
          <boxGeometry args={[2.3 * healthPercent, 0.25, 0.1]} />
          <meshBasicMaterial color={healthPercent > 0.5 ? "#FFD700" : healthPercent > 0.25 ? "#FF8C00" : "#FF4500"} />
        </mesh>
      </group>
    </group>
  );
}

// Boss projectile
function Projectile({ projectile }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...projectile.position);
      meshRef.current.rotation.x += 0.1;
      meshRef.current.rotation.z += 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={projectile.position}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshBasicMaterial color={projectile.color || "#ff00ff"} />
    </mesh>
  );
}

// Platform
function Platform({ platform }) {
  const colors = {
    stone: '#666666',
    gold: '#ffd700',
    boss: '#4a0080',
  };

  return (
    <mesh position={platform.position} castShadow receiveShadow>
      <boxGeometry args={platform.size} />
      <meshStandardMaterial
        color={colors[platform.type] || '#888888'}
        roughness={platform.type === 'gold' ? 0.3 : 0.8}
        metalness={platform.type === 'gold' ? 0.8 : 0.1}
      />
    </mesh>
  );
}

// Rotating gear
function Gear({ gear, gearSpeedMult }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const speed = gear.speed * gearSpeedMult;
      if (gear.axis === 'y') {
        meshRef.current.rotation.y = clock.elapsedTime * speed;
      } else {
        meshRef.current.rotation.x = clock.elapsedTime * speed;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={gear.position} castShadow>
      <torusGeometry args={[gear.radius, 0.2, 8, 24]} />
      <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

// Crystal collectible
function Crystal({ crystal, onCollect }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current && !crystal.collected) {
      meshRef.current.rotation.y = clock.elapsedTime * 2;
      meshRef.current.position.y = crystal.position[1] + Math.sin(clock.elapsedTime * 3) * 0.2;
    }
  });

  if (crystal.collected) return null;

  return (
    <mesh ref={meshRef} position={crystal.position}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshBasicMaterial color={crystal.color} transparent opacity={0.8} />
      <pointLight color={crystal.color} intensity={1} distance={3} />
    </mesh>
  );
}

// Clocktower environment
function Clocktower({ towerData, playerPosition, gearSpeedMult }) {
  const { platforms, gears, crystals } = towerData;

  return (
    <>
      {/* Tower walls */}
      <mesh position={[0, 30, -8]} receiveShadow>
        <boxGeometry args={[20, 70, 1]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
      </mesh>

      {/* Giant clock face on wall */}
      <group position={[0, 45, -7.4]}>
        <mesh>
          <circleGeometry args={[6, 32]} />
          <meshStandardMaterial color="#1a1a2a" />
        </mesh>
        {/* Clock markings */}
        {[...Array(12)].map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 5, Math.cos(i * Math.PI / 6) * 5, 0.1]}>
            <boxGeometry args={[0.3, 0.8, 0.1]} />
            <meshBasicMaterial color="#ffd700" />
          </mesh>
        ))}
      </group>

      {/* Platforms */}
      {platforms.map(platform => (
        <Platform key={platform.id} platform={platform} />
      ))}

      {/* Gears */}
      {gears.map(gear => (
        <Gear key={gear.id} gear={gear} gearSpeedMult={gearSpeedMult} />
      ))}

      {/* Crystals */}
      {crystals.map(crystal => (
        <Crystal key={crystal.id} crystal={crystal} />
      ))}
    </>
  );
}

// Camera controller
function CameraController({ target, bossMode }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (bossMode) {
      // Fixed camera for boss fight
      targetPos.current.set(target[0], target[1] + 8, target[2] + 15);
    } else {
      // Follow camera during climb
      targetPos.current.set(target[0], target[1] + 4, target[2] + 10);
    }

    camera.position.lerp(targetPos.current, 0.05);
    camera.lookAt(target[0], target[1] + 1, target[2]);
  });

  return null;
}

// Sky
function TowerSky() {
  return (
    <mesh>
      <sphereGeometry args={[150, 32, 32]} />
      <meshBasicMaterial color="#0a0a20" side={THREE.BackSide} />
    </mesh>
  );
}

// Game Scene
function GameScene({ towerData, playerState, bossState, projectiles, gearSpeedMult }) {
  return (
    <>
      <TowerSky />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 50, 10]} intensity={0.5} color="#aabbff" castShadow />
      <pointLight position={[0, 60, 0]} color="#ffd700" intensity={1} distance={80} />

      {/* Fog */}
      <fog attach="fog" args={['#0a0a20', 20, 100]} />

      {/* Clocktower */}
      <Clocktower towerData={towerData} playerPosition={playerState?.position} gearSpeedMult={gearSpeedMult} />

      {/* Player */}
      {playerState && (
        <Player
          position={playerState.position}
          rotation={playerState.rotation}
          form={playerState.form}
          isAttacking={playerState.isAttacking}
          isInvincible={playerState.invincible > 0}
        />
      )}

      {/* Boss */}
      {bossState && bossState.active && (
        <SunBoss
          position={bossState.position}
          health={bossState.health}
          maxHealth={bossState.maxHealth}
          phase={bossState.phase}
          isVulnerable={bossState.vulnerable}
        />
      )}

      {/* Projectiles */}
      {projectiles.map((proj, i) => (
        <Projectile key={i} projectile={proj} />
      ))}

      {/* Camera */}
      {playerState && (
        <CameraController target={playerState.position} bossMode={bossState?.active} />
      )}
    </>
  );
}

// Main component
export default function ElfRealm3D({
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
  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [totalCrystals, setTotalCrystals] = useState(0);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [warning, setWarning] = useState('');
  const [bossActive, setBossActive] = useState(false);

  const towerDataRef = useRef(null);
  const playerRef = useRef({
    position: [0, 1.5, 0],
    velocity: [0, 0, 0],
    rotation: 0,
    onGround: true,
    isAttacking: false,
    attackCooldown: 0,
    invincible: 0,
    form: 'hero',
  });
  const bossRef = useRef({
    active: false,
    position: [0, 54, 0],
    health: 100,
    maxHealth: 100,
    phase: 0,
    attackTimer: 0,
    vulnerable: false,
    vulnerableTimer: 0,
  });
  const projectilesRef = useRef([]);

  const [playerState, setPlayerState] = useState(null);
  const [bossState, setBossState] = useState(null);
  const [projectiles, setProjectiles] = useState([]);

  const isMobile = useIsMobile();
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;

  // Mobile input now handled globally by useGameInput

  // Initialize
  useEffect(() => {
    const tower = generateClocktower();
    towerDataRef.current = tower;
    setTotalCrystals(tower.crystals.length);

    bossRef.current = {
      active: false,
      position: [0, 54, 0],
      health: settings.bossHealth,
      maxHealth: settings.bossHealth,
      phase: 0,
      attackTimer: 0,
      vulnerable: false,
      vulnerableTimer: 0,
    };

    playerRef.current = {
      position: [0, 1.5, 0],
      velocity: [0, 0, 0],
      rotation: 0,
      onGround: true,
      isAttacking: false,
      attackCooldown: 0,
      invincible: 0,
      form: 'hero',
    };

    setPlayerState({ ...playerRef.current });
    setBossState({ ...bossRef.current });
    setLives(settings.lives);
    setScore(0);
    setTime(0);
    setCrystalsCollected(0);
    projectilesRef.current = [];
    setProjectiles([]);
    setBossActive(false);
    setGameState('playing');
  }, [difficulty, settings.bossHealth, settings.lives]);

  // Handle start game from intro modal
  const handleStartGame = useCallback(() => {
    setShowIntroModal(false);
    setGameStarted(true);
  }, []);

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

    const update = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!towerDataRef.current) {
        animationId = requestAnimationFrame(update);
        return;
      }

      const player = playerRef.current;
      const boss = bossRef.current;
      const tower = towerDataRef.current;

      const gravity = 25;
      const moveSpeed = 8;
      const jumpForce = 15;
      const turnSpeed = 5;

      // Get input from global system
      const input = getInput();

      // Update invincibility
      if (player.invincible > 0) {
        player.invincible -= dt;
      }

      // Update attack cooldown
      if (player.attackCooldown > 0) {
        player.attackCooldown -= dt;
        if (player.attackCooldown <= 0.3) {
          player.isAttacking = false;
        }
      }

      // Attack (action button)
      if (input.action && player.attackCooldown <= 0) {
        player.isAttacking = true;
        player.attackCooldown = 0.5;
      }

      // Rotation based on x axis
      if (input.x < -0.3) player.rotation += turnSpeed * dt;
      if (input.x > 0.3) player.rotation -= turnSpeed * dt;

      // Movement based on y axis
      let moveForward = 0;
      if (input.y > 0.3) moveForward = moveSpeed;
      if (input.y < -0.3) moveForward = -moveSpeed * 0.5;

      player.velocity[0] = Math.sin(player.rotation) * moveForward;
      player.velocity[2] = Math.cos(player.rotation) * moveForward;

      // Jump
      if (input.jump && player.onGround) {
        player.velocity[1] = jumpForce;
        player.onGround = false;
        setActionState('jump', false); // Reset jump state
      }

      // Gravity
      player.velocity[1] -= gravity * dt;

      // Apply velocity
      player.position[0] += player.velocity[0] * dt;
      player.position[1] += player.velocity[1] * dt;
      player.position[2] += player.velocity[2] * dt;

      // Platform collision
      player.onGround = false;
      for (const platform of tower.platforms) {
        const px = platform.position[0];
        const py = platform.position[1];
        const pz = platform.position[2];
        const hw = platform.size[0] / 2;
        const hh = platform.size[1] / 2;
        const hd = platform.size[2] / 2;

        if (
          player.position[0] > px - hw && player.position[0] < px + hw &&
          player.position[2] > pz - hd && player.position[2] < pz + hd &&
          player.position[1] > py + hh - 0.5 && player.position[1] < py + hh + 1 &&
          player.velocity[1] <= 0
        ) {
          player.position[1] = py + hh + 0.5;
          player.velocity[1] = 0;
          player.onGround = true;
        }
      }

      // Fall death
      if (player.position[1] < -10) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('lost');
          } else {
            // Respawn at last safe platform
            player.position = [0, 1.5, 0];
            player.velocity = [0, 0, 0];
            player.invincible = 2;
          }
          return newLives;
        });
      }

      // Boundary
      const maxRadius = 10;
      const dist = Math.sqrt(player.position[0] ** 2 + player.position[2] ** 2);
      if (dist > maxRadius) {
        const angle = Math.atan2(player.position[0], player.position[2]);
        player.position[0] = Math.sin(angle) * maxRadius;
        player.position[2] = Math.cos(angle) * maxRadius;
      }

      // Crystal collection
      tower.crystals.forEach(crystal => {
        if (crystal.collected) return;
        const dx = player.position[0] - crystal.position[0];
        const dy = player.position[1] - crystal.position[1];
        const dz = player.position[2] - crystal.position[2];
        const cdist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (cdist < 1.5) {
          crystal.collected = true;
          setCrystalsCollected(c => c + 1);
          setScore(s => s + 100);
        }
      });

      // Check if reached boss arena
      if (player.position[1] > 50 && !boss.active) {
        boss.active = true;
        setBossActive(true);
        setWarning("THE SUN BOSS AWAKENS!");
        setTimeout(() => setWarning(""), 3000);
      }

      // Boss AI
      if (boss.active && boss.health > 0) {
        boss.attackTimer -= dt;

        // Update vulnerable timer
        if (boss.vulnerable) {
          boss.vulnerableTimer -= dt;
          if (boss.vulnerableTimer <= 0) {
            boss.vulnerable = false;
          }
        }

        // Boss attack patterns
        if (boss.attackTimer <= 0 && !boss.vulnerable) {
          const pattern = Math.floor(Math.random() * 3);

          if (pattern === 0) {
            // Spiral projectiles
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              projectilesRef.current.push({
                position: [...boss.position],
                velocity: [Math.sin(angle) * settings.projectileSpeed, 0, Math.cos(angle) * settings.projectileSpeed],
                color: '#ff00ff',
              });
            }
          } else if (pattern === 1) {
            // Aimed shot at player
            const dx = player.position[0] - boss.position[0];
            const dy = player.position[1] - boss.position[1];
            const dz = player.position[2] - boss.position[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            projectilesRef.current.push({
              position: [...boss.position],
              velocity: [(dx / dist) * settings.projectileSpeed * 1.5, (dy / dist) * settings.projectileSpeed, (dz / dist) * settings.projectileSpeed * 1.5],
              color: '#00ffff',
            });
          } else {
            // Become vulnerable briefly
            boss.vulnerable = true;
            boss.vulnerableTimer = 2;
            setWarning("STRIKE NOW!");
            setTimeout(() => setWarning(""), 1500);
          }

          boss.attackTimer = 2 - (boss.phase * 0.3);
          boss.phase = Math.floor((1 - boss.health / boss.maxHealth) * 3);
        }

        // Check player attack on boss
        if (player.isAttacking && boss.vulnerable) {
          const dx = player.position[0] - boss.position[0];
          const dy = player.position[1] - boss.position[1];
          const dz = player.position[2] - boss.position[2];
          const distToBoss = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distToBoss < 3) {
            boss.health -= 20;
            boss.vulnerable = false;
            setScore(s => s + 200);
            player.attackCooldown = 1; // Longer cooldown after hit

            if (boss.health <= 0) {
              setGameState('won');
            }
          }
        }
      }

      // Update projectiles
      projectilesRef.current = projectilesRef.current.filter(proj => {
        proj.position[0] += proj.velocity[0] * dt;
        proj.position[1] += proj.velocity[1] * dt;
        proj.position[2] += proj.velocity[2] * dt;

        // Check collision with player
        if (player.invincible <= 0) {
          const dx = player.position[0] - proj.position[0];
          const dy = player.position[1] - proj.position[1];
          const dz = player.position[2] - proj.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 1) {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState('lost');
              }
              return newLives;
            });
            player.invincible = 2;
            return false;
          }
        }

        // Remove if too far
        const distFromCenter = Math.sqrt(proj.position[0] ** 2 + proj.position[2] ** 2);
        return distFromCenter < 30 && Math.abs(proj.position[1] - 54) < 20;
      });

      setPlayerState({ ...player });
      setBossState({ ...boss });
      setProjectiles([...projectilesRef.current]);
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, gameState, settings.projectileSpeed]);

  const handlePause = useCallback(() => {
    setGameState(gs => gs === 'playing' ? 'paused' : 'playing');
  }, []);

  const handleRestart = useCallback(() => {
    const tower = generateClocktower();
    towerDataRef.current = tower;

    bossRef.current = {
      active: false,
      position: [0, 54, 0],
      health: settings.bossHealth,
      maxHealth: settings.bossHealth,
      phase: 0,
      attackTimer: 0,
      vulnerable: false,
      vulnerableTimer: 0,
    };

    playerRef.current = {
      position: [0, 1.5, 0],
      velocity: [0, 0, 0],
      rotation: 0,
      onGround: true,
      isAttacking: false,
      attackCooldown: 0,
      invincible: 0,
      form: 'hero',
    };

    projectilesRef.current = [];
    setPlayerState({ ...playerRef.current });
    setBossState({ ...bossRef.current });
    setProjectiles([]);
    setLives(settings.lives);
    setScore(0);
    setTime(0);
    setCrystalsCollected(0);
    setBossActive(false);
    setWarning('');
    setShowIntroModal(true);
    setGameStarted(false);
    setGameState('playing');
  }, [settings.bossHealth, settings.lives]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      const timeBonus = Math.max(0, 600 - time) * 5;
      const livesBonus = lives * 500;
      const crystalBonus = crystalsCollected * 100;
      const finalScore = score + timeBonus + livesBonus + crystalBonus;
      onComplete({ score: finalScore, time, difficulty, lives, crystals: crystalsCollected });
    }
  }, [onComplete, difficulty, score, time, lives, crystalsCollected]);

  const handleQuit = onQuit || onExit;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a20', zIndex: 100 }}>
      <GameHUD
        freeMode={freeMode}
        onToggleFreeMode={onToggleFreeMode}
        collectibles={{ current: crystalsCollected, total: totalCrystals }}
        collectibleIcon="crystal"
        coins={score}
        time={time}
        lives={lives}
        maxLives={settings.lives}
        isPaused={gameState === 'paused'}
        onPause={handlePause}
        onRestart={handleRestart}
        onQuit={handleQuit}
        realmName="Eternal Clocktower"
        currentRealm="rabbit"
        onNavigateRealm={onNavigateRealm}
      />

      {/* Intro Modal - game paused until dismissed */}
      {showIntroModal && <IntroModal realm="elf" onStart={handleStartGame} />}

      {/* Warning display */}
      {warning && !showIntroModal && (
        <div style={{
          position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
          padding: '12px 28px', background: 'rgba(255, 215, 0, 0.9)', borderRadius: '12px',
          color: '#000', fontSize: '20px', fontWeight: 'bold', border: '2px solid #ffd700',
          zIndex: 1100, animation: 'pulse 0.5s infinite',
        }}>
          {warning}
        </div>
      )}

      {/* Boss health bar (big) */}
      {bossActive && bossState && bossState.health > 0 && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          width: '400px', zIndex: 1100,
        }}>
          <div style={{ color: '#ffd700', fontSize: '14px', textAlign: 'center', marginBottom: '4px' }}>
            SUN BOSS
          </div>
          <div style={{
            width: '100%', height: '20px', background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '10px', border: '2px solid #ffd700', overflow: 'hidden',
          }}>
            <div style={{
              width: `${(bossState.health / bossState.maxHealth) * 100}%`,
              height: '100%',
              background: bossState.health > bossState.maxHealth * 0.5 ? '#00ff00' :
                bossState.health > bossState.maxHealth * 0.25 ? '#ffff00' : '#ff0000',
              transition: 'width 0.3s',
            }} />
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
          WASD: Move | SPACE: Jump | E: Attack | Climb the tower!
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        }
      `}</style>

      <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: 0 }}>
        <Canvas
          shadows={!isMobile}
          camera={{ fov: 60 }}
          gl={{ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' }}
          dpr={isMobile ? 1 : [1, 1.5]}
        >
          {towerDataRef.current && (
            <GameScene
              towerData={towerDataRef.current}
              playerState={playerState}
              bossState={bossState}
              projectiles={projectiles}
              gearSpeedMult={settings.gearSpeed}
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
            background: 'linear-gradient(180deg, #2a1a4a 0%, #0a0a20 100%)',
            borderRadius: '12px', padding: '40px', textAlign: 'center', minWidth: '320px',
            border: '2px solid #ffd700',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <svg width="64" height="64" viewBox="0 0 16 16" fill="none">
                <path d="M2 10 L4 4 L8 8 L12 4 L14 10 L2 10 Z" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5" />
                <rect x="2" y="10" width="12" height="3" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5" />
                <circle cx="4" cy="4" r="1" fill="#ff0000" />
                <circle cx="8" cy="8" r="1" fill="#00ff00" />
                <circle cx="12" cy="4" r="1" fill="#0000ff" />
              </svg>
            </div>
            <h2 style={{ color: '#ffd700', fontSize: '32px', marginBottom: '24px' }}>
              VICTORY!
            </h2>
            <div style={{ color: '#aaa', fontSize: '16px', marginBottom: '8px' }}>
              You defeated the Sun Boss!
            </div>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.8 }}>
              <div>Score: <span style={{ color: '#ffd700' }}>{score}</span></div>
              <div>Time: <span style={{ color: '#fff' }}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span></div>
              <div>Crystals: <span style={{ color: '#00ffff' }}>{crystalsCollected}/{totalCrystals}</span></div>
              <div>Lives: <span style={{ color: '#4ade80' }}>{lives}/{settings.lives}</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleRestart} style={{
                padding: '12px 24px', background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                color: '#fff', fontSize: '14px', cursor: 'pointer',
              }}>Play Again</button>
              {!freeMode && (
                <button onClick={handleComplete} style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                  border: 'none', borderRadius: '6px',
                  color: '#000', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>Claim Victory Crown</button>
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
                <ellipse cx="8" cy="8" rx="6" ry="6" fill="#f5f5f5" />
                <ellipse cx="5" cy="6" rx="2" ry="2.5" fill="#1a1a1a" />
                <ellipse cx="11" cy="6" rx="2" ry="2.5" fill="#1a1a1a" />
                <ellipse cx="8" cy="10" rx="1" ry="1.5" fill="#1a1a1a" />
                <rect x="5" y="12" width="1" height="2" fill="#f5f5f5" />
                <rect x="7.5" y="12" width="1" height="2" fill="#f5f5f5" />
                <rect x="10" y="12" width="1" height="2" fill="#f5f5f5" />
              </svg>
            </div>
            <h2 style={{ color: '#8B0000', fontSize: '28px', marginBottom: '24px' }}>
              Defeated
            </h2>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              The Sun Boss proved too powerful...
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
