"use client";

import { useEffect } from 'react';

const realmInfo = {
  cat: {
    title: "Shadow Hunt",
    icon: "🐱",
    description: "Navigate through darkness. Avoid the anglerfish lights. Find AEIOU and collect 3 essences.",
    controls: [
      "WASD / Joystick - Move",
      "SHIFT - Sprint",
      "1 - Third Person Camera",
      "2 - Bird's Eye Camera",
      "E - Interact"
    ],
    color: "#6366f1",
    bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
  },
  rabbit: {
    title: "Carrot Chase",
    icon: "🐰",
    description: "Collect carrots, avoid foxes, find AEIOU and gather 3 essences.",
    controls: [
      "WASD / Joystick - Move",
      "SPACE - Jump",
      "E - Interact"
    ],
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, #3d2a1a 0%, #2a1f1a 100%)"
  },
  frog: {
    title: "SURVIVAL",
    icon: "🐸",
    description: "KILLER fish lurks below! Stay on a lily pad for more than 3 SECONDS and the fish EATS YOU!",
    controls: [
      "W - Jump UP | S - Jump DOWN",
      "A - Jump LEFT | D - Jump RIGHT",
      "⚠️ 3 SECONDS ON A PAD = FISH ATTACK!",
      "💎 Collect 3 GREEN ESSENCES → Unlock Owl Realm",
      "🎭 Find AEIOU (dark jester) → Get SHARD + WIN!"
    ],
    color: "#22ff44",
    bgGradient: "linear-gradient(135deg, #001a00 0%, #002200 50%, #003300 100%)"
  },
  owl: {
    title: "Night Flight",
    icon: "🦉",
    description: "Fly through the night sky. Avoid the wolves below. Find AEIOU and collect the feather.",
    controls: [
      "WASD / Joystick - Fly",
      "SPACE - Ascend",
      "SHIFT - Descend",
      "E - Interact"
    ],
    color: "#a855f7",
    bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)"
  },
  elf: {
    title: "Eternal Clocktower",
    icon: "🧝",
    description: "Climb the tower and defeat the Sun Boss. Collect crystals and reach the top!",
    controls: [
      "WASD / Joystick - Move",
      "SPACE - Jump",
      "E - Attack / Interact",
      "Climb platforms to reach the boss!"
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
          <span style={{ fontSize: '48px' }}>{info.icon}</span>
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
