"use client";

import { CLOCK_RADIUS, CLOCK_THICKNESS } from "@/utils/clockMath";
import AEIOU from "./characters/AEIOU";

// Dimitrius stands at north (12 o'clock) on top of the gold rim
const GNOME_DISTANCE = CLOCK_RADIUS * 1.0;
const RIM_HEIGHT = 0.15; // On the gold rim

// Static position at north (12 o'clock) - on the gold rim
export const GNOME_POS_X = 0;
export const GNOME_POS_Z = GNOME_DISTANCE;

export default function Gnome({ victoryCeremony = false }) {
  return (
    <AEIOU
      position={[0, CLOCK_THICKNESS / 2 + RIM_HEIGHT, GNOME_DISTANCE]}
      scale={0.35}
      victoryCeremony={victoryCeremony}
      variant="hub"
      glowIntensity={0.5}
    />
  );
}
