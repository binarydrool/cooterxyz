"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { RIDDLES, checkGrainCount, checkOwlRequirements } from '@/utils/riddles';
import { ESSENCE_TYPES, GRAIN_TYPES } from '@/hooks/useInventory';

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// SVG Icons for animals (no emojis)
const AnimalIcons = {
  cat: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="8" fill="#FFA500" />
      <circle cx="11" cy="15" r="2" fill="#333" />
      <circle cx="21" cy="15" r="2" fill="#333" />
      <path d="M4 8 L8 16 L4 16 Z" fill="#FFA500" />
      <path d="M28 8 L24 16 L28 16 Z" fill="#FFA500" />
      <ellipse cx="16" cy="19" rx="2" ry="1" fill="#FF69B4" />
      <path d="M14 21 Q16 23 18 21" stroke="#333" strokeWidth="1" fill="none" />
    </svg>
  ),
  frog: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="20" rx="12" ry="8" fill="#4ade80" />
      <circle cx="10" cy="10" r="5" fill="#4ade80" />
      <circle cx="22" cy="10" r="5" fill="#4ade80" />
      <circle cx="10" cy="9" r="2" fill="#333" />
      <circle cx="22" cy="9" r="2" fill="#333" />
      <path d="M12 22 Q16 26 20 22" stroke="#333" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  rabbit: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="22" rx="8" ry="6" fill="#E8DCC8" />
      <ellipse cx="10" cy="6" rx="3" ry="10" fill="#E8DCC8" />
      <ellipse cx="22" cy="6" rx="3" ry="10" fill="#E8DCC8" />
      <ellipse cx="10" cy="6" rx="2" ry="8" fill="#FFB6C1" />
      <ellipse cx="22" cy="6" rx="2" ry="8" fill="#FFB6C1" />
      <circle cx="12" cy="20" r="1.5" fill="#333" />
      <circle cx="20" cy="20" r="1.5" fill="#333" />
      <ellipse cx="16" cy="23" rx="2" ry="1" fill="#FFB6C1" />
    </svg>
  ),
  owl: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="10" fill="#8B4513" />
      <circle cx="11" cy="14" r="5" fill="#FFF8DC" />
      <circle cx="21" cy="14" r="5" fill="#FFF8DC" />
      <circle cx="11" cy="14" r="2.5" fill="#FFD700" />
      <circle cx="21" cy="14" r="2.5" fill="#FFD700" />
      <circle cx="11" cy="14" r="1" fill="#333" />
      <circle cx="21" cy="14" r="1" fill="#333" />
      <path d="M14 20 L16 24 L18 20" fill="#FF8C00" />
      <path d="M6 8 L10 14 L8 10 Z" fill="#8B4513" />
      <path d="M26 8 L22 14 L24 10 Z" fill="#8B4513" />
    </svg>
  ),
  nox: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="10" fill="#2D1B4E" />
      <circle cx="11" cy="14" r="5" fill="#4B0082" />
      <circle cx="21" cy="14" r="5" fill="#4B0082" />
      <circle cx="11" cy="14" r="2.5" fill="#9370DB" />
      <circle cx="21" cy="14" r="2.5" fill="#9370DB" />
      <circle cx="11" cy="14" r="1" fill="#FFD700" />
      <circle cx="21" cy="14" r="1" fill="#FFD700" />
      <path d="M14 20 L16 24 L18 20" fill="#9370DB" />
      <path d="M6 8 L10 14 L8 10 Z" fill="#2D1B4E" />
      <path d="M26 8 L22 14 L24 10 Z" fill="#2D1B4E" />
    </svg>
  ),
  gnome: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 2 L8 16 L24 16 Z" fill="#E74C3C" />
      <circle cx="16" cy="22" r="8" fill="#F5DEB3" />
      <circle cx="13" cy="20" r="1.5" fill="#333" />
      <circle cx="19" cy="20" r="1.5" fill="#333" />
      <ellipse cx="16" cy="24" rx="2" ry="1.5" fill="#DC7F7F" />
      <path d="M10 26 Q16 32 22 26" fill="#C0C0C0" />
    </svg>
  ),
  hoots: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="18" rx="10" ry="10" fill="#8B4513" />
      <circle cx="11" cy="14" r="5" fill="#FFF8DC" />
      <circle cx="21" cy="14" r="5" fill="#FFF8DC" />
      <circle cx="11" cy="14" r="2.5" fill="#FFD700" />
      <circle cx="21" cy="14" r="2.5" fill="#FFD700" />
      <circle cx="11" cy="14" r="1" fill="#333" />
      <circle cx="21" cy="14" r="1" fill="#333" />
      <path d="M14 20 L16 24 L18 20" fill="#FF8C00" />
      <path d="M6 8 L10 14 L8 10 Z" fill="#8B4513" />
      <path d="M26 8 L22 14 L24 10 Z" fill="#8B4513" />
    </svg>
  ),
  miles: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Body segments - caterpillar/inchworm shape */}
      <ellipse cx="6" cy="20" rx="4" ry="3" fill="#7CFC00" />
      <ellipse cx="11" cy="18" rx="3.5" ry="3" fill="#66CD00" />
      <ellipse cx="16" cy="17" rx="3.5" ry="3" fill="#228B22" />
      <ellipse cx="21" cy="18" rx="3.5" ry="3" fill="#3CB371" />
      <ellipse cx="26" cy="20" rx="4" ry="3.5" fill="#32CD32" />
      {/* Head details */}
      <circle cx="28" cy="17" r="1.5" fill="#111" />
      <circle cx="24" cy="17" r="1.5" fill="#111" />
      <circle cx="28.3" cy="16.5" r="0.5" fill="#FFF" />
      <circle cx="24.3" cy="16.5" r="0.5" fill="#FFF" />
      {/* Antennae */}
      <path d="M26 14 L28 10" stroke="#228B22" strokeWidth="1" />
      <path d="M27 14 L30 11" stroke="#228B22" strokeWidth="1" />
      <circle cx="28" cy="10" r="1" fill="#7CFC00" />
      <circle cx="30" cy="11" r="1" fill="#7CFC00" />
      {/* Tiny legs */}
      <path d="M6 23 L5 26" stroke="#2E5E1A" strokeWidth="1" />
      <path d="M11 21 L10 24" stroke="#2E5E1A" strokeWidth="1" />
      <path d="M16 20 L15 23" stroke="#2E5E1A" strokeWidth="1" />
      <path d="M21 21 L20 24" stroke="#2E5E1A" strokeWidth="1" />
    </svg>
  ),
};

// Essence shape icons
const EssenceIcon = ({ type, size = 24 }) => {
  const essence = Object.values(ESSENCE_TYPES).find(e => e.id === type);
  if (!essence) return null;

  const color = essence.color;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {essence.shape === 'tetrahedron' && (
        <polygon points="12,2 2,22 22,22" fill={color} />
      )}
      {essence.shape === 'cube' && (
        <rect x="4" y="4" width="16" height="16" fill={color} transform="rotate(45 12 12)" />
      )}
      {essence.shape === 'octahedron' && (
        <polygon points="12,1 23,12 12,23 1,12" fill={color} />
      )}
      {essence.shape === 'icosahedron' && (
        <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill={color} />
      )}
    </svg>
  );
};

// Hourglass icon for grain counter (compact)
const HourglassIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M14 4 H34 V12 L24 24 L14 12 V4 Z" fill="#D4AF37" fillOpacity="0.3" stroke="#D4AF37" strokeWidth="2" />
    <path d="M14 44 H34 V36 L24 24 L14 36 V44 Z" fill="#D4AF37" stroke="#D4AF37" strokeWidth="2" />
    <rect x="12" y="2" width="24" height="4" rx="1" fill="#8B7355" />
    <rect x="12" y="42" width="24" height="4" rx="1" fill="#8B7355" />
  </svg>
);

export default function ChatModal({
  animal,
  isOpen,
  onClose,
  inventory,
  onUnlockRealm,
  freeMode = false,
  unlockedRealms = {},  // Track which portals are already open
}) {
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [realmUnlocked, setRealmUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [grainInput, setGrainInput] = useState('');
  const [attemptFeedback, setAttemptFeedback] = useState(null);

  const dialogueContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const isMobile = useIsMobile();

  const riddle = RIDDLES[animal];

  // Auto-scroll to latest message when dialogue changes
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [dialogueHistory]);
  const isTutorial = riddle?.isTutorial;
  const isHoots = riddle?.isHoots;
  const isGuide = riddle?.isGuide;  // Nox is the main guide
  const isShattered = riddle?.isShattered;  // Dimitrius is shattered
  const isOwlRealm = riddle?.isOwlRealm || animal === 'owl';  // Hoots' realm needs victory essences
  const isMiles = riddle?.isMiles;  // Miles the inchworm
  const grainsNeeded = riddle?.grainsNeeded || 0;

  // Find the grain type for this animal (each animal needs a specific color) - but don't reveal it!
  const grainType = Object.values(GRAIN_TYPES).find(g => g.animal === animal);
  const correctGrainColor = grainType?.id || 'gold';
  const grainsNeededCount = grainType?.needed || 3;

  // All grain colors available to offer
  const allGrainColors = ['green', 'gold', 'orange', 'purple', 'cyan'];

  // Get total of each grain color the player has
  const getGrainCount = (color) => inventory?.grains?.[color] || 0;
  const totalAllGrains = allGrainColors.reduce((sum, c) => sum + getGrainCount(c), 0);

  // Track how many correct grains have been offered to this animal
  const [correctGrainsOffered, setCorrectGrainsOffered] = useState(0);
  const [selectedGrainColor, setSelectedGrainColor] = useState(null);

  // Total GRAINS needed for owl realm - need 3 of each of 4 colors = 12 total
  // green (frog) + gold (rabbit) + orange (cat) + cyan (miles)
  const totalOwlGrains = inventory
    ? (inventory.grains?.green || 0) + (inventory.grains?.gold || 0) + (inventory.grains?.orange || 0) + (inventory.grains?.cyan || 0)
    : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && riddle) {
      if (isShattered) {
        // Dimitrius is shattered - can only say "..."
        setDialogueHistory([
          { role: 'animal', content: riddle.greeting },
        ]);
        setAskedQuestions([]);
      } else if (isGuide) {
        // Nox is the guide - question-based dialogue
        setDialogueHistory([
          { role: 'animal', content: riddle.greeting },
          { role: 'animal', content: "What would you know, time-walker?" },
        ]);
        setAskedQuestions([]);
      } else if (isTutorial) {
        setDialogueHistory([
          { role: 'animal', content: riddle.greeting },
          { role: 'animal', content: "What would you like to know, little turtle?" },
        ]);
        setAskedQuestions([]);
      } else if (isHoots) {
        setDialogueHistory([
          { role: 'animal', content: riddle.greeting },
          { role: 'animal', content: "What wisdom do you seek, brave turtle?" },
        ]);
        setAskedQuestions([]);
      } else if (isMiles) {
        // Miles has both dialogue options AND a riddle
        setDialogueHistory([
          { role: 'animal', content: riddle.greeting },
          { role: 'animal', content: riddle.riddle },
        ]);
        setAskedQuestions([]);
      } else {
        setDialogueHistory([
          { role: 'animal', content: riddle.greeting },
          { role: 'animal', content: riddle.riddle },
        ]);
      }
      setRealmUnlocked(false);
      setShowHint(false);
      setGrainInput('');
      setAttemptFeedback(null);
    }
  }, [isOpen, animal, riddle, isTutorial, isHoots, isGuide, isShattered, isMiles]);

  // Handle tutorial question click
  const handleAskQuestion = useCallback((option, index) => {
    setAskedQuestions(prev => [...prev, index]);
    setDialogueHistory(prev => [
      ...prev,
      { role: 'player', content: option.question },
      { role: 'animal', content: option.answer },
    ]);
  }, []);

  // Handle grain submission (player offers time grains to unlock portals)
  // Now allows ANY color - wrong colors get burned, right colors count toward unlock
  const handleOfferGrain = useCallback((color) => {
    if (realmUnlocked) return;

    const grainCount = getGrainCount(color);
    if (grainCount <= 0) {
      setAttemptFeedback({ success: false, message: "You don't have any of those!" });
      return;
    }

    // Remove 1 grain of offered color
    inventory.removeGrains(color, 1);

    const colorNames = { green: 'Green', gold: 'Gold', orange: 'Orange', purple: 'Purple' };
    const colorName = colorNames[color] || color;

    if (color === correctGrainColor) {
      // Correct color! Add to count
      const newCount = correctGrainsOffered + 1;
      setCorrectGrainsOffered(newCount);

      if (newCount >= grainsNeededCount) {
        // Unlock!
        setDialogueHistory(prev => [...prev,
          { role: 'player', content: `*offers a ${colorName} Grain*` },
          { role: 'animal', content: riddle.unlockMessage, isSuccess: true },
        ]);
        setRealmUnlocked(true);
        setAttemptFeedback({ success: true, message: "Portal Unlocked!" });

        setTimeout(() => {
          // Translate animal name to realm name (miles -> inchworm)
          const realmName = animal === 'miles' ? 'inchworm' : animal;
          if (onUnlockRealm) onUnlockRealm(realmName);
          onClose();
        }, 1200);
      } else {
        // Accepted but need more
        setDialogueHistory(prev => [...prev,
          { role: 'player', content: `*offers a ${colorName} Grain*` },
          { role: 'animal', content: `*accepts the grain* Yes... this is what I seek. Bring me more.` },
        ]);
        setAttemptFeedback({ success: true, message: `Accepted! (${newCount}/${grainsNeededCount})` });
      }
    } else {
      // Wrong color - grain is burned/rejected
      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*offers a ${colorName} Grain*` },
        { role: 'animal', content: `*the grain crumbles to dust* No... this is not what I need. The essence is wrong.` },
      ]);
      setAttemptFeedback({ success: false, message: "Wrong type! Grain burned." });
    }
  }, [realmUnlocked, correctGrainColor, correctGrainsOffered, grainsNeededCount, inventory, riddle, animal, onUnlockRealm, onClose, getGrainCount]);

  // Keep old function for backwards compatibility but redirect
  const handleSubmitGrains = useCallback(() => {
    if (selectedGrainColor) {
      handleOfferGrain(selectedGrainColor);
    }
  }, [selectedGrainColor, handleOfferGrain]);

  // Handle owl special unlock (needs 12 grains: 3 of each color from all 4 realms)
  const handleOwlUnlock = useCallback(() => {
    if (realmUnlocked || !inventory) return;

    const result = checkOwlRequirements(inventory);

    if (result.correct) {
      // Remove 3 grains of each of the 4 colors
      if (result.grainsUsed) {
        for (const [color, count] of Object.entries(result.grainsUsed)) {
          if (count > 0) inventory.removeGrains(color, count);
        }
      }

      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*presents twelve Time Grains - three of each color*` },
        { role: 'animal', content: result.message, isSuccess: true },
      ]);
      setRealmUnlocked(true);

      // Close modal after a brief moment, then trigger portal
      setTimeout(() => {
        // Translate animal name to realm name (miles -> inchworm)
        const realmName = animal === 'miles' ? 'inchworm' : animal;
        if (onUnlockRealm) {
          onUnlockRealm(realmName);
        }
        onClose();
      }, 1200);
    } else {
      setDialogueHistory(prev => [...prev,
        { role: 'animal', content: result.message },
      ]);
    }
  }, [realmUnlocked, inventory, animal, onUnlockRealm, onClose]);

  if (!isOpen || !riddle) return null;

  const IconComponent = AnimalIcons[animal] || AnimalIcons.gnome;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #2a2520 0%, #1a1815 100%)',
          borderRadius: isMobile ? '8px' : '12px',
          width: isMobile ? '95%' : '90%',
          maxWidth: isMobile ? '400px' : '700px',
          maxHeight: isMobile ? '85vh' : '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.2)',
        }}>
        {/* Header - compact */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '10px 14px' : '12px 16px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(212, 175, 55, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconComponent size={isMobile ? 24 : 28} />
            <div>
              <div style={{
                color: '#d4af37',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
              }}>
                {riddle.name}
              </div>
              {!isTutorial && !isHoots && (
                <div style={{ color: '#888', fontSize: '10px' }}>
                  Guardian of the Clock
                </div>
              )}
              {isHoots && (
                <div style={{ color: '#d4af37', fontSize: '10px' }}>
                  Rides the Second Hand
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            x
          </button>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : '400px',
          maxHeight: isMobile ? '60vh' : 'none',
          overflowY: isMobile ? 'auto' : 'visible',
        }}>
          {/* Left side - Dialogue */}
          <div style={{
            flex: isMobile ? 'none' : '1',
            borderRight: isMobile ? 'none' : '1px solid rgba(212, 175, 55, 0.2)',
            borderBottom: isMobile ? '1px solid rgba(212, 175, 55, 0.2)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            minHeight: isMobile ? 'auto' : 'unset',
          }}>
            {/* Dialogue history */}
            <div
              ref={dialogueContainerRef}
              style={{
                flex: isMobile ? 'none' : 1,
                minHeight: isMobile ? '100px' : 'auto',
                maxHeight: isMobile ? '150px' : 'none',
                overflowY: 'auto',
                padding: isMobile ? '12px' : '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '8px' : '12px',
              }}
            >
              {dialogueHistory.map((msg, i) => (
                <div
                  key={i}
                  ref={i === dialogueHistory.length - 1 ? lastMessageRef : null}
                  style={{
                    alignSelf: msg.role === 'player' ? 'flex-end' : 'flex-start',
                    maxWidth: isMobile ? '95%' : '85%',
                    padding: isMobile ? '8px 10px' : '10px 14px',
                    borderRadius: msg.role === 'player' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: msg.role === 'player'
                      ? 'rgba(100, 180, 255, 0.2)'
                      : msg.isSuccess
                        ? 'rgba(100, 255, 100, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                    color: msg.isSuccess ? '#90EE90' : '#ccc',
                    fontSize: isMobile ? '13px' : '14px',
                    lineHeight: 1.4,
                    border: msg.isSuccess ? '1px solid rgba(100, 255, 100, 0.3)' : 'none',
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Hint button */}
            {!isTutorial && !isHoots && !showHint && !realmUnlocked && (
              <button
                onClick={() => setShowHint(true)}
                style={{
                  margin: '8px 16px 16px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#888',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Need a hint?
              </button>
            )}
            {showHint && (
              <div style={{
                margin: '8px 16px 16px',
                padding: '10px',
                background: 'rgba(212, 175, 55, 0.1)',
                borderRadius: '6px',
                color: '#d4af37',
                fontSize: '12px',
                fontStyle: 'italic',
              }}>
                {riddle.hint}
              </div>
            )}
          </div>

          {/* Right side - Tutorial/Nox questions or Grain input */}
          <div style={{
            width: isMobile ? '100%' : '260px',
            padding: isMobile ? '10px' : '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '8px' : '10px',
            overflowY: isMobile ? 'visible' : 'auto',
          }}>
            {/* Check if portal is already unlocked */}
            {(() => {
              const portalRealm = animal === 'hoots' ? 'owl' : animal;
              const isPortalUnlocked = unlockedRealms[portalRealm] === true;

              if (isShattered) {
                // Gimble is shattered - simple sad dialogue
                return (
                  <>
                    <div style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>
                      SPEAK TO GIMBLE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {riddle.dialogueOptions?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAskQuestion(option, index)}
                          disabled={askedQuestions.includes(index)}
                          style={{
                            padding: '10px 12px',
                            background: askedQuestions.includes(index)
                              ? 'rgba(128, 128, 128, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid',
                            borderColor: askedQuestions.includes(index)
                              ? 'rgba(128, 128, 128, 0.4)'
                              : 'rgba(128, 128, 128, 0.3)',
                            borderRadius: '8px',
                            color: askedQuestions.includes(index) ? '#888' : '#aaa',
                            fontSize: '12px',
                            textAlign: 'left',
                            cursor: askedQuestions.includes(index) ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {option.question}
                        </button>
                      ))}
                    </div>
                    <div style={{
                      padding: '12px',
                      background: 'rgba(128, 128, 128, 0.1)',
                      borderRadius: '8px',
                      color: '#888',
                      fontSize: '11px',
                      textAlign: 'center',
                      fontStyle: 'italic',
                    }}>
                      AEIOU seems... broken. Something terrible has happened here...
                    </div>
                  </>
                );
              }

              if (isGuide || isTutorial) {
                // Guide NPCs with dialogue options only (Nox, tutorial)
                return (
                  <>
                    <div style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>
                      {isGuide ? 'ASK Y' : 'ASK GIMBLE'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {riddle.dialogueOptions?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAskQuestion(option, index)}
                          disabled={askedQuestions.includes(index)}
                          style={{
                            padding: '10px 12px',
                            background: askedQuestions.includes(index)
                              ? 'rgba(100, 255, 100, 0.1)'
                              : 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid',
                            borderColor: askedQuestions.includes(index)
                              ? 'rgba(100, 255, 100, 0.3)'
                              : isGuide ? 'rgba(139, 69, 19, 0.5)' : 'rgba(212, 175, 55, 0.3)',
                            borderRadius: '8px',
                            color: askedQuestions.includes(index) ? '#90EE90' : isGuide ? '#cd853f' : '#d4af37',
                            fontSize: '12px',
                            textAlign: 'left',
                            cursor: askedQuestions.includes(index) ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {askedQuestions.includes(index) && <span style={{ marginRight: '4px' }}>&#10003;</span>}
                          {option.question}
                        </button>
                      ))}
                    </div>
                    {askedQuestions.length === riddle.dialogueOptions?.length && (
                      <div style={{
                        padding: '12px',
                        background: isGuide ? 'rgba(139, 69, 19, 0.2)' : 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '8px',
                        color: isGuide ? '#cd853f' : '#d4af37',
                        fontSize: '11px',
                        textAlign: 'center',
                        fontStyle: 'italic',
                      }}>
                        {isGuide
                          ? "Now you know the path, time-walker. Restore AEIOU and open the gates..."
                          : "You've learned all you need! Now go explore the clock!"
                        }
                      </div>
                    )}
                  </>
                );
              }

              if (isHoots || isOwlRealm) {
                // Hoots/Owl realm - needs 12 grains (3 of each of 4 colors from all realms)
                // Also show dialogue options for Hoots
                return (
                  <>
                    {/* Dialogue options for Hoots */}
                    {isHoots && riddle.dialogueOptions && (
                      <>
                        <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>
                          ASK HOOTS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {riddle.dialogueOptions.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleAskQuestion(option, index)}
                              disabled={askedQuestions.includes(index)}
                              style={{
                                padding: '8px 10px',
                                background: askedQuestions.includes(index)
                                  ? 'rgba(100, 255, 100, 0.1)'
                                  : 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid',
                                borderColor: askedQuestions.includes(index)
                                  ? 'rgba(100, 255, 100, 0.3)'
                                  : 'rgba(212, 175, 55, 0.3)',
                                borderRadius: '6px',
                                color: askedQuestions.includes(index) ? '#90EE90' : '#d4af37',
                                fontSize: '11px',
                                textAlign: 'left',
                                cursor: askedQuestions.includes(index) ? 'default' : 'pointer',
                              }}
                            >
                              {askedQuestions.includes(index) && <span style={{ marginRight: '4px' }}>&#10003;</span>}
                              {option.question}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Check if owl portal already unlocked */}
                    {isPortalUnlocked ? (
                      <div style={{
                        padding: '10px',
                        background: 'rgba(100, 255, 100, 0.15)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '1px solid rgba(100, 255, 100, 0.3)',
                      }}>
                        <span style={{ color: '#90EE90', fontWeight: 600, fontSize: '12px' }}>Night Sky portal at 12 o'clock!</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginTop: '8px' }}>
                          OFFER GRAINS
                        </div>

                        <div style={{
                          padding: '12px',
                          background: 'rgba(139, 69, 19, 0.2)',
                          borderRadius: '10px',
                          border: '1px solid rgba(139, 69, 19, 0.4)',
                        }}>
                          {/* Required grains display - 4 colors now */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                              { color: 'green', animal: 'Frog', hex: '#00FF00', needed: 3 },
                              { color: 'gold', animal: 'Rabbit', hex: '#FFD700', needed: 3 },
                              { color: 'orange', animal: 'Cat', hex: '#FFA500', needed: 3 },
                              { color: 'cyan', animal: 'Miles', hex: '#00CED1', needed: 3 },
                            ].map(({ color, animal: animalName, hex, needed }) => {
                              const count = inventory?.grains?.[color] || 0;
                              const hasEnough = count >= needed;
                              return (
                                <div
                                  key={color}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px',
                                    background: hasEnough ? 'rgba(100, 255, 100, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '4px',
                                    border: hasEnough ? '1px solid rgba(100, 255, 100, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                  }}
                                >
                                  <div style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    background: hex,
                                    boxShadow: `0 0 4px ${hex}`,
                                  }} />
                                  <div style={{ flex: 1, color: hasEnough ? '#90EE90' : '#888', fontSize: '10px' }}>
                                    {animalName}
                                  </div>
                                  <div style={{ color: hasEnough ? '#90EE90' : count > 0 ? '#ffd700' : '#666', fontSize: '11px', fontWeight: 600 }}>
                                    {Math.min(count, needed)}/{needed}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Total counter - sum of capped values (max 3 each, 4 colors = 12 total) */}
                          {(() => {
                            const cappedGreen = Math.min(inventory?.grains?.green || 0, 3);
                            const cappedGold = Math.min(inventory?.grains?.gold || 0, 3);
                            const cappedOrange = Math.min(inventory?.grains?.orange || 0, 3);
                            const cappedCyan = Math.min(inventory?.grains?.cyan || 0, 3);
                            const cappedTotal = cappedGreen + cappedGold + cappedOrange + cappedCyan;
                            return (
                              <div style={{
                                marginTop: '8px',
                                padding: '6px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '4px',
                                textAlign: 'center',
                              }}>
                                <span style={{ color: '#888', fontSize: '10px' }}>Total: </span>
                                <span style={{ color: cappedTotal >= 12 ? '#90EE90' : '#ffd700', fontSize: '13px', fontWeight: 600 }}>
                                  {cappedTotal}/12
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Offer grains button */}
                        {!realmUnlocked && (
                          <button
                            onClick={handleOwlUnlock}
                            disabled={!inventory || totalOwlGrains < 12 || !['green', 'gold', 'orange', 'cyan'].every(c => (inventory?.grains?.[c] || 0) >= 3)}
                            style={{
                              padding: '12px',
                              background: inventory && totalOwlGrains >= 12 && ['green', 'gold', 'orange', 'cyan'].every(c => (inventory?.grains?.[c] || 0) >= 3)
                                ? 'linear-gradient(135deg, #4B0082 0%, #2E0854 100%)'
                                : 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              color: inventory && totalOwlGrains >= 12 && ['green', 'gold', 'orange', 'cyan'].every(c => (inventory?.grains?.[c] || 0) >= 3) ? '#fff' : '#666',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: inventory && totalOwlGrains >= 12 && ['green', 'gold', 'orange', 'cyan'].every(c => (inventory?.grains?.[c] || 0) >= 3) ? 'pointer' : 'not-allowed',
                              opacity: inventory && totalOwlGrains >= 12 && ['green', 'gold', 'orange', 'cyan'].every(c => (inventory?.grains?.[c] || 0) >= 3) ? 1 : 0.6,
                            }}
                          >
                            Offer 12 Grains
                          </button>
                        )}

                        {/* Portal unlocked - compact */}
                        {realmUnlocked && (
                          <div style={{
                            padding: '10px',
                            background: 'rgba(139, 69, 19, 0.2)',
                            borderRadius: '6px',
                            textAlign: 'center',
                            border: '1px solid rgba(139, 69, 19, 0.4)',
                          }}>
                            <span style={{ color: '#FFD700', fontWeight: 600, fontSize: '12px' }}>Portal Opened!</span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              }

              // Regular animal - offer grains (any color, wrong ones burn)
              const grainColors = [
                { id: 'green', name: 'Green', color: '#00FF00' },
                { id: 'gold', name: 'Gold', color: '#FFD700' },
                { id: 'orange', name: 'Orange', color: '#FFA500' },
                { id: 'purple', name: 'Purple', color: '#9370DB' },
                { id: 'cyan', name: 'Cyan', color: '#00CED1' },
              ];

              return (
                <>
                  {/* Check if portal already unlocked */}
                  {isPortalUnlocked ? (
                    <div style={{
                      padding: '10px',
                      background: 'rgba(100, 255, 100, 0.15)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      border: '1px solid rgba(100, 255, 100, 0.3)',
                    }}>
                      <span style={{ color: '#90EE90', fontWeight: 600, fontSize: '12px' }}>Portal Open - find it nearby!</span>
                    </div>
                  ) : (
                    <>
                      {/* Progress tracker - doesn't reveal which color */}
                      <div style={{
                        padding: '10px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        textAlign: 'center',
                      }}>
                        <div style={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}>Accepted Offerings</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#d4af37' }}>
                          {correctGrainsOffered} / ?
                        </div>
                        <div style={{ color: '#666', fontSize: '9px', fontStyle: 'italic', marginTop: '4px' }}>
                          Offer grains to discover what I seek...
                        </div>
                      </div>

                      {/* Grain offering buttons - all colors */}
                      {!realmUnlocked && (
                        <>
                          <div style={{ color: '#888', fontSize: '10px', fontWeight: 600, letterSpacing: '1px' }}>
                            OFFER A GRAIN
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {grainColors.map(grain => {
                              const count = getGrainCount(grain.id);
                              const hasGrain = count > 0;
                              return (
                                <button
                                  key={grain.id}
                                  onClick={() => handleOfferGrain(grain.id)}
                                  disabled={!hasGrain}
                                  style={{
                                    padding: '10px 8px',
                                    background: hasGrain ? `${grain.color}20` : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${hasGrain ? grain.color : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '8px',
                                    cursor: hasGrain ? 'pointer' : 'not-allowed',
                                    opacity: hasGrain ? 1 : 0.4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <svg width={20} height={20} viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="8" fill={grain.color} />
                                  </svg>
                                  <span style={{ color: grain.color, fontSize: '11px', fontWeight: 600 }}>
                                    {grain.name}
                                  </span>
                                  <span style={{ color: '#888', fontSize: '9px' }}>
                                    x{count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {attemptFeedback && (
                        <div style={{
                          padding: '8px',
                          borderRadius: '6px',
                          background: attemptFeedback.success ? 'rgba(100, 255, 100, 0.15)' : 'rgba(255, 100, 100, 0.15)',
                          color: attemptFeedback.success ? '#90EE90' : '#ff6b6b',
                          fontSize: '11px',
                          textAlign: 'center',
                          border: attemptFeedback.success ? '1px solid rgba(100, 255, 100, 0.3)' : '1px solid rgba(255, 100, 100, 0.3)',
                        }}>
                          {attemptFeedback.message}
                        </div>
                      )}

                      {/* Portal unlocked indicator */}
                      {realmUnlocked && (
                        <div style={{
                          padding: '10px',
                          background: 'rgba(100, 255, 100, 0.15)',
                          borderRadius: '6px',
                          textAlign: 'center',
                          border: '1px solid rgba(100, 255, 100, 0.3)',
                        }}>
                          <span style={{ color: '#90EE90', fontWeight: 600, fontSize: '13px' }}>Portal Opened!</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Footer - compact */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '10px 16px',
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}>
          <button
            onClick={onClose}
            disabled={realmUnlocked}
            style={{
              padding: '8px 18px',
              background: realmUnlocked ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: realmUnlocked ? '1px solid rgba(100, 255, 100, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: realmUnlocked ? '#90EE90' : '#ccc',
              fontSize: '12px',
              fontWeight: 500,
              cursor: realmUnlocked ? 'default' : 'pointer',
            }}
          >
            {realmUnlocked ? 'Opening...' : isTutorial ? 'Bye AEIOU!' : isHoots ? 'Bye Hoots!' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
