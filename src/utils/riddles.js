// Riddle system for unlocking realms
// Story: AEIOU has been shattered into 5 pieces, one in each realm
// Players must explore and talk to characters to figure out what happened

// Animal riddles - cryptic hints about clock position
export const RIDDLES = {
  cat: {
    name: 'Kittle',
    clockPosition: 3,  // 3 o'clock
    grainsNeeded: 3,
    greeting: "Mrrrow... A turtle who walks with time. Curious...",
    riddle: "Where the morning sun first warms my fur, at the hour when shadows stretch long to the west... bring me Time Grains to match that moment, and my realm shall open.",
    hint: "Where does the cat rest on the clock face? That hour is the answer...",
    unlockMessage: "Purrfect... You understand the language of time. The Rooftops await you above! Seek the shattered piece of the jester within...",
    wrongMessage: "Mrrrow... That doesn't match the hour where I rest. Think again, little turtle.",
    notEnoughMessage: "You haven't gathered enough Time Grains yet. Return when your collection matches my hour.",
  },

  frog: {
    name: 'Pepe',
    clockPosition: 6,  // 6 o'clock
    grainsNeeded: 6,
    greeting: "Ribbit! Welcome to the bottom of time's wheel!",
    riddle: "At the lowest point where the hand points down, where evening meals begin... that's how many Time Grains I seek! Ribbit!",
    hint: "The bottom of the clock... what hour is that?",
    unlockMessage: "RIBBIT! You've cracked it! The Lily Marsh opens before you! A piece of the broken one awaits in the depths...",
    wrongMessage: "Croak... That's not my number. Look at where I sit on the clock!",
    notEnoughMessage: "Ribbit... Not enough Time Grains yet. Hop along and collect more!",
  },

  rabbit: {
    name: 'Bunzy',
    clockPosition: 9,  // 9 o'clock
    grainsNeeded: 9,
    greeting: "Hop hop! A turtle who bends time itself! How wonderful!",
    riddle: "On the left side of the clock, three quarters through the circle's journey... that's the count I need to open the way!",
    hint: "Three quarters around the clock from 12... which hour is that?",
    unlockMessage: "Wonderful! You've figured it out! Follow me into The Warren! The jester's fragment hides within my burrows...",
    wrongMessage: "Hmm, that's not quite right... Count the hours more carefully!",
    notEnoughMessage: "You need more Time Grains, friend. Keep stopping time!",
  },

  owl: {
    name: 'Hoots',
    clockPosition: 12,  // 12 o'clock position for the owl realm portal
    isOwlRealm: true,  // Hoots owns The Night Sky realm
    grainsNeeded: 12,  // 3 of each color from all 4 realms = 12 total
    greeting: "Hoo-hoo! Four colors, three each, twelve in total... the mathematics of time converge here...",
    dialogueOptions: [
      {
        question: "Who are you?",
        answer: "Hoo-hoo... I am Hoots, keeper of calculations eternal! Twelve is my desire - three squared plus three more. Four colors of time, each thrice offered... that is your task!",
      },
      {
        question: "How do I open your portal?",
        answer: "Hoo-hoo! Bring me grains of FOUR colors - green for the Frog, gold for the Rabbit, orange for the Cat, and cyan for Miles! Three of each, twelve total. The sum of all four realms!",
      },
      {
        question: "Where do I get grains?",
        answer: "Hoo... When Y stops time at fifty-nine seconds, grains of time appear on the clock face! Five colors spawn randomly - collect three of each: green, gold, orange, and cyan. Four times three equals twelve!",
      },
      {
        question: "What's in The Night Sky?",
        answer: "Hoo-hoo-hoo! The FIFTH shard of AEIOU's shattered mind awaits in my domain - the capstone of the pyramid! But only those who master ALL four realms of time may enter... Twelve is the key!",
      },
      {
        question: "Can you speak plainly?",
        answer: "Hoo... plainly? Very well: collect 3 green, 3 gold, 3 orange, AND 3 cyan Time Grains. That's 12 total from the four realms. Offer them to me, and my portal opens. The math is simple... hoo-hoo!",
      },
    ],
    riddle: "",
    hint: "Hoots needs 12 Time Grains total - 3 green, 3 gold, 3 orange, and 3 cyan (from all 4 animal realms).",
  },

  nox: {
    name: 'Y',
    clockPosition: 12,  // 12 o'clock - Y sits here and stops time
    isGuide: true,  // Y is the main guide, AEIOU's partner
    greeting: "Time-walker... you must help us! I am Y, partner to AEIOU. His mind has been shattered across four realms. Please, gather the Mind Shards and restore him!",
    dialogueOptions: [
      {
        question: "Why is AEIOU mute?",
        answer: "A terrible fate befell my partner... His mind has been SPLIT across four dimensions. The fragments of his consciousness are scattered through the portals - one shard in each realm. Without his mind whole, AEIOU can only speak in silence... '...' is all that escapes him now.",
      },
      {
        question: "How do I restore his mind?",
        answer: "You must venture into each realm and recover the Mind Shards. One lies in The Warren with Bunzy... one in The Lily Marsh with Pepe... one in The Rooftops with Kittle... and the final piece waits in The Night Sky with Hoots. Four shards to make him whole.",
      },
      {
        question: "How do I unlock the portals?",
        answer: "Each guardian sits at their hour on the clock. Bunzy at 9, Pepe at 6, Kittle at 3. Offer them Time Essences matching their hour, and their portals shall open. I stop time at 59 seconds each minute - collect the essences that appear!",
      },
      {
        question: "How do I enter The Night Sky?",
        answer: "Hoots guards The Night Sky. His realm requires proof of your mastery - the three Victory Essences from the other realms. One GOLDEN from The Warren, one FOREST GREEN from The Lily Marsh, one AMBER from The Rooftops. Complete each realm, claim its essence, then speak with Hoots.",
      },
      {
        question: "What happens with all four shards?",
        answer: "Bring all four Mind Shards to me. I shall perform the FUSION SPELL - ancient magic that will reunite my partner's scattered consciousness across dimensions. Only then will AEIOU's mind be restored... and only then can he open the NOON PORTAL.",
      },
      {
        question: "What is the Noon Portal?",
        answer: "The Noon Portal is sealed by AEIOU's will. When restored, he alone can unlock it - revealing the clock's TRUE purpose. But beware... the Midnight Gate requires even greater trials. Conquer all realms on IMPOSSIBLE difficulty for that dark path...",
      },
    ],
    riddle: "",
    hint: "Y knows why AEIOU is mute. Ask him about the shattered mind and how to restore it.",
  },

  hoots: {
    name: 'Hoots',
    greeting: "Hoo-hoo! I ride the second hand! To enter my realm, you need TWELVE Time Grains - three of each color!",
    isHoots: true,  // Hoots on the second hand
    isOwlRealm: true,  // Requires grains to unlock
    grainsNeeded: 12,  // 3 of each color from all 4 realms = 12 total
    dialogueOptions: [
      {
        question: "How do I unlock your realm?",
        answer: "Hoo! You need TWELVE Time Grains to enter The Night Sky! Three green (Frog), three gold (Rabbit), three orange (Cat), and three cyan (Miles). Offer them all here!",
      },
      {
        question: "Where is your portal?",
        answer: "My portal appears at the 12 o'clock position once you offer all 12 grains - three of each of the four colors! No shortcuts, hoo-hoo!",
      },
      {
        question: "Any tips?",
        answer: "Stop time with Y at 59 seconds! Grains spawn in random colors. Collect three green, three gold, three orange, and three cyan. Twelve total from the four realms!",
      },
    ],
    riddle: "",
    hint: "Hoots needs 12 Time Grains total - 3 green, 3 gold, 3 orange, and 3 cyan.",
    unlockMessage: "Hoo-hoo! All four colors aligned! The Night Sky opens before you! Seek the capstone shard of AEIOU's mind!",
  },

  gnome: {
    name: 'AEIOU',
    isShattered: true,  // AEIOU is broken, can only say "..."
    greeting: "...",
    dialogueOptions: [
      {
        question: "Hello?",
        answer: "...",
      },
      {
        question: "Can you hear me?",
        answer: "... ... ...",
      },
      {
        question: "I'll help you.",
        answer: "... *a faint glimmer in his eyes* ...",
      },
    ],
    riddle: "",
    hint: "Something terrible has happened here...",
  },

  miles: {
    name: 'Miles',
    clockPosition: 24,  // 24-hour cycle
    grainsNeeded: 12,   // 12 cyan grains needed
    greeting: "*inch inch* Oh! A turtle! I've been walking this clock face for sooo long... it takes me a whole day to get around! *inch inch* But sometimes... I dream of wings...",
    riddle: "I measure my journey in hours, not steps. Bring me cyan Time Grains equal to half my daily voyage, and I shall show you The Metamorphosis...",
    hint: "Miles walks around the clock in 24 hours. Half of that is...",
    unlockMessage: "*inch inch* Twelve! Yes, twelve hours, half my journey! *wiggles excitedly* The Metamorphosis awaits! In my realm, you shall become what I dream of - a beautiful butterfly! Seek the fourth piece of AEIOU's mind within the chrysalis!",
    wrongMessage: "*inch* Hmm, that's not quite half my daily trek... count the hours more carefully! *inch inch*",
    notEnoughMessage: "*inch inch* Not enough cyan grains yet, friend. Keep stopping time! I'll be here... slowly... *inch*",
    dialogueOptions: [
      {
        question: "Why do you walk so slow?",
        answer: "*inch* Slow? SLOW?! *inch inch* I prefer 'methodical'! Every inch is a meditation, every step a journey. Besides, have YOU tried walking on six tiny legs? *wiggles antennae indignantly*",
      },
      {
        question: "What's The Metamorphosis?",
        answer: "*inch inch* The Metamorphosis is MY realm! A magical garden where transformation is possible... *dreamy sigh* In there, you become a butterfly - free to fly through flowers and light! *inch* But I always return to who I am... change comes to all of us.",
      },
      {
        question: "How long have you been here?",
        answer: "*stops, thinks* I've made... *counts on tiny legs* ...thousands of trips around this clock face! Each lap takes exactly 24 hours. *inch inch* Time moves differently when you're this small. Every second is an adventure!",
      },
      {
        question: "Any advice for your realm?",
        answer: "*inch inch* In The Metamorphosis, embrace the freedom of flight! Use SPACE to soar higher, SHIFT to descend. *wiggles* Collect nectar, avoid the dragonflies, and find the three cyan essences hidden in the garden!",
      },
      {
        question: "Do you dream of flying?",
        answer: "*inch inch* Every night, turtle friend... every night. *gazes wistfully* In my dreams, I have the most beautiful cyan wings, iridescent like morning dew. That's why my realm shows you... my other self. *inch* Beautiful, isn't it?",
      },
    ],
    isMiles: true,  // Flag for Miles-specific handling
  },
};

// Check if player has enough essences for this animal's portal
export function checkGrainCount(animal, grainCount) {
  const riddle = RIDDLES[animal];
  if (!riddle || riddle.isShattered || riddle.isGuide) return { correct: false, message: "Unknown animal" };

  // Skip Hoots - he doesn't have a portal
  if (riddle.isHoots) {
    return { correct: false, message: "Hoots doesn't have a portal." };
  }

  const needed = riddle.grainsNeeded;

  if (grainCount >= needed) {
    return {
      correct: true,
      message: riddle.unlockMessage,
      grainsUsed: needed,
    };
  } else {
    return {
      correct: false,
      message: riddle.notEnoughMessage,
      grainsNeeded: needed,
      grainsHave: grainCount,
    };
  }
}

// Check if player has required grains for owl's portal (12 total: 3 of each color from all 4 realms)
export function checkOwlRequirements(inventory) {
  const GRAINS_NEEDED = 12;

  // Count total grains from all four colors
  const greenCount = inventory.grains?.green || 0;
  const goldCount = inventory.grains?.gold || 0;
  const orangeCount = inventory.grains?.orange || 0;
  const cyanCount = inventory.grains?.cyan || 0;
  const totalGrains = greenCount + goldCount + orangeCount + cyanCount;

  // Check if we have at least 3 of each color (green=frog, gold=rabbit, orange=cat, cyan=miles)
  const hasEnough = totalGrains >= GRAINS_NEEDED &&
    greenCount >= 3 && goldCount >= 3 && orangeCount >= 3 && cyanCount >= 3;

  if (hasEnough) {
    return {
      correct: true,
      message: "Hoo-hoo! Twelve grains... four colors thrice offered... the mathematics of ALL realms align! The Night Sky opens before you!",
      grainsUsed: { green: 3, gold: 3, orange: 3, cyan: 3 },
    };
  } else {
    const needed = {
      green: Math.max(0, 3 - greenCount),
      gold: Math.max(0, 3 - goldCount),
      orange: Math.max(0, 3 - orangeCount),
      cyan: Math.max(0, 3 - cyanCount),
    };
    const totalNeeded = Math.max(0, GRAINS_NEEDED - totalGrains);
    return {
      correct: false,
      message: `Hoo... The equation is incomplete. You need ${totalNeeded > 0 ? totalNeeded + ' more grains' : 'the right combination'}. Green: ${greenCount}/3, Gold: ${goldCount}/3, Orange: ${orangeCount}/3, Cyan: ${cyanCount}/3.`,
      needed,
      totalHave: totalGrains,
      totalNeeded: GRAINS_NEEDED,
    };
  }
}

// Check if player can perform the fusion spell
export function checkFusionRequirements(inventory) {
  const hasAllShards = inventory.pyramidShards &&
    inventory.pyramidShards.rabbit &&
    inventory.pyramidShards.frog &&
    inventory.pyramidShards.cat &&
    inventory.pyramidShards.owl &&
    inventory.pyramidShards.inchworm;

  if (hasAllShards) {
    return {
      canFuse: true,
      message: "All five shards pulse with AEIOU's fragmented essence... The Fusion Spell can be cast!",
    };
  } else {
    const missing = [];
    if (!inventory.pyramidShards?.rabbit) missing.push('The Warren (Rabbit)');
    if (!inventory.pyramidShards?.frog) missing.push('The Lily Marsh (Frog)');
    if (!inventory.pyramidShards?.cat) missing.push('The Rooftops (Cat)');
    if (!inventory.pyramidShards?.owl) missing.push('The Night Sky (Owl)');
    if (!inventory.pyramidShards?.inchworm) missing.push('The Long Road (Miles)');
    return {
      canFuse: false,
      message: "You still need shards from: " + missing.join(', '),
      missing,
    };
  }
}

// Check if player has all impossible (black) shards for midnight gate
export function checkMidnightRequirements(inventory) {
  const hasAllBlackShards = inventory.blackShards &&
    inventory.blackShards.rabbit &&
    inventory.blackShards.frog &&
    inventory.blackShards.cat &&
    inventory.blackShards.owl &&
    inventory.blackShards.inchworm;

  if (hasAllBlackShards) {
    return {
      canOpenMidnight: true,
      message: "Five BLACK shards of impossible victory... The Midnight Gate shall open!",
    };
  } else {
    return {
      canOpenMidnight: false,
      message: "Only those who conquer ALL realms on IMPOSSIBLE difficulty may open the Midnight Gate.",
    };
  }
}

// Get animal info
export function getAnimalInfo(animal) {
  return RIDDLES[animal] || null;
}

// Get all riddle animals (excluding guide NPCs)
export function getRiddleAnimals() {
  return Object.entries(RIDDLES)
    .filter(([_, data]) => !data.isShattered && !data.isGuide && !data.isHoots && data.grainsNeeded !== undefined)
    .map(([key]) => key);
}

// Get all animals
export function getAllAnimals() {
  return Object.keys(RIDDLES);
}

export default RIDDLES;
