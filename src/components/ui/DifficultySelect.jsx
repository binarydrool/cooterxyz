"use client";

import { useState } from 'react';
import { DIFFICULTIES } from '@/hooks/useGameState';

const DIFFICULTY_LIST = [
  { key: 'BEGINNER', ...DIFFICULTIES.BEGINNER },
  { key: 'EASY', ...DIFFICULTIES.EASY },
  { key: 'NORMAL', ...DIFFICULTIES.NORMAL },
  { key: 'HARD', ...DIFFICULTIES.HARD },
  { key: 'EXPERT', ...DIFFICULTIES.EXPERT },
  { key: 'MASTER', ...DIFFICULTIES.MASTER },
  { key: 'IMPOSSIBLE', ...DIFFICULTIES.IMPOSSIBLE },
];

export default function DifficultySelect({
  isOpen,
  onClose,
  onSelect,
  realmName = 'Realm',
  bestScores = {},
}) {
  const [selected, setSelected] = useState('NORMAL');

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatScore = (score) => {
    if (!score) return '--';
    return score.toLocaleString();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        pointerEvents: 'auto',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1a1815 0%, #0f0e0c 100%)',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '450px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 175, 55, 0.15)',
        }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
        }}>
          <div>
            <div style={{
              color: '#d4af37',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '2px',
              marginBottom: '4px',
            }}>
              SELECT DIFFICULTY
            </div>
            <div style={{ color: '#888', fontSize: '13px' }}>
              {realmName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Difficulty list */}
        <div style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {DIFFICULTY_LIST.map((diff) => {
            const scoreKey = `${realmName.toLowerCase()}_${diff.key}`;
            const best = bestScores[scoreKey];
            const isSelected = selected === diff.key;
            const isImpossible = diff.key === 'IMPOSSIBLE';

            return (
              <button
                key={diff.key}
                onClick={() => setSelected(diff.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: isSelected
                    ? isImpossible ? 'rgba(0, 0, 0, 0.6)' : 'rgba(212, 175, 55, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isSelected
                    ? isImpossible ? 'rgba(80, 0, 0, 0.8)' : 'rgba(212, 175, 55, 0.4)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Color indicator */}
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: diff.color,
                      border: diff.color === '#000000'
                        ? '1px solid #444'
                        : diff.color === '#FFFFFF'
                          ? '1px solid #888'
                          : 'none',
                      boxShadow: isSelected ? `0 0 10px ${diff.color}40` : 'none',
                    }}
                  />
                  {/* Difficulty name */}
                  <span style={{
                    color: isSelected ? '#fff' : '#aaa',
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 400,
                  }}>
                    {diff.name}
                  </span>
                </div>

                {/* Best score */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: '#666',
                  fontSize: '12px',
                }}>
                  <span>Your Best:</span>
                  {best ? (
                    <span style={{ color: '#888' }}>
                      {formatScore(best.score)} pts ({formatTime(best.time)})
                    </span>
                  ) : (
                    <span>--</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Notes */}
        <div style={{
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid rgba(80, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Midnight Portal Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#000',
              border: '1px solid #444',
              flexShrink: 0,
            }} />
            <span style={{
              color: '#666',
              fontSize: '11px',
              lineHeight: '1.4',
            }}>
              Complete <strong style={{ color: '#888' }}>all 5 realms</strong> on <strong style={{ color: '#aaa' }}>Impossible</strong> difficulty to earn <strong style={{ color: '#333', textShadow: '0 0 5px #600' }}>Black Shards</strong> and unlock the <strong style={{ color: '#500' }}>Midnight Portal</strong>.
            </span>
          </div>
          {/* Score Storage Note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ color: '#555', fontSize: '10px', flexShrink: 0 }}>💾</span>
            <span style={{
              color: '#555',
              fontSize: '10px',
              lineHeight: '1.4',
            }}>
              Scores are saved locally in your browser. To preserve your scores permanently, sign a transaction to log them on-chain.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(212, 175, 55, 0.15)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#888',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const difficulty = DIFFICULTY_LIST.find(d => d.key === selected);
              onSelect(difficulty);
            }}
            style={{
              padding: '10px 32px',
              background: 'linear-gradient(135deg, #4e5f3d 0%, #3d4a30 100%)',
              border: '1px solid #5a6d47',
              borderRadius: '6px',
              color: '#e8e6de',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            START
          </button>
        </div>
      </div>
    </div>
  );
}
