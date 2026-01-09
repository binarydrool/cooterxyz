"use client";

import { useRef } from "react";
import * as THREE from "three";

/**
 * Individual clock hand component
 * @param {Object} props
 * @param {number} props.length - Length of the hand
 * @param {number} props.width - Width of the hand
 * @param {number} props.height - Height/thickness of the hand
 * @param {string} props.color - Color of the hand
 * @param {number} props.angle - Rotation angle in radians (clockwise from 12)
 * @param {number} props.yOffset - Y position offset
 */
export default function ClockHand({
  length,
  width,
  height,
  color,
  angle,
  yOffset = 0.2
}) {
  const meshRef = useRef();

  // Clock hands rotate around Y axis, with angle measured from 12 o'clock
  // In Three.js, negative Y rotation = clockwise when viewed from above
  const rotation = -angle;

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {/* Hand is positioned so pivot point is at one end */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, length / 2]}
        castShadow
      >
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
