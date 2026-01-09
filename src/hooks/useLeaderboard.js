"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const LeaderboardContext = createContext(null);

export function LeaderboardProvider({ children }) {
  const leaderboard = useLeaderboardState();
  return (
    <LeaderboardContext.Provider value={leaderboard}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    return {
      entries: {},
      playerStats: null,
      isLoading: false,
      error: null,
      fetchLeaderboard: () => {},
      submitScore: () => {},
      fetchPlayerStats: () => {},
    };
  }
  return context;
}

// Storage keys
const LEADERBOARD_KEY = 'cooter_leaderboard';
const PLAYER_STATS_KEY = 'cooter_player_stats';

// Default player stats structure
const DEFAULT_STATS = {
  totalPlayTime: 0,
  realmsCompleted: {
    rabbit: 0,
    cat: 0,
    frog: 0,
    owl: 0,
    elf: 0,
  },
  bestTimes: {
    rabbit: {},
    cat: {},
    frog: {},
    owl: {},
    elf: {},
  },
  totalCoins: 0,
  totalCollectibles: 0,
  shardsEarned: 0,
  prismKeysForged: 0,
  crownsEarned: 0,
  deathCount: 0,
  highestDifficulty: 'beginner',
};

function useLeaderboardState() {
  const [entries, setEntries] = useState({});
  const [playerStats, setPlayerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load leaderboard and stats from localStorage on mount
  useEffect(() => {
    try {
      const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
      if (storedLeaderboard) {
        setEntries(JSON.parse(storedLeaderboard));
      } else {
        // Initialize with empty structure
        const initial = {
          rabbit: { beginner: [], easy: [], normal: [], hard: [], expert: [], master: [], impossible: [] },
          cat: { beginner: [], easy: [], normal: [], hard: [], expert: [], master: [], impossible: [] },
          frog: { beginner: [], easy: [], normal: [], hard: [], expert: [], master: [], impossible: [] },
          owl: { beginner: [], easy: [], normal: [], hard: [], expert: [], master: [], impossible: [] },
          elf: { beginner: [], easy: [], normal: [], hard: [], expert: [], master: [], impossible: [] },
        };
        setEntries(initial);
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(initial));
      }

      const storedStats = localStorage.getItem(PLAYER_STATS_KEY);
      if (storedStats) {
        setPlayerStats(JSON.parse(storedStats));
      } else {
        setPlayerStats({ ...DEFAULT_STATS });
        localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(DEFAULT_STATS));
      }
    } catch (err) {
      console.error('Error loading leaderboard data:', err);
      setError('Failed to load leaderboard');
    }
  }, []);

  // Fetch leaderboard for a specific realm/difficulty
  const fetchLeaderboard = useCallback(async (realm, difficulty) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch from an API
      // For now, we use localStorage
      const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
      if (storedLeaderboard) {
        const data = JSON.parse(storedLeaderboard);
        setEntries(data);
        setIsLoading(false);
        return data[realm]?.[difficulty] || [];
      }
      setIsLoading(false);
      return [];
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard');
      setIsLoading(false);
      return [];
    }
  }, []);

  // Submit a score to the leaderboard
  const submitScore = useCallback(async ({
    realm,
    difficulty,
    playerName,
    walletAddress,
    time,
    coins,
    collectibles,
    livesRemaining,
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate score
      const baseScore = Math.max(0, 10000 - time * 10);
      const coinBonus = coins * 5;
      const collectibleBonus = collectibles * 50;
      const livesBonus = (livesRemaining || 0) * 100;
      const difficultyMultiplier = getDifficultyMultiplier(difficulty);
      const totalScore = Math.round((baseScore + coinBonus + collectibleBonus + livesBonus) * difficultyMultiplier);

      const entry = {
        id: Date.now().toString(),
        playerName: playerName || 'Anonymous',
        walletAddress: walletAddress || null,
        time,
        coins,
        collectibles,
        livesRemaining,
        score: totalScore,
        timestamp: Date.now(),
        difficulty,
      };

      // Update local storage
      const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
      const leaderboard = storedLeaderboard ? JSON.parse(storedLeaderboard) : {};

      if (!leaderboard[realm]) {
        leaderboard[realm] = {};
      }
      if (!leaderboard[realm][difficulty]) {
        leaderboard[realm][difficulty] = [];
      }

      // Add entry and sort by score (descending)
      leaderboard[realm][difficulty].push(entry);
      leaderboard[realm][difficulty].sort((a, b) => b.score - a.score);

      // Keep only top 100
      leaderboard[realm][difficulty] = leaderboard[realm][difficulty].slice(0, 100);

      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
      setEntries(leaderboard);

      // Update player stats
      updatePlayerStats(realm, difficulty, time, coins, collectibles);

      setIsLoading(false);

      // Find rank
      const rank = leaderboard[realm][difficulty].findIndex(e => e.id === entry.id) + 1;
      return { success: true, entry, rank };

    } catch (err) {
      console.error('Error submitting score:', err);
      setError('Failed to submit score');
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Update player stats
  const updatePlayerStats = useCallback((realm, difficulty, time, coins, collectibles) => {
    setPlayerStats(prev => {
      const stats = prev ? { ...prev } : { ...DEFAULT_STATS };

      // Update completion count
      stats.realmsCompleted[realm] = (stats.realmsCompleted[realm] || 0) + 1;

      // Update best time
      if (!stats.bestTimes[realm][difficulty] || time < stats.bestTimes[realm][difficulty]) {
        stats.bestTimes[realm][difficulty] = time;
      }

      // Update totals
      stats.totalCoins += coins;
      stats.totalCollectibles += collectibles;

      // Track highest difficulty completed
      const difficulties = ['beginner', 'easy', 'normal', 'hard', 'expert', 'master', 'impossible'];
      const currentIdx = difficulties.indexOf(stats.highestDifficulty);
      const newIdx = difficulties.indexOf(difficulty);
      if (newIdx > currentIdx) {
        stats.highestDifficulty = difficulty;
      }

      localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
      return stats;
    });
  }, []);

  // Fetch player stats
  const fetchPlayerStats = useCallback(async (walletAddress) => {
    try {
      // In production, fetch from API based on wallet
      const storedStats = localStorage.getItem(PLAYER_STATS_KEY);
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        setPlayerStats(stats);
        return stats;
      }
      return DEFAULT_STATS;
    } catch (err) {
      console.error('Error fetching player stats:', err);
      return DEFAULT_STATS;
    }
  }, []);

  // Record a death
  const recordDeath = useCallback(() => {
    setPlayerStats(prev => {
      const stats = prev ? { ...prev } : { ...DEFAULT_STATS };
      stats.deathCount++;
      localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
      return stats;
    });
  }, []);

  // Add play time
  const addPlayTime = useCallback((seconds) => {
    setPlayerStats(prev => {
      const stats = prev ? { ...prev } : { ...DEFAULT_STATS };
      stats.totalPlayTime += seconds;
      localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
      return stats;
    });
  }, []);

  // Record NFT earned
  const recordNFTEarned = useCallback((type) => {
    setPlayerStats(prev => {
      const stats = prev ? { ...prev } : { ...DEFAULT_STATS };
      switch (type) {
        case 'shard':
          stats.shardsEarned++;
          break;
        case 'prismKey':
          stats.prismKeysForged++;
          break;
        case 'crown':
          stats.crownsEarned++;
          break;
      }
      localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
      return stats;
    });
  }, []);

  return {
    entries,
    playerStats,
    isLoading,
    error,
    fetchLeaderboard,
    submitScore,
    fetchPlayerStats,
    recordDeath,
    addPlayTime,
    recordNFTEarned,
  };
}

// Helper: Get difficulty multiplier for scoring
function getDifficultyMultiplier(difficulty) {
  const multipliers = {
    beginner: 0.5,
    easy: 0.75,
    normal: 1.0,
    hard: 1.5,
    expert: 2.0,
    master: 3.0,
    impossible: 5.0,
  };
  return multipliers[difficulty] || 1.0;
}

// Utility: Format time for display
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const ms = Math.round((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Utility: Format large numbers
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Utility: Get rank suffix
export function getRankSuffix(rank) {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
