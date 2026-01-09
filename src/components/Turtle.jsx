"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { CLOCK_RADIUS, CLOCK_THICKNESS } from "@/utils/clockMath";

// Turtle scale - crawling turtle is lower to ground
const TURTLE_SCALE = (CLOCK_RADIUS * 2) / 14;

// Colors - professional palette
const SKIN_COLOR = "#2d5a3d"; // Deep forest green
const SKIN_COLOR_LIGHT = "#3d7a4d"; // Lighter green for highlights

// Shell colors - rich variety for realistic look
const SHELL_BASE = "#3d2e1a"; // Dark brown base
const SHELL_VERTEBRAL = "#5c4422"; // Darker center scutes
const SHELL_COSTAL_DARK = "#6b5030"; // Costal scutes darker
const SHELL_COSTAL_LIGHT = "#8b6b42"; // Costal scutes lighter
const SHELL_MARGINAL = "#4a3820"; // Edge scutes
const SHELL_HIGHLIGHT = "#a08555"; // Highlights on raised areas
const SHELL_GROOVE = "#2a1f10"; // Dark grooves between scutes

// Animation constants
const IDLE_BREATH_SPEED = 1.2;
const IDLE_BREATH_AMOUNT = 0.01;
const WALK_CYCLE_SPEED = 12;
const LEG_SWING_AMOUNT = 0.35;
const HEAD_BOB_AMOUNT = 0.03;
const ANIMATION_BLEND_SPEED = 8;

const Turtle = forwardRef(function Turtle({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isWalking = false,
}, ref) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const frontLeftLegRef = useRef();
  const frontRightLegRef = useRef();
  const backLeftLegRef = useRef();
  const backRightLegRef = useRef();

  // Animation state
  const animState = useRef({
    time: 0,
    blend: 0,
  });

  // Expose the group ref to parent
  useImperativeHandle(ref, () => groupRef.current);

  // Animation loop
  useFrame((_, delta) => {
    animState.current.time += delta;

    // Blend between idle and walking
    const targetBlend = isWalking ? 1 : 0;
    animState.current.blend += (targetBlend - animState.current.blend) * ANIMATION_BLEND_SPEED * delta;
    animState.current.blend = Math.max(0, Math.min(1, animState.current.blend));

    const t = animState.current.time;
    const blend = animState.current.blend;

    // Walk cycle phase
    const walkPhase = t * WALK_CYCLE_SPEED;

    // Idle breathing - subtle shell rise/fall
    const breathe = Math.sin(t * IDLE_BREATH_SPEED * Math.PI * 2) * IDLE_BREATH_AMOUNT;

    if (bodyRef.current) {
      bodyRef.current.position.y = breathe * (1 - blend * 0.5);
    }

    // Head bob when walking
    if (headRef.current) {
      const headBob = Math.sin(walkPhase * 2) * HEAD_BOB_AMOUNT * blend;
      headRef.current.position.y = 0.12 + headBob;
      headRef.current.position.z = 0.45 + Math.abs(headBob) * 0.5;
    }

    // Leg animation - diagonal pairs move together (turtle gait)
    const legSwing1 = Math.sin(walkPhase) * LEG_SWING_AMOUNT * blend;
    const legSwing2 = Math.sin(walkPhase + Math.PI) * LEG_SWING_AMOUNT * blend;

    // Front-left and back-right move together
    if (frontLeftLegRef.current) {
      frontLeftLegRef.current.rotation.x = legSwing1;
      frontLeftLegRef.current.rotation.z = -legSwing1 * 0.3;
    }
    if (backRightLegRef.current) {
      backRightLegRef.current.rotation.x = legSwing1;
      backRightLegRef.current.rotation.z = legSwing1 * 0.3;
    }

    // Front-right and back-left move together
    if (frontRightLegRef.current) {
      frontRightLegRef.current.rotation.x = legSwing2;
      frontRightLegRef.current.rotation.z = legSwing2 * 0.3;
    }
    if (backLeftLegRef.current) {
      backLeftLegRef.current.rotation.x = legSwing2;
      backLeftLegRef.current.rotation.z = -legSwing2 * 0.3;
    }
  });

  // Y offset so turtle stands ON the clock
  const yOffset = CLOCK_THICKNESS / 2;

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={rotation}
      scale={[TURTLE_SCALE, TURTLE_SCALE, TURTLE_SCALE]}
    >
      {/* Main body group - for breathing animation */}
      <group ref={bodyRef}>

        {/* === BODY - low and flat === */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <sphereGeometry args={[0.35, 16, 12]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>

        {/* === SHELL - REALISTIC POLYGON CARAPACE === */}
        <group position={[0, 0.22, 0]}>
          {/* Shell base - slightly flattened dome shape */}
          <mesh castShadow position={[0, 0, 0]} scale={[1, 0.6, 1.1]}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial
              color={SHELL_BASE}
              roughness={0.6}
              metalness={0.05}
              flatShading={true}
            />
          </mesh>

          {/* === VERTEBRAL SCUTES - 5 down the center spine === */}
          {/* Front vertebral */}
          <mesh position={[0, 0.28, 0.32]} rotation={[-0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.10, 0.04, 5]} />
            <meshStandardMaterial color={SHELL_VERTEBRAL} roughness={0.45} flatShading={true} />
          </mesh>
          {/* Second vertebral */}
          <mesh position={[0, 0.32, 0.16]} rotation={[-0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.12, 0.05, 5]} />
            <meshStandardMaterial color={SHELL_HIGHLIGHT} roughness={0.4} flatShading={true} />
          </mesh>
          {/* Center vertebral - largest, highest point */}
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.06, 5]} />
            <meshStandardMaterial color={SHELL_VERTEBRAL} roughness={0.35} flatShading={true} />
          </mesh>
          {/* Fourth vertebral */}
          <mesh position={[0, 0.31, -0.16]} rotation={[0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.12, 0.05, 5]} />
            <meshStandardMaterial color={SHELL_HIGHLIGHT} roughness={0.4} flatShading={true} />
          </mesh>
          {/* Rear vertebral */}
          <mesh position={[0, 0.26, -0.30]} rotation={[0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.04, 5]} />
            <meshStandardMaterial color={SHELL_VERTEBRAL} roughness={0.45} flatShading={true} />
          </mesh>

          {/* === COSTAL SCUTES - 4 pairs on each side === */}
          {/* Front costal pair */}
          <mesh position={[-0.22, 0.24, 0.26]} rotation={[-0.3, 0.2, 0.35]} castShadow>
            <cylinderGeometry args={[0.10, 0.13, 0.04, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_LIGHT} roughness={0.4} flatShading={true} />
          </mesh>
          <mesh position={[0.22, 0.24, 0.26]} rotation={[-0.3, -0.2, -0.35]} castShadow>
            <cylinderGeometry args={[0.10, 0.13, 0.04, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_LIGHT} roughness={0.4} flatShading={true} />
          </mesh>

          {/* Second costal pair */}
          <mesh position={[-0.28, 0.26, 0.10]} rotation={[-0.1, 0.15, 0.45]} castShadow>
            <cylinderGeometry args={[0.11, 0.14, 0.045, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_DARK} roughness={0.38} flatShading={true} />
          </mesh>
          <mesh position={[0.28, 0.26, 0.10]} rotation={[-0.1, -0.15, -0.45]} castShadow>
            <cylinderGeometry args={[0.11, 0.14, 0.045, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_DARK} roughness={0.38} flatShading={true} />
          </mesh>

          {/* Third costal pair */}
          <mesh position={[-0.28, 0.25, -0.08]} rotation={[0.1, 0.15, 0.45]} castShadow>
            <cylinderGeometry args={[0.11, 0.14, 0.045, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_LIGHT} roughness={0.4} flatShading={true} />
          </mesh>
          <mesh position={[0.28, 0.25, -0.08]} rotation={[0.1, -0.15, -0.45]} castShadow>
            <cylinderGeometry args={[0.11, 0.14, 0.045, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_LIGHT} roughness={0.4} flatShading={true} />
          </mesh>

          {/* Rear costal pair */}
          <mesh position={[-0.20, 0.22, -0.24]} rotation={[0.35, 0.2, 0.4]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.04, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_DARK} roughness={0.42} flatShading={true} />
          </mesh>
          <mesh position={[0.20, 0.22, -0.24]} rotation={[0.35, -0.2, -0.4]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.04, 6]} />
            <meshStandardMaterial color={SHELL_COSTAL_DARK} roughness={0.42} flatShading={true} />
          </mesh>

          {/* === MARGINAL SCUTES - small plates around the edge === */}
          {/* Front marginals - small hexagonal plates */}
          {[-0.18, -0.06, 0.06, 0.18].map((xPos, i) => (
            <mesh key={`front-marg-${i}`} position={[xPos, 0.08, 0.46]} rotation={[-0.7, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.05, 0.02, 6]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? SHELL_MARGINAL : SHELL_COSTAL_DARK}
                roughness={0.5}
                flatShading={true}
              />
            </mesh>
          ))}

          {/* Side marginals - left */}
          {[0.30, 0.12, -0.06, -0.24].map((zPos, i) => (
            <mesh
              key={`marg-left-${i}`}
              position={[-0.42, 0.06, zPos]}
              rotation={[0, 0.15, 0.6]}
            >
              <cylinderGeometry args={[0.04, 0.045, 0.02, 6]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? SHELL_MARGINAL : SHELL_HIGHLIGHT}
                roughness={0.5}
                flatShading={true}
              />
            </mesh>
          ))}

          {/* Side marginals - right */}
          {[0.30, 0.12, -0.06, -0.24].map((zPos, i) => (
            <mesh
              key={`marg-right-${i}`}
              position={[0.42, 0.06, zPos]}
              rotation={[0, -0.15, -0.6]}
            >
              <cylinderGeometry args={[0.04, 0.045, 0.02, 6]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? SHELL_MARGINAL : SHELL_HIGHLIGHT}
                roughness={0.5}
                flatShading={true}
              />
            </mesh>
          ))}

          {/* Rear marginals */}
          {[-0.14, 0, 0.14].map((xPos, i) => (
            <mesh key={`rear-marg-${i}`} position={[xPos, 0.06, -0.42]} rotation={[0.6, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.045, 0.02, 6]} />
              <meshStandardMaterial
                color={i === 1 ? SHELL_MARGINAL : SHELL_COSTAL_DARK}
                roughness={0.5}
                flatShading={true}
              />
            </mesh>
          ))}

        </group>

        {/* === HEAD === */}
        <group ref={headRef} position={[0, 0.12, 0.45]}>
          {/* Head base */}
          <mesh>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial color={SKIN_COLOR} />
          </mesh>

          {/* Snout */}
          <mesh position={[0, -0.02, 0.12]}>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color={SKIN_COLOR_LIGHT} />
          </mesh>

          {/* Eyes */}
          <mesh position={[0.06, 0.04, 0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[-0.06, 0.04, 0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>

          {/* Eye highlights */}
          <mesh position={[0.065, 0.045, 0.1]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.055, 0.045, 0.1]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* === TAIL === */}
        <mesh position={[0, 0.06, -0.40]} rotation={[-Math.PI / 2 - 0.3, 0, 0]}>
          <coneGeometry args={[0.04, 0.15, 8]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>
      </group>

      {/* === LEGS - Four legs for crawling === */}
      {/* Front Left Leg */}
      <group ref={frontLeftLegRef} position={[-0.3, 0.08, 0.25]}>
        <mesh rotation={[0, 0, 0.4]}>
          <capsuleGeometry args={[0.07, 0.2, 6, 10]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>
      </group>

      {/* Front Right Leg */}
      <group ref={frontRightLegRef} position={[0.3, 0.08, 0.25]}>
        <mesh rotation={[0, 0, -0.4]}>
          <capsuleGeometry args={[0.07, 0.2, 6, 10]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>
      </group>

      {/* Back Left Leg */}
      <group ref={backLeftLegRef} position={[-0.28, 0.08, -0.25]}>
        <mesh rotation={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.06, 0.18, 6, 10]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>
      </group>

      {/* Back Right Leg */}
      <group ref={backRightLegRef} position={[0.28, 0.08, -0.25]}>
        <mesh rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.06, 0.18, 6, 10]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>
      </group>
    </group>
  );
});

export default Turtle;

// Export scale for use in other calculations
export { TURTLE_SCALE };
