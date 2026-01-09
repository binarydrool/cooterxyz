"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDirectionalState } from "./useGameInput";

// Global touch state that can be updated externally
let globalTouchState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  collect: false,
  jump: false,
};

let touchStateListeners = [];

export function setTouchInput(key, value) {
  globalTouchState[key] = value;
  touchStateListeners.forEach(listener => listener({ ...globalTouchState }));
}

export function getTouchState() {
  return { ...globalTouchState };
}

/**
 * Hook to track keyboard input state using refs for immediate response
 * Returns an object with currently pressed keys
 */
export default function useKeyboard() {
  // Use refs for immediate updates (no React render delay)
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const touchKeysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Force re-render when keys change (for components that depend on this)
  const [, forceUpdate] = useState(0);

  // Subscribe to touch state changes
  useEffect(() => {
    const listener = (newTouchState) => {
      touchKeysRef.current = {
        forward: newTouchState.forward,
        backward: newTouchState.backward,
        left: newTouchState.left,
        right: newTouchState.right,
      };
    };
    touchStateListeners.push(listener);
    return () => {
      touchStateListeners = touchStateListeners.filter(l => l !== listener);
    };
  }, []);

  const handleKeyDown = useCallback((e) => {
    // Prevent default for game keys to avoid scrolling
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
    if (gameKeys.includes(e.key)) {
      e.preventDefault();
    }

    let changed = false;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (!keysRef.current.forward) {
          keysRef.current.forward = true;
          changed = true;
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (!keysRef.current.backward) {
          keysRef.current.backward = true;
          changed = true;
        }
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (!keysRef.current.left) {
          keysRef.current.left = true;
          changed = true;
        }
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (!keysRef.current.right) {
          keysRef.current.right = true;
          changed = true;
        }
        break;
    }
    // Only trigger re-render on actual change
    if (changed) {
      forceUpdate(n => n + 1);
    }
  }, []);

  const handleKeyUp = useCallback((e) => {
    let changed = false;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (keysRef.current.forward) {
          keysRef.current.forward = false;
          changed = true;
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (keysRef.current.backward) {
          keysRef.current.backward = false;
          changed = true;
        }
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (keysRef.current.left) {
          keysRef.current.left = false;
          changed = true;
        }
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (keysRef.current.right) {
          keysRef.current.right = false;
          changed = true;
        }
        break;
    }
    if (changed) {
      forceUpdate(n => n + 1);
    }
  }, []);

  // Reset all keys when window loses focus
  const handleBlur = useCallback(() => {
    keysRef.current = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    forceUpdate(n => n + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur]);

  // Return combined keyboard, touch, and global mobile joystick inputs
  // Get global input from useGameInput (for mobile joystick)
  const globalInput = getDirectionalState();

  return {
    forward: keysRef.current.forward || touchKeysRef.current.forward || globalInput.forward,
    backward: keysRef.current.backward || touchKeysRef.current.backward || globalInput.backward,
    left: keysRef.current.left || touchKeysRef.current.left || globalInput.left,
    right: keysRef.current.right || touchKeysRef.current.right || globalInput.right,
    jump: globalInput.sprint, // Map sprint to jump for turtle (it's a small hop)
    interact: globalInput.interact,
  };
}
