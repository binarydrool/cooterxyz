"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CLOCK_RADIUS, CLOCK_THICKNESS, getHandAngles } from "@/utils/clockMath";

// Owl sits at 12 o'clock position (near but not exactly where Gnome is)
const OWL_SECOND = 0; // 0 seconds = 12 o'clock position
const OWL_DISTANCE = CLOCK_RADIUS * 0.88; // At edge near 12 o'clock marker
const OWL_SCALE = 0.35;

// Position - 12 o'clock is positive Z
export const OWL_POS_X = 0;
export const OWL_POS_Z = OWL_DISTANCE;

// Colors - Wise brown owl
const FEATHER_BROWN = "#8B4513";
const FEATHER_LIGHT = "#D2691E";
const FEATHER_DARK = "#5C3317";
const BELLY_COLOR = "#F5DEB3";
const EYE_COLOR = "#FFD700"; // Golden eyes
const EYE_PUPIL = "#1a1a1a";
const BEAK_COLOR = "#4a4a4a";

// Flap settings
const FLAP_HEIGHT = 1.2;
const FLAP_DURATION = 0.7;
const FLAP_COOLDOWN = 1500;

// Hand collision settings
const HAND_WIDTH = 0.25;
const HOUR_HAND_LENGTH = CLOCK_RADIUS * 0.5;
const MINUTE_HAND_LENGTH = CLOCK_RADIUS * 0.7;
const HAND_HEIGHT = 0.15;

export default function Owl() {
  const groupRef = useRef();
  const bodyRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const flapState = useRef({
    isFlapping: false,
    flapTime: 0,
    lastFlapTime: 0,
  });

  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    const now = Date.now();
    const { secondAngle, minuteAngle, hourAngle } = getHandAngles();

    // Check if second hand is approaching
    const currentSecond = (secondAngle * 180) / Math.PI / 6;
    let secondDiff = currentSecond - OWL_SECOND;
    if (secondDiff < 0) secondDiff += 60;

    // Flap when second hand is close (within 5 seconds)
    const shouldFlap = secondDiff < 5 || secondDiff > 55;
    const canFlap = now - flapState.current.lastFlapTime > FLAP_COOLDOWN;

    if (shouldFlap && canFlap && !flapState.current.isFlapping) {
      flapState.current.isFlapping = true;
      flapState.current.flapTime = 0;
      flapState.current.lastFlapTime = now;
    }

    // Update flap animation
    if (flapState.current.isFlapping) {
      flapState.current.flapTime += delta;
      const t = flapState.current.flapTime / FLAP_DURATION;

      if (t >= 1) {
        flapState.current.isFlapping = false;
        bodyRef.current.position.y = 0;
        if (leftWingRef.current) leftWingRef.current.rotation.z = 0.3;
        if (rightWingRef.current) rightWingRef.current.rotation.z = -0.3;
      } else {
        // Smooth flap arc
        const flapProgress = Math.sin(t * Math.PI);
        bodyRef.current.position.y = flapProgress * FLAP_HEIGHT;

        // Wing flap animation
        const wingFlap = Math.sin(t * Math.PI * 4) * 0.5;
        if (leftWingRef.current) leftWingRef.current.rotation.z = 0.3 + wingFlap;
        if (rightWingRef.current) rightWingRef.current.rotation.z = -0.3 - wingFlap;
      }
    }

    // Subtle idle animation - slight head bob
    const idleBob = Math.sin(now / 1000) * 0.02;
    if (!flapState.current.isFlapping) {
      bodyRef.current.position.y = idleBob;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[OWL_POS_X, CLOCK_THICKNESS / 2, OWL_POS_Z]}
      rotation={[0, Math.PI, 0]} // Face toward center of clock
      scale={[OWL_SCALE, OWL_SCALE, OWL_SCALE]}
    >
      <group ref={bodyRef}>
        {/* === BODY === */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color={FEATHER_BROWN} roughness={0.9} />
        </mesh>

        {/* Belly patch */}
        <mesh position={[0, 0.45, 0.25]} castShadow>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshStandardMaterial color={BELLY_COLOR} roughness={0.95} />
        </mesh>

        {/* === HEAD === */}
        <group position={[0, 1.0, 0]}>
          {/* Main head */}
          <mesh castShadow>
            <sphereGeometry args={[0.35, 12, 10]} />
            <meshStandardMaterial color={FEATHER_BROWN} roughness={0.9} />
          </mesh>

          {/* Face disk - characteristic owl feature */}
          <mesh position={[0, 0, 0.2]} castShadow>
            <circleGeometry args={[0.3, 16]} />
            <meshStandardMaterial color={FEATHER_LIGHT} roughness={0.95} />
          </mesh>

          {/* === EYES === Large, wise owl eyes */}
          {/* Left eye socket */}
          <mesh position={[-0.12, 0.05, 0.25]}>
            <circleGeometry args={[0.12, 16]} />
            <meshStandardMaterial color={FEATHER_DARK} />
          </mesh>
          {/* Left eye */}
          <mesh position={[-0.12, 0.05, 0.27]}>
            <circleGeometry args={[0.1, 16]} />
            <meshStandardMaterial color={EYE_COLOR} />
          </mesh>
          {/* Left pupil */}
          <mesh position={[-0.12, 0.05, 0.29]}>
            <circleGeometry args={[0.05, 12]} />
            <meshStandardMaterial color={EYE_PUPIL} />
          </mesh>

          {/* Right eye socket */}
          <mesh position={[0.12, 0.05, 0.25]}>
            <circleGeometry args={[0.12, 16]} />
            <meshStandardMaterial color={FEATHER_DARK} />
          </mesh>
          {/* Right eye */}
          <mesh position={[0.12, 0.05, 0.27]}>
            <circleGeometry args={[0.1, 16]} />
            <meshStandardMaterial color={EYE_COLOR} />
          </mesh>
          {/* Right pupil */}
          <mesh position={[0.12, 0.05, 0.29]}>
            <circleGeometry args={[0.05, 12]} />
            <meshStandardMaterial color={EYE_PUPIL} />
          </mesh>

          {/* Beak */}
          <mesh position={[0, -0.08, 0.3]} rotation={[0.3, 0, 0]} castShadow>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} roughness={0.6} />
          </mesh>

          {/* Ear tufts */}
          <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.08, 0.2, 4]} />
            <meshStandardMaterial color={FEATHER_DARK} roughness={0.9} />
          </mesh>
          <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.3]} castShadow>
            <coneGeometry args={[0.08, 0.2, 4]} />
            <meshStandardMaterial color={FEATHER_DARK} roughness={0.9} />
          </mesh>
        </group>

        {/* === WINGS === */}
        {/* Left wing */}
        <group ref={leftWingRef} position={[-0.35, 0.6, 0]} rotation={[0, 0, 0.3]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.15, 0.5, 6, 8]} />
            <meshStandardMaterial color={FEATHER_DARK} roughness={0.9} />
          </mesh>
          {/* Wing tip feathers */}
          <mesh position={[0, -0.35, 0]} castShadow>
            <coneGeometry args={[0.12, 0.25, 5]} />
            <meshStandardMaterial color={FEATHER_BROWN} roughness={0.9} />
          </mesh>
        </group>

        {/* Right wing */}
        <group ref={rightWingRef} position={[0.35, 0.6, 0]} rotation={[0, 0, -0.3]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.15, 0.5, 6, 8]} />
            <meshStandardMaterial color={FEATHER_DARK} roughness={0.9} />
          </mesh>
          {/* Wing tip feathers */}
          <mesh position={[0, -0.35, 0]} castShadow>
            <coneGeometry args={[0.12, 0.25, 5]} />
            <meshStandardMaterial color={FEATHER_BROWN} roughness={0.9} />
          </mesh>
        </group>

        {/* === FEET === */}
        {/* Left foot */}
        <group position={[-0.15, 0.08, 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color={BEAK_COLOR} roughness={0.7} />
          </mesh>
          {/* Talons */}
          <mesh position={[-0.04, -0.02, 0.04]} rotation={[0.5, 0.3, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} />
          </mesh>
          <mesh position={[0, -0.02, 0.06]} rotation={[0.5, 0, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} />
          </mesh>
          <mesh position={[0.04, -0.02, 0.04]} rotation={[0.5, -0.3, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} />
          </mesh>
        </group>

        {/* Right foot */}
        <group position={[0.15, 0.08, 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color={BEAK_COLOR} roughness={0.7} />
          </mesh>
          {/* Talons */}
          <mesh position={[-0.04, -0.02, 0.04]} rotation={[0.5, 0.3, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} />
          </mesh>
          <mesh position={[0, -0.02, 0.06]} rotation={[0.5, 0, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} />
          </mesh>
          <mesh position={[0.04, -0.02, 0.04]} rotation={[0.5, -0.3, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={BEAK_COLOR} />
          </mesh>
        </group>

        {/* === TAIL === */}
        <mesh position={[0, 0.3, -0.35]} rotation={[-0.3, 0, 0]} castShadow>
          <coneGeometry args={[0.15, 0.3, 6]} />
          <meshStandardMaterial color={FEATHER_BROWN} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
