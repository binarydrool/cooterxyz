"use client";

import { useEffect } from 'react';

// SVG Icons for realm animals
const RealmIcons = {
  cat: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="8" fill="#6366f1" />
      <circle cx="11" cy="15" r="2" fill="#fff" />
      <circle cx="21" cy="15" r="2" fill="#fff" />
      <circle cx="11" cy="15" r="1" fill="#333" />
      <circle cx="21" cy="15" r="1" fill="#333" />
      <path d="M4 8 L8 16 L4 16 Z" fill="#6366f1" />
      <path d="M28 8 L24 16 L28 16 Z" fill="#6366f1" />
      <ellipse cx="16" cy="19" rx="2" ry="1" fill="#FFB6C1" />
    </svg>
  ),
  rabbit: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="22" rx="8" ry="6" fill="#E8DCC8" />
      <ellipse cx="10" cy="6" rx="3" ry="10" fill="#E8DCC8" />
      <ellipse cx="22" cy="6" rx="3" ry="10" fill="#E8DCC8" />
      <ellipse cx="10" cy="6" rx="2" ry="8" fill="#FFB6C1" />
      <ellipse cx="22" cy="6" rx="2" ry="8" fill="#FFB6C1" />
      <circle cx="12" cy="20" r="1.5" fill="#333" />
      <circle cx="20" cy="20" r="1.5" fill="#333" />
      <ellipse cx="16" cy="23" rx="2" ry="1" fill="#FFB6C1" />
    </svg>
  ),
  frog: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="20" rx="12" ry="8" fill="#4ade80" />
      <circle cx="10" cy="10" r="5" fill="#4ade80" />
      <circle cx="22" cy="10" r="5" fill="#4ade80" />
      <circle cx="10" cy="9" r="2" fill="#333" />
      <circle cx="22" cy="9" r="2" fill="#333" />
      <path d="M12 22 Q16 26 20 22" stroke="#333" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  owl: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="10" fill="#8B4513" />
      <circle cx="11" cy="14" r="5" fill="#FFF8DC" />
      <circle cx="21" cy="14" r="5" fill="#FFF8DC" />
      <circle cx="11" cy="14" r="2.5" fill="#FFD700" />
      <circle cx="21" cy="14" r="2.5" fill="#FFD700" />
      <circle cx="11" cy="14" r="1" fill="#333" />
      <circle cx="21" cy="14" r="1" fill="#333" />
      <path d="M14 20 L16 24 L18 20" fill="#FF8C00" />
      <path d="M6 8 L10 14 L8 10 Z" fill="#8B4513" />
      <path d="M26 8 L22 14 L24 10 Z" fill="#8B4513" />
    </svg>
  ),
  elf: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2 L8 16 L24 16 Z" fill="#E74C3C" />
      <circle cx="16" cy="22" r="8" fill="#F5DEB3" />
      <circle cx="13" cy="20" r="1.5" fill="#333" />
      <circle cx="19" cy="20" r="1.5" fill="#333" />
      <ellipse cx="16" cy="24" rx="2" ry="1.5" fill="#DC7F7F" />
    </svg>
  ),
};

const realmInfo = {
  cat: {
    title: "Shadow Hunt",
    IconComponent: RealmIcons.cat,
    description: "PRIMARY: Find AEIOU and collect 3 Essences. SECONDARY: Avoid anglerfish, collect coins for bonus points.",
    controls: [
      "WASD / Joystick - Move",
      "SHIFT - Sprint",
      "Find AEIOU (green beacon)",
      "Collect 3 Essences (gold beacons)"
    ],
    color: "#6366f1",
    bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
  },
  rabbit: {
    title: "Carrot Chase",
    IconComponent: RealmIcons.rabbit,
    description: "PRIMARY: Find AEIOU and collect 3 Essences. SECONDARY: Avoid foxes, collect carrots for bonus points.",
    controls: [
      "WASD / Joystick - Move",
      "SPACE - Jump over foxes",
      "Find AEIOU (green beacon)",
      "Collect 3 Essences (gold beacons)"
    ],
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, #3d2a1a 0%, #2a1f1a 100%)"
  },
  frog: {
    title: "Lily Pad Survival",
    IconComponent: RealmIcons.frog,
    description: "PRIMARY: Find AEIOU and collect 3 Essences. WARNING: Stay on any pad for 3+ seconds and the fish EATS YOU!",
    controls: [
      "WASD - Jump between lily pads",
      "Keep moving! 3 sec = fish attack",
      "Find AEIOU (dark jester figure)",
      "Collect 3 Essences (green gems)"
    ],
    color: "#22ff44",
    bgGradient: "linear-gradient(135deg, #001a00 0%, #002200 50%, #003300 100%)"
  },
  owl: {
    title: "Night Flight",
    IconComponent: RealmIcons.owl,
    description: "PRIMARY: Find AEIOU in the dark forest. Fly through the night sky and avoid the wolves below.",
    controls: [
      "WASD / Joystick - Fly direction",
      "SPACE - Ascend (fly up)",
      "SHIFT - Descend (dive down)",
      "Find AEIOU (green beacon)"
    ],
    color: "#a855f7",
    bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)"
  },
  elf: {
    title: "Eternal Clocktower",
    IconComponent: RealmIcons.elf,
    description: "Climb the tower and defeat the Sun Boss. Collect crystals and reach the top!",
    controls: [
      "WASD / Joystick - Move",
      "SPACE - Jump",
      "E - Attack / Interact",
      "Climb platforms to reach the boss"
    ],
    color: "#ffd700",
    bgGradient: "linear-gradient(135deg, #2a1a4a 0%, #0a0a20 100%)"
  }
};

export default function IntroModal({ realm, onStart }) {
  const info = realmInfo[realm] || realmInfo.frog;

  // Handle keyboard input to start
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: info.bgGradient,
        border: `2px solid ${info.color}`,
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        color: 'white',
        boxShadow: `0 0 40px ${info.color}40`,
      }}>
        {/* Header with icon and title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '16px',
        }}>
          {info.IconComponent && <info.IconComponent size={48} />}
          <h1 style={{
            fontSize: '32px',
            margin: 0,
            background: `linear-gradient(135deg, ${info.color} 0%, white 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {info.title}
          </h1>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          color: '#aaa',
          marginBottom: '24px',
          lineHeight: 1.5,
        }}>
          {info.description}
        </p>

        {/* Controls */}
        <div style={{
          textAlign: 'left',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            color: info.color,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Controls
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            listStyle: 'none',
          }}>
            {info.controls.map((control, i) => (
              <li key={i} style={{
                margin: '8px 0',
                color: '#ccc',
                fontSize: '14px',
                position: 'relative',
                paddingLeft: '16px',
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  color: info.color,
                }}>
                  •
                </span>
                {control}
              </li>
            ))}
          </ul>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          style={{
            background: `linear-gradient(135deg, ${info.color} 0%, ${info.color}cc 100%)`,
            border: 'none',
            borderRadius: '8px',
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: info.color === '#ffd700' ? '#000' : '#fff',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: `0 4px 20px ${info.color}40`,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = `0 6px 30px ${info.color}60`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = `0 4px 20px ${info.color}40`;
          }}
        >
          Start Game
        </button>

        {/* Hint text */}
        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#666',
        }}>
          Press SPACE or ENTER to start
        </p>
      </div>
    </div>
  );
}
