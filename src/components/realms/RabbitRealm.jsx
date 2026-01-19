"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile, setActionState } from '@/hooks/useGameInput';
import { useAudio, SOUNDS } from '@/hooks/useAudio';
import { useInventory } from '@/hooks/useInventory';

// Difficulty settings - maze size and speed scale with difficulty
const DIFFICULTY_SETTINGS = {
  beginner: { foxCount: 1, foxSpeed: 1.0, powerUpDuration: 20, carrots: 15, foxSpawnRate: 90, mazeSize: 21 },
  easy: { foxCount: 2, foxSpeed: 1.2, powerUpDuration: 18, carrots: 20, foxSpawnRate: 80, mazeSize: 23 },
  normal: { foxCount: 2, foxSpeed: 1.4, powerUpDuration: 15, carrots: 25, foxSpawnRate: 70, mazeSize: 25 },
  hard: { foxCount: 3, foxSpeed: 1.6, powerUpDuration: 12, carrots: 30, foxSpawnRate: 60, mazeSize: 29 },
  expert: { foxCount: 3, foxSpeed: 1.8, powerUpDuration: 10, carrots: 35, foxSpawnRate: 50, mazeSize: 33 },
  master: { foxCount: 4, foxSpeed: 2.0, powerUpDuration: 8, carrots: 40, foxSpawnRate: 45, mazeSize: 37 },
  impossible: { foxCount: 5, foxSpeed: 2.5, powerUpDuration: 6, carrots: 45, foxSpawnRate: 40, mazeSize: 41 },
};

// Carrot respawn delay in seconds
const CARROT_RESPAWN_TIME = 8;
const INVISIBILITY_DURATION = 5;
const MAX_FOXES = 5; // Matches impossible difficulty

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

  // Add extra paths for easier navigation - more openings for wider corridors
  for (let i = 0; i < width * height / 4; i++) {
    const x = 1 + Math.floor(Math.random() * (width - 2));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    maze[y][x] = 0;
  }

  // Create wider corridors by removing walls next to paths
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (maze[y][x] === 0) {
        // 30% chance to widen corridor
        if (Math.random() < 0.3) {
          const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          const dir = dirs[Math.floor(Math.random() * dirs.length)];
          const nx = x + dir[0];
          const ny = y + dir[1];
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            maze[ny][nx] = 0;
          }
        }
      }
    }
  }

  return maze;
}

// Glowing Autumn Wall Instances - 3D Pac-Man style with neon borders
function HayBaleInstances({ maze, mazeSize }) {
  const meshRef = useRef();
  const topGlowRef = useRef();
  const borderRef = useRef();
  const innerGlowRef = useRef();

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
          // Main wall block
          tempObject.position.set(x + 0.5, 0.4, y + 0.5);
          tempObject.rotation.set(0, 0, 0);
          tempObject.scale.set(0.92, 0.8, 0.92);
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(i, tempObject.matrix);

          // Top glow accent
          if (topGlowRef.current) {
            tempObject.position.set(x + 0.5, 0.82, y + 0.5);
            tempObject.scale.set(0.88, 0.04, 0.88);
            tempObject.updateMatrix();
            topGlowRef.current.setMatrixAt(i, tempObject.matrix);
          }

          // Glowing border at base
          if (borderRef.current) {
            tempObject.position.set(x + 0.5, 0.02, y + 0.5);
            tempObject.scale.set(0.96, 0.04, 0.96);
            tempObject.updateMatrix();
            borderRef.current.setMatrixAt(i, tempObject.matrix);
          }

          // Inner glow core
          if (innerGlowRef.current) {
            tempObject.position.set(x + 0.5, 0.4, y + 0.5);
            tempObject.scale.set(0.85, 0.75, 0.85);
            tempObject.updateMatrix();
            innerGlowRef.current.setMatrixAt(i, tempObject.matrix);
          }

          i++;
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (topGlowRef.current) topGlowRef.current.instanceMatrix.needsUpdate = true;
    if (borderRef.current) borderRef.current.instanceMatrix.needsUpdate = true;
    if (innerGlowRef.current) innerGlowRef.current.instanceMatrix.needsUpdate = true;
  }, [maze, mazeSize]);

  if (count === 0) return null;

  return (
    <group>
      {/* Main wall body - warm amber with glow */}
      <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#B8860B"
          emissive="#FF6600"
          emissiveIntensity={0.25}
          metalness={0.3}
          roughness={0.5}
        />
      </instancedMesh>
      {/* Top glow accent - bright orange */}
      <instancedMesh ref={topGlowRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FF8C00"
          emissiveIntensity={0.8}
          transparent
          opacity={0.95}
        />
      </instancedMesh>
      {/* Base border glow - neon orange outline */}
      <instancedMesh ref={borderRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF6600"
          emissiveIntensity={1.2}
        />
      </instancedMesh>
      {/* Inner glow core for depth */}
      <instancedMesh ref={innerGlowRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#8B4513"
          emissive="#D2691E"
          emissiveIntensity={0.15}
          metalness={0.1}
          roughness={0.7}
        />
      </instancedMesh>
    </group>
  );
}

// Corn stalk decoration - tall autumn corn with dried leaves
function CornStalk({ position }) {
  return (
    <group position={position}>
      {/* Main stalk */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 1.4, 6]} />
        <meshBasicMaterial color="#8B7355" />
      </mesh>
      {/* Dried leaves - autumn brown/tan colors */}
      <mesh position={[-0.2, 0.4, 0]} rotation={[0.3, 0, -0.6]}>
        <boxGeometry args={[0.35, 0.02, 0.1]} />
        <meshBasicMaterial color="#C4A35A" />
      </mesh>
      <mesh position={[0.18, 0.55, 0]} rotation={[-0.2, 0, 0.5]}>
        <boxGeometry args={[0.32, 0.02, 0.09]} />
        <meshBasicMaterial color="#B8956E" />
      </mesh>
      <mesh position={[-0.15, 0.75, 0.05]} rotation={[0.4, 0.2, -0.4]}>
        <boxGeometry args={[0.28, 0.02, 0.08]} />
        <meshBasicMaterial color="#D4B483" />
      </mesh>
      <mesh position={[0.12, 0.9, -0.03]} rotation={[-0.3, -0.1, 0.3]}>
        <boxGeometry args={[0.25, 0.02, 0.07]} />
        <meshBasicMaterial color="#BFA76F" />
      </mesh>
      {/* Corn cob with husk */}
      <mesh position={[0.1, 0.5, 0.06]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.05, 0.15, 4, 8]} />
        <meshBasicMaterial color="#F5D76E" />
      </mesh>
      {/* Husk wrapper */}
      <mesh position={[0.12, 0.45, 0.08]} rotation={[0.1, 0, 0.4]}>
        <boxGeometry args={[0.08, 0.18, 0.04]} />
        <meshBasicMaterial color="#C9B896" />
      </mesh>
      {/* Corn silk (dried) */}
      <mesh position={[0.08, 0.62, 0.06]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshBasicMaterial color="#8B6914" />
      </mesh>
    </group>
  );
}

// Gourd - smaller squash-like decoration
function Gourd({ position, color = '#E07020' }) {
  return (
    <group position={position}>
      <mesh scale={[0.6, 0.8, 0.6]} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.15, 6, 5]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.06, 4]} />
        <meshBasicMaterial color="#4A3728" />
      </mesh>
    </group>
  );
}

// Fallen leaf - flat autumn leaf
function FallenLeaf({ position, color, rotation }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]}>
      <circleGeometry args={[0.08, 5]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

// Detailed pumpkin - with ribs and varied colors
function Pumpkin({ position, scale = 0.3 }) {
  const hue = useMemo(() => 20 + Math.random() * 20, []);
  const color = `hsl(${hue}, 85%, 45%)`;
  const darkColor = `hsl(${hue}, 85%, 35%)`;
  return (
    <group position={position} scale={scale}>
      {/* Main body */}
      <mesh scale={[1, 0.75, 1]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Ribs - give pumpkin texture */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.sin(i * Math.PI / 3) * 0.85, 0, Math.cos(i * Math.PI / 3) * 0.85]} scale={[0.25, 0.65, 0.25]}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color={darkColor} />
        </mesh>
      ))}
      {/* Stem */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 0.35, 5]} />
        <meshBasicMaterial color="#5D4E37" />
      </mesh>
      {/* Curly vine */}
      <mesh position={[0.15, 0.75, 0]} rotation={[0, 0, 0.5]}>
        <torusGeometry args={[0.08, 0.02, 4, 8, Math.PI]} />
        <meshBasicMaterial color="#4A7023" />
      </mesh>
    </group>
  );
}

// Autumn ground - brown/tan with fallen leaves scattered
function AutumnGround({ size }) {
  const leaves = useMemo(() => {
    const leafColors = ['#C75D2C', '#E6A623', '#8B4513', '#D2691E', '#B22222', '#CD853F', '#DAA520'];
    const scattered = [];
    // Scatter leaves throughout the ground
    for (let i = 0; i < 150; i++) {
      scattered.push({
        x: Math.random() * (size + 30) - 15,
        z: Math.random() * (size + 30) - 15,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.5,
      });
    }
    return scattered;
  }, [size]);

  return (
    <group>
      {/* Base ground - autumn grass color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size/2, -0.01, size/2]}>
        <planeGeometry args={[size + 40, size + 40]} />
        <meshBasicMaterial color="#7A8B4A" />
      </mesh>
      {/* Dirt patches */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size/2, 0, size/2]}>
        <planeGeometry args={[size + 35, size + 35]} />
        <meshBasicMaterial color="#8B7355" transparent opacity={0.3} />
      </mesh>
      {/* Scattered fallen leaves */}
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          position={[leaf.x, 0.02, leaf.z]}
          rotation={[-Math.PI / 2, 0, leaf.rotation]}
          scale={leaf.scale}
        >
          <circleGeometry args={[0.1, 5]} />
          <meshBasicMaterial color={leaf.color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// Golden Essence - cube-shaped for rabbit realm
function GoldenEssence({ position, collected, index = 0 }) {
  const groupRef = useRef();
  const cubeRef = useRef();
  const beaconRef = useRef();

  useFrame(({ clock }) => {
    if (collected || !groupRef.current) return;

    // Float up and down with offset based on index
    const offset = index * 0.7; // Stagger the animation
    const float = Math.sin(clock.elapsedTime * 2.5 + offset) * 0.25;
    groupRef.current.position.y = position[1] + 1.5 + float;

    // Rotate cube
    if (cubeRef.current) {
      cubeRef.current.rotation.y = clock.elapsedTime * 1.5;
      cubeRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.8) * 0.2;
    }

    // Pulse beacon
    if (beaconRef.current) {
      const pulse = 0.8 + Math.sin(clock.elapsedTime * 3) * 0.2;
      beaconRef.current.scale.set(1, pulse, 1);
    }
  });

  if (collected) return null;

  return (
    <group>
      {/* Essence group */}
      <group ref={groupRef} position={[position[0], position[1] + 1.5, position[2]]}>
        {/* Outer golden glow */}
        <mesh>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.3} />
        </mesh>

        {/* Inner cube - golden */}
        <mesh ref={cubeRef}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshBasicMaterial color="#ffaa00" />
        </mesh>

        {/* Bright core */}
        <mesh>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshBasicMaterial color="#fff8dc" />
        </mesh>
      </group>

      {/* Beacon pillar - visible from far away */}
      <mesh ref={beaconRef} position={[position[0], 5, position[2]]}>
        <cylinderGeometry args={[0.15, 0.25, 10, 6]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.25} />
      </mesh>

      {/* Beacon top */}
      <mesh position={[position[0], 10, position[2]]}>
        <sphereGeometry args={[0.5, 6, 6]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.4} />
      </mesh>

      {/* Ground ring */}
      <mesh position={[position[0], 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.1, 12]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.35} />
      </mesh>
    </group>
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

// AEIOU character (Elf) - with visible beacon so players can find them
function Elf({ position, found }) {
  const groupRef = useRef();
  const beaconRef = useRef();

  useFrame(({ clock }) => {
    if (found || !groupRef.current) return;

    // Gentle floating animation
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.1;

    // Pulse beacon
    if (beaconRef.current) {
      const pulse = 0.8 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
      beaconRef.current.scale.set(1, pulse, 1);
    }
  });

  if (found) return null;

  return (
    <group position={position}>
      {/* Character group with animation */}
      <group ref={groupRef}>
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

        {/* Key in hand */}
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

      {/* Beacon pillar - GREEN to distinguish from golden essences */}
      <mesh ref={beaconRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 12, 6]} />
        <meshBasicMaterial color="#22cc44" transparent opacity={0.3} />
      </mesh>

      {/* Beacon top */}
      <mesh position={[0, 12, 0]}>
        <sphereGeometry args={[0.6, 6, 6]} />
        <meshBasicMaterial color="#44ff66" transparent opacity={0.5} />
      </mesh>

      {/* Ground ring - green */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 1.4, 16]} />
        <meshBasicMaterial color="#22cc44" transparent opacity={0.4} />
      </mesh>

      {/* "AEIOU" label floating above */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.08, 4, 4]} />
        <meshBasicMaterial color="#44ff66" />
      </mesh>
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

// Isometric camera that follows the player - Pac-Man 3D style
function IsometricCamera({ target, mazeSize }) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  // Isometric angles - 45° horizontal, ~35° vertical for classic look
  const ISO_ANGLE = Math.PI / 4; // 45 degrees
  const ISO_ELEVATION = Math.PI / 5.5; // ~33 degrees for nice 3D pac-man view
  const CAMERA_DISTANCE = Math.max(mazeSize * 0.7, 20);

  useFrame(() => {
    if (target && camera.isOrthographicCamera) {
      // Calculate isometric camera position relative to target
      const offsetX = Math.cos(ISO_ANGLE) * Math.cos(ISO_ELEVATION) * CAMERA_DISTANCE;
      const offsetY = Math.sin(ISO_ELEVATION) * CAMERA_DISTANCE;
      const offsetZ = Math.sin(ISO_ANGLE) * Math.cos(ISO_ELEVATION) * CAMERA_DISTANCE;

      const targetPosition = new THREE.Vector3(
        target[0] + offsetX,
        target[1] + offsetY,
        target[2] + offsetZ
      );

      // Smooth camera follow
      currentPosition.current.lerp(targetPosition, 0.08);
      camera.position.copy(currentPosition.current);

      // Look at player
      const lookAtTarget = new THREE.Vector3(target[0], target[1], target[2]);
      currentLookAt.current.lerp(lookAtTarget, 0.1);
      camera.lookAt(currentLookAt.current);

      // Update zoom based on maze size for consistent view
      camera.zoom = Math.max(25, 50 - mazeSize * 0.6);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// Generate decoration positions around and inside the maze
const generateDecorationPositions = (mazeSize, maze) => {
  const pumpkins = [];
  const cornStalks = [];
  const gourds = [];
  const gourdColors = ['#E07020', '#D4A017', '#8B4513', '#CD853F', '#DAA520', '#F4A460'];

  // Add pumpkins and corn around the outer edges
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = mazeSize / 2 + 4;
    const x = mazeSize / 2 + Math.cos(angle) * radius;
    const z = mazeSize / 2 + Math.sin(angle) * radius;

    pumpkins.push({
      position: [x + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2],
      scale: 0.2 + Math.random() * 0.2
    });

    // Corn stalks in bundles near pumpkins
    cornStalks.push({ position: [x + 1.2 + (Math.random() - 0.5), 0, z + (Math.random() - 0.5)] });
    cornStalks.push({ position: [x - 1.2 + (Math.random() - 0.5), 0, z + (Math.random() - 0.5)] });
    cornStalks.push({ position: [x + (Math.random() - 0.5), 0, z + 1.2 + (Math.random() - 0.5)] });

    // Gourds scattered near pumpkins
    gourds.push({
      position: [x + (Math.random() - 0.5) * 1.5, 0, z + 0.5 + (Math.random() - 0.5)],
      color: gourdColors[Math.floor(Math.random() * gourdColors.length)]
    });
  }

  // Add decorations in corners of the maze
  const corners = [
    [2, 2], [mazeSize - 3, 2], [2, mazeSize - 3], [mazeSize - 3, mazeSize - 3]
  ];
  corners.forEach(([cx, cz]) => {
    // Pumpkin patch in each corner
    for (let j = 0; j < 3; j++) {
      pumpkins.push({
        position: [cx + (Math.random() - 0.5) * 2, 0, cz + (Math.random() - 0.5) * 2],
        scale: 0.15 + Math.random() * 0.15
      });
    }
    // Corn stalks bundled
    cornStalks.push({ position: [cx + 1, 0, cz] });
    cornStalks.push({ position: [cx - 1, 0, cz] });
    // Gourds
    gourds.push({
      position: [cx + 0.5, 0, cz + 0.5],
      color: gourdColors[Math.floor(Math.random() * gourdColors.length)]
    });
    gourds.push({
      position: [cx - 0.3, 0, cz - 0.4],
      color: gourdColors[Math.floor(Math.random() * gourdColors.length)]
    });
  });

  // Add scattered decorations along the edges inside the maze
  for (let i = 0; i < 15; i++) {
    const edgeX = Math.random() > 0.5 ? 1.5 + Math.random() * 2 : mazeSize - 2.5 - Math.random() * 2;
    const edgeZ = Math.random() * (mazeSize - 4) + 2;
    gourds.push({
      position: [edgeX, 0, edgeZ],
      color: gourdColors[Math.floor(Math.random() * gourdColors.length)]
    });
  }

  return { pumpkins, cornStalks, gourds };
};

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
  essences,
  hasPyramidShard,
}) {
  // Generate decoration positions once
  const decorations = useMemo(() => generateDecorationPositions(mazeSize, maze), [mazeSize, maze]);

  return (
    <>
      {/* Lighting - warm autumn sunlight */}
      <ambientLight intensity={0.7} color="#FFF8DC" />
      <directionalLight position={[10, 15, 10]} intensity={0.8} color="#FFD700" />

      {/* Sky/Background - autumn sky gradient (warm blue with orange tint) */}
      <color attach="background" args={['#87CEEB']} />
      {/* Atmosphere fog for autumn haze */}
      <fog attach="fog" args={['#C9B896', mazeSize * 0.8, mazeSize * 2]} />

      {/* Autumn Ground with scattered leaves */}
      <AutumnGround size={mazeSize} />

      {/* Pumpkins for decoration */}
      {decorations.pumpkins.map((p, i) => (
        <Pumpkin key={`pumpkin-${i}`} position={p.position} scale={p.scale} />
      ))}

      {/* Gourds scattered around */}
      {decorations.gourds.map((g, i) => (
        <Gourd key={`gourd-${i}`} position={g.position} color={g.color} />
      ))}

      {/* Corn stalks for decoration */}
      {decorations.cornStalks.map((c, i) => (
        <CornStalk key={`corn-${i}`} position={c.position} />
      ))}

      {/* Hay bale maze walls - INSTANCED for performance */}
      <HayBaleInstances maze={maze} mazeSize={mazeSize} />

      {/* Golden Essences - 3 collectibles with beacons */}
      {essences.map((essence, i) => (
        <GoldenEssence
          key={`essence-${i}`}
          position={[essence.x, 0, essence.z]}
          collected={essence.collected}
          index={i}
        />
      ))}

      {/* AEIOU (Elf) - find them to get the key! Only render if shard not collected */}
      {!hasPyramidShard && <Elf position={elfPos} found={elfFound} />}

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

      {/* Isometric Camera */}
      <IsometricCamera target={playerPos} mazeSize={mazeSize} />
    </>
  );
}

// Main component
export default function RabbitRealm({
  difficulty = { key: 'NORMAL', level: 3 },
  onComplete,
  onDeath,
  onExit,
  onEssenceCollected,
  hasPyramidShard = false,
}) {
  // Handle both object and string difficulty formats
  const difficultyKey = typeof difficulty === 'object' ? difficulty.key?.toLowerCase() : difficulty?.toLowerCase();
  const settings = DIFFICULTY_SETTINGS[difficultyKey] || DIFFICULTY_SETTINGS.normal;
  const mazeSize = settings.mazeSize; // Maze size scales with difficulty
  const { playSound, startAutumnMusic, stopAutumnMusic } = useAudio();
  const { addEssence } = useInventory();

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

  // 3 Golden Essences - will be placed on valid walkable cells after maze generates
  const [essences, setEssences] = useState([]);
  const [essencesCollected, setEssencesCollected] = useState(0);

  // Fox spawning
  const [lastFoxSpawnTime, setLastFoxSpawnTime] = useState(0);
  const foxIdRef = useRef(0);
  const carrotIdRef = useRef(0);

  const keysRef = useRef({});
  const lastUpdateRef = useRef(Date.now());
  const particleIdRef = useRef(0);
  const isMobile = useIsMobile();

  // Grid-based movement with input buffering
  const bufferedInputRef = useRef(null); // Stores next intended direction
  const currentDirectionRef = useRef(null); // Current movement direction
  const inputBufferTimeRef = useRef(0);
  const INPUT_BUFFER_DURATION = 250; // ms - how long to remember buffered input

  // Mobile input now handled globally by useGameInput

  // Handle start game from intro modal
  const handleStartGame = useCallback(() => {
    setShowIntroModal(false);
    setGameStarted(true);
    startAutumnMusic();
  }, [startAutumnMusic]);

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

    // Essences will be re-placed by the useEffect when maze changes

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

    // Place 3 golden essences on valid walkable cells, spread across the maze
    // Filter cells into quadrants to ensure good distribution
    const center = mazeSize / 2;
    const topLeftCells = openCells.filter(c => c.x < center && c.z > center);
    const bottomRightCells = openCells.filter(c => c.x > center && c.z < center);
    const centerCells = openCells.filter(c =>
      Math.abs(c.x - center) < center * 0.3 && Math.abs(c.z - center) < center * 0.3
    );

    const essencePositions = [];
    // Pick one from each area (or random if area is empty)
    if (topLeftCells.length > 0) {
      essencePositions.push(topLeftCells[Math.floor(Math.random() * topLeftCells.length)]);
    } else {
      essencePositions.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }
    if (bottomRightCells.length > 0) {
      essencePositions.push(bottomRightCells[Math.floor(Math.random() * bottomRightCells.length)]);
    } else {
      essencePositions.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }
    if (centerCells.length > 0) {
      essencePositions.push(centerCells[Math.floor(Math.random() * centerCells.length)]);
    } else {
      essencePositions.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }

    setEssences(essencePositions.map((pos, i) => ({
      id: i,
      x: pos.x,
      z: pos.z,
      collected: false,
    })));
    setEssencesCollected(0);
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

  // Check collision - smaller hitboxes for smooth navigation
  const checkCollision = useCallback((x, z) => {
    const playerRadius = 0.12;  // Smaller = easier to navigate
    const wallHalf = 0.28;      // Much smaller than visual for very forgiving gameplay

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

  // GRID-BASED movement with input buffering - smooth Pac-Man style, NEVER get stuck
  const movePlayer = useCallback((currentX, currentZ, moveX, moveZ, delta) => {
    const speed = 7;
    const SNAP_THRESHOLD = 0.15; // Distance to snap to cell center
    const now = Date.now();

    // Get current cell and center
    const cellX = Math.floor(currentX);
    const cellZ = Math.floor(currentZ);
    const centerX = cellX + 0.5;
    const centerZ = cellZ + 0.5;
    const distToCenter = Math.sqrt(Math.pow(currentX - centerX, 2) + Math.pow(currentZ - centerZ, 2));

    // Determine intended direction from input
    let intendedDirection = null;
    if (Math.abs(moveX) > 0.3 || Math.abs(moveZ) > 0.3) {
      if (Math.abs(moveX) > Math.abs(moveZ)) {
        intendedDirection = moveX > 0 ? 'right' : 'left';
      } else {
        intendedDirection = moveZ > 0 ? 'down' : 'up';
      }
      // Buffer the input
      bufferedInputRef.current = intendedDirection;
      inputBufferTimeRef.current = now;
    } else if (now - inputBufferTimeRef.current > INPUT_BUFFER_DURATION) {
      // Clear buffer after duration
      bufferedInputRef.current = null;
    }

    // Helper to check if can move in direction
    const canMove = (fromX, fromZ, dir) => {
      const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
      const dz = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
      const targetCellX = Math.floor(fromX) + dx;
      const targetCellZ = Math.floor(fromZ) + dz;
      return !isWall(targetCellX, targetCellZ);
    };

    let newX = currentX;
    let newZ = currentZ;

    // At or near cell center - can change direction
    if (distToCenter < SNAP_THRESHOLD) {
      // Snap to center first
      newX = centerX;
      newZ = centerZ;

      // Check buffered input for turn
      if (bufferedInputRef.current && canMove(centerX, centerZ, bufferedInputRef.current)) {
        currentDirectionRef.current = bufferedInputRef.current;
        bufferedInputRef.current = null;
      }
      // If no buffered turn works, continue in current direction if possible
      else if (currentDirectionRef.current && !canMove(centerX, centerZ, currentDirectionRef.current)) {
        // Current direction blocked - stop
        currentDirectionRef.current = null;
      }
    }

    // Execute movement in current direction
    if (currentDirectionRef.current) {
      const dir = currentDirectionRef.current;
      const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
      const dz = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;

      // Move toward next cell
      const moveAmount = speed * delta;
      let tryX = newX + dx * moveAmount;
      let tryZ = newZ + dz * moveAmount;

      // Clamp to lane (stay centered on perpendicular axis)
      if (dx !== 0) {
        // Moving horizontally - center on Z
        tryZ = centerZ;
      }
      if (dz !== 0) {
        // Moving vertically - center on X
        tryX = centerX;
      }

      // Check if movement is valid
      if (!checkCollision(tryX, tryZ)) {
        newX = tryX;
        newZ = tryZ;
      } else {
        // Hit a wall - snap to cell center
        newX = centerX;
        newZ = centerZ;
        currentDirectionRef.current = null;
      }
    }

    // Final safety - never allow position inside wall
    if (checkCollision(newX, newZ)) {
      // Emergency: find nearest valid position
      const safePositions = [
        [centerX, centerZ],
        [centerX - 1, centerZ],
        [centerX + 1, centerZ],
        [centerX, centerZ - 1],
        [centerX, centerZ + 1],
      ];
      for (const [sx, sz] of safePositions) {
        if (!checkCollision(sx, sz)) {
          return [sx, sz];
        }
      }
      return [currentX, currentZ]; // Last resort: don't move
    }

    return [newX, newZ];
  }, [checkCollision, isWall]);

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
              playSound(SOUNDS.FOX_CHOMP);
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
          playSound(SOUNDS.PLAYER_HIT);
          setHealth(prev => {
            const newHealth = prev - 1;
            if (newHealth <= 0) {
              setGameOver(true);
              stopAutumnMusic();
              playSound(SOUNDS.GAME_OVER);
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
            playSound(SOUNDS.CARROT_CRUNCH);
            // Life carrot restores health
            if (carrot.isLife) {
              setHealth(prev => Math.min(prev + 1, 3)); // Max 3 health
              spawnParticles(carrot.x, 0.5, carrot.z, '#22ff22');
              setScore(prev => prev + 50);
              playSound(SOUNDS.EXTRA_LIFE);
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
          playSound(SOUNDS.COIN_COLLECT);
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
          playSound(SOUNDS.POWERUP);
          playSound(SOUNDS.FOX_SCARED);
          setIsPoweredUp(true);
          setPowerUpTimer(settings.powerUpDuration);
          setScore(prev => prev + 50);
          return { ...pellet, collected: true };
        }
        return pellet;
      }));

      // Check essence collection - 3 golden cubes
      setEssences(prev => prev.map(essence => {
        if (essence.collected) return essence;

        const dx = playerPos[0] - essence.x;
        const dz = playerPos[2] - essence.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.8) {
          spawnParticles(essence.x, 1.5, essence.z, '#ffd700');
          playSound(SOUNDS.COLLECT_ESSENCE);
          setScore(prev => prev + 250);
          setEssencesCollected(prev => prev + 1);
          addEssence('golden'); // Add golden essence to inventory
          return { ...essence, collected: true };
        }
        return essence;
      }));

      // Check elf (AEIOU) collision - win condition!
      if (!elfFound && !gameWon) {
        const dx = playerPos[0] - elfPos[0];
        const dz = playerPos[2] - elfPos[2];
        if (Math.sqrt(dx * dx + dz * dz) < 0.6) {
          setElfFound(true);
          setGameWon(true);
          spawnParticles(elfPos[0], 0.5, elfPos[2], '#88ff88');
          stopAutumnMusic();
          playSound(SOUNDS.VICTORY);
          setScore(prev => prev + 500);
          onComplete?.({ carrotsCollected, coinsCollected, essencesCollected, time, score: score + 500 });
        }
      }

    }, 1000 / 30); // 30fps for better performance

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, gameWon, isPaused, isPoweredUp, isInvisible, playerPos, maze, settings, checkCollision, movePlayer, spawnParticles, onDeath, onComplete, time, score, invincibleTimer, isJumping, jumpHeight, jumpVelocity, lastFoxSpawnTime, spawnFox, carrotsCollected, coinsCollected, mazeSize, elfPos, elfFound, essences, essencesCollected, playSound, addEssence, stopAutumnMusic]);

  // Cleanup: stop music when component unmounts
  useEffect(() => {
    return () => {
      stopAutumnMusic();
    };
  }, [stopAutumnMusic]);

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
        orthographic
        gl={{ antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'high-performance' }}
        dpr={isMobile ? 1 : [1, 1.5]}
      >
        <OrthographicCamera makeDefault position={[mazeSize, mazeSize * 0.6, mazeSize]} zoom={35} near={0.1} far={1000} />
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
          essences={essences}
          hasPyramidShard={hasPyramidShard}
        />
      </Canvas>

      {/* HUD */}
      <GameHUD
        collectibles={{ current: carrotsCollected, total: settings.carrots }}
        collectibleIcon="carrot"
        coins={score}
        time={time}
        lives={health}
        maxLives={3}
        isPaused={isPaused}
        onPause={() => setIsPaused(p => !p)}
        onRestart={handleRestart}
        onQuit={() => {
          stopAutumnMusic();
          onExit();
        }}
        realmName="Autumn Maze"
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
        border: (hasPyramidShard || elfFound) ? '1px solid #22c55e' : '1px solid rgba(136, 255, 136, 0.4)',
      }}>
        {hasPyramidShard
          ? `[OK] Shard Collected! Essences: ${essencesCollected}/3`
          : elfFound
            ? `[OK] AEIOU Found! Essences: ${essencesCollected}/3`
            : `Find AEIOU (green beacon) + ${3 - essencesCollected} Essences (gold beacons)`
        }
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
          WASD/Arrows: Move | Space: Jump | Collect 3 Essences + Find AEIOU!
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
