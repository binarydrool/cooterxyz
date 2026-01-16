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
    essencesNeeded: 9,  // 3 from each of 3 realms = 9 total
    greeting: "Hoo-hoo! The square root of wisdom multiplied by three realms... brings you to me...",
    dialogueOptions: [
      {
        question: "Who are you?",
        answer: "Hoo-hoo... I am Hoots, keeper of calculations eternal! Three squared equals my desire, but nine divided by three realms... that is your task. Each realm holds three gems of time...",
      },
      {
        question: "How do I open your portal?",
        answer: "The root of eighty-one, divided by the root of nine... equals the essences per realm you must find. Hoo-hoo! Three from The Warren... three from The Marsh... three from The Rooftops. Nine in total, the square of three!",
      },
      {
        question: "Where do I get essences?",
        answer: "Hoo... Each realm guards three golden crystals of time. Three times three equals nine. The sum of all parts forms the whole. Bunzy, Pepe, and Kittle each hold a trinity of essences... gather them all!",
      },
      {
        question: "What's in The Night Sky?",
        answer: "Hoo-hoo-hoo! The fourth shard of AEIOU's shattered mind awaits in my domain! But only those who understand the mathematics of time may enter... Nine is the key, turtle. Three cubed minus eighteen equals your goal!",
      },
      {
        question: "Can you speak plainly?",
        answer: "Hoo... plainly? Very well: collect ALL 3 essences from The Warren, ALL 3 from The Lily Marsh, and ALL 3 from The Rooftops. That's 9 total. Bring them to me. The math is simple... hoo-hoo!",
      },
    ],
    riddle: "",
    hint: "Hoots speaks in riddles. He needs 9 essences total - 3 from each of the three other realms.",
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
    greeting: "Hoo-hoo! I ride the second hand! To enter my realm, you need NINE essences!",
    isHoots: true,  // Hoots on the second hand
    isOwlRealm: true,  // Also requires essences to unlock
    essencesNeeded: 9,  // 3 from each of 3 realms = 9 total
    dialogueOptions: [
      {
        question: "How do I unlock your realm?",
        answer: "Hoo! You need NINE essences to enter The Night Sky! Three from The Warren (golden), three from The Lily Marsh (forest green), and three from The Rooftops (amber). Offer them here!",
      },
      {
        question: "Where is your portal?",
        answer: "My portal appears at the 12 o'clock position once you offer 9 essences! No shortcuts, hoo-hoo!",
      },
      {
        question: "Any tips?",
        answer: "Complete the other 3 realms - each has 3 essences to find inside! Complete all three realms, gather 9 total, then offer them to me!",
      },
    ],
    riddle: "",
    hint: "Hoots needs 9 essences total to open The Night Sky - 3 from each of the three other realms.",
    unlockMessage: "Hoo-hoo! The mathematics align! The Night Sky opens before you! Seek the final shard of AEIOU's mind!",
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
    grainsNeeded: 12,   // 12 grains (half a day, 12 hours)
    greeting: "*inch inch* Oh! A turtle! I've been walking this clock face for sooo long... it takes me a whole day to get around! *inch inch*",
    riddle: "I measure my journey in hours, not steps. Bring me Time Grains equal to half my daily voyage, and I shall show you The Long Road...",
    hint: "Miles walks around the clock in 24 hours. Half of that is...",
    unlockMessage: "*inch inch* Twelve! Yes, twelve hours, half my journey! *wiggles excitedly* The Long Road opens before you! Seek the final piece of AEIOU's mind within... but pace yourself, turtle friend!",
    wrongMessage: "*inch* Hmm, that's not quite half my daily trek... count the hours more carefully! *inch inch*",
    notEnoughMessage: "*inch inch* Not enough grains yet, friend. Keep stopping time! I'll be here... slowly... *inch*",
    dialogueOptions: [
      {
        question: "Why do you walk so slow?",
        answer: "*inch* Slow? SLOW?! *inch inch* I prefer 'methodical'! Every inch is a meditation, every step a journey. Besides, have YOU tried walking on six tiny legs? *wiggles antennae indignantly*",
      },
      {
        question: "What's The Long Road?",
        answer: "*inch inch* The Long Road is MY realm! A winding path through gardens and leaves, where patience is rewarded and haste is punished! *inch* A piece of poor AEIOU got lost in there... the fifth shard of his shattered mind...",
      },
      {
        question: "How long have you been here?",
        answer: "*stops, thinks* I've made... *counts on tiny legs* ...thousands of trips around this clock face! Each lap takes exactly 24 hours. *inch inch* Time moves differently when you're this small. Every second is an adventure!",
      },
      {
        question: "Any advice for your realm?",
        answer: "*inch inch* In The Long Road, PATIENCE is your ally! Don't rush - the path reveals itself to those who take their time. *wiggles* Watch for my cousins... some are friendly, some... less so. *inch*",
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

// Check if player has required essences for owl's portal (9 total: 3 from each realm)
export function checkOwlRequirements(inventory) {
  const ESSENCES_NEEDED = 9;

  // Count total essences from all types
  const totalEssences = Object.values(inventory.essences).reduce((sum, count) => sum + count, 0);

  // Check if we have at least 3 of each type (golden from rabbit, forest from frog, amber from cat)
  const goldenCount = inventory.essences.golden || 0;
  const forestCount = inventory.essences.forest || 0;
  const amberCount = inventory.essences.amber || 0;

  const hasEnough = totalEssences >= ESSENCES_NEEDED &&
    goldenCount >= 3 && forestCount >= 3 && amberCount >= 3;

  if (hasEnough) {
    // Remove 3 of each type
    return {
      correct: true,
      message: "Hoo-hoo! Nine essences... three squared... the mathematics of time align! The Night Sky opens before you!",
      essencesUsed: ['golden', 'golden', 'golden', 'forest', 'forest', 'forest', 'amber', 'amber', 'amber'],
      essenceAmounts: { golden: 3, forest: 3, amber: 3 },
    };
  } else {
    const needed = {
      golden: Math.max(0, 3 - goldenCount),
      forest: Math.max(0, 3 - forestCount),
      amber: Math.max(0, 3 - amberCount),
    };
    const totalNeeded = ESSENCES_NEEDED - totalEssences;
    return {
      correct: false,
      message: `Hoo... The equation is incomplete. You need ${totalNeeded > 0 ? totalNeeded + ' more essences' : 'the right combination'}. Golden: ${goldenCount}/3, Forest: ${forestCount}/3, Amber: ${amberCount}/3.`,
      needed,
      totalHave: totalEssences,
      totalNeeded: ESSENCES_NEEDED,
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
