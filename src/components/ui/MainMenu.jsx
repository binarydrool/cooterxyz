"use client";

import { useState } from 'react';
import { useWallet, shortenAddress } from '@/hooks/useWallet';
import { useGameState } from '@/hooks/useGameState';
import { useInventory, ESSENCE_TYPES } from '@/hooks/useInventory';
import { useAudio, SOUNDS } from '@/hooks/useAudio';
import WalletButton from './WalletButton';
import AudioControls from './AudioControls';
import Leaderboard from './Leaderboard';
import NFTGallery from './NFTGallery';
import Marketplace from './Marketplace';
import { Float, Glow } from './Transitions';

export default function MainMenu({ onPlay, onSettings }) {
  const wallet = useWallet();
  const gameState = useGameState();
  const inventory = useInventory();
  const audio = useAudio();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNFTs, setShowNFTs] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const handleMenuClick = (action) => {
    audio.playSound(SOUNDS.CLICK);
    action();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0f1f2f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Animated background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        opacity: 0.3,
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: '#ffd700',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Essence display */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.values(ESSENCE_TYPES).map(essence => (
            <div
              key={essence.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '6px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span style={{ fontSize: '14px' }}>{essence.emoji}</span>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
                {inventory.essences[essence.id] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Wallet button */}
        <WalletButton />
      </div>

      {/* Logo */}
      <Float duration={3000} distance={8}>
        <Glow color="#ffd700" intensity={30}>
          <div style={{
            marginBottom: '8px',
          }}>
            <svg width="72" height="72" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="10" rx="6" ry="4" fill="#4ade80" />
              <ellipse cx="8" cy="7" rx="4" ry="3" fill="#5b8c5a" />
              <ellipse cx="8" cy="7" rx="3" ry="2" fill="#6ba36a" />
              <circle cx="6" cy="6" r="1" fill="#333" />
              <circle cx="10" cy="6" r="1" fill="#333" />
              <path d="M4 10 L2 12 M12 10 L14 12 M6 13 L6 15 M10 13 L10 15" stroke="#5b8c5a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </Glow>
      </Float>

      <h1 style={{
        color: '#ffd700',
        fontSize: '48px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        marginBottom: '8px',
        textShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
      }}>
        COOTER
      </h1>

      <p style={{
        color: '#888',
        fontSize: '14px',
        marginBottom: '48px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        Master of Time
      </p>

      {/* Menu buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '280px',
      }}>
        <MenuButton
          primary
          onClick={() => handleMenuClick(onPlay)}
        >
          Play
        </MenuButton>

        <MenuButton onClick={() => handleMenuClick(() => setShowLeaderboard(true))}>
          Leaderboard
        </MenuButton>

        <MenuButton onClick={() => handleMenuClick(() => setShowNFTs(true))}>
          My NFTs
        </MenuButton>

        <MenuButton onClick={() => handleMenuClick(() => setShowMarketplace(true))}>
          Marketplace
        </MenuButton>

        <MenuButton onClick={() => handleMenuClick(() => setShowAudioSettings(true))}>
          Audio
        </MenuButton>

        {/* Free Mode Toggle */}
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: gameState.freeMode
            ? 'rgba(74, 222, 128, 0.1)'
            : 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: gameState.freeMode
            ? '1px solid rgba(74, 222, 128, 0.3)'
            : '1px solid #333',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#fff', fontSize: '13px' }}>Free Mode</div>
              <div style={{ color: '#888', fontSize: '11px' }}>
                {gameState.freeMode ? 'Realms unlocked' : 'Solve riddles to unlock'}
              </div>
            </div>
            <button
              onClick={() => handleMenuClick(gameState.toggleFreeMode)}
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: gameState.freeMode ? '#4ade80' : '#444',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: gameState.freeMode ? '23px' : '3px',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>
      </div>

      {/* Version info */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        color: '#444',
        fontSize: '11px',
      }}>
        v1.0.0
      </div>

      {/* Modals */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <NFTGallery
        isOpen={showNFTs}
        onClose={() => setShowNFTs(false)}
      />

      <Marketplace
        isOpen={showMarketplace}
        onClose={() => setShowMarketplace(false)}
      />

      <AudioControls
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

// Menu button component
function MenuButton({ children, onClick, primary = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: primary ? '16px 32px' : '14px 28px',
        background: primary
          ? 'linear-gradient(135deg, #ffd700 0%, #c4a000 100%)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.05)',
        border: primary
          ? 'none'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: primary ? '#000' : '#fff',
        fontSize: primary ? '18px' : '15px',
        fontWeight: primary ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? primary
            ? '0 8px 30px rgba(255, 215, 0, 0.4)'
            : '0 8px 20px rgba(0, 0, 0, 0.3)'
          : 'none',
      }}
    >
      {children}
    </button>
  );
}
