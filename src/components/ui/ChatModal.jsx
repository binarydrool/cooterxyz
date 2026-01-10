"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { RIDDLES, checkGrainCount, checkOwlRequirements } from '@/utils/riddles';
import { ESSENCE_TYPES } from '@/hooks/useInventory';

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

// Hourglass icon for grain counter
const HourglassIcon = ({ size = 48 }) => (
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
  const grainsNeeded = riddle?.grainsNeeded || 0;

  // Total GRAINS - for unlocking portals (cat=3, frog=6, rabbit=9)
  const totalGrains = inventory?.grains || 0;

  // Total ESSENCES - for unlocking owl realm (9 total from realms)
  const totalEssences = inventory ? Object.values(inventory.essences).reduce((sum, count) => sum + count, 0) : 0;

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
  }, [isOpen, animal, riddle, isTutorial, isHoots, isGuide, isShattered]);

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
  const handleSubmitGrains = useCallback(() => {
    if (realmUnlocked || !grainInput) return;

    const amount = parseInt(grainInput, 10);
    if (isNaN(amount) || amount <= 0) {
      setAttemptFeedback({ success: false, message: "Enter a valid number." });
      return;
    }

    if (amount > totalGrains) {
      setAttemptFeedback({ success: false, message: "You don't have that many grains!" });
      return;
    }

    // Check if the amount matches what the animal needs
    if (amount === grainsNeeded) {
      // Correct! Remove grains from inventory
      inventory.removeGrains(amount);

      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*offers ${amount} Time Grains*` },
        { role: 'animal', content: riddle.unlockMessage, isSuccess: true },
      ]);
      setRealmUnlocked(true);
      setAttemptFeedback({ success: true, message: "Correct!" });

      // Close modal after a brief moment, then trigger portal
      setTimeout(() => {
        if (onUnlockRealm) {
          onUnlockRealm(animal);
        }
        onClose();
      }, 1200);
    } else {
      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*offers ${amount} Time Grains*` },
        { role: 'animal', content: riddle.wrongMessage },
      ]);
      setAttemptFeedback({ success: false, message: "That's not the right amount..." });
    }
    setGrainInput('');
  }, [realmUnlocked, grainInput, totalGrains, grainsNeeded, inventory, riddle, animal, onUnlockRealm, onClose]);

  // Handle owl special unlock (needs 9 essences: 3 from each realm)
  const handleOwlUnlock = useCallback(() => {
    if (realmUnlocked || !inventory) return;

    const result = checkOwlRequirements(inventory);

    if (result.correct) {
      // Remove 3 of each essence type
      if (result.essenceAmounts) {
        Object.entries(result.essenceAmounts).forEach(([type, amount]) => {
          inventory.removeEssence(type, amount);
        });
      }

      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*presents nine essences from three realms*` },
        { role: 'animal', content: result.message, isSuccess: true },
      ]);
      setRealmUnlocked(true);

      // Close modal after a brief moment, then trigger portal
      setTimeout(() => {
        if (onUnlockRealm) {
          onUnlockRealm(animal);
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
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(212, 175, 55, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconComponent size={32} />
            <div>
              <div style={{
                color: '#d4af37',
                fontSize: '18px',
                fontWeight: 600,
              }}>
                {riddle.name}
              </div>
              {!isTutorial && !isHoots && (
                <div style={{ color: '#888', fontSize: '12px' }}>
                  Guardian of the Clock
                </div>
              )}
              {isHoots && (
                <div style={{ color: '#d4af37', fontSize: '12px' }}>
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
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '18px',
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
            width: isMobile ? '100%' : '280px',
            padding: isMobile ? '12px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '10px' : '12px',
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
                // Hoots/Owl realm - needs 9 essences (3 from each of 3 realms)
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
                        padding: '16px',
                        background: 'linear-gradient(135deg, rgba(100, 255, 100, 0.2) 0%, rgba(0, 255, 100, 0.1) 100%)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid rgba(100, 255, 100, 0.3)',
                      }}>
                        <div style={{ color: '#90EE90', fontWeight: 600 }}>Portal Already Open!</div>
                        <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                          The Night Sky portal is at 12 o'clock
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', marginTop: '8px' }}>
                          OFFER ESSENCES
                        </div>

                        <div style={{
                          padding: '12px',
                          background: 'rgba(139, 69, 19, 0.2)',
                          borderRadius: '10px',
                          border: '1px solid rgba(139, 69, 19, 0.4)',
                        }}>
                          {/* Required essences display */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {[
                              { type: 'golden', realm: 'Warren', animal: 'Rabbit', needed: 3 },
                              { type: 'forest', realm: 'Marsh', animal: 'Frog', needed: 3 },
                              { type: 'amber', realm: 'Rooftops', animal: 'Cat', needed: 3 },
                            ].map(({ type, realm, animal: animalName, needed }) => {
                              const count = inventory?.essences[type] || 0;
                              const hasEnough = count >= needed;
                              return (
                                <div
                                  key={type}
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
                                  <EssenceIcon type={type} size={16} />
                                  <div style={{ flex: 1, color: hasEnough ? '#90EE90' : '#888', fontSize: '10px' }}>
                                    {animalName}
                                  </div>
                                  <div style={{ color: hasEnough ? '#90EE90' : count > 0 ? '#ffd700' : '#666', fontSize: '11px', fontWeight: 600 }}>
                                    {count}/{needed}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Total counter */}
                          <div style={{
                            marginTop: '8px',
                            padding: '6px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '4px',
                            textAlign: 'center',
                          }}>
                            <span style={{ color: '#888', fontSize: '10px' }}>Total: </span>
                            <span style={{ color: totalEssences >= 9 ? '#90EE90' : '#ffd700', fontSize: '13px', fontWeight: 600 }}>
                              {totalEssences}/9
                            </span>
                          </div>
                        </div>

                        {/* Offer essences button */}
                        {!realmUnlocked && (
                          <button
                            onClick={handleOwlUnlock}
                            disabled={!inventory || totalEssences < 9 || !['golden', 'forest', 'amber'].every(t => (inventory?.essences[t] || 0) >= 3)}
                            style={{
                              padding: '12px',
                              background: inventory && totalEssences >= 9 && ['golden', 'forest', 'amber'].every(t => (inventory?.essences[t] || 0) >= 3)
                                ? 'linear-gradient(135deg, #8B4513 0%, #654321 100%)'
                                : 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              borderRadius: '8px',
                              color: inventory && totalEssences >= 9 && ['golden', 'forest', 'amber'].every(t => (inventory?.essences[t] || 0) >= 3) ? '#fff' : '#666',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: inventory && totalEssences >= 9 && ['golden', 'forest', 'amber'].every(t => (inventory?.essences[t] || 0) >= 3) ? 'pointer' : 'not-allowed',
                              opacity: inventory && totalEssences >= 9 && ['golden', 'forest', 'amber'].every(t => (inventory?.essences[t] || 0) >= 3) ? 1 : 0.6,
                            }}
                          >
                            Offer 9 Essences
                          </button>
                        )}

                        {/* Portal unlocked */}
                        {realmUnlocked && (
                          <div style={{
                            padding: '12px',
                            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.3) 0%, rgba(75, 0, 130, 0.2) 100%)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '1px solid rgba(139, 69, 19, 0.4)',
                          }}>
                            <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: '4px' }}>Portal Opened!</div>
                            <div style={{ color: '#888', fontSize: '10px' }}>
                              The Night Sky awaits at 12 o'clock...
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              }

              // Regular animal - grain input (cat=3, frog=6, rabbit=9)
              return (
                <>
                  {/* Check if portal already unlocked */}
                  {isPortalUnlocked ? (
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(100, 255, 100, 0.2) 0%, rgba(0, 255, 100, 0.1) 100%)',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid rgba(100, 255, 100, 0.3)',
                    }}>
                      <div style={{ color: '#90EE90', fontWeight: 600 }}>Portal Already Open!</div>
                      <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                        Look for {riddle.name}'s portal nearby
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>
                        YOUR TIME GRAINS
                      </div>

                      {/* Grain counter display */}
                      <div style={{
                        padding: '16px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}>
                        <HourglassIcon size={40} />
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 700,
                          color: '#d4af37',
                          marginTop: '8px',
                        }}>
                          {totalGrains}
                        </div>
                        <div style={{ color: '#888', fontSize: '11px' }}>
                          Time Grains
                        </div>
                        <div style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>
                          (Collected from clock by stopping time)
                        </div>
                      </div>

                      {/* Hint - clock position */}
                      <div style={{
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        textAlign: 'center',
                      }}>
                        <div style={{ color: '#888', fontSize: '11px', fontStyle: 'italic' }}>
                          "Where I stand on the clock holds the answer..."
                        </div>
                      </div>

                      {/* Grain input - player offers time grains */}
                      {!realmUnlocked && (
                        <div style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                        }}>
                          <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px', textAlign: 'center' }}>
                            How many grains will you offer?
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="number"
                              min="1"
                              max={totalGrains}
                              value={grainInput}
                              onChange={(e) => setGrainInput(e.target.value)}
                              placeholder="?"
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                borderRadius: '6px',
                                color: '#d4af37',
                                fontSize: '18px',
                                fontWeight: 600,
                                textAlign: 'center',
                                outline: 'none',
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmitGrains();
                              }}
                            />
                            <button
                              onClick={handleSubmitGrains}
                              disabled={!grainInput || parseInt(grainInput) > totalGrains}
                              style={{
                                padding: '10px 16px',
                                background: grainInput && parseInt(grainInput) <= totalGrains
                                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                                  : 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '6px',
                                color: grainInput && parseInt(grainInput) <= totalGrains ? '#000' : '#666',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: grainInput && parseInt(grainInput) <= totalGrains ? 'pointer' : 'not-allowed',
                              }}
                            >
                              Offer
                            </button>
                          </div>
                          {attemptFeedback && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px',
                              borderRadius: '4px',
                              background: attemptFeedback.success ? 'rgba(100, 255, 100, 0.1)' : 'rgba(255, 100, 100, 0.1)',
                              color: attemptFeedback.success ? '#90EE90' : '#ff6b6b',
                              fontSize: '11px',
                              textAlign: 'center',
                            }}>
                              {attemptFeedback.message}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Portal unlocked indicator */}
                      {realmUnlocked && (
                        <div style={{
                          padding: '16px',
                          background: 'linear-gradient(135deg, rgba(100, 255, 100, 0.2) 0%, rgba(0, 255, 100, 0.1) 100%)',
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: '1px solid rgba(100, 255, 100, 0.3)',
                        }}>
                          <div style={{ color: '#90EE90', fontWeight: 600 }}>Portal Opened!</div>
                          <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                            Look for the portal near {riddle.name}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '12px 20px',
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(0, 0, 0, 0.2)',
          gap: '12px',
        }}>
          {/* Close button - disabled when realm just unlocked (auto-closing) */}
          <button
            onClick={onClose}
            disabled={realmUnlocked}
            style={{
              padding: '10px 24px',
              background: realmUnlocked ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: realmUnlocked ? '1px solid rgba(100, 255, 100, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: realmUnlocked ? '#90EE90' : '#ccc',
              fontSize: '13px',
              fontWeight: 500,
              cursor: realmUnlocked ? 'default' : 'pointer',
            }}
          >
            {realmUnlocked ? 'Portal Opening...' : isTutorial ? 'Goodbye, AEIOU!' : isHoots ? 'Farewell, Hoots!' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
