"use client";

import { useState, useCallback } from 'react';
import { useWallet, shortenAddress } from '@/hooks/useWallet';
import {
  NFT_TYPES,
  SHARD_GRADES,
  REALM_INFO,
  generateShardMetadata,
  generatePrismKeyMetadata,
  generateVictoryCrownMetadata,
  calculateAverageGrade,
  mintShard,
  mintPrismKey,
  mintVictoryCrown,
  saveNFTLocally,
} from '@/utils/nft';

export default function MintModal({
  isOpen,
  onClose,
  type = NFT_TYPES.SHARD,
  // For Shard
  realm,
  difficulty,
  time,
  coins,
  collectibles,
  // For Prism Key
  shards,
  // For Victory Crown
  prismKeyGrade,
  livesRemaining,
}) {
  const wallet = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [error, setError] = useState(null);

  const gradeInfo = SHARD_GRADES[difficulty] || SHARD_GRADES.normal;
  const realmInfo = REALM_INFO[realm] || REALM_INFO.rabbit;

  const handleMint = useCallback(async () => {
    if (!wallet.isConnected) {
      await wallet.connect();
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      let metadata, result;
      const timestamp = Date.now();

      switch (type) {
        case NFT_TYPES.SHARD:
          metadata = generateShardMetadata({
            realm,
            difficulty,
            time,
            coins,
            collectibles,
            timestamp,
          });
          result = await mintShard(
            wallet.provider,
            wallet.chainId,
            wallet.address,
            metadata
          );
          if (result.success) {
            saveNFTLocally(wallet.address, NFT_TYPES.SHARD, {
              ...result,
              metadata,
              realm,
              grade: gradeInfo.grade,
            });
          }
          break;

        case NFT_TYPES.PRISM_KEY:
          const avgGrade = calculateAverageGrade(shards);
          metadata = generatePrismKeyMetadata({
            shards,
            averageGrade: avgGrade,
            timestamp,
          });
          result = await mintPrismKey(
            wallet.provider,
            wallet.chainId,
            wallet.address,
            metadata,
            [] // shard token IDs would be passed in production
          );
          if (result.success) {
            saveNFTLocally(wallet.address, NFT_TYPES.PRISM_KEY, {
              ...result,
              metadata,
              grade: avgGrade,
            });
          }
          break;

        case NFT_TYPES.VICTORY_CROWN:
          metadata = generateVictoryCrownMetadata({
            prismKeyGrade,
            difficulty,
            time,
            livesRemaining,
            timestamp,
          });
          result = await mintVictoryCrown(
            wallet.provider,
            wallet.chainId,
            wallet.address,
            metadata,
            null // prism key token ID would be passed in production
          );
          if (result.success) {
            saveNFTLocally(wallet.address, NFT_TYPES.VICTORY_CROWN, {
              ...result,
              metadata,
              prismKeyGrade,
              challengeGrade: gradeInfo.grade,
            });
          }
          break;
      }

      setMintResult(result);
    } catch (err) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  }, [wallet, type, realm, difficulty, time, coins, collectibles, shards, prismKeyGrade, livesRemaining, gradeInfo.grade]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (mintResult) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>
            {type === NFT_TYPES.VICTORY_CROWN ? '👑' : type === NFT_TYPES.PRISM_KEY ? '🔑' : '💎'}
          </div>
          <h2 style={{
            color: '#4ade80',
            fontSize: '24px',
            marginBottom: '8px',
          }}>
            {mintResult.demo ? 'Demo Mint Successful!' : 'Minted Successfully!'}
          </h2>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            {mintResult.demo
              ? 'This is a demo mint. Connect to a supported network to mint real NFTs.'
              : `Token ID: ${mintResult.tokenId}`
            }
          </p>
          {mintResult.txHash && !mintResult.demo && (
            <a
              href={`https://etherscan.io/tx/${mintResult.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', fontSize: '14px' }}
            >
              View Transaction
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              background: '#4ade80',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      );
    }

    return (
      <>
        {/* NFT Preview */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          {type === NFT_TYPES.SHARD && (
            <>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 16px',
                background: `linear-gradient(135deg, ${realmInfo.color}40 0%, ${realmInfo.color}20 100%)`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${gradeInfo.color}`,
                boxShadow: `0 0 30px ${gradeInfo.color}40`,
              }}>
                <span style={{ fontSize: '48px' }}>💎</span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>
                {realmInfo.name} Shard
              </h3>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: gradeInfo.color,
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
              }}>
                Grade {gradeInfo.grade}
              </div>
            </>
          )}

          {type === NFT_TYPES.PRISM_KEY && (
            <>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 25%, #4ecdc4 50%, #a855f7 75%, #ffd700 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
              }}>
                <span style={{ fontSize: '48px' }}>🔑</span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>
                Prism Key
              </h3>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: SHARD_GRADES[Object.values(shards)[0]?.difficulty]?.color || '#4ade80',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
              }}>
                Grade {calculateAverageGrade(shards)}
              </div>
            </>
          )}

          {type === NFT_TYPES.VICTORY_CROWN && (
            <>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 16px',
                background: 'linear-gradient(180deg, #ffd700 0%, #c4a000 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.5)',
              }}>
                <span style={{ fontSize: '56px' }}>👑</span>
              </div>
              <h3 style={{ color: '#ffd700', fontSize: '20px', marginBottom: '4px' }}>
                Victory Crown
              </h3>
              <div style={{ color: '#888', fontSize: '14px' }}>
                Prism: {prismKeyGrade} | Challenge: {gradeInfo.grade}
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {time !== undefined && (
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Time</div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}
          {coins !== undefined && (
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Coins</div>
              <div style={{ color: '#ffd700', fontSize: '16px', fontWeight: 600 }}>
                {coins}
              </div>
            </div>
          )}
          {collectibles !== undefined && (
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Collectibles</div>
              <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: 600 }}>
                {collectibles}
              </div>
            </div>
          )}
          {livesRemaining !== undefined && (
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>Lives</div>
              <div style={{ color: '#ef4444', fontSize: '16px', fontWeight: 600 }}>
                {livesRemaining}
              </div>
            </div>
          )}
        </div>

        {/* Wallet connection */}
        {!wallet.isConnected ? (
          <button
            onClick={wallet.connect}
            disabled={wallet.isConnecting}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: wallet.isConnecting ? 'wait' : 'pointer',
              opacity: wallet.isConnecting ? 0.7 : 1,
            }}
          >
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet to Mint'}
          </button>
        ) : (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4ade80',
                }} />
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  {shortenAddress(wallet.address)}
                </span>
              </div>
              <button
                onClick={wallet.disconnect}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid #666',
                  borderRadius: '4px',
                  color: '#888',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            </div>

            <button
              onClick={handleMint}
              disabled={isMinting}
              style={{
                width: '100%',
                padding: '14px',
                background: isMinting
                  ? '#444'
                  : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                border: 'none',
                borderRadius: '8px',
                color: isMinting ? '#888' : '#000',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isMinting ? 'wait' : 'pointer',
              }}
            >
              {isMinting ? 'Minting...' : `Mint ${type === NFT_TYPES.VICTORY_CROWN ? 'Crown' : type === NFT_TYPES.PRISM_KEY ? 'Key' : 'Shard'}`}
            </button>
          </>
        )}

        {error && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px',
            background: 'transparent',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#888',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Skip for now
        </button>
      </>
    );
  };

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
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid #333',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
          }}>
            {type === NFT_TYPES.VICTORY_CROWN
              ? 'Claim Your Crown!'
              : type === NFT_TYPES.PRISM_KEY
              ? 'Forge Prism Key'
              : 'Mint Shard NFT'
            }
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
