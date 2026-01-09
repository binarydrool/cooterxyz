"use client";

// SVG Icons
const Icons = {
  coin: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
      <circle cx="8" cy="8" r="5" fill="none" stroke="#DAA520" strokeWidth="0.5" />
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
  crystal: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2 L12 6 L8 14 L4 6 Z" fill="#FFA500" stroke="#FF8C00" strokeWidth="1" />
      <path d="M8 2 L8 14" stroke="#FFD700" strokeWidth="0.5" />
    </svg>
  ),
  essence: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1 L12 5 L12 11 L8 15 L4 11 L4 5 Z" fill="#00ff44" stroke="#00cc33" strokeWidth="1" />
      <path d="M8 1 L8 15" stroke="#88ffaa" strokeWidth="0.5" />
      <circle cx="8" cy="8" r="2" fill="#aaffcc" />
    </svg>
  ),
};

// Map collectible icons to SVG components
const COLLECTIBLE_ICONS = {
  carrot: Icons.carrot,
  lilypad: Icons.lilypad,
  feather: Icons.feather,
  crystal: Icons.crystal,
  essence: Icons.essence,
};

export default function GameHUD({
  collectibles = { current: 0, total: 0 },
  collectibleIcon = 'carrot',
  coins = 0,
  time = 0,
  lives = 3,
  maxLives = 3,
  isPaused = false,
  onPause,
  onRestart,
  onQuit,
  realmName = '',
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const CollectibleIcon = COLLECTIBLE_ICONS[collectibleIcon] || Icons.carrot;

  return (
    <>
      {/* Stats bar - NO container, below navbar with spacing */}
      <div style={{
        position: 'fixed',
        top: '70px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 9998,
      }}>
        {/* Collectibles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          <CollectibleIcon size={18} />
          <span>{collectibles.current}/{collectibles.total}</span>
        </div>

        {/* Coins */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#FFD700',
          fontSize: '16px',
          fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          <Icons.coin size={18} />
          <span>{coins}</span>
        </div>

        {/* Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          fontFamily: 'monospace',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          <Icons.timer size={18} />
          <span>{formatTime(time)}</span>
        </div>

        {/* Lives */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {Array.from({ length: maxLives }).map((_, i) => (
            <span
              key={i}
              style={{
                opacity: i < lives ? 1 : 0.3,
                filter: i < lives ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' : 'grayscale(1)',
              }}
            >
              <Icons.heart size={18} filled={i < lives} />
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar - game controls */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'auto',
        zIndex: 9998,
      }}>
        {/* Pause button */}
        <button
          onClick={onPause}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        {/* Realm name */}
        {realmName && (
          <div style={{
            color: '#888',
            fontSize: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {realmName}
          </div>
        )}

        {/* Right buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onRestart}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Restart
          </button>
          <button
            onClick={onQuit}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 100, 100, 0.2)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: '6px',
              color: '#ff8888',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Quit
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'auto',
          zIndex: 10000,
        }}>
          <div style={{
            textAlign: 'center',
            color: '#fff',
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#d4af37',
            }}>
              PAUSED
            </div>
            <div style={{ color: '#888', fontSize: '14px' }}>
              Press Escape or click Resume to continue
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export icons for use in other components
export { Icons };
