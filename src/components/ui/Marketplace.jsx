"use client";

import { useState, useEffect } from 'react';
import { useMarketplace, formatPrice, getSuggestedPrice } from '@/hooks/useMarketplace';
import { useWallet, shortenAddress } from '@/hooks/useWallet';
import { getUserNFTs, REALM_INFO, SHARD_GRADES, NFT_TYPES } from '@/utils/nft';

const TABS = ['browse', 'my_listings', 'sell', 'history'];
const NFT_TYPE_OPTIONS = [
  { value: 'shard', label: 'Shards', emoji: '💎' },
  { value: 'prism_key', label: 'Prism Keys', emoji: '🔑' },
  { value: 'victory_crown', label: 'Victory Crowns', emoji: '👑' },
];

export default function Marketplace({ isOpen, onClose }) {
  const wallet = useWallet();
  const marketplace = useMarketplace();
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState({});
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [listPrice, setListPrice] = useState('');
  const [userNFTs, setUserNFTs] = useState({ shards: [], prismKeys: [], crowns: [] });
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    if (isOpen) {
      marketplace.fetchListings(filters);
      marketplace.fetchTransactions();
      if (wallet.isConnected && wallet.address) {
        getUserNFTs(wallet.provider, wallet.chainId, wallet.address)
          .then(setUserNFTs);
      }
    }
  }, [isOpen, wallet.isConnected, wallet.address]);

  useEffect(() => {
    marketplace.fetchListings(filters);
  }, [filters]);

  if (!isOpen) return null;

  const handleCreateListing = async () => {
    if (!selectedNFT || !listPrice) return;

    const result = await marketplace.createListing(
      selectedNFT,
      parseFloat(listPrice),
      'ETH'
    );

    if (result.success) {
      setSelectedNFT(null);
      setListPrice('');
      setActiveTab('my_listings');
    }
  };

  const handleBuy = async (listing) => {
    const result = await marketplace.buyListing(listing.id);
    if (result.success) {
      setSelectedListing(null);
      // Refresh user NFTs
      if (wallet.address) {
        getUserNFTs(wallet.provider, wallet.chainId, wallet.address)
          .then(setUserNFTs);
      }
    }
  };

  const renderListingCard = (listing, showActions = true) => {
    const nft = listing.nft;
    const realmInfo = REALM_INFO[nft.realm] || {};
    const gradeInfo = SHARD_GRADES[nft.metadata?.properties?.difficulty] || {};

    return (
      <div
        key={listing.id}
        onClick={() => setSelectedListing(listing)}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          border: '1px solid #333',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* NFT Image */}
        <div style={{
          width: '100%',
          aspectRatio: '1',
          background: nft.type === 'victory_crown'
            ? 'linear-gradient(180deg, #ffd700 0%, #c4a000 100%)'
            : nft.type === 'prism_key'
            ? 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 25%, #4ecdc4 50%, #a855f7 75%, #ffd700 100%)'
            : `linear-gradient(135deg, ${realmInfo.color || '#4ade80'}40 0%, transparent 100%)`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '40px' }}>
            {nft.type === 'victory_crown' ? '👑' : nft.type === 'prism_key' ? '🔑' : '💎'}
          </span>
        </div>

        {/* NFT Info */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
            {nft.metadata?.name || `${nft.type} NFT`}
          </div>
          {nft.grade && (
            <div style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: gradeInfo.color || '#4ade80',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              marginTop: '4px',
            }}>
              {nft.grade}
            </div>
          )}
        </div>

        {/* Seller */}
        <div style={{
          color: '#888',
          fontSize: '11px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span>by</span>
          <span style={{ fontFamily: 'monospace' }}>
            {shortenAddress(listing.seller)}
          </span>
        </div>

        {/* Price */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            color: '#4ade80',
            fontSize: '16px',
            fontWeight: 700,
          }}>
            {formatPrice(listing.price, listing.currency)}
          </div>
          {showActions && listing.seller.toLowerCase() !== wallet.address?.toLowerCase() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBuy(listing);
              }}
              style={{
                padding: '6px 12px',
                background: '#4ade80',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Buy
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderBrowseTab = () => (
    <>
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <select
          value={filters.type || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
          style={{
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
          }}
        >
          <option value="">All Types</option>
          {NFT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
          ))}
        </select>

        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          style={{
            padding: '8px 12px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Listings grid */}
      {marketplace.listings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🏪</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No listings yet</h3>
          <p style={{ color: '#888' }}>Be the first to list an NFT for sale!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
        }}>
          {marketplace.listings.map(listing => renderListingCard(listing))}
        </div>
      )}
    </>
  );

  const renderMyListingsTab = () => (
    <>
      {marketplace.userListings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No active listings</h3>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            You haven't listed any NFTs for sale yet.
          </p>
          <button
            onClick={() => setActiveTab('sell')}
            style={{
              padding: '12px 24px',
              background: '#4ade80',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            List an NFT
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
        }}>
          {marketplace.userListings.map(listing => (
            <div key={listing.id}>
              {renderListingCard(listing, false)}
              <button
                onClick={() => marketplace.cancelListing(listing.id)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel Listing
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderSellTab = () => {
    if (!wallet.isConnected) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>Connect Wallet</h3>
          <p style={{ color: '#888', marginBottom: '16px' }}>
            Connect your wallet to list NFTs for sale.
          </p>
          <button
            onClick={wallet.connect}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Connect Wallet
          </button>
        </div>
      );
    }

    const allNFTs = [
      ...userNFTs.shards.map(n => ({ ...n, type: 'shard' })),
      ...userNFTs.prismKeys.map(n => ({ ...n, type: 'prism_key' })),
      ...userNFTs.crowns.map(n => ({ ...n, type: 'victory_crown' })),
    ];

    return (
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* NFT Selection */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>
            Select NFT to List
          </h3>

          {allNFTs.length === 0 ? (
            <div style={{
              padding: '40px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#888',
            }}>
              <p>No NFTs to sell. Earn them by completing realms!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '12px',
              maxHeight: '400px',
              overflow: 'auto',
            }}>
              {allNFTs.map((nft, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedNFT(nft);
                    setListPrice(getSuggestedPrice(nft).toFixed(4));
                  }}
                  style={{
                    padding: '12px',
                    background: selectedNFT === nft
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: selectedNFT === nft
                      ? '2px solid #3b82f6'
                      : '2px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {nft.type === 'victory_crown' ? '👑' : nft.type === 'prism_key' ? '🔑' : '💎'}
                  </div>
                  <div style={{ color: '#fff', fontSize: '11px' }}>
                    {nft.grade || 'C'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listing Form */}
        <div style={{
          flex: '1',
          minWidth: '280px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
        }}>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>
            Listing Details
          </h3>

          {selectedNFT ? (
            <>
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                  {selectedNFT.type === 'victory_crown' ? '👑' : selectedNFT.type === 'prism_key' ? '🔑' : '💎'}
                </div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {selectedNFT.metadata?.name || `${selectedNFT.type} NFT`}
                </div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  Grade: {selectedNFT.grade || 'C'}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                  Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                  }}
                  placeholder="0.01"
                />
                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                  Suggested: {getSuggestedPrice(selectedNFT).toFixed(4)} ETH
                </div>
              </div>

              <button
                onClick={handleCreateListing}
                disabled={!listPrice || parseFloat(listPrice) <= 0 || marketplace.isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: listPrice && parseFloat(listPrice) > 0
                    ? '#4ade80'
                    : '#444',
                  border: 'none',
                  borderRadius: '8px',
                  color: listPrice && parseFloat(listPrice) > 0 ? '#000' : '#888',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: listPrice && parseFloat(listPrice) > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {marketplace.isLoading ? 'Creating...' : 'Create Listing'}
              </button>
            </>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
              Select an NFT to list
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <>
      {marketplace.transactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📜</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No transactions yet</h3>
          <p style={{ color: '#888' }}>Your purchase and sale history will appear here.</p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {marketplace.transactions.map(tx => {
            const isBuyer = tx.buyer?.toLowerCase() === wallet.address?.toLowerCase();

            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderBottom: '1px solid #222',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {tx.listing?.nft?.type === 'victory_crown' ? '👑' :
                     tx.listing?.nft?.type === 'prism_key' ? '🔑' : '💎'}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>
                      {isBuyer ? 'Purchased' : 'Sold'} {tx.listing?.nft?.metadata?.name || 'NFT'}
                    </div>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                      {isBuyer ? 'from' : 'to'} {shortenAddress(isBuyer ? tx.seller : tx.buyer)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    color: isBuyer ? '#ef4444' : '#4ade80',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}>
                    {isBuyer ? '-' : '+'}{formatPrice(tx.price, tx.currency)}
                  </div>
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

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
        maxWidth: '900px',
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
          <h1 style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span>🏪</span>
            Marketplace
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
            { id: 'browse', label: 'Browse', icon: '🔍' },
            { id: 'my_listings', label: 'My Listings', icon: '📋' },
            { id: 'sell', label: 'Sell', icon: '💰' },
            { id: 'history', label: 'History', icon: '📜' },
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
        {activeTab === 'browse' && renderBrowseTab()}
        {activeTab === 'my_listings' && renderMyListingsTab()}
        {activeTab === 'sell' && renderSellTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div
          style={{
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
          }}
          onClick={() => setSelectedListing(null)}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '150px',
              height: '150px',
              margin: '0 auto 24px',
              background: selectedListing.nft.type === 'victory_crown'
                ? 'linear-gradient(180deg, #ffd700 0%, #c4a000 100%)'
                : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '64px' }}>
                {selectedListing.nft.type === 'victory_crown' ? '👑' :
                 selectedListing.nft.type === 'prism_key' ? '🔑' : '💎'}
              </span>
            </div>

            <h2 style={{ color: '#fff', fontSize: '20px', textAlign: 'center', marginBottom: '8px' }}>
              {selectedListing.nft.metadata?.name}
            </h2>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <span style={{
                padding: '4px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#888',
                fontSize: '12px',
              }}>
                by {shortenAddress(selectedListing.seller)}
              </span>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: 'rgba(74, 222, 128, 0.1)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>Price</div>
              <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: 700 }}>
                {formatPrice(selectedListing.price, selectedListing.currency)}
              </div>
            </div>

            {selectedListing.seller.toLowerCase() !== wallet.address?.toLowerCase() ? (
              <button
                onClick={() => handleBuy(selectedListing)}
                disabled={marketplace.isLoading}
                style={{
                  width: '100%',
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
                {marketplace.isLoading ? 'Processing...' : 'Buy Now'}
              </button>
            ) : (
              <button
                onClick={() => {
                  marketplace.cancelListing(selectedListing.id);
                  setSelectedListing(null);
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel Listing
              </button>
            )}

            <button
              onClick={() => setSelectedListing(null)}
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
