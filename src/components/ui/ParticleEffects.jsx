"use client";

import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';

// Particle effects context
const ParticleContext = createContext(null);

export function ParticleProvider({ children }) {
  const [particles, setParticles] = useState([]);
  const idCounterRef = useRef(0);

  const spawnParticles = useCallback((config) => {
    const {
      x,
      y,
      count = 10,
      color = '#ffd700',
      colors = null, // array of colors for variety
      size = 6,
      sizeVariance = 2,
      speed = 5,
      speedVariance = 2,
      gravity = 0.1,
      friction = 0.98,
      lifetime = 1000,
      lifetimeVariance = 200,
      spread = Math.PI * 2, // full circle
      direction = -Math.PI / 2, // up
      shape = 'circle', // circle, square, star, emoji
      emoji = null,
      trail = false,
      glow = false,
      fade = true,
      shrink = true,
    } = config;

    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const angle = direction + (Math.random() - 0.5) * spread;
      const particleSpeed = speed + (Math.random() - 0.5) * speedVariance;
      const particleColor = colors ? colors[Math.floor(Math.random() * colors.length)] : color;
      const particleSize = size + (Math.random() - 0.5) * sizeVariance;
      const particleLifetime = lifetime + (Math.random() - 0.5) * lifetimeVariance;

      newParticles.push({
        id: ++idCounterRef.current,
        x,
        y,
        vx: Math.cos(angle) * particleSpeed,
        vy: Math.sin(angle) * particleSpeed,
        size: particleSize,
        initialSize: particleSize,
        color: particleColor,
        lifetime: particleLifetime,
        maxLifetime: particleLifetime,
        gravity,
        friction,
        shape,
        emoji,
        trail,
        glow,
        fade,
        shrink,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => {
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * p.friction,
            vy: p.vy * p.friction + p.gravity,
            lifetime: p.lifetime - 16,
            rotation: p.rotation + p.rotationSpeed,
            size: p.shrink ? p.initialSize * (p.lifetime / p.maxLifetime) : p.size,
          }))
          .filter(p => p.lifetime > 0);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  return (
    <ParticleContext.Provider value={{ particles, spawnParticles }}>
      {children}
      <ParticleCanvas particles={particles} />
    </ParticleContext.Provider>
  );
}

export function useParticles() {
  const context = useContext(ParticleContext);
  if (!context) {
    return { spawnParticles: () => {} };
  }
  return context;
}

// Particle canvas overlay
function ParticleCanvas({ particles }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      const alpha = p.fade ? p.lifetime / p.maxLifetime : 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      if (p.glow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
      }

      if (p.emoji) {
        ctx.font = `${p.size * 2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case 'square':
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            break;
          case 'star':
            drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
            ctx.fill();
            break;
          case 'circle':
          default:
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
      }

      ctx.restore();
    });
  }, [particles]);

  if (particles.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

// Draw a star shape
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

// Preset particle effects
export const ParticlePresets = {
  // Coin collected
  coinCollect: (x, y) => ({
    x,
    y,
    count: 8,
    color: '#ffd700',
    size: 6,
    speed: 4,
    gravity: 0.15,
    lifetime: 600,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    glow: true,
    shape: 'circle',
  }),

  // Essence collected
  essenceCollect: (x, y, color) => ({
    x,
    y,
    count: 20,
    color,
    size: 8,
    sizeVariance: 4,
    speed: 6,
    gravity: 0.05,
    lifetime: 1000,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    glow: true,
    trail: true,
    shape: 'star',
  }),

  // Jump dust
  jumpDust: (x, y) => ({
    x,
    y,
    count: 5,
    color: '#8b8b8b',
    size: 4,
    speed: 2,
    gravity: 0.05,
    lifetime: 300,
    spread: Math.PI * 0.8,
    direction: -Math.PI / 2,
    shape: 'circle',
    fade: true,
  }),

  // Landing impact
  landImpact: (x, y) => ({
    x,
    y,
    count: 10,
    color: '#6b6b6b',
    size: 4,
    speed: 3,
    gravity: 0.1,
    lifetime: 400,
    spread: Math.PI,
    direction: -Math.PI / 2,
    shape: 'circle',
    fade: true,
  }),

  // Dash trail
  dashTrail: (x, y, color = '#3b82f6') => ({
    x,
    y,
    count: 3,
    color,
    size: 10,
    speed: 0.5,
    gravity: 0,
    friction: 0.9,
    lifetime: 200,
    spread: Math.PI * 0.2,
    direction: Math.PI,
    shape: 'circle',
    shrink: true,
    fade: true,
  }),

  // Death explosion
  deathExplosion: (x, y) => ({
    x,
    y,
    count: 30,
    colors: ['#ef4444', '#f97316', '#fbbf24'],
    size: 8,
    sizeVariance: 4,
    speed: 8,
    speedVariance: 4,
    gravity: 0.2,
    lifetime: 800,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    shape: 'circle',
    glow: true,
  }),

  // Victory confetti
  victoryConfetti: (x, y) => ({
    x,
    y,
    count: 50,
    colors: ['#ffd700', '#4ade80', '#3b82f6', '#a855f7', '#ef4444'],
    size: 8,
    sizeVariance: 4,
    speed: 10,
    speedVariance: 5,
    gravity: 0.15,
    friction: 0.99,
    lifetime: 2000,
    lifetimeVariance: 500,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    shape: 'square',
  }),

  // Boss hit
  bossHit: (x, y) => ({
    x,
    y,
    count: 15,
    colors: ['#8b0000', '#a00000', '#c00000'],
    size: 10,
    speed: 6,
    gravity: 0.1,
    lifetime: 500,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    shape: 'circle',
    glow: true,
  }),

  // Realm unlock
  realmUnlock: (x, y, color) => ({
    x,
    y,
    count: 40,
    color,
    size: 12,
    sizeVariance: 6,
    speed: 8,
    gravity: -0.05,
    friction: 0.98,
    lifetime: 1500,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    shape: 'star',
    glow: true,
  }),

  // Sparkle effect
  sparkle: (x, y, color = '#ffffff') => ({
    x,
    y,
    count: 5,
    color,
    size: 4,
    speed: 1,
    gravity: 0,
    lifetime: 500,
    spread: Math.PI * 2,
    direction: 0,
    shape: 'star',
    glow: true,
    shrink: true,
  }),

  // Emoji burst
  emojiBurst: (x, y, emoji) => ({
    x,
    y,
    count: 8,
    emoji,
    size: 12,
    speed: 5,
    gravity: 0.1,
    lifetime: 1000,
    spread: Math.PI * 2,
    direction: -Math.PI / 2,
    shrink: false,
  }),
};
