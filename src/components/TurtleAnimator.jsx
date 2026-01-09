"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Animation constants
 */
const IDLE_BOB_SPEED = 2; // Head bob cycles per second
const IDLE_BOB_AMOUNT = 0.02; // Head bob amplitude
const WALK_CYCLE_SPEED = 8; // Leg cycles per second
const LEG_SWING_AMOUNT = 0.3; // Leg swing amplitude (radians)
const ANIMATION_BLEND_SPEED = 5; // How fast to blend between states

/**
 * Hook to calculate animation values for the turtle
 * @param {boolean} isWalking - Whether the turtle is walking
 * @returns {Object} Animation values for head and legs
 */
export function useTurtleAnimation(isWalking) {
  const timeRef = useRef(0);
  const blendRef = useRef(0); // 0 = idle, 1 = walking
  const animationRef = useRef({
    headBob: 0,
    legAngles: [0, 0, 0, 0], // FR, FL, BR, BL
  });

  useFrame((_, delta) => {
    timeRef.current += delta;

    // Blend between idle and walking
    const targetBlend = isWalking ? 1 : 0;
    blendRef.current += (targetBlend - blendRef.current) * ANIMATION_BLEND_SPEED * delta;
    blendRef.current = Math.max(0, Math.min(1, blendRef.current));

    const t = timeRef.current;
    const blend = blendRef.current;

    // Idle animation - subtle head bob
    const idleHeadBob = Math.sin(t * IDLE_BOB_SPEED * Math.PI * 2) * IDLE_BOB_AMOUNT;

    // Walk animation - leg movement in alternating pairs
    const walkPhase = t * WALK_CYCLE_SPEED * Math.PI * 2;

    // Diagonal pairs move together: FR+BL, FL+BR
    const legSwing1 = Math.sin(walkPhase) * LEG_SWING_AMOUNT;
    const legSwing2 = Math.sin(walkPhase + Math.PI) * LEG_SWING_AMOUNT;

    // Blend between idle (no movement) and walk (leg swings)
    animationRef.current = {
      headBob: idleHeadBob * (1 - blend * 0.5), // Reduce bob when walking
      legAngles: [
        legSwing1 * blend, // Front right
        legSwing2 * blend, // Front left
        legSwing2 * blend, // Back right (opposite to front right)
        legSwing1 * blend, // Back left (opposite to front left)
      ],
    };
  });

  return animationRef;
}

/**
 * Component wrapper for animation - use in Turtle component
 */
export default function TurtleAnimator({ isWalking, children }) {
  const animation = useTurtleAnimation(isWalking);

  // Pass animation values to children via render prop or context
  return children(animation);
}
