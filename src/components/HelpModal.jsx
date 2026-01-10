"use client";

import { useEffect, useRef, useCallback } from "react";

// Styled keyboard key component
function KeyIcon({ children, size = "normal" }) {
  const width = size === "small" ? "28px" : size === "large" ? "60px" : "36px";
  const height = size === "small" ? "28px" : "36px";
  const fontSize = size === "small" ? "12px" : size === "large" ? "11px" : "14px";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width,
      height,
      minWidth: width,
      background: "linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)",
      border: "1px solid #555",
      borderRadius: "6px",
      color: "#fff",
      fontSize,
      fontWeight: 600,
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxShadow: "0 2px 0 #1a1a1a, 0 3px 6px rgba(0,0,0,0.3)",
      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      margin: "2px",
    }}>
      {children}
    </span>
  );
}

// Section header with gold underline
function SectionHeader({ children, color = "#d4af37" }) {
  return (
    <h3 style={{
      color: "#fff",
      fontSize: "16px",
      fontWeight: 600,
      marginTop: "20px",
      marginBottom: "10px",
      paddingBottom: "6px",
      borderBottom: `2px solid ${color}`,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      {children}
    </h3>
  );
}

// Sub section header
function SubHeader({ children }) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.9)",
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: "8px",
      marginTop: "12px",
    }}>
      {children}
    </p>
  );
}

// Control row showing key + description
function ControlRow({ keys, description }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "6px",
      gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", minWidth: "160px", flexShrink: 0 }}>
        {keys}
      </div>
      <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
        {description}
      </span>
    </div>
  );
}

// Character info row
function CharacterRow({ name, position, color, description }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      marginBottom: "10px",
      gap: "10px",
      padding: "8px",
      background: "rgba(255,255,255,0.03)",
      borderRadius: "6px",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ minWidth: "80px" }}>
        <div style={{ color, fontWeight: 600, fontSize: "13px" }}>{name}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{position}</div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", lineHeight: 1.5 }}>
        {description}
      </div>
    </div>
  );
}

// Realm info row
function RealmRow({ name, guardian, unlockCost, essence, color, description }) {
  return (
    <div style={{
      marginBottom: "12px",
      padding: "10px",
      background: "rgba(255,255,255,0.03)",
      borderRadius: "6px",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ color, fontWeight: 600, fontSize: "14px" }}>{name}</span>
        <span style={{ color: "#d4af37", fontSize: "11px" }}>{unlockCost}</span>
      </div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginBottom: "4px" }}>
        Guardian: {guardian} | Essence: {essence}
      </div>
      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
        {description}
      </div>
    </div>
  );
}

// Info box with colored border
function InfoBox({ children, color = "#d4af37", icon }) {
  return (
    <div style={{
      padding: "12px",
      background: `${color}15`,
      borderRadius: "8px",
      border: `1px solid ${color}40`,
      marginBottom: "12px",
    }}>
      <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", lineHeight: 1.6 }}>
        {icon && <span style={{ marginRight: "8px" }}>{icon}</span>}
        {children}
      </div>
    </div>
  );
}

export default function HelpModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 10001,
        pointerEvents: "auto",
        animation: "fadeIn 200ms ease-out",
      }}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        onClick={handleContentClick}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "95%",
          maxWidth: "700px",
          maxHeight: "85vh",
          background: "linear-gradient(180deg, rgba(25, 25, 35, 0.98) 0%, rgba(15, 15, 25, 0.98) 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(212, 175, 55, 0.1)",
          overflow: "hidden",
          animation: "scaleIn 300ms ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close help modal"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            transition: "all 150ms ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
        >
          &times;
        </button>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          minHeight: 0,
          padding: "24px",
          overflowY: "auto",
          scrollBehavior: "smooth",
        }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2
              id="help-modal-title"
              style={{
                color: "#d4af37",
                fontSize: "26px",
                fontWeight: 700,
                marginBottom: "6px",
                textShadow: "0 2px 10px rgba(212, 175, 55, 0.3)",
              }}
            >
              Cooter - Game Guide
            </h2>
            <p style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "13px",
              fontStyle: "italic",
            }}>
              A turtle on a clock floating above the ocean
            </p>
          </div>

          {/* ============== THE STORY ============== */}
          <SectionHeader color="#9370DB">The Story</SectionHeader>
          <InfoBox color="#9370DB">
            <strong>AEIOU</strong>, the gnome jester who lives on the clock, has had his mind <strong>shattered</strong> across four dimensions.
            His partner <strong>Y</strong> needs your help to collect the <strong>4 Mind Shards</strong> from each realm and restore AEIOU's consciousness.
            Only then can AEIOU open the mysterious <strong>Noon Portal</strong>...
          </InfoBox>

          {/* ============== MAIN OBJECTIVE ============== */}
          <SectionHeader color="#4ade80">Main Objective</SectionHeader>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", lineHeight: 1.7 }}>
            <ol style={{ paddingLeft: "20px", margin: 0 }}>
              <li style={{ marginBottom: "6px" }}><strong>Collect Time Grains</strong> - Y stops time at :59 each minute, spawning a grain</li>
              <li style={{ marginBottom: "6px" }}><strong>Unlock Portals</strong> - offer the right amount of Time Grains to each animal guardian</li>
              <li style={{ marginBottom: "6px" }}><strong>Explore Realms</strong> - find all hidden Essences and collect the Mind Shard</li>
              <li style={{ marginBottom: "6px" }}><strong>Unlock The Night Sky</strong> - offer Essences from all three realms to Hoots</li>
              <li style={{ marginBottom: "6px" }}><strong>Collect all 4 Mind Shards</strong> - one from each realm</li>
              <li><strong>Return to Y</strong> - cast the Fusion Spell and restore AEIOU's mind</li>
            </ol>
          </div>

          {/* ============== HUD EXPLANATION ============== */}
          <SectionHeader color="#d4af37">Understanding the HUD</SectionHeader>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", lineHeight: 1.7 }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", marginBottom: "8px" }}>
              <span style={{ color: "#D4AF37" }}>Hourglass + Number</span>
              <span>Time Grains collected (for unlocking portals)</span>

              <span style={{ color: "#FFA500" }}>Orange Diamond</span>
              <span>Amber Essences found in Cat realm</span>

              <span style={{ color: "#00FF00" }}>Green Triangle</span>
              <span>Forest Essences found in Frog realm</span>

              <span style={{ color: "#FFD700" }}>Gold Diamond</span>
              <span>Golden Essences found in Rabbit realm</span>

              <span style={{ color: "#9370DB" }}>Purple Gem</span>
              <span>Total Essences (for Hoots / Owl realm)</span>
            </div>
          </div>

          {/* ============== TIME GRAINS ============== */}
          <SectionHeader color="#D4AF37">Time Grains</SectionHeader>
          <InfoBox color="#D4AF37">
            Time Grains are golden crystals that appear when <strong>Y stops time</strong>.
            Y jumps to block the second hand at <strong>:59 seconds</strong> every minute, creating a 3-second time freeze.
            During this moment, a Time Grain spawns on the clock. Walk near it and press <KeyIcon size="small">E</KeyIcon> to collect.
          </InfoBox>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
            <strong>Unlocking Portals:</strong>
            <p style={{ margin: "6px 0", lineHeight: 1.6 }}>
              Each animal guardian requires a certain number of Time Grains to open their portal.
              <em style={{ color: "rgba(255,255,255,0.6)", display: "block", marginTop: "4px" }}>
                Hint: Notice where each animal stands on the clock...
              </em>
            </p>
          </div>

          {/* ============== ESSENCES ============== */}
          <SectionHeader color="#9370DB">Essences</SectionHeader>
          <InfoBox color="#9370DB">
            Essences are hidden <strong>inside each realm</strong>. You must explore and <strong>find all of them</strong> to complete a realm.
            To unlock Hoots' portal to The Night Sky, you need to collect essences from all three realms.
          </InfoBox>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
            <strong>Essence Types (found in realms):</strong>
            <ul style={{ paddingLeft: "20px", margin: "6px 0" }}>
              <li><span style={{ color: "#FFA500" }}>Amber Essences</span> - hidden in The Void (Cat realm)</li>
              <li><span style={{ color: "#00FF00" }}>Forest Essences</span> - hidden in The Lily Marsh (Frog realm)</li>
              <li><span style={{ color: "#FFD700" }}>Golden Essences</span> - hidden in The Hay Maze (Rabbit realm)</li>
            </ul>
          </div>

          {/* ============== CHARACTERS ============== */}
          <SectionHeader color="#cd853f">Characters on the Clock</SectionHeader>

          <CharacterRow
            name="Y"
            position="12 o'clock"
            color="#8B4513"
            description="Your guide and AEIOU's partner. Y stops time at :59 each minute. Talk to Y to learn about the quest. When you have all 4 Mind Shards, Y casts the Fusion Spell."
          />

          <CharacterRow
            name="AEIOU"
            position="12 o'clock"
            color="#888"
            description="The shattered gnome jester. Can only say '...' until his mind is restored. The floating amber pyramid near him shows which Mind Shards you've collected."
          />

          <CharacterRow
            name="Hoots"
            position="Second hand"
            color="#8B4513"
            description="A small owl riding the tail of the second hand. Speaks in cryptic riddles. Offer Essences from all three realms to unlock The Night Sky."
          />

          <CharacterRow
            name="Kittle"
            position="3 o'clock"
            color="#FFA500"
            description="Orange cat guarding The Void portal. Offer Time Grains to unlock. Realm contains Amber Essences and a Mind Shard."
          />

          <CharacterRow
            name="Pepe"
            position="6 o'clock"
            color="#4ade80"
            description="Green frog guarding The Lily Marsh portal. Offer Time Grains to unlock. Realm contains Forest Essences and a Mind Shard."
          />

          <CharacterRow
            name="Bunzy"
            position="9 o'clock"
            color="#DEB887"
            description="Cream rabbit guarding The Hay Maze portal. Offer Time Grains to unlock. Realm contains Golden Essences and a Mind Shard."
          />

          {/* ============== THE REALMS ============== */}
          <SectionHeader color="#4B0082">The Four Realms</SectionHeader>

          <RealmRow
            name="The Void"
            guardian="Kittle (Cat)"
            unlockCost="Time Grains"
            essence="Amber"
            color="#FFA500"
            description="Navigate through a dark void avoiding anglerfish. Find all the hidden Amber Essences and the Mind Shard to complete."
          />

          <RealmRow
            name="The Lily Marsh"
            guardian="Pepe (Frog)"
            unlockCost="Time Grains"
            essence="Forest"
            color="#4ade80"
            description="Jump across lily pads in a misty swamp. Collect flies for points and find all the hidden Forest Essences plus the Mind Shard."
          />

          <RealmRow
            name="The Hay Maze"
            guardian="Bunzy (Rabbit)"
            unlockCost="Time Grains"
            essence="Golden"
            color="#DEB887"
            description="Navigate through an underground maze filled with hay bales and carrots. Find all the hidden Golden Essences and the Mind Shard to complete."
          />

          <RealmRow
            name="The Night Sky"
            guardian="Hoots (Owl)"
            unlockCost="Essences"
            essence="Violet"
            color="#4B0082"
            description="Fly through a starlit sky collecting stars. This is the final realm - find AEIOU's last Mind Shard here."
          />

          {/* ============== MIND SHARDS & FUSION ============== */}
          <SectionHeader color="#ffd700">Mind Shards & The Fusion Spell</SectionHeader>
          <InfoBox color="#ffd700">
            Each realm contains one of AEIOU's <strong>Mind Shards</strong>. The floating amber pyramid near AEIOU shows your progress -
            it has 4 layers (Rabbit base, Frog, Cat, Owl tip) that light up as you collect shards.
          </InfoBox>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", lineHeight: 1.7 }}>
            <strong>When you have all 4 Mind Shards:</strong>
            <ol style={{ paddingLeft: "20px", margin: "6px 0" }}>
              <li>Return to <strong>Y</strong> at 12 o'clock</li>
              <li>Y will cast the <strong>Fusion Spell</strong></li>
              <li>AEIOU's mind will be restored</li>
              <li>AEIOU will open the <strong>Noon Portal</strong> at 12 o'clock</li>
            </ol>
          </div>

          {/* ============== GAME MODES ============== */}
          <SectionHeader color="#8b5cf6">Game Modes</SectionHeader>

          <SubHeader>Free Mode (Default)</SubHeader>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginBottom: "12px" }}>
            Play without blockchain. All progress is saved locally in your browser.
            Click the <strong style={{ color: "#4ade80" }}>Cooter logo</strong> in the top-left to toggle between modes.
            When the turtle icon has a <span style={{ color: "#4ade80" }}>green glow</span>, Free Mode is active.
            When blockchain is turned off, the logo turns <span style={{ color: "#60a5fa" }}>blue</span>.
          </div>

          <SubHeader>Blockchain Mode</SubHeader>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginBottom: "12px" }}>
            Connect your wallet to mint collectibles as NFTs on the Optimism network.
            When you collect a Time Grain or Essence, you'll be prompted to mint it on-chain.
            Your progress becomes permanent and verifiable on the blockchain.
          </div>

          {/* ============== CONTROLS ============== */}
          <SectionHeader color="#d4af37">Controls</SectionHeader>

          <SubHeader>Movement</SubHeader>
          <ControlRow
            keys={<><KeyIcon>W</KeyIcon><KeyIcon>S</KeyIcon><KeyIcon>A</KeyIcon><KeyIcon>D</KeyIcon></>}
            description="Move / Turn (or Arrow keys)"
          />
          <ControlRow
            keys={<KeyIcon>Space</KeyIcon>}
            description="Jump"
          />
          <ControlRow
            keys={<KeyIcon>Shift</KeyIcon>}
            description="Sprint (in realms)"
          />
          <ControlRow
            keys={<KeyIcon>E</KeyIcon>}
            description="Interact (collect, talk, enter portal)"
          />

          <SubHeader>Camera</SubHeader>
          <ControlRow
            keys={<KeyIcon>1</KeyIcon>}
            description="Third-person view (behind turtle)"
          />
          <ControlRow
            keys={<KeyIcon>2</KeyIcon>}
            description="Bird's eye view (top-down)"
          />

          <SubHeader>Mobile</SubHeader>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
            Use the on-screen joystick to move. Tap interaction buttons when they appear.
          </div>

          {/* ============== THE CLOCK WORLD ============== */}
          <SectionHeader color="#87ceeb">The Clock World</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "12px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>Clock floats above an endless ocean</li>
            <li>Sky changes based on your <strong>real local time</strong></li>
            <li>Sun rises in the East (3 o'clock), sets in the West (9 o'clock)</li>
            <li>12 o'clock = North, 6 o'clock = South</li>
            <li>Moon and stars appear at night</li>
            <li>Fireflies glow around the clock at dusk/night</li>
          </ul>

          {/* ============== TIPS ============== */}
          <SectionHeader color="#ff6b6b">Tips</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "12px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>Talk to <strong>Y</strong> first to understand the full story</li>
            <li>Watch the second hand - at :59 Y stops time and a grain appears</li>
            <li>Each animal needs a different number of grains - look at the clock!</li>
            <li>Essences are hidden <strong>inside</strong> realms - explore thoroughly</li>
            <li>Hoots needs Essences from ALL three realms, not just one type</li>
            <li>Use Bird's Eye view (press <strong>2</strong>) to see the whole clock</li>
            <li>The <strong>Reset</strong> button clears all progress to start over</li>
          </ul>

          {/* Footer */}
          <div style={{
            marginTop: "24px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
          }}>
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "11px",
            }}>
              Press <KeyIcon size="small">Esc</KeyIcon> or click outside to close
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
