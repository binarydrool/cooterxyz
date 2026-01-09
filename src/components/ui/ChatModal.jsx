"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { RIDDLES, checkGrainCount, checkOwlRequirements } from '@/utils/riddles';
import { ESSENCE_TYPES } from '@/hooks/useInventory';

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
}) {
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [realmUnlocked, setRealmUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [grainInput, setGrainInput] = useState('');
  const [attemptFeedback, setAttemptFeedback] = useState(null);

  const dialogueContainerRef = useRef(null);
  const lastMessageRef = useRef(null);

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

  // Calculate total essences from inventory
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

  // Handle grain submission (player guesses the amount)
  const handleSubmitGrains = useCallback(() => {
    if (realmUnlocked || !grainInput) return;

    const amount = parseInt(grainInput, 10);
    if (isNaN(amount) || amount <= 0) {
      setAttemptFeedback({ success: false, message: "Enter a valid number." });
      return;
    }

    if (amount > totalEssences) {
      setAttemptFeedback({ success: false, message: "You don't have that many essences!" });
      return;
    }

    // Check if the amount matches what the animal needs
    if (amount === grainsNeeded) {
      // Correct! Remove essences from inventory
      let remaining = amount;
      const essenceTypes = ['forest', 'golden', 'amber', 'violet'];
      for (const type of essenceTypes) {
        const available = inventory.essences[type];
        const toRemove = Math.min(available, remaining);
        if (toRemove > 0) {
          inventory.removeEssence(type, toRemove);
          remaining -= toRemove;
        }
        if (remaining <= 0) break;
      }

      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*offers ${amount} Time Essences*` },
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
        { role: 'player', content: `*offers ${amount} Time Essences*` },
        { role: 'animal', content: riddle.wrongMessage },
      ]);
      setAttemptFeedback({ success: false, message: "That's not the right amount..." });
    }
    setGrainInput('');
  }, [realmUnlocked, grainInput, totalEssences, grainsNeeded, inventory, riddle, animal, onUnlockRealm, onClose]);

  // Handle owl special unlock (needs specific essences)
  const handleOwlUnlock = useCallback(() => {
    if (realmUnlocked || !inventory) return;

    const result = checkOwlRequirements(inventory);

    if (result.correct) {
      // Remove one of each required essence
      result.essencesUsed.forEach(type => {
        inventory.removeEssence(type, 1);
      });

      setDialogueHistory(prev => [...prev,
        { role: 'player', content: `*presents the three victory essences*` },
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
    <div style={{
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
      <div style={{
        background: 'linear-gradient(180deg, #2a2520 0%, #1a1815 100%)',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
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
                  {riddle.clockPosition} o'clock position
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
          height: '400px',
        }}>
          {/* Left side - Dialogue */}
          <div style={{
            flex: '1',
            borderRight: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Dialogue history */}
            <div
              ref={dialogueContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {dialogueHistory.map((msg, i) => (
                <div
                  key={i}
                  ref={i === dialogueHistory.length - 1 ? lastMessageRef : null}
                  style={{
                    alignSelf: msg.role === 'player' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'player' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: msg.role === 'player'
                      ? 'rgba(100, 180, 255, 0.2)'
                      : msg.isSuccess
                        ? 'rgba(100, 255, 100, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                    color: msg.isSuccess ? '#90EE90' : '#ccc',
                    fontSize: '14px',
                    lineHeight: 1.5,
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
            width: '240px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}>
            {isShattered ? (
              // Gimble is shattered - simple sad dialogue
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
            ) : (isGuide || isTutorial || isHoots) ? (
              // Guide NPCs with dialogue options (Nox, Hoots)
              <>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>
                  {isGuide ? 'ASK Y' : isHoots ? 'ASK HOOTS' : 'ASK GIMBLE'}
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
                      : isHoots
                        ? "Hoo-hoo... Now you know how to unlock The Night Sky!"
                        : "You've learned all you need! Now go explore the clock!"
                    }
                  </div>
                )}
              </>
            ) : isOwlRealm ? (
              // Owl realm special UI - needs victory essences from other realms
              <>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>
                  VICTORY ESSENCES
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(139, 69, 19, 0.2)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 69, 19, 0.4)',
                }}>
                  <div style={{ color: '#ccc', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                    Hoots requires one victory essence from each realm:
                  </div>

                  {/* Required essences display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { type: 'golden', realm: 'The Warren', animal: 'Rabbit' },
                      { type: 'forest', realm: 'The Lily Marsh', animal: 'Frog' },
                      { type: 'amber', realm: 'The Rooftops', animal: 'Cat' },
                    ].map(({ type, realm, animal: animalName }) => {
                      const hasIt = inventory?.essences[type] >= 1;
                      return (
                        <div
                          key={type}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            background: hasIt ? 'rgba(100, 255, 100, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            border: hasIt ? '1px solid rgba(100, 255, 100, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          <EssenceIcon type={type} size={20} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: hasIt ? '#90EE90' : '#888', fontSize: '11px' }}>
                              {animalName}
                            </div>
                            <div style={{ color: '#666', fontSize: '10px' }}>
                              {realm}
                            </div>
                          </div>
                          <div style={{ color: hasIt ? '#90EE90' : '#666', fontSize: '12px' }}>
                            {hasIt ? '1' : '0'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Offer essences button */}
                {!realmUnlocked && (
                  <button
                    onClick={handleOwlUnlock}
                    disabled={!inventory || !['golden', 'forest', 'amber'].every(t => inventory.essences[t] >= 1)}
                    style={{
                      padding: '14px',
                      background: inventory && ['golden', 'forest', 'amber'].every(t => inventory.essences[t] >= 1)
                        ? 'linear-gradient(135deg, #8B4513 0%, #654321 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: inventory && ['golden', 'forest', 'amber'].every(t => inventory.essences[t] >= 1) ? '#fff' : '#666',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: inventory && ['golden', 'forest', 'amber'].every(t => inventory.essences[t] >= 1) ? 'pointer' : 'not-allowed',
                      opacity: inventory && ['golden', 'forest', 'amber'].every(t => inventory.essences[t] >= 1) ? 1 : 0.6,
                    }}
                  >
                    Offer Victory Essences
                  </button>
                )}

                {/* Portal unlocked */}
                {realmUnlocked && (
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.3) 0%, rgba(75, 0, 130, 0.2) 100%)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid rgba(139, 69, 19, 0.4)',
                  }}>
                    <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: '4px' }}>Portal Opened!</div>
                    <div style={{ color: '#888', fontSize: '11px' }}>
                      The Night Sky awaits...
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Regular animal - grain input
              <>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '1px' }}>
                  YOUR ESSENCES
                </div>

                {/* Essence counter display */}
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
                    {totalEssences}
                  </div>
                  <div style={{ color: '#888', fontSize: '11px' }}>
                    Total Essences
                  </div>

                  {/* Breakdown */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
                    {Object.values(ESSENCE_TYPES).map(essence => (
                      <div key={essence.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EssenceIcon type={essence.id} size={14} />
                        <span style={{ color: '#888', fontSize: '11px' }}>{inventory?.essences[essence.id] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grain input - player guesses the number */}
                {!realmUnlocked && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                  }}>
                    <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px', textAlign: 'center' }}>
                      How many essences will you offer?
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        max={totalEssences}
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
                        disabled={!grainInput || parseInt(grainInput) > totalEssences}
                        style={{
                          padding: '10px 16px',
                          background: grainInput && parseInt(grainInput) <= totalEssences
                            ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          color: grainInput && parseInt(grainInput) <= totalEssences ? '#000' : '#666',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: grainInput && parseInt(grainInput) <= totalEssences ? 'pointer' : 'not-allowed',
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
