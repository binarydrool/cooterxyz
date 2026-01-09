"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useWallet } from './useWallet';
import { REALM_INFO, SHARD_GRADES } from '@/utils/nft';

const MarketplaceContext = createContext(null);

export function MarketplaceProvider({ children }) {
  const marketplace = useMarketplaceState();
  return (
    <MarketplaceContext.Provider value={marketplace}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    return {
      listings: [],
      userListings: [],
      transactions: [],
      isLoading: false,
      error: null,
      fetchListings: () => {},
      createListing: () => {},
      cancelListing: () => {},
      buyListing: () => {},
      fetchTransactions: () => {},
    };
  }
  return context;
}

const MARKETPLACE_KEY = 'cooter_marketplace';
const TRANSACTIONS_KEY = 'cooter_transactions';

function useMarketplaceState() {
  const wallet = useWallet();
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedListings = localStorage.getItem(MARKETPLACE_KEY);
      if (storedListings) {
        setListings(JSON.parse(storedListings));
      }

      const storedTx = localStorage.getItem(TRANSACTIONS_KEY);
      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      }
    } catch (err) {
      console.error('Error loading marketplace data:', err);
    }
  }, []);

  // Get user's listings
  const userListings = listings.filter(
    l => wallet.address && l.seller.toLowerCase() === wallet.address.toLowerCase()
  );

  // Fetch all active listings
  const fetchListings = useCallback(async (filters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const storedListings = localStorage.getItem(MARKETPLACE_KEY);
      let allListings = storedListings ? JSON.parse(storedListings) : [];

      // Filter active listings
      allListings = allListings.filter(l => l.status === 'active');

      // Apply filters
      if (filters.type) {
        allListings = allListings.filter(l => l.nftType === filters.type);
      }
      if (filters.realm) {
        allListings = allListings.filter(l => l.nft?.realm === filters.realm);
      }
      if (filters.minPrice) {
        allListings = allListings.filter(l => l.price >= filters.minPrice);
      }
      if (filters.maxPrice) {
        allListings = allListings.filter(l => l.price <= filters.maxPrice);
      }
      if (filters.grade) {
        allListings = allListings.filter(l => l.nft?.grade === filters.grade);
      }

      // Sort
      if (filters.sortBy === 'price_low') {
        allListings.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price_high') {
        allListings.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === 'newest') {
        allListings.sort((a, b) => b.createdAt - a.createdAt);
      } else if (filters.sortBy === 'oldest') {
        allListings.sort((a, b) => a.createdAt - b.createdAt);
      }

      setListings(allListings);
      setIsLoading(false);
      return allListings;
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings');
      setIsLoading(false);
      return [];
    }
  }, []);

  // Create a new listing
  const createListing = useCallback(async (nft, price, currency = 'ETH') => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const listing = {
        id: Date.now().toString(),
        seller: wallet.address,
        nft,
        nftType: nft.type,
        price,
        currency,
        status: 'active',
        createdAt: Date.now(),
      };

      const storedListings = localStorage.getItem(MARKETPLACE_KEY);
      const allListings = storedListings ? JSON.parse(storedListings) : [];
      allListings.push(listing);
      localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(allListings));

      setListings(allListings.filter(l => l.status === 'active'));
      setIsLoading(false);

      return { success: true, listing };
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('Failed to create listing');
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [wallet.isConnected, wallet.address]);

  // Cancel a listing
  const cancelListing = useCallback(async (listingId) => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const storedListings = localStorage.getItem(MARKETPLACE_KEY);
      const allListings = storedListings ? JSON.parse(storedListings) : [];

      const listingIndex = allListings.findIndex(l => l.id === listingId);
      if (listingIndex === -1) {
        throw new Error('Listing not found');
      }

      const listing = allListings[listingIndex];
      if (listing.seller.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error('Not your listing');
      }

      allListings[listingIndex].status = 'cancelled';
      localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(allListings));

      setListings(allListings.filter(l => l.status === 'active'));
      setIsLoading(false);

      return { success: true };
    } catch (err) {
      console.error('Error cancelling listing:', err);
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [wallet.isConnected, wallet.address]);

  // Buy a listing
  const buyListing = useCallback(async (listingId) => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const storedListings = localStorage.getItem(MARKETPLACE_KEY);
      const allListings = storedListings ? JSON.parse(storedListings) : [];

      const listingIndex = allListings.findIndex(l => l.id === listingId);
      if (listingIndex === -1) {
        throw new Error('Listing not found');
      }

      const listing = allListings[listingIndex];
      if (listing.status !== 'active') {
        throw new Error('Listing is not active');
      }

      if (listing.seller.toLowerCase() === wallet.address.toLowerCase()) {
        throw new Error('Cannot buy your own listing');
      }

      // In production, this would execute the blockchain transaction
      // For demo, we just update the status

      allListings[listingIndex].status = 'sold';
      allListings[listingIndex].buyer = wallet.address;
      allListings[listingIndex].soldAt = Date.now();
      localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(allListings));

      // Record transaction
      const transaction = {
        id: Date.now().toString(),
        type: 'purchase',
        listing: allListings[listingIndex],
        buyer: wallet.address,
        seller: listing.seller,
        price: listing.price,
        currency: listing.currency,
        timestamp: Date.now(),
      };

      const storedTx = localStorage.getItem(TRANSACTIONS_KEY);
      const allTx = storedTx ? JSON.parse(storedTx) : [];
      allTx.push(transaction);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTx));

      // Transfer NFT to buyer's local storage
      const buyerNftsKey = `cooter_nfts_${wallet.address}`;
      const storedNfts = localStorage.getItem(buyerNftsKey);
      const buyerNfts = storedNfts ? JSON.parse(storedNfts) : { shards: [], prismKeys: [], crowns: [] };

      const nft = listing.nft;
      switch (nft.type) {
        case 'shard':
          buyerNfts.shards.push(nft);
          break;
        case 'prism_key':
          buyerNfts.prismKeys.push(nft);
          break;
        case 'victory_crown':
          buyerNfts.crowns.push(nft);
          break;
      }
      localStorage.setItem(buyerNftsKey, JSON.stringify(buyerNfts));

      setListings(allListings.filter(l => l.status === 'active'));
      setTransactions(allTx);
      setIsLoading(false);

      return { success: true, transaction };
    } catch (err) {
      console.error('Error buying listing:', err);
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [wallet.isConnected, wallet.address]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!wallet.address) return [];

    try {
      const storedTx = localStorage.getItem(TRANSACTIONS_KEY);
      const allTx = storedTx ? JSON.parse(storedTx) : [];

      // Filter transactions for current user
      const userTx = allTx.filter(
        tx => tx.buyer?.toLowerCase() === wallet.address.toLowerCase() ||
              tx.seller?.toLowerCase() === wallet.address.toLowerCase()
      );

      setTransactions(userTx);
      return userTx;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  }, [wallet.address]);

  return {
    listings,
    userListings,
    transactions,
    isLoading,
    error,
    fetchListings,
    createListing,
    cancelListing,
    buyListing,
    fetchTransactions,
  };
}

// Price formatting
export function formatPrice(price, currency = 'ETH') {
  return `${price.toFixed(4)} ${currency}`;
}

// Generate suggested price based on NFT attributes
export function getSuggestedPrice(nft) {
  const basePrices = {
    shard: 0.01,
    prism_key: 0.1,
    victory_crown: 1.0,
  };

  const gradeMultipliers = {
    'S+': 10,
    'S': 5,
    'A': 3,
    'B': 2,
    'C': 1,
    'D': 0.5,
    'F': 0.25,
  };

  const base = basePrices[nft.type] || 0.01;
  const multiplier = gradeMultipliers[nft.grade] || 1;

  return base * multiplier;
}
