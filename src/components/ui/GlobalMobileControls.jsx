"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import {
  setMobileInput,
  setActionState,
  useIsMobile,
} from '@/hooks/useGameInput';

/**
 * Global Mobile Controls Component
 *
 * Provides joystick and action buttons that work across ALL game modes.
 * Uses the global useGameInput system so any game component can read the input.
 *
 * Features:
 * - Virtual joystick (bottom-left) with smooth 360-degree input
 * - Context-aware action button (bottom-right) that changes color based on nearby objects
 * - Jump button (above action button)
 * - Sprint button (optional, between joystick and action)
 *
 * Add this component once at the root level (Game.jsx) and it works everywhere.
 */

// Virtual Joystick - sends input to global state
function VirtualJoystick({ size = 120 }) {
  const baseRef = useRef(null);
  const [thumbPosition, setThumbPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const thumbSize = size * 0.4;
  const maxDistance = (size - thumbSize) / 2;

  const handleTouch = useCallback((e) => {
    if (!baseRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clamp to max distance
    if (distance > maxDistance) {
      deltaX = (deltaX / distance) * maxDistance;
      deltaY = (deltaY / distance) * maxDistance;
    }

    setThumbPosition({ x: deltaX, y: deltaY });

    // Normalize to -1 to 1 range and send to global state
    // Note: Y is inverted (up on screen = positive Y in game)
    const normalizedX = deltaX / maxDistance;
    const normalizedY = -deltaY / maxDistance; // Invert Y

    setMobileInput(normalizedX, normalizedY);
  }, [maxDistance]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbPosition({ x: 0, y: 0 });
    setIsActive(false);
    setMobileInput(0, 0);
  }, []);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActive(true);
    handleTouch(e);
  }, [handleTouch]);

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '20px',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: isActive
          ? 'rgba(0, 255, 136, 0.15)'
          : 'rgba(255, 255, 255, 0.1)',
        border: isActive
          ? '3px solid rgba(0, 255, 136, 0.4)'
          : '3px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: 9999,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {/* Thumb */}
      <div
        style={{
          width: `${thumbSize}px`,
          height: `${thumbSize}px`,
          borderRadius: '50%',
          background: isActive
            ? 'rgba(0, 255, 136, 0.6)'
            : 'rgba(255, 255, 255, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.6)',
          transform: `translate(${thumbPosition.x}px, ${thumbPosition.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
          boxShadow: isActive ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none',
        }}
      />
    </div>
  );
}

// Action Button - color changes based on nearby object context
function ActionButton({ nearbyObject, onAction }) {
  const [isPressed, setIsPressed] = useState(false);

  // Get button style based on nearby object type
  const getButtonConfig = () => {
    if (!nearbyObject) {
      return {
        color: '#666666',
        disabled: true,
        text: null,
        glowColor: 'transparent'
      };
    }

    switch (nearbyObject.type) {
      case 'npc':
        return {
          color: '#3B82F6',
          disabled: false,
          text: `Talk to ${nearbyObject.name || 'NPC'}`,
          glowColor: 'rgba(59, 130, 246, 0.5)'
        };
      case 'essence':
        return {
          color: '#F59E0B',
          disabled: false,
          text: 'Collect essence',
          glowColor: 'rgba(245, 158, 11, 0.5)'
        };
      case 'coin':
        return {
          color: '#EAB308',
          disabled: false,
          text: 'Collect',
          glowColor: 'rgba(234, 179, 8, 0.5)'
        };
      case 'portal':
        return {
          color: '#8B5CF6',
          disabled: false,
          text: 'Enter portal',
          glowColor: 'rgba(139, 92, 246, 0.5)'
        };
      case 'powerup':
        return {
          color: nearbyObject.powerupColor || '#00ff88',
          disabled: false,
          text: 'Collect',
          glowColor: `${nearbyObject.powerupColor || '#00ff88'}80`
        };
      case 'dimitrius':
      case 'aeiou':
        return {
          color: '#9933ff',
          disabled: false,
          text: 'Talk to AEIOU',
          glowColor: 'rgba(153, 51, 255, 0.5)'
        };
      default:
        return {
          color: '#666666',
          disabled: true,
          text: null,
          glowColor: 'transparent'
        };
    }
  };

  const config = getButtonConfig();

  const handlePress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPressed(true);
    setActionState('action', true);
    setActionState('interact', true);
    if (!config.disabled && onAction) {
      onAction(nearbyObject);
    }
  };

  const handleRelease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPressed(false);
    setActionState('action', false);
    setActionState('interact', false);
  };

  return (
    <>
      {/* Color-coded action button */}
      <button
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        onTouchCancel={handleRelease}
        disabled={config.disabled}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: config.color,
          border: `3px solid rgba(255, 255, 255, ${config.disabled ? 0.2 : 0.5})`,
          opacity: config.disabled ? 0.5 : 1,
          boxShadow: config.disabled ? 'none' : `0 0 20px ${config.glowColor}`,
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.1s, box-shadow 0.2s',
          animation: !config.disabled ? 'actionPulse 1.5s infinite' : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      />

      {/* Context-sensitive text prompt */}
      {config.text && (
        <div style={{
          position: 'absolute',
          bottom: '140px',
          right: '0',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          color: config.color,
          whiteSpace: 'nowrap',
          border: `1px solid ${config.color}40`,
          boxShadow: `0 0 10px ${config.glowColor}`,
        }}>
          {config.text}
        </div>
      )}
    </>
  );
}

// Jump Button
function JumpButton() {
  const handlePress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActionState('jump', true);
  };

  const handleRelease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActionState('jump', false);
  };

  return (
    <button
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.15)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.9)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      JUMP
    </button>
  );
}

// Sprint Button
function SprintButton() {
  const handlePress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActionState('sprint', true);
  };

  const handleRelease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActionState('sprint', false);
  };

  return (
    <button
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      style={{
        position: 'fixed',
        bottom: '110px',
        right: '90px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'rgba(0, 255, 136, 0.2)',
        border: '2px solid rgba(0, 255, 136, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '700',
        color: '#00ff88',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        zIndex: 9999,
      }}
    >
      SPRINT
    </button>
  );
}

/**
 * Main GlobalMobileControls Component
 *
 * Props:
 * - showJump: boolean - Whether to show the jump button (default: true)
 * - showSprint: boolean - Whether to show the sprint button (default: false)
 * - nearbyObject: object - Object near player for context-aware action button
 * - onAction: function - Callback when action button is pressed
 * - disabled: boolean - Disable all controls (useful during cutscenes/menus)
 */
export default function GlobalMobileControls({
  showJump = true,
  showSprint = false,
  nearbyObject = null,
  onAction = null,
  disabled = false,
}) {
  const isMobile = useIsMobile();

  // Don't render on desktop or when disabled
  if (!isMobile || disabled) return null;

  return (
    <>
      {/* Joystick (bottom-left) */}
      <VirtualJoystick />

      {/* Sprint button (optional) */}
      {showSprint && <SprintButton />}

      {/* Right side buttons container */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999,
      }}>
        {/* Jump button (above action) */}
        {showJump && <JumpButton />}

        {/* Action button */}
        <ActionButton nearbyObject={nearbyObject} onAction={onAction} />
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes actionPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}

// Export individual components for flexibility
export { VirtualJoystick, ActionButton, JumpButton, SprintButton };
