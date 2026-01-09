// Riddle system for unlocking realms
// Story: AEIOU has been shattered into 4 pieces, one in each realm
// Players must explore and talk to characters to figure out what happened

// Animal riddles - cryptic hints about clock position
export const RIDDLES = {
  cat: {
    name: 'Kittle',
    clockPosition: 3,  // 3 o'clock
    grainsNeeded: 3,
    greeting: "Mrrrow... A turtle who walks with time. Curious...",
    riddle: "Where the morning sun first warms my fur, at the hour when shadows stretch long to the west... bring me essences to match that moment, and my realm shall open.",
    hint: "Think about where 3 o'clock is on the clock face...",
    unlockMessage: "Purrfect... You understand the language of time. The Rooftops await you above! Seek the shattered piece of the jester within...",
    wrongMessage: "Mrrrow... That doesn't match the hour where I rest. Think again, little turtle.",
    notEnoughMessage: "You haven't gathered enough essences yet. Return when your collection matches my hour.",
  },

  frog: {
    name: 'Pepe',
    clockPosition: 6,  // 6 o'clock
    grainsNeeded: 6,
    greeting: "Ribbit! Welcome to the bottom of time's wheel!",
    riddle: "At the lowest point where the hand points down, where evening meals begin... that's how many essences I seek! Ribbit!",
    hint: "The bottom of the clock... what hour is that?",
    unlockMessage: "RIBBIT! You've cracked it! The Lily Marsh opens before you! A piece of the broken one awaits in the depths...",
    wrongMessage: "Croak... That's not my number. Look at where I sit on the clock!",
    notEnoughMessage: "Ribbit... Not enough essences yet. Hop along and collect more!",
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
    notEnoughMessage: "You need more essences, friend. Keep stopping time!",
  },

  owl: {
    name: 'Hoots',
    clockPosition: 12,  // 12 o'clock position for the owl realm portal
    isOwlRealm: true,  // Hoots owns The Night Sky realm
    greeting: "Hoo-hoo! A brave turtle on a noble quest! I see you seek to help poor AEIOU...",
    dialogueOptions: [
      {
        question: "Who are you?",
        answer: "I am Hoots, rider of the second hand! Round and round I go, watching all that happens on this clock. I saw when AEIOU was shattered... a terrible sight, hoo-hoo...",
      },
      {
        question: "How do I open your portal?",
        answer: "My realm - The Night Sky - requires THREE victory essences! One GOLDEN from The Warren, one FOREST GREEN from The Lily Marsh, and one AMBER from The Rooftops. Complete each realm and bring their treasures to me!",
      },
      {
        question: "Where do I get victory essences?",
        answer: "Each realm grants a special essence when you find AEIOU's shard within! The Warren gives GOLDEN, The Lily Marsh gives FOREST GREEN, The Rooftops give AMBER. Collect all three to prove your worth!",
      },
      {
        question: "What's in The Night Sky?",
        answer: "The fourth and final piece of AEIOU awaits in my realm! Without it, Y cannot cast the Fusion Spell. I guard the most precious shard... but only the worthy may enter, hoo-hoo!",
      },
      {
        question: "Tell me about stopping time.",
        answer: "Stand in the path of the second hand, brave turtle! Don't move, and you'll stop time itself! Hold for 33 seconds and a Time Essence will crystallize. These are the keys to opening the portals!",
      },
    ],
    riddle: "",
    hint: "Hoots knows how to unlock The Night Sky. You need victory essences from the three other realms.",
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
    greeting: "Hoo-hoo! I ride the second hand! Talk to me when I pass by!",
    isHoots: true,  // Hoots on the second hand - quick dialogue
    dialogueOptions: [
      {
        question: "Who are you?",
        answer: "I am Hoots! I ride the second hand round and round! If you want to enter my realm, find me at the 12 o'clock position - that's where my portal appears!",
      },
      {
        question: "Any tips?",
        answer: "Watch out for Y at 12 o'clock - he stops time! Stand in the second hand's path to collect Time Essences. And talk to Y, he knows everything about saving AEIOU!",
      },
    ],
    riddle: "",
    hint: "Hoots on the second hand points you toward his portal at 12 o'clock.",
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

// Check if player has required essences for Y's portal
export function checkOwlRequirements(inventory) {
  const requiredEssences = ['golden', 'forest', 'amber'];

  const hasAll = requiredEssences.every(essenceType => inventory.essences[essenceType] >= 1);

  if (hasAll) {
    return {
      correct: true,
      message: "The three victory essences glow with ancient power... The Night Sky awaits you, time-walker!",
      essencesUsed: requiredEssences,
    };
  } else {
    const missing = requiredEssences.filter(e => inventory.essences[e] < 1);
    return {
      correct: false,
      message: "You need victory essences from all three realms to enter The Night Sky.",
      missing,
    };
  }
}

// Check if player can perform the fusion spell
export function checkFusionRequirements(inventory) {
  const hasAllShards = inventory.pyramidShards &&
    inventory.pyramidShards.rabbit &&
    inventory.pyramidShards.frog &&
    inventory.pyramidShards.cat &&
    inventory.pyramidShards.owl;

  if (hasAllShards) {
    return {
      canFuse: true,
      message: "All four shards pulse with AEIOU's fragmented essence... The Fusion Spell can be cast!",
    };
  } else {
    const missing = [];
    if (!inventory.pyramidShards?.rabbit) missing.push('The Warren (Rabbit)');
    if (!inventory.pyramidShards?.frog) missing.push('The Lily Marsh (Frog)');
    if (!inventory.pyramidShards?.cat) missing.push('The Rooftops (Cat)');
    if (!inventory.pyramidShards?.owl) missing.push('The Night Sky (Owl)');
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
    inventory.blackShards.owl;

  if (hasAllBlackShards) {
    return {
      canOpenMidnight: true,
      message: "Four BLACK shards of impossible victory... The Midnight Gate shall open!",
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
