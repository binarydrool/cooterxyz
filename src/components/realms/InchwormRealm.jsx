"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import GameHUD from '../ui/GameHUD';
import IntroModal from '../ui/IntroModal';
import { getInput, useIsMobile, setActionState } from '@/hooks/useGameInput';
import { useAudio, SOUNDS } from '@/hooks/useAudio';

// Difficulty settings - path length and obstacle speed scale with difficulty
const DIFFICULTY_SETTINGS = {
  beginner: { pathLength: 50, obstacleSpeed: 0.5, leaves: 15, birdCount: 1, timeLimit: 120 },
  easy: { pathLength: 60, obstacleSpeed: 0.7, leaves: 18, birdCount: 1, timeLimit: 110 },
  normal: { pathLength: 70, obstacleSpeed: 0.9, leaves: 22, birdCount: 2, timeLimit: 100 },
  hard: { pathLength: 80, obstacleSpeed: 1.1, leaves: 26, birdCount: 2, timeLimit: 90 },
  expert: { pathLength: 90, obstacleSpeed: 1.3, leaves: 30, birdCount: 3, timeLimit: 80 },
  master: { pathLength: 100, obstacleSpeed: 1.5, leaves: 35, birdCount: 3, timeLimit: 70 },
  impossible: { pathLength: 120, obstacleSpeed: 2.0, leaves: 40, birdCount: 4, timeLimit: 60 },
};

const TURTLE_SPEED = 3;
const TURTLE_SIZE = 0.4;
const PATH_WIDTH = 3;
const LEAF_SIZE = 0.3;

// Generate a winding path
function generatePath(length) {
  const path = [];
  let x = 0;
  let z = 0;
  let direction = 0; // 0 = forward, 1 = right, 2 = left

  for (let i = 0; i < length; i++) {
    path.push({ x, z, segment: i });

    // Move forward
    z += 2;

    // Occasionally turn
    if (i > 5 && i < length - 5 && Math.random() < 0.3) {
      const turn = Math.random() < 0.5 ? -1 : 1;
      x += turn * 2;
    }
  }

  return path;
}

// Path segment mesh
function PathSegment({ position }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[PATH_WIDTH, 0.1, 2]} />
      <meshStandardMaterial color="#8B4513" roughness={0.9} />
    </mesh>
  );
}

// Leaf collectible
function Leaf({ position, onCollect, collected }) {
  const meshRef = useRef();
  const [bobOffset] = useState(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + bobOffset) * 0.1;
    }
  });

  if (collected) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <coneGeometry args={[LEAF_SIZE, LEAF_SIZE * 0.5, 4]} />
        <meshStandardMaterial color="#228B22" emissive="#228B22" emissiveIntensity={0.3} />
      </mesh>
      <pointLight color="#228B22" intensity={0.5} distance={2} />
    </group>
  );
}

// Bird obstacle
function Bird({ startZ, speed, onHitTurtle, turtlePos }) {
  const meshRef = useRef();
  const [x] = useState((Math.random() - 0.5) * PATH_WIDTH);
  const z = useRef(startZ);
  const wingPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Move toward player
    z.current -= speed * delta * 10;
    wingPhase.current += delta * 15;

    meshRef.current.position.z = z.current;
    meshRef.current.position.x = x;
    meshRef.current.position.y = 1 + Math.sin(wingPhase.current) * 0.3;

    // Check collision with turtle
    if (turtlePos) {
      const dx = meshRef.current.position.x - turtlePos[0];
      const dz = meshRef.current.position.z - turtlePos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.8) {
        onHitTurtle();
        z.current = startZ + 20; // Reset bird position
      }
    }

    // Reset if past player
    if (z.current < -5) {
      z.current = startZ + Math.random() * 20;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Bird body */}
      <mesh castShadow>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
      {/* Wings */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.sin(wingPhase.current) * 0.5]}>
        <boxGeometry args={[0.4, 0.05, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -Math.sin(wingPhase.current) * 0.5]}>
        <boxGeometry args={[0.4, 0.05, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0, 0.25]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.1, 0.2, 4]} />
        <meshStandardMaterial color="#FFA500" />
      </mesh>
    </group>
  );
}

// Turtle player
function Turtle({ position, rotation }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Shell */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.1, 0.35]} castShadow>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#8BC34A" roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.05, 0.15, 0.42]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.05, 0.15, 0.42]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
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

  const turtlePos = useRef([0, 0.2, 0]);
  const turtleRot = useRef(0);
  const cameraZ = useRef(-5);

  const path = useMemo(() => generatePath(settings.pathLength), [settings.pathLength]);

  // Generate leaves along the path
  const [leaves, setLeaves] = useState(() => {
    const leafPositions = [];
    for (let i = 0; i < settings.leaves; i++) {
      const pathIndex = Math.floor(Math.random() * (path.length - 10)) + 5;
      const pathPoint = path[pathIndex];
      leafPositions.push({
        id: i,
        position: [
          pathPoint.x + (Math.random() - 0.5) * (PATH_WIDTH - 1),
          0.5,
          pathPoint.z + (Math.random() - 0.5) * 1.5
        ],
        collected: false,
      });
    }
    return leafPositions;
  });

  // Essence spawns (3 per realm)
  const [essences, setEssences] = useState(() => {
    const essencePositions = [];
    const spacing = Math.floor(path.length / 4);
    for (let i = 0; i < 3; i++) {
      const pathIndex = spacing * (i + 1);
      const pathPoint = path[pathIndex];
      essencePositions.push({
        id: i,
        position: [pathPoint.x, 0.8, pathPoint.z],
        collected: false,
      });
    }
    return essencePositions;
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

  // Input handling
  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    const input = getInput();
    let moved = false;

    // Move turtle
    if (input.up) {
      turtlePos.current[2] += TURTLE_SPEED * delta;
      turtleRot.current = 0;
      moved = true;
    }
    if (input.down) {
      turtlePos.current[2] -= TURTLE_SPEED * delta;
      turtleRot.current = Math.PI;
      moved = true;
    }
    if (input.left) {
      turtlePos.current[0] -= TURTLE_SPEED * delta;
      turtleRot.current = Math.PI / 2;
      moved = true;
    }
    if (input.right) {
      turtlePos.current[0] += TURTLE_SPEED * delta;
      turtleRot.current = -Math.PI / 2;
      moved = true;
    }

    // Clamp to path width
    turtlePos.current[0] = Math.max(-PATH_WIDTH/2 + 0.3, Math.min(PATH_WIDTH/2 - 0.3, turtlePos.current[0]));

    // Check leaf collection
    leaves.forEach((leaf, i) => {
      if (!leaf.collected) {
        const dx = leaf.position[0] - turtlePos.current[0];
        const dz = leaf.position[2] - turtlePos.current[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.6) {
          setLeaves(prev => prev.map((l, idx) => idx === i ? { ...l, collected: true } : l));
          setScore(prev => {
            const newScore = prev + 10;
            onScoreChange(newScore);
            return newScore;
          });
        }
      }
    });

    // Check essence collection
    essences.forEach((essence, i) => {
      if (!essence.collected) {
        const dx = essence.position[0] - turtlePos.current[0];
        const dz = essence.position[2] - turtlePos.current[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.8) {
          setEssences(prev => prev.map((e, idx) => idx === i ? { ...e, collected: true } : e));
          setEssencesCollected(prev => prev + 1);
          onEssenceCollected('forest'); // Miles gives forest essences
          setScore(prev => {
            const newScore = prev + 50;
            onScoreChange(newScore);
            return newScore;
          });
        }
      }
    });

    // Check if reached end
    const lastPath = path[path.length - 1];
    if (turtlePos.current[2] > lastPath.z - 2) {
      setGameState('won');
      onGameOver({ won: true, score, lives, essencesCollected });
    }

    // Camera follow
    cameraZ.current = THREE.MathUtils.lerp(cameraZ.current, turtlePos.current[2] - 8, 0.05);
  });

  const handleBirdHit = useCallback(() => {
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
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

      {/* Sky/Background */}
      <mesh position={[0, 0, 50]}>
        <planeGeometry args={[200, 100]} />
        <meshBasicMaterial color="#87CEEB" />
      </mesh>

      {/* Ground */}
      <mesh position={[0, -0.1, 50]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 200]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Path segments */}
      {path.map((p, i) => (
        <PathSegment key={i} position={[p.x, 0, p.z]} />
      ))}

      {/* Leaves */}
      {leaves.map(leaf => (
        <Leaf key={leaf.id} position={leaf.position} collected={leaf.collected} />
      ))}

      {/* Essences */}
      {essences.map(essence => !essence.collected && (
        <group key={essence.id} position={essence.position}>
          <mesh castShadow>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial
              color="#7CFC00"
              emissive="#7CFC00"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          <pointLight color="#7CFC00" intensity={2} distance={3} />
        </group>
      ))}

      {/* Birds */}
      {Array.from({ length: settings.birdCount }).map((_, i) => (
        <Bird
          key={i}
          startZ={turtlePos.current[2] + 30 + i * 15}
          speed={settings.obstacleSpeed}
          onHitTurtle={handleBirdHit}
          turtlePos={turtlePos.current}
        />
      ))}

      {/* Turtle */}
      <Turtle position={turtlePos.current} rotation={turtleRot.current} />

      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 8, cameraZ.current]}
        rotation={[-0.6, 0, 0]}
        fov={60}
      />

      {/* HUD overlay info passed via callbacks */}
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
          realmName="The Long Road"
          realmDescription="Navigate the winding path! Collect leaves and avoid the birds. Reach the end to claim the Mind Shard!"
          difficulty={difficulty}
          onStart={handleStartGame}
          onBack={handleExit}
          animal="miles"
          tips={[
            "Use arrow keys or WASD to move",
            "Collect green leaves for points",
            "Avoid the swooping birds!",
            "Reach the end of the path to win",
            "Green gems are essences - collect all 3!"
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
          realmName="The Long Road"
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
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: 100,
        }}>
          <h1 style={{ fontSize: '48px', color: gameState === 'won' ? '#7CFC00' : '#ff4444' }}>
            {gameState === 'won' ? 'PATH COMPLETE!' : 'GAME OVER'}
          </h1>
          <p style={{ fontSize: '24px' }}>Score: {score}</p>
          {gameState === 'won' && (
            <p style={{ fontSize: '20px', color: '#7CFC00' }}>
              Mind Shard Collected!
            </p>
          )}
          <button
            onClick={handleExit}
            style={{
              marginTop: '30px',
              padding: '15px 40px',
              fontSize: '18px',
              background: '#7CFC00',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#000',
            }}
          >
            Return to Clock
          </button>
        </div>
      )}
    </div>
  );
}
