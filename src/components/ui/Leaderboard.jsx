"use client";

import { useState, useEffect } from 'react';
import { useLeaderboard, formatTime, formatNumber, getRankSuffix } from '@/hooks/useLeaderboard';
import { useWallet, shortenAddress } from '@/hooks/useWallet';
import { REALM_INFO, SHARD_GRADES } from '@/utils/nft';

const REALMS = ['rabbit', 'cat', 'frog', 'owl', 'elf'];
const DIFFICULTIES = ['beginner', 'easy', 'normal', 'hard', 'expert', 'master', 'impossible'];

export default function Leaderboard({ isOpen, onClose }) {
  const leaderboard = useLeaderboard();
  const wallet = useWallet();
  const [selectedRealm, setSelectedRealm] = useState('rabbit');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'stats'

  useEffect(() => {
    if (isOpen) {
      leaderboard.fetchLeaderboard(selectedRealm, selectedDifficulty);
    }
  }, [isOpen, selectedRealm, selectedDifficulty, leaderboard.fetchLeaderboard]);

  if (!isOpen) return null;

  const currentEntries = leaderboard.entries[selectedRealm]?.[selectedDifficulty] || [];
  const realmInfo = REALM_INFO[selectedRealm] || REALM_INFO.rabbit;
  const gradeInfo = SHARD_GRADES[selectedDifficulty] || SHARD_GRADES.normal;

  const renderLeaderboardTab = () => (
    <>
      {/* Realm selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {REALMS.map(realm => {
          const info = REALM_INFO[realm];
          return (
            <button
              key={realm}
              onClick={() => setSelectedRealm(realm)}
              style={{
                padding: '8px 16px',
                background: selectedRealm === realm
                  ? `${info.color}30`
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedRealm === realm
                  ? `1px solid ${info.color}60`
                  : '1px solid transparent',
                borderRadius: '8px',
                color: selectedRealm === realm ? info.color : '#888',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {info.name}
            </button>
          );
        })}
      </div>

      {/* Difficulty selector */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {DIFFICULTIES.map(diff => {
          const info = SHARD_GRADES[diff];
          return (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              style={{
                padding: '6px 12px',
                background: selectedDifficulty === diff ? info.color : 'transparent',
                border: `1px solid ${info.color}`,
                borderRadius: '4px',
                color: selectedDifficulty === diff ? '#fff' : info.color,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Leaderboard table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 100px 80px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid #333',
          fontSize: '11px',
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          <div>Rank</div>
          <div>Player</div>
          <div style={{ textAlign: 'right' }}>Time</div>
          <div style={{ textAlign: 'right' }}>Score</div>
        </div>

        {/* Entries */}
        {currentEntries.length === 0 ? (
          <div style={{
            padding: '48px 16px',
            textAlign: 'center',
            color: '#666',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>🏆</div>
            <p>No scores yet. Be the first!</p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {currentEntries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentPlayer = wallet.address &&
                entry.walletAddress?.toLowerCase() === wallet.address.toLowerCase();

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 100px 80px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #222',
                    background: isCurrentPlayer
                      ? 'rgba(59, 130, 246, 0.1)'
                      : rank <= 3
                      ? `rgba(255, 215, 0, ${0.1 - rank * 0.02})`
                      : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    fontWeight: 700,
                    fontSize: rank <= 3 ? '16px' : '14px',
                    color: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#fff',
                  }}>
                    {rank <= 3 ? (
                      <span>{['🥇', '🥈', '🥉'][rank - 1]}</span>
                    ) : (
                      <span>{rank}{getRankSuffix(rank)}</span>
                    )}
                  </div>

                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>
                      {entry.playerName}
                      {isCurrentPlayer && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          background: 'rgba(59, 130, 246, 0.3)',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#3b82f6',
                        }}>
                          YOU
                        </span>
                      )}
                    </div>
                    {entry.walletAddress && (
                      <div style={{ color: '#666', fontSize: '11px', fontFamily: 'monospace' }}>
                        {shortenAddress(entry.walletAddress)}
                      </div>
                    )}
                  </div>

                  <div style={{
                    textAlign: 'right',
                    color: '#4ade80',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  }}>
                    {formatTime(entry.time)}
                  </div>

                  <div style={{
                    textAlign: 'right',
                    color: '#ffd700',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}>
                    {formatNumber(entry.score)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  const renderStatsTab = () => {
    const stats = leaderboard.playerStats;
    if (!stats) {
      return (
        <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>No stats yet. Start playing to track your progress!</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Overview stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
        }}>
          {[
            { label: 'Play Time', value: formatPlayTime(stats.totalPlayTime), icon: '⏱️' },
            { label: 'Total Coins', value: formatNumber(stats.totalCoins), icon: '🪙' },
            { label: 'Collectibles', value: formatNumber(stats.totalCollectibles), icon: '⭐' },
            { label: 'Deaths', value: stats.deathCount, icon: '💀' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ color: '#888', fontSize: '11px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Realm completions */}
        <div>
          <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '12px' }}>
            Realm Completions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px',
          }}>
            {REALMS.map(realm => {
              const info = REALM_INFO[realm];
              const count = stats.realmsCompleted[realm] || 0;
              return (
                <div
                  key={realm}
                  style={{
                    padding: '12px',
                    background: count > 0 ? `${info.color}20` : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: count > 0 ? `1px solid ${info.color}40` : '1px solid transparent',
                  }}
                >
                  <div style={{ color: count > 0 ? info.color : '#666', fontSize: '24px', fontWeight: 700 }}>
                    {count}
                  </div>
                  <div style={{ color: '#888', fontSize: '11px' }}>
                    {info.name.split(' ')[1] || info.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best times */}
        <div>
          <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '12px' }}>
            Best Times
          </h3>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {REALMS.map(realm => {
              const info = REALM_INFO[realm];
              const times = stats.bestTimes[realm] || {};
              const hasTimes = Object.keys(times).length > 0;

              return (
                <div
                  key={realm}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ color: info.color, fontSize: '13px' }}>{info.name}</div>
                  {hasTimes ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {Object.entries(times).map(([diff, time]) => (
                        <div
                          key={diff}
                          style={{
                            padding: '4px 8px',
                            background: SHARD_GRADES[diff]?.color || '#666',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#fff',
                          }}
                        >
                          {formatTime(time)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', fontSize: '12px' }}>—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* NFT Stats */}
        <div>
          <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '12px' }}>
            NFTs Earned
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {[
              { label: 'Shards', value: stats.shardsEarned, emoji: '💎' },
              { label: 'Prism Keys', value: stats.prismKeysForged, emoji: '🔑' },
              { label: 'Crowns', value: stats.crownsEarned, emoji: '👑' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 215, 0, 0.05)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: item.value > 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.emoji}</div>
                <div style={{ color: '#ffd700', fontSize: '24px', fontWeight: 700 }}>
                  {item.value}
                </div>
                <div style={{ color: '#888', fontSize: '11px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement: Highest Difficulty */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          textAlign: 'center',
        }}>
          <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
            HIGHEST DIFFICULTY COMPLETED
          </div>
          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            background: SHARD_GRADES[stats.highestDifficulty]?.color || '#666',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}>
            {stats.highestDifficulty}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      overflow: 'auto',
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>🏆</span>
            Leaderboard
          </h1>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              background: '#333',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #333',
          paddingBottom: '16px',
        }}>
          {[
            { id: 'leaderboard', label: 'Rankings', icon: '🏆' },
            { id: 'stats', label: 'My Stats', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                borderRadius: '8px',
                color: activeTab === tab.id ? '#3b82f6' : '#888',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'leaderboard' ? renderLeaderboardTab() : renderStatsTab()}
      </div>
    </div>
  );
}

// Helper: Format play time
function formatPlayTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
