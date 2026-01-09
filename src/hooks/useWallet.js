"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Wallet context for app-wide wallet state
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const wallet = useWalletState();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    // Return default state if not in provider (for SSR)
    return {
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
      error: null,
      connect: () => {},
      disconnect: () => {},
      switchChain: () => {},
    };
  }
  return context;
}

// Supported chains
export const CHAINS = {
  ETHEREUM: { id: 1, name: 'Ethereum', symbol: 'ETH' },
  POLYGON: { id: 137, name: 'Polygon', symbol: 'MATIC' },
  BASE: { id: 8453, name: 'Base', symbol: 'ETH' },
  ARBITRUM: { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  // Testnets
  SEPOLIA: { id: 11155111, name: 'Sepolia', symbol: 'ETH' },
  MUMBAI: { id: 80001, name: 'Mumbai', symbol: 'MATIC' },
};

// Default chain for the game
export const DEFAULT_CHAIN = CHAINS.BASE;

function useWalletState() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  // Check if MetaMask or other wallet is available
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.ethereum;
  }, []);

  // Initialize - check for existing connection
  useEffect(() => {
    const checkConnection = async () => {
      const provider = getProvider();
      if (!provider) return;

      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);

          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainIdHex, 16));

          // Get balance
          const balanceHex = await provider.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          });
          setBalance(parseInt(balanceHex, 16) / 1e18);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    };

    checkConnection();
  }, [getProvider]);

  // Listen for account and chain changes
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
        setBalance(null);
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
        // Refresh balance
        provider.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        }).then(balanceHex => {
          setBalance(parseInt(balanceHex, 16) / 1e18);
        });
      }
    };

    const handleChainChanged = (chainIdHex) => {
      setChainId(parseInt(chainIdHex, 16));
      // Refresh balance on chain change
      if (address) {
        provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }).then(balanceHex => {
          setBalance(parseInt(balanceHex, 16) / 1e18);
        });
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [getProvider, address]);

  // Connect wallet
  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError('No wallet found. Please install MetaMask or another Web3 wallet.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);

        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex, 16));

        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        });
        setBalance(parseInt(balanceHex, 16) / 1e18);

        setIsConnecting(false);
        return true;
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
      return false;
    }

    setIsConnecting(false);
    return false;
  }, [getProvider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setBalance(null);
    setError(null);
  }, []);

  // Switch chain
  const switchChain = useCallback(async (targetChainId) => {
    const provider = getProvider();
    if (!provider) return false;

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        const chainInfo = Object.values(CHAINS).find(c => c.id === targetChainId);
        if (chainInfo) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: chainIdHex,
                chainName: chainInfo.name,
                nativeCurrency: {
                  name: chainInfo.symbol,
                  symbol: chainInfo.symbol,
                  decimals: 18,
                },
                rpcUrls: getChainRpcUrls(targetChainId),
                blockExplorerUrls: getChainExplorerUrls(targetChainId),
              }],
            });
            return true;
          } catch (addError) {
            console.error('Error adding chain:', addError);
            setError('Failed to add network');
            return false;
          }
        }
      }
      console.error('Error switching chain:', switchError);
      setError('Failed to switch network');
      return false;
    }
  }, [getProvider]);

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    balance,
    error,
    connect,
    disconnect,
    switchChain,
    provider: getProvider(),
  };
}

// Helper functions for chain info
function getChainRpcUrls(chainId) {
  const urls = {
    1: ['https://mainnet.infura.io/v3/'],
    137: ['https://polygon-rpc.com'],
    8453: ['https://mainnet.base.org'],
    42161: ['https://arb1.arbitrum.io/rpc'],
    11155111: ['https://sepolia.infura.io/v3/'],
    80001: ['https://rpc-mumbai.maticvigil.com'],
  };
  return urls[chainId] || [];
}

function getChainExplorerUrls(chainId) {
  const urls = {
    1: ['https://etherscan.io'],
    137: ['https://polygonscan.com'],
    8453: ['https://basescan.org'],
    42161: ['https://arbiscan.io'],
    11155111: ['https://sepolia.etherscan.io'],
    80001: ['https://mumbai.polygonscan.com'],
  };
  return urls[chainId] || [];
}

// Utility: shorten address for display
export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Utility: format balance
export function formatBalance(balance, decimals = 4) {
  if (balance === null || balance === undefined) return '0';
  return balance.toFixed(decimals);
}
