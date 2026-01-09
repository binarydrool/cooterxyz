import { CLOCK_RADIUS } from "./clockMath";

/**
 * Check if a point is inside the clock circle
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {number} margin - Safety margin from edge (default 0.3)
 * @returns {boolean} True if inside
 */
export function isInsideCircle(x, z, margin = 0.1) {
  const effectiveRadius = CLOCK_RADIUS - margin;
  const distanceSquared = x * x + z * z;
  return distanceSquared <= effectiveRadius * effectiveRadius;
}

/**
 * Get distance from center
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @returns {number} Distance from center
 */
export function getDistanceFromCenter(x, z) {
  return Math.sqrt(x * x + z * z);
}

/**
 * Clamp a position to stay within the clock boundary
 * Uses slide-along-edge behavior instead of hard stop
 * @param {number} x - Current X
 * @param {number} z - Current Z
 * @param {number} newX - Desired new X
 * @param {number} newZ - Desired new Z
 * @param {number} margin - Safety margin from edge
 * @returns {{ x: number, z: number }} Clamped position
 */
export function clampToCircle(x, z, newX, newZ, margin = 0.1) {
  const effectiveRadius = CLOCK_RADIUS - margin;

  // Check if new position is inside
  if (isInsideCircle(newX, newZ, margin)) {
    return { x: newX, z: newZ };
  }

  // New position is outside - slide along the edge
  const distance = getDistanceFromCenter(newX, newZ);

  if (distance === 0) {
    // At exact center, just return current position
    return { x, z };
  }

  // Normalize and scale to edge
  const scale = effectiveRadius / distance;
  return {
    x: newX * scale,
    z: newZ * scale,
  };
}

/**
 * Get the effective boundary radius (clock radius minus margin)
 * @param {number} margin - Safety margin
 * @returns {number} Effective radius
 */
export function getBoundaryRadius(margin = 0.1) {
  return CLOCK_RADIUS - margin;
}
