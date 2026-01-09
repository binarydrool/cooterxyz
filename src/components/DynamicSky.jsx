"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getSunPosition, SUNRISE_HOUR, SUNSET_HOUR } from "./Sun";

// Shooting star settings
const SHOOTING_STAR_INTERVAL = 15 * 60 * 1000; // 15 minutes average
const SHOOTING_STAR_DURATION = 1.5; // seconds

// Sky dome settings
const SKY_RADIUS = 500;

// Sky colors based on sun position
const SKY_COLORS = {
  // Night - sun well below horizon
  NIGHT: {
    top: new THREE.Color(0x0a0615),      // Very dark purple-black
    horizon: new THREE.Color(0x0d0820),   // Dark purple
  },
  // Twilight - sun just below horizon
  TWILIGHT: {
    top: new THREE.Color(0x1a1040),       // Deep purple
    horizon: new THREE.Color(0x2a1a50),   // Purple
  },
  // Sunrise/Sunset - sun at horizon
  HORIZON: {
    top: new THREE.Color(0x4a6fa5),       // Light blue
    horizon: new THREE.Color(0xff7f50),   // Coral orange
  },
  // Low sun - sun just above horizon
  LOW_SUN: {
    top: new THREE.Color(0x5c6bc0),       // Indigo blue
    horizon: new THREE.Color(0xff6b6b),   // Red-orange
  },
  // Morning/Afternoon - sun moderate height
  MODERATE: {
    top: new THREE.Color(0x87ceeb),       // Sky blue
    horizon: new THREE.Color(0xb0e0e6),   // Powder blue
  },
  // Noon - sun high
  NOON: {
    top: new THREE.Color(0x4fc3f7),       // Bright blue
    horizon: new THREE.Color(0x81d4fa),   // Light blue
  },
};

/**
 * Get sky colors based on sun's vertical position
 * @param {number} sunY - Sun's Y position (positive = above horizon, negative = below)
 * @param {number} maxSunY - Maximum sun height at noon
 * @returns {{ top: THREE.Color, horizon: THREE.Color, isNight: boolean }}
 */
function getSkyColorsFromSunPosition(sunY, maxSunY) {
  // Normalize sun height (0 = horizon, 1 = noon max height, negative = below horizon)
  const normalizedHeight = sunY / maxSunY;

  if (normalizedHeight < -0.15) {
    // Sun well below horizon - full night
    return { ...SKY_COLORS.NIGHT, isNight: true, isDusk: false };
  } else if (normalizedHeight < -0.05) {
    // Sun just below horizon - twilight
    // Blend between night and twilight
    const t = (normalizedHeight + 0.15) / 0.1; // 0 at -0.15, 1 at -0.05
    return {
      top: SKY_COLORS.NIGHT.top.clone().lerp(SKY_COLORS.TWILIGHT.top, t),
      horizon: SKY_COLORS.NIGHT.horizon.clone().lerp(SKY_COLORS.TWILIGHT.horizon, t),
      isNight: true,
      isDusk: true,
    };
  } else if (normalizedHeight < 0.05) {
    // Sun at horizon - sunrise/sunset colors
    // Blend between twilight and horizon colors
    const t = (normalizedHeight + 0.05) / 0.1; // 0 at -0.05, 1 at 0.05
    return {
      top: SKY_COLORS.TWILIGHT.top.clone().lerp(SKY_COLORS.HORIZON.top, t),
      horizon: SKY_COLORS.TWILIGHT.horizon.clone().lerp(SKY_COLORS.HORIZON.horizon, t),
      isNight: normalizedHeight < 0,
      isDusk: true,
    };
  } else if (normalizedHeight < 0.2) {
    // Low sun - warm sky
    const t = (normalizedHeight - 0.05) / 0.15; // 0 at 0.05, 1 at 0.2
    return {
      top: SKY_COLORS.HORIZON.top.clone().lerp(SKY_COLORS.LOW_SUN.top, t),
      horizon: SKY_COLORS.HORIZON.horizon.clone().lerp(SKY_COLORS.LOW_SUN.horizon, t),
      isNight: false,
      isDusk: false,
    };
  } else if (normalizedHeight < 0.5) {
    // Moderate sun - transitioning to day colors
    const t = (normalizedHeight - 0.2) / 0.3; // 0 at 0.2, 1 at 0.5
    return {
      top: SKY_COLORS.LOW_SUN.top.clone().lerp(SKY_COLORS.MODERATE.top, t),
      horizon: SKY_COLORS.LOW_SUN.horizon.clone().lerp(SKY_COLORS.MODERATE.horizon, t),
      isNight: false,
      isDusk: false,
    };
  } else {
    // High sun - noon colors
    const t = Math.min(1, (normalizedHeight - 0.5) / 0.5); // 0 at 0.5, 1 at 1.0
    return {
      top: SKY_COLORS.MODERATE.top.clone().lerp(SKY_COLORS.NOON.top, t),
      horizon: SKY_COLORS.MODERATE.horizon.clone().lerp(SKY_COLORS.NOON.horizon, t),
      isNight: false,
      isDusk: false,
    };
  }
}

/**
 * Create gradient sky shader material
 */
function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x87ceeb) },
      horizonColor: { value: new THREE.Color(0xb0e0e6) },
      offset: { value: 20 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
}

/**
 * Stars component for night sky - many more stars for a rich night sky
 */
function Stars({ visible, intensity = 1 }) {
  const starsRef = useRef();
  const brightStarsRef = useRef();

  // Regular stars - lots of dim ones
  const starPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 8000; i++) {
      // Distribute stars across upper hemisphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Upper hemisphere only
      const r = SKY_RADIUS * 0.95;

      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    return new Float32Array(positions);
  }, []);

  // Bright stars - fewer but more visible
  const brightStarPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = SKY_RADIUS * 0.94;

      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    return new Float32Array(positions);
  }, []);

  useFrame(() => {
    if (starsRef.current) {
      // Twinkle effect
      const time = Date.now() * 0.001;
      starsRef.current.material.opacity = visible
        ? (0.6 + Math.sin(time * 2) * 0.15) * intensity
        : 0;
    }
    if (brightStarsRef.current) {
      const time = Date.now() * 0.001;
      brightStarsRef.current.material.opacity = visible
        ? (0.85 + Math.sin(time * 3 + 1) * 0.1) * intensity
        : 0;
    }
  });

  return (
    <group>
      {/* Many dim stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starPositions.length / 3}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.2}
          color={0xffffff}
          transparent
          opacity={visible ? 0.6 * intensity : 0}
          sizeAttenuation={false}
        />
      </points>
      {/* Fewer bright stars */}
      <points ref={brightStarsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={brightStarPositions.length / 3}
            array={brightStarPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          color={0xffffee}
          transparent
          opacity={visible ? 0.9 * intensity : 0}
          sizeAttenuation={false}
        />
      </points>
    </group>
  );
}

/**
 * Shooting star component - occasional meteor streaks
 */
function ShootingStar({ visible }) {
  const groupRef = useRef();
  const trailRef = useRef();
  const [active, setActive] = useState(false);
  const shootingState = useRef({
    startX: 0,
    startY: 0,
    startZ: 0,
    dirX: 0,
    dirY: 0,
    dirZ: 0,
    progress: 0,
    lastTrigger: 0,
    nextTrigger: Date.now() + Math.random() * SHOOTING_STAR_INTERVAL,
  });

  useFrame((_, delta) => {
    if (!visible) {
      setActive(false);
      return;
    }

    const now = Date.now();
    const ss = shootingState.current;

    // Check if we should start a new shooting star
    if (!active && now > ss.nextTrigger) {
      // Start a new shooting star
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.3 + 0.1; // Upper sky
      const r = SKY_RADIUS * 0.9;

      ss.startX = r * Math.sin(phi) * Math.cos(theta);
      ss.startY = r * Math.cos(phi);
      ss.startZ = r * Math.sin(phi) * Math.sin(theta);

      // Direction - downward and across
      const angle = Math.random() * Math.PI * 2;
      ss.dirX = Math.cos(angle) * 80;
      ss.dirY = -40 - Math.random() * 30;
      ss.dirZ = Math.sin(angle) * 80;

      ss.progress = 0;
      ss.lastTrigger = now;
      // Next shooting star in 10-20 minutes (randomized around 15 min average)
      ss.nextTrigger = now + SHOOTING_STAR_INTERVAL * (0.7 + Math.random() * 0.6);
      setActive(true);
    }

    // Animate active shooting star
    if (active && groupRef.current) {
      ss.progress += delta / SHOOTING_STAR_DURATION;

      if (ss.progress >= 1) {
        setActive(false);
        if (groupRef.current) groupRef.current.visible = false;
      } else {
        groupRef.current.visible = true;
        const t = ss.progress;
        groupRef.current.position.set(
          ss.startX + ss.dirX * t,
          ss.startY + ss.dirY * t,
          ss.startZ + ss.dirZ * t
        );

        // Look in direction of travel
        groupRef.current.lookAt(
          ss.startX + ss.dirX,
          ss.startY + ss.dirY,
          ss.startZ + ss.dirZ
        );

        // Fade out toward end
        if (trailRef.current) {
          const fade = t < 0.7 ? 1 : (1 - t) / 0.3;
          trailRef.current.material.opacity = fade * 0.9;
        }
      }
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {/* Bright head */}
      <mesh>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>
      {/* Trail */}
      <mesh ref={trailRef} position={[0, 0, 15]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.5, 30, 8]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.7} />
      </mesh>
      {/* Glow */}
      <pointLight color="#ffffff" intensity={50} distance={100} />
    </group>
  );
}

// Maximum sun height (used for normalization)
const MAX_SUN_HEIGHT = 200 * 0.8; // SUN_DISTANCE * 0.8 from Sun.jsx

/**
 * Dynamic sky dome component - colors based on sun position
 */
export default function DynamicSky() {
  const meshRef = useRef();
  const materialRef = useRef();
  const starsVisibleRef = useRef(false);
  const starsIntensityRef = useRef(0);

  // Create sky material
  const material = useMemo(() => createSkyMaterial(), []);

  useFrame(() => {
    if (!materialRef.current) return;

    // Get sun position
    const { position } = getSunPosition();
    const sunY = position[1];

    // Get sky colors based on sun's vertical position
    const { top, horizon, isNight, isDusk } = getSkyColorsFromSunPosition(sunY, MAX_SUN_HEIGHT);

    // Smoothly interpolate colors
    materialRef.current.uniforms.topColor.value.lerp(top, 0.03);
    materialRef.current.uniforms.horizonColor.value.lerp(horizon, 0.03);

    // Update stars visibility
    starsVisibleRef.current = isNight || isDusk;
    // Stars intensity - full at night, fading during dusk
    const targetIntensity = isNight && !isDusk ? 1 : (isDusk ? 0.5 : 0);
    starsIntensityRef.current += (targetIntensity - starsIntensityRef.current) * 0.02;
  });

  // Check initial state
  const { position } = getSunPosition();
  const { isNight, isDusk } = getSkyColorsFromSunPosition(position[1], MAX_SUN_HEIGHT);

  return (
    <group>
      {/* Sky dome */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SKY_RADIUS, 32, 32]} />
        <primitive ref={materialRef} object={material} attach="material" />
      </mesh>

      {/* Stars (visible at night and during dusk/dawn) */}
      <Stars visible={isNight || isDusk} intensity={starsIntensityRef.current || (isNight ? 1 : 0.5)} />

      {/* Shooting stars - occasional meteors at night */}
      <ShootingStar visible={isNight || isDusk} />
    </group>
  );
}

// Export for compatibility
export { getSkyColorsFromSunPosition, MAX_SUN_HEIGHT };
