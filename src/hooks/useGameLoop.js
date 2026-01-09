"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to handle game loop timing and pause on tab background
 * @returns {{ isPaused: boolean, deltaTime: number }}
 */
export default function useGameLoop() {
  const [isPaused, setIsPaused] = useState(false);
  const lastTimeRef = useRef(performance.now());

  // Handle visibility change (tab backgrounded)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
      // Reset last time to avoid huge delta after unpause
      lastTimeRef.current = performance.now();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  /**
   * Get delta time since last call, capped to avoid huge jumps
   * @returns {number} Delta time in seconds
   */
  const getDeltaTime = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = now;

    // Cap delta time to avoid huge jumps (e.g., after tab switch)
    return Math.min(delta, 0.1);
  }, []);

  return { isPaused, getDeltaTime };
}
