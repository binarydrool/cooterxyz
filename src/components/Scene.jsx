"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, createContext, useContext, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import Clock from "./Clock";
import Turtle from "./Turtle";
import CameraController, { CAMERA_MODES } from "./CameraController";
import useTurtleMovement, { setCameraMode as setMovementCameraMode } from "@/hooks/useTurtleMovement";
import Ocean from "./Ocean";
import DynamicSky from "./DynamicSky";
import Sun from "./Sun";
import Moon from "./Moon";
import Seagulls from "./Seagulls";

// Context for sharing turtle state with camera and other components
const TurtleContext = createContext({
  position: [0, 0, 0],
  rotation: 0,
  cameraMode: CAMERA_MODES.THIRD_PERSON,
  setCameraMode: () => {},
});

export function useTurtleContext() {
  return useContext(TurtleContext);
}

// Global ref for triggering interactions from outside the Canvas
let globalClockRef = null;

export function triggerInteract() {
  if (globalClockRef && globalClockRef.nearGrainId) {
    globalClockRef.claimGrain(globalClockRef.nearGrainId);
  }
}

function TurtleWithCamera({ children, onTimeStoppedChange, onStopDataChange, onInteractTargetChange, onGrainClaimed, onCooterBlockingGrain, victoryCeremony, unlockedRealms, animalEnteringPortal, activeRealm = 'hub', pyramidShards = {} }) {
  const { position, rotation, isMoving, isWalking, jumpHeight, isInAir } = useTurtleMovement();
  const [cameraMode, setCameraMode] = useState(CAMERA_MODES.THIRD_PERSON);
  const clockRef = useRef();

  // Track interact targets
  const [nearGrain, setNearGrain] = useState(null);
  const [nearRabbit, setNearRabbit] = useState(false);
  const [nearCat, setNearCat] = useState(false);
  const [nearFrog, setNearFrog] = useState(false);
  const [nearOwl, setNearOwl] = useState(false);
  const [nearGnome, setNearGnome] = useState(false);
  const [nearHoots, setNearHoots] = useState(false);
  const [nearPortal, setNearPortal] = useState(null);

  // Update global clock ref for touch controls
  useEffect(() => {
    globalClockRef = clockRef.current;
    return () => { globalClockRef = null; };
  });

  // Report the current interact target to parent
  useEffect(() => {
    if (onInteractTargetChange) {
      if (nearPortal) {
        onInteractTargetChange({ type: 'portal', realm: nearPortal });
      } else if (nearGrain) {
        onInteractTargetChange({ type: 'grain', ...nearGrain });
      } else if (nearHoots) {
        onInteractTargetChange({ type: 'hoots' });
      } else if (nearRabbit) {
        onInteractTargetChange({ type: 'rabbit' });
      } else if (nearCat) {
        onInteractTargetChange({ type: 'cat' });
      } else if (nearFrog) {
        onInteractTargetChange({ type: 'frog' });
      } else if (nearOwl) {
        onInteractTargetChange({ type: 'nox' });
      } else if (nearGnome) {
        onInteractTargetChange({ type: 'gnome' });
      } else {
        onInteractTargetChange(null);
      }
    }
  }, [nearGrain, nearRabbit, nearCat, nearFrog, nearOwl, nearGnome, nearHoots, nearPortal, onInteractTargetChange]);

  // Sync camera mode to movement hook
  useEffect(() => {
    setMovementCameraMode(cameraMode);
  }, [cameraMode]);

  // E key interactions are handled by Game.jsx via triggerInteract()

  return (
    <TurtleContext.Provider value={{ position, rotation, cameraMode, setCameraMode }}>
      <TurtleRenderer position={position} rotation={rotation} isWalking={isWalking} jumpHeight={jumpHeight} />
      <Clock
        ref={clockRef}
        turtlePosition={position}
        onTimeStoppedChange={onTimeStoppedChange}
        onStopDataChange={onStopDataChange}
        onNearGrain={setNearGrain}
        onNearRabbit={setNearRabbit}
        onNearCat={setNearCat}
        onNearFrog={setNearFrog}
        onNearOwl={setNearOwl}
        onNearGnome={setNearGnome}
        onNearHoots={setNearHoots}
        onNearPortal={setNearPortal}
        onGrainClaimed={onGrainClaimed}
        onCooterBlockingGrain={onCooterBlockingGrain}
        victoryCeremony={victoryCeremony}
        unlockedRealms={unlockedRealms}
        animalEnteringPortal={animalEnteringPortal}
        activeRealm={activeRealm}
        pyramidShards={pyramidShards}
      />
      <CameraController
        turtlePosition={position}
        turtleRotation={rotation}
        mode={cameraMode}
        setMode={setCameraMode}
      />
      {children}
    </TurtleContext.Provider>
  );
}

function TurtleRenderer({ position, rotation, isWalking, jumpHeight = 0 }) {
  const turtleRef = useRef();

  useEffect(() => {
    if (turtleRef.current) {
      turtleRef.current.position.x = position[0];
      turtleRef.current.position.z = position[2];
      turtleRef.current.rotation.y = rotation;
    }
  }, [position, rotation]);

  return (
    <Turtle
      ref={turtleRef}
      position={position}
      rotation={[0, rotation, 0]}
      isWalking={isWalking}
      jumpHeight={jumpHeight}
    />
  );
}

export default function Scene({ onCameraModeChange, onTimeStoppedChange, onStopDataChange, onInteractTargetChange, onGrainClaimed, onCooterBlockingGrain, victoryCeremony, unlockedRealms, animalEnteringPortal, activeRealm = 'hub', pyramidShards = {} }) {
  const { scene, gl } = useThree();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    setIsMobile(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768
    );

    // Remove background color - let the sky dome show through
    scene.background = null;
    // Remove fog to allow seeing the ocean below
    scene.fog = null;
  }, [scene]);

  return (
    <>
      {/* Dynamic sky dome based on user's local time */}
      <DynamicSky />

      {/* Sun - rises in east, sets in west based on real time */}
      <Sun />

      {/* Moon - visible at night */}
      <Moon />

      {/* Ocean far below the clock */}
      <Ocean />

      {/* Seagulls removed for performance */}

      {/* Base ambient light (supplements sun/moon lighting) */}
      <ambientLight intensity={isMobile ? 0.6 : 0.5} />

      {/* Turtle with integrated camera control and clock */}
      <TurtleWithCamera
        onTimeStoppedChange={onTimeStoppedChange}
        onStopDataChange={onStopDataChange}
        onInteractTargetChange={onInteractTargetChange}
        onGrainClaimed={onGrainClaimed}
        onCooterBlockingGrain={onCooterBlockingGrain}
        victoryCeremony={victoryCeremony}
        unlockedRealms={unlockedRealms}
        animalEnteringPortal={animalEnteringPortal}
        activeRealm={activeRealm}
        pyramidShards={pyramidShards}
      >
        <CameraModeReporter onModeChange={onCameraModeChange} />
      </TurtleWithCamera>
    </>
  );
}

// Component to report camera mode changes to parent
function CameraModeReporter({ onModeChange }) {
  const { cameraMode } = useTurtleContext();

  useEffect(() => {
    if (onModeChange) {
      onModeChange(cameraMode);
    }
  }, [cameraMode, onModeChange]);

  return null;
}
