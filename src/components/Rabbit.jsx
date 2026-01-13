"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CLOCK_RADIUS, CLOCK_THICKNESS, getHandAngles } from "@/utils/clockMath";

// Rabbit sits at 9 o'clock position (left side of clock)
const RABBIT_SECOND = 45; // 45 seconds = 9 o'clock position
const RABBIT_DISTANCE = CLOCK_RADIUS * 0.6;
const RABBIT_SCALE = 0.35;

// Position angle - offset by PI because clock hand angles are opposite to position angles
const RABBIT_POSITION_ANGLE = (RABBIT_SECOND * 6 * Math.PI) / 180 + Math.PI;

// Colors
const FUR_COLOR = "#e8dcd0"; // Warm cream/beige
const FUR_DARK = "#c4b5a5"; // Darker fur for shading
const INNER_EAR = "#e8b4b4"; // Pink inner ear
const NOSE_COLOR = "#d4a5a5"; // Pink nose
const EYE_COLOR = "#2a1810"; // Dark brown eyes

// Jump settings - slower, more fluid hop with extended hang time
const JUMP_HEIGHT = 2.3;       // High enough to clear second hand with margin
const JUMP_DURATION = 1.8;     // Extended hang time
const JUMP_COOLDOWN = 2000;    // ms cooldown between jumps
const HANG_TIME_FACTOR = 0.6;  // Extended hang time at peak (0-1)

// Hand collision settings
const HAND_WIDTH = 0.25;  // Width of clock hands for collision
const HOUR_HAND_LENGTH = CLOCK_RADIUS * 0.5;
const MINUTE_HAND_LENGTH = CLOCK_RADIUS * 0.7;
const HAND_HEIGHT = 0.15;  // How high to lift rabbit when on hand

export default function Rabbit() {
  const groupRef = useRef();
  const bodyRef = useRef();
  const jumpState = useRef({
    isJumping: false,
    jumpTime: 0,
    lastJumpTime: 0,
  });

  // Position at 3 o'clock (positive X)
  const posX = Math.sin(RABBIT_POSITION_ANGLE) * RABBIT_DISTANCE;
  const posZ = Math.cos(RABBIT_POSITION_ANGLE) * RABBIT_DISTANCE;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const state = jumpState.current;
    const now = Date.now();

    // Get current second from real time
    const date = new Date();
    const currentSecond = date.getSeconds();
    const currentMs = date.getMilliseconds();

    // Calculate how close the second hand is to rabbit position
    // Second hand at 15 seconds = 3 o'clock
    let secondDiff = currentSecond - RABBIT_SECOND;

    // Handle wrap around (e.g., second 59 is close to second 0)
    if (secondDiff < -30) secondDiff += 60;
    if (secondDiff > 30) secondDiff -= 60;

    // Jump when second hand is ~1 second before reaching rabbit at 9 o'clock (45 seconds)
    // This gives time for the jump to peak when the hand passes underneath
    // Trigger earlier so rabbit is airborne when hand sweeps past at 9 o'clock position
    const shouldJump = (secondDiff === -1 && currentMs > 300) || (secondDiff === 0 && currentMs < 100);
    const canJump = (now - state.lastJumpTime) > JUMP_COOLDOWN;

    if (shouldJump && !state.isJumping && canJump) {
      state.isJumping = true;
      state.jumpTime = 0;
      state.lastJumpTime = now;
    }

    // Handle jump animation
    if (state.isJumping) {
      state.jumpTime += delta;
      const t = state.jumpTime / JUMP_DURATION;

      if (t >= 1) {
        // Jump complete - soft landing
        state.isJumping = false;
        groupRef.current.position.y = CLOCK_THICKNESS / 2;
        if (bodyRef.current) {
          bodyRef.current.rotation.x = 0;
        }
      } else {
        // Modified jump curve with hang time at peak
        // Uses smoothstep for ease-in-out and modified sine for hang time
        let easedT;
        if (t < 0.5) {
          // Rising phase - ease in with smoothstep
          const riseT = t * 2; // 0 to 1 over first half
          easedT = riseT * riseT * (3 - 2 * riseT); // smoothstep
          easedT = easedT * 0.5; // Scale to 0-0.5
        } else {
          // Falling phase - ease out with smoothstep, but slower start (hang time)
          const fallT = (t - 0.5) * 2; // 0 to 1 over second half
          // Apply hang time by making the curve flatter at the start of fall
          const hangAdjusted = Math.pow(fallT, 1 - HANG_TIME_FACTOR);
          easedT = 0.5 + hangAdjusted * hangAdjusted * (3 - 2 * hangAdjusted) * 0.5;
        }

        // Apply smooth sine curve with the eased time
        const jumpProgress = Math.sin(easedT * Math.PI);
        groupRef.current.position.y = CLOCK_THICKNESS / 2 + jumpProgress * JUMP_HEIGHT;

        // Smooth body rotation - tucks legs during jump, extends on landing
        if (bodyRef.current) {
          // Lean forward during rise, straighten during fall
          const leanAmount = t < 0.5 ? jumpProgress * 0.4 : jumpProgress * 0.2;
          bodyRef.current.rotation.x = leanAmount;
        }
      }
    } else {
      // Check if rabbit is standing on hour or minute hand
      const angles = getHandAngles(date);
      let onHandHeight = 0;

      // Check hour hand collision
      const hourHandAngle = angles.hour;
      const hourHandDir = { x: Math.sin(hourHandAngle), z: Math.cos(hourHandAngle) };
      // Project rabbit position onto hour hand direction
      const hourDot = posX * hourHandDir.x + posZ * hourHandDir.z;
      // Distance from rabbit to hour hand line
      const hourPerp = Math.abs(posX * hourHandDir.z - posZ * hourHandDir.x);
      // Check if rabbit is on the hour hand
      if (hourDot > 0 && hourDot < HOUR_HAND_LENGTH && hourPerp < HAND_WIDTH) {
        onHandHeight = Math.max(onHandHeight, HAND_HEIGHT);
      }

      // Check minute hand collision
      const minuteHandAngle = angles.minute;
      const minuteHandDir = { x: Math.sin(minuteHandAngle), z: Math.cos(minuteHandAngle) };
      const minuteDot = posX * minuteHandDir.x + posZ * minuteHandDir.z;
      const minutePerp = Math.abs(posX * minuteHandDir.z - posZ * minuteHandDir.x);
      if (minuteDot > 0 && minuteDot < MINUTE_HAND_LENGTH && minutePerp < HAND_WIDTH) {
        onHandHeight = Math.max(onHandHeight, HAND_HEIGHT + 0.05); // Minute hand is slightly higher
      }

      // Set rabbit height based on whether it's on a hand
      groupRef.current.position.y = CLOCK_THICKNESS / 2 + onHandHeight;

      // Idle animation - subtle breathing
      const breathe = Math.sin(Date.now() / 800) * 0.02;
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
      rotation={[0, -RABBIT_POSITION_ANGLE + Math.PI, 0]} // Face center of clock
      scale={[RABBIT_SCALE, RABBIT_SCALE, RABBIT_SCALE]}
    >
      <group ref={bodyRef}>
        {/* === BODY === */}
        {/* Main body - oval */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.5, 16, 14]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
        </mesh>

        {/* Lower body / haunches */}
        <mesh position={[0, 0.25, -0.2]} castShadow>
          <sphereGeometry args={[0.45, 14, 12]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
        </mesh>

        {/* Chest - lighter */}
        <mesh position={[0, 0.35, 0.25]} castShadow>
          <sphereGeometry args={[0.3, 12, 10]} />
          <meshStandardMaterial color="#f0e6dc" roughness={0.9} />
        </mesh>

        {/* === HEAD === */}
        <group position={[0, 0.8, 0.3]}>
          {/* Head base */}
          <mesh castShadow>
            <sphereGeometry args={[0.35, 14, 12]} />
            <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
          </mesh>

          {/* Cheeks */}
          <mesh position={[0.15, -0.05, 0.2]} castShadow>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshStandardMaterial color="#f0e6dc" roughness={0.9} />
          </mesh>
          <mesh position={[-0.15, -0.05, 0.2]} castShadow>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshStandardMaterial color="#f0e6dc" roughness={0.9} />
          </mesh>

          {/* Snout */}
          <mesh position={[0, -0.05, 0.28]} castShadow>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#f5ebe3" roughness={0.9} />
          </mesh>

          {/* Nose */}
          <mesh position={[0, 0, 0.38]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={NOSE_COLOR} roughness={0.6} />
          </mesh>

          {/* Eyes */}
          <mesh position={[0.12, 0.08, 0.25]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color={EYE_COLOR} roughness={0.3} />
          </mesh>
          <mesh position={[-0.12, 0.08, 0.25]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color={EYE_COLOR} roughness={0.3} />
          </mesh>

          {/* Eye highlights */}
          <mesh position={[0.14, 0.1, 0.3]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-0.1, 0.1, 0.3]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>

          {/* === EARS === */}
          {/* Left ear */}
          <group position={[-0.15, 0.35, -0.1]} rotation={[0.2, -0.2, -0.15]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.08, 0.5, 6, 12]} />
              <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
            </mesh>
            {/* Inner ear */}
            <mesh position={[0.02, 0, 0.04]}>
              <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
              <meshStandardMaterial color={INNER_EAR} roughness={0.8} />
            </mesh>
          </group>

          {/* Right ear */}
          <group position={[0.15, 0.35, -0.1]} rotation={[0.2, 0.2, 0.15]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.08, 0.5, 6, 12]} />
              <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
            </mesh>
            {/* Inner ear */}
            <mesh position={[-0.02, 0, 0.04]}>
              <capsuleGeometry args={[0.04, 0.35, 4, 8]} />
              <meshStandardMaterial color={INNER_EAR} roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* === LEGS === */}
        {/* Front legs */}
        <mesh position={[0.15, 0.15, 0.2]} rotation={[0.3, 0, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.25, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
        </mesh>
        <mesh position={[-0.15, 0.15, 0.2]} rotation={[0.3, 0, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.25, 6, 8]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
        </mesh>

        {/* Back legs (haunches) */}
        <mesh position={[0.2, 0.2, -0.3]} rotation={[-0.5, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.12, 0.3, 6, 8]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>
        <mesh position={[-0.2, 0.2, -0.3]} rotation={[-0.5, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.12, 0.3, 6, 8]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>

        {/* Feet */}
        <mesh position={[0.22, 0.05, -0.15]} rotation={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
        </mesh>
        <mesh position={[-0.22, 0.05, -0.15]} rotation={[0, -0.3, 0]} castShadow>
          <sphereGeometry args={[0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
        </mesh>

        {/* === TAIL === */}
        <mesh position={[0, 0.35, -0.5]} castShadow>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshStandardMaterial color="#f5f0eb" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}
