"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import GameHUD from '../ui/GameHUD';
import MobileGameControls, { useIsMobile } from '../ui/MobileGameControls';

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  BEGINNER: { waves: 5, enemiesPerWave: [3, 4, 4, 5, 5], enemySpeed: 0.7, lives: 5 },
  EASY: { waves: 7, enemiesPerWave: [4, 4, 5, 5, 6, 6, 7], enemySpeed: 0.85, lives: 5 },
  NORMAL: { waves: 10, enemiesPerWave: [5, 5, 6, 6, 7, 7, 8, 8, 9, 10], enemySpeed: 1.0, lives: 4 },
  HARD: { waves: 12, enemiesPerWave: [6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12], enemySpeed: 1.2, lives: 3 },
  EXPERT: { waves: 15, enemiesPerWave: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15], enemySpeed: 1.4, lives: 3 },
  MASTER: { waves: 20, enemiesPerWave: Array(20).fill(0).map((_, i) => 10 + Math.floor(i / 2)), enemySpeed: 1.6, lives: 2 },
  IMPOSSIBLE: { waves: 25, enemiesPerWave: Array(25).fill(0).map((_, i) => 12 + Math.floor(i / 2)), enemySpeed: 2.0, lives: 1 },
};

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Enemy types
const ENEMY_TYPES = {
  WISP: { color: '#9b59b6', size: 15, speed: 80, health: 1, score: 10, knockback: 1 },
  BAT: { color: '#2c3e50', size: 18, speed: 150, health: 1, score: 20, knockback: 1.2 },
  HAWK: { color: '#c0392b', size: 22, speed: 200, health: 2, score: 30, knockback: 1.5 },
  WRAITH: { color: '#1a1a2e', size: 35, speed: 100, health: 5, score: 100, knockback: 2.5, isBoss: true },
};

// Cloud platforms
function generateClouds() {
  return [
    { x: 400, y: 400, width: 200, height: 30, visible: true },
    { x: 150, y: 300, width: 150, height: 25, visible: true },
    { x: 550, y: 300, width: 150, height: 25, visible: true },
    { x: 300, y: 200, width: 180, height: 28, visible: true },
    { x: 50, y: 450, width: 120, height: 25, visible: true, fades: true, fadeTimer: 0 },
    { x: 630, y: 450, width: 120, height: 25, visible: true, fades: true, fadeTimer: 0 },
    { x: 350, y: 520, width: 100, height: 20, visible: true },
  ];
}

function spawnEnemy(wave, settings) {
  const types = ['WISP'];
  if (wave >= 2) types.push('BAT');
  if (wave >= 4) types.push('HAWK');

  // Boss every 5 waves
  const isBoss = wave > 0 && wave % 5 === 0;
  const type = isBoss ? 'WRAITH' : types[Math.floor(Math.random() * types.length)];
  const enemyType = ENEMY_TYPES[type];

  // Spawn from edges
  const side = Math.floor(Math.random() * 4);
  let x, y;
  switch (side) {
    case 0: x = -30; y = Math.random() * SCREEN_HEIGHT; break;
    case 1: x = SCREEN_WIDTH + 30; y = Math.random() * SCREEN_HEIGHT; break;
    case 2: x = Math.random() * SCREEN_WIDTH; y = -30; break;
    case 3: x = Math.random() * SCREEN_WIDTH; y = SCREEN_HEIGHT + 30; break;
  }

  return {
    x, y,
    vx: 0, vy: 0,
    type,
    ...enemyType,
    speed: enemyType.speed * settings.enemySpeed,
    maxHealth: enemyType.health,
    stunTimer: 0,
  };
}

export default function OwlRealm({
  difficulty = { key: 'NORMAL', level: 3 },
  freeMode = false,
  onComplete,
  onQuit,
  onToggleFreeMode,
}) {
  // Handle both object and string difficulty formats
  const difficultyKey = typeof difficulty === 'object' ? difficulty.key?.toUpperCase() : difficulty?.toUpperCase();

  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [lives, setLives] = useState(4);
  const [coins, setCoins] = useState(0);
  const [wave, setWave] = useState({ current: 1, total: 10 });

  const gameDataRef = useRef(null);
  const keysRef = useRef({ left: false, right: false, up: false, down: false, flap: false, dive: false, screech: false });
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

  // Mobile flap (jump) handler
  const handleMobileFlap = useCallback((isPressed) => {
    keysRef.current.flap = isPressed;
  }, []);

  useEffect(() => {
    const settings = DIFFICULTY_SETTINGS[difficultyKey] || DIFFICULTY_SETTINGS.NORMAL;

    gameDataRef.current = {
      settings,
      clouds: generateClouds(),
      player: {
        x: 400, y: 350, vx: 0, vy: 0,
        width: 40, height: 35, onGround: false,
        stamina: 100, maxStamina: 100,
        facingRight: true, diving: false, screechCooldown: 0,
        invincible: 0,
      },
      enemies: [],
      coins: [],
      currentWave: 1,
      enemiesSpawned: 0,
      enemiesDefeated: 0,
      waveDelay: 2,
      spawnTimer: 0,
    };

    setWave({ current: 1, total: settings.waves });
    setLives(settings.lives);
    setTime(0);
    setScore(0);
    setCoins(0);
    setGameState('playing');
  }, [difficulty]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

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
        case ' ': keysRef.current.flap = true; break;
        case 'shift': keysRef.current.dive = true; break;
        case 'e': keysRef.current.screech = true; break;
        case 'escape': setGameState(gs => gs === 'playing' ? 'paused' : 'playing'); break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case 'a': case 'arrowleft': keysRef.current.left = false; break;
        case 'd': case 'arrowright': keysRef.current.right = false; break;
        case 'w': case 'arrowup': keysRef.current.up = false; break;
        case 's': case 'arrowdown': keysRef.current.down = false; break;
        case ' ': keysRef.current.flap = false; break;
        case 'shift': keysRef.current.dive = false; break;
        case 'e': keysRef.current.screech = false; break;
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

      const { player, enemies, clouds, settings, coins: levelCoins } = data;
      const gravity = 400;
      const moveSpeed = 250;
      const flapForce = 300;
      const diveSpeed = 500;

      // Update cooldowns
      if (player.screechCooldown > 0) player.screechCooldown -= dt;
      if (player.invincible > 0) player.invincible -= dt;

      // Movement
      if (keys.left) {
        player.vx = -moveSpeed;
        player.facingRight = false;
      } else if (keys.right) {
        player.vx = moveSpeed;
        player.facingRight = true;
      } else {
        player.vx *= 0.9;
      }

      if (keys.up) player.vy -= 200 * dt;
      if (keys.down) player.vy += 200 * dt;

      // Flapping (uses stamina)
      if (keys.flap && player.stamina > 0) {
        player.vy = -flapForce;
        player.stamina -= 30 * dt;
      }

      // Diving attack
      player.diving = false;
      if (keys.dive && !player.onGround) {
        player.vy = diveSpeed;
        player.vx *= 0.5;
        player.diving = true;
      }

      // Screech (AOE knockback)
      if (keys.screech && player.screechCooldown <= 0) {
        player.screechCooldown = 3;
        // Knockback nearby enemies
        for (const enemy of enemies) {
          const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
          if (dist < 150) {
            const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            enemy.vx += Math.cos(angle) * 400;
            enemy.vy += Math.sin(angle) * 400;
            enemy.stunTimer = 1;
          }
        }
      }

      // Gravity
      if (!player.onGround && !keys.flap) {
        player.vy += gravity * dt;
      }

      // Apply velocity
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Platform collision
      player.onGround = false;
      for (const cloud of clouds) {
        if (!cloud.visible) continue;

        if (player.x + player.width > cloud.x &&
            player.x < cloud.x + cloud.width &&
            player.y + player.height > cloud.y &&
            player.y + player.height < cloud.y + cloud.height + 15 &&
            player.vy >= 0) {
          player.y = cloud.y - player.height;
          player.vy = 0;
          player.onGround = true;
          player.stamina = Math.min(player.maxStamina, player.stamina + 50 * dt);
        }
      }

      // Screen bounds - death if fall off
      if (player.y > SCREEN_HEIGHT + 50 ||
          player.y < -100 ||
          player.x < -50 ||
          player.x > SCREEN_WIDTH + 50) {
        loseLife();
      }

      // Fading clouds
      for (const cloud of clouds) {
        if (cloud.fades) {
          cloud.fadeTimer += dt;
          cloud.visible = Math.sin(cloud.fadeTimer) > -0.3;
        }
      }

      // Wave management
      const waveEnemies = settings.enemiesPerWave[data.currentWave - 1] || 5;

      if (data.waveDelay > 0) {
        data.waveDelay -= dt;
      } else if (data.enemiesSpawned < waveEnemies) {
        data.spawnTimer -= dt;
        if (data.spawnTimer <= 0) {
          enemies.push(spawnEnemy(data.currentWave, settings));
          data.enemiesSpawned++;
          data.spawnTimer = 1.5 - Math.min(0.8, data.currentWave * 0.05);
        }
      } else if (enemies.length === 0) {
        // Wave complete
        if (data.currentWave >= settings.waves) {
          setGameState('won');
        } else {
          data.currentWave++;
          data.enemiesSpawned = 0;
          data.enemiesDefeated = 0;
          data.waveDelay = 3;
          setWave(w => ({ ...w, current: data.currentWave }));
        }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.stunTimer > 0) {
          enemy.stunTimer -= dt;
          enemy.vx *= 0.95;
          enemy.vy *= 0.95;
        } else {
          // AI: move towards player
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 10) {
            enemy.vx += (dx / dist) * enemy.speed * dt * 2;
            enemy.vy += (dy / dist) * enemy.speed * dt * 2;
          }

          // Speed limit
          const speed = Math.sqrt(enemy.vx ** 2 + enemy.vy ** 2);
          if (speed > enemy.speed) {
            enemy.vx = (enemy.vx / speed) * enemy.speed;
            enemy.vy = (enemy.vy / speed) * enemy.speed;
          }
        }

        // Apply velocity
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        // Check collision with player
        const playerDist = Math.sqrt((enemy.x - (player.x + player.width / 2)) ** 2 +
                                     (enemy.y - (player.y + player.height / 2)) ** 2);

        if (playerDist < enemy.size + 20) {
          if (player.diving) {
            // Player damages enemy
            enemy.health--;
            enemy.vx = player.vx * 0.5;
            enemy.vy = 200;
            enemy.stunTimer = 0.5;

            if (enemy.health <= 0) {
              // Enemy defeated
              setScore(s => s + enemy.score);
              data.enemiesDefeated++;

              // Drop coin
              if (Math.random() < 0.3) {
                levelCoins.push({ x: enemy.x, y: enemy.y, collected: false });
              }

              enemies.splice(i, 1);
            }
          } else if (player.invincible <= 0) {
            // Player hit
            const knockbackAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            player.vx = Math.cos(knockbackAngle) * 300 * enemy.knockback;
            player.vy = Math.sin(knockbackAngle) * 300 * enemy.knockback;
            player.invincible = 1;
            loseLife();
          }
        }

        // Remove enemies that fall off
        if (enemy.y > SCREEN_HEIGHT + 100 ||
            enemy.y < -100 ||
            enemy.x < -100 ||
            enemy.x > SCREEN_WIDTH + 100) {
          enemies.splice(i, 1);
        }
      }

      // Coin collection
      for (const coin of levelCoins) {
        if (coin.collected) continue;
        const dist = Math.sqrt((coin.x - (player.x + player.width / 2)) ** 2 +
                               (coin.y - (player.y + player.height / 2)) ** 2);
        if (dist < 30) {
          coin.collected = true;
          setCoins(c => c + 1);
          setScore(s => s + 50);
        }
      }

      function loseLife() {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState('lost');
          } else {
            // Respawn
            player.x = 400;
            player.y = 300;
            player.vx = 0;
            player.vy = 0;
            player.invincible = 2;
          }
          return newLives;
        });
      }
    };

    const render = (ctx) => {
      const data = gameDataRef.current;
      if (!data) return;

      const { player, enemies, clouds, coins: levelCoins, currentWave, waveDelay, settings } = data;

      // Starry night sky
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 100; i++) {
        const x = (i * 79) % SCREEN_WIDTH;
        const y = (i * 53) % SCREEN_HEIGHT;
        const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 + twinkle * 0.4;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Moon
      ctx.fillStyle = '#ffffd0';
      ctx.beginPath();
      ctx.arc(100, 80, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffe0';
      ctx.beginPath();
      ctx.arc(95, 75, 35, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      for (const cloud of clouds) {
        if (!cloud.visible) continue;

        const alpha = cloud.fades ? (Math.sin(cloud.fadeTimer) * 0.5 + 0.5) : 1;
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ecf0f1';

        // Cloud shape
        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.width * 0.3, cloud.y + cloud.height * 0.5, cloud.width * 0.35, cloud.height * 0.8, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + cloud.width * 0.6, cloud.y + cloud.height * 0.4, cloud.width * 0.3, cloud.height * 0.7, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + cloud.width * 0.8, cloud.y + cloud.height * 0.5, cloud.width * 0.25, cloud.height * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Coins
      for (const coin of levelCoins) {
        if (coin.collected) continue;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enemies
      for (const enemy of enemies) {
        const stunFlash = enemy.stunTimer > 0 && Math.sin(Date.now() / 50) > 0;

        if (enemy.isBoss) {
          // Boss: Shadow Wraith
          ctx.fillStyle = stunFlash ? '#666' : enemy.color;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
          ctx.fill();

          // Wraith cloak
          ctx.fillStyle = stunFlash ? '#444' : '#0d0d1a';
          ctx.beginPath();
          ctx.moveTo(enemy.x - enemy.size, enemy.y);
          ctx.quadraticCurveTo(enemy.x, enemy.y + enemy.size * 2, enemy.x + enemy.size, enemy.y);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath();
          ctx.arc(enemy.x - 10, enemy.y - 5, 5, 0, Math.PI * 2);
          ctx.arc(enemy.x + 10, enemy.y - 5, 5, 0, Math.PI * 2);
          ctx.fill();

          // Health bar
          ctx.fillStyle = '#333';
          ctx.fillRect(enemy.x - 25, enemy.y - enemy.size - 15, 50, 6);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(enemy.x - 25, enemy.y - enemy.size - 15, 50 * (enemy.health / enemy.maxHealth), 6);
        } else if (enemy.type === 'WISP') {
          ctx.fillStyle = stunFlash ? '#666' : enemy.color;
          ctx.shadowBlur = 20;
          ctx.shadowColor = enemy.color;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (enemy.type === 'BAT') {
          ctx.fillStyle = stunFlash ? '#666' : enemy.color;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          // Wings
          const wingFlap = Math.sin(Date.now() / 50) * 0.3;
          ctx.beginPath();
          ctx.moveTo(enemy.x - enemy.size * 0.5, enemy.y);
          ctx.quadraticCurveTo(enemy.x - enemy.size * 1.2, enemy.y - enemy.size * (0.5 + wingFlap), enemy.x - enemy.size * 0.3, enemy.y - enemy.size * 0.3);
          ctx.quadraticCurveTo(enemy.x + enemy.size * 1.2, enemy.y - enemy.size * (0.5 + wingFlap), enemy.x + enemy.size * 0.5, enemy.y);
          ctx.fill();
        } else if (enemy.type === 'HAWK') {
          ctx.fillStyle = stunFlash ? '#666' : enemy.color;
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y - enemy.size);
          ctx.lineTo(enemy.x - enemy.size, enemy.y + enemy.size * 0.3);
          ctx.lineTo(enemy.x, enemy.y + enemy.size * 0.5);
          ctx.lineTo(enemy.x + enemy.size, enemy.y + enemy.size * 0.3);
          ctx.fill();
        }
      }

      // Player (owl)
      const px = player.x;
      const py = player.y;

      // Invincibility flash
      if (player.invincible > 0 && Math.sin(Date.now() / 50) > 0) {
        ctx.globalAlpha = 0.5;
      }

      // Dive effect
      if (player.diving) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f1c40f';
      }

      // Body
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(px + player.width / 2, py + player.height / 2 + 5, 18, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Belly
      ctx.fillStyle = '#DEB887';
      ctx.beginPath();
      ctx.ellipse(px + player.width / 2, py + player.height / 2 + 8, 12, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(px + player.width / 2, py + 10, 16, 0, Math.PI * 2);
      ctx.fill();

      // Face disc
      ctx.fillStyle = '#F5DEB3';
      ctx.beginPath();
      ctx.arc(px + player.width / 2, py + 12, 12, 0, Math.PI * 2);
      ctx.fill();

      // Ear tufts
      ctx.fillStyle = '#5D3A1A';
      ctx.beginPath();
      ctx.moveTo(px + player.width / 2 - 12, py + 5);
      ctx.lineTo(px + player.width / 2 - 8, py - 8);
      ctx.lineTo(px + player.width / 2 - 4, py + 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + player.width / 2 + 4, py + 5);
      ctx.lineTo(px + player.width / 2 + 8, py - 8);
      ctx.lineTo(px + player.width / 2 + 12, py + 5);
      ctx.fill();

      // Eyes
      const eyeDir = player.facingRight ? 2 : -2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(px + player.width / 2 - 5, py + 10, 5, 0, Math.PI * 2);
      ctx.arc(px + player.width / 2 + 5, py + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(px + player.width / 2 - 5 + eyeDir, py + 10, 2.5, 0, Math.PI * 2);
      ctx.arc(px + player.width / 2 + 5 + eyeDir, py + 10, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.moveTo(px + player.width / 2, py + 15);
      ctx.lineTo(px + player.width / 2 - 4, py + 20);
      ctx.lineTo(px + player.width / 2 + 4, py + 20);
      ctx.fill();

      // Wings
      const wingFlap = Math.sin(Date.now() / 100) * 0.2;
      ctx.fillStyle = '#6B4423';
      ctx.beginPath();
      ctx.ellipse(px + 5, py + 20, 12, 18 + wingFlap * 10, -0.3, 0, Math.PI * 2);
      ctx.ellipse(px + player.width - 5, py + 20, 12, 18 + wingFlap * 10, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Screech effect
      if (player.screechCooldown > 2.5) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const radius = 30 + i * 40;
          ctx.beginPath();
          ctx.arc(px + player.width / 2, py + player.height / 2, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Stamina bar
      ctx.fillStyle = '#333';
      ctx.fillRect(20, SCREEN_HEIGHT - 30, 100, 15);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(20, SCREEN_HEIGHT - 30, 100 * (player.stamina / player.maxStamina), 15);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(20, SCREEN_HEIGHT - 30, 100, 15);

      // Screech cooldown
      if (player.screechCooldown > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(130, SCREEN_HEIGHT - 30, 60, 15);
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(130, SCREEN_HEIGHT - 30, 60 * (1 - player.screechCooldown / 3), 15);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(130, SCREEN_HEIGHT - 30, 60, 15);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText('E', 155, SCREEN_HEIGHT - 19);
      }

      // Wave announcement
      if (waveDelay > 0 && waveDelay < 2.5) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Wave ${currentWave}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        ctx.textAlign = 'left';
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
    const settings = DIFFICULTY_SETTINGS[difficultyKey] || DIFFICULTY_SETTINGS.NORMAL;

    gameDataRef.current = {
      settings,
      clouds: generateClouds(),
      player: {
        x: 400, y: 350, vx: 0, vy: 0,
        width: 40, height: 35, onGround: false,
        stamina: 100, maxStamina: 100,
        facingRight: true, diving: false, screechCooldown: 0,
        invincible: 0,
      },
      enemies: [],
      coins: [],
      currentWave: 1,
      enemiesSpawned: 0,
      enemiesDefeated: 0,
      waveDelay: 2,
      spawnTimer: 0,
    };

    setWave({ current: 1, total: settings.waves });
    setLives(settings.lives);
    setTime(0);
    setScore(0);
    setCoins(0);
    setGameState('playing');
  }, [difficulty]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      const settings = DIFFICULTY_SETTINGS[difficultyKey];
      const timeBonus = Math.max(0, (settings.waves * 20 - time) * 5);
      const livesBonus = lives * 500;
      const finalScore = score + timeBonus + livesBonus;
      onComplete({ score: finalScore, time, difficulty, waves: wave.total, coins, lives });
    }
  }, [onComplete, difficulty, score, time, lives, wave, coins]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0a1a' }}>
      <GameHUD
        freeMode={freeMode}
        onToggleFreeMode={onToggleFreeMode}
        collectibles={wave}
        collectibleIcon="🌊"
        coins={coins}
        time={time}
        lives={lives}
        maxLives={DIFFICULTY_SETTINGS[difficultyKey]?.lives || 4}
        isPaused={gameState === 'paused'}
        onPause={handlePause}
        onRestart={handleRestart}
        onQuit={onQuit}
        realmName="The Night Sky"
      />

      <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}
        style={{ flex: 1, maxWidth: '100%', maxHeight: 'calc(100vh - 100px)', margin: 'auto', display: 'block' }} />

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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{gameState === 'won' ? '🦉' : '💔'}</div>
            <h2 style={{ color: gameState === 'won' ? '#9b59b6' : '#ff6666', fontSize: '28px', marginBottom: '24px' }}>
              {gameState === 'won' ? 'Shadows Conquered!' : 'Game Over'}
            </h2>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.8 }}>
              <div>Score: <span style={{ color: '#fff' }}>{score}</span></div>
              <div>Time: <span style={{ color: '#fff' }}>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</span></div>
              <div>Waves: <span style={{ color: '#fff' }}>{wave.current}/{wave.total}</span></div>
              <div>Coins: <span style={{ color: '#FFD700' }}>{coins}</span></div>
              <div>Lives: <span style={{ color: '#e74c3c' }}>{lives}</span></div>
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
        onJump={handleMobileFlap}
        jumpLabel="FLAP"
      />
    </div>
  );
}
