"use client";

import { useState, useEffect } from 'react';

// Icons for game stats
const Icons = {
  essence: ({ size = 16, color = '#FFA500' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <polygon points="8,1 15,12 1,12" fill={color} />
      <polygon points="8,4 12,11 4,11" fill="rgba(255,255,255,0.3)" />
    </svg>
  ),
  coin: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
      <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#DAA520" fontWeight="bold">$</text>
    </svg>
  ),
  timer: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="3" width="2" height="2" fill="currentColor" />
      <line x1="8" y1="9" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  heart: ({ size = 16, filled = true }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 14 C8 14 2 10 2 6 C2 3.5 4 2 6 2 C7 2 8 3 8 3 C8 3 9 2 10 2 C12 2 14 3.5 14 6 C14 10 8 14 8 14Z"
        fill={filled ? "#ff4444" : "none"}
        stroke="#ff4444"
        strokeWidth="1"
      />
    </svg>
  ),
  stamina: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1 L10 6 L15 6 L11 9 L13 15 L8 11 L3 15 L5 9 L1 6 L6 6 Z" fill="#00ff88" />
    </svg>
  ),
  carrot: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 14 L4 6 L12 6 Z" fill="#FF6B35" />
      <path d="M6 6 L7 2 M8 6 L8 1 M10 6 L9 2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  lilypad: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="6" ry="4" fill="#228B22" />
      <path d="M8 4 L8 8" stroke="#1a6b1a" strokeWidth="1" />
    </svg>
  ),
  feather: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 13 Q8 8 13 3" stroke="#9370DB" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 11 Q8 9 10 6" stroke="#9370DB" strokeWidth="1" />
    </svg>
  ),
};

// Format time as M:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Stamina bar component
function StaminaBar({ value, max = 10, width = 80 }) {
  const percentage = (value / max) * 100;
  const isLow = percentage < 20;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <Icons.stamina size={14} />
      <div style={{
        width: `${width}px`,
        height: '8px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: isLow ? '#ff6b6b' : '#00ff88',
          boxShadow: isLow ? '0 0 6px #ff6b6b' : '0 0 6px #00ff88',
          transition: 'width 0.1s',
        }} />
      </div>
    </div>
  );
}

// Lives display component
function Lives({ count, max }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
    }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            opacity: i < count ? 1 : 0.3,
            filter: i < count ? 'none' : 'grayscale(1)',
          }}
        >
          <Icons.heart size={16} filled={i < count} />
        </span>
      ))}
    </div>
  );
}

// Cat game stats
function CatGameStats({ stats }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.essence size={16} color="#FFA500" />
        <span style={{ color: '#FFA500', fontWeight: 500 }}>{stats.essences || 0}/3</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.coin size={16} />
        <span style={{ color: '#FFD700', fontWeight: 500 }}>{stats.coins || 0}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
        <Icons.timer size={16} />
        <span style={{ fontFamily: 'monospace' }}>{formatTime(stats.time || 0)}</span>
      </div>
      <Lives count={stats.lives || 0} max={stats.maxLives || 4} />
      {stats.stamina !== undefined && (
        <StaminaBar value={stats.stamina} max={stats.maxStamina || 10} />
      )}
      {stats.objective && (
        <span style={{ color: '#00ff88', fontSize: '12px', fontStyle: 'italic' }}>
          {stats.objective}
        </span>
      )}
    </>
  );
}

// Rabbit game stats
function RabbitGameStats({ stats }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.carrot size={16} />
        <span style={{ color: '#FF6B35', fontWeight: 500 }}>{stats.essences || 0}/3</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.coin size={16} />
        <span style={{ color: '#FFD700', fontWeight: 500 }}>{stats.coins || 0}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
        <Icons.timer size={16} />
        <span style={{ fontFamily: 'monospace' }}>{formatTime(stats.time || 0)}</span>
      </div>
      <Lives count={stats.lives || 0} max={stats.maxLives || 3} />
      {stats.objective && (
        <span style={{ color: '#ffd700', fontSize: '12px', fontStyle: 'italic' }}>
          {stats.objective}
        </span>
      )}
    </>
  );
}

// Frog game stats
function FrogGameStats({ stats }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.lilypad size={16} />
        <span style={{ color: '#4ade80', fontWeight: 500 }}>{stats.essences || 0}/3</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.coin size={16} />
        <span style={{ color: '#FFD700', fontWeight: 500 }}>{stats.coins || 0}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
        <Icons.timer size={16} />
        <span style={{ fontFamily: 'monospace' }}>{formatTime(stats.time || 0)}</span>
      </div>
      <Lives count={stats.lives || 0} max={stats.maxLives || 3} />
      {stats.pads !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#228B22' }}>
          <span>Pads: {stats.pads}</span>
        </div>
      )}
      {stats.objective && (
        <span style={{ color: '#4ade80', fontSize: '12px', fontStyle: 'italic' }}>
          {stats.objective}
        </span>
      )}
    </>
  );
}

// Owl game stats
function OwlGameStats({ stats }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.feather size={16} />
        <span style={{ color: '#9370DB', fontWeight: 500 }}>{stats.feathers || 0}/1</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.coin size={16} />
        <span style={{ color: '#FFD700', fontWeight: 500 }}>{stats.coins || 0}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
        <Icons.timer size={16} />
        <span style={{ fontFamily: 'monospace' }}>{formatTime(stats.time || 0)}</span>
      </div>
      <Lives count={stats.lives || 0} max={stats.maxLives || 3} />
      {stats.warning && (
        <span style={{ color: '#ff4444', fontSize: '12px', fontWeight: 'bold' }}>
          {stats.warning}
        </span>
      )}
    </>
  );
}

// Elf game stats
function ElfGameStats({ stats }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.essence size={16} color="#2E8B57" />
        <span style={{ color: '#2E8B57', fontWeight: 500 }}>{stats.essences || 0}/3</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icons.coin size={16} />
        <span style={{ color: '#FFD700', fontWeight: 500 }}>{stats.coins || 0}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
        <Icons.timer size={16} />
        <span style={{ fontFamily: 'monospace' }}>{formatTime(stats.time || 0)}</span>
      </div>
      <Lives count={stats.lives || 0} max={stats.maxLives || 3} />
      {stats.objective && (
        <span style={{ color: '#2E8B57', fontSize: '12px', fontStyle: 'italic' }}>
          {stats.objective}
        </span>
      )}
    </>
  );
}

// Main GameStatusBar component
export default function GameStatusBar({ gameType, stats = {} }) {
  // Don't render if not in a game
  if (!gameType || gameType === 'hub') return null;

  return (
    <div style={{
      position: 'fixed',
      top: '58px', // Below main navbar (which is at top: 12px with ~46px height)
      left: '12px',
      right: '12px',
      height: '36px',
      background: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '0 16px',
      fontSize: '13px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      {gameType === 'cat' && <CatGameStats stats={stats} />}
      {gameType === 'rabbit' && <RabbitGameStats stats={stats} />}
      {gameType === 'frog' && <FrogGameStats stats={stats} />}
      {gameType === 'owl' && <OwlGameStats stats={stats} />}
      {gameType === 'elf' && <ElfGameStats stats={stats} />}
    </div>
  );
}

// Export individual stat components for flexibility
export { CatGameStats, RabbitGameStats, FrogGameStats, OwlGameStats, ElfGameStats };
