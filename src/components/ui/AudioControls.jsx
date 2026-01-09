"use client";

import { useState } from 'react';
import { useAudio } from '@/hooks/useAudio';

export default function AudioControls({ isOpen, onClose }) {
  const audio = useAudio();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid #333',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M2 5.5 L2 10.5 L5 10.5 L9 14 L9 2 L5 5.5 Z" fill="#fff" />
              <path d="M11 5 Q13 8 11 11" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M12.5 3.5 Q15.5 8 12.5 12.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
            Audio Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: '#333',
              border: 'none',
              borderRadius: '50%',
              color: '#888',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Master Mute Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: audio.isMuted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>
              {audio.isMuted ? 'Sound Off' : 'Sound On'}
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              {audio.isMuted ? 'Click to enable audio' : 'All sounds enabled'}
            </div>
          </div>
          <button
            onClick={audio.toggleMute}
            style={{
              width: '56px',
              height: '32px',
              borderRadius: '16px',
              border: 'none',
              background: audio.isMuted ? '#444' : '#4ade80',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: '4px',
              left: audio.isMuted ? '4px' : '28px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Music Volume */}
        <div style={{ marginBottom: '20px', opacity: audio.isMuted ? 0.5 : 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎵</span>
              Music
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              {Math.round(audio.musicVolume * 100)}%
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audio.musicVolume}
            onChange={(e) => audio.setMusicVolume(parseFloat(e.target.value))}
            disabled={audio.isMuted}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audio.musicVolume * 100}%, #333 ${audio.musicVolume * 100}%, #333 100%)`,
              appearance: 'none',
              cursor: audio.isMuted ? 'not-allowed' : 'pointer',
            }}
          />
        </div>

        {/* SFX Volume */}
        <div style={{ marginBottom: '24px', opacity: audio.isMuted ? 0.5 : 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span>
              Sound Effects
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              {Math.round(audio.sfxVolume * 100)}%
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audio.sfxVolume}
            onChange={(e) => audio.setSfxVolume(parseFloat(e.target.value))}
            disabled={audio.isMuted}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(to right, #4ade80 0%, #4ade80 ${audio.sfxVolume * 100}%, #333 ${audio.sfxVolume * 100}%, #333 100%)`,
              appearance: 'none',
              cursor: audio.isMuted ? 'not-allowed' : 'pointer',
            }}
          />
        </div>

        {/* Test Sounds */}
        <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
          <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
            Test Sounds
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Jump', sound: 'jump' },
              { label: 'Coin', sound: 'coin' },
              { label: 'Hit', sound: 'hit' },
              { label: 'Success', sound: 'success' },
            ].map(({ label, sound }) => (
              <button
                key={sound}
                onClick={() => audio.playSound(sound)}
                disabled={audio.isMuted}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: audio.isMuted ? '#666' : '#fff',
                  fontSize: '12px',
                  cursor: audio.isMuted ? 'not-allowed' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '14px',
            background: '#333',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

// Compact audio toggle button for in-game use
export function AudioToggleButton() {
  const audio = useAudio();

  return (
    <button
      onClick={audio.toggleMute}
      style={{
        width: '40px',
        height: '40px',
        background: 'rgba(0, 0, 0, 0.5)',
        border: 'none',
        borderRadius: '8px',
        color: audio.isMuted ? '#666' : '#fff',
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      title={audio.isMuted ? 'Unmute' : 'Mute'}
    >
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M2 5.5 L2 10.5 L5 10.5 L9 14 L9 2 L5 5.5 Z" fill="currentColor" />
        {audio.isMuted ? (
          <path d="M11 6 L15 10 M15 6 L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        ) : (
          <>
            <path d="M11 5 Q13 8 11 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M12.5 3.5 Q15.5 8 12.5 12.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
