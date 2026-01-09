"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Sun settings
const SUN_DISTANCE = 200;        // Distance from clock center
const SUN_SIZE = 15;             // Visual size of sun
const SUNRISE_HOUR = 6;          // Sun rises at 6 AM
const SUNSET_HOUR = 18;          // Sun sets at 6 PM

/**
 * Calculate sun position based on time
 * Sun rises in EAST (3 o'clock = +X), sets in WEST (9 o'clock = -X)
 * Arc goes over SOUTH (6 o'clock = -Z)
 * @returns {{ position: [number, number, number], visible: boolean, intensity: number }}
 */
function getSunPosition() {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  // Sun is only visible between sunrise and sunset
  if (hour < SUNRISE_HOUR || hour > SUNSET_HOUR) {
    return {
      position: [0, -SUN_DISTANCE, 0], // Below horizon
      visible: false,
      intensity: 0,
    };
  }

  // Calculate progress through the day (0 = sunrise, 1 = sunset)
  const dayProgress = (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);

  // Sun arc: starts at EAST (+X), goes over SOUTH (-Z), ends at WEST (-X)
  // Use a semicircle path
  const arcAngle = dayProgress * Math.PI; // 0 to PI radians

  // Position calculation:
  // At sunrise (arcAngle = 0): x = +distance, y = 0, z = 0 (EAST horizon)
  // At noon (arcAngle = PI/2): x = 0, y = +distance, z = -distance * something (overhead, slightly south)
  // At sunset (arcAngle = PI): x = -distance, y = 0, z = 0 (WEST horizon)

  // X goes from +distance to -distance (East to West)
  const x = Math.cos(arcAngle) * SUN_DISTANCE;

  // Y follows a sine curve (0 at horizon, max at noon)
  const y = Math.sin(arcAngle) * SUN_DISTANCE * 0.8;

  // Z tilts slightly south at noon (the sun appears in the southern sky in northern hemisphere)
  const z = -Math.sin(arcAngle) * SUN_DISTANCE * 0.3;

  // Calculate light intensity based on sun height
  // Dimmer near horizon, brightest at noon
  const heightFactor = Math.sin(arcAngle);
  const intensity = 0.3 + heightFactor * 0.7;

  return {
    position: [x, y, z],
    visible: true,
    intensity,
  };
}

/**
 * Get sun color based on time of day
 * Warmer colors at sunrise/sunset, whiter at noon
 */
function getSunColor(dayProgress) {
  if (dayProgress < 0.15 || dayProgress > 0.85) {
    // Sunrise/sunset - warm orange
    return new THREE.Color(0xffa500);
  } else if (dayProgress < 0.3 || dayProgress > 0.7) {
    // Morning/afternoon - warm yellow
    return new THREE.Color(0xffdd44);
  } else {
    // Noon - bright yellow-white
    return new THREE.Color(0xffffcc);
  }
}

/**
 * Sun component with visual representation and directional light
 */
export default function Sun() {
  const groupRef = useRef();
  const lightRef = useRef();
  const meshRef = useRef();
  const glowRef = useRef();

  // Glow shader material for sun
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffff00) },
        intensity: { value: 1.0 },
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
          float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(color, glow * intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(() => {
    if (!groupRef.current || !lightRef.current) return;

    const { position, visible, intensity } = getSunPosition();

    // Update sun position
    groupRef.current.position.set(...position);

    // Update visibility and light
    if (meshRef.current) {
      meshRef.current.visible = visible;
    }
    if (glowRef.current) {
      glowRef.current.visible = visible;
    }

    // Update directional light
    lightRef.current.intensity = intensity;
    lightRef.current.position.set(...position);

    // Update sun color based on time
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const dayProgress = Math.max(0, Math.min(1, (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)));

    const sunColor = getSunColor(dayProgress);
    if (meshRef.current) {
      meshRef.current.material.color.lerp(sunColor, 0.05);
      meshRef.current.material.emissive.lerp(sunColor, 0.05);
    }
    if (glowMaterial.uniforms) {
      glowMaterial.uniforms.color.value.lerp(sunColor, 0.05);
      glowMaterial.uniforms.intensity.value = intensity;
    }
    lightRef.current.color.lerp(sunColor, 0.05);
  });

  return (
    <group>
      {/* Sun visual */}
      <group ref={groupRef}>
        {/* Sun core */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[SUN_SIZE, 32, 32]} />
          <meshStandardMaterial
            color={0xffff44}
            emissive={0xffff00}
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>

        {/* Sun glow */}
        <mesh ref={glowRef} scale={[1.5, 1.5, 1.5]}>
          <sphereGeometry args={[SUN_SIZE, 32, 32]} />
          <primitive object={glowMaterial} attach="material" />
        </mesh>
      </group>

      {/* Directional light from sun */}
      <directionalLight
        ref={lightRef}
        intensity={1}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={300}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
        shadow-radius={4}
        shadow-blurSamples={16}
      />
    </group>
  );
}

// Export for use in other components
export { getSunPosition, SUNRISE_HOUR, SUNSET_HOUR };
