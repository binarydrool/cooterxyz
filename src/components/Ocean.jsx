"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Ocean settings
const OCEAN_SIZE = 10000;       // Very large to appear infinite
const OCEAN_DEPTH = -50;        // Closer to clock for better horizon

/**
 * Get ocean color based on time of day
 * @param {number} hour - Hour of day (0-23)
 * @returns {THREE.Color} Ocean color
 */
function getOceanColor(hour) {
  // Night (8 PM - 5 AM): Dark blue
  if (hour >= 20 || hour < 5) {
    return new THREE.Color(0x0a1628);
  }
  // Dawn/Dusk (5-7 AM, 7-8 PM): Deep blue with warm tint
  if ((hour >= 5 && hour < 7) || (hour >= 19 && hour < 20)) {
    return new THREE.Color(0x1a3a5c);
  }
  // Sunrise/Sunset (7-8 AM, 5-7 PM): Medium blue with orange reflection
  if ((hour >= 7 && hour < 8) || (hour >= 17 && hour < 19)) {
    return new THREE.Color(0x2a5a7c);
  }
  // Morning/Afternoon (8-11 AM, 1-5 PM): Nice blue
  if ((hour >= 8 && hour < 11) || (hour >= 13 && hour < 17)) {
    return new THREE.Color(0x0077be);
  }
  // Noon (11 AM - 1 PM): Bright blue
  return new THREE.Color(0x0099dd);
}

/**
 * Create water shader material with animated waves
 */
function createWaterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      waterColor: { value: new THREE.Color(0x0077be) },
      deepColor: { value: new THREE.Color(0x001a33) },
      fogColor: { value: new THREE.Color(0x87ceeb) },
      fogNear: { value: 100 },
      fogFar: { value: 400 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vDistance;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vDistance = length(worldPos.xz);

        // Keep ocean perfectly flat - no vertex displacement
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 waterColor;
      uniform vec3 deepColor;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;

      varying vec2 vUv;
      varying float vDistance;
      varying vec3 vWorldPosition;

      // Simplex noise function for water texture
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                          -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                               dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        // Create animated water texture using noise
        vec2 uv = vWorldPosition.xz * 0.005;

        // Multiple layers of noise for complex water pattern
        float noise1 = snoise(uv * 2.0 + time * 0.1) * 0.5 + 0.5;
        float noise2 = snoise(uv * 4.0 - time * 0.15) * 0.5 + 0.5;
        float noise3 = snoise(uv * 8.0 + time * 0.05) * 0.5 + 0.5;

        float pattern = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

        // Add caustic-like highlights
        float caustic = pow(pattern, 2.0) * 0.3;

        // Mix water and deep colors based on pattern
        vec3 color = mix(deepColor, waterColor, pattern * 0.7 + 0.3);
        color += vec3(caustic * 0.5, caustic * 0.7, caustic);

        // Add specular highlights
        float spec = pow(noise1 * noise2, 4.0) * 0.4;
        color += vec3(spec);

        // Distance-based fog for flat horizon effect
        // Use aggressive fog to completely hide the edge
        float fogFactor = smoothstep(fogNear, fogFar, vDistance);
        fogFactor = fogFactor * fogFactor; // Square for sharper falloff
        color = mix(color, fogColor, fogFactor);

        // Fully opaque - let fog handle the blending
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Ocean component - animated water surface far below the clock
 */
export default function Ocean() {
  const meshRef = useRef();
  const materialRef = useRef();

  // Create water shader material
  const material = useMemo(() => createWaterMaterial(), []);

  useFrame((state) => {
    if (!materialRef.current) return;

    const time = state.clock.elapsedTime;

    // Update shader time uniform
    materialRef.current.uniforms.time.value = time;

    // Update color based on time of day
    const hour = new Date().getHours();
    const targetColor = getOceanColor(hour);
    materialRef.current.uniforms.waterColor.value.lerp(targetColor, 0.01);

    // Update fog color based on sky
    const isNight = hour >= 20 || hour < 5;
    const fogTarget = isNight
      ? new THREE.Color(0x0a0a1a)
      : new THREE.Color(0x87ceeb);
    materialRef.current.uniforms.fogColor.value.lerp(fogTarget, 0.01);
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, OCEAN_DEPTH, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[OCEAN_SIZE, OCEAN_SIZE, 128, 128]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}

export { OCEAN_DEPTH };
