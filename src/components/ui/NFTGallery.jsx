"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { getUserNFTs, SHARD_GRADES, REALM_INFO, NFT_TYPES } from '@/utils/nft';

export default function NFTGallery({ isOpen, onClose }) {
  const wallet = useWallet();
  const [nfts, setNfts] = useState({ shards: [], prismKeys: [], crowns: [] });
  const [activeTab, setActiveTab] = useState('shards');
  const [selectedNFT, setSelectedNFT] = useState(null);

  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      getUserNFTs(wallet.provider, wallet.chainId, wallet.address)
        .then(setNfts)
        .catch(console.error);
    }
  }, [wallet.isConnected, wallet.address, wallet.chainId, wallet.provider]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'shards', label: 'Shards', count: nfts.shards.length, emoji: '💎' },
    { id: 'prismKeys', label: 'Prism Keys', count: nfts.prismKeys.length, emoji: '🔑' },
    { id: 'crowns', label: 'Crowns', count: nfts.crowns.length, emoji: '👑' },
  ];

  const renderShardCard = (shard, index) => {
    const realmInfo = REALM_INFO[shard.realm] || REALM_INFO.rabbit;
    const gradeInfo = SHARD_GRADES[shard.metadata?.properties?.difficulty] || { color: '#4ade80' };

    return (
      <div
        key={index}
        onClick={() => setSelectedNFT({ ...shard, type: NFT_TYPES.SHARD })}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          border: `1px solid ${gradeInfo.color}40`,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 8px 30px ${gradeInfo.color}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '100%',
          aspectRatio: '1',
          background: `linear-gradient(135deg, ${realmInfo.color}30 0%, ${realmInfo.color}10 100%)`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '40px' }}>💎</span>
        </div>
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          {realmInfo.name}
        </div>
        <div style={{
          display: 'inline-block',
          padding: '2px 8px',
          background: gradeInfo.color,
          borderRadius: '4px',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
        }}>
          {shard.grade}
        </div>
      </div>
    );
  };

  const renderPrismKeyCard = (key, index) => {
    return (
      <div
        key={index}
        onClick={() => setSelectedNFT({ ...key, type: NFT_TYPES.PRISM_KEY })}
        style={{
          background: 'linear-gradient(180deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%)',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '100%',
          aspectRatio: '1',
          background: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 25%, #4ecdc4 50%, #a855f7 75%, #ffd700 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '40px' }}>🔑</span>
        </div>
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Prism Key
        </div>
        <div style={{
          display: 'inline-block',
          padding: '2px 8px',
          background: '#ffd700',
          borderRadius: '4px',
          color: '#000',
          fontSize: '11px',
          fontWeight: 700,
        }}>
          {key.grade}
        </div>
      </div>
    );
  };

  const renderCrownCard = (crown, index) => {
    return (
      <div
        key={index}
        onClick={() => setSelectedNFT({ ...crown, type: NFT_TYPES.VICTORY_CROWN })}
        style={{
          background: 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(196,160,0,0.05) 100%)',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          border: '2px solid rgba(255, 215, 0, 0.5)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 40px rgba(255, 215, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '100%',
          aspectRatio: '1',
          background: 'linear-gradient(180deg, #ffd700 0%, #c4a000 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
        }}>
          <span style={{ fontSize: '48px' }}>👑</span>
        </div>
        <div style={{ color: '#ffd700', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
          Victory Crown
        </div>
        <div style={{ color: '#888', fontSize: '11px' }}>
          {crown.prismKeyGrade}/{crown.challengeGrade}
        </div>
      </div>
    );
  };

  const renderNFTDetail = () => {
    if (!selectedNFT) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}>
        <div style={{
          background: '#1a1a2e',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}>
          <button
            onClick={() => setSelectedNFT(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
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

          {/* NFT Image */}
          <div style={{
            width: '200px',
            height: '200px',
            margin: '0 auto 24px',
            background: selectedNFT.type === NFT_TYPES.VICTORY_CROWN
              ? 'linear-gradient(180deg, #ffd700 0%, #c4a000 100%)'
              : selectedNFT.type === NFT_TYPES.PRISM_KEY
              ? 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 25%, #4ecdc4 50%, #a855f7 75%, #ffd700 100%)'
              : `linear-gradient(135deg, ${REALM_INFO[selectedNFT.realm]?.color || '#4ade80'}40 0%, transparent 100%)`,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}>
            <span style={{ fontSize: '80px' }}>
              {selectedNFT.type === NFT_TYPES.VICTORY_CROWN ? '👑' : selectedNFT.type === NFT_TYPES.PRISM_KEY ? '🔑' : '💎'}
            </span>
          </div>

          {/* NFT Info */}
          <h2 style={{ color: '#fff', fontSize: '24px', textAlign: 'center', marginBottom: '8px' }}>
            {selectedNFT.metadata?.name || 'NFT'}
          </h2>
          <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
            {selectedNFT.metadata?.description}
          </p>

          {/* Attributes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {selectedNFT.metadata?.attributes?.map((attr, i) => (
              <div
                key={i}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                  {attr.trait_type}
                </div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {attr.value}
                </div>
              </div>
            ))}
          </div>

          {/* Token Info */}
          {selectedNFT.tokenId && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              borderTop: '1px solid #333',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>Token ID</span>
                <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}>
                  #{selectedNFT.tokenId}
                </span>
              </div>
              {selectedNFT.demo && (
                <div style={{ color: '#f59e0b', fontSize: '11px', textAlign: 'center' }}>
                  Demo NFT - Not on blockchain
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setSelectedNFT(null)}
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
            Close
          </button>
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
        maxWidth: '800px',
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
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>
            My NFTs
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

        {!wallet.isConnected ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
              Connect Your Wallet
            </h2>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Connect your wallet to view your NFT collection
            </p>
            <button
              onClick={wallet.connect}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              borderBottom: '1px solid #333',
              paddingBottom: '16px',
            }}>
              {tabs.map(tab => (
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
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Grid */}
            {activeTab === 'shards' && (
              nfts.shards.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#888',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💎</div>
                  <p>No shards yet. Complete realms to earn shards!</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                }}>
                  {nfts.shards.map(renderShardCard)}
                </div>
              )
            )}

            {activeTab === 'prismKeys' && (
              nfts.prismKeys.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#888',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔑</div>
                  <p>No Prism Keys yet. Collect all 4 realm shards to forge one!</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                }}>
                  {nfts.prismKeys.map(renderPrismKeyCard)}
                </div>
              )
            )}

            {activeTab === 'crowns' && (
              nfts.crowns.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#888',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>👑</div>
                  <p>No Victory Crowns yet. Defeat the Temporal Wraith to earn one!</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                }}>
                  {nfts.crowns.map(renderCrownCard)}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* NFT Detail Modal */}
      {renderNFTDetail()}
    </div>
  );
}
