"use client";

import { useEffect, useState, useCallback } from "react";
import { setTouchInput } from "@/hooks/useKeyboard";
import HelpModal from "./HelpModal";

// Detect if device is mobile/touch
function useIsMobile() {
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

// D-Pad control component for mobile
function DPad() {
  const handleTouch = useCallback((key, isPressed) => {
    setTouchInput(key, isPressed);
  }, []);

  const buttonStyle = {
    width: '50px',
    height: '50px',
    background: 'rgba(60, 60, 60, 0.7)',
    border: '2px solid rgba(100, 100, 100, 0.8)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.95)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      display: 'grid',
      gridTemplateColumns: '50px 50px 50px',
      gridTemplateRows: '50px 50px 50px',
      gap: '4px',
      pointerEvents: 'auto',
    }}>
      {/* Up */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <button
          style={buttonStyle}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('forward', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('forward', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('forward', false); }}
        >
          <span style={{ fontSize: '24px' }}>&#8593;</span>
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
          <span style={{ fontSize: '24px' }}>&#8592;</span>
        </button>
      </div>
      {/* Down */}
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <button
          style={buttonStyle}
          onTouchStart={(e) => { e.preventDefault(); handleTouch('backward', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('backward', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('backward', false); }}
        >
          <span style={{ fontSize: '24px' }}>&#8595;</span>
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
          <span style={{ fontSize: '24px' }}>&#8594;</span>
        </button>
      </div>
    </div>
  );
}

// Action buttons (Jump and Interact)
function ActionButtons({ interactTarget, onInteract }) {
  const handleTouch = useCallback((key, isPressed) => {
    setTouchInput(key, isPressed);
  }, []);

  const hasTarget = !!interactTarget;
  const targetType = interactTarget?.type || null;

  const jumpButtonStyle = {
    width: '70px',
    height: '70px',
    background: 'rgba(60, 60, 60, 0.7)',
    border: '2px solid rgba(100, 100, 100, 0.8)',
    borderRadius: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  };

  // Interact button changes color based on target
  const getInteractStyle = () => {
    if (targetType === 'rabbit' || targetType === 'cat' || targetType === 'frog' || targetType === 'gnome' || targetType === 'hoots' || targetType === 'nox') {
      return {
        ...jumpButtonStyle,
        background: 'rgba(100, 180, 255, 0.8)',
        border: '2px solid rgba(100, 180, 255, 0.9)',
        color: '#000',
        boxShadow: '0 2px 12px rgba(100, 180, 255, 0.5)',
      };
    } else if (targetType === 'grain') {
      return {
        ...jumpButtonStyle,
        background: 'rgba(212, 175, 55, 0.8)',
        border: '2px solid rgba(212, 175, 55, 0.9)',
        color: '#000',
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.5)',
      };
    } else if (targetType === 'portal') {
      return {
        ...jumpButtonStyle,
        background: 'rgba(138, 43, 226, 0.8)',
        border: '2px solid rgba(138, 43, 226, 0.9)',
        color: '#fff',
        boxShadow: '0 2px 12px rgba(138, 43, 226, 0.5)',
      };
    }
    return jumpButtonStyle;
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'auto',
    }}>
      {/* Interact button - E (only shows when near something) */}
      {hasTarget && (
        <button
          style={getInteractStyle()}
          onTouchStart={(e) => {
            e.preventDefault();
            if (onInteract) {
              onInteract();
            }
          }}
        >
          E
        </button>
      )}
      {/* Jump button */}
      <button
        style={jumpButtonStyle}
        onTouchStart={(e) => { e.preventDefault(); handleTouch('jump', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handleTouch('jump', false); }}
        onTouchCancel={(e) => { e.preventDefault(); handleTouch('jump', false); }}
      >
        JUMP
      </button>
    </div>
  );
}

// Format seconds as M:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Pyramid layer colors and info
const PYRAMID_LAYERS = [
  { realm: 'owl', color: '#4B0082', label: 'Owl' },      // Layer 4 (top)
  { realm: 'cat', color: '#FF8C00', label: 'Cat' },      // Layer 3
  { realm: 'frog', color: '#228B22', label: 'Frog' },    // Layer 2
  { realm: 'rabbit', color: '#8B4513', label: 'Rabbit' }, // Layer 1 (base)
];

// Pyramid progress indicator - minimal version
function PyramidIndicator({ pyramidShards, isMobile }) {
  const isComplete = pyramidShards &&
    pyramidShards.rabbit &&
    pyramidShards.frog &&
    pyramidShards.cat &&
    pyramidShards.owl;

  const scale = isMobile ? 0.8 : 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
      }}
      title={isComplete ? 'Pyramid Complete!' : `${Object.values(pyramidShards || {}).filter(Boolean).length}/4 shards`}
    >
      {PYRAMID_LAYERS.map((layer, index) => {
        const hasShard = pyramidShards?.[layer.realm] || false;
        const width = 8 + (index * 6);

        return (
          <div
            key={layer.realm}
            style={{
              width: `${width * scale}px`,
              height: `${5 * scale}px`,
              background: hasShard ? layer.color : 'rgba(255, 255, 255, 0.2)',
              borderRadius: index === 0 ? '2px 2px 0 0' : index === 3 ? '0 0 2px 2px' : '0',
            }}
          />
        );
      })}
    </div>
  );
}

export default function UI({ timeStopped = false, stopData = {}, interactTarget = null, onInteract, activeRealm = 'hub' }) {
  const { stopDuration = 0, colorPhase = "", totalDuration = 33 } = stopData;
  const isMobile = useIsMobile();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Listen for help modal open event from Game.jsx
  useEffect(() => {
    const handleOpenHelp = () => setIsHelpOpen(true);
    window.addEventListener('openHelp', handleOpenHelp);
    return () => window.removeEventListener('openHelp', handleOpenHelp);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: 100,
    }}>


      {/* Mobile touch controls */}
      {isMobile && (
        <>
          <DPad />
          <ActionButtons interactTarget={interactTarget} onInteract={onInteract} />
        </>
      )}

      {/* Camera mode indicator removed - navbar has realm buttons now */}

      {/* Interact prompt - center bottom (desktop only, hub only) */}
      {interactTarget && !isMobile && activeRealm === 'hub' && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: interactTarget.type === 'portal' ? 'rgba(138, 43, 226, 0.9)' :
                      interactTarget.type === 'grain' ? 'rgba(212, 175, 55, 0.9)' : 'rgba(100, 180, 255, 0.9)',
          color: interactTarget.type === 'portal' ? '#fff' : '#000',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          backdropFilter: 'blur(4px)',
          animation: 'pulse 1s ease-in-out infinite',
          boxShadow: interactTarget.type === 'portal' ? '0 0 20px rgba(138, 43, 226, 0.7)' :
                     interactTarget.type === 'grain' ? '0 0 20px rgba(212, 175, 55, 0.5)' : '0 0 20px rgba(100, 180, 255, 0.5)',
        }}>
          {interactTarget.type === 'portal' ? `Press E to Enter ${interactTarget.realm?.charAt(0).toUpperCase()}${interactTarget.realm?.slice(1)} Realm` :
           interactTarget.type === 'hoots' ? 'Press E to Talk to Hoots' :
           interactTarget.type === 'nox' ? 'Press E to Talk to Y' :
           interactTarget.type === 'rabbit' ? 'Press E to Talk to Bunzy' :
           interactTarget.type === 'cat' ? 'Press E to Talk to Kittle' :
           interactTarget.type === 'frog' ? 'Press E to Talk to Pepe' :
           interactTarget.type === 'gnome' ? 'Press E to Talk to AEIOU' :
           interactTarget.type === 'grain' ? 'Press E to Collect Essence' :
           null}
        </div>
      )}

      {/* Y time stop - no timer needed, just visual effect on clock */}

      {/* Controls hint - bottom left (desktop only) */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.3)',
          color: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '6px',
          fontSize: '12px',
          backdropFilter: 'blur(4px)',
          lineHeight: 1.5,
        }}>
          <span style={{ opacity: 0.7 }}>WASD/Arrows</span>: Move
          <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
          <span style={{ opacity: 0.7 }}>Space</span>: Jump
          <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
          <span style={{ opacity: 0.7 }}>1/2</span>: Camera
        </div>
      )}

      {/* CSS animation for pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

// Get progress bar color based on current phase (33 second total)
function getProgressColor(stopDuration, totalDuration) {
  const goldToRed = 20; // 0-20 seconds
  const redToPurple = goldToRed + 10; // 20-30 seconds

  if (stopDuration < goldToRed) {
    // Gold to red gradient (brass gold #d4af37 to red)
    const t = stopDuration / goldToRed;
    return `rgb(${Math.round(212 + 43 * t)}, ${Math.round(175 * (1 - t))}, ${Math.round(55 * (1 - t))})`;
  } else if (stopDuration < redToPurple) {
    // Red to purple gradient
    const t = (stopDuration - goldToRed) / 10;
    return `rgb(${Math.round(255 - 127 * t)}, ${0}, ${Math.round(128 * t)})`;
  } else {
    // Purple to white
    const t = (stopDuration - redToPurple) / 3;
    return `rgb(${Math.round(128 + 127 * t)}, ${Math.round(128 * t)}, ${Math.round(128 + 127 * t)})`;
  }
}
