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
function SectionHeader({ children }) {
  return (
    <h3 style={{
      color: "#fff",
      fontSize: "18px",
      fontWeight: 600,
      marginTop: "24px",
      marginBottom: "12px",
      paddingBottom: "8px",
      borderBottom: "2px solid #d4af37",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      {children}
    </h3>
  );
}

// Control row showing key + description
function ControlRow({ keys, description }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
      gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", minWidth: "120px" }}>
        {keys}
      </div>
      <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
        {description}
      </span>
    </div>
  );
}

// Color phase indicator
function ColorPhase({ startTime, endTime, startColor, endColor, description }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
      gap: "12px",
    }}>
      <div style={{
        width: "60px",
        fontFamily: "monospace",
        fontSize: "13px",
        color: "rgba(255,255,255,0.7)",
      }}>
        {startTime} - {endTime}
      </div>
      <div style={{
        width: "80px",
        height: "8px",
        borderRadius: "4px",
        background: `linear-gradient(90deg, ${startColor}, ${endColor})`,
      }} />
      <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
        {description}
      </span>
    </div>
  );
}

// Direction indicator with compass
function DirectionRow({ position, direction, description }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "6px",
      gap: "12px",
    }}>
      <span style={{
        width: "80px",
        color: "#d4af37",
        fontWeight: 500,
        fontSize: "14px",
      }}>
        {position}
      </span>
      <span style={{
        width: "50px",
        color: "rgba(255,255,255,0.7)",
        fontSize: "14px",
      }}>
        = {direction}
      </span>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
        {description}
      </span>
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
      // Prevent body scroll when modal is open
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

  // Handle backdrop click - close when clicking outside modal content
  const handleBackdropClick = useCallback((e) => {
    // Close if clicking on the backdrop (not on modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Prevent clicks inside modal from closing it
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
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        animation: "fadeIn 200ms ease-out",
      }}
    >
      {/* Modal content */}
      <div
        ref={contentRef}
        tabIndex={-1}
        onClick={handleContentClick}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          background: "linear-gradient(180deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)",
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
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            color: "#fff",
            fontSize: "20px",
            cursor: "pointer",
            transition: "all 150ms ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          &times;
        </button>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          minHeight: 0,
          padding: "32px",
          paddingRight: "24px",
          overflowY: "auto",
          scrollBehavior: "smooth",
        }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2
              id="help-modal-title"
              style={{
                color: "#d4af37",
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "8px",
                textShadow: "0 2px 10px rgba(212, 175, 55, 0.3)",
              }}
            >
              Cooter
            </h2>
            <p style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "16px",
              fontStyle: "italic",
            }}>
              A turtle on a clock floating above the ocean. Time moves with you.
            </p>
          </div>

          {/* CONTROLS */}
          <SectionHeader>Controls</SectionHeader>

          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "16px" }}>
            <strong>Movement</strong>
          </p>

          <ControlRow
            keys={<><KeyIcon>W</KeyIcon> / <KeyIcon>&#8593;</KeyIcon></>}
            description="Move forward"
          />
          <ControlRow
            keys={<><KeyIcon>S</KeyIcon> / <KeyIcon>&#8595;</KeyIcon></>}
            description="Move backward"
          />
          <ControlRow
            keys={<><KeyIcon>A</KeyIcon> / <KeyIcon>&#8592;</KeyIcon></>}
            description="Turn left"
          />
          <ControlRow
            keys={<><KeyIcon>D</KeyIcon> / <KeyIcon>&#8594;</KeyIcon></>}
            description="Turn right"
          />
          <ControlRow
            keys={<KeyIcon>E</KeyIcon>}
            description="Interact (collect grains, talk)"
          />

          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "12px", marginTop: "20px" }}>
            <strong>Camera Views</strong>
          </p>

          <ControlRow
            keys={<KeyIcon>1</KeyIcon>}
            description="Third-person view (behind turtle)"
          />
          <ControlRow
            keys={<KeyIcon>2</KeyIcon>}
            description="Bird's eye view (top-down, Pac-Man controls)"
          />

          {/* THE CLOCK */}
          <SectionHeader>The Clock</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "14px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>Real-time clock synced to your local time</li>
            <li>Three hands: hour, minute, and second (all <span style={{ color: "#d4af37" }}>gold</span>)</li>
            <li>Hour markers at each position</li>
            <li>Gold ring around the edge</li>
          </ul>

          {/* STOPPING TIME */}
          <SectionHeader>Stopping Time</SectionHeader>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
            Walk into the <span style={{ color: "#d4af37" }}>second hand</span> to stop it.
            The hand stays stopped as long as you maintain contact.
            Breaking contact resets the timer.
          </p>

          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "12px" }}>
            <strong>Color Progression:</strong>
          </p>

          <ColorPhase
            startTime="0:00"
            endTime="0:20"
            startColor="#d4af37"
            endColor="#ff0000"
            description="Gold fades to Red"
          />
          <ColorPhase
            startTime="0:20"
            endTime="0:30"
            startColor="#ff0000"
            endColor="#800080"
            description="Red fades to Purple"
          />
          <ColorPhase
            startTime="0:30"
            endTime="0:33"
            startColor="#800080"
            endColor="#ffffff"
            description="Purple flashes to White"
          />

          <p style={{
            color: "#d4af37",
            fontSize: "14px",
            marginTop: "16px",
            fontWeight: 500,
          }}>
            At 0:33 a <strong>Time Grain</strong> spawns on the clock!
          </p>

          {/* SAND GRAINS */}
          <SectionHeader>Time Grains</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "14px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>Spawn when you hold the second hand for 33 seconds</li>
            <li>Golden glowing collectibles</li>
            <li>Press <KeyIcon size="small">E</KeyIcon> near a grain to collect</li>
            <li>Push grains around by walking into them</li>
          </ul>

          {/* THE WORLD */}
          <SectionHeader>The World</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "14px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
            marginBottom: "16px",
          }}>
            <li>Clock floats high above an endless ocean</li>
            <li>Sky changes based on your <strong>real local time</strong></li>
            <li>Sun rises in the East, sets in the West</li>
            <li>Moon appears at night (opposite the sun)</li>
          </ul>

          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "12px" }}>
            <strong>Directional Reference:</strong>
          </p>

          <DirectionRow position="12 o'clock" direction="North" description="(sun at noon)" />
          <DirectionRow position="3 o'clock" direction="East" description="(sunrise)" />
          <DirectionRow position="6 o'clock" direction="South" description="" />
          <DirectionRow position="9 o'clock" direction="West" description="(sunset)" />

          {/* THE TURTLE */}
          <SectionHeader>The Turtle</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "14px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>You control a turtle walking on the clock</li>
            <li>Starts facing North (toward 12 o'clock)</li>
            <li>Walk into the second hand to stop time</li>
            <li>Cannot fall off the clock edge</li>
          </ul>

          {/* RABBIT NPC */}
          <SectionHeader>The Rabbit</SectionHeader>
          <ul style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "14px",
            lineHeight: 1.8,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>Lives at 9 o'clock (West) on the clock</li>
            <li>Automatically jumps over the second hand</li>
            <li>Approach and press <KeyIcon size="small">E</KeyIcon> to interact</li>
          </ul>

          {/* Footer */}
          <div style={{
            marginTop: "32px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
          }}>
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "12px",
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
