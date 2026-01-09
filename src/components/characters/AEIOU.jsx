"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// AEIOU color palette - Dark jester with black skin, one red eye, white clothes
const SKIN_COLOR = "#0a0a0a"; // Pure black skin
const ROBE_PRIMARY = "#f0f0f0"; // White robe
const ROBE_SECONDARY = "#e0e0e0"; // Light gray white
const DIAMOND_GOLD = "#9d7b3a"; // Tarnished gold
const DIAMOND_WHITE = "#ffffff"; // White diamonds
const HAT_COLOR = "#888888"; // Gray hat
const HAT_ACCENT = "#a0a0a0"; // Lighter gray accent
const BELL_COLOR = "#8b7355"; // Aged bronze
const EYE_COLOR = "#ff0000"; // Red eye
const GLOW_COLOR = "#ff3333"; // Red glow beneath feet
const SHOE_COLOR = "#1f1f1f"; // Nearly black
const COLLAR_COLOR = "#f0f0f0"; // White collar

// Jester bell component
function Bell({ position, scale = 1 }) {
  const bellRef = useRef();
  const swingOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(() => {
    if (bellRef.current) {
      const swing = Math.sin(Date.now() / 300 + swingOffset) * 0.15;
      bellRef.current.rotation.z = swing;
      bellRef.current.rotation.x = swing * 0.5;
    }
  });

  return (
    <group ref={bellRef} position={position} scale={[scale, scale, scale]}>
      <mesh>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={BELL_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * AEIOU - Consistent gnome/elf character (Dark jester with black skin, one red eye)
 * Props:
 * - position: [x, y, z] position
 * - scale: overall scale (default 0.35)
 * - animate: whether to enable idle animation (default true)
 * - glowIntensity: red foot glow intensity (default 0.5)
 * - victoryCeremony: whether in victory pose (default false)
 * - found: if true, character is hidden (for hide-and-seek in realms)
 * - variant: 'hub' | 'realm' - affects visibility/glow (default 'hub')
 */
export default function AEIOU({
  position = [0, 0, 0],
  scale = 0.35,
  animate = true,
  glowIntensity = 0.5,
  victoryCeremony = false,
  found = false,
  variant = 'hub'
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const hatRef = useRef();
  const currentRotation = useRef(0);
  const targetRotation = useRef(0);

  useFrame((_, delta) => {
    if (!bodyRef.current || !groupRef.current) return;

    if (animate) {
      // Smooth 180° rotation for victory ceremony - slow and deliberate turn
      targetRotation.current = victoryCeremony ? Math.PI : 0;
      const rotationDiff = targetRotation.current - currentRotation.current;
      if (Math.abs(rotationDiff) > 0.01) {
        // Slow turn speed (1.5 radians per second = ~1 second for 180°)
        const turnSpeed = 1.5 * delta;
        currentRotation.current += Math.sign(rotationDiff) * Math.min(turnSpeed, Math.abs(rotationDiff));
        groupRef.current.rotation.y = currentRotation.current;
      }

      // Creepy swaying animation
      const sway = Math.sin(Date.now() / 1200) * 0.02;
      const bob = Math.sin(Date.now() / 600) * 0.01;
      bodyRef.current.position.y = bob;
      bodyRef.current.rotation.z = sway;

      // Hat jingles
      if (hatRef.current) {
        hatRef.current.rotation.z = Math.sin(Date.now() / 400) * 0.03;
      }
    }
  });

  // Hide if found (for realm hide-and-seek)
  if (found) return null;

  // Enhanced glow for realm variant
  const realmGlow = variant === 'realm' ? 2 : 1;
  const actualGlowIntensity = glowIntensity * realmGlow;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
    >
      <group ref={bodyRef}>
        {/* === CURLY-TOED SHOES === */}
        {/* Left shoe */}
        <group position={[-0.12, 0.05, 0.05]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.06, 0.12, 6, 8]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          {/* Curly toe */}
          <mesh position={[0, -0.02, 0.12]} rotation={[0.8, 0, 0]} castShadow>
            <coneGeometry args={[0.04, 0.12, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0.18]} rotation={[1.5, 0, 0]} castShadow>
            <coneGeometry args={[0.025, 0.08, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          <Bell position={[0, 0.04, 0.22]} scale={0.6} />
        </group>
        {/* Right shoe */}
        <group position={[0.12, 0.05, 0.05]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.06, 0.12, 6, 8]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          {/* Curly toe */}
          <mesh position={[0, -0.02, 0.12]} rotation={[0.8, 0, 0]} castShadow>
            <coneGeometry args={[0.04, 0.12, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0.18]} rotation={[1.5, 0, 0]} castShadow>
            <coneGeometry args={[0.025, 0.08, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          <Bell position={[0, 0.04, 0.22]} scale={0.6} />
        </group>

        {/* === LEGS === */}
        <group position={[-0.08, 0.22, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.18, 6, 8]} />
            <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
          </mesh>
        </group>
        <group position={[0.08, 0.22, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.18, 6, 8]} />
            <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
          </mesh>
        </group>

        {/* === LONG ROBE/COAT with diamond checker pattern === */}
        {/* Lower robe - stacked striped rings for harlequin look */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={`lower-${i}`} position={[0, 0.28 + i * 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.22 - i * 0.01, 0.24 - i * 0.01, 0.06, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? ROBE_PRIMARY : ROBE_SECONDARY}
              roughness={0.85}
            />
          </mesh>
        ))}

        {/* Upper robe - continuing stripes */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`upper-${i}`} position={[0, 0.58 + i * 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.16 - i * 0.01, 0.18 - i * 0.01, 0.05, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? ROBE_SECONDARY : ROBE_PRIMARY}
              roughness={0.85}
            />
          </mesh>
        ))}

        {/* Diamond checker overlay - front */}
        <group position={[0, 0.5, 0.21]}>
          {[-1, 0, 1].map((row) => (
            [-1, 0, 1].map((col) => (
              <mesh
                key={`front-${row}-${col}`}
                position={[col * 0.07, row * 0.1, 0]}
                rotation={[0, 0, Math.PI / 4]}
              >
                <planeGeometry args={[0.065, 0.065]} />
                <meshStandardMaterial
                  color={(row + col) % 2 === 0 ? DIAMOND_GOLD : DIAMOND_WHITE}
                  roughness={0.6}
                  metalness={(row + col) % 2 === 0 ? 0.4 : 0}
                />
              </mesh>
            ))
          ))}
        </group>

        {/* Diamond checker overlay - back */}
        <group position={[0, 0.5, -0.19]} rotation={[0, Math.PI, 0]}>
          {[-1, 0, 1].map((row) => (
            [-1, 0, 1].map((col) => (
              <mesh
                key={`back-${row}-${col}`}
                position={[col * 0.07, row * 0.1, 0]}
                rotation={[0, 0, Math.PI / 4]}
              >
                <planeGeometry args={[0.065, 0.065]} />
                <meshStandardMaterial
                  color={(row + col) % 2 === 0 ? DIAMOND_WHITE : DIAMOND_GOLD}
                  roughness={0.6}
                  metalness={(row + col) % 2 === 1 ? 0.4 : 0}
                />
              </mesh>
            ))
          ))}
        </group>

        {/* Side diamond patches */}
        <group position={[-0.18, 0.5, 0]} rotation={[0, -Math.PI/2, 0]}>
          {[-1, 0, 1].map((row) => (
            <mesh
              key={`left-${row}`}
              position={[0, row * 0.1, 0]}
              rotation={[0, 0, Math.PI / 4]}
            >
              <planeGeometry args={[0.06, 0.06]} />
              <meshStandardMaterial
                color={row % 2 === 0 ? DIAMOND_GOLD : DIAMOND_WHITE}
                roughness={0.6}
                metalness={row % 2 === 0 ? 0.4 : 0}
              />
            </mesh>
          ))}
        </group>
        <group position={[0.18, 0.5, 0]} rotation={[0, Math.PI/2, 0]}>
          {[-1, 0, 1].map((row) => (
            <mesh
              key={`right-${row}`}
              position={[0, row * 0.1, 0]}
              rotation={[0, 0, Math.PI / 4]}
            >
              <planeGeometry args={[0.06, 0.06]} />
              <meshStandardMaterial
                color={row % 2 === 0 ? DIAMOND_WHITE : DIAMOND_GOLD}
                roughness={0.6}
                metalness={row % 2 === 1 ? 0.4 : 0}
              />
            </mesh>
          ))}
        </group>

        {/* Ruffled collar */}
        <group position={[0, 0.72, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * Math.PI / 3) * 0.12,
                0,
                Math.cos(i * Math.PI / 3) * 0.12
              ]}
              rotation={[Math.PI / 6, i * Math.PI / 3, 0]}
            >
              <coneGeometry args={[0.06, 0.08, 6]} />
              <meshStandardMaterial color={COLLAR_COLOR} roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* === HEAD === */}
        <group position={[0, 0.88, 0]}>
          {/* Face - black */}
          <mesh castShadow>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
          </mesh>

          {/* Sharp nose */}
          <mesh position={[0, -0.02, 0.14]} rotation={[-0.3, 0, 0]} castShadow>
            <coneGeometry args={[0.03, 0.1, 6]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.85} />
          </mesh>

          {/* Single cyclops eye - realistic red eye */}
          <group position={[0, 0.02, 0.12]}>
            {/* Eyeball - white sclera */}
            <mesh>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
            </mesh>
            {/* Red iris */}
            <mesh position={[0, 0, 0.025]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial
                color={EYE_COLOR}
                emissive={EYE_COLOR}
                emissiveIntensity={0.3}
                roughness={0.2}
              />
            </mesh>
            {/* Dark pupil */}
            <mesh position={[0, 0, 0.04]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#0a0000" roughness={0.1} />
            </mesh>
            {/* Eye highlight */}
            <mesh position={[0.01, 0.01, 0.045]}>
              <sphereGeometry args={[0.006, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Subtle glow from eye */}
            <pointLight color={EYE_COLOR} intensity={0.4} distance={1} decay={2} />
          </group>

          {/* Empty eye socket on left side - scarred over */}
          <mesh position={[-0.06, 0.02, 0.13]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#050505" roughness={0.9} />
          </mesh>

          {/* Thin, knowing smile */}
          <mesh position={[0, -0.08, 0.12]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.04, 0.008, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#2a1a1a" roughness={0.9} />
          </mesh>

          {/* Slight chin point */}
          <mesh position={[0, -0.14, 0.08]} castShadow>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
          </mesh>

          {/* === POINTED ELF EARS === */}
          {/* Left ear */}
          <group position={[-0.15, 0.02, 0]} rotation={[0, -0.3, -0.2]}>
            <mesh castShadow>
              <coneGeometry args={[0.04, 0.14, 4]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
            </mesh>
            {/* Inner ear detail */}
            <mesh position={[0.01, 0, 0.02]} rotation={[0, 0.2, 0]}>
              <coneGeometry args={[0.025, 0.1, 4]} />
              <meshStandardMaterial color="#151515" roughness={0.9} />
            </mesh>
          </group>
          {/* Right ear */}
          <group position={[0.15, 0.02, 0]} rotation={[0, 0.3, 0.2]}>
            <mesh castShadow>
              <coneGeometry args={[0.04, 0.14, 4]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
            </mesh>
            {/* Inner ear detail */}
            <mesh position={[-0.01, 0, 0.02]} rotation={[0, -0.2, 0]}>
              <coneGeometry args={[0.025, 0.1, 4]} />
              <meshStandardMaterial color="#151515" roughness={0.9} />
            </mesh>
          </group>

          {/* === TALL CONE HAT with gray stripes === */}
          <group ref={hatRef} position={[0, 0.12, 0]}>
            {/* Hat brim - gold band */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.19, 0.17, 0.04, 16]} />
              <meshStandardMaterial color={DIAMOND_GOLD} metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Tall pointed hat with gray stripes - built from stacked rings */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const baseRadius = 0.16;
              const height = 0.06;
              const taper = 0.018;
              const yPos = 0.02 + i * height;
              const topR = baseRadius - (i + 1) * taper;
              const botR = baseRadius - i * taper;
              return (
                <mesh key={i} position={[0, yPos, 0]} castShadow>
                  <cylinderGeometry args={[topR, botR, height, 12]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? HAT_COLOR : HAT_ACCENT}
                    roughness={0.8}
                  />
                </mesh>
              );
            })}

            {/* Hat tip - curves slightly forward */}
            <group position={[0, 0.52, 0.04]} rotation={[0.4, 0, 0]}>
              <mesh castShadow>
                <coneGeometry args={[0.04, 0.15, 8]} />
                <meshStandardMaterial color={HAT_COLOR} roughness={0.8} />
              </mesh>
              {/* Bell at tip */}
              <Bell position={[0, -0.1, 0]} scale={0.9} />
            </group>

            {/* Diamond pattern band around base */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <mesh
                key={`diamond-${i}`}
                position={[
                  Math.sin(i * Math.PI / 4) * 0.17,
                  0.0,
                  Math.cos(i * Math.PI / 4) * 0.17
                ]}
                rotation={[Math.PI/2, i * Math.PI / 4, Math.PI/4]}
              >
                <planeGeometry args={[0.035, 0.035]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? DIAMOND_GOLD : DIAMOND_WHITE}
                  metalness={i % 2 === 0 ? 0.5 : 0}
                  roughness={0.5}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* === ARMS - Naturally hanging at sides === */}
        {/* Left arm - upper */}
        <group position={[-0.18, 0.58, 0]}>
          <mesh castShadow rotation={[0, 0, 0.15]}>
            <capsuleGeometry args={[0.05, 0.15, 6, 8]} />
            <meshStandardMaterial color={ROBE_PRIMARY} roughness={0.85} />
          </mesh>
          {/* Left forearm - hanging down */}
          <group position={[-0.04, -0.12, 0.02]} rotation={[0.3, 0, 0.1]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.04, 0.16, 6, 8]} />
              <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
            </mesh>
            {/* Sleeve cuff */}
            <mesh position={[0, -0.1, 0]}>
              <torusGeometry args={[0.045, 0.012, 6, 8]} />
              <meshStandardMaterial color={DIAMOND_GOLD} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Left hand - with fingers */}
            <group position={[0, -0.14, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[(i - 1.5) * 0.015, -0.04, 0.01]} castShadow>
                  <capsuleGeometry args={[0.008, 0.025, 4, 4]} />
                  <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
                </mesh>
              ))}
              {/* Thumb */}
              <mesh position={[0.03, -0.02, 0.02]} rotation={[0, 0, -0.5]} castShadow>
                <capsuleGeometry args={[0.008, 0.02, 4, 4]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right arm - upper */}
        <group position={[0.18, 0.58, 0]}>
          <mesh castShadow rotation={[0, 0, -0.15]}>
            <capsuleGeometry args={[0.05, 0.15, 6, 8]} />
            <meshStandardMaterial color={ROBE_PRIMARY} roughness={0.85} />
          </mesh>
          {/* Right forearm - hanging down */}
          <group position={[0.04, -0.12, 0.02]} rotation={[0.3, 0, -0.1]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.04, 0.16, 6, 8]} />
              <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
            </mesh>
            {/* Sleeve cuff */}
            <mesh position={[0, -0.1, 0]}>
              <torusGeometry args={[0.045, 0.012, 6, 8]} />
              <meshStandardMaterial color={DIAMOND_GOLD} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Right hand - with fingers */}
            <group position={[0, -0.14, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[(i - 1.5) * 0.015, -0.04, 0.01]} castShadow>
                  <capsuleGeometry args={[0.008, 0.025, 4, 4]} />
                  <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
                </mesh>
              ))}
              {/* Thumb */}
              <mesh position={[-0.03, -0.02, 0.02]} rotation={[0, 0, 0.5]} castShadow>
                <capsuleGeometry args={[0.008, 0.02, 4, 4]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Subtle magical aura from eye */}
        <pointLight
          position={[0, 0.9, 0.2]}
          color={EYE_COLOR}
          intensity={0.3}
          distance={1.5}
        />
      </group>
    </group>
  );
}

// Export position constants for consistency
export const AEIOU_SCALE = 0.35;
