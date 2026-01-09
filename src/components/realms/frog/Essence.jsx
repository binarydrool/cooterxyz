"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Essence - N64 style magical crystal collectible with beacon
 */
export default function Essence({ position = [0, 0, 0], collected = false }) {
  const groupRef = useRef();
  const innerRef = useRef();
  const outerRef = useRef();
  const beaconRef = useRef();

  useFrame(({ clock }) => {
    if (collected || !groupRef.current) return;

    // Float up and down - more bouncy N64 style
    const float = Math.sin(clock.elapsedTime * 3) * 0.3;
    groupRef.current.position.y = position[1] + 2 + float;

    // Rotate crystal - faster spin
    if (innerRef.current) {
      innerRef.current.rotation.y = clock.elapsedTime * 2.5;
      innerRef.current.rotation.z = Math.sin(clock.elapsedTime) * 0.15;
    }

    // Pulse glow
    if (outerRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.25;
      outerRef.current.scale.set(pulse, pulse, pulse);
    }

    // Beacon pulse
    if (beaconRef.current) {
      const beaconPulse = 0.8 + Math.sin(clock.elapsedTime * 2) * 0.2;
      beaconRef.current.scale.set(1, beaconPulse, 1);
    }
  });

  if (collected) return null;

  return (
    <group>
      {/* Crystal group */}
      <group ref={groupRef} position={[position[0], position[1] + 2, position[2]]}>
        {/* Outer glow - vibrant green */}
        <mesh ref={outerRef}>
          <sphereGeometry args={[0.8, 12, 12]} />
          <meshBasicMaterial color="#00ff66" transparent opacity={0.35} />
        </mesh>

        {/* Inner crystal - N64 style gem */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color="#00ff44"
            emissive="#00ff44"
            emissiveIntensity={1}
            roughness={0.1}
            metalness={0.5}
          />
        </mesh>

        {/* Bright core */}
        <mesh>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#aaffcc" />
        </mesh>
      </group>

      {/* Beacon pillar - visible from far away */}
      <mesh ref={beaconRef} position={[position[0], 6, position[2]]}>
        <cylinderGeometry args={[0.2, 0.3, 12, 6]} />
        <meshBasicMaterial color="#44ff88" transparent opacity={0.35} />
      </mesh>

      {/* Beacon top */}
      <mesh position={[position[0], 12, position[2]]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial color="#88ffaa" transparent opacity={0.5} />
      </mesh>

      {/* Ground ring */}
      <mesh position={[position[0], 0.15, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.5, 16]} />
        <meshBasicMaterial color="#44ff88" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
