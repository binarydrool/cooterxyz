"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Moon settings
const MOON_DISTANCE = 180;       // Distance from clock center
const MOON_SIZE = 10;            // Visual size of moon
const MOONRISE_HOUR = 18;        // Moon rises at 6 PM
const MOONSET_HOUR = 6;          // Moon sets at 6 AM

/**
 * Calculate moon position based on time
 * Moon rises in EAST (3 o'clock = +X), sets in WEST (9 o'clock = -X)
 * Arc goes over SOUTH (opposite side from sun during day)
 * @param {number} hour - Current hour as decimal
 * @returns {{ position: [number, number, number], visible: boolean, intensity: number }}
 */
function getMoonPosition(hour) {

  // Moon is visible from 6 PM to 6 AM (nighttime)
  let nightProgress;
  let visible = false;

  if (hour >= MOONRISE_HOUR) {
    // Evening: 6 PM to midnight
    nightProgress = (hour - MOONRISE_HOUR) / 12; // 0 to 0.5
    visible = true;
  } else if (hour < MOONSET_HOUR) {
    // Early morning: midnight to 6 AM
    nightProgress = 0.5 + hour / 12; // 0.5 to 1
    visible = true;
  } else {
    // Daytime: moon below horizon
    return {
      position: [0, -MOON_DISTANCE, 0],
      visible: false,
      intensity: 0,
    };
  }

  // Moon arc: starts at EAST (+X), goes over, ends at WEST (-X)
  const arcAngle = nightProgress * Math.PI;

  // Position calculation similar to sun but offset
  const x = Math.cos(arcAngle) * MOON_DISTANCE;
  const y = Math.sin(arcAngle) * MOON_DISTANCE * 0.7;
  const z = -Math.sin(arcAngle) * MOON_DISTANCE * 0.25;

  // Calculate light intensity based on moon height
  const heightFactor = Math.sin(arcAngle);
  const intensity = 0.1 + heightFactor * 0.2; // Moon light is much dimmer than sun

  return {
    position: [x, y, z],
    visible,
    intensity,
  };
}

/**
 * Moon component with visual representation, ambient light, and directional light
 */
export default function Moon() {
  const groupRef = useRef();
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();
  const meshRef = useRef();
  const glowRef = useRef();

  // Bright white glow material for moon
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        intensity: { value: 0.8 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
          float glow = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(color, glow * intensity * 0.4);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Cache time calculation - only update once per second
  const lastSecondRef = useRef(-1);
  const cachedHourRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Only recalculate time once per second
    const currentSecond = Math.floor(state.clock.elapsedTime);
    if (currentSecond !== lastSecondRef.current) {
      lastSecondRef.current = currentSecond;
      const now = new Date();
      cachedHourRef.current = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    }

    const { position, visible, intensity } = getMoonPosition(cachedHourRef.current);

    // Update moon position
    groupRef.current.position.set(...position);

    // Update visibility
    if (meshRef.current) meshRef.current.visible = visible;
    if (glowRef.current) glowRef.current.visible = visible;

    // Update ambient light from moon
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = visible ? 0.15 + intensity * 0.1 : 0;
    }

    // Update directional light from moon
    if (directionalLightRef.current) {
      directionalLightRef.current.position.set(...position);
      directionalLightRef.current.intensity = visible ? 0.3 + intensity * 0.3 : 0;
    }
  });

  return (
    <group>
      {/* Moon visual - reduced geometry */}
      <group ref={groupRef}>
        {/* Moon surface */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[MOON_SIZE, 16, 16]} />
          <meshStandardMaterial
            color={0xffffff}
            emissive={0xffffff}
            emissiveIntensity={0.5}
            roughness={0.4}
            metalness={0.0}
            toneMapped={false}
          />
        </mesh>

        {/* Moon glow */}
        <mesh ref={glowRef} scale={[1.3, 1.3, 1.3]}>
          <sphereGeometry args={[MOON_SIZE, 16, 16]} />
          <primitive object={glowMaterial} attach="material" />
        </mesh>
      </group>

      {/* Ambient light from moon */}
      <ambientLight
        ref={ambientLightRef}
        color={0xeeeeff}
        intensity={0.15}
      />

      {/* Directional light from moon - no shadows for performance */}
      <directionalLight
        ref={directionalLightRef}
        color={0xffffff}
        intensity={0.5}
      />
    </group>
  );
}

// Export for use in other components
export { getMoonPosition, MOONRISE_HOUR, MOONSET_HOUR };
