"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import IntroModal from '../ui/IntroModal';
import { useAudio, SOUNDS } from '@/hooks/useAudio';

// ============================================================================
// AERO FIGHTERS STYLE 2D CANVAS SHMUP
// ============================================================================

// Game dimensions
const GAME_WIDTH = 480;
const GAME_HEIGHT = 720;

// Player settings
const PLAYER_SPEED = 6;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 56;
const PLAYER_HITBOX = 6; // Tiny hitbox for bullet hell dodging

// Difficulty level = stages to complete (1-7)
// difficulty.level is passed from DifficultySelect (1=Beginner to 7=Impossible)

// Weapon configurations per level
const WEAPONS = {
  1: { streams: 1, spread: 0, fireRate: 8, bulletSpeed: 14, damage: 1 },
  2: { streams: 2, spread: 12, fireRate: 7, bulletSpeed: 15, damage: 1 },
  3: { streams: 3, spread: 15, fireRate: 6, bulletSpeed: 16, damage: 1 },
  4: { streams: 5, spread: 12, fireRate: 5, bulletSpeed: 17, damage: 1, homing: true },
};

// Enemy definitions
const ENEMIES = {
  moth: { w: 36, h: 32, hp: 1, speed: 2, score: 100, color: '#8B6914', pattern: 'straight' },
  wasp: { w: 40, h: 36, hp: 2, speed: 3, score: 200, color: '#FFD700', pattern: 'sine', shoots: true },
  beetle: { w: 48, h: 44, hp: 4, speed: 1.5, score: 300, color: '#2E8B57', pattern: 'straight', shoots: true },
  hornet: { w: 44, h: 40, hp: 3, speed: 4, score: 400, color: '#FF6B00', pattern: 'swoop', shoots: true },
  dragonfly: { w: 52, h: 28, hp: 5, speed: 5, score: 500, color: '#4169E1', pattern: 'zigzag', shoots: true },
  mantis: { w: 56, h: 64, hp: 8, speed: 2, score: 800, color: '#32CD32', pattern: 'homing', shoots: true },
  // New enemies for later stages
  spider: { w: 50, h: 50, hp: 6, speed: 2.5, score: 600, color: '#4B0082', pattern: 'sine', shoots: true },
  firefly: { w: 30, h: 30, hp: 2, speed: 6, score: 350, color: '#FFFF00', pattern: 'zigzag', shoots: false },
  scorpion: { w: 55, h: 48, hp: 10, speed: 1.5, score: 900, color: '#8B0000', pattern: 'straight', shoots: true },
};

// Boss definitions
const BOSSES = {
  1: { name: 'MANTIS SCOUT', hp: 80, w: 120, h: 100, color: '#9ACD32' },
  2: { name: 'QUEEN BEE', hp: 120, w: 140, h: 110, color: '#FFD700' },
  3: { name: 'MYCELIUM MIND', hp: 180, w: 160, h: 140, color: '#8B4513' },
  4: { name: 'ARACHNE EMPRESS', hp: 250, w: 180, h: 150, color: '#800080' },
  5: { name: 'TEMPEST DRAGON', hp: 350, w: 200, h: 120, color: '#4169E1' },
  6: { name: 'THE WITHERING', hp: 500, w: 220, h: 180, color: '#556B2F' },
  7: { name: 'NIGHTMARE BLOOM', hp: 700, w: 240, h: 200, color: '#FF1493' },
};

// Stage waves - time-based spawning with unique enemies per stage
const STAGE_WAVES = {
  1: [ // Green Meadow - moths, wasps, beetles
    { t: 60, type: 'moth', count: 5, formation: 'v' },
    { t: 180, type: 'moth', count: 3, formation: 'line', side: 'left' },
    { t: 300, type: 'moth', count: 3, formation: 'line', side: 'right' },
    { t: 420, type: 'wasp', count: 3, formation: 'v' },
    { t: 540, type: 'moth', count: 7, formation: 'wave' },
    { t: 720, type: 'beetle', count: 2, formation: 'line' },
    { t: 900, type: 'wasp', count: 5, formation: 'v' },
    { t: 1080, type: 'moth', count: 8, formation: 'wave' },
    { t: 1260, type: 'beetle', count: 3, formation: 'line' },
    { t: 1500, type: 'wasp', count: 6, formation: 'diamond' },
  ],
  2: [ // Golden Hive - wasps, hornets, fireflies (new!)
    { t: 60, type: 'wasp', count: 5, formation: 'v' },
    { t: 200, type: 'firefly', count: 6, formation: 'wave' },
    { t: 400, type: 'hornet', count: 3, formation: 'line' },
    { t: 600, type: 'wasp', count: 7, formation: 'wave' },
    { t: 800, type: 'firefly', count: 8, formation: 'diamond' },
    { t: 1000, type: 'hornet', count: 4, formation: 'v' },
    { t: 1200, type: 'wasp', count: 8, formation: 'wave' },
    { t: 1400, type: 'firefly', count: 10, formation: 'wave' },
  ],
  3: [ // Fungal Forest - beetles, dragonflies, spiders (new!)
    { t: 60, type: 'beetle', count: 4, formation: 'v' },
    { t: 200, type: 'dragonfly', count: 3, formation: 'line' },
    { t: 400, type: 'spider', count: 2, formation: 'line' },
    { t: 600, type: 'beetle', count: 5, formation: 'diamond' },
    { t: 800, type: 'dragonfly', count: 4, formation: 'v' },
    { t: 1000, type: 'spider', count: 3, formation: 'wave' },
    { t: 1200, type: 'dragonfly', count: 5, formation: 'wave' },
  ],
  4: [ // Spider Lair - spiders, scorpions (new!)
    { t: 60, type: 'spider', count: 4, formation: 'v' },
    { t: 200, type: 'scorpion', count: 1, formation: 'line' },
    { t: 400, type: 'spider', count: 6, formation: 'wave' },
    { t: 600, type: 'scorpion', count: 2, formation: 'line' },
    { t: 800, type: 'spider', count: 5, formation: 'diamond' },
    { t: 1000, type: 'scorpion', count: 2, formation: 'v' },
    { t: 1200, type: 'spider', count: 8, formation: 'wave' },
  ],
  5: [ // Storm - dragonflies, mantises, fireflies
    { t: 60, type: 'dragonfly', count: 5, formation: 'v' },
    { t: 200, type: 'firefly', count: 10, formation: 'wave' },
    { t: 400, type: 'mantis', count: 2, formation: 'line' },
    { t: 600, type: 'dragonfly', count: 6, formation: 'diamond' },
    { t: 800, type: 'mantis', count: 3, formation: 'v' },
    { t: 1000, type: 'firefly', count: 12, formation: 'wave' },
  ],
  6: [ // Dying Autumn - scorpions, mantises, spiders
    { t: 60, type: 'scorpion', count: 3, formation: 'v' },
    { t: 200, type: 'mantis', count: 3, formation: 'line' },
    { t: 400, type: 'spider', count: 5, formation: 'wave' },
    { t: 600, type: 'scorpion', count: 3, formation: 'diamond' },
    { t: 800, type: 'mantis', count: 4, formation: 'v' },
    { t: 1000, type: 'spider', count: 6, formation: 'wave' },
  ],
  7: [ // Nightmare - everything!
    { t: 60, type: 'mantis', count: 4, formation: 'v' },
    { t: 200, type: 'scorpion', count: 3, formation: 'line' },
    { t: 400, type: 'spider', count: 6, formation: 'wave' },
    { t: 600, type: 'dragonfly', count: 8, formation: 'diamond' },
    { t: 800, type: 'scorpion', count: 4, formation: 'v' },
    { t: 1000, type: 'mantis', count: 5, formation: 'wave' },
  ],
};

const BOSS_TIME = 1800; // 30 seconds at 60fps

// ============================================================================
// DRAWING FUNCTIONS - Make everything look like Aero Fighters sprites
// ============================================================================

// Draw the butterfly player - detailed sprite-like rendering
function drawButterfly(ctx, x, y, weaponLevel, invincible, wingPhase) {
  ctx.save();
  ctx.translate(x, y);

  // Flicker when invincible
  if (invincible && Math.floor(Date.now() / 50) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const wingFlap = Math.sin(wingPhase) * 0.3;

  // Glow effect based on weapon level
  const glowColors = ['#00CED1', '#00FFFF', '#7FFFD4', '#FFFFFF'];
  ctx.shadowColor = glowColors[weaponLevel - 1] || '#00CED1';
  ctx.shadowBlur = 10 + weaponLevel * 5;

  // Wings - large and beautiful
  ctx.fillStyle = '#00CED1';

  // Left wing
  ctx.save();
  ctx.rotate(-0.2 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(-18, -5, 22, 28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Wing pattern
  ctx.fillStyle = '#7FFFD4';
  ctx.beginPath();
  ctx.ellipse(-20, -8, 12, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E0FFFF';
  ctx.beginPath();
  ctx.ellipse(-22, -10, 6, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right wing
  ctx.save();
  ctx.rotate(0.2 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(18, -5, 22, 28, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Wing pattern
  ctx.fillStyle = '#7FFFD4';
  ctx.beginPath();
  ctx.ellipse(20, -8, 12, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E0FFFF';
  ctx.beginPath();
  ctx.ellipse(22, -10, 6, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#008B8B';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body segments
  ctx.fillStyle = '#00CED1';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * 6, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#20B2AA';
  ctx.beginPath();
  ctx.arc(0, -18, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-3, -19, 3, 0, Math.PI * 2);
  ctx.arc(3, -19, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-3, -19, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -19, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Antennae
  ctx.strokeStyle = '#008B8B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -23);
  ctx.quadraticCurveTo(-8, -32, -6, -38);
  ctx.moveTo(3, -23);
  ctx.quadraticCurveTo(8, -32, 6, -38);
  ctx.stroke();

  // Antenna tips
  ctx.fillStyle = '#00FFFF';
  ctx.beginPath();
  ctx.arc(-6, -38, 3, 0, Math.PI * 2);
  ctx.arc(6, -38, 3, 0, Math.PI * 2);
  ctx.fill();

  // Hitbox indicator (small glowing core)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_HITBOX, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw enemy based on type - actual insect shapes
function drawEnemy(ctx, enemy) {
  const { x, y, type, hp, maxHp, phase } = enemy;
  const def = ENEMIES[type];

  ctx.save();
  ctx.translate(x, y);

  // Damage flash
  if (enemy.hitFlash > 0) {
    ctx.filter = 'brightness(3)';
  }

  const rot = Math.sin(phase * 0.1) * 0.1;
  ctx.rotate(rot);

  switch (type) {
    case 'moth':
      drawMoth(ctx, def.w, def.h, def.color, phase);
      break;
    case 'wasp':
      drawWasp(ctx, def.w, def.h, def.color, phase);
      break;
    case 'beetle':
      drawBeetle(ctx, def.w, def.h, def.color);
      break;
    case 'hornet':
      drawHornet(ctx, def.w, def.h, def.color, phase);
      break;
    case 'dragonfly':
      drawDragonfly(ctx, def.w, def.h, def.color, phase);
      break;
    case 'mantis':
      drawMantis(ctx, def.w, def.h, def.color, phase);
      break;
    case 'spider':
      drawSpider(ctx, def.w, def.h, def.color, phase);
      break;
    case 'firefly':
      drawFirefly(ctx, def.w, def.h, def.color, phase);
      break;
    case 'scorpion':
      drawScorpion(ctx, def.w, def.h, def.color, phase);
      break;
  }

  ctx.restore();
}

function drawMoth(ctx, w, h, color, phase) {
  const wingFlap = Math.sin(phase * 0.3) * 0.2;

  // Wings
  ctx.fillStyle = color;
  ctx.save();
  ctx.rotate(-wingFlap);
  ctx.beginPath();
  ctx.ellipse(-w/3, 0, w/3, h/2.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.rotate(wingFlap);
  ctx.beginPath();
  ctx.ellipse(w/3, 0, w/3, h/2.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wing patterns
  ctx.fillStyle = '#5C4A1F';
  ctx.beginPath();
  ctx.arc(-w/4, -2, 5, 0, Math.PI * 2);
  ctx.arc(w/4, -2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#3D2914';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, h/3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, -h/4, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawWasp(ctx, w, h, color, phase) {
  const wingBuzz = Math.sin(phase * 0.5) * 0.15;

  // Wings
  ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
  ctx.save();
  ctx.rotate(-0.2 - wingBuzz);
  ctx.beginPath();
  ctx.ellipse(-12, -8, 16, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.2 + wingBuzz);
  ctx.beginPath();
  ctx.ellipse(12, -8, 16, 8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Abdomen - striped
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 8, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-8, 2 + i * 5, 16, 2);
  }

  // Thorax
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -4, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, -14, 6, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(-3, -15, 3, 0, Math.PI * 2);
  ctx.arc(3, -15, 3, 0, Math.PI * 2);
  ctx.fill();

  // Stinger
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-3, 20);
  ctx.lineTo(3, 20);
  ctx.lineTo(0, 28);
  ctx.closePath();
  ctx.fill();
}

function drawBeetle(ctx, w, h, color) {
  // Shell
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, w/2 - 4, h/2 - 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shell line
  ctx.strokeStyle = '#1a3d1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -h/2 + 6);
  ctx.lineTo(0, h/2 - 6);
  ctx.stroke();

  // Shell highlights
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(-8, -8, 8, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#1a3d1a';
  ctx.beginPath();
  ctx.ellipse(0, -h/2 + 2, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mandibles
  ctx.strokeStyle = '#0a2a0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-6, -h/2 - 2, 6, Math.PI * 0.5, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(6, -h/2 - 2, 6, 0, Math.PI * 0.5);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#1a3d1a';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-w/2 + 4, i * 10);
    ctx.lineTo(-w/2 - 8, i * 10 + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w/2 - 4, i * 10);
    ctx.lineTo(w/2 + 8, i * 10 + 5);
    ctx.stroke();
  }
}

function drawHornet(ctx, w, h, color, phase) {
  const wingBuzz = Math.sin(phase * 0.6) * 0.2;

  // Large wings
  ctx.fillStyle = 'rgba(255, 200, 150, 0.5)';
  ctx.save();
  ctx.rotate(-0.3 - wingBuzz);
  ctx.beginPath();
  ctx.ellipse(-15, -5, 20, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.3 + wingBuzz);
  ctx.beginPath();
  ctx.ellipse(15, -5, 20, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 5, 10, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stripes
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(-10, -5 + i * 6, 20, 2);
  }

  // Thorax
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -12, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, -24, 7, 0, Math.PI * 2);
  ctx.fill();

  // Angry eyes
  ctx.fillStyle = '#FF3300';
  ctx.beginPath();
  ctx.arc(-4, -25, 4, 0, Math.PI * 2);
  ctx.arc(4, -25, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawDragonfly(ctx, w, h, color, phase) {
  const wingFlap = Math.sin(phase * 0.4) * 0.15;

  // Four wings
  ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Upper wings
  ctx.save();
  ctx.rotate(-0.1 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(-20, -4, 24, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.1 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(20, -4, 24, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Lower wings
  ctx.save();
  ctx.rotate(0.1 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(-18, 4, 20, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(-0.1 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(18, 4, 20, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Long body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-4, -8, 8, 50, 4);
  ctx.fill();

  // Body segments
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(-4, i * 7, 8, 2);
  }

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -12, 8, 0, Math.PI * 2);
  ctx.fill();

  // Big compound eyes
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.ellipse(-5, -12, 6, 7, -0.3, 0, Math.PI * 2);
  ctx.ellipse(5, -12, 6, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawMantis(ctx, w, h, color, phase) {
  const armSwing = Math.sin(phase * 0.15) * 0.2;

  // Raptorial arms
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Left arm
  ctx.save();
  ctx.rotate(-0.3 - armSwing);
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-25, -35);
  ctx.lineTo(-20, -50);
  ctx.stroke();
  // Spikes
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, -40);
  ctx.lineTo(-28, -38);
  ctx.moveTo(-24, -45);
  ctx.lineTo(-30, -43);
  ctx.stroke();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.rotate(0.3 + armSwing);
  ctx.beginPath();
  ctx.moveTo(10, -20);
  ctx.lineTo(25, -35);
  ctx.lineTo(20, -50);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(22, -40);
  ctx.lineTo(28, -38);
  ctx.moveTo(24, -45);
  ctx.lineTo(30, -43);
  ctx.stroke();
  ctx.restore();

  // Wings (folded)
  ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-8, 10, 12, 30, -0.1, 0, Math.PI * 2);
  ctx.ellipse(8, 10, 12, 30, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 25, 12, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thorax
  ctx.beginPath();
  ctx.ellipse(0, -5, 10, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head - triangular
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(-12, -25);
  ctx.lineTo(12, -25);
  ctx.closePath();
  ctx.fill();

  // Big alien eyes
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.ellipse(-6, -32, 5, 7, -0.3, 0, Math.PI * 2);
  ctx.ellipse(6, -32, 5, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-6, -32, 2, 0, Math.PI * 2);
  ctx.arc(6, -32, 2, 0, Math.PI * 2);
  ctx.fill();
}

// New enemy: Spider
function drawSpider(ctx, w, h, color, phase) {
  const legMove = Math.sin(phase * 0.2) * 0.15;

  // 8 legs
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const angle = (i - 1.5) * 0.3;
    const legPhase = legMove + i * 0.2;
    // Left legs
    ctx.save();
    ctx.rotate(-0.6 + angle);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-18, -8 + Math.sin(legPhase) * 5, -25, 10);
    ctx.stroke();
    ctx.restore();
    // Right legs
    ctx.save();
    ctx.rotate(0.6 - angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(18, -8 + Math.sin(legPhase) * 5, 25, 10);
    ctx.stroke();
    ctx.restore();
  }

  // Abdomen
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 10, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skull marking
  ctx.fillStyle = '#DDA0DD';
  ctx.beginPath();
  ctx.arc(0, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(-3, 6, 3, 0, Math.PI * 2);
  ctx.arc(3, 6, 3, 0, Math.PI * 2);
  ctx.fill();

  // Cephalothorax
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -8, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Multiple eyes
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(-5, -12, 4, 0, Math.PI * 2);
  ctx.arc(5, -12, 4, 0, Math.PI * 2);
  ctx.arc(-3, -6, 2, 0, Math.PI * 2);
  ctx.arc(3, -6, 2, 0, Math.PI * 2);
  ctx.fill();

  // Fangs
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(-6, 8);
  ctx.lineTo(-2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -2);
  ctx.lineTo(6, 8);
  ctx.lineTo(2, 2);
  ctx.closePath();
  ctx.fill();
}

// New enemy: Firefly (glowing!)
function drawFirefly(ctx, w, h, color, phase) {
  const glowPulse = Math.sin(phase * 0.2) * 0.5 + 0.5;

  // Glowing abdomen
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20 * glowPulse;
  ctx.beginPath();
  ctx.ellipse(0, 5, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2F2F2F';
  ctx.beginPath();
  ctx.ellipse(0, -5, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, -14, 5, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
  const wingFlap = Math.sin(phase * 0.4) * 0.2;
  ctx.save();
  ctx.rotate(-0.2 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(-8, -5, 10, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.2 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(8, -5, 10, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-2, -15, 2, 0, Math.PI * 2);
  ctx.arc(2, -15, 2, 0, Math.PI * 2);
  ctx.fill();

  // Antennae
  ctx.strokeStyle = '#2F2F2F';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -18);
  ctx.lineTo(-5, -24);
  ctx.moveTo(2, -18);
  ctx.lineTo(5, -24);
  ctx.stroke();
}

// New enemy: Scorpion
function drawScorpion(ctx, w, h, color, phase) {
  const clawSnap = Math.sin(phase * 0.15) * 0.3;
  const tailWave = Math.sin(phase * 0.1) * 0.2;

  // Legs (8)
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const y = -8 + i * 6;
    ctx.beginPath();
    ctx.moveTo(-12, y);
    ctx.lineTo(-22, y + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(22, y + 8);
    ctx.stroke();
  }

  // Body segments
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail (curved)
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.save();
  ctx.rotate(tailWave);
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.quadraticCurveTo(0, -35, -10, -45);
  ctx.stroke();
  // Stinger
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-10, -45);
  ctx.lineTo(-18, -50);
  ctx.lineTo(-12, -42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Claws
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(-18, 5);
  ctx.rotate(-0.3 + clawSnap);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.lineTo(12, 0);
  ctx.lineTo(4, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(18, 5);
  ctx.rotate(0.3 - clawSnap);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-4, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(-4, 12, 3, 0, Math.PI * 2);
  ctx.arc(4, 12, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Draw boss - unique visual for each stage
function drawBoss(ctx, boss) {
  const { x, y, type, hp, maxHp, phase } = boss;
  const def = BOSSES[type];

  ctx.save();
  ctx.translate(x, y);

  // Damage flash
  if (boss.hitFlash > 0) {
    ctx.filter = 'brightness(2)';
  }

  const pulse = Math.sin(phase * 0.05) * 0.3 + 0.7;

  switch (type) {
    case 1: // MANTIS SCOUT - Green praying mantis
      drawMantisBoss(ctx, def, phase, pulse);
      break;
    case 2: // QUEEN BEE - Golden bee queen
      drawQueenBeeBoss(ctx, def, phase, pulse);
      break;
    case 3: // MYCELIUM MIND - Mushroom monster
      drawMushroomBoss(ctx, def, phase, pulse);
      break;
    case 4: // ARACHNE EMPRESS - Spider queen
      drawSpiderBoss(ctx, def, phase, pulse);
      break;
    case 5: // TEMPEST DRAGON - Dragonfly dragon
      drawDragonflyBoss(ctx, def, phase, pulse);
      break;
    case 6: // THE WITHERING - Dying plant horror
      drawWitheringBoss(ctx, def, phase, pulse);
      break;
    case 7: // NIGHTMARE BLOOM - Final boss flower
      drawNightmareBloomBoss(ctx, def, phase, pulse);
      break;
    default:
      // Fallback generic boss
      ctx.shadowColor = def.color;
      ctx.shadowBlur = 20 * pulse;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, def.w / 2, def.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
  }

  // Weak point core (all bosses)
  ctx.fillStyle = '#FF0000';
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, 12 + Math.sin(phase * 0.1) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Stage 1 Boss: Mantis Scout
function drawMantisBoss(ctx, def, phase, pulse) {
  const armSwing = Math.sin(phase * 0.1) * 0.3;

  ctx.shadowColor = def.color;
  ctx.shadowBlur = 20 * pulse;

  // Wings
  ctx.fillStyle = 'rgba(150, 205, 50, 0.4)';
  ctx.beginPath();
  ctx.ellipse(-40, 0, 30, 50, -0.2, 0, Math.PI * 2);
  ctx.ellipse(40, 0, 30, 50, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, 20, 25, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thorax
  ctx.beginPath();
  ctx.ellipse(0, -20, 20, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Raptorial arms
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.save();
  ctx.rotate(-0.5 - armSwing);
  ctx.beginPath();
  ctx.moveTo(-15, -30);
  ctx.lineTo(-50, -50);
  ctx.lineTo(-40, -80);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.5 + armSwing);
  ctx.beginPath();
  ctx.moveTo(15, -30);
  ctx.lineTo(50, -50);
  ctx.lineTo(40, -80);
  ctx.stroke();
  ctx.restore();

  // Head
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(-25, -35);
  ctx.lineTo(25, -35);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.ellipse(-12, -45, 8, 10, -0.3, 0, Math.PI * 2);
  ctx.ellipse(12, -45, 8, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// Stage 2 Boss: Queen Bee
function drawQueenBeeBoss(ctx, def, phase, pulse) {
  const wingBuzz = Math.sin(phase * 0.5) * 0.2;

  ctx.shadowColor = def.color;
  ctx.shadowBlur = 25 * pulse;

  // Wings
  ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
  ctx.save();
  ctx.rotate(-0.3 - wingBuzz);
  ctx.beginPath();
  ctx.ellipse(-50, -20, 45, 25, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.3 + wingBuzz);
  ctx.beginPath();
  ctx.ellipse(50, -20, 45, 25, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Abdomen with stripes
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, 25, 35, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(-35, 5 + i * 12, 70, 4);
  }

  // Thorax
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, -20, 28, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crown
  ctx.fillStyle = '#FFD700';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 12, -55);
    ctx.lineTo(i * 12 - 6, -45);
    ctx.lineTo(i * 12 + 6, -45);
    ctx.closePath();
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, -45, 18, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.ellipse(-8, -48, 7, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(8, -48, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stinger
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-8, 70);
  ctx.lineTo(8, 70);
  ctx.lineTo(0, 90);
  ctx.closePath();
  ctx.fill();
}

// Stage 3 Boss: Mycelium Mind (Mushroom)
function drawMushroomBoss(ctx, def, phase, pulse) {
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 30 * pulse;

  // Spore particles
  ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + phase * 0.02;
    const dist = 70 + Math.sin(phase * 0.1 + i) * 20;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stem
  ctx.fillStyle = '#D2B48C';
  ctx.beginPath();
  ctx.roundRect(-25, 0, 50, 70, 10);
  ctx.fill();

  // Cap
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, -20, 70, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cap spots
  ctx.fillStyle = '#F5DEB3';
  ctx.beginPath();
  ctx.arc(-30, -30, 12, 0, Math.PI * 2);
  ctx.arc(25, -25, 15, 0, Math.PI * 2);
  ctx.arc(-10, -45, 10, 0, Math.PI * 2);
  ctx.arc(40, -10, 8, 0, Math.PI * 2);
  ctx.fill();

  // Creepy eyes on stem
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-10, 25, 10, 15, 0, 0, Math.PI * 2);
  ctx.ellipse(10, 25, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#800080';
  ctx.beginPath();
  ctx.arc(-10, 25, 5, 0, Math.PI * 2);
  ctx.arc(10, 25, 5, 0, Math.PI * 2);
  ctx.fill();
}

// Stage 4 Boss: Spider Queen
function drawSpiderBoss(ctx, def, phase, pulse) {
  const legMove = Math.sin(phase * 0.15) * 0.2;

  ctx.shadowColor = def.color;
  ctx.shadowBlur = 25 * pulse;

  // Legs (8 of them)
  ctx.strokeStyle = '#4B0082';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const angle = (i - 1.5) * 0.4;
    const legPhase = legMove + i * 0.3;
    // Left legs
    ctx.save();
    ctx.rotate(-0.8 + angle);
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.quadraticCurveTo(-60, -20 + Math.sin(legPhase) * 10, -80, 30);
    ctx.stroke();
    ctx.restore();
    // Right legs
    ctx.save();
    ctx.rotate(0.8 - angle);
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.quadraticCurveTo(60, -20 + Math.sin(legPhase) * 10, 80, 30);
    ctx.stroke();
    ctx.restore();
  }

  // Abdomen
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, 30, 45, 55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skull pattern on abdomen
  ctx.fillStyle = '#DDA0DD';
  ctx.beginPath();
  ctx.arc(0, 25, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(-8, 20, 6, 0, Math.PI * 2);
  ctx.arc(8, 20, 6, 0, Math.PI * 2);
  ctx.fill();

  // Cephalothorax
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, -25, 35, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Multiple eyes (8)
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(-15, -35, 8, 0, Math.PI * 2);
  ctx.arc(15, -35, 8, 0, Math.PI * 2);
  ctx.arc(-8, -25, 5, 0, Math.PI * 2);
  ctx.arc(8, -25, 5, 0, Math.PI * 2);
  ctx.arc(-20, -25, 4, 0, Math.PI * 2);
  ctx.arc(20, -25, 4, 0, Math.PI * 2);
  ctx.arc(-12, -18, 3, 0, Math.PI * 2);
  ctx.arc(12, -18, 3, 0, Math.PI * 2);
  ctx.fill();

  // Fangs
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(-15, 15);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.lineTo(15, 15);
  ctx.lineTo(5, 5);
  ctx.closePath();
  ctx.fill();
}

// Stage 5 Boss: Tempest Dragonfly
function drawDragonflyBoss(ctx, def, phase, pulse) {
  const wingFlap = Math.sin(phase * 0.3) * 0.15;

  ctx.shadowColor = def.color;
  ctx.shadowBlur = 30 * pulse;

  // Four large wings
  ctx.fillStyle = 'rgba(65, 105, 225, 0.4)';
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2;

  // Upper wings
  ctx.save();
  ctx.rotate(-0.1 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(-60, -10, 55, 18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.1 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(60, -10, 55, 18, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Lower wings
  ctx.save();
  ctx.rotate(0.1 + wingFlap);
  ctx.beginPath();
  ctx.ellipse(-55, 15, 45, 14, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(-0.1 - wingFlap);
  ctx.beginPath();
  ctx.ellipse(55, 15, 45, 14, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Long body/tail
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.roundRect(-12, 0, 24, 80, 12);
  ctx.fill();

  // Body segments
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(-12, 5 + i * 10, 24, 3);
  }

  // Thorax
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, -15, 25, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -45, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Giant compound eyes
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.ellipse(-12, -45, 14, 16, -0.3, 0, Math.PI * 2);
  ctx.ellipse(12, -45, 14, 16, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(-15, -50, 5, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(9, -50, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Stage 6 Boss: The Withering (dead plant horror)
function drawWitheringBoss(ctx, def, phase, pulse) {
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 20 * pulse;

  // Decaying roots/tendrils
  ctx.strokeStyle = '#3D3D0A';
  ctx.lineWidth = 8;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const wiggle = Math.sin(phase * 0.1 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
    ctx.quadraticCurveTo(
      Math.cos(angle) * 60 + wiggle,
      Math.sin(angle) * 60,
      Math.cos(angle) * 90,
      Math.sin(angle) * 90 + wiggle
    );
    ctx.stroke();
  }

  // Main decayed body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Decay spots
  ctx.fillStyle = '#2F2F0F';
  ctx.beginPath();
  ctx.arc(-20, -15, 12, 0, Math.PI * 2);
  ctx.arc(25, 10, 15, 0, Math.PI * 2);
  ctx.arc(-10, 25, 10, 0, Math.PI * 2);
  ctx.fill();

  // Skull-like face
  ctx.fillStyle = '#8B8B6B';
  ctx.beginPath();
  ctx.ellipse(0, -20, 30, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Empty eye sockets
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(-12, -25, 10, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(12, -25, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes inside
  ctx.fillStyle = '#FFFF00';
  ctx.shadowColor = '#FFFF00';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(-12, -25, 4, 0, Math.PI * 2);
  ctx.arc(12, -25, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Gaping mouth
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(0, 5, 15, 12, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Stage 7 Boss: Nightmare Bloom (final boss flower)
function drawNightmareBloomBoss(ctx, def, phase, pulse) {
  const petalWave = Math.sin(phase * 0.08);

  ctx.shadowColor = def.color;
  ctx.shadowBlur = 40 * pulse;

  // Outer petals (rotating)
  ctx.fillStyle = '#FF1493';
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2 + phase * 0.01);
    ctx.beginPath();
    ctx.ellipse(0, -70 - petalWave * 10, 25, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Inner petals
  ctx.fillStyle = '#FF69B4';
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i / 6) * Math.PI * 2 + Math.PI / 6 - phase * 0.015);
    ctx.beginPath();
    ctx.ellipse(0, -45, 18, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Central dome
  ctx.fillStyle = '#8B008B';
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();

  // Eye pattern in center
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris
  ctx.fillStyle = '#FF1493';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stem/tendrils below
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.quadraticCurveTo(-20, 70, 0, 100);
  ctx.stroke();

  // Thorns
  ctx.fillStyle = '#006400';
  ctx.beginPath();
  ctx.moveTo(-15, 60);
  ctx.lineTo(-30, 55);
  ctx.lineTo(-15, 70);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 80);
  ctx.lineTo(25, 75);
  ctx.lineTo(10, 90);
  ctx.closePath();
  ctx.fill();
}

// Draw player bullet - bright cyan energy
function drawPlayerBullet(ctx, bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);

  // Outer glow
  ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hot center
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(0, 0, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw homing missile
function drawHomingMissile(ctx, bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2);

  // Trail
  ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 20);
  ctx.closePath();
  ctx.fill();

  // Missile body
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tip
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -12, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw enemy bullet - dangerous red/orange
function drawEnemyBullet(ctx, bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);

  const size = bullet.size || 6;

  // Outer glow
  ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, size + 4, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = '#FF4400';
  ctx.shadowColor = '#FF4400';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();

  // Hot center
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw power-up
function drawPowerUp(ctx, powerUp) {
  ctx.save();
  ctx.translate(powerUp.x, powerUp.y);

  const bob = Math.sin(powerUp.phase * 0.1) * 3;
  ctx.translate(0, bob);
  ctx.rotate(powerUp.phase * 0.02);

  const colors = {
    P: { fill: '#00FF00', text: 'P', glow: '#00FF00' }, // Power
    F: { fill: '#FF00FF', text: 'F', glow: '#FF00FF' }, // Full Power
    B: { fill: '#FFFF00', text: 'B', glow: '#FFFF00' }, // Bomb
    S: { fill: '#FFD700', text: '$', glow: '#FFD700' }, // Score
    H: { fill: '#FF69B4', text: '+', glow: '#FF69B4' }, // Health
    I: { fill: '#FFFFFF', text: 'I', glow: '#FFFFFF' }, // Invincibility
    R: { fill: '#FF4500', text: 'R', glow: '#FF4500' }, // Rapid Fire
    X: { fill: '#00FFFF', text: '1UP', glow: '#00FFFF' }, // Extra Life
    D: { fill: '#9400D3', text: '2X', glow: '#9400D3' }, // Double Damage
  };

  const c = colors[powerUp.type] || colors.P;

  // Glow
  ctx.fillStyle = c.glow;
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  // Background
  ctx.fillStyle = c.fill;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // Letter
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.text, 0, 1);

  ctx.restore();
}

// Draw explosion
function drawExplosion(ctx, exp) {
  ctx.save();
  ctx.translate(exp.x, exp.y);

  const progress = exp.life / exp.maxLife;
  const size = exp.size * (1 + (1 - progress) * 2);

  // Multiple layers
  ctx.globalAlpha = progress;

  // Outer ring
  ctx.fillStyle = '#FF4400';
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();

  // Middle
  ctx.fillStyle = '#FFAA00';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Sparks
  ctx.fillStyle = '#FFFF00';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + exp.life * 0.1;
    const dist = size * 1.2 * (1 - progress);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 4 * progress, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Draw essence
function drawEssence(ctx, ess) {
  ctx.save();
  ctx.translate(ess.x, ess.y);
  ctx.rotate(ess.phase * 0.03);

  const pulse = Math.sin(ess.phase * 0.08) * 0.2 + 1;
  ctx.scale(pulse, pulse);

  // Glow
  ctx.fillStyle = '#00CED1';
  ctx.shadowColor = '#00CED1';
  ctx.shadowBlur = 25;

  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(15, 0);
  ctx.lineTo(0, 20);
  ctx.lineTo(-15, 0);
  ctx.closePath();
  ctx.fill();

  // Inner
  ctx.fillStyle = '#7FFFD4';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(9, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fill();

  // Core
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw scrolling background - unique for each stage
function drawBackground(ctx, scrollY, stage) {
  const stageThemes = [
    { // Stage 1 - Green Meadow
      colors: ['#0a2a0a', '#0d3d0d', '#1a5a1a'],
      particleColor: 'rgba(144, 238, 144, 0.4)',
      cloudColor: 'rgba(144, 238, 144, 0.15)',
      elements: 'grass'
    },
    { // Stage 2 - Golden Hive
      colors: ['#2a1a00', '#4a3000', '#6a4a00'],
      particleColor: 'rgba(255, 215, 0, 0.4)',
      cloudColor: 'rgba(255, 200, 0, 0.15)',
      elements: 'honeycomb'
    },
    { // Stage 3 - Purple Fungal Forest
      colors: ['#1a0a2a', '#2d0d3d', '#3a1a4a'],
      particleColor: 'rgba(186, 85, 211, 0.5)',
      cloudColor: 'rgba(148, 0, 211, 0.2)',
      elements: 'spores'
    },
    { // Stage 4 - Dark Spider Lair
      colors: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
      particleColor: 'rgba(128, 0, 128, 0.4)',
      cloudColor: 'rgba(75, 0, 130, 0.2)',
      elements: 'webs'
    },
    { // Stage 5 - Storm Clouds
      colors: ['#0a1a3a', '#0d2d5a', '#1a4a7a'],
      particleColor: 'rgba(135, 206, 250, 0.5)',
      cloudColor: 'rgba(70, 130, 180, 0.25)',
      elements: 'lightning'
    },
    { // Stage 6 - Dying Autumn
      colors: ['#2a1a0a', '#3d2d0d', '#4a3a1a'],
      particleColor: 'rgba(139, 90, 43, 0.5)',
      cloudColor: 'rgba(85, 107, 47, 0.2)',
      elements: 'leaves'
    },
    { // Stage 7 - Nightmare Void
      colors: ['#1a0020', '#2d0040', '#4a0060'],
      particleColor: 'rgba(255, 20, 147, 0.5)',
      cloudColor: 'rgba(255, 0, 128, 0.2)',
      elements: 'petals'
    },
  ];

  const theme = stageThemes[Math.min(stage - 1, 6)];

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, theme.colors[0]);
  gradient.addColorStop(0.5, theme.colors[1]);
  gradient.addColorStop(1, theme.colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Stage-specific background elements
  switch (theme.elements) {
    case 'grass':
      // Grass blades
      ctx.strokeStyle = 'rgba(34, 139, 34, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const x = (i * 47) % GAME_WIDTH;
        const y = (i * 83 + scrollY * 0.4) % (GAME_HEIGHT + 100);
        const sway = Math.sin(scrollY * 0.01 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway, y - 30, x + sway * 0.5, y - 60);
        ctx.stroke();
      }
      break;

    case 'honeycomb':
      // Hexagonal honeycomb pattern
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const x = (i * 67) % GAME_WIDTH;
        const y = (i * 91 + scrollY * 0.3) % (GAME_HEIGHT + 100);
        drawHexagon(ctx, x, y, 25);
      }
      break;

    case 'spores':
      // Floating spore particles
      ctx.fillStyle = 'rgba(186, 85, 211, 0.3)';
      for (let i = 0; i < 40; i++) {
        const x = (i * 53 + Math.sin(scrollY * 0.02 + i) * 30) % GAME_WIDTH;
        const y = (i * 61 + scrollY * 0.5) % GAME_HEIGHT;
        const size = 3 + (i % 5);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'webs':
      // Spider web strands
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const x1 = (i * 120) % GAME_WIDTH;
        const y1 = (i * 150 + scrollY * 0.2) % (GAME_HEIGHT + 200) - 100;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + 100, y1 + 150);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 80, y1 + 120);
        ctx.stroke();
      }
      break;

    case 'lightning':
      // Occasional lightning flashes
      if (Math.random() < 0.02) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }
      // Storm clouds
      ctx.fillStyle = 'rgba(50, 50, 80, 0.4)';
      for (let i = 0; i < 6; i++) {
        const x = (i * 130 + scrollY * 0.1) % (GAME_WIDTH + 100) - 50;
        const y = (i * 80 + scrollY * 0.15) % 200;
        ctx.beginPath();
        ctx.ellipse(x, y, 80, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'leaves':
      // Falling autumn leaves
      ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
      for (let i = 0; i < 25; i++) {
        const x = (i * 73 + Math.sin(scrollY * 0.03 + i * 2) * 40) % GAME_WIDTH;
        const y = (i * 67 + scrollY * 0.6) % GAME_HEIGHT;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(scrollY * 0.02 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;

    case 'petals':
      // Swirling flower petals
      ctx.fillStyle = 'rgba(255, 20, 147, 0.3)';
      for (let i = 0; i < 30; i++) {
        const angle = scrollY * 0.02 + i * 0.5;
        const x = (i * 61 + Math.sin(angle) * 50) % GAME_WIDTH;
        const y = (i * 79 + scrollY * 0.7) % GAME_HEIGHT;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
  }

  // Scrolling particles
  ctx.fillStyle = theme.particleColor;
  for (let i = 0; i < 50; i++) {
    const x = (i * 97 + scrollY * 0.1) % GAME_WIDTH;
    const y = (i * 73 + scrollY * (0.5 + (i % 3) * 0.3)) % GAME_HEIGHT;
    const size = 1 + (i % 3);
    ctx.fillRect(x, y, size, size);
  }

  // Scrolling clouds/shapes
  ctx.fillStyle = theme.cloudColor;
  for (let i = 0; i < 8; i++) {
    const x = (i * 123) % GAME_WIDTH - 30;
    const y = (i * 200 + scrollY * 0.3) % (GAME_HEIGHT + 100) - 50;
    ctx.beginPath();
    ctx.ellipse(x, y, 60 + i * 10, 20 + i * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Helper function to draw hexagon
function drawHexagon(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export default function InchwormRealm({
  onExit,
  onComplete,
  onEssenceCollected,
  difficulty = { key: 'NORMAL', level: 3 }
}) {
  // Handle both object and string difficulty formats
  const difficultyLevel = typeof difficulty === 'object' ? (difficulty.level || 3) : 3;
  const audio = useAudio();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const [showIntro, setShowIntro] = useState(true);
  const [showCocoon, setShowCocoon] = useState(false);
  const [gameState, setGameState] = useState('intro');
  const [displayState, setDisplayState] = useState({
    score: 0, lives: 3, hp: 3, bombs: 2, weaponLevel: 1,
    stage: 1, totalStages: 3, bossHP: 0, bossMaxHP: 0, bossName: '', essences: 0,
    invincible: false, rapidFire: false, doubleDamage: false, stageClear: false,
    isFinalBoss: false
  });

  // Initialize game state
  const initGame = useCallback(() => {
    // difficulty level is 1-7, corresponds to number of stages
    const totalStages = difficultyLevel;

    gameRef.current = {
      player: {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 80,
        hp: 3,
        lives: 3,
        weaponLevel: 1,
        bombs: 2,
        invincible: 180, // 3 seconds
        fireTimer: 0,
        wingPhase: 0,
        rapidFire: 0, // Rapid fire buff timer
        doubleDamage: 0, // Double damage buff timer
      },
      stage: {
        current: 1,
        total: totalStages,
        timer: 0,
        waveIndex: 0,
        bossActive: false,
        bossDefeated: false,
        transitioning: false,
        transitionTimer: 0,
      },
      scrollY: 0,
      score: 0,
      essencesCollected: 0,
      screenShake: 0,
      playerBullets: [],
      enemyBullets: [],
      enemies: [],
      powerUps: [],
      explosions: [],
      essences: [
        { x: 120, y: -500, collected: false, phase: 0 },
        { x: 360, y: -1200, collected: false, phase: 0 },
        { x: 240, y: -2000, collected: false, phase: 0 },
      ],
      boss: null,
      gameOver: false,
      victory: false,
    };
  }, [difficulty]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;

      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing' || !gameRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;

    const gameLoop = () => {
      const game = gameRef.current;
      if (!game || game.gameOver || game.victory) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const keys = keysRef.current;
      const player = game.player;
      const stage = game.stage;

      // === INPUT ===
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup'] || keys['ArrowUp']) dy = -1;
      if (keys['s'] || keys['arrowdown'] || keys['ArrowDown']) dy = 1;
      if (keys['a'] || keys['arrowleft'] || keys['ArrowLeft']) dx = -1;
      if (keys['d'] || keys['arrowright'] || keys['ArrowRight']) dx = 1;

      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      // Move player
      player.x += dx * PLAYER_SPEED;
      player.y += dy * PLAYER_SPEED;

      // Clamp to screen
      player.x = Math.max(PLAYER_WIDTH/2, Math.min(GAME_WIDTH - PLAYER_WIDTH/2, player.x));
      player.y = Math.max(GAME_HEIGHT/2, Math.min(GAME_HEIGHT - 40, player.y));

      // Wing animation
      player.wingPhase += 0.3;

      // === SHOOTING ===
      const shooting = keys[' '] || keys['j'] || keys['Space'];
      if (shooting && player.fireTimer <= 0) {
        const weapon = WEAPONS[player.weaponLevel];
        // Rapid fire halves the fire rate delay
        player.fireTimer = player.rapidFire > 0 ? Math.floor(weapon.fireRate / 2) : weapon.fireRate;
        // Double damage buff
        const damageMultiplier = player.doubleDamage > 0 ? 2 : 1;

        // Sound effect - powered up or normal
        if (player.weaponLevel >= 3) {
          audio.playSound(SOUNDS.BUTTERFLY_SHOOT_POWERED);
        } else {
          audio.playSound(SOUNDS.BUTTERFLY_SHOOT);
        }

        // Spawn bullets
        for (let i = 0; i < weapon.streams; i++) {
          const offset = (i - (weapon.streams - 1) / 2) * weapon.spread;
          game.playerBullets.push({
            x: player.x + offset,
            y: player.y - 25,
            vx: offset * 0.1,
            vy: -weapon.bulletSpeed,
            damage: weapon.damage * damageMultiplier,
            homing: false,
          });
        }

        // Homing missiles at level 4
        if (weapon.homing) {
          game.playerBullets.push({
            x: player.x - 20, y: player.y,
            vx: -2, vy: -8,
            damage: 2 * damageMultiplier, homing: true,
          });
          game.playerBullets.push({
            x: player.x + 20, y: player.y,
            vx: 2, vy: -8,
            damage: 2 * damageMultiplier, homing: true,
          });
        }
      }
      player.fireTimer--;

      // === BOMB ===
      if ((keys['shift'] || keys['k'] || keys['Shift']) && player.bombs > 0 && !game.bombing) {
        game.bombing = true;
        player.bombs--;
        player.invincible = Math.max(player.invincible, 120);
        game.screenShake = 20;

        // Bomb sound!
        audio.playSound(SOUNDS.BOMB_EXPLODE);

        // Clear enemy bullets
        game.enemyBullets = [];

        // Damage all enemies
        game.enemies.forEach(e => {
          e.hp -= 5;
          if (e.hp <= 0) {
            game.score += ENEMIES[e.type].score;
            spawnExplosion(game, e.x, e.y, 40);
            if (Math.random() < 0.3) spawnPowerUp(game, e.x, e.y);
          }
        });
        game.enemies = game.enemies.filter(e => e.hp > 0);

        // Damage boss
        if (game.boss) {
          game.boss.hp -= 20;
          game.boss.hitFlash = 10;
        }

        // Big explosion at player
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          game.explosions.push({
            x: player.x + Math.cos(angle) * 50,
            y: player.y + Math.sin(angle) * 50,
            life: 30, maxLife: 30, size: 30
          });
        }

        setTimeout(() => { game.bombing = false; }, 500);
      }

      // === UPDATE TIMERS ===
      if (player.invincible > 0) player.invincible--;
      if (player.rapidFire > 0) player.rapidFire--;
      if (player.doubleDamage > 0) player.doubleDamage--;
      if (game.screenShake > 0) game.screenShake--;

      // === UPDATE PLAYER BULLETS ===
      game.playerBullets.forEach(b => {
        if (b.homing) {
          // Find nearest target
          let target = null;
          let minDist = Infinity;

          game.enemies.forEach(e => {
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            if (dist < minDist) { minDist = dist; target = e; }
          });

          if (game.boss && game.boss.hp > 0) {
            const dist = Math.hypot(game.boss.x - b.x, game.boss.y - b.y);
            if (dist < minDist) target = game.boss;
          }

          if (target) {
            const angle = Math.atan2(target.y - b.y, target.x - b.x);
            b.vx += Math.cos(angle) * 0.5;
            b.vy += Math.sin(angle) * 0.5;
            const speed = Math.hypot(b.vx, b.vy);
            if (speed > 12) {
              b.vx = (b.vx / speed) * 12;
              b.vy = (b.vy / speed) * 12;
            }
          }
        }
        b.x += b.vx;
        b.y += b.vy;
      });
      game.playerBullets = game.playerBullets.filter(b =>
        b.y > -20 && b.y < GAME_HEIGHT + 20 && b.x > -20 && b.x < GAME_WIDTH + 20
      );

      // === UPDATE ENEMY BULLETS ===
      game.enemyBullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
      });
      game.enemyBullets = game.enemyBullets.filter(b =>
        b.y > -20 && b.y < GAME_HEIGHT + 20 && b.x > -20 && b.x < GAME_WIDTH + 20
      );

      // === UPDATE ENEMIES ===
      game.enemies.forEach(e => {
        e.phase++;
        if (e.hitFlash > 0) e.hitFlash--;

        const def = ENEMIES[e.type];

        // Movement patterns
        switch (e.pattern) {
          case 'straight':
            e.y += def.speed;
            break;
          case 'sine':
            e.x = e.startX + Math.sin(e.phase * 0.05) * 80;
            e.y += def.speed;
            break;
          case 'zigzag':
            e.x += e.dir * def.speed * 0.7;
            e.y += def.speed * 0.5;
            if (e.x < 40 || e.x > GAME_WIDTH - 40) e.dir *= -1;
            break;
          case 'swoop':
            if (e.phase < 60) {
              e.y += def.speed;
            } else if (e.phase < 120) {
              e.x += (e.startX > GAME_WIDTH/2 ? -1 : 1) * def.speed * 1.5;
            } else {
              e.y -= def.speed * 0.8;
            }
            break;
          case 'homing':
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            e.x += Math.cos(angle) * def.speed * 0.7;
            e.y += Math.sin(angle) * def.speed * 0.5;
            break;
        }

        // Shooting
        if (def.shoots && e.fireTimer <= 0 && e.y > 50 && e.y < GAME_HEIGHT - 100) {
          e.fireTimer = 60 + Math.random() * 60;

          // Aimed shot
          const aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
          game.enemyBullets.push({
            x: e.x, y: e.y + def.h/2,
            vx: Math.cos(aimAngle) * 4,
            vy: Math.sin(aimAngle) * 4,
            size: 6
          });
        }
        if (e.fireTimer > 0) e.fireTimer--;
      });
      game.enemies = game.enemies.filter(e => e.y < GAME_HEIGHT + 50);

      // === UPDATE BOSS ===
      if (game.boss) {
        const boss = game.boss;

        // Check for boss defeat FIRST - before any other logic
        if (boss.hp <= 0 && !stage.bossDefeated) {
          game.score += 10000 * stage.current;
          game.screenShake = 30;

          // Boss death sound!
          audio.playSound(SOUNDS.BOSS_DEATH);

          // Store position before clearing
          const bossX = boss.x;
          const bossY = boss.y;

          // Huge explosion
          for (let i = 0; i < 20; i++) {
            setTimeout(() => {
              spawnExplosion(game,
                bossX + (Math.random() - 0.5) * 100,
                bossY + (Math.random() - 0.5) * 80,
                50 + Math.random() * 30
              );
            }, i * 50);
          }

          // Drop power-ups
          for (let i = 0; i < 5; i++) {
            spawnPowerUp(game, bossX + (Math.random() - 0.5) * 100, bossY);
          }

          stage.bossDefeated = true;
          stage.transitioning = true;
          stage.transitionTimer = 180;

          // Stage clear sound (delayed a bit to not overlap with boss death)
          setTimeout(() => audio.playSound(SOUNDS.STAGE_CLEAR), 500);

          // Clear the boss
          game.boss = null;
          game.enemyBullets = []; // Clear all enemy bullets on boss defeat
        }
        // Only update boss if still alive
        else if (boss.hp > 0) {
          boss.phase++;
          if (boss.hitFlash > 0) boss.hitFlash--;

          // Movement
          const targetX = GAME_WIDTH/2 + Math.sin(boss.phase * 0.02) * 150;
          boss.x += (targetX - boss.x) * 0.03;

          if (boss.y < 100) boss.y += 2;

          // Boss shooting patterns based on HP
          const hpPercent = boss.hp / boss.maxHp;

          if (boss.fireTimer <= 0) {
            if (hpPercent > 0.6) {
              // Phase 1: Aimed bursts
              boss.fireTimer = 40;
              for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + i * 0.2;
                game.enemyBullets.push({
                  x: boss.x, y: boss.y + 50,
                  vx: Math.cos(angle) * 5,
                  vy: Math.sin(angle) * 5,
                  size: 8
                });
              }
            } else if (hpPercent > 0.3) {
              // Phase 2: Radial patterns
              boss.fireTimer = 25;
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + boss.phase * 0.05;
                game.enemyBullets.push({
                  x: boss.x, y: boss.y + 30,
                  vx: Math.cos(angle) * 4,
                  vy: Math.sin(angle) * 4,
                  size: 6
                });
              }
            } else {
              // Phase 3: Bullet hell
              boss.fireTimer = 15;
              for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2 + boss.phase * 0.08;
                game.enemyBullets.push({
                  x: boss.x, y: boss.y + 30,
                  vx: Math.cos(angle) * 5,
                  vy: Math.sin(angle) * 5,
                  size: 5
                });
              }
            }
          }
          boss.fireTimer--;
        }
      }

      // === UPDATE POWER-UPS ===
      game.powerUps.forEach(p => {
        p.y += 2;
        p.phase++;
      });
      game.powerUps = game.powerUps.filter(p => p.y < GAME_HEIGHT + 20);

      // === UPDATE EXPLOSIONS ===
      game.explosions.forEach(e => e.life--);
      game.explosions = game.explosions.filter(e => e.life > 0);

      // === UPDATE ESSENCES ===
      game.essences.forEach(e => {
        if (!e.collected) {
          e.y += 1;
          e.phase++;
        }
      });

      // === COLLISIONS ===

      // Player bullets vs enemies
      game.playerBullets.forEach(b => {
        game.enemies.forEach(e => {
          const def = ENEMIES[e.type];
          if (Math.abs(b.x - e.x) < def.w/2 && Math.abs(b.y - e.y) < def.h/2) {
            b.dead = true;
            e.hp -= b.damage;
            e.hitFlash = 5;

            if (e.hp <= 0) {
              game.score += def.score;
              spawnExplosion(game, e.x, e.y, Math.max(def.w, def.h));
              if (Math.random() < 0.15) spawnPowerUp(game, e.x, e.y);
              // Enemy death sound
              audio.playSound(SOUNDS.ENEMY_EXPLODE);
            } else {
              // Enemy hit sound (only sometimes to avoid spam)
              if (Math.random() < 0.3) audio.playSound(SOUNDS.ENEMY_HIT);
            }
          }
        });

        // vs boss
        if (game.boss && game.boss.hp > 0) {
          const boss = game.boss;
          const def = BOSSES[boss.type];
          if (Math.abs(b.x - boss.x) < def.w/2 && Math.abs(b.y - boss.y) < def.h/2) {
            b.dead = true;
            boss.hp -= b.damage;
            boss.hitFlash = 3;
            // Boss hit sound
            if (Math.random() < 0.2) audio.playSound(SOUNDS.BOSS_HIT);
          }
        }
      });
      game.playerBullets = game.playerBullets.filter(b => !b.dead);
      game.enemies = game.enemies.filter(e => e.hp > 0);

      // Enemy bullets vs player
      if (player.invincible <= 0) {
        game.enemyBullets.forEach(b => {
          if (Math.hypot(b.x - player.x, b.y - player.y) < PLAYER_HITBOX + (b.size || 6)) {
            b.dead = true;
            playerHit(game);
          }
        });
        game.enemyBullets = game.enemyBullets.filter(b => !b.dead);

        // Enemies vs player
        game.enemies.forEach(e => {
          const def = ENEMIES[e.type];
          if (Math.abs(e.x - player.x) < def.w/3 + PLAYER_HITBOX &&
              Math.abs(e.y - player.y) < def.h/3 + PLAYER_HITBOX) {
            playerHit(game);
            e.hp -= 2;
          }
        });
      }

      // Player vs power-ups
      game.powerUps.forEach(p => {
        if (Math.hypot(p.x - player.x, p.y - player.y) < 30) {
          p.dead = true;
          applyPowerUp(game, p.type);
        }
      });
      game.powerUps = game.powerUps.filter(p => !p.dead);

      // Player vs essences
      game.essences.forEach(e => {
        if (!e.collected && Math.hypot(e.x - player.x, e.y - player.y) < 35) {
          e.collected = true;
          game.essencesCollected++;
          game.score += 5000;
          onEssenceCollected && onEssenceCollected('cyan');
          audio.playSound(SOUNDS.ESSENCE_COLLECT);

          // Sparkle effect
          for (let i = 0; i < 12; i++) {
            game.explosions.push({
              x: e.x + (Math.random() - 0.5) * 40,
              y: e.y + (Math.random() - 0.5) * 40,
              life: 20, maxLife: 20, size: 15
            });
          }
        }
      });

      // === STAGE MANAGEMENT ===
      game.scrollY += 2;

      if (!stage.bossActive && !stage.transitioning) {
        stage.timer++;

        // Spawn waves
        const waves = STAGE_WAVES[stage.current] || STAGE_WAVES[1];
        while (stage.waveIndex < waves.length && waves[stage.waveIndex].t <= stage.timer) {
          spawnWave(game, waves[stage.waveIndex]);
          stage.waveIndex++;
        }

        // Spawn boss
        if (stage.timer >= BOSS_TIME && !stage.bossActive) {
          stage.bossActive = true;
          const bossDef = BOSSES[stage.current];
          game.boss = {
            type: stage.current,
            x: GAME_WIDTH / 2,
            y: -100,
            hp: bossDef.hp,
            maxHp: bossDef.hp,
            phase: 0,
            fireTimer: 60,
            hitFlash: 0,
          };
          // Boss spawn warning sound
          audio.playSound(SOUNDS.BOSS_SPAWN);
        }
      }

      // Stage transition
      if (stage.transitioning) {
        stage.transitionTimer--;
        if (stage.transitionTimer <= 0) {
          if (stage.current >= stage.total) {
            // Victory!
            game.victory = true;
            setGameState('victory');
            // Victory sound and stop music
            audio.stopButterflyMusic();
            audio.playSound(SOUNDS.VICTORY);
          } else {
            // Next stage
            stage.current++;
            stage.timer = 0;
            stage.waveIndex = 0;
            stage.bossActive = false;
            stage.bossDefeated = false;
            stage.transitioning = false;
            game.boss = null;
            game.enemyBullets = [];
            game.enemies = [];
          }
        }
      }

      // === RENDER ===
      ctx.save();

      // Screen shake
      if (game.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * game.screenShake,
          (Math.random() - 0.5) * game.screenShake
        );
      }

      // Background
      drawBackground(ctx, game.scrollY, stage.current);

      // Essences
      game.essences.forEach(e => {
        if (!e.collected && e.y > -30 && e.y < GAME_HEIGHT + 30) {
          drawEssence(ctx, e);
        }
      });

      // Power-ups
      game.powerUps.forEach(p => drawPowerUp(ctx, p));

      // Enemies
      game.enemies.forEach(e => drawEnemy(ctx, e));

      // Boss
      if (game.boss && game.boss.hp > 0) {
        drawBoss(ctx, game.boss);
      }

      // Player bullets
      game.playerBullets.forEach(b => {
        if (b.homing) {
          drawHomingMissile(ctx, b);
        } else {
          drawPlayerBullet(ctx, b);
        }
      });

      // Enemy bullets
      game.enemyBullets.forEach(b => drawEnemyBullet(ctx, b));

      // Player
      drawButterfly(ctx, player.x, player.y, player.weaponLevel,
        player.invincible > 0, player.wingPhase);

      // Explosions
      game.explosions.forEach(e => drawExplosion(ctx, e));

      ctx.restore();

      // === UPDATE UI ===
      const isFinalBoss = stage.bossActive && stage.current >= stage.total;
      setDisplayState({
        score: game.score,
        lives: player.lives,
        hp: player.hp,
        bombs: player.bombs,
        weaponLevel: player.weaponLevel,
        stage: stage.current,
        totalStages: stage.total,
        bossHP: game.boss?.hp || 0,
        bossMaxHP: game.boss?.maxHp || 0,
        bossName: game.boss ? BOSSES[game.boss.type]?.name : '',
        essences: game.essencesCollected,
        invincible: player.invincible > 0,
        rapidFire: player.rapidFire > 0,
        doubleDamage: player.doubleDamage > 0,
        stageClear: stage.transitioning,
        isFinalBoss: isFinalBoss,
      });

      // Check game over
      if (player.lives <= 0 && !game.gameOver) {
        game.gameOver = true;
        audio.stopButterflyMusic();
        audio.playSound(SOUNDS.PLAYER_DEATH);
        setGameState('gameover');
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [gameState, onEssenceCollected]);

  // Helper functions
  function playerHit(game) {
    game.player.hp--;
    game.player.invincible = 90;
    game.screenShake = 15;

    spawnExplosion(game, game.player.x, game.player.y, 30);

    // Play hit sound
    audio.playSound(SOUNDS.PLAYER_HIT);

    if (game.player.hp <= 0) {
      game.player.lives--;
      if (game.player.lives > 0) {
        game.player.hp = 3;
        game.player.x = GAME_WIDTH / 2;
        game.player.y = GAME_HEIGHT - 80;
        game.player.invincible = 180;
        game.player.weaponLevel = Math.max(1, game.player.weaponLevel - 1);
        // Lost a life sound
        audio.playSound(SOUNDS.PLAYER_DEATH);
      }
    }
  }

  function spawnExplosion(game, x, y, size) {
    game.explosions.push({ x, y, size, life: 25, maxLife: 25 });
  }

  function spawnPowerUp(game, x, y) {
    // Power-ups with weights: P=common, special ones=rare
    const types = ['P', 'P', 'P', 'P', 'S', 'S', 'B', 'H', 'H', 'I', 'R', 'D'];
    // Rare chance for extra life
    if (Math.random() < 0.05) {
      game.powerUps.push({ x, y, type: 'X', phase: 0 });
    } else {
      const type = types[Math.floor(Math.random() * types.length)];
      game.powerUps.push({ x, y, type, phase: 0 });
    }
  }

  function applyPowerUp(game, type) {
    switch (type) {
      case 'P':
        game.player.weaponLevel = Math.min(4, game.player.weaponLevel + 1);
        audio.playSound(SOUNDS.WEAPON_UPGRADE);
        break;
      case 'F':
        game.player.weaponLevel = 4;
        audio.playSound(SOUNDS.WEAPON_UPGRADE);
        break;
      case 'B':
        game.player.bombs = Math.min(6, game.player.bombs + 1);
        audio.playSound(SOUNDS.POWERUP);
        break;
      case 'S':
        game.score += 1000;
        audio.playSound(SOUNDS.COIN_COLLECT);
        break;
      case 'H':
        game.player.hp = Math.min(3, game.player.hp + 1);
        audio.playSound(SOUNDS.POWERUP);
        break;
      case 'I':
        game.player.invincible = Math.max(game.player.invincible, 300);
        audio.playSound(SOUNDS.POWERUP);
        break;
      case 'R':
        game.player.rapidFire = Math.max(game.player.rapidFire, 480);
        audio.playSound(SOUNDS.POWERUP);
        break;
      case 'X':
        game.player.lives = Math.min(9, game.player.lives + 1);
        audio.playSound(SOUNDS.EXTRA_LIFE);
        break;
      case 'D':
        game.player.doubleDamage = Math.max(game.player.doubleDamage, 480);
        audio.playSound(SOUNDS.POWERUP);
        break;
    }
  }

  function spawnWave(game, wave) {
    const def = ENEMIES[wave.type];
    const startX = wave.side === 'left' ? 60 : wave.side === 'right' ? GAME_WIDTH - 60 : GAME_WIDTH / 2;

    for (let i = 0; i < wave.count; i++) {
      let x, y;

      switch (wave.formation) {
        case 'line':
          x = startX + (i - (wave.count - 1) / 2) * 50;
          y = -50 - i * 20;
          break;
        case 'v':
          x = startX + (i - (wave.count - 1) / 2) * 40;
          y = -50 - Math.abs(i - (wave.count - 1) / 2) * 30;
          break;
        case 'diamond':
          const mid = (wave.count - 1) / 2;
          x = startX + (i - mid) * 45;
          y = -50 - (mid - Math.abs(i - mid)) * 25;
          break;
        case 'wave':
        default:
          x = startX + Math.sin(i * 0.8) * 100;
          y = -50 - i * 35;
          break;
      }

      game.enemies.push({
        x, y, startX: x,
        type: wave.type,
        hp: def.hp,
        maxHp: def.hp,
        pattern: def.pattern,
        phase: Math.random() * 100,
        fireTimer: 30 + Math.random() * 60,
        hitFlash: 0,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }
  }

  // Handlers
  const handleStart = () => {
    setShowIntro(false);
    setShowCocoon(true);
  };

  const handleCocoonComplete = () => {
    setShowCocoon(false);
    setGameState('playing');
    initGame();
    // Start the game music
    audio.startButterflyMusic();
  };

  const handleVictoryComplete = () => {
    // Stop game music and play victory
    audio.stopButterflyMusic();
    audio.playSound(SOUNDS.VICTORY);
    // Call onComplete to trigger VictoryCeremony which handles adding the pyramid shard
    onComplete && onComplete({ realm: 'inchworm', victory: true });
  };

  const handleRetry = () => {
    setGameState('playing');
    initGame();
    // Restart music
    audio.startButterflyMusic();
  };

  // Cleanup: stop music when component unmounts
  useEffect(() => {
    return () => {
      audio.stopButterflyMusic();
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      paddingTop: 60, // Account for navbar
      boxSizing: 'border-box',
    }}>
      {showIntro && (
        <IntroModal realm="inchworm" onStart={handleStart} />
      )}

      {showCocoon && (
        <CocoonCutscene onComplete={handleCocoonComplete} />
      )}

      {gameState === 'playing' && (
        <div style={{
          position: 'relative',
          border: '3px solid #00CED1',
          boxShadow: '0 0 30px rgba(0, 206, 209, 0.5), inset 0 0 30px rgba(0, 206, 209, 0.1)',
          borderRadius: 8,
        }}>
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            style={{ display: 'block' }}
          />
          <GameHUD
            score={displayState.score}
            lives={displayState.lives}
            hp={displayState.hp}
            bombs={displayState.bombs}
            weaponLevel={displayState.weaponLevel}
            stage={displayState.stage}
            bossHP={displayState.bossHP}
            bossMaxHP={displayState.bossMaxHP}
            bossName={displayState.bossName}
            essences={displayState.essences}
            invincible={displayState.invincible}
            rapidFire={displayState.rapidFire}
            doubleDamage={displayState.doubleDamage}
          />
          {/* Stage Clear overlay */}
          {displayState.stageClear && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 20,
            }}>
              <div style={{
                fontSize: 48,
                color: '#FFD700',
                fontWeight: 'bold',
                textShadow: '0 0 20px #FFD700, 2px 2px 0 #000',
                animation: 'stageClearPulse 0.5s ease-in-out infinite',
              }}>
                STAGE {displayState.stage} CLEAR!
              </div>
              <div style={{
                fontSize: 24,
                color: '#00CED1',
                marginTop: 20,
              }}>
                {displayState.stage < displayState.totalStages
                  ? `Next: Stage ${displayState.stage + 1}`
                  : 'Final Stage Complete!'}
              </div>
              <style>{`
                @keyframes stageClearPulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                }
              `}</style>
            </div>
          )}
          {/* Final Boss indicator */}
          {displayState.isFinalBoss && displayState.bossHP > 0 && (
            <div style={{
              position: 'absolute',
              top: 50,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 32,
                color: '#FF1493',
                fontWeight: 'bold',
                textShadow: '0 0 20px #FF1493, 0 0 40px #FF1493, 2px 2px 0 #000',
                animation: 'finalBossPulse 1s ease-in-out infinite',
                letterSpacing: '4px',
              }}>
                ★ FINAL BOSS ★
              </div>
              <style>{`
                @keyframes finalBossPulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.1); opacity: 0.8; }
                }
              `}</style>
            </div>
          )}
          {/* Exit button - positioned bottom-right, away from HUD */}
          <button
            onClick={() => {
              audio.stopButterflyMusic();
              onExit();
            }}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              background: 'rgba(0,0,0,0.85)',
              border: '2px solid #FF4444',
              borderRadius: 8,
              padding: '10px 20px',
              color: '#FF4444',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 30,
              fontFamily: '"Press Start 2P", monospace',
              textShadow: '1px 1px 2px #000',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,68,68,0.3)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0,0,0,0.85)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            EXIT
          </button>
        </div>
      )}

      {gameState === 'victory' && (
        <VictoryScreen
          score={displayState.score}
          essences={displayState.essencesCollected}
          onComplete={handleVictoryComplete}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverScreen
          score={displayState.score}
          onRetry={handleRetry}
          onQuit={onExit}
        />
      )}
    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function GameHUD({ score, lives, hp, bombs, weaponLevel, stage, bossHP, bossMaxHP, bossName, essences, invincible, rapidFire, doubleDamage }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '8px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 11,
      color: '#fff',
      textShadow: '2px 2px 0 #000',
      zIndex: 10,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
    }}>
      {/* Left - Score and Stage */}
      <div>
        <div style={{ color: '#FFD700', marginBottom: 6, fontSize: 10 }}>
          SCORE: {score.toString().padStart(8, '0')}
        </div>
        <div style={{ color: '#00CED1', fontSize: 10 }}>
          STAGE {stage}
        </div>
        <div style={{ color: '#00CED1', fontSize: 9, marginTop: 4 }}>
          ESSENCE: {essences}/3
        </div>
        {/* Active Buffs */}
        <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
          {invincible && (
            <span style={{
              background: '#FFFFFF',
              color: '#000',
              padding: '2px 4px',
              borderRadius: 3,
              fontSize: 8,
              animation: 'blink 0.3s infinite'
            }}>INV</span>
          )}
          {rapidFire && (
            <span style={{
              background: '#FF4500',
              color: '#FFF',
              padding: '2px 4px',
              borderRadius: 3,
              fontSize: 8,
              animation: 'blink 0.5s infinite'
            }}>RAPID</span>
          )}
          {doubleDamage && (
            <span style={{
              background: '#9400D3',
              color: '#FFF',
              padding: '2px 4px',
              borderRadius: 3,
              fontSize: 8,
              animation: 'blink 0.5s infinite'
            }}>2X DMG</span>
          )}
        </div>
      </div>

      {/* Center - Boss HP */}
      {bossHP > 0 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#FF4444', fontSize: 10, marginBottom: 4 }}>
            {bossName}
          </div>
          <div style={{
            width: 160,
            height: 12,
            background: '#333',
            border: '2px solid #fff',
            borderRadius: 4,
          }}>
            <div style={{
              width: `${(bossHP / bossMaxHP) * 100}%`,
              height: '100%',
              background: 'linear-gradient(180deg, #FF6666, #FF0000)',
              borderRadius: 2,
              transition: 'width 0.1s',
            }} />
          </div>
        </div>
      )}

      {/* Right - Lives, HP, Bombs, Weapon */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ marginBottom: 4 }}>
          {Array(3).fill(0).map((_, i) => (
            <span key={i} style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              background: i < hp ? '#FF4444' : '#333',
              borderRadius: '50%',
              marginLeft: 3,
              border: '1px solid #fff',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 9, marginBottom: 3 }}>
          LIVES: {'♥'.repeat(Math.min(lives, 9))}
        </div>
        <div style={{ fontSize: 9, color: '#FFFF00', marginBottom: 3 }}>
          BOMB: {'●'.repeat(bombs)}{'○'.repeat(Math.max(0, 6 - bombs))}
        </div>
        <div style={{ fontSize: 9, color: '#00FFFF' }}>
          WPN LV{weaponLevel}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function CocoonCutscene({ onComplete }) {
  const [showButterfly, setShowButterfly] = useState(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Quick cocoon pulse, then butterfly emerges, then game starts
    const t1 = setTimeout(() => setShowButterfly(true), 400);
    const t2 = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []); // Empty deps - run once only

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        width: 120,
        height: 180,
        background: showButterfly
          ? 'transparent'
          : 'radial-gradient(ellipse, #00CED1 0%, #008B8B 50%, #004040 100%)',
        borderRadius: '50%',
        boxShadow: showButterfly ? 'none' : '0 0 60px #00CED1',
        animation: !showButterfly ? 'cocoonPulse 0.2s ease-in-out infinite' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: showButterfly ? 100 : 0,
        transition: 'all 0.2s',
      }}>
        {showButterfly && '🦋'}
      </div>

      <style>{`
        @keyframes cocoonPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

function VictoryScreen({ score, essences, onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      {phase >= 0 && (
        <div style={{
          fontSize: 64,
          color: '#FFD700',
          textShadow: '0 0 30px #FFD700',
          marginBottom: 20,
        }}>
          VICTORY!
        </div>
      )}

      {phase >= 1 && (
        <div style={{ fontSize: 24, color: '#00CED1', marginBottom: 20 }}>
          "You've freed me, brave butterfly!"
        </div>
      )}

      {phase >= 2 && (
        <>
          <div style={{ fontSize: 18, color: '#00CED1', marginBottom: 10 }}>
            Cyan Essences: {essences}/3
          </div>
          <div style={{ fontSize: 18, color: '#FFD700', marginBottom: 30 }}>
            Pyramid Shard Layer 4 - "From the Chrysalis"
          </div>
        </>
      )}

      {phase >= 3 && (
        <>
          <div style={{ fontSize: 32, color: '#FFD700', marginBottom: 30 }}>
            FINAL SCORE: {score.toString().padStart(8, '0')}
          </div>
          <button
            onClick={onComplete}
            style={{
              padding: '15px 40px',
              fontSize: 20,
              background: 'linear-gradient(135deg, #00CED1, #008B8B)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 206, 209, 0.5)',
            }}
          >
            Return to Clock
          </button>
        </>
      )}
    </div>
  );
}

function GameOverScreen({ score, onRetry, onQuit }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        fontSize: 64,
        color: '#FF4444',
        textShadow: '0 0 30px #FF4444',
        marginBottom: 20,
      }}>
        GAME OVER
      </div>

      <div style={{ fontSize: 28, color: '#FFD700', marginBottom: 40 }}>
        SCORE: {score.toString().padStart(8, '0')}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <button
          onClick={onRetry}
          style={{
            padding: '15px 40px',
            fontSize: 18,
            background: 'linear-gradient(135deg, #00CED1, #008B8B)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          RETRY
        </button>
        <button
          onClick={onQuit}
          style={{
            padding: '15px 40px',
            fontSize: 18,
            background: 'linear-gradient(135deg, #666, #333)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          QUIT
        </button>
      </div>
    </div>
  );
}
