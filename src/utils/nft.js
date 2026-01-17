"use client";

// NFT Types and metadata
export const NFT_TYPES = {
  SHARD: 'shard',
  PRISM_KEY: 'prism_key',
  VICTORY_CROWN: 'victory_crown',
};

// Shard grades based on difficulty
export const SHARD_GRADES = {
  beginner: { grade: 'F', color: '#666666', multiplier: 0.5 },
  easy: { grade: 'D', color: '#888888', multiplier: 0.75 },
  normal: { grade: 'C', color: '#4ade80', multiplier: 1.0 },
  hard: { grade: 'B', color: '#3b82f6', multiplier: 1.25 },
  expert: { grade: 'A', color: '#a855f7', multiplier: 1.5 },
  master: { grade: 'S', color: '#f59e0b', multiplier: 2.0 },
  impossible: { grade: 'S+', color: '#ef4444', multiplier: 3.0 },
};

// Realm info for NFT metadata
export const REALM_INFO = {
  rabbit: {
    name: 'The Warren',
    element: 'Golden',
    color: '#ffd700',
    description: 'A labyrinthine maze of clockwork tunnels',
  },
  cat: {
    name: 'The Rooftops',
    element: 'Amber',
    color: '#ffa500',
    description: 'Towering spires reaching toward the moon',
  },
  frog: {
    name: 'The Lily Marsh',
    element: 'Forest',
    color: '#22c55e',
    description: 'Mercury rivers flowing through eternal swamps',
  },
  owl: {
    name: 'The Night Sky',
    element: 'Violet',
    color: '#8b5cf6',
    description: 'Cloud platforms in the starlit expanse',
  },
  elf: {
    name: 'The Eternal Clocktower',
    element: 'Prismatic',
    color: '#ffffff',
    description: 'The heart of time itself',
  },
};

// Generate metadata for a Shard NFT
export function generateShardMetadata({
  realm,
  difficulty,
  time,
  coins,
  collectibles,
  timestamp,
}) {
  const gradeInfo = SHARD_GRADES[difficulty] || SHARD_GRADES.normal;
  const realmInfo = REALM_INFO[realm] || REALM_INFO.rabbit;

  return {
    name: `${realmInfo.name} Shard (${gradeInfo.grade})`,
    description: `A ${gradeInfo.grade}-grade shard from ${realmInfo.name}. ${realmInfo.description}`,
    image: generateShardImage(realm, gradeInfo.grade),
    external_url: 'https://cooter.game',
    attributes: [
      { trait_type: 'Type', value: 'Shard' },
      { trait_type: 'Realm', value: realmInfo.name },
      { trait_type: 'Element', value: realmInfo.element },
      { trait_type: 'Grade', value: gradeInfo.grade },
      { trait_type: 'Difficulty', value: difficulty },
      { trait_type: 'Time', value: formatTime(time), display_type: 'string' },
      { trait_type: 'Coins Collected', value: coins, display_type: 'number' },
      { trait_type: 'Collectibles', value: collectibles, display_type: 'number' },
      { trait_type: 'Completion Date', value: timestamp, display_type: 'date' },
    ],
    properties: {
      realm,
      difficulty,
      grade: gradeInfo.grade,
      gradeMultiplier: gradeInfo.multiplier,
    },
  };
}

// Generate metadata for a Prism Key NFT
export function generatePrismKeyMetadata({
  shards,
  averageGrade,
  timestamp,
}) {
  const gradeColors = {
    'S+': '#ef4444',
    'S': '#f59e0b',
    'A': '#a855f7',
    'B': '#3b82f6',
    'C': '#4ade80',
    'D': '#888888',
    'F': '#666666',
  };

  return {
    name: `Prism Key (${averageGrade})`,
    description: `A ${averageGrade}-grade Prism Key forged from four realm shards. Grants access to the Eternal Clocktower.`,
    image: generatePrismKeyImage(averageGrade),
    external_url: 'https://cooter.game',
    attributes: [
      { trait_type: 'Type', value: 'Prism Key' },
      { trait_type: 'Grade', value: averageGrade },
      { trait_type: 'Rabbit Shard', value: shards.rabbit?.grade || 'None' },
      { trait_type: 'Cat Shard', value: shards.cat?.grade || 'None' },
      { trait_type: 'Frog Shard', value: shards.frog?.grade || 'None' },
      { trait_type: 'Owl Shard', value: shards.owl?.grade || 'None' },
      { trait_type: 'Fusion Date', value: timestamp, display_type: 'date' },
    ],
    properties: {
      shards,
      averageGrade,
      color: gradeColors[averageGrade] || '#4ade80',
    },
  };
}

// Generate metadata for a Victory Crown NFT
export function generateVictoryCrownMetadata({
  prismKeyGrade,
  difficulty,
  time,
  livesRemaining,
  timestamp,
}) {
  const gradeInfo = SHARD_GRADES[difficulty] || SHARD_GRADES.normal;

  return {
    name: `Victory Crown (${prismKeyGrade}/${gradeInfo.grade})`,
    description: `The ultimate prize - a Victory Crown earned by defeating the Temporal Wraith in the Eternal Clocktower. Prism Key Grade: ${prismKeyGrade}, Challenge Grade: ${gradeInfo.grade}.`,
    image: generateVictoryCrownImage(prismKeyGrade, gradeInfo.grade),
    external_url: 'https://cooter.game',
    attributes: [
      { trait_type: 'Type', value: 'Victory Crown' },
      { trait_type: 'Prism Key Grade', value: prismKeyGrade },
      { trait_type: 'Challenge Grade', value: gradeInfo.grade },
      { trait_type: 'Difficulty', value: difficulty },
      { trait_type: 'Completion Time', value: formatTime(time), display_type: 'string' },
      { trait_type: 'Lives Remaining', value: livesRemaining, display_type: 'number' },
      { trait_type: 'Victory Date', value: timestamp, display_type: 'date' },
    ],
    properties: {
      prismKeyGrade,
      challengeGrade: gradeInfo.grade,
      difficulty,
    },
  };
}

// Calculate average grade from shards
export function calculateAverageGrade(shards) {
  const gradeValues = {
    'S+': 7,
    'S': 6,
    'A': 5,
    'B': 4,
    'C': 3,
    'D': 2,
    'F': 1,
  };

  const gradeNames = ['F', 'F', 'D', 'C', 'B', 'A', 'S', 'S+'];

  const grades = Object.values(shards).map(s => gradeValues[s?.grade] || 0);
  if (grades.length === 0) return 'F';

  const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
  return gradeNames[Math.round(avg)] || 'C';
}

// Check if player can fuse shards into Prism Key
export function canFusePrismKey(shards) {
  return (
    shards.rabbit &&
    shards.cat &&
    shards.frog &&
    shards.owl
  );
}

// Format time for display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate placeholder image URLs (would be replaced with actual asset generation)
function generateShardImage(realm, grade) {
  // In production, this would generate or fetch actual NFT artwork
  return `https://cooter.game/nft/shard/${realm}/${grade.toLowerCase()}.png`;
}

function generatePrismKeyImage(grade) {
  return `https://cooter.game/nft/prism-key/${grade.toLowerCase()}.png`;
}

function generateVictoryCrownImage(prismGrade, challengeGrade) {
  return `https://cooter.game/nft/crown/${prismGrade.toLowerCase()}-${challengeGrade.toLowerCase()}.png`;
}

// Contract addresses (would be set per environment)
export const CONTRACT_ADDRESSES = {
  // Mainnet
  1: {
    shard: '0x0000000000000000000000000000000000000000',
    prismKey: '0x0000000000000000000000000000000000000000',
    victoryCrown: '0x0000000000000000000000000000000000000000',
  },
  // Base
  8453: {
    shard: '0x0000000000000000000000000000000000000000',
    prismKey: '0x0000000000000000000000000000000000000000',
    victoryCrown: '0x0000000000000000000000000000000000000000',
  },
  // Sepolia (testnet)
  11155111: {
    shard: '0x0000000000000000000000000000000000000000',
    prismKey: '0x0000000000000000000000000000000000000000',
    victoryCrown: '0x0000000000000000000000000000000000000000',
  },
};

// ABI for NFT contract (ERC721 with custom minting)
export const NFT_ABI = [
  // Standard ERC721
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',

  // Custom minting functions
  'function mintShard(address to, string memory uri) returns (uint256)',
  'function mintPrismKey(address to, string memory uri, uint256[] memory shardIds) returns (uint256)',
  'function mintVictoryCrown(address to, string memory uri, uint256 prismKeyId) returns (uint256)',

  // View functions
  'function totalSupply() view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ShardMinted(address indexed owner, uint256 tokenId, string realm, string grade)',
  'event PrismKeyMinted(address indexed owner, uint256 tokenId, string grade)',
  'event VictoryCrownMinted(address indexed owner, uint256 tokenId)',
];

// Mint a Shard NFT
export async function mintShard(provider, chainId, address, metadata) {
  if (!provider || !address) {
    throw new Error('Wallet not connected');
  }

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.shard;
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    // Demo mode - simulate minting
    console.log('Demo mint - Shard:', metadata);
    return {
      success: true,
      tokenId: Math.floor(Math.random() * 1000000),
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      metadata,
      demo: true,
    };
  }

  // In production, this would call the actual contract
  // const contract = new ethers.Contract(contractAddress, NFT_ABI, provider.getSigner());
  // const tx = await contract.mintShard(address, JSON.stringify(metadata));
  // const receipt = await tx.wait();
  // return { success: true, tokenId: receipt.events[0].args.tokenId, txHash: tx.hash };

  throw new Error('Contract not deployed on this network');
}

// Mint a Prism Key NFT (fusing 5 shards)
export async function mintPrismKey(provider, chainId, address, metadata, shardTokenIds) {
  if (!provider || !address) {
    throw new Error('Wallet not connected');
  }

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.prismKey;
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    // Demo mode
    console.log('Demo mint - Prism Key:', metadata);
    return {
      success: true,
      tokenId: Math.floor(Math.random() * 1000000),
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      metadata,
      demo: true,
    };
  }

  throw new Error('Contract not deployed on this network');
}

// Mint a Victory Crown NFT
export async function mintVictoryCrown(provider, chainId, address, metadata, prismKeyTokenId) {
  if (!provider || !address) {
    throw new Error('Wallet not connected');
  }

  const contractAddress = CONTRACT_ADDRESSES[chainId]?.victoryCrown;
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    // Demo mode
    console.log('Demo mint - Victory Crown:', metadata);
    return {
      success: true,
      tokenId: Math.floor(Math.random() * 1000000),
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      metadata,
      demo: true,
    };
  }

  throw new Error('Contract not deployed on this network');
}

// Get user's NFTs
export async function getUserNFTs(provider, chainId, address) {
  if (!provider || !address) {
    return { shards: [], prismKeys: [], crowns: [] };
  }

  // In demo mode, return from localStorage
  const stored = localStorage.getItem(`cooter_nfts_${address}`);
  if (stored) {
    return JSON.parse(stored);
  }

  return { shards: [], prismKeys: [], crowns: [] };
}

// Save NFT to local storage (for demo mode)
export function saveNFTLocally(address, nftType, nft) {
  const stored = localStorage.getItem(`cooter_nfts_${address}`);
  const nfts = stored ? JSON.parse(stored) : { shards: [], prismKeys: [], crowns: [] };

  switch (nftType) {
    case NFT_TYPES.SHARD:
      nfts.shards.push(nft);
      break;
    case NFT_TYPES.PRISM_KEY:
      nfts.prismKeys.push(nft);
      break;
    case NFT_TYPES.VICTORY_CROWN:
      nfts.crowns.push(nft);
      break;
  }

  localStorage.setItem(`cooter_nfts_${address}`, JSON.stringify(nfts));
  return nfts;
}
