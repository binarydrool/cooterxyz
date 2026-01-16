"use client";

import { useEffect, useState } from "react";
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

// D-Pad and ActionButtons removed - using GlobalMobileControls instead

// Format seconds as M:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Pyramid layer colors and info (displayed top to bottom)
const PYRAMID_LAYERS = [
  { realm: 'owl', color: '#4B0082', label: 'Owl' },          // Layer 5 - capstone (From Above)
  { realm: 'inchworm', color: '#00CED1', label: 'Miles' },   // Layer 4 (From the Chrysalis)
  { realm: 'cat', color: '#FF8C00', label: 'Cat' },          // Layer 3 (From the Rooftops)
  { realm: 'frog', color: '#228B22', label: 'Frog' },        // Layer 2 (From the Marsh)
  { realm: 'rabbit', color: '#FFD700', label: 'Rabbit' },    // Layer 1 - base (From the Warren)
];

// Pyramid progress indicator - minimal version
function PyramidIndicator({ pyramidShards, isMobile }) {
  const isComplete = pyramidShards &&
    pyramidShards.rabbit &&
    pyramidShards.frog &&
    pyramidShards.cat &&
    pyramidShards.inchworm &&
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
      title={isComplete ? 'Pyramid Complete!' : `${Object.values(pyramidShards || {}).filter(Boolean).length}/5 shards`}
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
              borderRadius: index === 0 ? '2px 2px 0 0' : index === 4 ? '0 0 2px 2px' : '0',
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


      {/* Mobile touch controls removed - using GlobalMobileControls instead */}

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
