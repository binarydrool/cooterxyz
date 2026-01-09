/**
 * Clock math utilities for converting time to hand angles
 * All angles returned in radians, measured clockwise from 12 o'clock
 */

/**
 * Get the angle for the hour hand
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @returns {number} Angle in radians
 */
export function getHourAngle(hours, minutes) {
  // Convert to 12-hour format
  const h = hours % 12;
  // Hour hand moves 30 degrees per hour + 0.5 degrees per minute
  const degrees = (h * 30) + (minutes * 0.5);
  return degreesToRadians(degrees);
}

/**
 * Get the angle for the minute hand
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 * @returns {number} Angle in radians
 */
export function getMinuteAngle(minutes, seconds) {
  // Minute hand moves 6 degrees per minute + 0.1 degrees per second
  const degrees = (minutes * 6) + (seconds * 0.1);
  return degreesToRadians(degrees);
}

/**
 * Get the angle for the second hand (smooth sweep)
 * @param {number} seconds - Seconds (0-59)
 * @param {number} milliseconds - Milliseconds (0-999)
 * @returns {number} Angle in radians
 */
export function getSecondAngle(seconds, milliseconds) {
  // Second hand moves 6 degrees per second, smooth with milliseconds
  const degrees = (seconds * 6) + (milliseconds * 0.006);
  return degreesToRadians(degrees);
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Get all hand angles from a Date object
 * @param {Date} date
 * @returns {{ hour: number, minute: number, second: number }}
 */
export function getHandAngles(date) {
  if (!date) {
    date = new Date();
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  return {
    hour: getHourAngle(hours, minutes),
    minute: getMinuteAngle(minutes, seconds),
    second: getSecondAngle(seconds, milliseconds),
  };
}

/**
 * Clock radius constant - used for boundary calculations
 */
export const CLOCK_RADIUS = 5;

/**
 * Clock thickness constant
 */
export const CLOCK_THICKNESS = 0.3;

/**
 * Turtle collision radius (shell width in world space)
 * Generous hitbox for reliable collision detection
 */
export const TURTLE_COLLISION_RADIUS = 0.4;

/**
 * Second hand half-width for collision
 * Wider than visual for reliable collision
 */
export const SECOND_HAND_HALF_WIDTH = 0.15;

/**
 * Hysteresis buffer - once colliding, turtle must move this much EXTRA distance
 * before collision ends. Prevents flickering at boundaries.
 */
export const COLLISION_HYSTERESIS = 0.15;

/**
 * Second hand geometry for collision detection
 * Visual hand tip is at ~3.4 units from center
 * Collision zone extends to clock edge to catch players standing at hour markers (4.25) or edge (4.9)
 * This creates an invisible "danger zone" past the visual hand tip
 */
export const SECOND_HAND_START = 0.3;  // Near center
export const SECOND_HAND_END = CLOCK_RADIUS * 0.95;  // Tip at 4.75, extends to catch edge players

/**
 * Get the angular position of a point from the clock center
 * Returns angle in radians, clockwise from 12 o'clock (positive Z)
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @returns {number} Angle in radians (0 to 2*PI)
 */
export function getAngularPosition(x, z) {
  // atan2(x, z) gives angle from positive Z axis
  let angle = Math.atan2(x, z);
  // Convert to 0 to 2*PI range
  if (angle < 0) {
    angle += Math.PI * 2;
  }
  return angle;
}

/**
 * Get the distance from turtle to second hand (for collision detection)
 * Uses line-segment to point distance calculation
 * @param {number} secondAngle - Current second hand angle in radians (clockwise from 12 o'clock)
 * @param {number} turtleX - Turtle X position
 * @param {number} turtleZ - Turtle Z position
 * @returns {number} Distance from turtle center to closest point on second hand
 */
export function getDistanceToSecondHand(secondAngle, turtleX, turtleZ) {
  // Calculate the second hand's direction vector
  // Angle 0 = 12 o'clock = positive Z, angle increases clockwise
  const handDirX = Math.sin(secondAngle);
  const handDirZ = Math.cos(secondAngle);

  // Line segment start and end points (using constants)
  const startX = handDirX * SECOND_HAND_START;
  const startZ = handDirZ * SECOND_HAND_START;
  const endX = handDirX * SECOND_HAND_END;
  const endZ = handDirZ * SECOND_HAND_END;

  // Vector from start to end
  const segX = endX - startX;
  const segZ = endZ - startZ;

  // Vector from start to turtle
  const toTurtleX = turtleX - startX;
  const toTurtleZ = turtleZ - startZ;

  // Project turtle position onto line segment
  const segLengthSq = segX * segX + segZ * segZ;
  let t = (toTurtleX * segX + toTurtleZ * segZ) / segLengthSq;

  // Clamp t to [0, 1] to stay on the segment
  t = Math.max(0, Math.min(1, t));

  // Find closest point on segment
  const closestX = startX + t * segX;
  const closestZ = startZ + t * segZ;

  // Calculate distance from turtle to closest point
  const dx = turtleX - closestX;
  const dz = turtleZ - closestZ;

  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check if second hand collides with turtle using precise line-circle intersection
 * Collision triggers when ANY part of the hand touches ANY part of the turtle
 * @param {number} secondAngle - Current second hand angle in radians (clockwise from 12 o'clock)
 * @param {number} turtleX - Turtle X position
 * @param {number} turtleZ - Turtle Z position
 * @param {boolean} wasColliding - Whether collision was active on previous frame (for hysteresis)
 * @returns {boolean} True if collision
 */
export function checkSecondHandCollision(secondAngle, turtleX, turtleZ, wasColliding = false) {
  const distance = getDistanceToSecondHand(secondAngle, turtleX, turtleZ);

  // Collision when turtle edge touches hand edge (both radii combined)
  const collisionThreshold = TURTLE_COLLISION_RADIUS + SECOND_HAND_HALF_WIDTH;

  // Apply hysteresis: if already colliding, require extra distance to stop colliding
  const effectiveThreshold = wasColliding
    ? collisionThreshold + COLLISION_HYSTERESIS
    : collisionThreshold;

  return distance <= effectiveThreshold;
}

/**
 * Normalize angle to 0 to 2*PI range
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
  let normalized = angle % (Math.PI * 2);
  if (normalized < 0) {
    normalized += Math.PI * 2;
  }
  return normalized;
}

/**
 * Minimum time (seconds) collision must be detected before state changes to "blocked"
 * Zero for instant blocking when collision detected
 */
export const BLOCK_DEBOUNCE_TIME = 0; // Instant block

/**
 * Minimum time (seconds) no collision must be detected before state changes to "unblocked"
 * Very short - player should be able to walk away and unblock quickly
 */
export const UNBLOCK_DEBOUNCE_TIME = 0.03; // ~2 frames

/**
 * Create a collision state manager with robust debouncing
 * This prevents flickering by requiring sustained contact/separation before state changes
 * @returns {Object} State manager with update method
 */
export function createCollisionStateManager() {
  return {
    isBlocked: false,
    blockedAtAngle: 0,
    // Debounce state
    pendingBlock: false,
    pendingUnblock: false,
    pendingBlockTime: 0,
    pendingUnblockTime: 0,
    // For hysteresis - track last known collision state
    lastRawCollision: false,

    /**
     * Update collision state with debouncing
     * @param {boolean} rawCollision - Raw collision detection result (without hysteresis)
     * @param {number} currentAngle - Current displayed hand angle
     * @param {number} delta - Frame delta time in seconds
     * @returns {boolean} Whether hand should be blocked
     */
    update(rawCollision, currentAngle, delta) {
      // Apply hysteresis: if blocked, require MORE distance to unblock
      const effectiveCollision = this.isBlocked
        ? rawCollision // Use raw collision when blocked (hysteresis applied in checkSecondHandCollision)
        : rawCollision;

      this.lastRawCollision = rawCollision;

      if (!this.isBlocked) {
        // Currently NOT blocked - looking for collision to start blocking
        if (effectiveCollision) {
          if (!this.pendingBlock) {
            // Start pending block
            this.pendingBlock = true;
            this.pendingBlockTime = 0;
          }
          this.pendingBlockTime += delta;

          // Sustained collision - transition to blocked
          if (this.pendingBlockTime >= BLOCK_DEBOUNCE_TIME) {
            this.isBlocked = true;
            this.blockedAtAngle = currentAngle;
            this.pendingBlock = false;
            this.pendingUnblock = false;
          }
        } else {
          // No collision - reset pending block
          this.pendingBlock = false;
          this.pendingBlockTime = 0;
        }
      } else {
        // Currently BLOCKED - looking for clear space to unblock
        if (!effectiveCollision) {
          if (!this.pendingUnblock) {
            // Start pending unblock
            this.pendingUnblock = true;
            this.pendingUnblockTime = 0;
          }
          this.pendingUnblockTime += delta;

          // Sustained no-collision - transition to unblocked
          if (this.pendingUnblockTime >= UNBLOCK_DEBOUNCE_TIME) {
            this.isBlocked = false;
            this.pendingBlock = false;
            this.pendingUnblock = false;
            return false; // Signal unblock happened
          }
        } else {
          // Still colliding - reset pending unblock
          this.pendingUnblock = false;
          this.pendingUnblockTime = 0;
        }
      }

      return this.isBlocked;
    },

    /**
     * Force unblock (used after 33-second passthrough)
     */
    forceUnblock() {
      this.isBlocked = false;
      this.pendingBlock = false;
      this.pendingUnblock = false;
      this.pendingBlockTime = 0;
      this.pendingUnblockTime = 0;
    },

    /**
     * Get the angle where blocking started
     */
    getBlockedAngle() {
      return this.blockedAtAngle;
    }
  };
}
