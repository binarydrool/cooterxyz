"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLOCK_RADIUS, CLOCK_THICKNESS } from "@/utils/clockMath";
import { TURTLE_SCALE } from "./Turtle";

// Camera modes (removed first person)
export const CAMERA_MODES = {
  THIRD_PERSON: 'third-person',
  BIRDS_EYE: 'birds-eye',
};

// Camera configuration
const CAMERA_CONFIG = {
  [CAMERA_MODES.THIRD_PERSON]: {
    distance: 3,
    height: 2,
    fov: 60,
  },
  [CAMERA_MODES.BIRDS_EYE]: {
    height: 15,
    fov: 50,
  },
};

// Transition speed (higher = faster)
const LERP_SPEED = 3;

export default function CameraController({ turtlePosition, turtleRotation, mode, setMode }) {
  const { camera } = useThree();

  // Track current camera orbit angle for smooth 180° rotation
  const currentOrbitAngle = useRef(0);
  const targetOrbitAngle = useRef(0);
  const currentHeight = useRef(2);
  const currentDistance = useRef(3);
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const prevMode = useRef(mode);
  const currentFov = useRef(60);

  // Handle keyboard input for camera switching (1 = third person, 2 = bird's eye)
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case '1':
        setMode(CAMERA_MODES.THIRD_PERSON);
        break;
      case '2':
        setMode(CAMERA_MODES.BIRDS_EYE);
        break;
    }
  }, [setMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);

  // Update camera each frame
  useFrame((_, delta) => {
    const turtleX = turtlePosition[0];
    const turtleZ = turtlePosition[2];
    const turtleY = CLOCK_THICKNESS / 2;

    // Calculate targets based on mode
    let targetHeight, targetDistance, targetFov;

    switch (mode) {
      case CAMERA_MODES.THIRD_PERSON: {
        const config = CAMERA_CONFIG[CAMERA_MODES.THIRD_PERSON];

        // Update orbit angle to follow turtle rotation
        targetOrbitAngle.current = turtleRotation + Math.PI; // Behind turtle
        targetHeight = config.height;
        targetDistance = config.distance;
        targetFov = config.fov;

        targetLookAt.current.set(turtleX, turtleY + 0.3, turtleZ);
        break;
      }

      case CAMERA_MODES.BIRDS_EYE: {
        const config = CAMERA_CONFIG[CAMERA_MODES.BIRDS_EYE];

        // Bird's eye: north at top means camera slightly south (negative Z)
        // Orbit angle of PI puts camera at negative Z
        targetOrbitAngle.current = Math.PI;
        targetHeight = config.height;
        targetDistance = 0.01; // Almost zero distance, directly above
        targetFov = config.fov;

        targetLookAt.current.set(0, 0, 0);
        break;
      }
    }

    // Smooth interpolation
    const lerpFactor = 1 - Math.exp(-LERP_SPEED * delta);

    // Smoothly interpolate orbit angle - take shortest path
    let angleDiff = targetOrbitAngle.current - currentOrbitAngle.current;
    // Normalize angle difference to [-PI, PI] for shortest rotation
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    currentOrbitAngle.current += angleDiff * lerpFactor;

    // Smoothly interpolate height and distance
    currentHeight.current += (targetHeight - currentHeight.current) * lerpFactor;
    currentDistance.current += (targetDistance - currentDistance.current) * lerpFactor;

    // Smoothly interpolate FOV (only update projection when FOV actually changes)
    const fovDiff = targetFov - currentFov.current;
    if (Math.abs(fovDiff) > 0.1) {
      currentFov.current += fovDiff * lerpFactor;
      camera.fov = currentFov.current;
      camera.updateProjectionMatrix();
    }

    // Smoothly interpolate look-at
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);

    // Calculate camera position based on orbit
    let camX, camZ;
    if (mode === CAMERA_MODES.BIRDS_EYE && currentDistance.current < 0.5) {
      // Bird's eye: position with slight negative Z offset so north is at top
      camX = 0;
      camZ = -0.01;
    } else {
      // Orbit around the look-at target
      camX = currentLookAt.current.x + Math.sin(currentOrbitAngle.current) * currentDistance.current;
      camZ = currentLookAt.current.z + Math.cos(currentOrbitAngle.current) * currentDistance.current;
    }

    camera.position.set(camX, currentHeight.current, camZ);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

// Export mode for UI display
export { CAMERA_MODES as CameraModes };
