"use client";

import { useState, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import useKeyboard from "./useKeyboard";
import { getMovementFromKeys, calculateMovement, isMoving as checkIsMoving, calculateBirdsEyeMovement, isMovingBirdsEye } from "@/utils/movement";
import { clampToCircle } from "@/utils/collision";

// Global camera mode ref - can be set from outside
let globalCameraMode = 'third-person';

// Global position override - used to teleport turtle (e.g., after realm completion)
let pendingPositionReset = null;

// How long turtle must be still before collision is enabled (seconds)
const STATIONARY_THRESHOLD = 0.1; // Reduced for faster response

// Turtle jump settings - very small/lame jump
const TURTLE_JUMP_HEIGHT = 0.15; // Very low jump
const TURTLE_JUMP_DURATION = 0.4; // Quick small hop

export function setCameraMode(mode) {
  globalCameraMode = mode;
}

// Teleport turtle to a specific position (used when returning from realm)
export function setTurtlePosition(x, z, rotation = Math.PI) {
  pendingPositionReset = { x, z, rotation };
}

/**
 * Hook to manage turtle movement state and updates
 * @returns {{ position: [number, number, number], rotation: number, isMoving: boolean, isWalking: boolean, isStationary: boolean }}
 */
export default function useTurtleMovement() {
  // Start at 12 o'clock position (North), between Dimitrius and Nox
  // Clock orientation: 12=North (+Z), 3=East (+X), 6=South (-Z), 9=West (-X)
  // CLOCK_RADIUS = 5, Dimitrius at 5.0, Nox at 4.25, second hand reaches 3.4
  const [state, setState] = useState({
    x: 0,          // Centered on 12 o'clock
    z: 4.6,        // Between Dimitrius (5.0) and Nox (4.25), beyond second hand (3.4)
    rotation: Math.PI,   // Facing South (toward center/Nox)
  });

  // Track stationary state using refs for immediate updates (no async delay)
  const stationaryTimer = useRef(STATIONARY_THRESHOLD); // Start as stationary
  const isStationaryRef = useRef(true);
  const [isStationaryState, setIsStationaryState] = useState(true);

  // Jump state - turtle has a small lame jump
  const [jumpHeight, setJumpHeight] = useState(0);
  const jumpTimeRef = useRef(0);
  const isJumpingRef = useRef(false);
  const lastJumpKeyRef = useRef(false);

  const keys = useKeyboard();

  // Check if moving based on camera mode
  const isBirdsEye = globalCameraMode === 'birds-eye';
  const isCurrentlyMoving = isBirdsEye ? isMovingBirdsEye(keys) : checkIsMoving(keys);
  const movement = getMovementFromKeys(keys);

  // Track if turtle is walking (forward/backward, not just turning)
  const isWalking = isBirdsEye ? isMovingBirdsEye(keys) : movement.forward !== 0;

  // Update position every frame
  useFrame((_, delta) => {
    // Cap delta time to avoid huge jumps
    const cappedDelta = Math.min(delta, 0.1);
    const currentlyBirdsEye = globalCameraMode === 'birds-eye';

    // Check for pending position teleport (e.g., returning from realm)
    if (pendingPositionReset) {
      setState({
        x: pendingPositionReset.x,
        z: pendingPositionReset.z,
        rotation: pendingPositionReset.rotation,
      });
      pendingPositionReset = null;
      return; // Skip movement this frame
    }

    // Handle jump - turtle's small lame hop
    const jumpPressed = keys.jump;
    if (jumpPressed && !lastJumpKeyRef.current && !isJumpingRef.current) {
      // Start jump
      isJumpingRef.current = true;
      jumpTimeRef.current = 0;
    }
    lastJumpKeyRef.current = jumpPressed;

    // Update jump animation
    if (isJumpingRef.current) {
      jumpTimeRef.current += cappedDelta;
      const progress = jumpTimeRef.current / TURTLE_JUMP_DURATION;

      if (progress >= 1) {
        // Jump finished
        isJumpingRef.current = false;
        jumpTimeRef.current = 0;
        setJumpHeight(0);
      } else {
        // Parabolic arc for jump - very small height
        const height = Math.sin(progress * Math.PI) * TURTLE_JUMP_HEIGHT;
        setJumpHeight(height);
      }
    }

    // Handle movement based on camera mode
    const currentlyMoving = currentlyBirdsEye ? isMovingBirdsEye(keys) : checkIsMoving(keys);

    // Update stationary timer and ref immediately (no async state delay)
    if (currentlyMoving) {
      // Moving - reset stationary timer immediately
      stationaryTimer.current = 0;
      isStationaryRef.current = false;
      if (isStationaryState) {
        setIsStationaryState(false);
      }
    } else {
      // Not moving - accumulate stationary time
      stationaryTimer.current += cappedDelta;
      if (stationaryTimer.current >= STATIONARY_THRESHOLD) {
        isStationaryRef.current = true;
        if (!isStationaryState) {
          setIsStationaryState(true);
        }
      }
    }

    if (!currentlyMoving) return;

    setState((prev) => {
      if (currentlyBirdsEye) {
        // Pac-Man style: absolute directions
        const newState = calculateBirdsEyeMovement({
          x: prev.x,
          z: prev.z,
          keys,
          deltaTime: cappedDelta,
        });

        // Apply boundary clamping only (no hand collision blocking)
        const clamped = clampToCircle(prev.x, prev.z, newState.x, newState.z);

        return {
          x: clamped.x,
          z: clamped.z,
          rotation: newState.rotation,
        };
      } else {
        // Normal mode: turn and move forward/backward
        const movement = getMovementFromKeys(keys);

        const newState = calculateMovement({
          x: prev.x,
          z: prev.z,
          rotation: prev.rotation,
          forward: movement.forward,
          turn: movement.turn,
          deltaTime: cappedDelta,
        });

        // Apply boundary clamping only (no hand collision blocking)
        const clamped = clampToCircle(prev.x, prev.z, newState.x, newState.z);

        return {
          x: clamped.x,
          z: clamped.z,
          rotation: newState.rotation,
        };
      }
    });
  });

  // Use the ref value for immediate response in collision detection
  return {
    position: [state.x, jumpHeight, state.z],
    rotation: state.rotation,
    isMoving: isCurrentlyMoving,
    isWalking,
    isStationary: isStationaryRef.current, // Use ref for immediate response
    jumpHeight,
    isInAir: isJumpingRef.current,
  };
}
