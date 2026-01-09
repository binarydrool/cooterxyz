"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Flower color options
const FLOWER_COLORS = {
  lotus: '#FF69B4',      // Pink
  waterlily: '#FFFFFF',  // White
  purple: '#9370DB',     // Purple
  yellow: '#FFD700'      // Yellow
};

const PETAL_COUNTS = {
  lotus: 8,
  waterlily: 6,
  purple: 6,
  yellow: 5
};

/**
 * Flower - Decorative flower that cannot be landed on
 * Props:
 * - position: [x, y, z] position
 * - type: 'lotus' | 'waterlily' | 'purple' | 'yellow'
 * - size: scale factor (default 1)
 */
export default function Flower({ position = [0, 0, 0], type = 'lotus', size = 1 }) {
  const groupRef = useRef();
  const petalRef = useRef();
  const bobOffset = useRef(Math.random() * Math.PI * 2);

  const color = FLOWER_COLORS[type] || FLOWER_COLORS.lotus;
  const petalCount = PETAL_COUNTS[type] || 6;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle bobbing like lily pads
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.5 + bobOffset.current) * 0.03;
    }
    if (petalRef.current) {
      // Slow rotation for visual interest
      petalRef.current.rotation.y = clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[size, size, size]}>
      {/* Flower base/pad (darker green, same size as lily pad) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshStandardMaterial color="#1a5c1a" roughness={0.9} />
      </mesh>

      {/* Inner pad ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.8, 16]} />
        <meshStandardMaterial color="#228B22" roughness={0.85} />
      </mesh>

      {/* Petals */}
      <group ref={petalRef} position={[0, 0.08, 0]}>
        {Array.from({ length: petalCount }).map((_, i) => {
          const angle = (i / petalCount) * Math.PI * 2;
          const x = Math.cos(angle) * 0.35;
          const z = Math.sin(angle) * 0.35;
          return (
            <mesh
              key={i}
              position={[x, 0.05, z]}
              rotation={[-0.3, angle, 0]}
            >
              <sphereGeometry args={[0.25, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial
                color={color}
                roughness={0.6}
                side={2} // DoubleSide
              />
            </mesh>
          );
        })}

        {/* Inner petals (smaller, more upright) */}
        {Array.from({ length: petalCount }).map((_, i) => {
          const angle = (i / petalCount) * Math.PI * 2 + Math.PI / petalCount;
          const x = Math.cos(angle) * 0.18;
          const z = Math.sin(angle) * 0.18;
          return (
            <mesh
              key={`inner-${i}`}
              position={[x, 0.1, z]}
              rotation={[-0.5, angle, 0]}
            >
              <sphereGeometry args={[0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial
                color={color}
                roughness={0.5}
                side={2}
              />
            </mesh>
          );
        })}

        {/* Center - bright yellow pistil */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial
            color="#FFD700"
            roughness={0.4}
            emissive="#FFD700"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Center dots */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 0.08;
          const z = Math.sin(angle) * 0.08;
          return (
            <mesh key={`dot-${i}`} position={[x, 0.2, z]}>
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#FFA500" roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
