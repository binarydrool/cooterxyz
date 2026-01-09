"use client";

/**
 * Global Game Input System
 *
 * Provides unified input handling for both keyboard and mobile (joystick) controls.
 * Uses module-level state for immediate access without React render delays.
 *
 * Usage:
 * - Import { getInput, useGameInput } from this file
 * - In game loops: const input = getInput() - returns { x, y, sprint, action, jump }
 * - In components: const input = useGameInput() - React hook that triggers re-renders
 */

// Global input state - accessible from anywhere
const globalInput = {
  // Joystick/directional input (-1 to 1)
  x: 0,
  y: 0,

  // Keyboard state (for directional fallback)
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
  },

  // Action buttons
  sprint: false,
  action: false,
  jump: false,
  interact: false,

  // Source tracking
  source: 'keyboard', // 'keyboard' or 'mobile'
};

// Listeners for React components that want to re-render on input change
let inputListeners = [];

// Notify listeners of input changes
function notifyListeners() {
  inputListeners.forEach(listener => listener({ ...globalInput }));
}

/**
 * Set mobile joystick input
 * @param {number} x - Horizontal input (-1 to 1)
 * @param {number} y - Vertical input (-1 to 1)
 */
export function setMobileInput(x, y) {
  globalInput.x = x;
  globalInput.y = y;
  globalInput.source = 'mobile';
  notifyListeners();
}

/**
 * Set keyboard directional state
 * @param {string} key - 'up', 'down', 'left', 'right'
 * @param {boolean} pressed - Is the key pressed
 */
export function setKeyState(key, pressed) {
  if (key in globalInput.keys) {
    globalInput.keys[key] = pressed;
    globalInput.source = 'keyboard';
    notifyListeners();
  }
}

/**
 * Set action button state
 * @param {string} button - 'sprint', 'action', 'jump', 'interact'
 * @param {boolean} pressed - Is the button pressed
 */
export function setActionState(button, pressed) {
  if (button in globalInput) {
    globalInput[button] = pressed;
    notifyListeners();
  }
}

/**
 * Get current input state (immediate, no React delay)
 * Returns normalized x/y values from either joystick or keyboard
 * @returns {{ x: number, y: number, sprint: boolean, action: boolean, jump: boolean, interact: boolean }}
 */
export function getInput() {
  // If mobile joystick is active, use it
  if (globalInput.source === 'mobile' && (globalInput.x !== 0 || globalInput.y !== 0)) {
    return {
      x: globalInput.x,
      y: globalInput.y,
      sprint: globalInput.sprint,
      action: globalInput.action,
      jump: globalInput.jump,
      interact: globalInput.interact,
    };
  }

  // Otherwise, calculate from keyboard
  let x = 0;
  let y = 0;

  if (globalInput.keys.up) y += 1;
  if (globalInput.keys.down) y -= 1;
  if (globalInput.keys.left) x -= 1;
  if (globalInput.keys.right) x += 1;

  // Normalize diagonal movement
  if (x !== 0 && y !== 0) {
    const magnitude = Math.sqrt(x * x + y * y);
    x /= magnitude;
    y /= magnitude;
  }

  return {
    x,
    y,
    sprint: globalInput.sprint,
    action: globalInput.action,
    jump: globalInput.jump,
    interact: globalInput.interact,
  };
}

/**
 * Get raw directional state (for legacy compatibility)
 * @returns {{ forward: boolean, backward: boolean, left: boolean, right: boolean }}
 */
export function getDirectionalState() {
  const input = getInput();
  return {
    forward: input.y > 0.3,
    backward: input.y < -0.3,
    left: input.x < -0.3,
    right: input.x > 0.3,
    up: input.y > 0.3,
    down: input.y < -0.3,
    sprint: input.sprint,
    interact: input.interact,
  };
}

/**
 * Reset all input to default state
 */
export function resetInput() {
  globalInput.x = 0;
  globalInput.y = 0;
  globalInput.keys = { up: false, down: false, left: false, right: false };
  globalInput.sprint = false;
  globalInput.action = false;
  globalInput.jump = false;
  globalInput.interact = false;
  globalInput.source = 'keyboard';
  notifyListeners();
}

/**
 * Initialize keyboard listeners (call once in App/Game component)
 */
export function initKeyboardListeners() {
  const handleKeyDown = (e) => {
    // Prevent page scrolling for game keys
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '];
    if (gameKeys.includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setKeyState('up', true);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setKeyState('down', true);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        setKeyState('left', true);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setKeyState('right', true);
        break;
      case 'Shift':
      case ' ':
        setActionState('sprint', true);
        break;
      case 'e':
      case 'E':
        setActionState('interact', true);
        break;
    }
  };

  const handleKeyUp = (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setKeyState('up', false);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setKeyState('down', false);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        setKeyState('left', false);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setKeyState('right', false);
        break;
      case 'Shift':
      case ' ':
        setActionState('sprint', false);
        break;
      case 'e':
      case 'E':
        setActionState('interact', false);
        break;
    }
  };

  const handleBlur = () => {
    resetInput();
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
  };
}

/**
 * React hook for components that need to react to input changes
 * Note: For game loops, use getInput() directly for better performance
 */
import { useState, useEffect, useCallback } from 'react';

export function useGameInput() {
  const [input, setInput] = useState(() => getInput());

  useEffect(() => {
    const listener = () => setInput(getInput());
    inputListeners.push(listener);

    return () => {
      inputListeners = inputListeners.filter(l => l !== listener);
    };
  }, []);

  return input;
}

/**
 * React hook to check if device is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
