"use client";

import { useCallback, useEffect, useState, useRef } from 'react';

// Detect if device is mobile/touch
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Virtual Joystick component - 360 degree movement
export function VirtualJoystick({ onMove, size = 120 }) {
  const baseRef = useRef(null);
  const [thumbPosition, setThumbPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const thumbSize = size * 0.4;
  const maxDistance = (size - thumbSize) / 2;

  const handleTouch = useCallback((e) => {
    if (!baseRef.current) return;
    e.preventDefault();

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

    // Calculate angle and magnitude (0-1)
    const angle = Math.atan2(deltaY, deltaX);
    const magnitude = Math.min(distance / maxDistance, 1);

    // Convert to directional movement
    // Normalize to -1 to 1 range for x and y
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;

    onMove?.({
      x: normalizedX,
      y: normalizedY,
      angle: angle,
      magnitude: magnitude,
    });
  }, [maxDistance, onMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    setThumbPosition({ x: 0, y: 0 });
    setIsActive(false);
    onMove?.({ x: 0, y: 0, angle: 0, magnitude: 0 });
  }, [onMove]);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
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
        zIndex: 1150,
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

// Color-coded Action Button based on nearby objects
export function ActionButton({
  nearbyObject,
  onAction,
  onJump,
  showJump = true
}) {
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
          text: `Press to talk to ${nearbyObject.name || 'NPC'}`,
          glowColor: 'rgba(59, 130, 246, 0.5)'
        };
      case 'essence':
        return {
          color: '#F59E0B',
          disabled: false,
          text: 'Press to collect essence',
          glowColor: 'rgba(245, 158, 11, 0.5)'
        };
      case 'coin':
        return {
          color: '#EAB308',
          disabled: false,
          text: 'Press to collect',
          glowColor: 'rgba(234, 179, 8, 0.5)'
        };
      case 'portal':
        return {
          color: '#8B5CF6',
          disabled: false,
          text: 'Press to enter portal',
          glowColor: 'rgba(139, 92, 246, 0.5)'
        };
      case 'powerup':
        return {
          color: nearbyObject.powerupColor || '#00ff88',
          disabled: false,
          text: 'Press to collect',
          glowColor: `${nearbyObject.powerupColor || '#00ff88'}80`
        };
      case 'dimitrius':
      case 'aeiou':
        return {
          color: '#9933ff',
          disabled: false,
          text: `Press to talk to AEIOU`,
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
    setIsPressed(true);
    if (!config.disabled) {
      onAction?.(nearbyObject);
    }
  };

  const handleRelease = (e) => {
    e.preventDefault();
    setIsPressed(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      zIndex: 1150,
    }}>
      {/* Jump button */}
      {showJump && (
        <button
          onTouchStart={(e) => { e.preventDefault(); onJump?.(true); }}
          onTouchEnd={(e) => { e.preventDefault(); onJump?.(false); }}
          onTouchCancel={(e) => { e.preventDefault(); onJump?.(false); }}
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
      )}

      {/* Color-coded action button - NO letter, just colored circle */}
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

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes actionPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// Sprint button for games that need it
export function SprintButton({ onSprint }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onSprint?.(true); }}
      onTouchEnd={(e) => { e.preventDefault(); onSprint?.(false); }}
      onTouchCancel={(e) => { e.preventDefault(); onSprint?.(false); }}
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
        zIndex: 1150,
      }}
    >
      SPRINT
    </button>
  );
}

// Legacy D-Pad for backwards compatibility
export function DPad({ onInput }) {
  const handleTouch = useCallback((key, isPressed) => {
    onInput?.(key, isPressed);
  }, [onInput]);

  const buttonStyle = {
    width: '54px',
    height: '54px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: 'rgba(255, 255, 255, 0.9)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '20px',
      display: 'grid',
      gridTemplateColumns: '54px 54px 54px',
      gridTemplateRows: '54px 54px 54px',
      gap: '6px',
      zIndex: 1150,
    }}>
      {/* Up */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <button
          style={buttonStyle}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('up', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('up', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('up', false); }}
        >
          ▲
        </button>
      </div>
      {/* Left */}
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <button
          style={buttonStyle}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('left', false); }}
        >
          ◀
        </button>
      </div>
      {/* Down */}
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <button
          style={buttonStyle}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('down', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('down', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('down', false); }}
        >
          ▼
        </button>
      </div>
      {/* Right */}
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <button
          style={buttonStyle}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('right', false); }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

// Legacy ActionButtons for backwards compatibility
export function ActionButtons({ onJump, jumpLabel = 'JUMP' }) {
  const buttonStyle = {
    width: '72px',
    height: '72px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    letterSpacing: '0.5px',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '50px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 1150,
    }}>
      <button
        style={buttonStyle}
        onTouchStart={(e) => { e.preventDefault(); onJump?.(true); }}
        onTouchEnd={(e) => { e.preventDefault(); onJump?.(false); }}
        onTouchCancel={(e) => { e.preventDefault(); onJump?.(false); }}
      >
        {jumpLabel}
      </button>
    </div>
  );
}

// Combined mobile controls for games - NEW version with joystick
export default function MobileGameControls({
  inputState,
  onJoystickMove,
  onAction,
  onJump,
  onSprint,
  nearbyObject,
  useJoystick = true,
  showJump = true,
  showSprint = false,
}) {
  const isMobile = useIsMobile();

  // Handle joystick movement and convert to inputState format
  const handleJoystickMove = useCallback((data) => {
    if (inputState) {
      // Convert joystick to directional input for compatibility
      const threshold = 0.3;
      inputState.up = data.y < -threshold;
      inputState.down = data.y > threshold;
      inputState.left = data.x < -threshold;
      inputState.right = data.x > threshold;
    }
    onJoystickMove?.(data);
  }, [inputState, onJoystickMove]);

  if (!isMobile) return null;

  return (
    <>
      {useJoystick ? (
        <VirtualJoystick onMove={handleJoystickMove} />
      ) : (
        <DPad onInput={(key, pressed) => {
          if (inputState) {
            inputState[key] = pressed;
          }
        }} />
      )}

      {showSprint && <SprintButton onSprint={onSprint} />}

      <ActionButton
        nearbyObject={nearbyObject}
        onAction={onAction}
        onJump={onJump}
        showJump={showJump}
      />
    </>
  );
}
