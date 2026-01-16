# COOTER - Game Scope & Design Document

## Overview

**Cooter** is a 3D web-based adventure game set in a magical world centered around a golden clock hub called "The Eternal Clocktower." Players control Cooter the Turtle as they navigate through five distinct realm games (plus final boss), collect magical essences, and ultimately restore the legendary Dimitrius.

**Tech Stack:** React/Next.js + Three.js (React Three Fiber)

---

## The Hub: Eternal Clocktower

The main hub is a massive interactive 3D golden analog clock. The clock drives the core "Deja Vu" mechanic:

- **Every 59 seconds:** Amadeus (Y/Nox) the Wizard jumps forward toward the center and blocks the second hand
- **3-second time freeze:** Gears stop, second hand glows cyan
- **Essence spawns:** Three collectible sand grains appear on the clock face with random colors (Forest, Golden, Amber, Violet, or Cyan)
- **Resume:** Second hand catches up rapidly to real time

### Hub Layout

```
                    12 (Dimitrius + Amadeus)
                         |
                         |
     9 (Rabbit) -------- + -------- 3 (Cat)
                         |
                         |
                    6 (Frog)

     Hoots rides on the second hand tail
     Miles walks clockwise around the outer edge (24-hour cycle)
```

---

## Characters

### Main Characters

| Character | Type | Location | Role |
|-----------|------|----------|------|
| **Cooter** | Turtle | Player-controlled | Protagonist - the player |
| **Dimitrius** | Gnome Jester | 12 o'clock rim | Guardian, realm gatekeeper, final boss |
| **Amadeus (Y/Nox)** | Wizard | 12 o'clock | Time blocker, triggers Deja Vu, jumps forward to stop time |
| **Hoots** | Barn Owl | Second hand tail | Hint giver, rides the clock |
| **Miles** | Inchworm | Clock outer edge | Slow traveler, walks full lap every 24 hours |

### Portal Guardians (Jump over second hand when it approaches - with extended hang time)

| Character | Location | Realm | Grain Color |
|-----------|----------|-------|-------------|
| **Rabbit** | 9 o'clock (45 sec) | The Warren | Gold (9 needed) |
| **Cat** | 3 o'clock (15 sec) | The Rooftops | Orange (3 needed) |
| **Frog** | 6 o'clock (30 sec) | The Lily Marsh | Green (6 needed) |
| **Owl** | Center/Above | The Night Sky | 12 total (3 each: green, gold, orange, cyan) |
| **Miles** | Outer edge (moving) | The Metamorphosis | Cyan (12 needed) |

### Character Appearances

**Cooter the Turtle**
- Natural brown/green turtle with shell
- Controllable via WASD/arrows
- Can interact with NPCs (E key)

**Dimitrius the Gnome**
- Dark jester with harlequin diamond pattern costume
- Deep purple-black robe with gold accents
- Glowing green eyes
- Tall pointed hat with bells
- Curly-toed jester shoes

**Amadeus (Y/Nox) the Wizard**
- Tall wizard with black gown
- White hair and long beard
- Large brimmed hat
- Floating magical orbs
- Jumps forward toward center and blocks the second hand at 59 sec
- Extended hang time during jump animation

**Rabbit**
- Cream/beige fur with pink inner ears
- Brown eyes, energetic personality
- Jumps gracefully over the second hand with extended hang time

**Cat**
- Orange tabby with cream belly
- Green eyes, pink nose
- Constantly swishing tail
- Graceful, arched jump animation with extended hang time

**Frog**
- Bright green with bulging eyes
- Relaxed, contemplative personality
- Hops over second hand with extended hang time

**Hoots**
- Barn owl (tiny, 0.25 scale)
- Heart-shaped white face, brown back
- Rotates with second hand, always faces outward

**Miles the Inchworm**
- 8 body segments in green gradient (bright lawn green head to lime tail)
- Little black eyes with white highlights
- Two antennae with glowing tips
- Wave-like inching animation as he crawls
- Walks clockwise around clock edge, completing one lap every 24 hours
- Freezes during Deja Vu like everything else

---

## The Six Realms

### 1. The Warren (Rabbit Realm)

**Theme:** Underground Pac-Man style maze

**Gameplay:**
- Navigate 45x45 cell maze as a white rabbit
- Avoid foxes (turn blue when powered up)
- Collect carrots, coins, and power pellets
- Find the Elf and Dimensional Key at the end

**Collectibles:**
- Carrots (regular, golden, ghost for invisibility, life)
- Power Pellets (8-15 sec invulnerability)
- Coins

**Enemies:** Foxes (chase player, flee when scared)

**Win Condition:** Find the Elf

**Reward:** Golden Essence + Pyramid Shard (Base Layer)

---

### 2. The Lily Marsh (Frog Realm)

**Theme:** Frogger-style river crossing platformer

**Gameplay:**
- Hop across moving logs, lilypads, turtle shells
- Avoid snakes, herons, piranhas
- Reach the golden finish platform

**Platforms:**
- Logs (move horizontally with wave motion)
- Lilypads (static)
- Turtle shells (sink periodically - must time jumps)
- Land islands (safe ground)

**Collectibles:** Coins, Flies (bonus points)

**Enemies:** Snakes (land), Herons (air), Piranhas (water)

**Win Condition:** Reach the goal platform

**Reward:** Forest Essence + Pyramid Shard (Layer 2)

---

### 3. Rooftop Runner (Cat Realm)

**Theme:** Side-scrolling platformer across city rooftops at sunset

**Gameplay:**
- Jump between buildings of varying heights
- Collect fish, yarn balls, golden mice
- Avoid patrol dogs
- Wall-jump off building sides for advanced movement

**Visual Style:**
- Warm sunset cityscape (orange/pink sky)
- Buildings with water tanks, antennas, AC units, neon signs
- Lit windows on buildings

**Collectibles:**
- Fish (main - 100 pts)
- Yarn balls (bonus - 75 pts)
- Golden mice (rare - 500 pts)
- Catnip (5-second speed boost - 50 pts)

**Obstacles:**
- Patrol dogs (walk back and forth)
- Pigeons (scatter when approached)
- Building gaps (must jump)

**Mechanics:**
- A/D: Move left/right
- W/Space: Jump
- Wall-jump: Press jump while against building side

**Win Condition:** Reach Dimitrius at the end of the course

**Reward:** Amber Essence + Pyramid Shard (Layer 3)

---

### 4. The Night Sky (Owl Realm)

**Theme:** Aerial forest survival - fly as an owl avoiding wolves

**Gameplay:**
- Fly through dense forest
- Avoid wolf packs chasing you
- Navigate around trees and rocks

**Mechanics:**
- WASD: Horizontal flight
- Space: Fly up
- S/Ctrl: Fly down
- Fly above tree line for safety

**Environment:** Eerie forest with fireflies, dense trees

**Enemies:** Wolves (4-8 depending on difficulty)

**Win Condition:** Survive/escape the forest

**Reward:** Violet Essence + Pyramid Shard (Layer 5 - Capstone)

---

### 5. The Metamorphosis (Inchworm Realm)

**Theme:** Magical butterfly flight through an enchanted garden

**Story:** Miles dreams of having wings. In his realm, players transform into a beautiful cyan butterfly emerging from a chrysalis.

**Gameplay:**
- Opening cutscene: Miles wrapped in glowing chrysalis
- Hatching animation: Chrysalis cracks, butterfly emerges with iridescent wings
- Fly through magical oversized garden (player is butterfly-sized)
- Collect nectar droplets and find 3 hidden cyan essences
- Navigate through 3 zones: Meadow, Flower Forest, Heart Garden

**Controls:**
- WASD: Directional flight
- Space: Fly higher
- Shift: Fly lower
- Mouse/Arrows: Camera direction

**Collectibles:**
- Nectar Droplets (100 pts each)
- Pollen Clouds (land on flowers, 250 pts)
- Rainbow Dewdrops (rare, on leaf edges, 500 pts)
- Cyan Essences (3 required, hidden throughout garden)

**Hazards:**
- Spider Webs: Slow player, wiggle to escape
- Dragonflies: Patrol areas, push player back on contact
- Healing Flowers: Rare pink glowing flowers restore health

**Visual Environment:**
- Giant flowers (oversized - player is small butterfly scale)
- Soft morning light, god rays through leaves
- Dewdrops on leaf edges that shimmer
- Floating pollen particles
- Mushrooms, ferns, tall grass blades

**Difficulty Scaling:**
| Level | Nectar Goal | Hazard Density |
|-------|-------------|----------------|
| Beginner | 500 | Light |
| Easy | 1000 | Light |
| Normal | 2000 | Medium |
| Hard | 3500 | Medium |
| Expert | 5000 | Heavy |
| Master | 7500 | Heavy |
| Impossible | 10000 | Extreme |

**Win Condition:** Collect 3 cyan essences + reach score goal + reach Heart Garden

**Reward:** Cyan Essence + Pyramid Shard (Layer 4)

---

### 6. The Eternal Clocktower (Elf Realm)

**Theme:** Boss fight - spiral tower climb to battle Dimitrius

**Gameplay:**
- Climb 12 spiral platforms
- Avoid rotating gears
- Collect healing crystals
- Face Dimitrius in final arena

**Combat:**
- Cast projectiles at boss
- Dodge boss attacks
- Boss HP: 80-250 depending on difficulty

**Win Condition:** Defeat Dimitrius

**Reward:** Victory Crown NFT, game completion

**Unlock Requirement:** All 5 pyramid shards collected

---

## Progression System

### Essences (4 Types) & Grains (5 Colors)

**Essences** (collected inside realms):
| Essence | Color | Shape | Source |
|---------|-------|-------|--------|
| Forest | Green | Tetrahedron | Frog Realm |
| Golden | Gold | Cube | Rabbit Realm |
| Amber | Orange | Octahedron | Cat Realm |
| Violet | Purple | Icosahedron | Owl Realm |

**Grains** (spawn on clock during Deja Vu, offered to animals to unlock portals):
| Grain | Color | Animal | Needed |
|-------|-------|--------|--------|
| Green | #00FF00 | Frog | 6 |
| Gold | #FFD700 | Rabbit | 9 |
| Orange | #FFA500 | Cat | 3 |
| Cyan | #00CED1 | Miles | 12 |

**Special: Owl (Hoots)** requires 12 grains total: 3 green + 3 gold + 3 orange + 3 cyan (from all 4 realms).

Grains spawn randomly during Deja Vu events (3 per event, max 12 on clock) in 5 colors: Forest Green, Golden, Amber, Violet, and Cyan.

### Grain Offering System

Each portal guardian (Cat, Frog, Rabbit) requires a specific type of essence grain to unlock their portal. However, they don't reveal which color they need - players must discover this through trial and error:

- **Mystery Mechanic:** Animals keep their required grain color secret
- **Offering Grains:** Players can offer any collected grain to an animal
- **Correct Grain:** Accepted! Counts toward portal unlocking
- **Wrong Grain:** Burned/rejected! The grain crumbles to dust and is lost
- **Risk/Reward:** Players must strategically decide which grains to offer

This adds a layer of mystery and resource management to the hub gameplay.

### Second Hand Collision (Grain Penalty)

If Cooter blocks the second hand while time is flowing (NOT during Deja Vu), grains will be lost:

- **Grace Period:** First 1 second of blocking is free - no penalty
- **Penalty Phase:** After 1 second, 1 random grain is removed from inventory per second
- **Strategic Tension:** Amadeus stopping time at :59 is GOOD (spawns grains), but Cooter blocking the second hand is BAD (destroys grains)
- **Safe Zones:** Near the center (inside 0.3 radius) and outside the second hand's reach (beyond 0.67 radius) are safe
- **Resets:** Timer resets when Cooter moves away from the second hand

This mechanic encourages players to collect grains quickly while staying aware of the second hand's position.

### Pyramid Shards

Complete each realm to earn a pyramid shard (5 total):

1. **Base Layer (Gold)** - Rabbit Realm - "From the Warren"
2. **Layer 2 (Green)** - Frog Realm - "From the Marsh"
3. **Layer 3 (Orange)** - Cat Realm - "From the Rooftops"
4. **Layer 4 (Cyan)** - Inchworm Realm - "From the Chrysalis"
5. **Capstone (Purple)** - Owl Realm - "From Above"

Collecting all 5 unlocks the Elf Realm (final boss).

### Difficulty Levels

7 difficulty tiers per realm:

| Level | Grade | Color |
|-------|-------|-------|
| Beginner | Common | White |
| Easy | Uncommon | Green |
| Normal | Rare | Yellow |
| Hard | Epic | Orange |
| Expert | Legendary | Red |
| Master | Mythic | Purple |
| Impossible | Obsidian | Black |

Completing on Impossible earns a **Black Shard** (special achievement).

---

## Controls

### Hub (Clock)
- **WASD/Arrows:** Move Cooter
- **E:** Interact with NPCs/portals
- **ESC:** Pause menu

### Realm Games
- **WASD/Arrows:** Movement
- **Space/W:** Jump
- **E:** Special interactions
- **ESC:** Pause

### Mobile
- Touch joystick for movement
- Buttons for jump/interact

---

## Visual Style

### Overall Aesthetic
- Steampunk-magical fusion
- Stylized 3D (cartoon-realistic)
- Rich color palette: gold, purple, green, orange

### Clock Design
- Brushed gold with glass face
- 5+ rotating decorative gears
- Fireflies floating in the scene
- Dynamic shadows

### Realm Themes
1. **Warren:** Underground browns, earthy, hay bales
2. **Lily Marsh:** Water blues, green lilies, serene
3. **Rooftops:** Sunset oranges/pinks, urban cityscape
4. **Night Sky:** Dark forest, eerie fireflies
5. **Metamorphosis:** Magical garden, giant flowers, morning light
6. **Clocktower:** Spiral architecture, rotating gears

---

## Game Flow

```
1. Start in Hub (Clock)
        |
2. Explore, talk to NPCs, collect Deja Vu grains
        |
3. Offer grains to animals to unlock portals
        |
4. Enter realm portals -> Select difficulty
        |
5. Complete realm objective
        |
6. Earn pyramid shard + essence -> Return to hub
        |
7. Repeat for all 5 realms (Rabbit, Frog, Cat, Owl, Inchworm)
        |
8. Unlock Elf Realm (all 5 shards collected)
        |
9. Defeat Dimitrius -> Game complete!
```

---

## NFT Integration

- **Free Mode:** Essences auto-collected
- **Paid Mode:** Mint modal for each essence
- **Collectible NFTs:**
  - Time Essences
  - Pyramid Shards
  - Prism Keys (fused shards)
  - Victory Crowns (boss completion)

---

## Complete File Structure & Documentation

### Core Application Files

```
/src/app/
├── layout.js          # Next.js root layout, HTML structure, metadata
└── page.js            # Main page component, renders Game
```

### Components - Main Hub

```
/src/components/
├── Game.jsx           # MAIN CONTROLLER - Orchestrates entire game
│                      # - Manages activeRealm state (hub vs realm gameplay)
│                      # - Handles inventory, audio, game state
│                      # - Renders UI navbar, realm components, modals
│                      # - Contains victory ceremony, mint modal logic
│                      # - Handles Cooter blocking second hand grain removal
│
├── Scene.jsx          # 3D SCENE SETUP
│                      # - Wraps Three.js canvas environment
│                      # - Manages TurtleWithCamera context
│                      # - Renders Ocean, Sky, Sun, Moon, Clock
│                      # - Passes callbacks between Game and Clock
│
├── Clock.jsx          # HUB CLOCK - Core gameplay component (~1900 lines)
│                      # - 3D golden clock with hour/minute/second hands
│                      # - Deja Vu mechanic (Nox stops time at :59)
│                      # - Sand grain spawning (3 random colors, max 12, 3min lifetime)
│                      # - Animal proximity detection (triggers chat)
│                      # - Portal proximity detection
│                      # - Second hand collision detection with Cooter
│                      # - Renders all hub NPCs (Rabbit, Cat, Frog, Owl, Gnome, Miles)
│                      # - Miles walks clockwise around edge (24-hour cycle)
│
├── Turtle.jsx         # PLAYER CHARACTER
│                      # - 3D turtle model with shell, legs, head
│                      # - Walking animation (diagonal gait)
│                      # - Idle breathing animation
│                      # - Exposed via forwardRef for position updates
│
├── CameraController.jsx # CAMERA SYSTEM
│                      # - Third-person follow camera
│                      # - Camera modes (THIRD_PERSON, BIRD_EYE)
│                      # - Smooth position interpolation
│
├── ClockHand.jsx      # Individual clock hand component (hour/min/sec)
│
├── Ocean.jsx          # Infinite ocean beneath the clock
│                      # - Wave animation shader
│                      # - Time-based color shifts (day/night)
│
├── DynamicSky.jsx     # Sky dome with gradient based on time of day
│
├── Sun.jsx            # Animated sun that moves based on real time
├── Moon.jsx           # Animated moon visible at night
├── Seagulls.jsx       # Decorative flying seagulls (disabled for perf)
│
├── HelpModal.jsx      # How to Play modal with controls/gameplay info
├── UI.jsx             # In-game UI overlay (interact prompts, etc)
```

### Character Components

```
/src/components/
├── Rabbit.jsx         # Portal guardian at 9 o'clock (45 sec)
│                      # - Jumps over second hand with hang time
│                      # - Cream/beige fur, pink ears
│
├── Cat.jsx            # Portal guardian at 3 o'clock (15 sec)
│                      # - Orange tabby with swishing tail
│                      # - Graceful arched jump
│
├── Frog.jsx           # Portal guardian at 6 o'clock (30 sec)
│                      # - Green tree frog with gold eyes
│                      # - Hops with extended hang time
│
├── Owl.jsx            # Amadeus/Nox - Time wizard at 12 o'clock
│                      # - Triggers Deja Vu at 59 seconds
│                      # - Jumps FORWARD toward center to block time
│
├── Gnome.jsx          # Dimitrius - Guardian at 12 o'clock rim
│                      # - Dark jester with harlequin pattern
│                      # - Final boss (in Elf Realm)
│
└── characters/
    └── AEIOU.jsx      # Alternate Dimitrius character model
```

### Realm Components

```
/src/components/realms/
├── RabbitRealm.jsx    # THE WARREN - Pac-Man style maze
│                      # - 45x45 cell maze navigation
│                      # - Fox enemies (turn blue when powered up)
│                      # - Carrots, power pellets, coins
│                      # - Find the Elf to complete
│
├── CatRealm3D.jsx     # THE ROOFTOPS - Side-scrolling platformer
│                      # - Jump between buildings at sunset
│                      # - Collect fish, yarn, golden mice
│                      # - Wall-jump mechanics
│                      # - Patrol dogs as obstacles
│
├── FrogRealm3D.jsx    # THE LILY MARSH - Frogger-style platformer
│                      # - Hop across logs, lilypads, turtle shells
│                      # - Avoid snakes, herons, piranhas
│                      # - Reach golden finish platform
│
├── OwlRealm3D.jsx     # THE NIGHT SKY - Aerial flight survival
│                      # - Fly through dense forest as owl
│                      # - Avoid wolf packs
│                      # - Navigate trees and rocks
│
├── InchwormRealm.jsx  # THE METAMORPHOSIS - Butterfly flight game
│                      # - Transform into butterfly from chrysalis
│                      # - Fly through magical oversized garden
│                      # - Collect nectar, avoid dragonflies/webs
│                      # - Find 3 cyan essences + reach Heart Garden
│
├── ElfRealm3D.jsx     # THE ETERNAL CLOCKTOWER - Final boss
│                      # - Spiral tower climb (12 platforms)
│                      # - Rotating gear obstacles
│                      # - Boss fight with Dimitrius
│                      # - Requires all 5 pyramid shards
│
├── CatRealm.jsx       # Legacy 2D cat realm (unused)
├── OwlRealm.jsx       # Legacy owl realm (unused)
├── ElfRealm.jsx       # Legacy elf realm (unused)
│
└── frog/              # Frog realm sub-components
    ├── CoolFrog.jsx   # Player frog model
    ├── Essence.jsx    # Collectible essence particles
    └── Flower.jsx     # Decorative flower props
```

### UI Components

```
/src/components/ui/
├── ChatModal.jsx      # NPC DIALOGUE SYSTEM
│                      # - Animal conversation interface
│                      # - Grain offering system (mystery mechanic)
│                      # - Wrong grain = burned, correct = accepted
│                      # - Riddles from NPCs
│
├── DifficultySelect.jsx # Realm difficulty picker (7 levels)
├── GameHUD.jsx        # In-realm HUD (lives, score, timer)
├── GameStatusBar.jsx  # Status bar during gameplay
├── GlobalMobileControls.jsx # Touch joystick + buttons (mobile)
├── MobileGameControls.jsx # Mobile controls (alternate)
├── MobileRealmSidebar.jsx # Mobile realm navigation (removed)
│
├── Logo.jsx           # Game logo with free mode toggle
├── WalletButton.jsx   # Web3 wallet connect button
├── AudioControls.jsx  # Sound/music controls
│
├── IntroModal.jsx     # Game intro/tutorial
├── Leaderboard.jsx    # High scores display
├── Marketplace.jsx    # NFT marketplace UI
├── NFTGallery.jsx     # Player's NFT collection
├── MintModal.jsx      # NFT minting interface
│
├── ParticleEffects.jsx # Visual particle systems
└── Transitions.jsx    # Scene transition animations
```

### Custom Hooks

```
/src/hooks/
├── useInventory.js    # INVENTORY MANAGEMENT
│                      # - Grains: green, gold, orange, purple, cyan
│                      # - Essences: forest, golden, amber, violet
│                      # - Pyramid shards (5 realms)
│                      # - addGrain(), removeGrains(), hasGrains()
│                      # - LocalStorage persistence
│
├── useGameState.js    # GAME STATE
│                      # - Current mode, difficulty
│                      # - Realm unlocked states
│                      # - Free mode toggle
│                      # - Strike tracking, riddle progress
│
├── useTurtleMovement.js # PLAYER MOVEMENT
│                      # - WASD/arrow key handling
│                      # - Position/rotation state
│                      # - Boundary collision (clock edges)
│                      # - Walking/idle state
│
├── useGameInput.js    # INPUT HANDLING
│                      # - Keyboard listener initialization
│                      # - Mobile detection
│                      # - Key state management
│
├── useAudio.js        # AUDIO SYSTEM
│                      # - Sound effects (collect, unlock, etc)
│                      # - Ambient music
│                      # - Gear ticking during hub
│                      # - Time stop/resume sounds
│
├── useKeyboard.js     # Low-level keyboard state
├── useGameLoop.js     # Game loop management
├── useLeaderboard.js  # Leaderboard data fetching
├── useMarketplace.js  # NFT marketplace integration
└── useWallet.js       # Web3 wallet connection
```

### Utility Functions

```
/src/utils/
├── clockMath.js       # CLOCK CALCULATIONS
│                      # - CLOCK_RADIUS, CLOCK_THICKNESS constants
│                      # - getHandAngles(date) - hour/min/sec angles
│                      # - Position calculations for characters
│
├── collision.js       # COLLISION DETECTION
│                      # - Boundary checking for turtle
│                      # - BOUNDARY_MARGIN constant
│                      # - isWithinBounds() function
│
├── movement.js        # MOVEMENT UTILITIES
│                      # - Direction calculations
│                      # - Speed constants
│
├── riddles.js         # NPC DIALOGUE DATA
│                      # - Riddles for each animal
│                      # - Hint text
│                      # - Conversation scripts
│
└── nft.js             # NFT UTILITIES
                       # - Minting helpers
                       # - Contract interactions
```

### Tests

```
/src/__tests__/
├── clockMath.test.js  # Tests for clock angle calculations
├── collision.test.js  # Tests for boundary collision (margin=0.1)
└── movement.test.js   # Tests for movement utilities
```

---

## Lore Summary

The Golden Clock is an ancient artifact measuring time itself. Within its mechanisms lives Dimitrius, a mystical entity whose essence was shattered into pyramid shards across five realms.

Cooter the Turtle must journey through each realm, gather the shards, and restore Dimitrius. Every minute, Amadeus the Wizard briefly stops time, allowing magical essence grains to manifest on the clock face.

The five guardian animals each protect a portal to their realm:
- **Rabbit, Frog, Cat, Owl** - stand at fixed positions, jumping over the second hand as it passes
- **Miles the Inchworm** - patiently walks the long way around the clock's edge, completing one full lap every 24 hours

Miles represents patience and persistence - the slow and steady path that eventually covers the greatest distance.

---

## Version

**Current:** v1.4.0
**Last Updated:** January 2026

### Changelog v1.4.0
- **The Metamorphosis (Inchworm Realm Complete Redesign):** Replaced "The Long Road" highway runner with butterfly flight game
  - Opening chrysalis cutscene with hatching animation
  - 3D flight through magical oversized garden
  - Nectar droplets, pollen clouds, rainbow dewdrops as collectibles
  - Dragonfly and spider web hazards
  - 3 zones: Meadow, Flower Forest, Heart Garden
  - 7 difficulty levels with scaling nectar goals (500-10000)
- **Pyramid Shard Reorder:** Miles is now Layer 4 (Cyan), Owl is now Capstone Layer 5 (Purple)
- **Owl Portal Requirements Updated:** Now requires 12 grains total (3 green + 3 gold + 3 orange + 3 cyan) instead of 12 purple
- **Cyan Grains Added to Déjà Vu:** Cyan grains now spawn during time-stop events
- **Miles E-Key Interaction Fixed:** Increased interaction distance from 0.8 to 1.2
- **Dynamic Miles Portal:** Cyan portal now hovers above Miles and follows him as he walks
- **Portal.jsx:** Added inchworm portal style (cyan theme)
- **Performance Optimizations:** Object pooling, frustum culling, useMemo/useCallback throughout InchwormRealm

### Changelog v1.3.0
- **Miles the Inchworm:** New NPC that walks clockwise around the clock edge every 24 hours
  - 8-segment caterpillar with wave-like inching animation
  - Cyan grains (12 needed) unlock his portal
- **The Long Road (Inchworm Realm):** Highway endless runner - dodge traffic, collect mile markers
- **5-Shard Pyramid System:** Expanded from 4 to 5 shards (rabbit, frog, cat, owl, inchworm)
- **Memory Leak Fixes:**
  - Max 12 grains on clock at once (prevents accumulation)
  - Grains despawn after 3 minutes if uncollected
  - Removed expensive pointLights from grain objects
- **Realm Improvements:**
  - RabbitRealm: Enhanced autumn visuals (realistic hay bales, corn stalks, pumpkins, gourds, fallen leaves)
  - CatRealm: Fixed theme coherence (rooftop surface, AC units, chimneys, security drones)
  - Fixed essence collection in RabbitRealm and CatRealm (now properly adds to inventory)

### Changelog v1.2.0
- **Second Hand Collision Mechanic:** Cooter blocking the second hand now causes grain loss
  - 1 second grace period, then 1 grain/second removed randomly from inventory
  - Creates strategic tension: collect grains quickly, avoid blocking the hand
- Complete file structure documentation added to scope.md

### Changelog v1.1.0
- Amadeus (Y/Nox) now jumps forward toward center instead of sideways when stopping time
- Deja Vu events now spawn 3 grains with random colors (was 1)
- Added Grain Offering System - animals keep required grain color secret, wrong offerings burn
- Enhanced animal jump animations with extended hang time to clear the second hand
- Performance optimizations (Date caching, reduced geometry, callback optimization)
