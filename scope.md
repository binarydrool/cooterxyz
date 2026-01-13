# COOTER - Game Scope & Design Document

## Overview

**Cooter** is a 3D web-based adventure game set in a magical world centered around a golden clock hub called "The Eternal Clocktower." Players control Cooter the Turtle as they navigate through five distinct realm games, collect magical essences, and ultimately restore the legendary Dimitrius.

**Tech Stack:** React/Next.js + Three.js (React Three Fiber)

---

## The Hub: Eternal Clocktower

The main hub is a massive interactive 3D golden analog clock. The clock drives the core "Deja Vu" mechanic:

- **Every 59 seconds:** Amadeus (Y/Nox) the Wizard jumps forward toward the center and blocks the second hand
- **3-second time freeze:** Gears stop, second hand glows cyan
- **Essence spawns:** Three collectible sand grains appear on the clock face with random colors (Forest, Golden, Amber, or Violet)
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

     Hoots rides on the second hand tip
```

---

## Characters

### Main Characters

| Character | Type | Location | Role |
|-----------|------|----------|------|
| **Cooter** | Turtle | Player-controlled | Protagonist - the player |
| **Dimitrius** | Gnome Jester | 12 o'clock rim | Guardian, realm gatekeeper, final boss |
| **Amadeus (Y/Nox)** | Wizard | 12 o'clock | Time blocker, triggers Deja Vu, jumps forward to stop time |
| **Hoots** | Barn Owl | Second hand tip | Hint giver, rides the clock |

### Portal Guardians (Jump over second hand when it approaches - with extended hang time)

| Character | Location | Realm |
|-----------|----------|-------|
| **Rabbit** | 9 o'clock (45 sec) | The Warren |
| **Cat** | 3 o'clock (15 sec) | Rooftop Runner |
| **Frog** | 6 o'clock (30 sec) | The Lily Marsh |
| **Owl** | Center/Above | The Night Sky |

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

---

## The Five Realms

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

**Reward:** Violet Essence + Pyramid Shard (Layer 4 - Capstone)

---

### 5. The Eternal Clocktower (Elf Realm)

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

**Unlock Requirement:** All 4 pyramid shards collected

---

## Progression System

### Essences (4 Types)

| Essence | Color | Shape | Source |
|---------|-------|-------|--------|
| Forest | Green | Tetrahedron | Frog Realm |
| Golden | Gold | Cube | Rabbit Realm |
| Amber | Orange | Octahedron | Cat Realm |
| Violet | Purple | Icosahedron | Owl Realm |

Essences also spawn on the clock during Deja Vu events.

### Grain Offering System

Each portal guardian (Cat, Frog, Rabbit) requires a specific type of essence grain to unlock their portal. However, they don't reveal which color they need - players must discover this through trial and error:

- **Mystery Mechanic:** Animals keep their required grain color secret
- **Offering Grains:** Players can offer any collected grain to an animal
- **Correct Grain:** Accepted! Counts toward portal unlocking
- **Wrong Grain:** Burned/rejected! The grain crumbles to dust and is lost
- **Risk/Reward:** Players must strategically decide which grains to offer

This adds a layer of mystery and resource management to the hub gameplay.

### Pyramid Shards

Complete each realm to earn a pyramid shard:

1. **Base Layer (Brown)** - Rabbit Realm - "From the East"
2. **Layer 2 (Green)** - Frog Realm - "From the South"
3. **Layer 3 (Orange)** - Cat Realm - "From the West"
4. **Capstone (Purple)** - Owl Realm - "From Above"

Collecting all 4 unlocks the Elf Realm (final boss).

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
5. **Clocktower:** Spiral architecture, rotating gears

---

## Game Flow

```
1. Start in Hub (Clock)
        |
2. Explore, talk to NPCs, collect Deja Vu essences
        |
3. Enter realm portals -> Select difficulty
        |
4. Complete realm objective
        |
5. Earn shard + essence -> Return to hub
        |
6. Repeat for all 4 realms
        |
7. Unlock Elf Realm (all shards collected)
        |
8. Defeat Dimitrius -> Game complete!
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

## File Structure

```
/src
  /components
    /realms/
      - RabbitRealm.jsx      (Pac-Man maze)
      - FrogRealm3D.jsx      (Frogger platformer)
      - CatRealm3D.jsx       (Rooftop Runner)
      - OwlRealm3D.jsx       (Flight survival)
      - ElfRealm3D.jsx       (Boss fight)
    /ui/
      - GameHUD.jsx          (In-game HUD)
      - MainMenu.jsx         (Start screen)
      - ChatModal.jsx        (NPC dialogue)
      - DifficultySelect.jsx (Realm entry)
    - Game.jsx               (Main game controller)
    - Clock.jsx              (Hub clock)
    - Scene.jsx              (3D scene setup)
    - Turtle.jsx             (Player character)
    - Owl.jsx, Rabbit.jsx... (NPC characters)
  /hooks/
    - useGameState.js        (Global state)
    - useInventory.js        (Collectibles)
    - useAudio.js            (Sound)
  /data/
    - riddles.js             (NPC dialogue)
```

---

## Lore Summary

The Golden Clock is an ancient artifact measuring time itself. Within its mechanisms lives Dimitrius, a mystical entity whose essence was shattered into pyramid shards across four realms.

Cooter the Turtle must journey through each realm, gather the shards, and restore Dimitrius. Every minute, Amadeus the Wizard briefly stops time, allowing magical essences to manifest on the clock face.

The four guardian animals (Rabbit, Frog, Cat, Owl) each protect a portal to their realm, jumping over the second hand as it passes to demonstrate their vigilance.

---

## Version

**Current:** v1.1.0
**Last Updated:** January 2026

### Changelog v1.1.0
- Amadeus (Y/Nox) now jumps forward toward center instead of sideways when stopping time
- Deja Vu events now spawn 3 grains with random colors (was 1)
- Added Grain Offering System - animals keep required grain color secret, wrong offerings burn
- Enhanced animal jump animations with extended hang time to clear the second hand
- Performance optimizations (Date caching, reduced geometry, callback optimization)
