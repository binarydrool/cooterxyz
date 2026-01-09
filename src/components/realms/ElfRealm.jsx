"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import GameHUD from '../ui/GameHUD';

// Elf Realm - Final Challenge combining all realm mechanics
// Section 1: Clockwork Warren (maze) - Rabbit skills
// Section 2: Gear Ascent (platforming) - Cat skills
// Section 3: Mercury River (crossing) - Frog skills
// Section 4: Shadow of Time (boss fight)

const SECTION_NAMES = ['Clockwork Warren', 'Gear Ascent', 'Mercury River', 'Shadow of Time'];

// Difficulty settings affect lives and boss difficulty
const DIFFICULTY_LIVES = {
  beginner: 7,
  easy: 6,
  normal: 5,
  hard: 4,
  expert: 3,
  master: 2,
  impossible: 1,
};

const DIFFICULTY_MULTIPLIERS = {
  beginner: 0.6,
  easy: 0.75,
  normal: 1.0,
  hard: 1.25,
  expert: 1.5,
  master: 1.75,
  impossible: 2.0,
};

export default function ElfRealm({
  difficulty = 'normal',
  prismGrade = 'C', // Grade affects starting lives bonus
  onComplete,
  onDeath,
  onExit,
}) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const animationRef = useRef(null);
  const keysRef = useRef({});

  const [currentSection, setCurrentSection] = useState(0);
  const [lives, setLives] = useState(DIFFICULTY_LIVES[difficulty] || 5);
  const [coins, setCoins] = useState(0);
  const [time, setTime] = useState(0);
  const [collectibles, setCollectibles] = useState({ collected: 0, total: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [bossHealth, setBossHealth] = useState(100);
  const [showSectionTitle, setShowSectionTitle] = useState(true);

  // Grade bonus lives
  const getGradeBonus = useCallback(() => {
    const bonuses = { S: 3, A: 2, B: 1, C: 0, D: 0, F: -1 };
    return bonuses[prismGrade] || 0;
  }, [prismGrade]);

  // Initialize game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // Add grade bonus to lives
    const bonusLives = getGradeBonus();
    const startingLives = Math.max(1, (DIFFICULTY_LIVES[difficulty] || 5) + bonusLives);
    setLives(startingLives);

    // Generate all sections
    const sections = [
      generateMazeSection(width, height, difficulty),
      generatePlatformSection(width, height, difficulty),
      generateRiverSection(width, height, difficulty),
      generateBossSection(width, height, difficulty),
    ];

    // Count total collectibles
    let totalCollectibles = 0;
    sections.forEach(section => {
      totalCollectibles += section.collectibles?.length || 0;
    });
    setCollectibles({ collected: 0, total: totalCollectibles });

    gameStateRef.current = {
      ctx,
      width,
      height,
      sections,
      currentSection: 0,
      player: {
        x: 50,
        y: height / 2,
        width: 24,
        height: 32,
        vx: 0,
        vy: 0,
        grounded: false,
        morphForm: 'turtle', // turtle, rabbit, cat, frog, owl
        facing: 1,
        dashCooldown: 0,
        invincible: 0,
        attacking: false,
        attackCooldown: 0,
      },
      camera: { x: 0, y: 0 },
      difficultyMult: DIFFICULTY_MULTIPLIERS[difficulty] || 1.0,
      collectedItems: new Set(),
      sectionProgress: 0,
      bossPhase: 0,
      bossHealth: 100,
      bossAttackTimer: 0,
      bossPatterns: [],
      particles: [],
      flashTimer: 0,
    };

    // Show section title
    setShowSectionTitle(true);
    setTimeout(() => setShowSectionTitle(false), 2000);

  }, [difficulty, getGradeBonus]);

  // Generate maze section (Rabbit skills)
  const generateMazeSection = (width, height, difficulty) => {
    const cellSize = 40;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);

    // Generate maze using recursive backtracking
    const maze = [];
    for (let y = 0; y < rows; y++) {
      maze[y] = [];
      for (let x = 0; x < cols; x++) {
        maze[y][x] = { walls: [true, true, true, true], visited: false }; // top, right, bottom, left
      }
    }

    const stack = [];
    let current = { x: 1, y: 1 };
    maze[current.y][current.x].visited = true;

    const getNeighbors = (x, y) => {
      const neighbors = [];
      if (y > 1 && !maze[y-2]?.[x]?.visited) neighbors.push({ x, y: y-2, dir: 0 });
      if (x < cols-2 && !maze[y]?.[x+2]?.visited) neighbors.push({ x: x+2, y, dir: 1 });
      if (y < rows-2 && !maze[y+2]?.[x]?.visited) neighbors.push({ x, y: y+2, dir: 2 });
      if (x > 1 && !maze[y]?.[x-2]?.visited) neighbors.push({ x: x-2, y, dir: 3 });
      return neighbors;
    };

    while (true) {
      const neighbors = getNeighbors(current.x, current.y);
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        stack.push(current);

        // Remove walls
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        if (maze[midY] && maze[midY][midX]) {
          maze[midY][midX].walls = [false, false, false, false];
        }

        maze[current.y][current.x].walls[next.dir] = false;
        maze[next.y][next.x].walls[(next.dir + 2) % 4] = false;

        current = next;
        maze[current.y][current.x].visited = true;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }
    }

    // Convert to walls array
    const walls = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = maze[y][x];
        if (cell.walls[0]) walls.push({ x: x * cellSize, y: y * cellSize, width: cellSize, height: 4 });
        if (cell.walls[1]) walls.push({ x: (x+1) * cellSize - 4, y: y * cellSize, width: 4, height: cellSize });
        if (cell.walls[2]) walls.push({ x: x * cellSize, y: (y+1) * cellSize - 4, width: cellSize, height: 4 });
        if (cell.walls[3]) walls.push({ x: x * cellSize, y: y * cellSize, width: 4, height: cellSize });
      }
    }

    // Add collectibles in dead ends and along paths
    const collectibles = [];
    for (let i = 0; i < 15; i++) {
      collectibles.push({
        x: 100 + Math.random() * (width - 200),
        y: 100 + Math.random() * (height - 200),
        type: Math.random() < 0.3 ? 'gear' : 'coin',
        collected: false,
      });
    }

    // Add clockwork enemies
    const enemies = [];
    const enemyCount = Math.floor(5 * DIFFICULTY_MULTIPLIERS[difficulty]);
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        x: 200 + Math.random() * (width - 400),
        y: 200 + Math.random() * (height - 400),
        type: 'clockwork_fox',
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    return {
      type: 'maze',
      walls,
      collectibles,
      enemies,
      exit: { x: width - 60, y: height - 60, width: 40, height: 40 },
      cellSize,
    };
  };

  // Generate platform section (Cat skills)
  const generatePlatformSection = (width, height, difficulty) => {
    const platforms = [];
    const sectionHeight = height * 4; // Tall vertical section

    // Generate ascending platforms
    let y = sectionHeight - 100;
    let lastX = 50;

    while (y > 100) {
      const platformType = Math.random();
      let platform;

      if (platformType < 0.2) {
        // Moving platform
        platform = {
          x: lastX,
          y,
          width: 80 + Math.random() * 40,
          height: 16,
          type: 'moving',
          startX: lastX,
          endX: lastX + 150,
          speed: 1 + Math.random(),
        };
      } else if (platformType < 0.35) {
        // Crumbling platform
        platform = {
          x: lastX,
          y,
          width: 60,
          height: 16,
          type: 'crumbling',
          timer: 0,
          crumbling: false,
        };
      } else {
        // Static platform
        platform = {
          x: lastX,
          y,
          width: 70 + Math.random() * 50,
          height: 16,
          type: 'static',
        };
      }

      platforms.push(platform);

      // Next platform position
      y -= 60 + Math.random() * 40;
      lastX = Math.max(30, Math.min(width - 100, lastX + (Math.random() - 0.5) * 200));
    }

    // Add walls for wall jumping
    const walls = [
      { x: 0, y: 0, width: 20, height: sectionHeight },
      { x: width - 20, y: 0, width: 20, height: sectionHeight },
    ];

    // Add falling hazards
    const hazards = [];
    const hazardCount = Math.floor(8 * DIFFICULTY_MULTIPLIERS[difficulty]);
    for (let i = 0; i < hazardCount; i++) {
      hazards.push({
        x: 50 + Math.random() * (width - 100),
        y: -100 - i * 300,
        type: Math.random() < 0.5 ? 'gear' : 'pendulum',
        speed: 2 + Math.random() * 2,
        active: false,
        respawnY: -100 - i * 300,
      });
    }

    // Collectibles along the way
    const collectibles = [];
    platforms.forEach((p, i) => {
      if (i % 3 === 0) {
        collectibles.push({
          x: p.x + p.width / 2,
          y: p.y - 30,
          type: Math.random() < 0.2 ? 'gear' : 'coin',
          collected: false,
        });
      }
    });

    return {
      type: 'platform',
      platforms,
      walls,
      hazards,
      collectibles,
      sectionHeight,
      exit: { x: width / 2 - 20, y: 50, width: 40, height: 40 },
    };
  };

  // Generate river section (Frog skills)
  const generateRiverSection = (width, height, difficulty) => {
    const sectionWidth = width * 3;
    const laneHeight = 50;
    const lanes = [];

    // Alternating water and land lanes
    for (let i = 0; i < Math.floor(height / laneHeight); i++) {
      const isWater = i % 2 === 1;
      const lane = {
        y: i * laneHeight,
        height: laneHeight,
        type: isWater ? 'water' : 'land',
        objects: [],
      };

      if (isWater) {
        // Add logs, lilypads, or hazards
        const objectCount = 3 + Math.floor(Math.random() * 3);
        const direction = Math.random() < 0.5 ? 1 : -1;
        for (let j = 0; j < objectCount; j++) {
          const objType = Math.random();
          if (objType < 0.4) {
            lane.objects.push({
              x: j * (sectionWidth / objectCount) + Math.random() * 100,
              width: 80 + Math.random() * 40,
              type: 'log',
              speed: (0.5 + Math.random()) * direction,
            });
          } else if (objType < 0.7) {
            lane.objects.push({
              x: j * (sectionWidth / objectCount) + Math.random() * 100,
              width: 40,
              type: 'lilypad',
              speed: (0.3 + Math.random() * 0.3) * direction,
            });
          } else {
            lane.objects.push({
              x: j * (sectionWidth / objectCount) + Math.random() * 100,
              width: 30,
              type: 'mercury_blob',
              speed: (1 + Math.random()) * direction,
              dangerous: true,
            });
          }
        }
      }

      lanes.push(lane);
    }

    // Add flying hazards
    const hazards = [];
    const hazardCount = Math.floor(4 * DIFFICULTY_MULTIPLIERS[difficulty]);
    for (let i = 0; i < hazardCount; i++) {
      hazards.push({
        x: 500 + i * 400,
        y: 100 + Math.random() * (height - 200),
        type: 'clock_bird',
        vx: -2 - Math.random(),
        pattern: Math.random() < 0.5 ? 'straight' : 'sine',
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Collectibles on safe spots
    const collectibles = [];
    for (let i = 0; i < 12; i++) {
      collectibles.push({
        x: 200 + i * 200 + Math.random() * 100,
        y: Math.floor(Math.random() * lanes.length) * laneHeight + laneHeight / 2,
        type: Math.random() < 0.25 ? 'gear' : 'coin',
        collected: false,
      });
    }

    return {
      type: 'river',
      lanes,
      hazards,
      collectibles,
      sectionWidth,
      exit: { x: sectionWidth - 60, y: height / 2 - 20, width: 40, height: 40 },
    };
  };

  // Generate boss section
  const generateBossSection = (width, height, difficulty) => {
    // Boss arena
    const platforms = [
      { x: 0, y: height - 40, width: width, height: 40, type: 'static' }, // Ground
      { x: 50, y: height - 150, width: 100, height: 16, type: 'static' },
      { x: width - 150, y: height - 150, width: 100, height: 16, type: 'static' },
      { x: width / 2 - 60, y: height - 250, width: 120, height: 16, type: 'static' },
      { x: 100, y: height - 350, width: 80, height: 16, type: 'static' },
      { x: width - 180, y: height - 350, width: 80, height: 16, type: 'static' },
    ];

    return {
      type: 'boss',
      platforms,
      boss: {
        x: width / 2,
        y: height / 2 - 50,
        width: 80,
        height: 100,
        health: 100,
        maxHealth: 100,
        phase: 0,
        attackTimer: 0,
        pattern: 'idle',
        vulnerable: false,
        invincible: 0,
      },
      projectiles: [],
      collectibles: [],
    };
  };

  // Handle player death
  const handleDeath = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        onDeath?.();
      } else {
        // Respawn at section start
        if (gameStateRef.current) {
          const state = gameStateRef.current;
          state.player.x = 50;
          state.player.y = state.height / 2;
          state.player.vx = 0;
          state.player.vy = 0;
          state.player.invincible = 120;
          state.camera.x = 0;
          state.camera.y = 0;
        }
      }
      return newLives;
    });
  }, [onDeath]);

  // Advance to next section
  const advanceSection = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;

    const nextSection = state.currentSection + 1;

    if (nextSection >= 4) {
      // Victory!
      setVictory(true);
      onComplete?.({
        time,
        coins,
        collectibles: collectibles.collected,
        livesRemaining: lives,
      });
      return;
    }

    state.currentSection = nextSection;
    setCurrentSection(nextSection);

    // Reset player position for new section
    state.player.x = 50;
    state.player.y = state.height / 2;
    state.player.vx = 0;
    state.player.vy = 0;
    state.camera.x = 0;
    state.camera.y = 0;

    // Update morph form based on section
    const forms = ['rabbit', 'cat', 'frog', 'owl'];
    state.player.morphForm = forms[nextSection] || 'turtle';

    // Show section title
    setShowSectionTitle(true);
    setTimeout(() => setShowSectionTitle(false), 2000);

  }, [time, coins, collectibles, lives, onComplete]);

  // Game loop
  useEffect(() => {
    if (!canvasRef.current) return;

    initGame();

    let lastTime = performance.now();
    let timeAccumulator = 0;

    const gameLoop = (currentTime) => {
      if (!gameStateRef.current || isPaused || gameOver || victory) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = Math.min(currentTime - lastTime, 50);
      lastTime = currentTime;
      timeAccumulator += deltaTime;

      // Update time display
      if (timeAccumulator >= 1000) {
        setTime(prev => prev + 1);
        timeAccumulator -= 1000;
      }

      const state = gameStateRef.current;
      const { ctx, width, height, player, sections } = state;
      const section = sections[state.currentSection];
      const keys = keysRef.current;

      // Update player based on section type
      updatePlayer(state, keys, deltaTime);

      // Update section-specific logic
      switch (section.type) {
        case 'maze':
          updateMazeSection(state, section, deltaTime);
          break;
        case 'platform':
          updatePlatformSection(state, section, deltaTime);
          break;
        case 'river':
          updateRiverSection(state, section, deltaTime);
          break;
        case 'boss':
          updateBossSection(state, section, deltaTime);
          break;
      }

      // Update particles
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= deltaTime / 1000;
        p.vy += 0.1;
        return p.life > 0;
      });

      // Render
      render(state, section);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initGame, isPaused, gameOver, victory]);

  // Update player movement and physics
  const updatePlayer = (state, keys, dt) => {
    const { player, currentSection } = state;
    const section = state.sections[currentSection];
    const speed = 4;
    const gravity = 0.5;
    const jumpForce = -12;

    // Decrease cooldowns
    if (player.dashCooldown > 0) player.dashCooldown -= dt / 1000;
    if (player.invincible > 0) player.invincible--;
    if (player.attackCooldown > 0) player.attackCooldown -= dt / 1000;

    // Section-specific controls
    if (section.type === 'maze') {
      // Top-down movement (Rabbit style)
      player.vx = 0;
      player.vy = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -speed; player.facing = -1; }
      if (keys['ArrowRight'] || keys['KeyD']) { player.vx = speed; player.facing = 1; }
      if (keys['ArrowUp'] || keys['KeyW']) player.vy = -speed;
      if (keys['ArrowDown'] || keys['KeyS']) player.vy = speed;

      // Dash ability
      if (keys['Space'] && player.dashCooldown <= 0) {
        player.vx *= 3;
        player.vy *= 3;
        player.dashCooldown = 1;
        player.invincible = 15;
      }

    } else if (section.type === 'platform') {
      // Side-scrolling platformer (Cat style)
      player.vx *= 0.85;
      if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -speed; player.facing = -1; }
      if (keys['ArrowRight'] || keys['KeyD']) { player.vx = speed; player.facing = 1; }

      player.vy += gravity;

      // Jump / wall jump
      if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && player.grounded) {
        player.vy = jumpForce;
        player.grounded = false;
      }

      // Wall slide and wall jump
      const touchingWall = checkWallCollision(player, section.walls);
      if (touchingWall && !player.grounded && player.vy > 0) {
        player.vy = Math.min(player.vy, 2); // Wall slide
        if (keys['ArrowUp'] || keys['KeyW'] || keys['Space']) {
          player.vy = jumpForce;
          player.vx = touchingWall === 'left' ? speed * 2 : -speed * 2;
        }
      }

    } else if (section.type === 'river') {
      // Side-scrolling movement (Frog style)
      player.vx = 2; // Auto-scroll
      if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= 2;
      if (keys['ArrowRight'] || keys['KeyD']) player.vx += 3;
      if (keys['ArrowUp'] || keys['KeyW']) player.vy = -speed;
      else if (keys['ArrowDown'] || keys['KeyS']) player.vy = speed;
      else player.vy *= 0.9;

      // Jump
      if (keys['Space'] && player.grounded) {
        player.vy = -8;
        player.grounded = false;
      }

    } else if (section.type === 'boss') {
      // Full movement with flight (Owl style)
      player.vx *= 0.9;
      if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -speed; player.facing = -1; }
      if (keys['ArrowRight'] || keys['KeyD']) { player.vx = speed; player.facing = 1; }

      player.vy += gravity * 0.7;

      if (keys['ArrowUp'] || keys['KeyW']) {
        player.vy = Math.max(player.vy - 0.8, -6);
      }

      if ((keys['Space']) && player.grounded) {
        player.vy = jumpForce;
        player.grounded = false;
      }

      // Attack
      if (keys['KeyE'] && player.attackCooldown <= 0) {
        player.attacking = true;
        player.attackCooldown = 0.5;
        setTimeout(() => { player.attacking = false; }, 200);
      }
    }

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Bounds checking
    if (section.type === 'maze') {
      player.x = Math.max(0, Math.min(state.width - player.width, player.x));
      player.y = Math.max(0, Math.min(state.height - player.height, player.y));
    } else if (section.type === 'platform') {
      player.x = Math.max(20, Math.min(state.width - 20 - player.width, player.x));
      if (player.y > section.sectionHeight) {
        handleDeath();
      }
    } else if (section.type === 'river') {
      player.y = Math.max(0, Math.min(state.height - player.height, player.y));
      if (player.x < state.camera.x - 50) {
        handleDeath();
      }
    } else if (section.type === 'boss') {
      player.x = Math.max(0, Math.min(state.width - player.width, player.x));
      if (player.y > state.height) {
        handleDeath();
      }
    }
  };

  const checkWallCollision = (player, walls) => {
    if (!walls) return null;
    for (const wall of walls) {
      if (player.x < wall.x + wall.width &&
          player.x + player.width > wall.x &&
          player.y < wall.y + wall.height &&
          player.y + player.height > wall.y) {
        return player.x < wall.x ? 'right' : 'left';
      }
    }
    return null;
  };

  // Update maze section
  const updateMazeSection = (state, section, dt) => {
    const { player } = state;

    // Wall collision
    for (const wall of section.walls) {
      if (player.x < wall.x + wall.width &&
          player.x + player.width > wall.x &&
          player.y < wall.y + wall.height &&
          player.y + player.height > wall.y) {
        // Push player out
        const overlapX = Math.min(player.x + player.width - wall.x, wall.x + wall.width - player.x);
        const overlapY = Math.min(player.y + player.height - wall.y, wall.y + wall.height - player.y);

        if (overlapX < overlapY) {
          player.x += player.x < wall.x ? -overlapX : overlapX;
        } else {
          player.y += player.y < wall.y ? -overlapY : overlapY;
        }
      }
    }

    // Enemy collision and movement
    for (const enemy of section.enemies) {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      enemy.phase += 0.05;

      // Bounce off walls
      if (enemy.x < 50 || enemy.x > state.width - 50) enemy.vx *= -1;
      if (enemy.y < 50 || enemy.y > state.height - 50) enemy.vy *= -1;

      // Check player collision
      if (player.invincible <= 0 &&
          Math.abs(player.x + player.width/2 - enemy.x) < 30 &&
          Math.abs(player.y + player.height/2 - enemy.y) < 30) {
        handleDeath();
      }
    }

    // Collectible pickup
    for (const item of section.collectibles) {
      if (item.collected) continue;
      if (Math.abs(player.x + player.width/2 - item.x) < 25 &&
          Math.abs(player.y + player.height/2 - item.y) < 25) {
        item.collected = true;
        if (item.type === 'coin') {
          setCoins(prev => prev + 10);
        } else {
          setCollectibles(prev => ({ ...prev, collected: prev.collected + 1 }));
        }
        spawnParticles(state, item.x, item.y, item.type === 'gear' ? '#c4a000' : '#ffd700');
      }
    }

    // Check exit
    if (player.x + player.width > section.exit.x &&
        player.x < section.exit.x + section.exit.width &&
        player.y + player.height > section.exit.y &&
        player.y < section.exit.y + section.exit.height) {
      advanceSection();
    }
  };

  // Update platform section
  const updatePlatformSection = (state, section, dt) => {
    const { player } = state;
    player.grounded = false;

    // Camera follows player vertically
    const targetCameraY = player.y - state.height / 2;
    state.camera.y += (targetCameraY - state.camera.y) * 0.1;
    state.camera.y = Math.max(0, Math.min(section.sectionHeight - state.height, state.camera.y));

    // Platform collision
    for (const platform of section.platforms) {
      // Update moving platforms
      if (platform.type === 'moving') {
        platform.x += platform.speed;
        if (platform.x <= platform.startX || platform.x >= platform.endX) {
          platform.speed *= -1;
        }
      }

      // Update crumbling platforms
      if (platform.type === 'crumbling' && platform.crumbling) {
        platform.timer += dt;
        if (platform.timer > 500) {
          platform.fallen = true;
        }
      }

      if (platform.fallen) continue;

      // Check collision from above
      if (player.vy >= 0 &&
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + player.height >= platform.y &&
          player.y + player.height <= platform.y + platform.height + player.vy + 5) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;

        // Trigger crumbling
        if (platform.type === 'crumbling' && !platform.crumbling) {
          platform.crumbling = true;
        }

        // Move with platform
        if (platform.type === 'moving') {
          player.x += platform.speed;
        }
      }
    }

    // Hazard collision
    for (const hazard of section.hazards) {
      hazard.y += hazard.speed;
      if (hazard.y > section.sectionHeight + 100) {
        hazard.y = hazard.respawnY;
        hazard.x = 50 + Math.random() * (state.width - 100);
      }

      // Check if in view
      if (Math.abs(hazard.y - player.y) < state.height) {
        if (player.invincible <= 0 &&
            Math.abs(player.x + player.width/2 - hazard.x) < 25 &&
            Math.abs(player.y + player.height/2 - hazard.y) < 25) {
          handleDeath();
        }
      }
    }

    // Collectibles
    for (const item of section.collectibles) {
      if (item.collected) continue;
      if (Math.abs(player.x + player.width/2 - item.x) < 25 &&
          Math.abs(player.y + player.height/2 - item.y) < 25) {
        item.collected = true;
        if (item.type === 'coin') {
          setCoins(prev => prev + 10);
        } else {
          setCollectibles(prev => ({ ...prev, collected: prev.collected + 1 }));
        }
        spawnParticles(state, item.x, item.y, item.type === 'gear' ? '#c4a000' : '#ffd700');
      }
    }

    // Check exit
    const exitScreenY = section.exit.y - state.camera.y;
    if (player.y < section.exit.y + section.exit.height &&
        player.y + player.height > section.exit.y &&
        player.x + player.width > section.exit.x &&
        player.x < section.exit.x + section.exit.width) {
      advanceSection();
    }
  };

  // Update river section
  const updateRiverSection = (state, section, dt) => {
    const { player } = state;

    // Camera follows player horizontally
    state.camera.x = Math.max(0, Math.min(section.sectionWidth - state.width, player.x - state.width / 3));

    // Determine which lane player is in
    const laneIndex = Math.floor((player.y + player.height / 2) / (state.height / section.lanes.length));
    const currentLane = section.lanes[laneIndex];

    player.grounded = false;
    let onPlatform = false;

    // Update lane objects
    for (const lane of section.lanes) {
      for (const obj of lane.objects) {
        obj.x += obj.speed;

        // Wrap around
        if (obj.speed > 0 && obj.x > section.sectionWidth + 100) {
          obj.x = -obj.width;
        } else if (obj.speed < 0 && obj.x < -obj.width - 100) {
          obj.x = section.sectionWidth;
        }

        // Check if player is on this object
        if (lane === currentLane &&
            player.x + player.width > obj.x &&
            player.x < obj.x + obj.width) {
          if (obj.dangerous) {
            if (player.invincible <= 0) {
              handleDeath();
            }
          } else {
            onPlatform = true;
            player.grounded = true;
            player.x += obj.speed; // Move with platform
          }
        }
      }
    }

    // If in water and not on platform, sink
    if (currentLane && currentLane.type === 'water' && !onPlatform) {
      if (player.invincible <= 0) {
        handleDeath();
      }
    }

    // Flying hazards
    for (const hazard of section.hazards) {
      hazard.x += hazard.vx;
      if (hazard.pattern === 'sine') {
        hazard.phase += 0.05;
        hazard.y += Math.sin(hazard.phase) * 2;
      }

      if (hazard.x < -100) {
        hazard.x = section.sectionWidth + 100;
      }

      if (player.invincible <= 0 &&
          Math.abs(player.x + player.width/2 - hazard.x) < 25 &&
          Math.abs(player.y + player.height/2 - hazard.y) < 30) {
        handleDeath();
      }
    }

    // Collectibles
    for (const item of section.collectibles) {
      if (item.collected) continue;
      if (Math.abs(player.x + player.width/2 - item.x) < 25 &&
          Math.abs(player.y + player.height/2 - item.y) < 25) {
        item.collected = true;
        if (item.type === 'coin') {
          setCoins(prev => prev + 10);
        } else {
          setCollectibles(prev => ({ ...prev, collected: prev.collected + 1 }));
        }
        spawnParticles(state, item.x - state.camera.x, item.y, item.type === 'gear' ? '#c4a000' : '#ffd700');
      }
    }

    // Check exit
    if (player.x + player.width > section.exit.x &&
        player.x < section.exit.x + section.exit.width &&
        player.y + player.height > section.exit.y &&
        player.y < section.exit.y + section.exit.height) {
      advanceSection();
    }
  };

  // Update boss section
  const updateBossSection = (state, section, dt) => {
    const { player } = state;
    const boss = section.boss;
    player.grounded = false;

    // Platform collision
    for (const platform of section.platforms) {
      if (player.vy >= 0 &&
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + player.height >= platform.y &&
          player.y + player.height <= platform.y + platform.height + player.vy + 5) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;
      }
    }

    // Update boss AI
    boss.attackTimer += dt;
    if (boss.invincible > 0) boss.invincible -= dt;

    // Boss patterns based on phase
    const phase = Math.floor((1 - boss.health / boss.maxHealth) * 3);
    if (phase !== boss.phase) {
      boss.phase = phase;
      boss.pattern = 'transition';
      boss.vulnerable = true;
      setTimeout(() => {
        boss.pattern = ['sweep', 'rain', 'chase'][phase] || 'sweep';
        boss.vulnerable = false;
      }, 2000);
    }

    // Execute boss pattern
    switch (boss.pattern) {
      case 'sweep':
        // Move side to side, shooting projectiles
        boss.x += Math.sin(boss.attackTimer / 1000) * 3;
        if (boss.attackTimer > 1500) {
          boss.attackTimer = 0;
          // Spawn projectile
          section.projectiles.push({
            x: boss.x,
            y: boss.y + boss.height,
            vx: (player.x - boss.x) * 0.02,
            vy: 3,
            type: 'time_orb',
          });
        }
        break;

      case 'rain':
        // Stay at top, rain down projectiles
        boss.y = Math.min(boss.y, 100);
        if (boss.attackTimer > 500) {
          boss.attackTimer = 0;
          section.projectiles.push({
            x: 50 + Math.random() * (state.width - 100),
            y: 0,
            vx: 0,
            vy: 5 + Math.random() * 3,
            type: 'gear_shard',
          });
        }
        break;

      case 'chase':
        // Chase the player
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        boss.x += dx * 0.02;
        boss.y += dy * 0.01;

        if (boss.attackTimer > 800) {
          boss.attackTimer = 0;
          // Burst attack
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            section.projectiles.push({
              x: boss.x,
              y: boss.y,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              type: 'time_orb',
            });
          }
        }
        break;

      case 'transition':
        // Vulnerable, moving erratically
        boss.x += Math.sin(boss.attackTimer / 200) * 5;
        boss.y = state.height / 2 + Math.cos(boss.attackTimer / 300) * 50;
        break;
    }

    // Update projectiles
    section.projectiles = section.projectiles.filter(proj => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Check player hit
      if (player.invincible <= 0 &&
          Math.abs(player.x + player.width/2 - proj.x) < 20 &&
          Math.abs(player.y + player.height/2 - proj.y) < 20) {
        handleDeath();
        return false;
      }

      // Remove if out of bounds
      return proj.x > -50 && proj.x < state.width + 50 && proj.y < state.height + 50;
    });

    // Player attacking boss
    if (player.attacking && boss.vulnerable && boss.invincible <= 0) {
      const dist = Math.sqrt(
        Math.pow(player.x + player.width/2 - boss.x, 2) +
        Math.pow(player.y + player.height/2 - boss.y, 2)
      );

      if (dist < 80) {
        boss.health -= 10;
        boss.invincible = 500;
        setBossHealth(boss.health);
        spawnParticles(state, boss.x, boss.y, '#8b0000');

        if (boss.health <= 0) {
          // Boss defeated!
          setVictory(true);
          onComplete?.({
            time,
            coins,
            collectibles: collectibles.collected,
            livesRemaining: lives,
          });
        }
      }
    }

    // Direct boss collision
    if (player.invincible <= 0 && !boss.vulnerable) {
      const dist = Math.sqrt(
        Math.pow(player.x + player.width/2 - boss.x, 2) +
        Math.pow(player.y + player.height/2 - boss.y, 2)
      );
      if (dist < 50) {
        handleDeath();
      }
    }
  };

  // Spawn particles effect
  const spawnParticles = (state, x, y, color) => {
    for (let i = 0; i < 8; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        color,
        life: 0.5,
        size: 3 + Math.random() * 4,
      });
    }
  };

  // Render function
  const render = (state, section) => {
    const { ctx, width, height, player, camera, particles } = state;

    // Clear and set background based on section
    const backgrounds = {
      maze: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      platform: 'linear-gradient(180deg, #0f0f23 0%, #1a0a2e 100%)',
      river: 'linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%)',
      boss: 'linear-gradient(180deg, #2d0a0a 0%, #1a0505 100%)',
    };

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Apply camera transform
    ctx.save();
    if (section.type === 'platform') {
      ctx.translate(0, -camera.y);
    } else if (section.type === 'river') {
      ctx.translate(-camera.x, 0);
    }

    // Render section-specific elements
    switch (section.type) {
      case 'maze':
        renderMazeSection(ctx, section, state);
        break;
      case 'platform':
        renderPlatformSection(ctx, section, state);
        break;
      case 'river':
        renderRiverSection(ctx, section, state);
        break;
      case 'boss':
        renderBossSection(ctx, section, state);
        break;
    }

    // Render player
    renderPlayer(ctx, player, state.currentSection);

    ctx.restore();

    // Render particles (screen space)
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Flash effect when hit
    if (state.flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${state.flashTimer / 30})`;
      ctx.fillRect(0, 0, width, height);
      state.flashTimer--;
    }
  };

  const renderMazeSection = (ctx, section, state) => {
    // Render walls
    ctx.fillStyle = '#3d3d5c';
    for (const wall of section.walls) {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Render enemies
    for (const enemy of section.enemies) {
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Clockwork detail
      ctx.strokeStyle = '#c4a000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 10, enemy.phase, enemy.phase + Math.PI);
      ctx.stroke();
    }

    // Render collectibles
    for (const item of section.collectibles) {
      if (item.collected) continue;
      ctx.fillStyle = item.type === 'gear' ? '#c4a000' : '#ffd700';
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.type === 'gear' ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render exit
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(section.exit.x, section.exit.y, section.exit.width, section.exit.height);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', section.exit.x + section.exit.width/2, section.exit.y + section.exit.height/2 + 4);
  };

  const renderPlatformSection = (ctx, section, state) => {
    // Render platforms
    for (const platform of section.platforms) {
      if (platform.fallen) continue;

      if (platform.type === 'static') {
        ctx.fillStyle = '#4a4a6a';
      } else if (platform.type === 'moving') {
        ctx.fillStyle = '#6a4a8a';
      } else if (platform.type === 'crumbling') {
        ctx.fillStyle = platform.crumbling ? '#8a4a4a' : '#6a6a4a';
      }

      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Render walls
    ctx.fillStyle = '#3d3d5c';
    for (const wall of section.walls) {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Render hazards
    for (const hazard of section.hazards) {
      ctx.fillStyle = '#c44';
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render collectibles
    for (const item of section.collectibles) {
      if (item.collected) continue;
      ctx.fillStyle = item.type === 'gear' ? '#c4a000' : '#ffd700';
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.type === 'gear' ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render exit
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(section.exit.x, section.exit.y, section.exit.width, section.exit.height);
  };

  const renderRiverSection = (ctx, section, state) => {
    // Render lanes
    for (let i = 0; i < section.lanes.length; i++) {
      const lane = section.lanes[i];
      const laneY = i * (state.height / section.lanes.length);
      const laneH = state.height / section.lanes.length;

      // Background
      ctx.fillStyle = lane.type === 'water' ? '#1e4d6b' : '#2d4a2d';
      ctx.fillRect(0, laneY, section.sectionWidth, laneH);

      // Objects
      for (const obj of lane.objects) {
        if (obj.type === 'log') {
          ctx.fillStyle = '#8b4513';
        } else if (obj.type === 'lilypad') {
          ctx.fillStyle = '#228b22';
        } else if (obj.type === 'mercury_blob') {
          ctx.fillStyle = '#c0c0c0';
        }

        ctx.fillRect(obj.x, laneY + 10, obj.width, laneH - 20);
      }
    }

    // Render hazards
    for (const hazard of section.hazards) {
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(hazard.x, hazard.y - 15);
      ctx.lineTo(hazard.x + 20, hazard.y + 10);
      ctx.lineTo(hazard.x - 20, hazard.y + 10);
      ctx.closePath();
      ctx.fill();
    }

    // Render collectibles
    for (const item of section.collectibles) {
      if (item.collected) continue;
      ctx.fillStyle = item.type === 'gear' ? '#c4a000' : '#ffd700';
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.type === 'gear' ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render exit
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(section.exit.x, section.exit.y, section.exit.width, section.exit.height);
  };

  const renderBossSection = (ctx, section, state) => {
    const { width, height } = state;

    // Render platforms
    ctx.fillStyle = '#4a3a5a';
    for (const platform of section.platforms) {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Render boss
    const boss = section.boss;

    // Boss shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(boss.x, height - 30, 40, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss body
    ctx.fillStyle = boss.vulnerable ? '#666' : '#2d1b4e';
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y, boss.width/2, boss.height/2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss face
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(boss.x - 15, boss.y - 15, 10, 0, Math.PI * 2);
    ctx.arc(boss.x + 15, boss.y - 15, 10, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    const healthBarWidth = 200;
    const healthBarX = width / 2 - healthBarWidth / 2;
    ctx.fillStyle = '#333';
    ctx.fillRect(healthBarX, 20, healthBarWidth, 16);
    ctx.fillStyle = boss.health > 30 ? '#c44' : '#f44';
    ctx.fillRect(healthBarX, 20, healthBarWidth * (boss.health / boss.maxHealth), 16);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(healthBarX, 20, healthBarWidth, 16);

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TEMPORAL WRAITH', width / 2, 15);

    // Render projectiles
    for (const proj of section.projectiles) {
      ctx.fillStyle = proj.type === 'time_orb' ? '#9966ff' : '#c4a000';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vulnerable indicator
    if (boss.vulnerable) {
      ctx.fillStyle = '#4ade80';
      ctx.font = '14px monospace';
      ctx.fillText('ATTACK NOW!', width / 2, 60);
    }
  };

  const renderPlayer = (ctx, player, sectionIndex) => {
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    if (player.facing < 0) ctx.scale(-1, 1);

    // Invincibility flash
    if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Different appearance based on section (morphed form)
    const forms = ['rabbit', 'cat', 'frog', 'owl'];
    const form = forms[sectionIndex] || 'turtle';

    const colors = {
      turtle: '#2d8a4e',
      rabbit: '#f5deb3',
      cat: '#ff8c00',
      frog: '#228b22',
      owl: '#4a3728',
    };

    ctx.fillStyle = colors[form];

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 4, player.width/2 - 2, player.height/2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -player.height/3, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(3, -player.height/3 - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(4, -player.height/3 - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Form-specific details
    if (form === 'rabbit') {
      // Ears
      ctx.fillStyle = colors.rabbit;
      ctx.fillRect(-6, -player.height/3 - 20, 4, 15);
      ctx.fillRect(2, -player.height/3 - 20, 4, 15);
    } else if (form === 'cat') {
      // Ears (triangular)
      ctx.fillStyle = colors.cat;
      ctx.beginPath();
      ctx.moveTo(-8, -player.height/3 - 5);
      ctx.lineTo(-4, -player.height/3 - 15);
      ctx.lineTo(0, -player.height/3 - 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -player.height/3 - 5);
      ctx.lineTo(4, -player.height/3 - 15);
      ctx.lineTo(8, -player.height/3 - 5);
      ctx.fill();
    } else if (form === 'owl') {
      // Wings
      if (player.vy < 0) {
        ctx.fillStyle = colors.owl;
        ctx.beginPath();
        ctx.ellipse(-player.width/2, 0, 15, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(player.width/2, 0, 15, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Attack indicator
    if (player.attacking) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      zIndex: 1000,
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* HUD */}
      <GameHUD
        collectibles={collectibles}
        coins={coins}
        time={formatTime(time)}
        lives={lives}
        isPaused={isPaused}
        onResume={() => setIsPaused(false)}
        onExit={onExit}
      />

      {/* Section indicator */}
      <div style={{
        position: 'fixed',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '20px',
        zIndex: 1100,
      }}>
        {SECTION_NAMES.map((name, i) => (
          <div
            key={name}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: i < currentSection ? '#4ade80' : i === currentSection ? '#ffd700' : '#444',
              border: '2px solid #666',
            }}
            title={name}
          />
        ))}
      </div>

      {/* Section title overlay */}
      {showSectionTitle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1200,
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            color: '#c4a000',
            fontSize: '14px',
            letterSpacing: '0.2em',
            marginBottom: '8px',
          }}>
            SECTION {currentSection + 1} OF 4
          </div>
          <div style={{
            color: '#fff',
            fontSize: '32px',
            fontWeight: 600,
          }}>
            {SECTION_NAMES[currentSection]}
          </div>
          <div style={{
            color: '#888',
            fontSize: '14px',
            marginTop: '16px',
          }}>
            {currentSection === 0 && 'Use WASD to move, SPACE to dash'}
            {currentSection === 1 && 'Jump with SPACE, wall jump off walls'}
            {currentSection === 2 && 'Navigate the mercury river, stay on platforms'}
            {currentSection === 3 && 'Defeat the Temporal Wraith! Attack when vulnerable'}
          </div>
        </div>
      )}

      {/* Boss health bar (for boss section) */}
      {currentSection === 3 && !showSectionTitle && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          zIndex: 1100,
        }}>
          <div style={{
            textAlign: 'center',
            color: '#c44',
            fontSize: '12px',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Temporal Wraith
          </div>
          <div style={{
            height: '8px',
            background: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${bossHealth}%`,
              height: '100%',
              background: bossHealth > 30 ? '#c44' : '#f44',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          zIndex: 1300,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💀</div>
          <div style={{ color: '#c44', fontSize: '32px', marginBottom: '8px' }}>
            Game Over
          </div>
          <div style={{ color: '#888', marginBottom: '24px' }}>
            Reached: {SECTION_NAMES[currentSection]}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => {
                setGameOver(false);
                setTime(0);
                setCoins(0);
                setCurrentSection(0);
                initGame();
              }}
              style={{
                padding: '12px 24px',
                background: '#4ade80',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Try Again
            </button>
            <button
              onClick={onExit}
              style={{
                padding: '12px 24px',
                background: '#444',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Victory overlay */}
      {victory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          zIndex: 1300,
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>👑</div>
          <div style={{
            color: '#ffd700',
            fontSize: '36px',
            marginBottom: '8px',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }}>
            Victory!
          </div>
          <div style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
            The Temporal Wraith has been defeated!
          </div>
          <div style={{ color: '#888', marginBottom: '24px' }}>
            Time: {formatTime(time)} | Coins: {coins} | Lives: {lives}
          </div>
          <div style={{
            padding: '16px 32px',
            background: 'linear-gradient(180deg, #ffd700 0%, #c4a000 100%)',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <div style={{ color: '#000', fontSize: '14px', fontWeight: 600 }}>
              Victory Crown Earned!
            </div>
            <div style={{ color: '#333', fontSize: '12px' }}>
              Grade: {prismGrade} | Difficulty: {difficulty}
            </div>
          </div>
          <button
            onClick={onExit}
            style={{
              padding: '12px 32px',
              background: '#4ade80',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Return to Hub
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
