"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Individual seagull that flies in a pattern
function Seagull({ startPosition, speed, direction, wingSpeed, scale = 1 }) {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const positionRef = useRef(new THREE.Vector3(...startPosition));
  const timeRef = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    timeRef.current += delta;
    const t = timeRef.current;

    // Move in the flight direction with gentle sine wave for organic motion
    positionRef.current.x += direction.x * speed * delta;
    positionRef.current.z += direction.z * speed * delta;
    positionRef.current.y = startPosition[1] + Math.sin(t * 0.5) * 2; // Gentle up/down

    // Reset position when too far away
    const distFromCenter = Math.sqrt(
      positionRef.current.x * positionRef.current.x +
      positionRef.current.z * positionRef.current.z
    );
    if (distFromCenter > 80) {
      // Respawn on opposite side
      positionRef.current.x = -direction.x * 70 + (Math.random() - 0.5) * 20;
      positionRef.current.z = -direction.z * 70 + (Math.random() - 0.5) * 20;
    }

    groupRef.current.position.copy(positionRef.current);

    // Wing flapping animation
    if (leftWingRef.current && rightWingRef.current) {
      const wingAngle = Math.sin(t * wingSpeed) * 0.4;
      leftWingRef.current.rotation.z = wingAngle;
      rightWingRef.current.rotation.z = -wingAngle;
    }
  });

  // Simple seagull made of basic shapes
  return (
    <group ref={groupRef} position={startPosition} scale={[scale, scale, scale]}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
        <meshBasicMaterial color="#f5f5f5" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.1, 0.35]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#f5f5f5" />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0.05, 0.5]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.04, 0.15, 4]} />
        <meshBasicMaterial color="#ff9500" />
      </mesh>

      {/* Left wing */}
      <group ref={leftWingRef} position={[0.15, 0.05, 0]}>
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.5, 0.03, 0.3]} />
          <meshBasicMaterial color="#e0e0e0" />
        </mesh>
      </group>

      {/* Right wing */}
      <group ref={rightWingRef} position={[-0.15, 0.05, 0]}>
        <mesh position={[-0.25, 0, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.5, 0.03, 0.3]} />
          <meshBasicMaterial color="#e0e0e0" />
        </mesh>
      </group>

      {/* Tail */}
      <mesh position={[0, 0.05, -0.35]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.15, 0.02, 0.2]} />
        <meshBasicMaterial color="#e8e8e8" />
      </mesh>
    </group>
  );
}

// Seagull flock manager
export default function Seagulls({ count = 8 }) {
  const seagulls = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Random starting positions in the far distance
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 30;
      const height = 15 + Math.random() * 25;

      // Direction towards/across the scene
      const dirAngle = angle + Math.PI + (Math.random() - 0.5) * 0.8;

      arr.push({
        id: i,
        startPosition: [
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance,
        ],
        speed: 3 + Math.random() * 4,
        direction: {
          x: Math.cos(dirAngle),
          z: Math.sin(dirAngle),
        },
        wingSpeed: 8 + Math.random() * 4,
        scale: 0.8 + Math.random() * 0.4,
      });
    }
    return arr;
  }, [count]);

  return (
    <group>
      {seagulls.map((seagull) => (
        <Seagull
          key={seagull.id}
          startPosition={seagull.startPosition}
          speed={seagull.speed}
          direction={seagull.direction}
          wingSpeed={seagull.wingSpeed}
          scale={seagull.scale}
        />
      ))}
    </group>
  );
}
