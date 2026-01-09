"use client";

import { useState } from 'react';
import { useWallet, shortenAddress, formatBalance, CHAINS } from '@/hooks/useWallet';

export default function WalletButton() {
  const wallet = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentChain = Object.values(CHAINS).find(c => c.id === wallet.chainId);

  if (!wallet.isConnected) {
    return (
      <button
        onClick={wallet.connect}
        disabled={wallet.isConnecting}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: wallet.isConnecting ? 'wait' : 'pointer',
          opacity: wallet.isConnecting ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
          <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
        </svg>
        {wallet.isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: 0,
        }}
      >
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#4ade80',
        }} />
        <span>{shortenAddress(wallet.address)}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '220px',
            zIndex: 1000,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}>
            {/* Address */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                Connected
              </div>
              <div style={{
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}>
                {shortenAddress(wallet.address, 6)}
              </div>
            </div>

            {/* Balance */}
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>
                Balance
              </div>
              <div style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: 600,
              }}>
                {formatBalance(wallet.balance)} {currentChain?.symbol || 'ETH'}
              </div>
            </div>

            {/* Network */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <div style={{ color: '#888', fontSize: '12px' }}>
                Network
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: 'rgba(74, 222, 128, 0.1)',
                borderRadius: '4px',
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4ade80',
                }} />
                <span style={{ color: '#4ade80', fontSize: '12px' }}>
                  {currentChain?.name || `Chain ${wallet.chainId}`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              borderTop: '1px solid #333',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(wallet.address);
                  // Could add toast notification here
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Address
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  wallet.disconnect();
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
