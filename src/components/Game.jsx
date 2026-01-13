"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useCallback, useRef, Component } from "react";
import Scene, { triggerInteract } from "./Scene";
import UI from "./UI";
import { CAMERA_MODES } from "./CameraController";
import Logo from "./ui/Logo";
import WalletButton from "./ui/WalletButton";
import ChatModal from "./ui/ChatModal";
import DifficultySelect from "./ui/DifficultySelect";
import GlobalMobileControls from "./ui/GlobalMobileControls";
// MobileRealmSidebar removed - realm navigation consolidated to main navbar
import { useGameState, GAME_MODES } from "@/hooks/useGameState";
import { useInventory, ESSENCE_TYPES, GRAIN_TYPES } from "@/hooks/useInventory";
import { AudioProvider, useAudio, SOUNDS } from "@/hooks/useAudio";
import { setTurtlePosition } from "@/hooks/useTurtleMovement";
import { initKeyboardListeners, useIsMobile } from "@/hooks/useGameInput";

// Import realm components
import RabbitRealm from "./realms/RabbitRealm";
import CatRealm from "./realms/CatRealm3D";
import FrogRealm3D from "./realms/FrogRealm3D";
import OwlRealm from "./realms/OwlRealm3D";
import ElfRealm from "./realms/ElfRealm3D";

// SVG Icons for realm buttons (no emojis)
const RealmIcons = {
  hub: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
      <ellipse cx="8" cy="7" rx="4" ry="3" fill="#5b8c5a" />
      <circle cx="6" cy="6" r="1" fill="#333" />
      <circle cx="10" cy="6" r="1" fill="#333" />
    </svg>
  ),
  rabbit: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="11" rx="4" ry="3" fill="#E8DCC8" />
      <ellipse cx="5" cy="3" rx="1.5" ry="5" fill="#E8DCC8" />
      <ellipse cx="11" cy="3" rx="1.5" ry="5" fill="#E8DCC8" />
      <ellipse cx="5" cy="3" rx="1" ry="4" fill="#FFB6C1" />
      <ellipse cx="11" cy="3" rx="1" ry="4" fill="#FFB6C1" />
      <circle cx="6" cy="10" r="1" fill="#333" />
      <circle cx="10" cy="10" r="1" fill="#333" />
    </svg>
  ),
  cat: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="10" rx="5" ry="4" fill="#FFA500" />
      <path d="M2 4 L4 8 L2 8 Z" fill="#FFA500" />
      <path d="M14 4 L12 8 L14 8 Z" fill="#FFA500" />
      <circle cx="6" cy="8" r="1" fill="#333" />
      <circle cx="10" cy="8" r="1" fill="#333" />
      <ellipse cx="8" cy="10" rx="1" ry="0.5" fill="#FF69B4" />
    </svg>
  ),
  frog: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
      <circle cx="5" cy="5" r="2.5" fill="#4ade80" />
      <circle cx="11" cy="5" r="2.5" fill="#4ade80" />
      <circle cx="5" cy="4.5" r="1" fill="#333" />
      <circle cx="11" cy="4.5" r="1" fill="#333" />
      <path d="M6 11 Q8 13 10 11" stroke="#333" strokeWidth="1" fill="none" />
    </svg>
  ),
  owl: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="9" rx="5" ry="5" fill="#8B4513" />
      <circle cx="5.5" cy="7" r="2.5" fill="#FFF8DC" />
      <circle cx="10.5" cy="7" r="2.5" fill="#FFF8DC" />
      <circle cx="5.5" cy="7" r="1.2" fill="#FFD700" />
      <circle cx="10.5" cy="7" r="1.2" fill="#FFD700" />
      <circle cx="5.5" cy="7" r="0.5" fill="#333" />
      <circle cx="10.5" cy="7" r="0.5" fill="#333" />
      <path d="M7 10 L8 12 L9 10" fill="#FF8C00" />
    </svg>
  ),
  elf: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1 L4 8 L12 8 Z" fill="#2E8B57" />
      <circle cx="8" cy="11" r="4" fill="#F5DEB3" />
      <circle cx="6.5" cy="10" r="0.8" fill="#333" />
      <circle cx="9.5" cy="10" r="0.8" fill="#333" />
      <path d="M2 6 L4 8" stroke="#F5DEB3" strokeWidth="2" />
      <path d="M14 6 L12 8" stroke="#F5DEB3" strokeWidth="2" />
    </svg>
  ),
};

// Error boundary to catch Three.js/Canvas errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#c00' }}>
            Game Error
          </h1>
          <p style={{ color: '#666', maxWidth: '400px', marginBottom: '1rem' }}>
            Something went wrong loading the game.
          </p>
          <p style={{ color: '#999', fontSize: '12px', maxWidth: '400px' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '8px 16px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function WebGLError() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#c00' }}>
        WebGL Not Available
      </h1>
      <p style={{ color: '#666', maxWidth: '400px' }}>
        Your browser or device doesn&apos;t support WebGL, which is required for this game.
        Please try a different browser or enable hardware acceleration.
      </p>
    </div>
  );
}

function Loading() {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontFamily: 'system-ui, sans-serif',
      color: '#999',
    }}>
      <div>Loading...</div>
      {showTip && (
        <div style={{ marginTop: '1rem', fontSize: '12px', textAlign: 'center', maxWidth: '300px' }}>
          Taking too long? Try refreshing the page.
        </div>
      )}
    </div>
  );
}

// Pyramid shard info - 4 layers: rabbit (bottom), frog, cat, owl (capstone)
const PYRAMID_SHARDS = {
  rabbit: { layer: 1, name: 'Base Layer', direction: 'East', color: '#8B4513' },
  frog: { layer: 2, name: 'Second Layer', direction: 'South', color: '#228B22' },
  cat: { layer: 3, name: 'Third Layer', direction: 'West', color: '#FF8C00' },
  owl: { layer: 4, name: 'Capstone', direction: 'above', color: '#4B0082' },
};

// Mind Fusion Spell Sequence - plays when all 4 pyramid shards are collected
function MindFusionSpell({ onComplete }) {
  const [phase, setPhase] = useState(0);
  // Phase 0: Y casts spell
  // Phase 1: AEIOU turns around, looks at Y
  // Phase 2: AEIOU turns back and opens noon portal
  // Phase 3: Portal opens, ceremony complete

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 3000),  // After 3s, AEIOU turns
      setTimeout(() => setPhase(2), 5000),  // After 5s, AEIOU looks at Y
      setTimeout(() => setPhase(3), 7000),  // After 7s, portal opens
      setTimeout(() => onComplete?.(), 10000), // After 10s, complete
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  const phaseTexts = [
    { title: "Y Casts the Mind Fusion Spell!", subtitle: "The power of the pyramid flows through Y..." },
    { title: "AEIOU Awakens!", subtitle: "The spell breaks through to Dimitrius's consciousness..." },
    { title: "AEIOU Looks at Y", subtitle: "Recognition dawns in his ancient eyes..." },
    { title: "The Noon Portal Opens!", subtitle: "AEIOU turns and reveals the path forward..." },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
    }}>
      {/* Magical particle effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: phase >= 3
          ? 'radial-gradient(circle at 50% 30%, rgba(255, 215, 0, 0.3) 0%, transparent 50%)'
          : 'radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.2) 0%, transparent 50%)',
        animation: 'pulse 2s ease-in-out infinite',
        transition: 'background 1s ease',
      }} />

      <div style={{
        textAlign: 'center',
        padding: '40px',
        maxWidth: '500px',
        position: 'relative',
      }}>
        {/* Characters */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '60px',
          marginBottom: '40px',
        }}>
          {/* Y (Turtle) */}
          <div style={{
            transform: phase >= 1 ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}>
            <svg width="80" height="80" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
              <ellipse cx="8" cy="7" rx="4" ry="3" fill="#5b8c5a" />
              <circle cx="6" cy="6" r="1" fill="#333" />
              <circle cx="10" cy="6" r="1" fill="#333" />
            </svg>
            <div style={{ color: '#4ade80', fontSize: '14px', marginTop: '8px' }}>Y</div>
            {phase === 0 && (
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-100%)',
                animation: 'float 1s ease-in-out infinite',
              }}>
                <span style={{ fontSize: '24px' }}>*</span>
              </div>
            )}
          </div>

          {/* Spell effect between them */}
          {phase >= 0 && phase < 3 && (
            <div style={{
              width: '60px',
              height: '4px',
              background: 'linear-gradient(90deg, #8b5cf6, #ffd700, #8b5cf6)',
              borderRadius: '2px',
              animation: 'pulse 0.5s ease-in-out infinite',
              boxShadow: '0 0 20px #8b5cf6',
            }} />
          )}

          {/* AEIOU (Dimitrius) */}
          <div style={{
            transform: phase >= 1 ? 'scaleX(-1)' : 'scaleX(1)',
            transition: 'transform 0.8s ease',
          }}>
            <svg width="80" height="80" viewBox="0 0 16 16" fill="none">
              <path d="M8 1 L4 8 L12 8 Z" fill="#2E8B57" />
              <circle cx="8" cy="11" r="4" fill="#F5DEB3" />
              <circle cx="6.5" cy="10" r="0.8" fill="#333" />
              <circle cx="9.5" cy="10" r="0.8" fill="#333" />
              <path d="M2 6 L4 8" stroke="#F5DEB3" strokeWidth="2" />
              <path d="M14 6 L12 8" stroke="#F5DEB3" strokeWidth="2" />
            </svg>
            <div style={{ color: '#c4a000', fontSize: '14px', marginTop: '8px' }}>AEIOU</div>
          </div>
        </div>

        {/* Noon Portal appearing */}
        {phase >= 3 && (
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 30px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffd700 0%, #ff8c00 50%, transparent 70%)',
            boxShadow: '0 0 60px #ffd700, 0 0 100px #ff8c00',
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#fff',
              textShadow: '0 0 20px #ffd700',
            }}>
              12
            </div>
          </div>
        )}

        {/* Pyramid complete indicator */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '30px', height: '20px',
            background: '#4B0082',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 0 10px #4B0082',
          }} />
          <div style={{
            width: '45px', height: '20px',
            background: '#FF8C00',
            boxShadow: '0 0 10px #FF8C00',
          }} />
          <div style={{
            width: '60px', height: '20px',
            background: '#228B22',
            boxShadow: '0 0 10px #228B22',
          }} />
          <div style={{
            width: '75px', height: '20px',
            background: '#8B4513',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 0 10px #8B4513',
          }} />
        </div>

        {/* Phase text */}
        <h2 style={{
          color: phase >= 3 ? '#ffd700' : '#8b5cf6',
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '12px',
          textShadow: phase >= 3 ? '0 0 20px #ffd700' : '0 0 20px #8b5cf6',
          transition: 'color 0.5s, text-shadow 0.5s',
        }}>
          {phaseTexts[phase].title}
        </h2>
        <p style={{
          color: '#aaa',
          fontSize: '16px',
        }}>
          {phaseTexts[phase].subtitle}
        </p>

        {/* Skip/Continue button */}
        <button
          onClick={onComplete}
          style={{
            marginTop: '30px',
            padding: '12px 32px',
            background: phase >= 3 ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(139, 92, 246, 0.3)',
            border: phase >= 3 ? 'none' : '1px solid #8b5cf6',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {phase >= 3 ? 'Continue' : 'Skip'}
        </button>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-100%); }
          50% { transform: translateY(-10px) translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

// Victory ceremony text overlay - shows message with exit button
function VictoryCeremony({ ceremony, onComplete }) {
  const shardInfo = PYRAMID_SHARDS[ceremony?.realm] || PYRAMID_SHARDS.rabbit;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1100,
      textAlign: 'center',
    }}>
      {/* Message box */}
      <div style={{
        padding: '24px 40px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '16px',
        border: `2px solid ${shardInfo.color}`,
        boxShadow: `0 0 40px ${shardInfo.color}60`,
      }}>
        {/* Pyramid layer visual */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Pyramid representation - highlight acquired layer */}
            <div style={{
              width: '20px',
              height: '15px',
              background: shardInfo.layer === 4 ? '#4B0082' : '#333',
              borderRadius: '2px 2px 0 0',
              opacity: shardInfo.layer >= 4 ? 1 : 0.3,
            }} />
            <div style={{
              width: '35px',
              height: '15px',
              background: shardInfo.layer === 3 ? '#FF8C00' : '#333',
              opacity: shardInfo.layer >= 3 ? 1 : 0.3,
            }} />
            <div style={{
              width: '50px',
              height: '15px',
              background: shardInfo.layer === 2 ? '#228B22' : '#333',
              opacity: shardInfo.layer >= 2 ? 1 : 0.3,
            }} />
            <div style={{
              width: '65px',
              height: '15px',
              background: shardInfo.layer === 1 ? '#8B4513' : '#333',
              borderRadius: '0 0 2px 2px',
              opacity: shardInfo.layer >= 1 ? 1 : 0.3,
            }} />
          </div>
        </div>

        {/* Title with icon */}
        <div style={{
          color: shardInfo.color,
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          {ceremony?.realm && RealmIcons[ceremony.realm] && (
            <span>{RealmIcons[ceremony.realm]({ size: 24 })}</span>
          )}
          Pyramid Shard Acquired!
        </div>

        {/* Message */}
        <div style={{
          color: '#ccc',
          fontSize: '14px',
          marginBottom: '20px',
          maxWidth: '300px',
        }}>
          You got the {shardInfo.name} from the {shardInfo.direction}!
          <br />
          <span style={{ color: '#888', fontSize: '12px' }}>
            {shardInfo.layer === 4
              ? 'The pyramid is complete! The Elf awaits in the North.'
              : `${4 - shardInfo.layer} shard${4 - shardInfo.layer > 1 ? 's' : ''} remaining to complete the pyramid.`
            }
          </span>
        </div>

        {/* Exit button */}
        <button
          onClick={onComplete}
          style={{
            padding: '12px 32px',
            background: `linear-gradient(135deg, ${shardInfo.color} 0%, ${shardInfo.color}cc 100%)`,
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 15px ${shardInfo.color}60`,
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = `0 6px 20px ${shardInfo.color}90`;
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = `0 4px 15px ${shardInfo.color}60`;
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Essence notification popup
function EssenceNotification({ essence, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setVisible(false);
    }, 1500);

    const doneTimer = setTimeout(() => {
      onDone();
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []); // Empty deps - only run once on mount

  const essenceInfo = Object.values(ESSENCE_TYPES).find(e => e.id === essence);

  // Get shape SVG based on essence type
  const getShapeSVG = () => {
    const color = essenceInfo?.color || '#FFD700';
    switch (essenceInfo?.shape) {
      case 'tetrahedron':
        return <polygon points="24,4 4,44 44,44" fill={color} />;
      case 'cube':
        return <rect x="8" y="8" width="32" height="32" fill={color} transform="rotate(45 24 24)" />;
      case 'octahedron':
        return <polygon points="24,2 46,24 24,46 2,24" fill={color} />;
      case 'icosahedron':
        return <polygon points="24,4 44,16 44,32 24,44 4,32 4,16" fill={color} />;
      default:
        return <rect x="8" y="8" width="32" height="32" fill={color} transform="rotate(45 24 24)" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '24px 40px',
      background: 'rgba(0, 0, 0, 0.85)',
      borderRadius: '12px',
      boxShadow: `0 0 40px ${essenceInfo?.color || '#888'}40`,
      border: `2px solid ${essenceInfo?.color || '#888'}60`,
      textAlign: 'center',
      zIndex: 1200,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48">
          {getShapeSVG()}
        </svg>
      </div>
      <div style={{
        color: essenceInfo?.color || '#fff',
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '4px',
      }}>
        {essenceInfo?.name || 'Essence'}
      </div>
      <div style={{ color: '#888', fontSize: '12px' }}>
        Collected!
      </div>
    </div>
  );
}

function GameContent() {
  const [webglSupported, setWebglSupported] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraMode, setCameraMode] = useState(CAMERA_MODES.THIRD_PERSON);
  const [timeStopped, setTimeStopped] = useState(false);
  const [stopData, setStopData] = useState({
    stopDuration: 0,
    colorPhase: "",
    totalDuration: 33,
  });

  // Audio system
  const audio = useAudio();
  const prevTimeStoppedRef = useRef(false);

  // Game state and inventory
  const gameState = useGameState();
  const inventory = useInventory();

  // Interact target can be { type: 'grain', ... } or { type: 'rabbit' } etc
  const [interactTarget, setInteractTarget] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Chat modal state
  const [chatAnimal, setChatAnimal] = useState(null);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [selectedRealm, setSelectedRealm] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Active realm for quick-jump
  const [activeRealm, setActiveRealm] = useState('hub');
  const [realmDifficulty, setRealmDifficulty] = useState('normal');

  // Track which realms have been unlocked (portals visible) - persisted to localStorage
  const [unlockedRealms, setUnlockedRealms] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cooter_unlocked_realms');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Persist unlocked realms to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(unlockedRealms).length > 0) {
      localStorage.setItem('cooter_unlocked_realms', JSON.stringify(unlockedRealms));
    }
  }, [unlockedRealms]);

  // Animal entering portal animation state
  const [animalEnteringPortal, setAnimalEnteringPortal] = useState(null);

  // Essence notification
  const [essenceNotification, setEssenceNotification] = useState(null);

  // Pending grain for minting (when not in free mode)
  const [pendingMintGrain, setPendingMintGrain] = useState(null);

  // Victory ceremony state (after completing rabbit realm)
  const [victoryCeremony, setVictoryCeremony] = useState(null);

  // Mind Fusion Spell state (when all 4 pyramid shards are collected)
  const [showMindFusionSpell, setShowMindFusionSpell] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if mobile - include resize listener for responsive testing
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize global keyboard listeners for game input
  useEffect(() => {
    const cleanup = initKeyboardListeners();
    return cleanup;
  }, []);

  // Audio: Start/stop gear ticking based on time stopped and realm
  useEffect(() => {
    if (!audio.initialized) return;

    if (activeRealm === 'hub') {
      if (timeStopped) {
        audio.stopGearTick();
      } else {
        audio.startGearTick();
      }
    } else {
      // Stop gear sounds in other realms
      audio.stopGearTick();
    }

    return () => {
      audio.stopGearTick();
    };
  }, [timeStopped, activeRealm, audio.initialized]);

  // Audio: Play time stop/resume sounds
  useEffect(() => {
    if (!audio.initialized) return;

    // Only play sounds in hub
    if (activeRealm !== 'hub') return;

    if (timeStopped && !prevTimeStoppedRef.current) {
      audio.playSound(SOUNDS.TIME_STOP);
    } else if (!timeStopped && prevTimeStoppedRef.current) {
      audio.playSound(SOUNDS.TIME_RESUME);
    }
    prevTimeStoppedRef.current = timeStopped;
  }, [timeStopped, activeRealm, audio]);

  // Audio: Ambient music when in hub
  useEffect(() => {
    if (!audio.initialized) return;

    if (activeRealm === 'hub') {
      audio.startAmbientMusic();
    } else {
      audio.stopAmbientMusic();
    }

    return () => {
      audio.stopAmbientMusic();
    };
  }, [activeRealm, audio.initialized]);

  // Audio: Modal open/close sounds
  const prevChatAnimalRef = useRef(null);
  useEffect(() => {
    if (!audio.initialized) return;

    if (chatAnimal && !prevChatAnimalRef.current) {
      audio.playSound(SOUNDS.MODAL_OPEN);
    } else if (!chatAnimal && prevChatAnimalRef.current) {
      audio.playSound(SOUNDS.MODAL_CLOSE);
    }
    prevChatAnimalRef.current = chatAnimal;
  }, [chatAnimal, audio]);

  // E key listener for interactions (talks to animals, collects grains, enters portals)
  // DISABLED when playing in a realm (not hub) to prevent accidental triggers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only allow interactions in hub - disable during realm gameplay
      if (activeRealm !== 'hub') return;

      if ((e.key === 'e' || e.key === 'E') && interactTarget) {
        if (interactTarget.type === 'portal') {
          // Enter the portal's realm
          setSelectedRealm(interactTarget.realm);
          setShowDifficultySelect(true);
        } else if (interactTarget.type === 'grain') {
          triggerInteract();
        } else if (interactTarget.type === 'rabbit') {
          setChatAnimal('rabbit');
        } else if (interactTarget.type === 'cat') {
          setChatAnimal('cat');
        } else if (interactTarget.type === 'frog') {
          setChatAnimal('frog');
        } else if (interactTarget.type === 'nox') {
          setChatAnimal('nox');
        } else if (interactTarget.type === 'gnome') {
          setChatAnimal('gnome');
        } else if (interactTarget.type === 'hoots') {
          setChatAnimal('hoots');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactTarget, activeRealm]);

  const handleCameraModeChange = useCallback((mode) => {
    setCameraMode(mode);
  }, []);

  const handleTimeStoppedChange = useCallback((stopped) => {
    setTimeStopped(stopped);
  }, []);

  const handleStopDataChange = useCallback((data) => {
    setStopData(data);
  }, []);

  const handleInteractTargetChange = useCallback((target) => {
    setInteractTarget(target);
  }, []);

  // Handle essence collection (when blocking second hand for 33 seconds)
  const handleEssenceCollected = useCallback((essenceType) => {
    inventory.addEssence(essenceType);
    setEssenceNotification(essenceType);
    audio.playSound(SOUNDS.COLLECT_ESSENCE);
  }, [inventory, audio]);

  // Map essence type to grain color
  const essenceToGrainColor = (essenceType) => {
    const mapping = { forest: 'green', golden: 'gold', amber: 'orange', violet: 'purple' };
    return mapping[essenceType] || 'gold';
  };

  // Grain claimed handler - grains from clock unlock portals (NOT essences)
  const handleGrainClaimed = useCallback((grain) => {
    audio.playSound(SOUNDS.COLLECT_ESSENCE);
    const grainColor = essenceToGrainColor(grain.essenceType);
    if (gameState.freeMode) {
      // Free mode: collect grain directly to inventory
      inventory.addGrain(grainColor);
      setEssenceNotification(grainColor); // Show grain color notification
    } else {
      // Paid mode: show mint modal first
      setPendingMintGrain(grain);
      audio.playSound(SOUNDS.MODAL_OPEN);
    }
  }, [inventory, gameState.freeMode, audio]);

  // Handle minting a grain (confirms the mint and adds to inventory)
  const handleMintGrain = useCallback(() => {
    if (!pendingMintGrain) return;
    const grainColor = essenceToGrainColor(pendingMintGrain.essenceType);
    inventory.addGrain(grainColor); // Add colored grain
    setEssenceNotification(grainColor);
    setPendingMintGrain(null);
  }, [pendingMintGrain, inventory]);

  // Cancel minting (grain stays on clock - need to re-trigger)
  const handleCancelMint = useCallback(() => {
    setPendingMintGrain(null);
  }, []);

  // Reset game - clears all progress
  const handleResetGame = useCallback(() => {
    inventory.resetInventory();
    setUnlockedRealms({});
    setShowResetConfirm(false);
    setActiveRealm('hub');
    // Clear unlocked realms from localStorage too
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cooter_unlocked_realms');
    }
  }, [inventory]);

  // Handle interaction (E key or button press) - disabled during realm gameplay
  const handleInteract = useCallback(() => {
    // Only allow interactions in hub
    if (activeRealm !== 'hub') return;
    if (!interactTarget) return;

    if (interactTarget.type === 'grain') {
      triggerInteract();
    } else if (interactTarget.type === 'rabbit') {
      setChatAnimal('rabbit');
    } else if (interactTarget.type === 'cat') {
      setChatAnimal('cat');
    } else if (interactTarget.type === 'frog') {
      setChatAnimal('frog');
    } else if (interactTarget.type === 'gnome') {
      setChatAnimal('gnome');
    } else if (interactTarget.type === 'hoots') {
      setChatAnimal('hoots');
    } else if (interactTarget.type === 'nox') {
      setChatAnimal('nox');
    } else if (interactTarget.type === 'aeiou' || interactTarget.type === 'dimitrius') {
      setChatAnimal('aeiou');
    }
  }, [interactTarget, activeRealm]);

  // Handle realm unlock
  const handleUnlockRealm = useCallback((realm) => {
    audio.playSound(SOUNDS.UNLOCK);
    gameState.unlockRealm(realm);
    gameState.resetStrikes(realm);
    gameState.clearRiddleProgress(realm);
    // Mark realm as unlocked (portal visible)
    setUnlockedRealms(prev => ({ ...prev, [realm]: true }));
    // After unlocking, show difficulty select
    setSelectedRealm(realm);
    setTimeout(() => {
      setChatAnimal(null);
      setShowDifficultySelect(true);
    }, 1500);
  }, [gameState, audio]);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((difficulty) => {
    gameState.setDifficulty(difficulty);
    setShowDifficultySelect(false);
    setRealmDifficulty(difficulty);

    // Trigger animal jump into portal animation
    if (selectedRealm) {
      audio.playSound(SOUNDS.PORTAL_ENTER);
      setAnimalEnteringPortal(selectedRealm);

      // After animation completes, enter the realm
      setTimeout(() => {
        setAnimalEnteringPortal(null);
        setActiveRealm(selectedRealm);
      }, 1500); // 1.5 second animation
    }
  }, [gameState, selectedRealm, audio]);

  // Handle realm quick-jump selection - show difficulty selection first
  const handleRealmSelect = useCallback((realmId) => {
    // Elf realm requires all 4 pyramid shards
    if (realmId === 'elf' && !inventory.isPyramidComplete()) {
      // Could show a message here, but for now just don't allow
      return;
    }
    // Hub doesn't need difficulty selection
    if (realmId === 'hub') {
      setActiveRealm('hub');
      return;
    }
    // Show difficulty selection for all game realms
    setSelectedRealm(realmId);
    setShowDifficultySelect(true);
  }, [inventory]);

  // Handle realm exit (return to hub)
  const handleRealmExit = useCallback(() => {
    setActiveRealm('hub');
  }, []);

  // Handle realm navigation (switch between realms directly)
  const handleNavigateRealm = useCallback((realmId) => {
    setActiveRealm(realmId);
  }, []);

  // Handle realm completion
  const handleRealmComplete = useCallback((result) => {
    console.log('Realm completed:', activeRealm, result);
    audio.playSound(SOUNDS.SUCCESS);
    // Trigger victory ceremony - realm tracks which pyramid layer was acquired
    setVictoryCeremony({
      realm: activeRealm, // rabbit, frog, cat, or owl
      result,
      phase: 'intro',
      startTime: Date.now(),
    });
    // Teleport turtle near Dimitrius (at 12 o'clock, slightly in front of him)
    // Dimitrius is at (0, y, 5), place turtle at (0, y, 4.0) facing north toward Dimitrius
    setTurtlePosition(0, 4.0, 0); // x=0, z=4.0, rotation=0 (facing north toward Dimitrius)
    setActiveRealm('hub');
  }, [activeRealm, audio]);

  // Handle realm death
  const handleRealmDeath = useCallback(() => {
    console.log('Realm death');
    // Could show game over, update stats, etc.
  }, []);

  if (!mounted) {
    return <Loading />;
  }

  if (!webglSupported) {
    return <WebGLError />;
  }

  const realmNames = {
    rabbit: 'The Warren',
    cat: 'The Rooftops',
    frog: 'The Lily Marsh',
    owl: 'The Night Sky',
    elf: 'The Eternal Clocktower',
  };

  return (
    <>
      {/* Only render hub scene when in hub - prevents double canvas lag */}
      {activeRealm === 'hub' && (
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Canvas
              camera={{ position: [0, 5, 10], fov: 60 }}
              style={{ background: '#ffffff' }}
              gl={{
                antialias: false,
                alpha: false,
                powerPreference: 'low-power',
                failIfMajorPerformanceCaveat: false,
              }}
              dpr={1}
              shadows={false}
              frameloop="always"
            >
              <Scene
                onCameraModeChange={handleCameraModeChange}
                onTimeStoppedChange={handleTimeStoppedChange}
                onStopDataChange={handleStopDataChange}
                onInteractTargetChange={handleInteractTargetChange}
                onGrainClaimed={handleGrainClaimed}
                victoryCeremony={victoryCeremony}
                unlockedRealms={unlockedRealms}
                animalEnteringPortal={animalEnteringPortal}
                activeRealm={activeRealm}
                pyramidShards={inventory.pyramidShards}
              />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Top Navigation Bar - shows all items on both desktop and mobile */}
      <div style={{
        position: 'fixed',
        top: '8px',
        left: '8px',
        right: '8px',
        zIndex: 9999,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: isMobile ? '6px' : '12px',
        padding: isMobile ? '6px 10px' : '10px 16px',
        background: 'rgba(0, 0, 0, 0.75)',
        borderRadius: '10px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <Logo
          freeMode={gameState.freeMode}
          onToggleFreeMode={gameState.toggleFreeMode}
        />

        {/* 4 Colored Time Grain counters - each color goes to a specific animal */}
        {Object.values(GRAIN_TYPES).map(grain => (
          <div
            key={grain.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 4px',
              background: `${grain.color}20`,
              borderRadius: '4px',
            }}
            title={`${grain.name} - Give ${grain.needed} to ${grain.animal} to unlock portal`}
          >
            <svg width={isMobile ? 10 : 12} height={isMobile ? 10 : 12} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" fill={grain.color} />
            </svg>
            <span style={{ color: grain.color, fontSize: isMobile ? '10px' : '12px', fontWeight: 600 }}>
              {inventory.grains?.[grain.id] || 0}
            </span>
          </div>
        ))}

        {/* Essence total counter - 9 needed for owl realm (capped at 3 per type) */}
        {(() => {
          const cappedGolden = Math.min(inventory.essences?.golden || 0, 3);
          const cappedForest = Math.min(inventory.essences?.forest || 0, 3);
          const cappedAmber = Math.min(inventory.essences?.amber || 0, 3);
          const cappedTotal = cappedGolden + cappedForest + cappedAmber;
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 5px',
                background: 'rgba(212, 175, 55, 0.2)',
                borderRadius: '4px',
              }}
              title="Total Essences for Owl (3 from each realm = 9)"
            >
              <svg width={isMobile ? 10 : 12} height={isMobile ? 10 : 12} viewBox="0 0 24 24" fill="none">
                <polygon points="12,2 2,22 22,22" fill="#D4AF37" />
              </svg>
              <span style={{
                color: cappedTotal >= 9 ? '#90EE90' : '#D4AF37',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: 600,
              }}>
                {cappedTotal}/9
              </span>
            </div>
          );
        })()}

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: isMobile ? '4px' : '20px' }} />

        {/* Desktop: Pyramid indicator in navbar */}
        {!isMobile && (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}
            title={`${Object.values(inventory.pyramidShards || {}).filter(Boolean).length}/4 Mind Shards`}
          >
            {[
              { realm: 'owl', color: '#4B0082' },
              { realm: 'cat', color: '#FF8C00' },
              { realm: 'frog', color: '#228B22' },
              { realm: 'rabbit', color: '#8B4513' },
            ].map((layer, index) => (
              <div
                key={layer.realm}
                style={{
                  width: `${8 + index * 6}px`,
                  height: '5px',
                  background: inventory.pyramidShards?.[layer.realm] ? layer.color : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: index === 0 ? '2px 2px 0 0' : index === 3 ? '0 0 2px 2px' : '0',
                }}
              />
            ))}
          </div>
        )}

        {/* Desktop: Realm quick-jump buttons */}
        {!isMobile && [
          { id: 'hub', color: '#4ade80' },
          { id: 'rabbit', color: '#ffd700' },
          { id: 'cat', color: '#ffa500' },
          { id: 'frog', color: '#22c55e' },
          { id: 'owl', color: '#8b5cf6' },
          { id: 'elf', color: '#c4a000', requiresPyramid: true },
        ].map(realm => {
          const IconComponent = RealmIcons[realm.id];
          const isLocked = realm.requiresPyramid && !inventory.isPyramidComplete();
          return (
            <button
              key={realm.id}
              onClick={() => handleRealmSelect(realm.id)}
              title={isLocked ? 'Complete all 4 realms to unlock' : realm.id.charAt(0).toUpperCase() + realm.id.slice(1)}
              style={{
                width: '28px',
                height: '28px',
                background: activeRealm === realm.id ? `${realm.color}30` : 'transparent',
                border: activeRealm === realm.id ? `2px solid ${realm.color}` : '2px solid transparent',
                borderRadius: '6px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                opacity: isLocked ? 0.4 : 1,
              }}
            >
              <IconComponent size={16} />
            </button>
          );
        })}

        {/* Desktop spacer */}
        {!isMobile && <div style={{ flex: 1 }} />}

        {/* Reset button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          style={{
            background: 'rgba(255, 100, 100, 0.2)',
            border: '1px solid rgba(255, 100, 100, 0.4)',
            borderRadius: '6px',
            color: '#ff6b6b',
            fontSize: isMobile ? '9px' : '11px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: isMobile ? '3px 6px' : '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title="Reset all game progress"
        >
          <svg width={isMobile ? 10 : 12} height={isMobile ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          {!isMobile && 'Reset'}
        </button>

        {/* Testnet ETH link */}
        <a
          href="https://console.optimism.io/faucet"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: isMobile ? '10px' : '13px',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <svg width={isMobile ? 10 : 12} height={isMobile ? 10 : 12} viewBox="0 0 256 417" fill="none">
            <path fill="currentColor" fillOpacity="0.6" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
            <path fill="currentColor" d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
            <path fill="currentColor" fillOpacity="0.6" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601L256 236.587z"/>
            <path fill="currentColor" d="M127.962 416.905v-104.72L0 236.585z"/>
          </svg>
          {!isMobile && 'Testnet'}
        </a>

        <WalletButton />

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openHelp'))}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
          }}
          title="How to Play"
        >
          ?
        </button>
      </div>

      {/* Mobile Right Sidebar - Realms and Pyramid, positioned below navbar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '52px',
          right: '8px',
          zIndex: 9998,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '6px',
          background: 'rgba(0, 0, 0, 0.75)',
          borderRadius: '10px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          {/* Pyramid indicator */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginBottom: '2px' }}
            title={`${Object.values(inventory.pyramidShards || {}).filter(Boolean).length}/4 Mind Shards`}
          >
            {[
              { realm: 'owl', color: '#4B0082' },
              { realm: 'cat', color: '#FF8C00' },
              { realm: 'frog', color: '#228B22' },
              { realm: 'rabbit', color: '#8B4513' },
            ].map((layer, index) => (
              <div
                key={layer.realm}
                style={{
                  width: `${6 + index * 4}px`,
                  height: '3px',
                  background: inventory.pyramidShards?.[layer.realm] ? layer.color : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: index === 0 ? '2px 2px 0 0' : index === 3 ? '0 0 2px 2px' : '0',
                }}
              />
            ))}
          </div>

          {/* Realm buttons - vertical column */}
          {[
            { id: 'hub', color: '#4ade80' },
            { id: 'rabbit', color: '#ffd700' },
            { id: 'cat', color: '#ffa500' },
            { id: 'frog', color: '#22c55e' },
            { id: 'owl', color: '#8b5cf6' },
            { id: 'elf', color: '#c4a000', requiresPyramid: true },
          ].map(realm => {
            const IconComponent = RealmIcons[realm.id];
            const isLocked = realm.requiresPyramid && !inventory.isPyramidComplete();
            return (
              <button
                key={realm.id}
                onClick={() => handleRealmSelect(realm.id)}
                style={{
                  width: '28px',
                  height: '28px',
                  background: activeRealm === realm.id ? `${realm.color}30` : 'transparent',
                  border: activeRealm === realm.id ? `2px solid ${realm.color}` : '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '5px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: isLocked ? 0.4 : 1,
                }}
              >
                <IconComponent size={14} />
              </button>
            );
          })}
        </div>
      )}

      <UI
        timeStopped={timeStopped}
        stopData={stopData}
        interactTarget={interactTarget}
        onInteract={handleInteract}
        activeRealm={activeRealm}
      />

      {/* Render active realm */}
      {activeRealm === 'rabbit' && (
        <RabbitRealm
          difficulty={realmDifficulty}
          freeMode={gameState.freeMode}
          onToggleFreeMode={gameState.toggleFreeMode}
          onComplete={handleRealmComplete}
          onDeath={handleRealmDeath}
          onExit={handleRealmExit}
          onQuit={handleRealmExit}
          onNavigateRealm={handleNavigateRealm}
          onEssenceCollected={handleEssenceCollected}
          hasPyramidShard={inventory.pyramidShards?.rabbit}
        />
      )}
      {activeRealm === 'cat' && (
        <CatRealm
          difficulty={realmDifficulty}
          freeMode={gameState.freeMode}
          onToggleFreeMode={gameState.toggleFreeMode}
          onComplete={handleRealmComplete}
          onDeath={handleRealmDeath}
          onQuit={handleRealmExit}
          onNavigateRealm={handleNavigateRealm}
          hasPyramidShard={inventory.pyramidShards?.cat}
        />
      )}
      {activeRealm === 'frog' && (
        <FrogRealm3D
          difficulty={realmDifficulty}
          freeMode={gameState.freeMode}
          onToggleFreeMode={gameState.toggleFreeMode}
          onComplete={handleRealmComplete}
          onDeath={handleRealmDeath}
          onExit={handleRealmExit}
          onQuit={handleRealmExit}
          onNavigateRealm={handleNavigateRealm}
          hasPyramidShard={inventory.pyramidShards?.frog}
        />
      )}
      {activeRealm === 'owl' && (
        <OwlRealm
          difficulty={realmDifficulty}
          freeMode={gameState.freeMode}
          onToggleFreeMode={gameState.toggleFreeMode}
          onComplete={handleRealmComplete}
          onDeath={handleRealmDeath}
          onExit={handleRealmExit}
          onQuit={handleRealmExit}
          onNavigateRealm={handleNavigateRealm}
          hasPyramidShard={inventory.pyramidShards?.owl}
        />
      )}
      {activeRealm === 'elf' && (
        <ElfRealm
          difficulty={realmDifficulty}
          freeMode={gameState.freeMode}
          onToggleFreeMode={gameState.toggleFreeMode}
          onComplete={handleRealmComplete}
          onDeath={handleRealmDeath}
          onExit={handleRealmExit}
          onQuit={handleRealmExit}
          onNavigateRealm={handleNavigateRealm}
        />
      )}

      {/* Chat Modal for animal interactions */}
      <ChatModal
        animal={chatAnimal}
        isOpen={!!chatAnimal}
        onClose={() => setChatAnimal(null)}
        inventory={inventory}
        onUnlockRealm={handleUnlockRealm}
        freeMode={gameState.freeMode}
        unlockedRealms={unlockedRealms}
      />

      {/* Difficulty Select Modal */}
      <DifficultySelect
        isOpen={showDifficultySelect}
        onClose={() => setShowDifficultySelect(false)}
        onSelect={handleDifficultySelect}
        realmName={selectedRealm ? realmNames[selectedRealm] : ''}
        bestScores={gameState.bestScores}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          onClick={() => setShowResetConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #2a2520 0%, #1a1815 100%)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 100, 100, 0.3)',
            }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" style={{ marginBottom: '16px' }}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <h2 style={{ color: '#ff6b6b', fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
              Reset Game Progress?
            </h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              This will clear all your Time Grains, Essences, unlocked portals, and pyramid shards. You'll start from the beginning.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ccc',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetGame}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #cc5555 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Essence notification */}
      {essenceNotification && (
        <EssenceNotification
          essence={essenceNotification}
          onDone={() => setEssenceNotification(null)}
        />
      )}

      {/* Victory ceremony (after completing a realm) */}
      {victoryCeremony && (
        <VictoryCeremony
          ceremony={victoryCeremony}
          onComplete={() => {
            // Add pyramid shard for the completed realm
            const completedRealm = victoryCeremony.realm;
            if (completedRealm) {
              inventory.addPyramidShard(completedRealm);
            }

            // Check if pyramid will be complete after adding this shard
            // Count existing shards + the one we just added
            const existingShards = Object.values(inventory.pyramidShards || {}).filter(Boolean).length;
            const willBeComplete = existingShards + 1 >= 4;

            // Mark as fading instead of removing immediately
            setVictoryCeremony(prev => prev ? { ...prev, isFading: true } : null);
            // Clear ceremony after fade animation completes
            setTimeout(() => {
              setVictoryCeremony(null);
              // If this was the 4th shard, trigger Mind Fusion Spell!
              if (willBeComplete) {
                setShowMindFusionSpell(true);
              }
            }, 600); // Slightly longer than fade duration to ensure animation completes
          }}
        />
      )}

      {/* Mind Fusion Spell Sequence - when all 4 pyramid shards collected */}
      {showMindFusionSpell && (
        <MindFusionSpell
          onComplete={() => {
            setShowMindFusionSpell(false);
            // After mind fusion spell, the elf realm should now be accessible
            // The pyramid is complete and the noon portal is open!
          }}
        />
      )}

      {/* Mint Grain Modal - shown when collecting a grain in paid mode */}
      {pendingMintGrain && (
        <div
          onClick={handleCancelMint}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(28, 26, 22, 0.9)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #1a1520 0%, #0f0a15 100%)',
              borderRadius: '16px',
              padding: '40px 48px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(138, 43, 226, 0.3), 0 40px 80px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              border: '1px solid rgba(138, 43, 226, 0.3)',
            }}>
            {/* Glowing orb animation */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${Object.values(ESSENCE_TYPES).find(e => e.id === pendingMintGrain.essenceType)?.color || '#FFD700'} 0%, transparent 70%)`,
              animation: 'pulse 1.5s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24">
                {pendingMintGrain.essenceType === 'forest' && (
                  <polygon points="12,2 2,22 22,22" fill="#00FF00" />
                )}
                {pendingMintGrain.essenceType === 'golden' && (
                  <rect x="4" y="4" width="16" height="16" fill="#FFD700" transform="rotate(45 12 12)" />
                )}
                {pendingMintGrain.essenceType === 'amber' && (
                  <polygon points="12,1 23,12 12,23 1,12" fill="#FFA500" />
                )}
                {pendingMintGrain.essenceType === 'violet' && (
                  <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="#800080" />
                )}
              </svg>
            </div>

            <p style={{
              color: '#8b5cf6',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              TIME ESSENCE FOUND
            </p>

            <h2 style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
            }}>
              {Object.values(ESSENCE_TYPES).find(e => e.id === pendingMintGrain.essenceType)?.name || 'Golden Essence'}
            </h2>

            <p style={{
              color: '#888',
              fontSize: '13px',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}>
              Mint this essence as an NFT to add it to your inventory permanently.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleCancelMint}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Discard
              </button>
              <button
                onClick={handleMintGrain}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 4px 20px rgba(138, 43, 226, 0.4)',
                }}
              >
                Mint NFT
              </button>
            </div>

            <p style={{
              color: '#666',
              fontSize: '11px',
              marginTop: '16px',
            }}>
              Enable Free Mode to collect without minting
            </p>
          </div>
        </div>
      )}

      {/* Legacy NFT Claim Modal - kept for backwards compatibility */}
      {showClaimModal && (
        <div
          onClick={() => setShowClaimModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(28, 26, 22, 0.9)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #fffef9 0%, #f8f6f0 100%)',
              borderRadius: '2px',
              padding: '56px 48px 48px',
              maxWidth: '340px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 1px 0 rgba(212, 175, 55, 0.3), 0 40px 80px rgba(0, 0, 0, 0.4)',
              position: 'relative',
            }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            }} />

            <div style={{ marginBottom: '24px' }}>
              <svg width="48" height="48" viewBox="0 0 16 16" fill="none">
                <path d="M8 0 L9 6 L16 8 L9 10 L8 16 L7 10 L0 8 L7 6 Z" fill="#FFD700" />
                <circle cx="3" cy="3" r="1" fill="#FFD700" opacity="0.6" />
                <circle cx="13" cy="5" r="0.8" fill="#FFD700" opacity="0.5" />
                <circle cx="12" cy="12" r="1.2" fill="#FFD700" opacity="0.4" />
              </svg>
            </div>

            <p style={{
              color: '#a09078',
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Collected
            </p>

            <h2 style={{
              color: '#2d2a24',
              fontSize: '22px',
              fontWeight: '400',
              marginBottom: '16px',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              Time Essence
            </h2>

            <button
              onClick={() => setShowClaimModal(false)}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(180deg, #4e5f3d 0%, #3d4a30 100%)',
                border: '1px solid #3d4a30',
                borderRadius: '2px',
                color: '#e8e6de',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Global Mobile Controls - works across all realms including hub */}
      <GlobalMobileControls
        showJump={true}
        showSprint={activeRealm === 'cat' || activeRealm === 'rabbit' || activeRealm === 'owl'}
        nearbyObject={interactTarget}
        onAction={handleInteract}
        disabled={!!chatAnimal || showDifficultySelect}
      />

      {/* Mobile Realm Sidebar removed - realm navigation is now in main navbar only */}
    </>
  );
}

// Wrap GameContent with AudioProvider
export default function Game() {
  return (
    <AudioProvider>
      <GameContent />
    </AudioProvider>
  );
}
