"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CLOCK_RADIUS, CLOCK_THICKNESS, getHandAngles } from "@/utils/clockMath";

// Cat sits at 3 o'clock position (opposite of rabbit at 9 o'clock)
const CAT_SECOND = 15; // 15 seconds = 3 o'clock position
const CAT_DISTANCE = CLOCK_RADIUS * 0.6;
const CAT_SCALE = 0.38;

// Position angle - offset by PI because clock hand angles are opposite to position angles
const CAT_POSITION_ANGLE = (CAT_SECOND * 6 * Math.PI) / 180 + Math.PI;

// Export position for interaction detection
export const CAT_POS_X = Math.sin(CAT_POSITION_ANGLE) * CAT_DISTANCE;
export const CAT_POS_Z = Math.cos(CAT_POSITION_ANGLE) * CAT_DISTANCE;

// Colors - Black cat with glowing eyes (like in Shadow Hunt game)
const FUR_COLOR = "#0a0a0a"; // Pure black
const FUR_LIGHT = "#1a1a1a"; // Slightly lighter black
const FUR_DARK = "#050505"; // Even darker black
const FUR_CREAM = "#151515"; // Dark gray for belly/chest
const NOSE_COLOR = "#333333"; // Dark gray nose
const EYE_COLOR = "#00ff00"; // Bright glowing green
const EYE_PUPIL = "#003300"; // Dark green pupils
const EYE_GLOW = true; // Enable glow effect

// Jump settings - cats jump gracefully with extended hang time
const JUMP_HEIGHT = 1.9;       // Higher jump than rabbit
const JUMP_DURATION = 1.4;     // Longer duration for more hang time
const JUMP_COOLDOWN = 2000;    // ms cooldown between jumps
const HANG_TIME_FACTOR = 0.6;  // Extended hang time at peak

// Hand collision settings
const HAND_WIDTH = 0.25;
const HOUR_HAND_LENGTH = CLOCK_RADIUS * 0.5;
const MINUTE_HAND_LENGTH = CLOCK_RADIUS * 0.7;
const HAND_HEIGHT = 0.15;

export default function Cat() {
  const groupRef = useRef();
  const bodyRef = useRef();
  const tailRef = useRef();
  const jumpState = useRef({
    isJumping: false,
    jumpTime: 0,
    lastJumpTime: 0,
  });

  // Position at 3 o'clock
  const posX = CAT_POS_X;
  const posZ = CAT_POS_Z;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const state = jumpState.current;
    const now = Date.now();

    // Get current second from real time
    const date = new Date();
    const currentSecond = date.getSeconds();
    const currentMs = date.getMilliseconds();

    // Calculate how close the second hand is to cat position
    let secondDiff = currentSecond - CAT_SECOND;

    // Handle wrap around
    if (secondDiff < -30) secondDiff += 60;
    if (secondDiff > 30) secondDiff -= 60;

    // Jump earlier - when second hand is ~1.5 seconds before reaching cat
    // This gives time for the jump to peak when the hand passes underneath
    const shouldJump = (secondDiff === -2 && currentMs > 400) || (secondDiff === -1 && currentMs < 100);
    const canJump = (now - state.lastJumpTime) > JUMP_COOLDOWN;

    if (shouldJump && !state.isJumping && canJump) {
      state.isJumping = true;
      state.jumpTime = 0;
      state.lastJumpTime = now;
    }

    // Tail animation - always swishing
    if (tailRef.current) {
      const tailSwish = Math.sin(Date.now() / 400) * 0.3;
      tailRef.current.rotation.x = -0.8 + tailSwish * 0.2;
      tailRef.current.rotation.z = tailSwish;
    }

    // Handle jump animation
    if (state.isJumping) {
      state.jumpTime += delta;
      const t = state.jumpTime / JUMP_DURATION;

      if (t >= 1) {
        // Jump complete
        state.isJumping = false;
        groupRef.current.position.y = CLOCK_THICKNESS / 2;
        if (bodyRef.current) {
          bodyRef.current.rotation.x = 0;
        }
      } else {
        // Modified jump curve with hang time at peak
        let easedT;
        if (t < 0.5) {
          const riseT = t * 2;
          easedT = riseT * riseT * (3 - 2 * riseT);
          easedT = easedT * 0.5;
        } else {
          const fallT = (t - 0.5) * 2;
          const hangAdjusted = Math.pow(fallT, 1 - HANG_TIME_FACTOR);
          easedT = 0.5 + hangAdjusted * hangAdjusted * (3 - 2 * hangAdjusted) * 0.5;
        }

        const jumpProgress = Math.sin(easedT * Math.PI);
        groupRef.current.position.y = CLOCK_THICKNESS / 2 + jumpProgress * JUMP_HEIGHT;

        // Cat arches back during jump
        if (bodyRef.current) {
          const archAmount = t < 0.5 ? jumpProgress * 0.3 : jumpProgress * 0.15;
          bodyRef.current.rotation.x = archAmount;
        }
      }
    } else {
      // Check if cat is standing on hour or minute hand
      const angles = getHandAngles(date);
      let onHandHeight = 0;

      // Check hour hand collision
      const hourHandAngle = angles.hour;
      const hourHandDir = { x: Math.sin(hourHandAngle), z: Math.cos(hourHandAngle) };
      const hourDot = posX * hourHandDir.x + posZ * hourHandDir.z;
      const hourPerp = Math.abs(posX * hourHandDir.z - posZ * hourHandDir.x);
      if (hourDot > 0 && hourDot < HOUR_HAND_LENGTH && hourPerp < HAND_WIDTH) {
        onHandHeight = Math.max(onHandHeight, HAND_HEIGHT);
      }

      // Check minute hand collision
      const minuteHandAngle = angles.minute;
      const minuteHandDir = { x: Math.sin(minuteHandAngle), z: Math.cos(minuteHandAngle) };
      const minuteDot = posX * minuteHandDir.x + posZ * minuteHandDir.z;
      const minutePerp = Math.abs(posX * minuteHandDir.z - posZ * minuteHandDir.x);
      if (minuteDot > 0 && minuteDot < MINUTE_HAND_LENGTH && minutePerp < HAND_WIDTH) {
        onHandHeight = Math.max(onHandHeight, HAND_HEIGHT + 0.05);
      }

      groupRef.current.position.y = CLOCK_THICKNESS / 2 + onHandHeight;

      // Idle animation - subtle breathing and ear twitches
      const breathe = Math.sin(Date.now() / 700) * 0.015;
      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[posX, CLOCK_THICKNESS / 2, posZ]}
      rotation={[0, -CAT_POSITION_ANGLE + Math.PI, 0]} // Face center of clock
      scale={[CAT_SCALE, CAT_SCALE, CAT_SCALE]}
    >
      <group ref={bodyRef}>
        {/* === BODY === */}
        {/* Main body - sleek oval */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.4, 16, 14]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>

        {/* Back/haunches */}
        <mesh position={[0, 0.3, -0.25]} castShadow>
          <sphereGeometry args={[0.38, 14, 12]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>

        {/* Belly - cream colored */}
        <mesh position={[0, 0.25, 0.1]} castShadow>
          <sphereGeometry args={[0.28, 12, 10]} />
          <meshStandardMaterial color={FUR_CREAM} roughness={0.9} />
        </mesh>

        {/* Stripes on back */}
        {[-0.12, 0, 0.12].map((offset, i) => (
          <mesh key={i} position={[0, 0.52, offset]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.03, 0.25, 4, 8]} />
            <meshStandardMaterial color={FUR_DARK} roughness={0.85} />
          </mesh>
        ))}

        {/* === HEAD === */}
        <group position={[0, 0.65, 0.35]}>
          {/* Head base - rounder than rabbit */}
          <mesh castShadow>
            <sphereGeometry args={[0.32, 14, 12]} />
            <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
          </mesh>

          {/* Cheeks - fluffy */}
          <mesh position={[0.18, -0.08, 0.15]} castShadow>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshStandardMaterial color={FUR_LIGHT} roughness={0.9} />
          </mesh>
          <mesh position={[-0.18, -0.08, 0.15]} castShadow>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshStandardMaterial color={FUR_LIGHT} roughness={0.9} />
          </mesh>

          {/* Muzzle */}
          <mesh position={[0, -0.08, 0.25]} castShadow>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color={FUR_CREAM} roughness={0.9} />
          </mesh>

          {/* Nose - pink triangle */}
          <mesh position={[0, -0.02, 0.35]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={NOSE_COLOR} roughness={0.5} />
          </mesh>

          {/* Eyes - glowing green like in Shadow Hunt */}
          {/* Left eye */}
          <group position={[-0.11, 0.05, 0.22]}>
            <mesh>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color={EYE_COLOR} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color={EYE_COLOR} />
            </mesh>
            <mesh position={[0, 0, 0.055]}>
              <sphereGeometry args={[0.025, 6, 6]} />
              <meshStandardMaterial color={EYE_PUPIL} roughness={0.2} />
            </mesh>
            {/* Glow light */}
            <pointLight color={EYE_COLOR} intensity={0.8} distance={2} decay={2} />
          </group>

          {/* Right eye */}
          <group position={[0.11, 0.05, 0.22]}>
            <mesh>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color={EYE_COLOR} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color={EYE_COLOR} />
            </mesh>
            <mesh position={[0, 0, 0.055]}>
              <sphereGeometry args={[0.025, 6, 6]} />
              <meshStandardMaterial color={EYE_PUPIL} roughness={0.2} />
            </mesh>
            {/* Glow light */}
            <pointLight color={EYE_COLOR} intensity={0.8} distance={2} decay={2} />
          </group>

          {/* === EARS - Pointy cat ears === */}
          {/* Left ear */}
          <group position={[-0.18, 0.28, 0]} rotation={[0.1, -0.2, -0.2]}>
            <mesh castShadow>
              <coneGeometry args={[0.1, 0.25, 4]} />
              <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
            </mesh>
            {/* Inner ear - pink */}
            <mesh position={[0.01, -0.02, 0.03]} scale={[0.6, 0.8, 0.6]}>
              <coneGeometry args={[0.08, 0.18, 4]} />
              <meshStandardMaterial color={NOSE_COLOR} roughness={0.8} />
            </mesh>
          </group>

          {/* Right ear */}
          <group position={[0.18, 0.28, 0]} rotation={[0.1, 0.2, 0.2]}>
            <mesh castShadow>
              <coneGeometry args={[0.1, 0.25, 4]} />
              <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
            </mesh>
            {/* Inner ear - pink */}
            <mesh position={[-0.01, -0.02, 0.03]} scale={[0.6, 0.8, 0.6]}>
              <coneGeometry args={[0.08, 0.18, 4]} />
              <meshStandardMaterial color={NOSE_COLOR} roughness={0.8} />
            </mesh>
          </group>

          {/* Whiskers - simplified as small lines */}
          {/* Left whiskers */}
          {[-0.1, 0, 0.1].map((yOff, i) => (
            <mesh key={`wl${i}`} position={[-0.22, -0.05 + yOff * 0.3, 0.22]} rotation={[0, 0.3, yOff]}>
              <cylinderGeometry args={[0.003, 0.003, 0.2, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          ))}
          {/* Right whiskers */}
          {[-0.1, 0, 0.1].map((yOff, i) => (
            <mesh key={`wr${i}`} position={[0.22, -0.05 + yOff * 0.3, 0.22]} rotation={[0, -0.3, -yOff]}>
              <cylinderGeometry args={[0.003, 0.003, 0.2, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          ))}
        </group>

        {/* === LEGS === */}
        {/* Front legs - slender */}
        <mesh position={[0.12, 0.12, 0.15]} rotation={[0.2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.22, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>
        <mesh position={[-0.12, 0.12, 0.15]} rotation={[0.2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.22, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>

        {/* Front paws */}
        <mesh position={[0.12, 0.02, 0.22]} castShadow>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshStandardMaterial color={FUR_LIGHT} roughness={0.9} />
        </mesh>
        <mesh position={[-0.12, 0.02, 0.22]} castShadow>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshStandardMaterial color={FUR_LIGHT} roughness={0.9} />
        </mesh>

        {/* Back legs - muscular haunches */}
        <mesh position={[0.15, 0.18, -0.28]} rotation={[-0.4, 0, 0.2]} castShadow>
          <capsuleGeometry args={[0.1, 0.25, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>
        <mesh position={[-0.15, 0.18, -0.28]} rotation={[-0.4, 0, -0.2]} castShadow>
          <capsuleGeometry args={[0.1, 0.25, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>

        {/* Back paws */}
        <mesh position={[0.18, 0.03, -0.18]} castShadow>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color={FUR_LIGHT} roughness={0.9} />
        </mesh>
        <mesh position={[-0.18, 0.03, -0.18]} castShadow>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color={FUR_LIGHT} roughness={0.9} />
        </mesh>
      </group>

      {/* === TAIL - Animated separately === */}
      <group ref={tailRef} position={[0, 0.4, -0.45]} rotation={[-0.8, 0, 0]}>
        {/* Tail base */}
        <mesh castShadow>
          <capsuleGeometry args={[0.05, 0.3, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>
        {/* Tail middle */}
        <mesh position={[0, 0.25, 0]} rotation={[0.3, 0, 0]} castShadow>
          <capsuleGeometry args={[0.045, 0.25, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.85} />
        </mesh>
        {/* Tail tip - darker stripe */}
        <mesh position={[0, 0.45, 0.08]} rotation={[0.4, 0, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.2, 6, 8]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
