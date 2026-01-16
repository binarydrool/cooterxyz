"use client";

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Time Grain types - 5 colored grains, each given to a specific animal to unlock their portal
export const GRAIN_TYPES = {
  GREEN: { id: 'green', name: 'Green Grain', color: '#00FF00', animal: 'frog', needed: 6 },
  GOLD: { id: 'gold', name: 'Gold Grain', color: '#FFD700', animal: 'rabbit', needed: 9 },
  ORANGE: { id: 'orange', name: 'Orange Grain', color: '#FFA500', animal: 'cat', needed: 3 },
  PURPLE: { id: 'purple', name: 'Purple Grain', color: '#9370DB', animal: 'owl', needed: 12 },
  CYAN: { id: 'cyan', name: 'Cyan Grain', color: '#00CED1', animal: 'miles', needed: 12 },
};

// Essence types - collected inside realms, 9 total needed for owl realm
export const ESSENCE_TYPES = {
  FOREST: { id: 'forest', name: 'Forest Essence', color: '#00FF00', emoji: '△', shape: 'tetrahedron', animal: 'frog' },
  GOLDEN: { id: 'golden', name: 'Golden Essence', color: '#FFD700', emoji: '◇', shape: 'cube', animal: 'rabbit' },
  AMBER: { id: 'amber', name: 'Amber Essence', color: '#FFA500', emoji: '◆', shape: 'octahedron', animal: 'cat' },
  VIOLET: { id: 'violet', name: 'Violet Essence', color: '#800080', emoji: '⬡', shape: 'icosahedron', animal: 'owl' },
};

// Shard types
export const SHARD_TYPES = {
  AMBER: { id: 'amber', name: 'Amber Shard', realm: 'rabbit' },
  CITRINE: { id: 'citrine', name: 'Citrine Shard', realm: 'cat' },
  EMERALD: { id: 'emerald', name: 'Emerald Shard', realm: 'frog' },
  AMETHYST: { id: 'amethyst', name: 'Amethyst Shard', realm: 'owl' },
  PERIDOT: { id: 'peridot', name: 'Peridot Shard', realm: 'inchworm' },
};

// Difficulty grades
export const GRADES = {
  1: { name: 'Common', color: '#FFFFFF' },
  2: { name: 'Uncommon', color: '#00FF00' },
  3: { name: 'Rare', color: '#FFFF00' },
  4: { name: 'Epic', color: '#FFA500' },
  5: { name: 'Legendary', color: '#FF0000' },
  6: { name: 'Mythic', color: '#800080' },
  7: { name: 'Obsidian', color: '#000000' },
};

const STORAGE_KEY = 'cooter_inventory';

const initialInventory = {
  // Time Grains - 5 colored types, collected from clock by stopping time
  // Each animal needs a specific color: green→frog(6), gold→rabbit(9), orange→cat(3), purple→owl(12), cyan→miles(12)
  grains: {
    green: 0,   // For frog - needs 6
    gold: 0,    // For rabbit - needs 9
    orange: 0,  // For cat - needs 3
    purple: 0,  // For owl - needs 12
    cyan: 0,    // For miles - needs 12
  },
  // Essences - collected INSIDE the realms (3 per realm)
  // Used to unlock owl realm: need 9 total (3 golden + 3 forest + 3 amber)
  essences: {
    forest: 0,   // From frog realm (The Lily Marsh)
    golden: 0,   // From rabbit realm (The Warren)
    amber: 0,    // From cat realm (The Rooftops)
    violet: 0,   // Reserved for future use
  },
  shards: {
    amber: null,   // { grade: 1-7, score: number, time: number, date: string }
    citrine: null,
    emerald: null,
    amethyst: null,
  },
  // Pyramid shards - 5 layers (rabbit=1, frog=2, cat=3, owl=4, inchworm=5) - pieces of AEIOU
  pyramidShards: {
    rabbit: false,    // Layer 1 (base) - from The Warren
    frog: false,      // Layer 2 - from The Lily Marsh
    cat: false,       // Layer 3 - from The Rooftops
    owl: false,       // Layer 4 - from The Night Sky
    inchworm: false,  // Layer 5 (capstone) - from The Long Road
  },
  // Black shards - earned by completing realms on IMPOSSIBLE difficulty
  blackShards: {
    rabbit: false,
    frog: false,
    cat: false,
    owl: false,
    inchworm: false,
  },
  // AEIOU restoration state
  dimitriusRestored: false,  // True after fusion spell is cast
  prismKeys: [],  // Array of { grade: 1-7, components: { amber, citrine, emerald, amethyst }, date: string }
  victoryCrowns: [], // Array of { grade: 1-7, lives: number, score: number, time: number, date: string, pure: boolean }
  timeGrains: 0,  // Legacy time grains collected (deprecated, use grains)
};

const InventoryContext = createContext(null);

function loadInventory() {
  if (typeof window === 'undefined') return initialInventory;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Deep merge to ensure all nested objects have all required fields
      return {
        ...initialInventory,
        ...parsed,
        // Ensure grains has all 4 color types (migrate from old single number if needed)
        grains: typeof parsed.grains === 'object'
          ? { ...initialInventory.grains, ...parsed.grains }
          : initialInventory.grains,
        // Ensure essences has all types
        essences: {
          ...initialInventory.essences,
          ...(parsed.essences || {}),
        },
        // Ensure pyramidShards has all realms
        pyramidShards: {
          ...initialInventory.pyramidShards,
          ...(parsed.pyramidShards || {}),
        },
        // Ensure blackShards has all realms
        blackShards: {
          ...initialInventory.blackShards,
          ...(parsed.blackShards || {}),
        },
      };
    }
  } catch (e) {
    console.error('Failed to load inventory:', e);
  }
  return initialInventory;
}

function saveInventory(inventory) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  } catch (e) {
    console.error('Failed to save inventory:', e);
  }
}

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState(initialInventory);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInventory(loadInventory());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveInventory(inventory);
    }
  }, [inventory, mounted]);

  // Add essence
  const addEssence = useCallback((type) => {
    setInventory(prev => ({
      ...prev,
      essences: {
        ...prev.essences,
        [type]: prev.essences[type] + 1,
      },
    }));
  }, []);

  // Remove essence
  const removeEssence = useCallback((type, count = 1) => {
    setInventory(prev => ({
      ...prev,
      essences: {
        ...prev.essences,
        [type]: Math.max(0, prev.essences[type] - count),
      },
    }));
    return true;
  }, []);

  // Check if has essence
  const hasEssence = useCallback((type, count = 1) => {
    return inventory.essences[type] >= count;
  }, [inventory.essences]);

  // Add time grain of a specific color (collected from clock by stopping time with Y)
  const addGrain = useCallback((color) => {
    if (!color || !['green', 'gold', 'orange', 'purple', 'cyan'].includes(color)) {
      console.warn('Invalid grain color:', color);
      return;
    }
    setInventory(prev => ({
      ...prev,
      grains: {
        ...prev.grains,
        [color]: (prev.grains[color] || 0) + 1,
      },
    }));
  }, []);

  // Remove grains of a specific color (spent to unlock portals)
  const removeGrains = useCallback((color, count) => {
    if (!color || !['green', 'gold', 'orange', 'purple', 'cyan'].includes(color)) {
      console.warn('Invalid grain color:', color);
      return;
    }
    setInventory(prev => ({
      ...prev,
      grains: {
        ...prev.grains,
        [color]: Math.max(0, (prev.grains[color] || 0) - count),
      },
    }));
  }, []);

  // Check if has enough grains of a specific color
  const hasGrains = useCallback((color, count = 1) => {
    return (inventory.grains[color] || 0) >= count;
  }, [inventory.grains]);

  // Get total grains across all colors
  const getTotalGrains = useCallback(() => {
    return Object.values(inventory.grains).reduce((sum, count) => sum + count, 0);
  }, [inventory.grains]);

  // Add random essence (called when collecting essences INSIDE realms only)
  const addRandomEssence = useCallback(() => {
    const types = Object.keys(ESSENCE_TYPES).map(k => ESSENCE_TYPES[k].id);
    const randomType = types[Math.floor(Math.random() * types.length)];
    addEssence(randomType);
    return randomType;
  }, [addEssence]);

  // Award shard for completing a realm
  const awardShard = useCallback((shardType, grade, score, time) => {
    setInventory(prev => {
      const existing = prev.shards[shardType];
      // Only replace if new grade is higher, or same grade with better score
      if (!existing || grade > existing.grade || (grade === existing.grade && score > existing.score)) {
        return {
          ...prev,
          shards: {
            ...prev.shards,
            [shardType]: {
              grade,
              score,
              time,
              date: new Date().toISOString(),
            },
          },
        };
      }
      return prev;
    });
  }, []);

  // Check if can fuse prism key
  const canFusePrismKey = useCallback(() => {
    return Object.values(inventory.shards).every(shard => shard !== null);
  }, [inventory.shards]);

  // Fuse shards into prism key
  const fusePrismKey = useCallback(() => {
    if (!canFusePrismKey()) return null;

    const shards = inventory.shards;
    const lowestGrade = Math.min(
      shards.amber.grade,
      shards.citrine.grade,
      shards.emerald.grade,
      shards.amethyst.grade
    );

    const newKey = {
      grade: lowestGrade,
      components: {
        amber: shards.amber.grade,
        citrine: shards.citrine.grade,
        emerald: shards.emerald.grade,
        amethyst: shards.amethyst.grade,
      },
      date: new Date().toISOString(),
    };

    setInventory(prev => ({
      ...prev,
      prismKeys: [...prev.prismKeys, newKey],
      // Keep shards after fusion (can earn more)
    }));

    return newKey;
  }, [canFusePrismKey, inventory.shards]);

  // Award victory crown
  const awardVictoryCrown = useCallback((prismKeyGrade, lives, score, time, pure = false) => {
    const crown = {
      grade: prismKeyGrade,
      lives,
      score,
      time,
      date: new Date().toISOString(),
      pure,
    };

    setInventory(prev => ({
      ...prev,
      victoryCrowns: [...prev.victoryCrowns, crown],
    }));

    return crown;
  }, []);

  // Collect pyramid shard (after completing a realm)
  const addPyramidShard = useCallback((realm) => {
    setInventory(prev => ({
      ...prev,
      pyramidShards: {
        ...prev.pyramidShards,
        [realm]: true,
      },
    }));
  }, []);

  // Check if pyramid is complete
  const isPyramidComplete = useCallback(() => {
    return Object.values(inventory.pyramidShards).every(v => v === true);
  }, [inventory.pyramidShards]);

  // Add black shard (for impossible difficulty completion)
  const addBlackShard = useCallback((realm) => {
    setInventory(prev => ({
      ...prev,
      blackShards: {
        ...prev.blackShards,
        [realm]: true,
      },
    }));
  }, []);

  // Check if all black shards collected
  const hasAllBlackShards = useCallback(() => {
    return Object.values(inventory.blackShards).every(v => v === true);
  }, [inventory.blackShards]);

  // Cast fusion spell to restore Dimitrius
  const castFusionSpell = useCallback(() => {
    if (!isPyramidComplete()) return false;
    setInventory(prev => ({
      ...prev,
      dimitriusRestored: true,
    }));
    return true;
  }, [isPyramidComplete]);

  // Check if Dimitrius is restored
  const isDimitriusRestored = useCallback(() => {
    return inventory.dimitriusRestored === true;
  }, [inventory.dimitriusRestored]);

  // Add time grain (legacy support)
  const addTimeGrain = useCallback(() => {
    setInventory(prev => ({
      ...prev,
      timeGrains: prev.timeGrains + 1,
    }));
  }, []);

  // Get total essence count
  const getTotalEssences = useCallback(() => {
    return Object.values(inventory.essences).reduce((sum, count) => sum + count, 0);
  }, [inventory.essences]);

  // Get shard count
  const getShardCount = useCallback(() => {
    return Object.values(inventory.shards).filter(s => s !== null).length;
  }, [inventory.shards]);

  // Reset all inventory to initial state
  const resetInventory = useCallback(() => {
    setInventory(initialInventory);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = {
    ...inventory,
    addGrain,
    removeGrains,
    hasGrains,
    getTotalGrains,
    addEssence,
    removeEssence,
    hasEssence,
    addRandomEssence,
    awardShard,
    canFusePrismKey,
    fusePrismKey,
    awardVictoryCrown,
    addPyramidShard,
    isPyramidComplete,
    addBlackShard,
    hasAllBlackShards,
    castFusionSpell,
    isDimitriusRestored,
    addTimeGrain,
    getTotalEssences,
    getShardCount,
    resetInventory,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
}

export default useInventory;
