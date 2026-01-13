"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CLOCK_RADIUS, CLOCK_THICKNESS, getHandAngles } from "@/utils/clockMath";

// Frog sits at 6 o'clock position (south)
const FROG_SECOND = 30; // 30 seconds = 6 o'clock position
const FROG_DISTANCE = CLOCK_RADIUS * 0.6;
const FROG_SCALE = 0.32;

// Position angle (30 seconds = 180 degrees = PI radians = 6 o'clock)
const FROG_POSITION_ANGLE = (FROG_SECOND * 6 * Math.PI) / 180;

// Export position for interaction detection
export const FROG_POS_X = Math.sin(FROG_POSITION_ANGLE) * FROG_DISTANCE;
export const FROG_POS_Z = Math.cos(FROG_POSITION_ANGLE) * FROG_DISTANCE;

// Colors - Green tree frog
const SKIN_COLOR = "#2E8B57"; // Sea green
const SKIN_LIGHT = "#3CB371"; // Medium sea green
const SKIN_DARK = "#228B22"; // Forest green
const BELLY_COLOR = "#98FB98"; // Pale green
const EYE_COLOR = "#FFD700"; // Gold
const EYE_PUPIL = "#000000";

// Jump settings - frogs have powerful legs and extended hang time
const JUMP_HEIGHT = 2.2;       // Higher to clear second hand
const JUMP_DURATION = 1.7;     // Extended hang time
const JUMP_COOLDOWN = 2000;
const HANG_TIME_FACTOR = 0.55; // Extended hang time at peak

// Hand collision settings
const HAND_WIDTH = 0.25;
const HOUR_HAND_LENGTH = CLOCK_RADIUS * 0.5;
const MINUTE_HAND_LENGTH = CLOCK_RADIUS * 0.7;
const HAND_HEIGHT = 0.15;

export default function Frog() {
  const groupRef = useRef();
  const bodyRef = useRef();
  const jumpState = useRef({
    isJumping: false,
    jumpTime: 0,
    lastJumpTime: 0,
  });

  // Position at 6 o'clock
  const posX = FROG_POS_X;
  const posZ = FROG_POS_Z;

  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    const state = jumpState.current;
    const now = Date.now();

    // Get current second from real time
    const date = new Date();
    const currentSecond = date.getSeconds();
    const currentMs = date.getMilliseconds();

    // Calculate how close the second hand is to frog position
    let secondDiff = currentSecond - FROG_SECOND;
    if (secondDiff < -30) secondDiff += 60;
    if (secondDiff > 30) secondDiff -= 60;

    // Jump when second hand is ~0.8 seconds before reaching frog
    // This gives time for the jump to peak when the hand passes underneath
    const shouldJump = (secondDiff === -1 && currentMs > 200) || (secondDiff === 0 && currentMs < 100);
    const canJump = (now - state.lastJumpTime) > JUMP_COOLDOWN;

    if (shouldJump && !state.isJumping && canJump) {
      state.isJumping = true;
      state.jumpTime = 0;
      state.lastJumpTime = now;
    }

    // Handle jump animation with hang time
    if (state.isJumping) {
      state.jumpTime += delta;
      const t = state.jumpTime / JUMP_DURATION;

      if (t >= 1) {
        state.isJumping = false;
        groupRef.current.position.y = CLOCK_THICKNESS / 2;
        bodyRef.current.rotation.x = 0;
      } else {
        // Modified jump curve with hang time at peak
        let easedT;
        if (t < 0.5) {
          // Rising phase - ease in
          const riseT = t * 2;
          easedT = riseT * riseT * (3 - 2 * riseT);
          easedT = easedT * 0.5;
        } else {
          // Falling phase with hang time
          const fallT = (t - 0.5) * 2;
          const hangAdjusted = Math.pow(fallT, 1 - HANG_TIME_FACTOR);
          easedT = 0.5 + hangAdjusted * hangAdjusted * (3 - 2 * hangAdjusted) * 0.5;
        }
        const jumpProgress = Math.sin(easedT * Math.PI);
        groupRef.current.position.y = CLOCK_THICKNESS / 2 + jumpProgress * JUMP_HEIGHT;
        // Frog tucks legs during jump
        bodyRef.current.rotation.x = jumpProgress * 0.3;
      }
    } else {
      // Check if frog is standing on hour or minute hand
      const angles = getHandAngles(date);
      let onHandHeight = 0;

      const hourHandAngle = angles.hour;
      const hourHandDir = { x: Math.sin(hourHandAngle), z: Math.cos(hourHandAngle) };
      const hourDot = posX * hourHandDir.x + posZ * hourHandDir.z;
      const hourPerp = Math.abs(posX * hourHandDir.z - posZ * hourHandDir.x);
      if (hourDot > 0 && hourDot < HOUR_HAND_LENGTH && hourPerp < HAND_WIDTH) {
        onHandHeight = Math.max(onHandHeight, HAND_HEIGHT);
      }

      const minuteHandAngle = angles.minute;
      const minuteHandDir = { x: Math.sin(minuteHandAngle), z: Math.cos(minuteHandAngle) };
      const minuteDot = posX * minuteHandDir.x + posZ * minuteHandDir.z;
      const minutePerp = Math.abs(posX * minuteHandDir.z - posZ * minuteHandDir.x);
      if (minuteDot > 0 && minuteDot < MINUTE_HAND_LENGTH && minutePerp < HAND_WIDTH) {
        onHandHeight = Math.max(onHandHeight, HAND_HEIGHT + 0.05);
      }

      groupRef.current.position.y = CLOCK_THICKNESS / 2 + onHandHeight;

      // Idle animation - subtle breathing
      const breathe = Math.sin(Date.now() / 600) * 0.015;
      bodyRef.current.position.y = breathe;
      bodyRef.current.rotation.x = 0;

      // Occasional throat pulse
      const throatPulse = Math.sin(Date.now() / 400) * 0.02;
      bodyRef.current.scale.z = 1 + throatPulse * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[posX, CLOCK_THICKNESS / 2, posZ]}
      rotation={[0, -FROG_POSITION_ANGLE, 0]} // Face outward (away from center)
      scale={[FROG_SCALE, FROG_SCALE, FROG_SCALE]}
    >
      <group ref={bodyRef}>
        {/* === BODY - squat and round === */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <sphereGeometry args={[0.45, 16, 14]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
        </mesh>

        {/* Belly - lighter */}
        <mesh position={[0, 0.2, 0.25]} castShadow>
          <sphereGeometry args={[0.35, 12, 10]} />
          <meshStandardMaterial color={BELLY_COLOR} roughness={0.9} />
        </mesh>

        {/* === HEAD - wide and flat === */}
        <group position={[0, 0.4, 0.35]}>
          {/* Head base - wide */}
          <mesh castShadow>
            <sphereGeometry args={[0.35, 14, 12]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>

          {/* Wide mouth */}
          <mesh position={[0, -0.1, 0.2]} castShadow>
            <sphereGeometry args={[0.28, 12, 8]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>

          {/* Left eye bulge */}
          <group position={[-0.2, 0.2, 0.1]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 10, 10]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
            </mesh>
            {/* Eye */}
            <mesh position={[0, 0.05, 0.1]}>
              <sphereGeometry args={[0.1, 10, 10]} />
              <meshStandardMaterial color={EYE_COLOR} roughness={0.3} />
            </mesh>
            {/* Pupil - horizontal slit */}
            <mesh position={[0, 0.05, 0.15]} scale={[1.5, 0.5, 1]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={EYE_PUPIL} roughness={0.2} />
            </mesh>
          </group>

          {/* Right eye bulge */}
          <group position={[0.2, 0.2, 0.1]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 10, 10]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
            </mesh>
            {/* Eye */}
            <mesh position={[0, 0.05, 0.1]}>
              <sphereGeometry args={[0.1, 10, 10]} />
              <meshStandardMaterial color={EYE_COLOR} roughness={0.3} />
            </mesh>
            {/* Pupil - horizontal slit */}
            <mesh position={[0, 0.05, 0.15]} scale={[1.5, 0.5, 1]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={EYE_PUPIL} roughness={0.2} />
            </mesh>
          </group>

          {/* Nostrils */}
          <mesh position={[-0.06, 0, 0.3]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.9} />
          </mesh>
          <mesh position={[0.06, 0, 0.3]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.9} />
          </mesh>
        </group>

        {/* === FRONT LEGS === */}
        {/* Left front leg */}
        <group position={[-0.3, 0.1, 0.2]}>
          <mesh rotation={[0.3, 0, 0.4]} castShadow>
            <capsuleGeometry args={[0.06, 0.2, 6, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Foot with toes */}
          <mesh position={[-0.15, -0.05, 0.15]} castShadow>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>
        </group>

        {/* Right front leg */}
        <group position={[0.3, 0.1, 0.2]}>
          <mesh rotation={[0.3, 0, -0.4]} castShadow>
            <capsuleGeometry args={[0.06, 0.2, 6, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Foot */}
          <mesh position={[0.15, -0.05, 0.15]} castShadow>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>
        </group>

        {/* === BACK LEGS - powerful and folded === */}
        {/* Left back leg - thigh */}
        <group position={[-0.35, 0.15, -0.15]}>
          <mesh rotation={[-0.8, 0, 0.3]} castShadow>
            <capsuleGeometry args={[0.1, 0.25, 6, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[-0.15, -0.1, 0.2]} rotation={[0.5, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.2, 6, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Big webbed foot */}
          <mesh position={[-0.2, -0.05, 0.35]} rotation={[-0.3, 0, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>
        </group>

        {/* Right back leg - thigh */}
        <group position={[0.35, 0.15, -0.15]}>
          <mesh rotation={[-0.8, 0, -0.3]} castShadow>
            <capsuleGeometry args={[0.1, 0.25, 6, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0.15, -0.1, 0.2]} rotation={[0.5, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.2, 6, 8]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.8} />
          </mesh>
          {/* Big webbed foot */}
          <mesh position={[0.2, -0.05, 0.35]} rotation={[-0.3, 0, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color={SKIN_LIGHT} roughness={0.85} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
