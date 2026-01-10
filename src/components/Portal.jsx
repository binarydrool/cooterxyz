"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Portal colors and unique styles for each animal realm
const PORTAL_STYLES = {
  cat: {
    primary: '#FF8C00', secondary: '#FFD700', sand: '#D4A574',
    particleCount: 100, sandSpeed: 1.2, swirlSpeed: 0.8,
    innerRings: 3, pulseRate: 2.5, hasFlames: true,
  },
  frog: {
    primary: '#228B22', secondary: '#90EE90', sand: '#8FBC8F',
    particleCount: 60, sandSpeed: 0.6, swirlSpeed: 0.4,
    innerRings: 2, pulseRate: 1.5, hasBubbles: true,
  },
  rabbit: {
    primary: '#8B4513', secondary: '#DEB887', sand: '#C4A777',
    particleCount: 80, sandSpeed: 0.8, swirlSpeed: 0.5,
    innerRings: 2, pulseRate: 2.0, hasSparkles: true,
  },
  owl: {
    primary: '#4B0082', secondary: '#9370DB', sand: '#B8A9C9',
    particleCount: 120, sandSpeed: 1.5, swirlSpeed: 1.0,
    innerRings: 4, pulseRate: 3.0, hasStars: true,
  },
};

// Individual sand grain that orbits the ring
function SandGrain({ angle, radius, speed, size, color, verticalOffset }) {
  const meshRef = useRef();
  const angleRef = useRef(angle);

  useFrame((_, delta) => {
    if (meshRef.current) {
      angleRef.current += speed * delta;
      const x = Math.cos(angleRef.current) * radius;
      const y = Math.sin(angleRef.current) * radius + verticalOffset;
      meshRef.current.position.set(x, y, 0);

      // Slight shimmer
      meshRef.current.material.opacity = 0.6 + Math.sin(angleRef.current * 3) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Sand ring - particles orbiting around the portal ring
function SandRing({ radius, color, particleCount = 60, baseSpeed = 1 }) {
  const grains = useMemo(() => {
    const arr = [];
    for (let i = 0; i < particleCount; i++) {
      arr.push({
        angle: (i / particleCount) * Math.PI * 2 + Math.random() * 0.5,
        radius: radius + (Math.random() - 0.5) * 0.3,
        speed: baseSpeed * (0.8 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
        size: 0.02 + Math.random() * 0.03,
        verticalOffset: (Math.random() - 0.5) * 0.2,
      });
    }
    return arr;
  }, [radius, particleCount, baseSpeed]);

  return (
    <group>
      {grains.map((grain, i) => (
        <SandGrain
          key={i}
          angle={grain.angle}
          radius={grain.radius}
          speed={grain.speed}
          size={grain.size}
          color={color}
          verticalOffset={grain.verticalOffset}
        />
      ))}
    </group>
  );
}

// Mirror surface with gradient animation
function MirrorSurface({ radius, colors }) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Create gradient texture
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Radial gradient from center
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.3, colors.secondary + 'aa');
    gradient.addColorStop(0.6, colors.primary + '66');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [colors]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      const t = clock.getElapsedTime();
      // Shimmer effect
      materialRef.current.opacity = 0.4 + Math.sin(t * 2) * 0.15;
      // Slight rotation for mirror effect
      if (meshRef.current) {
        meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[radius * 0.85, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        map={gradientTexture}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Glowing ring edge
function GlowRing({ radius, color, thickness = 0.08 }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, thickness, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Inner swirl effect
function InnerSwirl({ radius, color, speed = 1 }) {
  const groupRef = useRef();

  const particles = useMemo(() => {
    const arr = [];
    const spiralCount = 3;
    const pointsPerSpiral = 20;

    for (let s = 0; s < spiralCount; s++) {
      const spiralOffset = (s / spiralCount) * Math.PI * 2;
      for (let i = 0; i < pointsPerSpiral; i++) {
        const t = i / pointsPerSpiral;
        const r = t * radius * 0.8;
        const angle = t * Math.PI * 4 + spiralOffset;
        arr.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          size: 0.02 + (1 - t) * 0.03,
          opacity: 0.3 + (1 - t) * 0.5,
        });
      }
    }
    return arr;
  }, [radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += speed * delta;
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.01]}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={p.opacity} />
        </mesh>
      ))}
    </group>
  );
}

// Spawn animation - portal opens from nothing
function SpawnAnimation({ children, isSpawning, onSpawnComplete }) {
  const groupRef = useRef();
  const scaleRef = useRef(0);
  const [spawned, setSpawned] = useState(false);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (isSpawning && scaleRef.current < 1) {
        // Elastic ease out
        scaleRef.current = Math.min(1, scaleRef.current + delta * 1.5);
        const t = scaleRef.current;
        const elastic = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2);
        groupRef.current.scale.set(elastic, elastic, elastic);

        if (scaleRef.current >= 1 && !spawned) {
          setSpawned(true);
          if (onSpawnComplete) onSpawnComplete();
        }
      }
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Outer energy field
function EnergyField({ radius, color }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.rotation.z = t * 0.2;
      meshRef.current.material.opacity = 0.1 + Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.05]}>
      <ringGeometry args={[radius * 0.9, radius * 1.3, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Floating bubbles for frog portal
function Bubbles({ radius, color }) {
  const groupRef = useRef();
  const bubbles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 15; i++) {
      arr.push({
        x: (Math.random() - 0.5) * radius * 1.5,
        startY: -radius + Math.random() * radius * 0.5,
        size: 0.05 + Math.random() * 0.08,
        speed: 0.3 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [radius]);

  return (
    <group ref={groupRef}>
      {bubbles.map((b, i) => (
        <BubbleParticle key={i} {...b} color={color} radius={radius} />
      ))}
    </group>
  );
}

function BubbleParticle({ x, startY, size, speed, offset, color, radius }) {
  const meshRef = useRef();
  const yRef = useRef(startY);

  useFrame((_, delta) => {
    if (meshRef.current) {
      yRef.current += speed * delta;
      if (yRef.current > radius) yRef.current = startY;
      meshRef.current.position.y = yRef.current;
      meshRef.current.position.x = x + Math.sin(yRef.current * 2 + offset) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, startY, 0.1]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

// Floating stars for owl portal
function Stars({ radius, color }) {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.8;
      arr.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        size: 0.03 + Math.random() * 0.05,
        twinkleSpeed: 2 + Math.random() * 3,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [radius]);

  return (
    <group>
      {stars.map((s, i) => (
        <Star key={i} {...s} color={color} />
      ))}
    </group>
  );
}

function Star({ x, y, size, twinkleSpeed, offset, color }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.material.opacity = 0.3 + Math.sin(t * twinkleSpeed + offset) * 0.5;
      meshRef.current.scale.setScalar(1 + Math.sin(t * twinkleSpeed + offset) * 0.3);
    }
  });

  return (
    <mesh ref={meshRef} position={[x, y, 0.05]}>
      <circleGeometry args={[size, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Sparkles for rabbit portal
function Sparkles({ radius, color }) {
  const sparkles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 25; i++) {
      arr.push({
        angle: Math.random() * Math.PI * 2,
        r: Math.random() * radius * 0.9,
        size: 0.02 + Math.random() * 0.04,
        speed: 0.5 + Math.random() * 1,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [radius]);

  return (
    <group>
      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} color={color} />
      ))}
    </group>
  );
}

function Sparkle({ angle, r, size, speed, offset, color }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      const visible = Math.sin(t * speed + offset) > 0.5;
      meshRef.current.visible = visible;
      if (visible) {
        meshRef.current.material.opacity = 0.5 + Math.sin(t * speed * 2 + offset) * 0.5;
      }
    }
  });

  const x = Math.cos(angle) * r;
  const y = Math.sin(angle) * r;

  return (
    <mesh ref={meshRef} position={[x, y, 0.05]}>
      <circleGeometry args={[size, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Flame particles for cat portal
function Flames({ radius, color }) {
  const flames = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      arr.push({
        baseX: Math.cos(angle) * radius * 0.95,
        baseY: Math.sin(angle) * radius * 0.95,
        size: 0.08 + Math.random() * 0.06,
        speed: 3 + Math.random() * 2,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [radius]);

  return (
    <group>
      {flames.map((f, i) => (
        <Flame key={i} {...f} color={color} />
      ))}
    </group>
  );
}

function Flame({ baseX, baseY, size, speed, offset, color }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      const flicker = Math.sin(t * speed + offset) * 0.3;
      meshRef.current.scale.y = 1 + flicker;
      meshRef.current.material.opacity = 0.5 + Math.sin(t * speed * 1.5 + offset) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[baseX, baseY, 0.05]}>
      <coneGeometry args={[size * 0.5, size, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

export default function Portal({
  position = [0, 0, 0],
  animal = 'rabbit',
  isOpen = false,
  onEnter,
  isNear = false,
  size = 1.5, // Default portal radius, can be overridden
}) {
  const groupRef = useRef();
  const style = PORTAL_STYLES[animal] || PORTAL_STYLES.rabbit;
  const colors = { primary: style.primary, secondary: style.secondary, sand: style.sand };

  // Calculate rotation to face the clock center (0, 0, 0)
  const facingAngle = useMemo(() => {
    // Calculate angle from portal position to clock center
    // For owl at center (0, 0, 0), make it face outward (any direction)
    if (position[0] === 0 && position[2] === 0) return 0;
    return Math.atan2(position[0], position[2]);
  }, [position]);

  // Gentle floating animation only (no spinning)
  useFrame(({ clock }) => {
    if (groupRef.current && isOpen) {
      const t = clock.getElapsedTime();
      // Gentle floating up and down
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1;
    }
  });

  if (!isOpen) return null;

  const portalRadius = size;

  return (
    <group ref={groupRef} position={position}>
      <SpawnAnimation isSpawning={isOpen}>
        {/* Portal is vertical (standing up), rotated to face the clock center */}
        <group rotation={[0, facingAngle + Math.PI, 0]}>
          {/* Outer energy field */}
          <EnergyField radius={portalRadius} color={colors.primary} />

          {/* Main glowing ring */}
          <GlowRing radius={portalRadius} color={colors.primary} thickness={0.1} />

          {/* Secondary inner ring(s) based on style */}
          <GlowRing radius={portalRadius * 0.9} color={colors.secondary} thickness={0.05} />
          {style.innerRings >= 3 && (
            <GlowRing radius={portalRadius * 0.8} color={colors.primary} thickness={0.03} />
          )}
          {style.innerRings >= 4 && (
            <GlowRing radius={portalRadius * 0.7} color={colors.secondary} thickness={0.02} />
          )}

          {/* Sand particles orbiting the ring */}
          <SandRing
            radius={portalRadius}
            color={colors.sand}
            particleCount={style.particleCount}
            baseSpeed={style.sandSpeed}
          />

          {/* Second layer of sand going opposite direction */}
          <SandRing
            radius={portalRadius * 0.95}
            color={colors.secondary}
            particleCount={Math.floor(style.particleCount * 0.5)}
            baseSpeed={-style.sandSpeed * 1.5}
          />

          {/* Mirror surface in center */}
          <MirrorSurface radius={portalRadius} colors={colors} />

          {/* Inner swirl effect */}
          <InnerSwirl radius={portalRadius} color={colors.secondary} speed={style.swirlSpeed} />

          {/* Second swirl going opposite */}
          <group rotation={[0, 0, Math.PI]}>
            <InnerSwirl radius={portalRadius * 0.7} color={colors.primary} speed={-style.swirlSpeed * 1.4} />
          </group>

          {/* Unique effects per portal type */}
          {style.hasBubbles && <Bubbles radius={portalRadius} color={colors.secondary} />}
          {style.hasStars && <Stars radius={portalRadius} color="#ffffff" />}
          {style.hasSparkles && <Sparkles radius={portalRadius} color={colors.secondary} />}
          {style.hasFlames && <Flames radius={portalRadius} color={colors.secondary} />}

          {/* Center bright point */}
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Point light for glow effect */}
          <pointLight color={colors.primary} intensity={2} distance={5} />
        </group>
      </SpawnAnimation>
    </group>
  );
}
