/**
 * Movement calculation utilities
 */

// Movement constants
export const WALK_SPEED = 0.8; // Units per second (slow turtle pace)
export const TURN_SPEED = 2.0; // Radians per second
export const BIRDS_EYE_SPEED = 0.8; // Same as normal walking speed

/**
 * Calculate movement direction from input keys
 * Handles conflicting keys (left+right cancel out)
 * @param {Object} keys - Keyboard input state
 * @returns {{ forward: number, turn: number }} Normalized movement values
 */
export function getMovementFromKeys(keys) {
  let forward = 0;
  let turn = 0;

  // Forward/backward - conflicting keys cancel out
  if (keys.forward && !keys.backward) {
    forward = 1;
  } else if (keys.backward && !keys.forward) {
    forward = -1;
  }

  // Left/right turning - conflicting keys cancel out
  if (keys.left && !keys.right) {
    turn = 1; // Turn left (positive rotation)
  } else if (keys.right && !keys.left) {
    turn = -1; // Turn right (negative rotation)
  }

  return { forward, turn };
}

/**
 * Calculate new position based on movement input
 * @param {Object} params
 * @param {number} params.x - Current X position
 * @param {number} params.z - Current Z position
 * @param {number} params.rotation - Current Y rotation (radians)
 * @param {number} params.forward - Forward input (-1 to 1)
 * @param {number} params.turn - Turn input (-1 to 1)
 * @param {number} params.deltaTime - Time since last frame (seconds)
 * @returns {{ x: number, z: number, rotation: number }}
 */
export function calculateMovement({ x, z, rotation, forward, turn, deltaTime }) {
  // Calculate new rotation
  const newRotation = rotation + (turn * TURN_SPEED * deltaTime);

  // Calculate movement in facing direction
  const moveDistance = forward * WALK_SPEED * deltaTime;

  // Movement direction based on current rotation
  // In Three.js, rotation 0 faces positive Z, positive rotation turns left
  const moveX = Math.sin(newRotation) * moveDistance;
  const moveZ = Math.cos(newRotation) * moveDistance;

  return {
    x: x + moveX,
    z: z + moveZ,
    rotation: newRotation,
  };
}

/**
 * Normalize diagonal movement to same speed as cardinal
 * (Not needed for our turn-in-place + forward/back system,
 * but included for completeness)
 * @param {number} x - X component
 * @param {number} z - Z component
 * @returns {{ x: number, z: number }} Normalized components
 */
export function normalizeMovement(x, z) {
  const magnitude = Math.sqrt(x * x + z * z);

  if (magnitude === 0 || magnitude <= 1) {
    return { x, z };
  }

  return {
    x: x / magnitude,
    z: z / magnitude,
  };
}

/**
 * Check if the turtle is moving (has any movement input)
 * @param {Object} keys - Keyboard input state
 * @returns {boolean} True if moving
 */
export function isMoving(keys) {
  const movement = getMovementFromKeys(keys);
  return movement.forward !== 0 || movement.turn !== 0;
}

/**
 * Calculate Pac-Man style movement (absolute directions, bird's eye view)
 * Up = negative Z, Down = positive Z, Left = negative X, Right = positive X
 * @param {Object} params
 * @param {number} params.x - Current X position
 * @param {number} params.z - Current Z position
 * @param {Object} params.keys - Keyboard input state
 * @param {number} params.deltaTime - Time since last frame
 * @returns {{ x: number, z: number, rotation: number }}
 */
export function calculateBirdsEyeMovement({ x, z, keys, deltaTime }) {
  let moveX = 0;
  let moveZ = 0;

  // Absolute directions - up/down/left/right map directly to screen axes
  // Screen orientation (bird's eye looking down):
  // Up on screen = toward 12 o'clock = +Z (North)
  // Left on screen = toward 9 o'clock = West
  // Right on screen = toward 3 o'clock = East
  // Note: Screen X is inverted from world X due to camera orientation
  if (keys.forward) moveZ += 1;  // W/Up = move toward 12 o'clock (North)
  if (keys.backward) moveZ -= 1; // S/Down = move toward 6 o'clock (South)
  if (keys.left) moveX += 1;     // A/Left = move toward 9 o'clock (West) - inverted for camera
  if (keys.right) moveX -= 1;    // D/Right = move toward 3 o'clock (East) - inverted for camera

  // Normalize diagonal movement
  const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (magnitude > 0) {
    moveX = (moveX / magnitude) * BIRDS_EYE_SPEED * deltaTime;
    moveZ = (moveZ / magnitude) * BIRDS_EYE_SPEED * deltaTime;
  }

  // Calculate rotation to face movement direction
  // atan2(-moveX, moveZ) gives correct facing direction in Three.js coordinate system
  let rotation = 0;
  if (moveX !== 0 || moveZ !== 0) {
    rotation = Math.atan2(-moveX, moveZ); // Face the direction of movement
  }

  return {
    x: x + moveX,
    z: z + moveZ,
    rotation,
  };
}

/**
 * Check if moving in bird's eye mode
 * @param {Object} keys - Keyboard input state
 * @returns {boolean} True if any direction pressed
 */
export function isMovingBirdsEye(keys) {
  return keys.forward || keys.backward || keys.left || keys.right;
}
