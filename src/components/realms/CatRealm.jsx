"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import GameHUD from '../ui/GameHUD';
import MobileGameControls, { useIsMobile } from '../ui/MobileGameControls';

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  BEGINNER: { hazardSpeed: 1, platformSize: 1.2, crumblingRatio: 0.1, checkpoints: 5, parTime: 180 },
  EASY: { hazardSpeed: 1.3, platformSize: 1.1, crumblingRatio: 0.2, checkpoints: 4, parTime: 150 },
  NORMAL: { hazardSpeed: 1.6, platformSize: 1.0, crumblingRatio: 0.3, checkpoints: 3, parTime: 120 },
  HARD: { hazardSpeed: 2.0, platformSize: 0.9, crumblingRatio: 0.4, checkpoints: 2, parTime: 100 },
  EXPERT: { hazardSpeed: 2.5, platformSize: 0.8, crumblingRatio: 0.5, checkpoints: 1, parTime: 80 },
  MASTER: { hazardSpeed: 3.0, platformSize: 0.7, crumblingRatio: 0.7, checkpoints: 1, parTime: 60 },
  IMPOSSIBLE: { hazardSpeed: 3.5, platformSize: 0.6, crumblingRatio: 0.9, checkpoints: 0, parTime: 45 },
};

// Level height in screens
const LEVEL_HEIGHT = 20;

// Platform types
const PLATFORM_TYPE = {
  STATIC: 'static',
  MOVING: 'moving',
  CRUMBLING: 'crumbling',
  LADDER: 'ladder',
};

// Generate level
function generateLevel(settings) {
  const platforms = [];
  const hazards = [];
  const coins = [];
  const ladders = [];

  const screenHeight = 600;
  const screenWidth = 800;
  const totalHeight = screenHeight * LEVEL_HEIGHT;

  // Ground platform
  platforms.push({
    x: 0,
    y: totalHeight - 40,
    width: screenWidth,
    height: 40,
    type: PLATFORM_TYPE.STATIC,
  });

  // Generate platforms going up
  let currentY = totalHeight - 120;
  let side = 0; // Alternating sides

  while (currentY > 100) {
    const platformWidth = 120 * settings.platformSize + Math.random() * 60;
    const gap = 80 + Math.random() * 40;

    // Main platform
    const isLeft = side % 2 === 0;
    const x = isLeft ? 50 + Math.random() * 100 : screenWidth - 50 - platformWidth - Math.random() * 100;

    const isCrumbling = Math.random() < settings.crumblingRatio;
    const isMoving = !isCrumbling && Math.random() < 0.2;

    platforms.push({
      x,
      y: currentY,
      width: platformWidth,
      height: 20,
      type: isCrumbling ? PLATFORM_TYPE.CRUMBLING : isMoving ? PLATFORM_TYPE.MOVING : PLATFORM_TYPE.STATIC,
      moveRange: isMoving ? 100 + Math.random() * 100 : 0,
      moveSpeed: isMoving ? 50 + Math.random() * 50 : 0,
      originalX: x,
      crumbleTimer: 0,
      crumbling: false,
    });

    // Add coins on some platforms
    if (Math.random() < 0.4) {
      coins.push({
        x: x + platformWidth / 2,
        y: currentY - 25,
        collected: false,
      });
    }

    // Add connecting ladder occasionally
    if (Math.random() < 0.3 && currentY > 200) {
      ladders.push({
        x: isLeft ? x + platformWidth - 30 : x + 10,
        y: currentY - gap - 20,
        height: gap + 40,
      });
    }

    currentY -= gap + 80 + Math.random() * 40;
    side++;
  }

  // Moon platform at top
  platforms.push({
    x: screenWidth / 2 - 60,
    y: 60,
    width: 120,
    height: 20,
    type: PLATFORM_TYPE.STATIC,
    isMoon: true,
  });

  // Generate hazards
  for (let i = 0; i < LEVEL_HEIGHT * 2; i++) {
    const y = totalHeight - 200 - i * (totalHeight / (LEVEL_HEIGHT * 2));
    if (y < 100) continue;

    hazards.push({
      x: Math.random() < 0.5 ? -30 : screenWidth + 30,
      y,
      vx: (Math.random() < 0.5 ? 1 : -1) * (100 + Math.random() * 100) * settings.hazardSpeed,
      type: ['pot', 'bird', 'bottle'][Math.floor(Math.random() * 3)],
      active: true,
    });
  }

  return { platforms, hazards, coins, ladders, totalHeight };
}

// Main component
export default function CatRealm({
  difficulty = 'NORMAL',
  freeMode = false,
  onComplete,
  onQuit,
  onToggleFreeMode,
}) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [height, setHeight] = useState({ current: 0, total: 100 });
  const [noHit, setNoHit] = useState(true);

  const gameDataRef = useRef(null);
  const keysRef = useRef({ left: false, right: false, up: false, down: false, jump: false });
  const isMobile = useIsMobile();

  // Mobile input handler
  const handleMobileInput = useCallback((key, isPressed) => {
    const keyMap = {
      'up': 'up',
      'down': 'down',
      'left': 'left',
      'right': 'right',
    };
    const mappedKey = keyMap[key];
    if (mappedKey) {
      keysRef.current[mappedKey] = isPressed;
    }
  }, []);

  // Mobile jump handler
  const handleMobileJump = useCallback((isPressed) => {
    keysRef.current.jump = isPressed;
  }, []);

  // Initialize game
  useEffect(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;
    const level = generateLevel(settings);

    gameDataRef.current = {
      ...level,
      settings,
      player: {
        x: 400,
        y: level.totalHeight - 80,
        vx: 0,
        vy: 0,
        width: 30,
        height: 40,
        onGround: false,
        onLadder: false,
        wallSliding: false,
        facingRight: true,
        maxHeight: level.totalHeight - 80,
      },
      camera: {
        y: level.totalHeight - 600,
      },
      checkpointY: level.totalHeight - 80,
    };

    const totalHeightPercent = Math.round((level.totalHeight - 100) / 10);
    setHeight({ current: 0, total: totalHeightPercent });
    setTime(0);
    setScore(0);
    setLives(3);
    setCoins(0);
    setNoHit(true);
    setGameState('playing');
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = performance.now();

    const keys = keysRef.current;

    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      switch (e.key.toLowerCase()) {
        case 'a': case 'arrowleft': keysRef.current.left = true; break;
        case 'd': case 'arrowright': keysRef.current.right = true; break;
        case 'w': case 'arrowup': keysRef.current.up = true; break;
        case 's': case 'arrowdown': keysRef.current.down = true; break;
        case ' ': keysRef.current.jump = true; break;
        case 'escape': setGameState(gs => gs === 'playing' ? 'paused' : 'playing'); break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'a': case 'arrowleft': keysRef.current.left = false; break;
        case 'd': case 'arrowright': keysRef.current.right = false; break;
        case 'w': case 'arrowup': keysRef.current.up = false; break;
        case 's': case 'arrowdown': keysRef.current.down = false; break;
        case ' ': keysRef.current.jump = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      if (gameState === 'playing' && gameDataRef.current) {
        update(dt, keysRef.current);
      }
      render(ctx);

      animationId = requestAnimationFrame(gameLoop);
    };

    const update = (dt, keys) => {
      const data = gameDataRef.current;
      if (!data) return;

      const { player, platforms, hazards, coins: levelCoins, ladders, camera, totalHeight, settings } = data;
      const gravity = 1200;
      const moveSpeed = 200;
      const jumpForce = 450;
      const wallJumpForce = 350;

      // Check if on ladder
      player.onLadder = false;
      for (const ladder of ladders) {
        if (player.x + player.width / 2 > ladder.x &&
            player.x + player.width / 2 < ladder.x + 30 &&
            player.y + player.height > ladder.y &&
            player.y < ladder.y + ladder.height) {
          player.onLadder = true;
          break;
        }
      }

      // Horizontal movement
      if (keys.left) {
        player.vx = -moveSpeed;
        player.facingRight = false;
      } else if (keys.right) {
        player.vx = moveSpeed;
        player.facingRight = true;
      } else {
        player.vx *= 0.8;
      }

      // Ladder climbing
      if (player.onLadder) {
        if (keys.up) player.vy = -150;
        else if (keys.down) player.vy = 150;
        else player.vy = 0;
      } else {
        // Gravity
        player.vy += gravity * dt;

        // Jumping
        if (keys.jump && player.onGround) {
          player.vy = -jumpForce;
          player.onGround = false;
        }

        // Wall jump
        if (keys.jump && player.wallSliding) {
          player.vy = -wallJumpForce;
          player.vx = player.facingRight ? -200 : 200;
          player.wallSliding = false;
        }
      }

      // Apply velocity
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Wall bounds
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > 800) player.x = 800 - player.width;

      // Platform collision
      player.onGround = false;
      player.wallSliding = false;

      for (const platform of platforms) {
        let px = platform.x;

        // Moving platforms
        if (platform.type === PLATFORM_TYPE.MOVING) {
          const offset = Math.sin(Date.now() / 1000 * platform.moveSpeed / 50) * platform.moveRange / 2;
          px = platform.originalX + offset;
        }

        // Crumbling platforms
        if (platform.crumbling && platform.crumbleTimer > 0) {
          platform.crumbleTimer -= dt;
          if (platform.crumbleTimer <= 0) {
            platform.fallen = true;
          }
          continue;
        }
        if (platform.fallen) continue;

        // Check collision
        if (player.x + player.width > px &&
            player.x < px + platform.width) {

          // Landing on top
          if (player.y + player.height > platform.y &&
              player.y + player.height < platform.y + platform.height + 20 &&
              player.vy >= 0) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;

            // Start crumble
            if (platform.type === PLATFORM_TYPE.CRUMBLING && !platform.crumbling) {
              platform.crumbling = true;
              platform.crumbleTimer = 0.5;
            }

            // Win condition
            if (platform.isMoon) {
              setGameState('won');
            }
          }
        }

        // Wall sliding (sides of platforms)
        if (player.y + player.height > platform.y &&
            player.y < platform.y + platform.height) {
          if (Math.abs(player.x - (px + platform.width)) < 5 ||
              Math.abs(player.x + player.width - px) < 5) {
            if (!player.onGround && player.vy > 0) {
              player.wallSliding = true;
              player.vy = Math.min(player.vy, 100);
            }
          }
        }
      }

      // Update max height
      if (player.y < player.maxHeight) {
        player.maxHeight = player.y;
        const progress = Math.round((totalHeight - player.y) / 10);
        setHeight(h => ({ ...h, current: progress }));
        setScore(s => s + 1);
      }

      // Fall death
      if (player.y > camera.y + 700) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('lost');
          } else {
            // Respawn at checkpoint
            player.x = 400;
            player.y = data.checkpointY;
            player.vx = 0;
            player.vy = 0;
          }
          return newLives;
        });
      }

      // Update camera
      const targetY = player.y - 300;
      camera.y += (targetY - camera.y) * 0.1;
      camera.y = Math.max(0, Math.min(totalHeight - 600, camera.y));

      // Hazard collision
      for (const hazard of hazards) {
        if (!hazard.active) continue;

        // Move hazard
        hazard.x += hazard.vx * dt;

        // Reset if off screen
        if (hazard.x < -50 || hazard.x > 850) {
          hazard.vx = -hazard.vx;
        }

        // Check collision with player
        const hx = hazard.x;
        const hy = hazard.y;
        if (player.x + player.width > hx - 15 &&
            player.x < hx + 15 &&
            player.y + player.height > hy - 15 &&
            player.y < hy + 15) {
          setNoHit(false);
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('lost');
            } else {
              player.y -= 50;
              player.vy = -200;
            }
            return newLives;
          });
          hazard.active = false;
          setTimeout(() => { hazard.active = true; }, 2000);
        }
      }

      // Coin collection
      for (const coin of levelCoins) {
        if (coin.collected) continue;

        if (player.x + player.width > coin.x - 15 &&
            player.x < coin.x + 15 &&
            player.y + player.height > coin.y - 15 &&
            player.y < coin.y + 15) {
          coin.collected = true;
          setCoins(c => c + 1);
          setScore(s => s + 100);
        }
      }
    };

    const render = (ctx) => {
      const data = gameDataRef.current;
      if (!data) return;

      const { player, platforms, hazards, coins: levelCoins, ladders, camera, totalHeight } = data;
      const canvas = ctx.canvas;

      // Night sky background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a2e');
      gradient.addColorStop(0.5, '#1a1a4e');
      gradient.addColorStop(1, '#2a2a3e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 97) % canvas.width;
        const y = ((i * 73 + camera.y * 0.1) % canvas.height);
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500 + i) * 0.2;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Moon at top
      if (camera.y < 200) {
        const moonY = 40 - camera.y;
        ctx.fillStyle = '#ffffd0';
        ctx.beginPath();
        ctx.arc(400, moonY, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
        ctx.beginPath();
        ctx.arc(400, moonY, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ladders
      for (const ladder of ladders) {
        const ly = ladder.y - camera.y;
        if (ly > -ladder.height && ly < canvas.height + 50) {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(ladder.x, ly, 8, ladder.height);
          ctx.fillRect(ladder.x + 22, ly, 8, ladder.height);
          // Rungs
          for (let r = 0; r < ladder.height; r += 25) {
            ctx.fillRect(ladder.x, ly + r, 30, 5);
          }
        }
      }

      // Platforms
      for (const platform of platforms) {
        if (platform.fallen) continue;

        let px = platform.x;
        if (platform.type === PLATFORM_TYPE.MOVING) {
          const offset = Math.sin(Date.now() / 1000 * platform.moveSpeed / 50) * platform.moveRange / 2;
          px = platform.originalX + offset;
        }

        const py = platform.y - camera.y;
        if (py > -50 && py < canvas.height + 50) {
          if (platform.isMoon) {
            // Moon platform
            ctx.fillStyle = '#ffffd0';
            ctx.fillRect(px, py, platform.width, platform.height);
          } else if (platform.type === PLATFORM_TYPE.CRUMBLING) {
            // Crumbling - show cracks
            ctx.fillStyle = platform.crumbling ? '#8B0000' : '#654321';
            ctx.fillRect(px, py, platform.width, platform.height);
            if (platform.crumbling) {
              ctx.strokeStyle = '#400000';
              ctx.beginPath();
              for (let i = 0; i < 3; i++) {
                ctx.moveTo(px + platform.width * (0.2 + i * 0.3), py);
                ctx.lineTo(px + platform.width * (0.3 + i * 0.3), py + platform.height);
              }
              ctx.stroke();
            }
          } else {
            // Normal platform
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(px, py, platform.width, platform.height);
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(px + 2, py + 2, platform.width - 4, platform.height - 6);
          }
        }
      }

      // Coins
      for (const coin of levelCoins) {
        if (coin.collected) continue;
        const cy = coin.y - camera.y;
        if (cy > -20 && cy < canvas.height + 20) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(coin.x, cy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFA500';
          ctx.beginPath();
          ctx.arc(coin.x, cy, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Hazards
      for (const hazard of hazards) {
        if (!hazard.active) continue;
        const hy = hazard.y - camera.y;
        if (hy > -30 && hy < canvas.height + 30) {
          if (hazard.type === 'pot') {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(hazard.x, hy, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#228B22';
            ctx.fillRect(hazard.x - 8, hy - 25, 16, 10);
          } else if (hazard.type === 'bird') {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(hazard.x - 15, hy);
            ctx.lineTo(hazard.x, hy - 10);
            ctx.lineTo(hazard.x + 15, hy);
            ctx.lineTo(hazard.x, hy + 5);
            ctx.fill();
          } else {
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.ellipse(hazard.x, hy, 8, 15, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Player (cat)
      const py = player.y - camera.y;
      const px = player.x;

      // Body
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(px + 5, py + 15, player.width - 10, player.height - 15);

      // Head
      ctx.beginPath();
      ctx.arc(px + player.width / 2, py + 12, 15, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.beginPath();
      ctx.moveTo(px + 5, py + 5);
      ctx.lineTo(px + 10, py - 8);
      ctx.lineTo(px + 18, py + 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + player.width - 5, py + 5);
      ctx.lineTo(px + player.width - 10, py - 8);
      ctx.lineTo(px + player.width - 18, py + 5);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      const eyeOffset = player.facingRight ? 3 : -3;
      ctx.beginPath();
      ctx.arc(px + player.width / 2 - 5 + eyeOffset, py + 10, 3, 0, Math.PI * 2);
      ctx.arc(px + player.width / 2 + 5 + eyeOffset, py + 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const tailDir = player.facingRight ? 1 : -1;
      ctx.moveTo(px + player.width / 2 - tailDir * 10, py + player.height - 5);
      ctx.quadraticCurveTo(
        px + player.width / 2 - tailDir * 25,
        py + player.height - 20,
        px + player.width / 2 - tailDir * 20,
        py + player.height - 35
      );
      ctx.stroke();
      ctx.lineWidth = 1;

      // Wall slide indicator
      if (player.wallSliding) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(px - 5, py, 5, player.height);
        ctx.fillRect(px + player.width, py, 5, player.height);
      }
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const handlePause = useCallback(() => {
    setGameState(gs => gs === 'playing' ? 'paused' : 'playing');
  }, []);

  const handleRestart = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.NORMAL;
    const level = generateLevel(settings);

    gameDataRef.current = {
      ...level,
      settings,
      player: {
        x: 400, y: level.totalHeight - 80, vx: 0, vy: 0,
        width: 30, height: 40, onGround: false, onLadder: false,
        wallSliding: false, facingRight: true, maxHeight: level.totalHeight - 80,
      },
      camera: { y: level.totalHeight - 600 },
      checkpointY: level.totalHeight - 80,
    };

    setHeight({ current: 0, total: Math.round((level.totalHeight - 100) / 10) });
    setTime(0);
    setScore(0);
    setLives(3);
    setCoins(0);
    setNoHit(true);
    setGameState('playing');
  }, [difficulty]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      const settings = DIFFICULTY_SETTINGS[difficulty];
      const timeBonus = Math.max(0, (settings.parTime - time) * 10);
      const noHitBonus = noHit ? 500 : 0;
      const finalScore = score + timeBonus + (lives * 300) + noHitBonus + (coins * 100);
      onComplete({ score: finalScore, time, difficulty, height: height.current, coins, lives, noHit });
    }
  }, [onComplete, difficulty, score, time, lives, height, coins, noHit]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a2e' }}>
      <GameHUD
        freeMode={freeMode}
        onToggleFreeMode={onToggleFreeMode}
        collectibles={height}
        collectibleIcon="📏"
        coins={coins}
        time={time}
        lives={lives}
        maxLives={3}
        isPaused={gameState === 'paused'}
        onPause={handlePause}
        onRestart={handleRestart}
        onQuit={onQuit}
        realmName="The Rooftops"
      />

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ flex: 1, maxWidth: '100%', maxHeight: 'calc(100vh - 100px)', margin: 'auto', display: 'block' }}
      />

      {(gameState === 'won' || gameState === 'lost') && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1000,
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #2a2520 0%, #1a1815 100%)',
            borderRadius: '12px', padding: '40px', textAlign: 'center', minWidth: '300px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {gameState === 'won' ? '🌙' : '💔'}
            </div>
            <h2 style={{ color: gameState === 'won' ? '#ffffd0' : '#ff6666', fontSize: '28px', marginBottom: '24px' }}>
              {gameState === 'won' ? 'Reached the Moon!' : 'Game Over'}
            </h2>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.8 }}>
              <div>Score: <span style={{ color: '#fff' }}>{score}</span></div>
              <div>Time: <span style={{ color: '#fff' }}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span></div>
              <div>Height: <span style={{ color: '#fff' }}>{height.current}m</span></div>
              <div>Coins: <span style={{ color: '#FFD700' }}>{coins}</span></div>
              {noHit && gameState === 'won' && <div style={{ color: '#90EE90' }}>No-Hit Bonus!</div>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleRestart} style={{
                padding: '12px 24px', background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                color: '#fff', fontSize: '14px', cursor: 'pointer',
              }}>Play Again</button>
              {gameState === 'won' && !freeMode && (
                <button onClick={handleComplete} style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #4e5f3d 0%, #3d4a30 100%)',
                  border: '1px solid #5a6d47', borderRadius: '6px',
                  color: '#e8e6de', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>Claim Shard</button>
              )}
              <button onClick={onQuit} style={{
                padding: '12px 24px', background: 'rgba(255, 100, 100, 0.2)',
                border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '6px',
                color: '#ff8888', fontSize: '14px', cursor: 'pointer',
              }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile controls */}
      <MobileGameControls
        onInput={handleMobileInput}
        onJump={handleMobileJump}
        jumpLabel="JUMP"
      />
    </div>
  );
}
