"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';

// Transition types
export const TRANSITIONS = {
  FADE: 'fade',
  SLIDE_LEFT: 'slide_left',
  SLIDE_RIGHT: 'slide_right',
  SLIDE_UP: 'slide_up',
  SLIDE_DOWN: 'slide_down',
  ZOOM_IN: 'zoom_in',
  ZOOM_OUT: 'zoom_out',
  CIRCLE_WIPE: 'circle_wipe',
  CLOCK_WIPE: 'clock_wipe',
  PIXELATE: 'pixelate',
  SHATTER: 'shatter',
};

const TransitionContext = createContext(null);

export function TransitionProvider({ children }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState(TRANSITIONS.FADE);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionColor, setTransitionColor] = useState('#000000');
  const [onComplete, setOnComplete] = useState(null);

  const animationRef = useRef(null);

  const startTransition = useCallback((config = {}) => {
    const {
      type = TRANSITIONS.FADE,
      duration = 500,
      color = '#000000',
      onMidpoint = null,
      onDone = null,
    } = config;

    return new Promise((resolve) => {
      setTransitionType(type);
      setTransitionColor(color);
      setIsTransitioning(true);
      setTransitionProgress(0);

      const startTime = performance.now();
      const halfDuration = duration / 2;

      let midpointCalled = false;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out
        const easedProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        setTransitionProgress(easedProgress);

        // Call midpoint callback
        if (!midpointCalled && elapsed >= halfDuration) {
          midpointCalled = true;
          if (onMidpoint) onMidpoint();
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsTransitioning(false);
          setTransitionProgress(0);
          if (onDone) onDone();
          resolve();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    });
  }, []);

  const cancelTransition = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsTransitioning(false);
    setTransitionProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <TransitionContext.Provider value={{ startTransition, cancelTransition, isTransitioning }}>
      {children}
      <TransitionOverlay
        isActive={isTransitioning}
        type={transitionType}
        progress={transitionProgress}
        color={transitionColor}
      />
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    return {
      startTransition: () => Promise.resolve(),
      cancelTransition: () => {},
      isTransitioning: false,
    };
  }
  return context;
}

// Transition overlay component
function TransitionOverlay({ isActive, type, progress, color }) {
  if (!isActive && progress === 0) return null;

  // Calculate opacity/visibility based on progress
  // Progress goes 0 -> 1 -> 0 (in-out)
  const visibility = progress <= 0.5
    ? progress * 2 // 0 to 1 during first half
    : 2 - progress * 2; // 1 to 0 during second half

  const getOverlayStyle = () => {
    const base = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 10000,
      pointerEvents: isActive ? 'auto' : 'none',
    };

    switch (type) {
      case TRANSITIONS.FADE:
        return {
          ...base,
          background: color,
          opacity: visibility,
        };

      case TRANSITIONS.SLIDE_LEFT:
        return {
          ...base,
          background: color,
          transform: `translateX(${(1 - visibility) * 100}%)`,
        };

      case TRANSITIONS.SLIDE_RIGHT:
        return {
          ...base,
          background: color,
          transform: `translateX(${(visibility - 1) * 100}%)`,
        };

      case TRANSITIONS.SLIDE_UP:
        return {
          ...base,
          background: color,
          transform: `translateY(${(1 - visibility) * 100}%)`,
        };

      case TRANSITIONS.SLIDE_DOWN:
        return {
          ...base,
          background: color,
          transform: `translateY(${(visibility - 1) * 100}%)`,
        };

      case TRANSITIONS.ZOOM_IN:
        return {
          ...base,
          background: color,
          transform: `scale(${visibility * 2})`,
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          marginLeft: '-50vw',
          marginTop: '-50vh',
        };

      case TRANSITIONS.ZOOM_OUT:
        return {
          ...base,
          background: color,
          opacity: visibility,
          transform: `scale(${1 + (1 - visibility) * 0.2})`,
        };

      case TRANSITIONS.CIRCLE_WIPE:
        // Circle expands from center
        const circleSize = visibility * 150; // 150% of screen diagonal
        return {
          ...base,
          background: color,
          clipPath: `circle(${circleSize}% at 50% 50%)`,
        };

      case TRANSITIONS.CLOCK_WIPE:
        // Clock-style wipe (rotates like second hand)
        const angle = visibility * 360;
        return {
          ...base,
          background: `conic-gradient(from 0deg, ${color} ${angle}deg, transparent ${angle}deg)`,
        };

      default:
        return {
          ...base,
          background: color,
          opacity: visibility,
        };
    }
  };

  return (
    <div style={getOverlayStyle()}>
      {/* Optional transition content */}
      {type === TRANSITIONS.CLOCK_WIPE && visibility > 0.4 && visibility < 0.6 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '48px',
        }}>
          ⏰
        </div>
      )}
    </div>
  );
}

// Pre-made transition sequences
export const TransitionSequences = {
  // Realm entry transition
  enterRealm: async (transition, realmColor) => {
    await transition.startTransition({
      type: TRANSITIONS.CLOCK_WIPE,
      duration: 800,
      color: realmColor || '#1a1a2e',
    });
  },

  // Return to hub
  returnToHub: async (transition) => {
    await transition.startTransition({
      type: TRANSITIONS.CIRCLE_WIPE,
      duration: 600,
      color: '#000000',
    });
  },

  // Victory sequence
  victory: async (transition) => {
    await transition.startTransition({
      type: TRANSITIONS.FADE,
      duration: 1000,
      color: '#ffd700',
    });
  },

  // Game over
  gameOver: async (transition) => {
    await transition.startTransition({
      type: TRANSITIONS.FADE,
      duration: 800,
      color: '#1a0000',
    });
  },

  // Quick scene change
  quickChange: async (transition) => {
    await transition.startTransition({
      type: TRANSITIONS.FADE,
      duration: 300,
      color: '#000000',
    });
  },
};

// Loading screen component
export function LoadingScreen({ isLoading, message = 'Loading...' }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      {/* Animated clock */}
      <div style={{
        width: '80px',
        height: '80px',
        border: '3px solid #444',
        borderRadius: '50%',
        position: 'relative',
        marginBottom: '24px',
      }}>
        {/* Clock hand */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '2px',
          height: '30px',
          background: '#ffd700',
          transformOrigin: 'bottom center',
          animation: 'spin 1s linear infinite',
          marginLeft: '-1px',
          marginTop: '-30px',
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '8px',
          height: '8px',
          background: '#ffd700',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
        }} />
      </div>

      <div style={{
        color: '#888',
        fontSize: '14px',
        fontFamily: 'monospace',
      }}>
        {message}{dots}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Animated text reveal
export function TextReveal({ text, delay = 50, style = {} }) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);
    const interval = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return (
    <span style={style}>
      {text.slice(0, visibleChars)}
      <span style={{ opacity: 0.3 }}>{text.slice(visibleChars)}</span>
    </span>
  );
}

// Pulsing animation wrapper
export function Pulse({ children, duration = 1000, scale = 1.05 }) {
  return (
    <div style={{
      animation: `pulse ${duration}ms ease-in-out infinite`,
    }}>
      {children}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${scale}); }
        }
      `}</style>
    </div>
  );
}

// Floating animation wrapper
export function Float({ children, duration = 2000, distance = 10 }) {
  return (
    <div style={{
      animation: `float ${duration}ms ease-in-out infinite`,
    }}>
      {children}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-${distance}px); }
        }
      `}</style>
    </div>
  );
}

// Shake animation wrapper
export function Shake({ children, intensity = 5, duration = 500, trigger = false }) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  if (!isShaking) return <>{children}</>;

  return (
    <div style={{
      animation: `shake ${duration}ms ease-in-out`,
    }}>
      {children}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-${intensity}px); }
          20%, 40%, 60%, 80% { transform: translateX(${intensity}px); }
        }
      `}</style>
    </div>
  );
}

// Glow effect wrapper
export function Glow({ children, color = '#ffd700', intensity = 20 }) {
  return (
    <div style={{
      filter: `drop-shadow(0 0 ${intensity}px ${color})`,
    }}>
      {children}
    </div>
  );
}
