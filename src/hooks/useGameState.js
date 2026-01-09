"use client";

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Game modes
export const GAME_MODES = {
  HUB: 'hub',
  RABBIT_REALM: 'rabbit_realm',
  CAT_REALM: 'cat_realm',
  FROG_REALM: 'frog_realm',
  OWL_REALM: 'owl_realm',
  ELF_REALM: 'elf_realm',
};

// Difficulty levels
export const DIFFICULTIES = {
  BEGINNER: { name: 'Beginner', color: '#FFFFFF', grade: 'Common', level: 1 },
  EASY: { name: 'Easy', color: '#00FF00', grade: 'Uncommon', level: 2 },
  NORMAL: { name: 'Normal', color: '#FFFF00', grade: 'Rare', level: 3 },
  HARD: { name: 'Hard', color: '#FFA500', grade: 'Epic', level: 4 },
  EXPERT: { name: 'Expert', color: '#FF0000', grade: 'Legendary', level: 5 },
  MASTER: { name: 'Master', color: '#800080', grade: 'Mythic', level: 6 },
  IMPOSSIBLE: { name: 'Impossible', color: '#000000', grade: 'Obsidian', level: 7 },
};

// Initial state
const initialState = {
  freeMode: false,
  currentMode: GAME_MODES.HUB,
  selectedDifficulty: DIFFICULTIES.NORMAL,

  // Realm unlock status
  realmsUnlocked: {
    rabbit: false,
    cat: false,
    frog: false,
    owl: false,
    elf: false,
  },

  // Strike system per animal
  strikes: {
    rabbit: 0,
    cat: 0,
    frog: 0,
    owl: 0,
  },

  // Lockout timestamps (when locked out until)
  lockouts: {
    rabbit: null,
    cat: null,
    frog: null,
    owl: null,
  },

  // Current riddle progress
  riddleProgress: {
    rabbit: [],
    cat: [],
    frog: [],
    owl: [],
  },

  // Best scores per realm per difficulty
  bestScores: {},

  // Total playtime in seconds
  totalPlaytime: 0,
};

const GameStateContext = createContext(null);

// Storage key
const STORAGE_KEY = 'cooter_game_state';

// Load state from localStorage
function loadState() {
  if (typeof window === 'undefined') return initialState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check for midnight reset of strikes
      const now = new Date();
      const lastMidnight = new Date(now);
      lastMidnight.setHours(0, 0, 0, 0);

      if (parsed.lastStrikeReset && new Date(parsed.lastStrikeReset) < lastMidnight) {
        // Reset strikes at midnight
        parsed.strikes = { rabbit: 0, cat: 0, frog: 0, owl: 0 };
      }

      return { ...initialState, ...parsed, lastStrikeReset: now.toISOString() };
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return initialState;
}

// Save state to localStorage
function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastStrikeReset: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function GameStateProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [mounted, setMounted] = useState(false);

  // Load state on mount
  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (mounted) {
      saveState(state);
    }
  }, [state, mounted]);

  // Check and clear lockouts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setState(prev => {
        let changed = false;
        const newLockouts = { ...prev.lockouts };

        Object.keys(newLockouts).forEach(animal => {
          if (newLockouts[animal] && newLockouts[animal] < now) {
            newLockouts[animal] = null;
            changed = true;
          }
        });

        if (changed) {
          return { ...prev, lockouts: newLockouts };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track playtime
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        totalPlaytime: prev.totalPlaytime + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleFreeMode = useCallback(() => {
    setState(prev => ({ ...prev, freeMode: !prev.freeMode }));
  }, []);

  const setGameMode = useCallback((mode) => {
    setState(prev => ({ ...prev, currentMode: mode }));
  }, []);

  const setDifficulty = useCallback((difficulty) => {
    setState(prev => ({ ...prev, selectedDifficulty: difficulty }));
  }, []);

  const unlockRealm = useCallback((realm) => {
    setState(prev => ({
      ...prev,
      realmsUnlocked: { ...prev.realmsUnlocked, [realm]: true },
    }));
  }, []);

  const addStrike = useCallback((animal) => {
    setState(prev => {
      const newStrikes = prev.strikes[animal] + 1;
      const newLockouts = { ...prev.lockouts };

      // 3 strikes = 1 hour lockout
      if (newStrikes >= 3) {
        newLockouts[animal] = Date.now() + (60 * 60 * 1000); // 1 hour
      }

      return {
        ...prev,
        strikes: { ...prev.strikes, [animal]: newStrikes },
        lockouts: newLockouts,
      };
    });
  }, []);

  const resetStrikes = useCallback((animal) => {
    setState(prev => ({
      ...prev,
      strikes: { ...prev.strikes, [animal]: 0 },
    }));
  }, []);

  const updateRiddleProgress = useCallback((animal, essences) => {
    setState(prev => ({
      ...prev,
      riddleProgress: { ...prev.riddleProgress, [animal]: essences },
    }));
  }, []);

  const clearRiddleProgress = useCallback((animal) => {
    setState(prev => ({
      ...prev,
      riddleProgress: { ...prev.riddleProgress, [animal]: [] },
    }));
  }, []);

  const recordScore = useCallback((realm, difficulty, score, time) => {
    setState(prev => {
      const key = `${realm}_${difficulty}`;
      const existing = prev.bestScores[key];

      if (!existing || score > existing.score) {
        return {
          ...prev,
          bestScores: {
            ...prev.bestScores,
            [key]: { score, time, date: new Date().toISOString() },
          },
        };
      }
      return prev;
    });
  }, []);

  const isLocked = useCallback((animal) => {
    const lockout = state.lockouts[animal];
    return lockout && lockout > Date.now();
  }, [state.lockouts]);

  const getLockoutRemaining = useCallback((animal) => {
    const lockout = state.lockouts[animal];
    if (!lockout) return 0;
    return Math.max(0, lockout - Date.now());
  }, [state.lockouts]);

  const value = {
    ...state,
    toggleFreeMode,
    setGameMode,
    setDifficulty,
    unlockRealm,
    addStrike,
    resetStrikes,
    updateRiddleProgress,
    clearRiddleProgress,
    recordScore,
    isLocked,
    getLockoutRemaining,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}

export default useGameState;
