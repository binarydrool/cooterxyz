"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// N64 style vibrant frog colors
const SKIN_COLOR = "#22CC44"; // Bright green
const SKIN_LIGHT = "#44EE66"; // Light vibrant green
const SKIN_DARK = "#118822"; // Dark green
const BELLY_COLOR = "#88FF99"; // Bright belly
const EYE_WHITE = "#FFFFFF";
const EYE_PUPIL = "#111111";
const SPOT_COLOR = "#006622"; // Dark spots

/**
 * CoolFrog - Improved frog model for the game
 * Props:
 * - position: [x, y, z] position
 * - rotation: y-axis rotation in radians
 * - isJumping: whether frog is mid-jump (affects leg pose)
 */
export default function CoolFrog({ position = [0, 0, 0], rotation = 0, isJumping = false }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const leftBackLegRef = useRef();
  const rightBackLegRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      // Smooth position interpolation
      groupRef.current.position.lerp(new THREE.Vector3(...position), 0.2);
      groupRef.current.rotation.y = rotation;
    }

    // Animate legs based on jumping state
    const targetRotation = isJumping ? -0.5 : 0.3;
    if (leftBackLegRef.current) {
      leftBackLegRef.current.rotation.x += (targetRotation - leftBackLegRef.current.rotation.x) * 0.2;
    }
    if (rightBackLegRef.current) {
      rightBackLegRef.current.rotation.x += (targetRotation - rightBackLegRef.current.rotation.x) * 0.2;
    }

    // Subtle breathing animation when not jumping
    if (bodyRef.current && !isJumping) {
      const breathe = Math.sin(Date.now() / 600) * 0.02;
      bodyRef.current.scale.y = 1 + breathe;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <group ref={bodyRef}>
        {/* === BODY - rounded, smooth === */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
        </mesh>

        {/* Belly - lighter color, slightly forward */}
        <mesh position={[0, 0.25, 0.15]} scale={[0.8, 0.6, 0.6]} castShadow>
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshStandardMaterial color={BELLY_COLOR} roughness={0.9} />
        </mesh>

        {/* === HEAD - slightly forward === */}
        <mesh position={[0, 0.4, 0.3]} castShadow>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color={SKIN_LIGHT} roughness={0.8} />
        </mesh>

        {/* Wide mouth/snout */}
        <mesh position={[0, 0.32, 0.5]} castShadow>
          <sphereGeometry args={[0.25, 12, 10]} />
          <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
        </mesh>

        {/* === BIG BULGING EYES === */}
        {/* Left eye */}
        <group position={[-0.15, 0.6, 0.35]}>
          {/* Eye bulge */}
          <mesh castShadow>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Eyeball */}
          <mesh position={[0, 0.02, 0.08]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color={EYE_WHITE} roughness={0.3} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0.02, 0.15]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={EYE_PUPIL} roughness={0.2} />
          </mesh>
        </group>

        {/* Right eye */}
        <group position={[0.15, 0.6, 0.35]}>
          {/* Eye bulge */}
          <mesh castShadow>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Eyeball */}
          <mesh position={[0, 0.02, 0.08]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color={EYE_WHITE} roughness={0.3} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0.02, 0.15]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={EYE_PUPIL} roughness={0.2} />
          </mesh>
        </group>

        {/* Nostrils */}
        <mesh position={[-0.06, 0.38, 0.65]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.9} />
        </mesh>
        <mesh position={[0.06, 0.38, 0.65]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.9} />
        </mesh>

        {/* === SPOTS ON BACK === */}
        <mesh position={[0.1, 0.55, -0.1]} castShadow>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color={SPOT_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[-0.15, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshStandardMaterial color={SPOT_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0.45, 0.1]} castShadow>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={SPOT_COLOR} roughness={0.8} />
        </mesh>

        {/* === BACK LEGS - powerful, bent when sitting, stretched when jumping === */}
        {/* Left back leg */}
        <group ref={leftBackLegRef} position={[-0.3, 0.1, -0.2]} rotation={[0.3, 0, -0.3]}>
          {/* Thigh */}
          <mesh castShadow>
            <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Lower leg */}
          <group position={[0, -0.35, 0.2]} rotation={[0.8, 0, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
              <meshStandardMaterial color={SKIN_LIGHT} roughness={0.8} />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.25, 0.1]} castShadow>
              <boxGeometry args={[0.22, 0.05, 0.28]} />
              <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
            </mesh>
          </group>
        </group>

        {/* Right back leg */}
        <group ref={rightBackLegRef} position={[0.3, 0.1, -0.2]} rotation={[0.3, 0, 0.3]}>
          {/* Thigh */}
          <mesh castShadow>
            <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Lower leg */}
          <group position={[0, -0.35, 0.2]} rotation={[0.8, 0, 0]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
              <meshStandardMaterial color={SKIN_LIGHT} roughness={0.8} />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.25, 0.1]} castShadow>
              <boxGeometry args={[0.22, 0.05, 0.28]} />
              <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
            </mesh>
          </group>
        </group>

        {/* === FRONT LEGS - smaller === */}
        {/* Left front leg */}
        <group position={[-0.25, 0.15, 0.3]}>
          <mesh rotation={[0.5, 0, -0.2]} castShadow>
            <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Front foot */}
          <mesh position={[-0.08, -0.08, 0.12]} castShadow>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>
        </group>

        {/* Right front leg */}
        <group position={[0.25, 0.15, 0.3]}>
          <mesh rotation={[0.5, 0, 0.2]} castShadow>
            <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Front foot */}
          <mesh position={[0.08, -0.08, 0.12]} castShadow>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
