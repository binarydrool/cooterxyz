"use client";

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  getHandAngles,
  CLOCK_RADIUS,
  CLOCK_THICKNESS,
  normalizeAngle,
} from "@/utils/clockMath";
import * as THREE from "three";
import Rabbit from "./Rabbit";
import Cat, { CAT_POS_X, CAT_POS_Z } from "./Cat";
import Frog, { FROG_POS_X, FROG_POS_Z } from "./Frog";
import Gnome, { GNOME_POS_X, GNOME_POS_Z } from "./Gnome";
import Portal from "./Portal";

// Hoots - small white owl that rides on the tip of the tail of the second hand
const HOOTS_SCALE = 0.25;
const HOOTS_HAND_OFFSET = CLOCK_RADIUS * -0.25; // At the very tip of the tail end
const HOOTS_INTERACT_DISTANCE = 1.0; // Tighter range so grains take priority

// Hour markers positions (12 positions around the clock)
const HOUR_MARKERS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const radius = CLOCK_RADIUS * 0.85;
  return {
    position: [
      Math.sin(angle) * radius,
      CLOCK_THICKNESS / 2 + 0.02,
      Math.cos(angle) * radius,
    ],
    rotation: [0, -angle, 0],
    isMain: i % 3 === 0,
  };
});

// Catch-up speed (radians per second when catching up)
const CATCHUP_SPEED = Math.PI * 4; // Fast catch-up after déjà vu

// Nox déjà vu settings
const DEJA_VU_TRIGGER_SECOND = 59; // Trigger at 59 seconds
const DEJA_VU_DURATION = 3; // Stop time for 3 FULL seconds

// Nox position - at 12 o'clock, just past the second hand tip
// Second hand tip reaches about CLOCK_RADIUS * 0.67
// Nox sits at 0.72 radius, right at 12 o'clock, ready to jump and block the hand
const NOX_BASE_DISTANCE = CLOCK_RADIUS * 0.72;
const NOX_REST_ANGLE = 0; // 12 o'clock position
const NOX_BLOCK_ANGLE = (59 * 6 * Math.PI) / 180; // 59 second mark

// Calculate rest position (at 12 o'clock)
const NOX_REST_X = 0;
const NOX_REST_Z = NOX_BASE_DISTANCE;

// Gold color
const GOLD_COLOR = new THREE.Color(0xFFD700);

// Sand grain settings
const SAND_GRAIN_RADIUS = 0.15;
const CLAIM_DISTANCE = 1.5; // Grain interaction range - larger than animals so grains take priority
const MAX_GRAINS = 12; // Maximum grains allowed on clock - prevents memory leak
const GRAIN_LIFETIME = 180; // Grains despawn after 3 minutes (180 seconds) if not collected

// Generate random position on clock face
function getRandomClockPosition() {
  const minRadius = CLOCK_RADIUS * 0.3;
  const maxRadius = CLOCK_RADIUS * 0.75;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  const angle = Math.random() * Math.PI * 2;
  return [
    Math.sin(angle) * radius,
    CLOCK_THICKNESS / 2 + 0.1,
    Math.cos(angle) * radius
  ];
}

// Essence colors for grains
const ESSENCE_COLORS = {
  forest: { color: '#00FF00', emissive: '#00AA00' },
  golden: { color: '#FFD700', emissive: '#CC9900' },
  amber: { color: '#FFA500', emissive: '#CC7700' },
  violet: { color: '#9932CC', emissive: '#660099' },
  cyan: { color: '#00CED1', emissive: '#00999A' },
};

// Miles the Inchworm - walks around clock face in 24 hours
const MILES_RADIUS = CLOCK_RADIUS * 0.92; // Near edge but not on outer rim
const MILES_INTERACT_DISTANCE = 0.9; // Tighter range so grains take priority

// Miles the Inchworm - cute little guy that walks around the clock face every 24 hours
function Miles({ dejaVuState, onPositionUpdate }) {
  const groupRef = useRef();
  const segmentsRef = useRef([]);
  const displayedAngle = useRef(0);

  // Animation phase for the inching motion
  const inchPhase = useRef(0);

  // Get current 24-hour angle based on time
  const get24HourAngle = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ms = now.getMilliseconds();

    // Total seconds in 24 hours = 86400
    const totalSeconds = hours * 3600 + minutes * 60 + seconds + ms / 1000;
    // Midnight (0 seconds) = 12 o'clock position (where AEIOU is, z+)
    // Noon (43200 seconds) = 6 o'clock position (z-)
    // Worm moves CLOCKWISE when viewed from above (12→3→6→9→12)
    // At 9:48 PM, worm should be at ~2 o'clock position (approaching 12 from the right)
    // Negative angle makes it go clockwise (positive angle was counter-clockwise)
    return -(totalSeconds / 86400) * Math.PI * 2;
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Freeze during déjà vu
    if (dejaVuState?.isActive) {
      // Keep current position, just animate the body wiggle slightly
      inchPhase.current += delta * 0.5;
    } else {
      // Normal movement - follow 24 hour time
      const targetAngle = get24HourAngle();
      displayedAngle.current = targetAngle;

      // Animate inching motion
      inchPhase.current += delta * 4; // Inch cycle speed
    }

    // Position Miles around the clock
    // Midnight = 12 o'clock (top, z+), Noon = 6 o'clock (bottom, z-)
    // Worm moves CLOCKWISE: at 9:48 PM, worm is at ~2 o'clock (right side, approaching 12)
    const angle = displayedAngle.current;
    const x = Math.sin(angle) * MILES_RADIUS;
    const z = Math.cos(angle) * MILES_RADIUS;
    const y = CLOCK_THICKNESS / 2 + 0.02;

    groupRef.current.position.set(x, y, z);

    // Report position for interaction detection
    if (onPositionUpdate) {
      onPositionUpdate(x, z);
    }
    // Face the direction of travel (tangent, moving clockwise toward 12)
    // Worm should face the direction it's traveling (toward 12 o'clock)
    groupRef.current.rotation.y = angle - Math.PI / 2;

    // Animate the segments for inching motion
    const phase = inchPhase.current;
    const inchCycle = Math.sin(phase) * 0.5 + 0.5; // 0 to 1

    segmentsRef.current.forEach((seg, i) => {
      if (!seg) return;

      // Each segment has a phase offset for wave-like motion
      const segPhase = phase - i * 0.4;
      const segCycle = Math.sin(segPhase);

      // Vertical bobbing - creates the "arch" of the inchworm
      const archHeight = Math.max(0, Math.sin(segPhase * 2)) * 0.15;
      seg.position.y = archHeight;

      // Horizontal compression/extension for inching
      const stretch = 1 + segCycle * 0.15;
      seg.scale.z = stretch;

      // Slight side-to-side wiggle
      seg.position.x = Math.sin(segPhase * 1.5) * 0.02;
    });
  });

  // Segment colors - gradient from bright green to darker
  const segmentColors = [
    '#7CFC00', // Head - bright lawn green
    '#76EE00',
    '#66CD00',
    '#458B00',
    '#228B22', // Middle - forest green
    '#2E8B57',
    '#3CB371',
    '#32CD32', // Tail - lime green
  ];

  return (
    <group ref={groupRef}>
      {/* Body segments - 8 spheres that create the inchworm body */}
      {segmentColors.map((color, i) => {
        const isHead = i === 0;
        const isTail = i === segmentColors.length - 1;
        const segmentSize = isHead ? 0.12 : isTail ? 0.08 : 0.1;
        // Flip so head is at front (+Z) - worm walks forward in direction of travel
        const zPos = (segmentColors.length / 2 - i) * 0.08;

        return (
          <group key={i} ref={el => segmentsRef.current[i] = el} position={[0, 0, zPos]}>
            {/* Main segment body */}
            <mesh scale={[segmentSize, segmentSize * 0.8, segmentSize]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial
                color={color}
                roughness={0.6}
                metalness={0.1}
                emissive={color}
                emissiveIntensity={0.1}
              />
            </mesh>

            {/* Head details */}
            {isHead && (
              <>
                {/* Eyes */}
                <mesh position={[0.04, 0.05, 0.06]} scale={0.03}>
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshStandardMaterial color="#111111" roughness={0.3} />
                </mesh>
                <mesh position={[-0.04, 0.05, 0.06]} scale={0.03}>
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshStandardMaterial color="#111111" roughness={0.3} />
                </mesh>
                {/* Eye highlights */}
                <mesh position={[0.045, 0.055, 0.075]} scale={0.012}>
                  <sphereGeometry args={[1, 6, 4]} />
                  <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
                </mesh>
                <mesh position={[-0.035, 0.055, 0.075]} scale={0.012}>
                  <sphereGeometry args={[1, 6, 4]} />
                  <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
                </mesh>
                {/* Antennae */}
                <mesh position={[0.03, 0.1, 0.04]} rotation={[0.3, 0, 0.2]}>
                  <cylinderGeometry args={[0.005, 0.008, 0.08, 6]} />
                  <meshStandardMaterial color="#228B22" roughness={0.5} />
                </mesh>
                <mesh position={[-0.03, 0.1, 0.04]} rotation={[0.3, 0, -0.2]}>
                  <cylinderGeometry args={[0.005, 0.008, 0.08, 6]} />
                  <meshStandardMaterial color="#228B22" roughness={0.5} />
                </mesh>
                {/* Antenna tips - little balls */}
                <mesh position={[0.045, 0.16, 0.06]} scale={0.015}>
                  <sphereGeometry args={[1, 6, 4]} />
                  <meshStandardMaterial color="#7CFC00" emissive="#7CFC00" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[-0.045, 0.16, 0.06]} scale={0.015}>
                  <sphereGeometry args={[1, 6, 4]} />
                  <meshStandardMaterial color="#7CFC00" emissive="#7CFC00" emissiveIntensity={0.3} />
                </mesh>
                {/* Cute little smile */}
                <mesh position={[0, 0.01, 0.1]} rotation={[0.1, 0, 0]} scale={[0.04, 0.01, 0.01]}>
                  <torusGeometry args={[1, 0.4, 6, 8, Math.PI]} />
                  <meshStandardMaterial color="#2E5E1A" roughness={0.5} />
                </mesh>
              </>
            )}

            {/* Tiny legs on each segment (except head and tail) */}
            {!isHead && !isTail && (
              <>
                <mesh position={[0.06, -0.04, 0]} rotation={[0, 0, -0.5]}>
                  <cylinderGeometry args={[0.008, 0.004, 0.04, 4]} />
                  <meshStandardMaterial color="#2E5E1A" roughness={0.6} />
                </mesh>
                <mesh position={[-0.06, -0.04, 0]} rotation={[0, 0, 0.5]}>
                  <cylinderGeometry args={[0.008, 0.004, 0.04, 4]} />
                  <meshStandardMaterial color="#2E5E1A" roughness={0.6} />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* Subtle glow under the inchworm */}
      <pointLight position={[0, 0.05, 0]} intensity={0.3} color="#7CFC00" distance={0.5} decay={2} />
    </group>
  );
}

// Miles Portal - small cyan portal that hovers above Miles and follows him
function MilesPortal({ milesPositionRef, isUnlocked }) {
  const groupRef = useRef();
  const PORTAL_HEIGHT_ABOVE_MILES = 1.5;
  const PORTAL_SCALE = 0.6; // 60% size of normal portals

  useFrame(({ clock }) => {
    if (groupRef.current && isUnlocked) {
      const t = clock.getElapsedTime();
      // Follow Miles' position with gentle bob
      groupRef.current.position.x = milesPositionRef.current.x;
      groupRef.current.position.y = CLOCK_THICKNESS / 2 + PORTAL_HEIGHT_ABOVE_MILES + Math.sin(t * 1.5) * 0.1;
      groupRef.current.position.z = milesPositionRef.current.z;
    }
  });

  if (!isUnlocked) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <Portal
        position={[0, 0, 0]} // Position is controlled by parent group
        animal="inchworm"
        isOpen={true}
        size={PORTAL_SCALE}
      />
    </group>
  );
}

// Owl Portal - sits at center of clock, spins with second hand facing Hoots
function OwlPortal({ secondAngleRef, isUnlocked }) {
  const groupRef = useRef();
  const PORTAL_HEIGHT = CLOCK_THICKNESS / 2 + 1.2; // Above where hands connect
  const PORTAL_SCALE = 0.7; // Slightly smaller

  useFrame(({ clock }) => {
    if (groupRef.current && isUnlocked) {
      const t = clock.getElapsedTime();
      // Position at center of clock
      groupRef.current.position.x = 0;
      groupRef.current.position.y = PORTAL_HEIGHT + Math.sin(t * 1.5) * 0.1;
      groupRef.current.position.z = 0;
      // Rotate with the second hand to face Hoots (at the tail end)
      // Hoots is at the tail, so we rotate opposite to face him
      groupRef.current.rotation.y = -secondAngleRef.current + Math.PI;
    }
  });

  if (!isUnlocked) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <Portal
        position={[0, 0, 0]} // Position is controlled by parent group
        animal="owl"
        isOpen={true}
        size={PORTAL_SCALE}
      />
    </group>
  );
}

// Fireflies floating around the clock
const FIREFLY_COUNT = 15;

function Fireflies() {
  const firefliesRef = useRef([]);
  const groupRef = useRef();

  useEffect(() => {
    firefliesRef.current = Array.from({ length: FIREFLY_COUNT }, () => ({
      x: (Math.random() - 0.5) * CLOCK_RADIUS * 2,
      y: CLOCK_THICKNESS / 2 + 0.3 + Math.random() * 2,
      z: (Math.random() - 0.5) * CLOCK_RADIUS * 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.2,
      vz: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      glowSpeed: 1 + Math.random() * 2,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const children = groupRef.current.children;
    const time = Date.now() / 1000;

    firefliesRef.current.forEach((fly, i) => {
      if (!children[i]) return;

      fly.vx += (Math.random() - 0.5) * 0.1 * delta;
      fly.vy += (Math.random() - 0.5) * 0.05 * delta;
      fly.vz += (Math.random() - 0.5) * 0.1 * delta;

      fly.vx *= 0.98;
      fly.vy *= 0.98;
      fly.vz *= 0.98;

      const maxSpeed = fly.speed;
      const speed = Math.sqrt(fly.vx * fly.vx + fly.vy * fly.vy + fly.vz * fly.vz);
      if (speed > maxSpeed) {
        fly.vx = (fly.vx / speed) * maxSpeed;
        fly.vy = (fly.vy / speed) * maxSpeed;
        fly.vz = (fly.vz / speed) * maxSpeed;
      }

      fly.x += fly.vx * delta * 60;
      fly.y += fly.vy * delta * 60;
      fly.z += fly.vz * delta * 60;

      const maxDist = CLOCK_RADIUS * 1.2;
      const dist = Math.sqrt(fly.x * fly.x + fly.z * fly.z);
      if (dist > maxDist) {
        fly.vx -= fly.x * 0.01;
        fly.vz -= fly.z * 0.01;
      }

      if (fly.y < CLOCK_THICKNESS / 2 + 0.2) {
        fly.y = CLOCK_THICKNESS / 2 + 0.2;
        fly.vy = Math.abs(fly.vy) * 0.5;
      }
      if (fly.y > 3) {
        fly.y = 3;
        fly.vy = -Math.abs(fly.vy) * 0.5;
      }

      children[i].position.set(fly.x, fly.y, fly.z);

      const glow = 0.5 + Math.sin(time * fly.glowSpeed + fly.phase) * 0.4;
      if (children[i].children[0]?.material) {
        children[i].children[0].material.opacity = glow * 0.25;
      }
      if (children[i].children[2]) {
        children[i].children[2].intensity = glow * 1.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: FIREFLY_COUNT }).map((_, i) => (
        <group key={i} position={[0, 1, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshBasicMaterial color="#ccff44" transparent opacity={0.15} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshBasicMaterial color="#eeff66" transparent opacity={0.95} />
          </mesh>
          <pointLight color="#ccff00" intensity={1.0} distance={2.5} decay={2} />
        </group>
      ))}
    </group>
  );
}

// Sand grain component - collectible by turtle
// NOTE: No pointLight per grain - they were causing massive performance issues
function SandGrain({ position, spawnTime, turtlePosition, id, onNearGrain, essenceType = 'golden' }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const grainPos = useRef({ x: position[0], y: position[1], z: position[2] });
  const spawnComplete = useRef(false);
  const wasNear = useRef(false);

  const essenceColor = ESSENCE_COLORS[essenceType] || ESSENCE_COLORS.golden;

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) return;

    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.015;

    const elapsed = Date.now() / 1000 - spawnTime;

    if (elapsed < 1) {
      grainPos.current.y = position[1] + elapsed * 0.3;
    } else if (!spawnComplete.current) {
      spawnComplete.current = true;
      grainPos.current.y = position[1] + 0.3;
    }

    const turtleX = turtlePosition[0];
    const turtleZ = turtlePosition[2];
    const dx = grainPos.current.x - turtleX;
    const dz = grainPos.current.z - turtleZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const isNear = dist < CLAIM_DISTANCE;

    // Only call callback when state changes to avoid re-renders
    if (isNear !== wasNear.current) {
      wasNear.current = isNear;
      if (onNearGrain) {
        onNearGrain(id, isNear);
      }
    }

    // Update glow intensity directly via refs (no setState)
    const targetGlow = isNear ? 1.0 : 0.6;
    if (meshRef.current.material) {
      meshRef.current.material.emissiveIntensity = targetGlow;
    }

    const bobY = Math.sin(Date.now() / 300) * 0.05;
    groupRef.current.position.x = grainPos.current.x;
    groupRef.current.position.y = grainPos.current.y + bobY;
    groupRef.current.position.z = grainPos.current.z;
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[SAND_GRAIN_RADIUS, 0]} />
        <meshStandardMaterial
          color={essenceColor.color}
          metalness={0.7}
          roughness={0.2}
          emissive={essenceColor.emissive}
          emissiveIntensity={0.6}
          flatShading={true}
        />
      </mesh>
    </group>
  );
}

// NPC position constants
const RABBIT_SECOND = 45;
const RABBIT_DISTANCE = CLOCK_RADIUS * 0.6;
const RABBIT_POSITION_ANGLE = (RABBIT_SECOND * 6 * Math.PI) / 180 + Math.PI;
const RABBIT_POS_X = Math.sin(RABBIT_POSITION_ANGLE) * RABBIT_DISTANCE;
const RABBIT_POS_Z = Math.cos(RABBIT_POSITION_ANGLE) * RABBIT_DISTANCE;
const RABBIT_INTERACT_DISTANCE = 0.9; // Tighter range so grains take priority
const CAT_INTERACT_DISTANCE = 0.9;
const FROG_INTERACT_DISTANCE = 0.9;
const GNOME_INTERACT_DISTANCE = 0.9;
const NOX_INTERACT_DISTANCE = 0.9;

// Floating Time Shard for victory ceremony
function CeremonyShard({ gnomePosition, isFading = false, onFadeComplete }) {
  const shardRef = useRef();
  const glowRef = useRef();
  const groupRef = useRef();
  const baseY = useRef(gnomePosition[1]);
  const fadeProgress = useRef(0);

  useFrame((_, delta) => {
    if (shardRef.current) {
      const t = Date.now() / 1000;
      shardRef.current.position.y = baseY.current + Math.sin(t * 2) * 0.08;
      shardRef.current.rotation.y += 0.02;
    }
    if (glowRef.current) {
      const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.3;
      glowRef.current.intensity = (2 + pulse * 2) * (1 - fadeProgress.current);
    }

    if (isFading && groupRef.current) {
      fadeProgress.current = Math.min(1, fadeProgress.current + delta * 2);
      const scale = 1 - fadeProgress.current * 0.5;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.y = fadeProgress.current * 0.5;
      if (fadeProgress.current >= 1 && onFadeComplete) {
        onFadeComplete();
      }
    }
  });

  return (
    <group position={gnomePosition} ref={groupRef}>
      <group ref={shardRef}>
        <mesh>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffd700" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#fffacd" transparent opacity={0.6} />
        </mesh>
      </group>
      <pointLight ref={glowRef} color="#ffd700" intensity={3} distance={4} decay={2} />
    </group>
  );
}

// 3D Amber Pyramid showing collected shards - floating in front of AEIOU
function AmberPyramid({ pyramidShards = {}, position = [0, 0, 0] }) {
  const groupRef = useRef();
  const floatRef = useRef(0);

  // Pyramid layers from bottom to top: rabbit, frog, cat, inchworm (Miles), owl (capstone)
  // Colors now come from the shard's difficulty level, not the realm
  // Difficulty colors: 1=White, 2=Green, 3=Yellow, 4=Orange, 5=Red, 6=Purple, 7=Black
  const layers = [
    { realm: 'rabbit', y: 0.0, scale: 1.0 },      // Base layer
    { realm: 'frog', y: 0.14, scale: 0.8 },       // Layer 2
    { realm: 'cat', y: 0.26, scale: 0.6 },        // Layer 3
    { realm: 'inchworm', y: 0.36, scale: 0.4 },   // Layer 4
    { realm: 'owl', y: 0.44, scale: 0.2 },        // Capstone
  ];

  // Check if all shards are black (impossible difficulty = 7)
  const allBlack = pyramidShards?.rabbit?.difficulty === 7 &&
                   pyramidShards?.frog?.difficulty === 7 &&
                   pyramidShards?.cat?.difficulty === 7 &&
                   pyramidShards?.inchworm?.difficulty === 7 &&
                   pyramidShards?.owl?.difficulty === 7;

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y += 0.008;
      // Gentle floating bob
      floatRef.current += delta;
      groupRef.current.position.y = position[1] + Math.sin(floatRef.current * 1.5) * 0.05;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* Pyramid layers - larger scale */}
      {layers.map((layer) => {
        const shardData = pyramidShards?.[layer.realm];
        const hasShard = shardData !== null && shardData !== undefined;
        // Get color from shard difficulty, or default gray if no shard
        const shardColor = hasShard ? (shardData.color || '#FFFF00') : '#222';
        const size = 0.22 * layer.scale;

        return (
          <group key={layer.realm} position={[0, layer.y, 0]}>
            {/* Layer mesh */}
            <mesh>
              <coneGeometry args={[size, 0.15, 4]} />
              <meshStandardMaterial
                color={shardColor}
                emissive={hasShard ? shardColor : '#000'}
                emissiveIntensity={hasShard ? 0.6 : 0}
                metalness={hasShard ? 0.7 : 0.1}
                roughness={hasShard ? 0.2 : 0.9}
                transparent={!hasShard}
                opacity={hasShard ? 1 : 0.3}
              />
            </mesh>

            {/* Glow when collected */}
            {hasShard && (
              <pointLight
                color={shardColor}
                intensity={0.8}
                distance={1.5}
                decay={2}
              />
            )}
          </group>
        );
      })}

      {/* Top glow when all collected - gold for noon portal, dark red for midnight (all black) */}
      {pyramidShards?.rabbit && pyramidShards?.frog && pyramidShards?.cat && pyramidShards?.owl && pyramidShards?.inchworm && (
        <pointLight
          position={[0, 0.6, 0]}
          color={allBlack ? '#880000' : '#ffd700'}
          intensity={allBlack ? 5 : 3}
          distance={3}
          decay={2}
        />
      )}
    </group>
  );
}

// Portal constants
const PORTAL_INTERACT_DISTANCE = 2.5;
const PORTAL_HEIGHT = 2.0;
const PORTAL_OUTSIDE_DISTANCE = CLOCK_RADIUS + 1.5;

const CAT_PORTAL_ANGLE = (15 * 6 * Math.PI) / 180 + Math.PI;
const CAT_PORTAL_X = Math.sin(CAT_PORTAL_ANGLE) * PORTAL_OUTSIDE_DISTANCE;
const CAT_PORTAL_Z = Math.cos(CAT_PORTAL_ANGLE) * PORTAL_OUTSIDE_DISTANCE;

const FROG_PORTAL_ANGLE = (30 * 6 * Math.PI) / 180;
const FROG_PORTAL_X = Math.sin(FROG_PORTAL_ANGLE) * PORTAL_OUTSIDE_DISTANCE;
const FROG_PORTAL_Z = Math.cos(FROG_PORTAL_ANGLE) * PORTAL_OUTSIDE_DISTANCE;

const RABBIT_PORTAL_ANGLE = (45 * 6 * Math.PI) / 180 + Math.PI;
const RABBIT_PORTAL_X = Math.sin(RABBIT_PORTAL_ANGLE) * PORTAL_OUTSIDE_DISTANCE;
const RABBIT_PORTAL_Z = Math.cos(RABBIT_PORTAL_ANGLE) * PORTAL_OUTSIDE_DISTANCE;

const PORTAL_POSITIONS = {
  cat: [CAT_PORTAL_X, PORTAL_HEIGHT, CAT_PORTAL_Z],
  frog: [FROG_PORTAL_X, PORTAL_HEIGHT, FROG_PORTAL_Z],
  rabbit: [RABBIT_PORTAL_X, PORTAL_HEIGHT, RABBIT_PORTAL_Z],
  owl: [0, 1.5, 0], // Center of clock, raised up to be visible
};

// Wrapper to animate animal jumping into portal
function AnimalPortalWrapper({ children, isEntering, portalPosition }) {
  const groupRef = useRef();
  const progressRef = useRef(0);
  const startPosRef = useRef(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isEntering) {
      if (startPosRef.current === null) {
        startPosRef.current = {
          x: groupRef.current.position.x,
          y: groupRef.current.position.y,
          z: groupRef.current.position.z,
        };
      }

      progressRef.current = Math.min(1, progressRef.current + delta * 1.2);
      const t = progressRef.current;
      const ease = 1 - Math.pow(1 - t, 3);
      const jumpHeight = Math.sin(t * Math.PI) * 2;

      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      const startZ = startPosRef.current.z;

      groupRef.current.position.x = startX + (portalPosition[0] - startX) * ease;
      groupRef.current.position.y = startY + jumpHeight + (portalPosition[1] - startY) * ease;
      groupRef.current.position.z = startZ + (portalPosition[2] - startZ) * ease;

      const scale = 1 - ease * 0.8;
      groupRef.current.scale.setScalar(Math.max(0.1, scale));
      groupRef.current.rotation.y += delta * 8;
    } else {
      progressRef.current = 0;
      startPosRef.current = null;
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.scale.setScalar(1);
      groupRef.current.rotation.set(0, 0, 0);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Hoots - barn owl that rides on the tail (butt) of the second hand
// This component is rendered INSIDE the second hand group so it inherits rotation
function HootsOnHand() {
  // Barn owl colors - brown back, white face and belly
  const BROWN_DARK = "#5C4033";
  const BROWN_LIGHT = "#8B6914";
  const BROWN_SPOTS = "#6B4423";
  const WHITE_CREAM = "#FFF8E7";
  const FACE_WHITE = "#FFFFFF";

  // Position at the tail end of the second hand, facing outward
  // The second hand tail is at z = -CLOCK_RADIUS * 0.25
  const TAIL_Z = -CLOCK_RADIUS * 0.25;

  return (
    <group position={[0, 0.01, TAIL_Z]} rotation={[0, Math.PI, 0]} scale={[HOOTS_SCALE, HOOTS_SCALE, HOOTS_SCALE]}>
      {/* Body - brown back */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color={BROWN_DARK} roughness={0.9} />
      </mesh>
      {/* Belly - white/cream */}
      <mesh position={[0, 0.25, 0.18]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color={WHITE_CREAM} roughness={0.95} />
      </mesh>
      {/* Spots on belly */}
      <mesh position={[-0.08, 0.2, 0.28]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={BROWN_SPOTS} roughness={0.9} />
      </mesh>
      <mesh position={[0.06, 0.28, 0.26]} castShadow>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color={BROWN_SPOTS} roughness={0.9} />
      </mesh>
      {/* Head */}
      <group position={[0, 0.65, 0]}>
        {/* Back of head - brown */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 10, 8]} />
          <meshStandardMaterial color={BROWN_LIGHT} roughness={0.9} />
        </mesh>
        {/* Left ear tuft */}
        <mesh position={[-0.15, 0.22, 0]} rotation={[0, 0, 0.4]} castShadow>
          <coneGeometry args={[0.06, 0.18, 4]} />
          <meshStandardMaterial color={BROWN_DARK} roughness={0.9} />
        </mesh>
        {/* Right ear tuft */}
        <mesh position={[0.15, 0.22, 0]} rotation={[0, 0, -0.4]} castShadow>
          <coneGeometry args={[0.06, 0.18, 4]} />
          <meshStandardMaterial color={BROWN_DARK} roughness={0.9} />
        </mesh>
        {/* Heart-shaped face disk - white (barn owl characteristic) */}
        <mesh position={[0, 0, 0.12]}>
          <circleGeometry args={[0.22, 16]} />
          <meshStandardMaterial color={FACE_WHITE} roughness={0.95} />
        </mesh>
        {/* Face outline - tan border */}
        <mesh position={[0, 0, 0.11]}>
          <ringGeometry args={[0.2, 0.24, 16]} />
          <meshStandardMaterial color={BROWN_LIGHT} roughness={0.9} />
        </mesh>
        {/* Large owl eyes with golden iris - using spheres for visibility */}
        {/* Left eye - golden outer */}
        <mesh position={[-0.08, 0.02, 0.2]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        {/* Left pupil - large black */}
        <mesh position={[-0.08, 0.02, 0.26]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Left eye highlight */}
        <mesh position={[-0.06, 0.04, 0.29]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Right eye - golden outer */}
        <mesh position={[0.08, 0.02, 0.2]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        {/* Right pupil - large black */}
        <mesh position={[0.08, 0.02, 0.26]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Right eye highlight */}
        <mesh position={[0.1, 0.04, 0.29]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Beak - small and hooked */}
        <mesh position={[0, -0.08, 0.16]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.035, 0.08, 4]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.6} />
        </mesh>
      </group>
      {/* Wings - brown with lighter edges */}
      <group position={[-0.28, 0.35, -0.05]} rotation={[0.2, 0, 0.5]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.1, 0.35, 4, 6]} />
          <meshStandardMaterial color={BROWN_DARK} roughness={0.9} />
        </mesh>
        {/* Wing spots */}
        <mesh position={[0, 0.1, 0.08]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={WHITE_CREAM} roughness={0.9} />
        </mesh>
      </group>
      <group position={[0.28, 0.35, -0.05]} rotation={[0.2, 0, -0.5]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.1, 0.35, 4, 6]} />
          <meshStandardMaterial color={BROWN_DARK} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 0.08]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={WHITE_CREAM} roughness={0.9} />
        </mesh>
      </group>
      {/* Tail feathers */}
      <mesh position={[0, 0.15, -0.25]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.04, 0.2]} />
        <meshStandardMaterial color={BROWN_DARK} roughness={0.9} />
      </mesh>
      {/* Feet - yellow/orange talons */}
      <mesh position={[-0.1, 0.02, 0.1]} castShadow>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#DAA520" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.02, 0.1]} castShadow>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#DAA520" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Y - AEIOU's larger companion gnome with elephant features, performs déjà vu to stop time
function Nox({ dejaVuState }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const hatRef = useRef();
  const orbsRef = useRef();

  useFrame(() => {
    if (!groupRef.current || !bodyRef.current) return;

    // Animate floating orbs
    if (orbsRef.current) {
      orbsRef.current.rotation.y += 0.02;
      orbsRef.current.rotation.x = Math.sin(Date.now() / 2000) * 0.1;
    }

    const { isActive, progress } = dejaVuState;

    // Nox jumps FORWARD (toward center) when stopping time, not sideways
    let jumpForwardAmount = 0;
    let jumpHeight = 0;

    if (isActive) {
      let jumpProgress = 0;
      if (progress < 0.1) {
        jumpProgress = progress / 0.1; // Quick jump forward
      } else if (progress > 0.9) {
        jumpProgress = (1 - progress) / 0.1; // Return back
      } else {
        jumpProgress = 1; // Hold position
      }

      // Jump forward toward center and up
      jumpForwardAmount = jumpProgress * (CLOCK_RADIUS * 0.3); // Move toward center
      jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.8; // Arc up and down
    }

    // Position: start at rest, jump forward (reduce distance from center)
    const currentDistance = NOX_BASE_DISTANCE - jumpForwardAmount;
    const x = Math.sin(NOX_REST_ANGLE) * currentDistance;
    const z = Math.cos(NOX_REST_ANGLE) * currentDistance;
    groupRef.current.position.x = x;
    groupRef.current.position.z = z;
    groupRef.current.position.y = CLOCK_THICKNESS / 2 + jumpHeight;
    groupRef.current.rotation.y = -NOX_REST_ANGLE + Math.PI;

    // Glow effect when active
    const glowScale = isActive ? 1.05 : 1;
    bodyRef.current.scale.setScalar(glowScale);

    // Subtle idle sway - creepy like AEIOU
    const sway = Math.sin(Date.now() / 1200) * 0.02;
    const bob = Math.sin(Date.now() / 600) * 0.01;
    bodyRef.current.position.y = bob;
    if (!isActive) {
      bodyRef.current.rotation.z = sway;
    }

    // Hat jingles
    if (hatRef.current) {
      hatRef.current.rotation.z = Math.sin(Date.now() / 400) * 0.03;
    }
  });

  const eyeColor = dejaVuState.isActive ? "#00ffff" : "#6a5acd"; // Cyan when active, slate blue normally
  const eyeGlow = dejaVuState.isActive ? 0.8 : 0.3;

  // Y colors - white/gold theme
  const SKIN_COLOR = "#0a0a0a"; // Same black skin as AEIOU
  const ROBE_PRIMARY = "#f5f5f5"; // White robe
  const ROBE_SECONDARY = "#e8e8e8"; // Slightly off-white
  const DIAMOND_GOLD = "#9d7b3a"; // Tarnished gold (same as AEIOU)
  const DIAMOND_PURPLE = "#4b0082"; // Indigo purple
  const HAT_COLOR = "#f5f5f5"; // White hat
  const HAT_ACCENT = "#e8e8e8"; // Off-white accent
  const BELL_COLOR = "#8b7355"; // Aged bronze (same as AEIOU)
  const COLLAR_COLOR = "#e8e8e8"; // White collar
  const SHOE_COLOR = "#f0f0f0"; // White shoes

  return (
    <group
      ref={groupRef}
      position={[NOX_REST_X, CLOCK_THICKNESS / 2, NOX_REST_Z]}
      rotation={[0, -NOX_REST_ANGLE + Math.PI, 0]}
      scale={[0.45, 0.45, 0.45]} // Larger than AEIOU (0.35)
    >
      <group ref={bodyRef}>
        {/* === CURLY-TOED SHOES === */}
        {/* Left shoe */}
        <group position={[-0.14, 0.05, 0.05]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.07, 0.14, 6, 8]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          {/* Curly toe */}
          <mesh position={[0, -0.02, 0.14]} rotation={[0.8, 0, 0]} castShadow>
            <coneGeometry args={[0.05, 0.14, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0.22]} rotation={[1.5, 0, 0]} castShadow>
            <coneGeometry args={[0.03, 0.1, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          {/* Bell on shoe */}
          <group position={[0, 0.04, 0.26]}>
            <mesh>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial color={BELL_COLOR} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        </group>
        {/* Right shoe */}
        <group position={[0.14, 0.05, 0.05]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.07, 0.14, 6, 8]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          {/* Curly toe */}
          <mesh position={[0, -0.02, 0.14]} rotation={[0.8, 0, 0]} castShadow>
            <coneGeometry args={[0.05, 0.14, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0.22]} rotation={[1.5, 0, 0]} castShadow>
            <coneGeometry args={[0.03, 0.1, 6]} />
            <meshStandardMaterial color={SHOE_COLOR} roughness={0.9} />
          </mesh>
          {/* Bell on shoe */}
          <group position={[0, 0.04, 0.26]}>
            <mesh>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial color={BELL_COLOR} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* === LEGS === */}
        <group position={[-0.1, 0.26, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.06, 0.22, 6, 8]} />
            <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
          </mesh>
        </group>
        <group position={[0.1, 0.26, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.06, 0.22, 6, 8]} />
            <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
          </mesh>
        </group>

        {/* === LONG ROBE with striped rings === */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={`lower-${i}`} position={[0, 0.34 + i * 0.07, 0]} castShadow>
            <cylinderGeometry args={[0.26 - i * 0.012, 0.28 - i * 0.012, 0.07, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? ROBE_PRIMARY : ROBE_SECONDARY}
              roughness={0.85}
            />
          </mesh>
        ))}

        {/* Upper robe */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`upper-${i}`} position={[0, 0.76 + i * 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.19 - i * 0.012, 0.21 - i * 0.012, 0.06, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? ROBE_SECONDARY : ROBE_PRIMARY}
              roughness={0.85}
            />
          </mesh>
        ))}

        {/* Diamond pattern overlay - front */}
        <group position={[0, 0.58, 0.25]}>
          {[-1, 0, 1].map((row) => (
            [-1, 0, 1].map((col) => (
              <mesh
                key={`front-${row}-${col}`}
                position={[col * 0.08, row * 0.12, 0]}
                rotation={[0, 0, Math.PI / 4]}
              >
                <planeGeometry args={[0.07, 0.07]} />
                <meshStandardMaterial
                  color={(row + col) % 2 === 0 ? DIAMOND_GOLD : DIAMOND_PURPLE}
                  roughness={0.6}
                  metalness={(row + col) % 2 === 0 ? 0.4 : 0.2}
                />
              </mesh>
            ))
          ))}
        </group>

        {/* Ruffled collar */}
        <group position={[0, 0.92, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * Math.PI / 3) * 0.14,
                0,
                Math.cos(i * Math.PI / 3) * 0.14
              ]}
              rotation={[Math.PI / 6, i * Math.PI / 3, 0]}
            >
              <coneGeometry args={[0.07, 0.1, 6]} />
              <meshStandardMaterial color={COLLAR_COLOR} roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* === HEAD === */}
        <group position={[0, 1.1, 0]}>
          {/* Face - black like AEIOU */}
          <mesh castShadow>
            <sphereGeometry args={[0.19, 12, 10]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
          </mesh>

          {/* === ELEPHANT TRUNK === */}
          {/* Trunk base */}
          <group position={[0, -0.04, 0.16]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.06, 0.08, 8]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.85} />
            </mesh>
            {/* Trunk middle section - curves down */}
            <group position={[0, -0.06, 0.02]} rotation={[0.4, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.85} />
              </mesh>
              {/* Trunk lower section - curves more */}
              <group position={[0, -0.08, 0.03]} rotation={[0.5, 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.035, 0.04, 0.1, 8]} />
                  <meshStandardMaterial color={SKIN_COLOR} roughness={0.85} />
                </mesh>
                {/* Trunk tip - curled slightly */}
                <group position={[0, -0.07, 0.02]} rotation={[0.6, 0, 0]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.025, 0.035, 0.08, 8]} />
                    <meshStandardMaterial color={SKIN_COLOR} roughness={0.85} />
                  </mesh>
                  {/* Trunk nostrils at tip */}
                  <mesh position={[0, -0.05, 0]}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshStandardMaterial color={SKIN_COLOR} roughness={0.85} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>

          {/* === ELEPHANT TUSKS === */}
          {/* Left tusk */}
          <group position={[-0.06, -0.08, 0.14]} rotation={[0.3, 0.3, 0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.012, 0.025, 0.18, 8]} />
              <meshStandardMaterial color="#fffff0" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Tusk tip */}
            <mesh position={[0, -0.1, 0]} castShadow>
              <coneGeometry args={[0.012, 0.04, 8]} />
              <meshStandardMaterial color="#fffff0" roughness={0.3} metalness={0.1} />
            </mesh>
          </group>
          {/* Right tusk */}
          <group position={[0.06, -0.08, 0.14]} rotation={[0.3, -0.3, -0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.012, 0.025, 0.18, 8]} />
              <meshStandardMaterial color="#fffff0" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Tusk tip */}
            <mesh position={[0, -0.1, 0]} castShadow>
              <coneGeometry args={[0.012, 0.04, 8]} />
              <meshStandardMaterial color="#fffff0" roughness={0.3} metalness={0.1} />
            </mesh>
          </group>

          {/* TWO glowing eyes - cyan/blue (unlike AEIOU's single red eye) */}
          {/* Left eye */}
          <group position={[-0.07, 0.02, 0.14]}>
            <mesh>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.028]}>
              <sphereGeometry args={[0.032, 10, 10]} />
              <meshStandardMaterial
                color={eyeColor}
                emissive={eyeColor}
                emissiveIntensity={eyeGlow}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
            </mesh>
            <mesh position={[0.012, 0.012, 0.05]}>
              <sphereGeometry args={[0.007, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight color={eyeColor} intensity={0.4} distance={1} decay={2} />
          </group>
          {/* Right eye */}
          <group position={[0.07, 0.02, 0.14]}>
            <mesh>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.028]}>
              <sphereGeometry args={[0.032, 10, 10]} />
              <meshStandardMaterial
                color={eyeColor}
                emissive={eyeColor}
                emissiveIntensity={eyeGlow}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
            </mesh>
            <mesh position={[0.012, 0.012, 0.05]}>
              <sphereGeometry args={[0.007, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight color={eyeColor} intensity={0.4} distance={1} decay={2} />
          </group>

          {/* Thin smile */}
          <mesh position={[0, -0.1, 0.14]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.045, 0.01, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#2a1a2a" roughness={0.9} />
          </mesh>

          {/* Chin */}
          <mesh position={[0, -0.16, 0.1]} castShadow>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
          </mesh>

          {/* === LARGE ELEPHANT EARS === */}
          {/* Left ear - large floppy elephant ear */}
          <group position={[-0.22, 0.02, -0.02]} rotation={[0.1, -0.4, -0.3]}>
            {/* Main ear flap */}
            <mesh castShadow>
              <sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} side={2} />
            </mesh>
            {/* Inner ear - pinkish */}
            <mesh position={[0.01, 0.01, 0.02]}>
              <sphereGeometry args={[0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#3a2a3a" roughness={0.9} side={2} />
            </mesh>
            {/* Ear edge thickness */}
            <mesh position={[0, -0.08, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
              <torusGeometry args={[0.14, 0.025, 8, 16, Math.PI]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
            </mesh>
          </group>
          {/* Right ear - large floppy elephant ear */}
          <group position={[0.22, 0.02, -0.02]} rotation={[0.1, 0.4, 0.3]}>
            {/* Main ear flap */}
            <mesh castShadow>
              <sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} side={2} />
            </mesh>
            {/* Inner ear - pinkish */}
            <mesh position={[-0.01, 0.01, 0.02]}>
              <sphereGeometry args={[0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#3a2a3a" roughness={0.9} side={2} />
            </mesh>
            {/* Ear edge thickness */}
            <mesh position={[0, -0.08, 0]} rotation={[Math.PI/2, 0, Math.PI]} castShadow>
              <torusGeometry args={[0.14, 0.025, 8, 16, Math.PI]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
            </mesh>
          </group>

          {/* === TALL POINTED HAT with purple/gold stripes === */}
          <group ref={hatRef} position={[0, 0.14, 0]}>
            {/* Hat brim */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.2, 0.05, 16]} />
              <meshStandardMaterial color={DIAMOND_GOLD} metalness={0.4} roughness={0.5} />
            </mesh>

            {/* Tall pointed hat with stripes */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const baseRadius = 0.19;
              const height = 0.07;
              const taper = 0.02;
              const yPos = 0.025 + i * height;
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
            <group position={[0, 0.65, 0.05]} rotation={[0.4, 0, 0]}>
              <mesh castShadow>
                <coneGeometry args={[0.045, 0.18, 8]} />
                <meshStandardMaterial color={HAT_COLOR} roughness={0.8} />
              </mesh>
              {/* Bell at tip */}
              <group position={[0, -0.12, 0]}>
                <mesh>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshStandardMaterial color={BELL_COLOR} metalness={0.6} roughness={0.4} />
                </mesh>
              </group>
            </group>

            {/* Diamond pattern band around base */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <mesh
                key={`diamond-${i}`}
                position={[
                  Math.sin(i * Math.PI / 4) * 0.2,
                  0.0,
                  Math.cos(i * Math.PI / 4) * 0.2
                ]}
                rotation={[Math.PI/2, i * Math.PI / 4, Math.PI/4]}
              >
                <planeGeometry args={[0.04, 0.04]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? DIAMOND_GOLD : DIAMOND_PURPLE}
                  metalness={i % 2 === 0 ? 0.5 : 0.2}
                  roughness={0.5}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* === ARMS hanging naturally === */}
        {/* Left arm */}
        <group position={[-0.22, 0.72, 0]}>
          <mesh castShadow rotation={[0, 0, 0.15]}>
            <capsuleGeometry args={[0.06, 0.18, 6, 8]} />
            <meshStandardMaterial color={ROBE_PRIMARY} roughness={0.85} />
          </mesh>
          {/* Forearm */}
          <group position={[-0.05, -0.15, 0.02]} rotation={[0.3, 0, 0.1]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.05, 0.2, 6, 8]} />
              <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
            </mesh>
            {/* Sleeve cuff */}
            <mesh position={[0, -0.12, 0]}>
              <torusGeometry args={[0.055, 0.015, 6, 8]} />
              <meshStandardMaterial color={DIAMOND_GOLD} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Hand */}
            <group position={[0, -0.17, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[(i - 1.5) * 0.018, -0.05, 0.01]} castShadow>
                  <capsuleGeometry args={[0.01, 0.03, 4, 4]} />
                  <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        {/* Right arm */}
        <group position={[0.22, 0.72, 0]}>
          <mesh castShadow rotation={[0, 0, -0.15]}>
            <capsuleGeometry args={[0.06, 0.18, 6, 8]} />
            <meshStandardMaterial color={ROBE_PRIMARY} roughness={0.85} />
          </mesh>
          {/* Forearm */}
          <group position={[0.05, -0.15, 0.02]} rotation={[0.3, 0, -0.1]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.05, 0.2, 6, 8]} />
              <meshStandardMaterial color={ROBE_SECONDARY} roughness={0.85} />
            </mesh>
            {/* Sleeve cuff */}
            <mesh position={[0, -0.12, 0]}>
              <torusGeometry args={[0.055, 0.015, 6, 8]} />
              <meshStandardMaterial color={DIAMOND_GOLD} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Hand */}
            <group position={[0, -0.17, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
              </mesh>
              {/* Fingers */}
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[(i - 1.5) * 0.018, -0.05, 0.01]} castShadow>
                  <capsuleGeometry args={[0.01, 0.03, 4, 4]} />
                  <meshStandardMaterial color={SKIN_COLOR} roughness={0.9} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        {/* Floating orbs around Y */}
        <group ref={orbsRef} position={[0, 0.8, 0]}>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.5;
            const height = Math.sin(i * 1.2) * 0.25;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  height,
                  Math.sin(angle) * radius
                ]}
              >
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshBasicMaterial color="#9966ff" />
                <pointLight color="#9966ff" intensity={0.25} distance={0.4} />
              </mesh>
            );
          })}
        </group>

        {/* Magical aura glow */}
        <pointLight
          position={[0, 1.1, 0.2]}
          color={eyeColor}
          intensity={0.3}
          distance={1.5}
        />

        {/* Déjà vu glow effect */}
        {dejaVuState.isActive && (
          <pointLight color="#00ffff" intensity={3} distance={5} />
        )}
      </group>
    </group>
  );
}

// Second hand collision settings for Cooter blocking
const SECOND_HAND_LENGTH = CLOCK_RADIUS * 0.67; // Tip of second hand
const SECOND_HAND_COLLISION_WIDTH = 0.35; // Width for collision detection
const COOTER_BLOCKING_GRACE_PERIOD = 1.0; // 1 second free
const COOTER_GRAIN_REMOVAL_INTERVAL = 1.0; // Remove 1 grain per second after grace

const Clock = forwardRef(function Clock({ turtlePosition = [0, 0, 0], onTimeStoppedChange, onStopDataChange, onNearGrain, onNearRabbit, onNearCat, onNearFrog, onNearOwl, onNearGnome, onNearHoots, onNearMiles, onNearPortal, onGrainClaimed, onCooterBlockingGrain, victoryCeremony, unlockedRealms = {}, animalEnteringPortal = null, activeRealm = 'hub', pyramidShards = {} }, ref) {
  const hourHandRef = useRef();
  const minuteHandRef = useRef();
  const secondHandRef = useRef();
  const secondHandMaterialRef = useRef();
  const secondHandTailMaterialRef = useRef();

  // Gear refs
  const gear1Ref = useRef();
  const gear2Ref = useRef();
  const gear3Ref = useRef();
  const gear4Ref = useRef();
  const gear5Ref = useRef();
  const escapementRef = useRef();

  // Track displayed second angle vs real second angle
  const displayedSecondAngle = useRef(0);

  // Déjà vu state
  const dejaVuState = useRef({
    isActive: false,
    progress: 0,
    frozenAngle: 0,
    lastTriggerMinute: -1,
  });
  const [dejaVuStateForRender, setDejaVuStateForRender] = useState({ isActive: false, progress: 0 });

  // Sand grains state
  const [sandGrains, setSandGrains] = useState([]);
  const [nearGrainId, setNearGrainId] = useState(null);

  // Track previous "near" values to avoid calling callbacks every frame
  const prevNearValues = useRef({
    rabbit: false,
    cat: false,
    frog: false,
    gnome: false,
    owl: false,
    hoots: false,
    miles: false,
    portal: null,
  });

  // Track Miles position (updated by Miles component)
  const milesPosition = useRef({ x: 0, z: 0 });

  // Track Cooter blocking the second hand
  const cooterBlockingState = useRef({
    isBlocking: false,
    blockingTime: 0,
    lastGrainRemovalTime: 0,
  });

  // Report nearby grain to parent
  useEffect(() => {
    if (onNearGrain) {
      const nearGrain = sandGrains.find(g => g.id === nearGrainId);
      onNearGrain(nearGrain || null);
    }
  }, [nearGrainId, sandGrains, onNearGrain]);

  // Periodic cleanup of expired grains (prevents memory leak if game runs for a long time)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const nowSeconds = Date.now() / 1000;
      setSandGrains(prev => {
        const validGrains = prev.filter(g => (nowSeconds - g.spawnTime) < GRAIN_LIFETIME);
        // Only update if we actually removed something
        return validGrains.length !== prev.length ? validGrains : prev;
      });
    }, 30000); // Check every 30 seconds
    return () => clearInterval(cleanupInterval);
  }, []);

  const handleGrainNear = useCallback((grainId, isNear) => {
    if (isNear) {
      setNearGrainId(grainId);
    } else if (nearGrainId === grainId) {
      setNearGrainId(null);
    }
  }, [nearGrainId]);

  const claimGrain = useCallback((grainId) => {
    const grain = sandGrains.find(g => g.id === grainId);
    if (grain && onGrainClaimed) {
      onGrainClaimed(grain);
      setSandGrains(prev => prev.filter(g => g.id !== grainId));
      setNearGrainId(null);
    }
  }, [sandGrains, onGrainClaimed]);

  useImperativeHandle(ref, () => ({
    claimGrain,
    nearGrainId,
  }), [claimGrain, nearGrainId]);

  // Report time stopped state
  const [timeStopped, setTimeStopped] = useState(false);

  useEffect(() => {
    if (onTimeStoppedChange) {
      onTimeStoppedChange(timeStopped);
    }
  }, [timeStopped, onTimeStoppedChange]);

  useEffect(() => {
    if (onStopDataChange) {
      onStopDataChange({
        stopDuration: dejaVuState.current.isActive ? dejaVuState.current.progress * DEJA_VU_DURATION : 0,
        colorPhase: dejaVuState.current.isActive ? "Déjà Vu" : "",
        totalDuration: DEJA_VU_DURATION,
      });
    }
  }, [dejaVuStateForRender, onStopDataChange]);

  // Main frame update
  useFrame((_, delta) => {
    const now = new Date();
    const angles = getHandAngles(now);
    const currentSecond = now.getSeconds();
    const currentMinute = now.getMinutes();

    // Update hour and minute hands normally
    if (hourHandRef.current) {
      hourHandRef.current.rotation.y = -angles.hour;
    }
    if (minuteHandRef.current) {
      minuteHandRef.current.rotation.y = -angles.minute;
    }

    // Check turtle distance to NPCs - only call callbacks when values CHANGE
    const turtleX = turtlePosition[0];
    const turtleZ = turtlePosition[2];

    const rabbitDx = turtleX - RABBIT_POS_X;
    const rabbitDz = turtleZ - RABBIT_POS_Z;
    const rabbitDist = Math.sqrt(rabbitDx * rabbitDx + rabbitDz * rabbitDz);
    const nearRabbit = rabbitDist < RABBIT_INTERACT_DISTANCE;
    if (nearRabbit !== prevNearValues.current.rabbit) {
      prevNearValues.current.rabbit = nearRabbit;
      if (onNearRabbit) onNearRabbit(nearRabbit);
    }

    const catDx = turtleX - CAT_POS_X;
    const catDz = turtleZ - CAT_POS_Z;
    const catDist = Math.sqrt(catDx * catDx + catDz * catDz);
    const nearCat = catDist < CAT_INTERACT_DISTANCE;
    if (nearCat !== prevNearValues.current.cat) {
      prevNearValues.current.cat = nearCat;
      if (onNearCat) onNearCat(nearCat);
    }

    const frogDx = turtleX - FROG_POS_X;
    const frogDz = turtleZ - FROG_POS_Z;
    const frogDist = Math.sqrt(frogDx * frogDx + frogDz * frogDz);
    const nearFrog = frogDist < FROG_INTERACT_DISTANCE;
    if (nearFrog !== prevNearValues.current.frog) {
      prevNearValues.current.frog = nearFrog;
      if (onNearFrog) onNearFrog(nearFrog);
    }

    const gnomeDx = turtleX - GNOME_POS_X;
    const gnomeDz = turtleZ - GNOME_POS_Z;
    const gnomeDist = Math.sqrt(gnomeDx * gnomeDx + gnomeDz * gnomeDz);
    const nearGnome = gnomeDist < GNOME_INTERACT_DISTANCE;
    if (nearGnome !== prevNearValues.current.gnome) {
      prevNearValues.current.gnome = nearGnome;
      if (onNearGnome) onNearGnome(nearGnome);
    }

    // Nox proximity check
    const noxDx = turtleX - NOX_REST_X;
    const noxDz = turtleZ - NOX_REST_Z;
    const noxDist = Math.sqrt(noxDx * noxDx + noxDz * noxDz);
    const nearOwl = noxDist < NOX_INTERACT_DISTANCE;
    if (nearOwl !== prevNearValues.current.owl) {
      prevNearValues.current.owl = nearOwl;
      if (onNearOwl) onNearOwl(nearOwl);
    }

    // Hoots proximity check (rides on tail of second hand)
    // Hoots is at tail position: local z = -CLOCK_RADIUS * 0.25
    // After rotation by -displayedSecondAngle, world position is:
    const hootsTailZ = -CLOCK_RADIUS * 0.25;
    const hootsX = Math.sin(-displayedSecondAngle.current) * hootsTailZ;
    const hootsZ = Math.cos(-displayedSecondAngle.current) * hootsTailZ;
    const hootsDx = turtleX - hootsX;
    const hootsDz = turtleZ - hootsZ;
    const hootsDist = Math.sqrt(hootsDx * hootsDx + hootsDz * hootsDz);
    const nearHoots = hootsDist < HOOTS_INTERACT_DISTANCE;
    if (nearHoots !== prevNearValues.current.hoots) {
      prevNearValues.current.hoots = nearHoots;
      if (onNearHoots) onNearHoots(nearHoots);
    }

    // Miles proximity check (walks around the clock edge every 24 hours)
    const milesDx = turtleX - milesPosition.current.x;
    const milesDz = turtleZ - milesPosition.current.z;
    const milesDist = Math.sqrt(milesDx * milesDx + milesDz * milesDz);
    const nearMiles = milesDist < MILES_INTERACT_DISTANCE;
    if (nearMiles !== prevNearValues.current.miles) {
      prevNearValues.current.miles = nearMiles;
      if (onNearMiles) onNearMiles(nearMiles);
    }

    // Check portal proximity
    let nearestPortal = null;
    let nearestPortalDist = Infinity;
    for (const [realm, isUnlocked] of Object.entries(unlockedRealms)) {
      if (isUnlocked) {
        let portalPos;
        if (realm === 'inchworm') {
          // Miles portal follows him - use current Miles position
          portalPos = [milesPosition.current.x, 0, milesPosition.current.z];
        } else if (PORTAL_POSITIONS[realm]) {
          portalPos = PORTAL_POSITIONS[realm];
        } else {
          continue; // No valid position
        }
        const portalDx = turtleX - portalPos[0];
        const portalDz = turtleZ - portalPos[2];
        const portalDist = Math.sqrt(portalDx * portalDx + portalDz * portalDz);
        if (portalDist < PORTAL_INTERACT_DISTANCE && portalDist < nearestPortalDist) {
          nearestPortal = realm;
          nearestPortalDist = portalDist;
        }
      }
    }
    if (nearestPortal !== prevNearValues.current.portal) {
      prevNearValues.current.portal = nearestPortal;
      if (onNearPortal) onNearPortal(nearestPortal);
    }

    // === COOTER BLOCKING SECOND HAND DETECTION ===
    // Only check when in hub and NOT during déjà vu (time is flowing)
    const dv = dejaVuState.current;
    const cbs = cooterBlockingState.current;

    if (activeRealm === 'hub' && !dv.isActive) {
      // Calculate second hand direction from the current displayed angle
      const handAngle = displayedSecondAngle.current;
      const handDirX = Math.sin(handAngle);
      const handDirZ = Math.cos(handAngle);

      // Project turtle position onto second hand direction
      // Dot product gives distance along the hand
      const dotProduct = turtleX * handDirX + turtleZ * handDirZ;

      // Perpendicular distance from turtle to the hand line
      const perpDistance = Math.abs(turtleX * handDirZ - turtleZ * handDirX);

      // Check if turtle is blocking the second hand:
      // - Must be in front of center (dotProduct > 0)
      // - Must be within the hand's length
      // - Must be close enough (perpendicular distance within collision width)
      const isBlockingSecondHand =
        dotProduct > 0.3 && // Not too close to center
        dotProduct < SECOND_HAND_LENGTH &&
        perpDistance < SECOND_HAND_COLLISION_WIDTH;

      if (isBlockingSecondHand) {
        if (!cbs.isBlocking) {
          // Just started blocking
          cbs.isBlocking = true;
          cbs.blockingTime = 0;
          cbs.lastGrainRemovalTime = 0;
        } else {
          // Continue blocking - accumulate time
          cbs.blockingTime += delta;

          // After grace period, start removing grains
          if (cbs.blockingTime > COOTER_BLOCKING_GRACE_PERIOD) {
            const timeSinceGrace = cbs.blockingTime - COOTER_BLOCKING_GRACE_PERIOD;
            const grainsToRemove = Math.floor(timeSinceGrace / COOTER_GRAIN_REMOVAL_INTERVAL);

            // Remove grains if we've passed the threshold
            if (grainsToRemove > cbs.lastGrainRemovalTime && onCooterBlockingGrain) {
              onCooterBlockingGrain();
              cbs.lastGrainRemovalTime = grainsToRemove;
            }
          }
        }
      } else {
        // Not blocking - reset state
        cbs.isBlocking = false;
        cbs.blockingTime = 0;
        cbs.lastGrainRemovalTime = 0;
      }
    } else {
      // Reset when not in hub or during déjà vu
      cbs.isBlocking = false;
      cbs.blockingTime = 0;
      cbs.lastGrainRemovalTime = 0;
    }

    const realSecondAngle = angles.second;

    // DÉJÀ VU LOGIC - Nox stops time at 59 seconds every minute
    if (activeRealm === 'hub') {
      if (!dv.isActive) {
        // Check if we should trigger déjà vu
        if (currentSecond === DEJA_VU_TRIGGER_SECOND && currentMinute !== dv.lastTriggerMinute) {
          // Trigger déjà vu!
          dv.isActive = true;
          dv.progress = 0;
          dv.frozenAngle = realSecondAngle;
          dv.lastTriggerMinute = currentMinute;
          setTimeStopped(true);
          setDejaVuStateForRender({ isActive: true, progress: 0 });
        }
        // Note: Don't immediately sync to real time here - let catch-up logic handle it smoothly
      } else {
        // Déjà vu is active - hold the second hand
        dv.progress += delta / DEJA_VU_DURATION;
        displayedSecondAngle.current = dv.frozenAngle;

        // Check if déjà vu is complete
        if (dv.progress >= 1) {
          // Spawn 3 time grains with random colors!
          // Only 4 colors: green(frog), gold(rabbit), orange(cat), cyan(miles)
          // These are used to unlock portals - owl needs 3 of each = 12 total
          const essenceTypes = ['forest', 'golden', 'amber', 'cyan'];
          const newGrains = [];
          const nowSeconds = Date.now() / 1000;
          for (let i = 0; i < 3; i++) {
            const randomEssence = essenceTypes[Math.floor(Math.random() * essenceTypes.length)];
            newGrains.push({
              id: Date.now() + i, // Unique IDs
              position: getRandomClockPosition(),
              spawnTime: nowSeconds,
              essenceType: randomEssence,
            });
          }
          setSandGrains(prev => {
            // First, remove expired grains (older than GRAIN_LIFETIME)
            const validGrains = prev.filter(g => (nowSeconds - g.spawnTime) < GRAIN_LIFETIME);
            // Combine with new grains
            const combined = [...validGrains, ...newGrains];
            // If over limit, remove oldest grains first
            if (combined.length > MAX_GRAINS) {
              // Sort by spawn time (oldest first) and take only the newest MAX_GRAINS
              combined.sort((a, b) => b.spawnTime - a.spawnTime);
              return combined.slice(0, MAX_GRAINS);
            }
            return combined;
          });

          // End déjà vu
          dv.isActive = false;
          dv.progress = 0;
          setTimeStopped(false);
          setDejaVuStateForRender({ isActive: false, progress: 0 });
        } else {
          setDejaVuStateForRender({ isActive: true, progress: dv.progress });
        }
      }
    } else {
      // In a realm game - just run real time
      displayedSecondAngle.current = realSecondAngle;
      if (dv.isActive) {
        dv.isActive = false;
        dv.progress = 0;
        setTimeStopped(false);
        setDejaVuStateForRender({ isActive: false, progress: 0 });
      }
    }

    // Catch-up logic when déjà vu ends
    if (!dv.isActive && activeRealm === 'hub') {
      const currentDisplayed = normalizeAngle(displayedSecondAngle.current);
      const targetAngle = normalizeAngle(realSecondAngle);

      let diff = targetAngle - currentDisplayed;
      if (diff > Math.PI) diff -= Math.PI * 2;
      else if (diff < -Math.PI) diff += Math.PI * 2;

      if (Math.abs(diff) > 0.01) {
        const catchupAmount = Math.min(Math.abs(diff), CATCHUP_SPEED * delta * (1 + Math.abs(diff)));
        displayedSecondAngle.current += Math.sign(diff) * catchupAmount;
      } else {
        displayedSecondAngle.current = realSecondAngle;
      }
    }

    // Update second hand rotation (Hoots is a child and inherits this rotation)
    if (secondHandRef.current) {
      secondHandRef.current.rotation.y = -displayedSecondAngle.current;
    }

    // Second hand color - glow cyan during déjà vu
    if (secondHandMaterialRef.current) {
      if (dv.isActive) {
        secondHandMaterialRef.current.emissive = new THREE.Color(0x00ffff);
        secondHandMaterialRef.current.emissiveIntensity = 0.3 + 0.2 * Math.sin(Date.now() / 200);
      } else {
        secondHandMaterialRef.current.color = GOLD_COLOR;
        secondHandMaterialRef.current.emissive = new THREE.Color(0x000000);
        secondHandMaterialRef.current.emissiveIntensity = 0;
      }
    }

    if (secondHandTailMaterialRef.current) {
      if (dv.isActive) {
        secondHandTailMaterialRef.current.emissive = new THREE.Color(0x00ffff);
        secondHandTailMaterialRef.current.emissiveIntensity = 0.3 + 0.2 * Math.sin(Date.now() / 200);
      } else {
        secondHandTailMaterialRef.current.color = GOLD_COLOR;
        secondHandTailMaterialRef.current.emissive = new THREE.Color(0x000000);
        secondHandTailMaterialRef.current.emissiveIntensity = 0;
      }
    }

    // Animate gears (stop during déjà vu)
    if (!dv.isActive) {
      const gearSpeed = delta * 2;
      if (gear1Ref.current) gear1Ref.current.rotation.y += gearSpeed;
      if (gear2Ref.current) gear2Ref.current.rotation.y -= gearSpeed * 1.5;
      if (gear3Ref.current) gear3Ref.current.rotation.y -= gearSpeed * 0.8;
      if (gear4Ref.current) gear4Ref.current.rotation.y -= gearSpeed * 2.2;
      if (gear5Ref.current) gear5Ref.current.rotation.y -= gearSpeed * 1.2;

      if (escapementRef.current) {
        escapementRef.current.rotation.y = Math.sin(Date.now() / 150) * 0.3;
      }
    }
  });

  return (
    <group>
      {/* Lighting */}
      <pointLight position={[0, -CLOCK_THICKNESS / 2 + 0.3, 0]} intensity={2.5} color="#FFFAF0" distance={12} decay={1.5} />
      <pointLight position={[2, -CLOCK_THICKNESS / 2 + 0.2, 1]} intensity={1.2} color="#FFF8E7" distance={8} decay={2} />
      <pointLight position={[-2, -CLOCK_THICKNESS / 2 + 0.2, -1]} intensity={1.2} color="#FFF8E7" distance={8} decay={2} />

      {/* Gold back plate */}
      <mesh position={[0, -CLOCK_THICKNESS / 2 - 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[CLOCK_RADIUS - 0.1, CLOCK_RADIUS - 0.1, 0.1, 64]} />
        <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Geneva stripes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`stripe-${i}`} position={[0, -CLOCK_THICKNESS / 2 - 0.01, 0]} rotation={[0, i * Math.PI / 6, 0]}>
          <boxGeometry args={[CLOCK_RADIUS * 1.8, 0.02, 0.15]} />
          <meshStandardMaterial color="#E8C252" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Gears */}
      <group ref={gear1Ref} position={[0, -CLOCK_THICKNESS / 2 + 0.15, 0]}>
        <mesh><cylinderGeometry args={[1.2, 1.2, 0.15, 32]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} /></mesh>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 10) * 1.32, 0, Math.cos(i * Math.PI / 10) * 1.32]} rotation={[0, i * Math.PI / 10, 0]}>
            <boxGeometry args={[0.18, 0.15, 0.25]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      <group ref={gear2Ref} position={[2.2, -CLOCK_THICKNESS / 2 + 0.15, 0.8]}>
        <mesh><cylinderGeometry args={[0.8, 0.8, 0.12, 24]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} /></mesh>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 8) * 0.88, 0, Math.cos(i * Math.PI / 8) * 0.88]} rotation={[0, i * Math.PI / 8, 0]}>
            <boxGeometry args={[0.12, 0.12, 0.18]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      <group ref={gear3Ref} position={[-1.8, -CLOCK_THICKNESS / 2 + 0.15, -1.2]}>
        <mesh><cylinderGeometry args={[0.6, 0.6, 0.1, 20]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} /></mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 0.68, 0, Math.cos(i * Math.PI / 6) * 0.68]} rotation={[0, i * Math.PI / 6, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.15]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      <group ref={gear4Ref} position={[1.0, -CLOCK_THICKNESS / 2 + 0.12, -0.6]}>
        <mesh><cylinderGeometry args={[0.35, 0.35, 0.08, 18]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} /></mesh>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 5) * 0.42, 0, Math.cos(i * Math.PI / 5) * 0.42]} rotation={[0, i * Math.PI / 5, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.12]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      <group ref={gear5Ref} position={[-0.5, -CLOCK_THICKNESS / 2 + 0.12, 1.8]}>
        <mesh><cylinderGeometry args={[0.5, 0.5, 0.1, 20]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} /></mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 0.58, 0, Math.cos(i * Math.PI / 6) * 0.58]} rotation={[0, i * Math.PI / 6, 0]}>
            <boxGeometry args={[0.09, 0.1, 0.14]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      <group ref={escapementRef} position={[2.8, -CLOCK_THICKNESS / 2 + 0.15, -1.5]}>
        <mesh><cylinderGeometry args={[0.4, 0.4, 0.05, 24]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} /></mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * Math.PI / 4) * 0.48, 0, Math.cos(i * Math.PI / 4) * 0.48]} rotation={[0, i * Math.PI / 4, 0]}>
            <boxGeometry args={[0.08, 0.05, 0.12]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Glass clock face - simplified material to avoid ghosting/doubling */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[CLOCK_RADIUS, CLOCK_RADIUS, CLOCK_THICKNESS, 64]} />
        <meshStandardMaterial color="#f5f5f0" transparent={true} opacity={0.15} roughness={0.1} metalness={0.0} />
      </mesh>

      {/* Gold rims */}
      <mesh position={[0, CLOCK_THICKNESS / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CLOCK_RADIUS, 0.12, 16, 64]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, -CLOCK_THICKNESS / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CLOCK_RADIUS, 0.12, 16, 64]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Center pivot */}
      <mesh position={[0, CLOCK_THICKNESS / 2 + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} /><meshStandardMaterial color="#FFE55C" metalness={0.98} roughness={0.08} />
      </mesh>

      {/* Hour markers */}
      {HOUR_MARKERS.map((marker, i) => (
        <group key={i} position={marker.position}>
          <mesh castShadow>
            <boxGeometry args={[marker.isMain ? 0.15 : 0.08, 0.05, marker.isMain ? 0.4 : 0.2]} />
            <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* Hour hand */}
      <group ref={hourHandRef} position={[0, CLOCK_THICKNESS / 2 + 0.05, 0]}>
        <mesh position={[0, 0.04, CLOCK_RADIUS * 0.35]} castShadow>
          <boxGeometry args={[0.2, 0.08, CLOCK_RADIUS * 0.5]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Minute hand */}
      <group ref={minuteHandRef} position={[0, CLOCK_THICKNESS / 2 + 0.1, 0]}>
        <mesh position={[0, 0.03, CLOCK_RADIUS * 0.35]} castShadow>
          <boxGeometry args={[0.12, 0.06, CLOCK_RADIUS * 0.65]} /><meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Second hand */}
      <group ref={secondHandRef} position={[0, CLOCK_THICKNESS / 2 + 0.15, 0]}>
        <mesh position={[0, 0.02, CLOCK_RADIUS * 0.35]} castShadow>
          <boxGeometry args={[0.04, 0.04, CLOCK_RADIUS * 0.65]} />
          <meshStandardMaterial ref={secondHandMaterialRef} color="#FFD700" metalness={0.95} roughness={0.12} />
        </mesh>
        <mesh position={[0, 0.02, -CLOCK_RADIUS * 0.15]} castShadow>
          <boxGeometry args={[0.06, 0.04, CLOCK_RADIUS * 0.2]} />
          <meshStandardMaterial ref={secondHandTailMaterialRef} color="#FFD700" metalness={0.95} roughness={0.12} />
        </mesh>
        {/* Hoots sits on the tail of the second hand */}
        <HootsOnHand />
      </group>

      {/* Sand grains */}
      {sandGrains.map(grain => (
        <SandGrain
          key={grain.id}
          id={grain.id}
          position={grain.position}
          spawnTime={grain.spawnTime}
          essenceType={grain.essenceType}
          turtlePosition={turtlePosition}
          onNearGrain={handleGrainNear}
        />
      ))}

      {/* NPCs */}
      <AnimalPortalWrapper isEntering={animalEnteringPortal === 'rabbit'} portalPosition={PORTAL_POSITIONS.rabbit}>
        <Rabbit />
      </AnimalPortalWrapper>

      <AnimalPortalWrapper isEntering={animalEnteringPortal === 'cat'} portalPosition={PORTAL_POSITIONS.cat}>
        <Cat />
      </AnimalPortalWrapper>

      <AnimalPortalWrapper isEntering={animalEnteringPortal === 'frog'} portalPosition={PORTAL_POSITIONS.frog}>
        <Frog />
      </AnimalPortalWrapper>

      <Gnome victoryCeremony={!!victoryCeremony} />

      {/* Amber Pyramid - shows collected shards, floating above AEIOU's head */}
      <AmberPyramid
        pyramidShards={pyramidShards}
        position={[GNOME_POS_X, CLOCK_THICKNESS / 2 + 0.9, GNOME_POS_Z]}
      />

      {/* Y (Nox) - the elephant gnome who stops time at 59 seconds */}
      <Nox dejaVuState={dejaVuStateForRender} />

      {/* Miles the Inchworm - walks around the clock face edge every 24 hours */}
      <Miles
        dejaVuState={dejaVuStateForRender}
        onPositionUpdate={(x, z) => {
          milesPosition.current.x = x;
          milesPosition.current.z = z;
        }}
      />

      {/* Portals - static positions (excluding owl and inchworm which are dynamic) */}
      {Object.entries(unlockedRealms).map(([realm, isUnlocked]) => (
        isUnlocked && PORTAL_POSITIONS[realm] && realm !== 'owl' && (
          <Portal
            key={realm}
            position={PORTAL_POSITIONS[realm]}
            animal={realm}
            isOpen={true}
            size={1.5}
          />
        )
      ))}

      {/* Miles Portal - hovers above Miles and follows him */}
      <MilesPortal
        milesPositionRef={milesPosition}
        isUnlocked={unlockedRealms?.inchworm || false}
      />

      {/* Owl Portal - sits at center of clock, spins with second hand facing Hoots */}
      <OwlPortal
        secondAngleRef={displayedSecondAngle}
        isUnlocked={unlockedRealms?.owl || false}
      />

      {/* Victory ceremony shard */}
      {victoryCeremony && (
        <CeremonyShard gnomePosition={[GNOME_POS_X, CLOCK_THICKNESS / 2 + 0.5, GNOME_POS_Z - 0.8]} isFading={victoryCeremony.isFading || false} />
      )}

      {/* Fireflies removed for performance */}
    </group>
  );
});

export default Clock;
