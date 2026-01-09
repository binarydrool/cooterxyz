import {
  WALK_SPEED,
  TURN_SPEED,
  getMovementFromKeys,
  calculateMovement,
  normalizeMovement,
  isMoving,
} from '../utils/movement';

describe('movement', () => {
  describe('constants', () => {
    it('WALK_SPEED is defined and positive', () => {
      expect(WALK_SPEED).toBeGreaterThan(0);
      expect(WALK_SPEED).toBe(0.8);
    });

    it('TURN_SPEED is defined and positive', () => {
      expect(TURN_SPEED).toBeGreaterThan(0);
      expect(TURN_SPEED).toBe(2.0);
    });
  });

  describe('getMovementFromKeys', () => {
    it('returns zero movement when no keys pressed', () => {
      const keys = { forward: false, backward: false, left: false, right: false };
      const result = getMovementFromKeys(keys);
      expect(result.forward).toBe(0);
      expect(result.turn).toBe(0);
    });

    it('returns forward=1 when forward pressed', () => {
      const keys = { forward: true, backward: false, left: false, right: false };
      const result = getMovementFromKeys(keys);
      expect(result.forward).toBe(1);
    });

    it('returns forward=-1 when backward pressed', () => {
      const keys = { forward: false, backward: true, left: false, right: false };
      const result = getMovementFromKeys(keys);
      expect(result.forward).toBe(-1);
    });

    it('returns turn=1 when left pressed', () => {
      const keys = { forward: false, backward: false, left: true, right: false };
      const result = getMovementFromKeys(keys);
      expect(result.turn).toBe(1);
    });

    it('returns turn=-1 when right pressed', () => {
      const keys = { forward: false, backward: false, left: false, right: true };
      const result = getMovementFromKeys(keys);
      expect(result.turn).toBe(-1);
    });

    it('cancels forward/backward when both pressed', () => {
      const keys = { forward: true, backward: true, left: false, right: false };
      const result = getMovementFromKeys(keys);
      expect(result.forward).toBe(0);
    });

    it('cancels left/right when both pressed', () => {
      const keys = { forward: false, backward: false, left: true, right: true };
      const result = getMovementFromKeys(keys);
      expect(result.turn).toBe(0);
    });

    it('handles forward+left independently', () => {
      const keys = { forward: true, backward: false, left: true, right: false };
      const result = getMovementFromKeys(keys);
      expect(result.forward).toBe(1);
      expect(result.turn).toBe(1);
    });
  });

  describe('calculateMovement', () => {
    it('returns unchanged position when no movement', () => {
      const result = calculateMovement({
        x: 1, z: 2, rotation: 0,
        forward: 0, turn: 0,
        deltaTime: 1
      });
      expect(result.x).toBe(1);
      expect(result.z).toBe(2);
      expect(result.rotation).toBe(0);
    });

    it('moves forward in facing direction (rotation 0 = positive Z)', () => {
      const result = calculateMovement({
        x: 0, z: 0, rotation: 0,
        forward: 1, turn: 0,
        deltaTime: 1
      });
      expect(result.x).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(WALK_SPEED);
    });

    it('moves backward in opposite direction', () => {
      const result = calculateMovement({
        x: 0, z: 0, rotation: 0,
        forward: -1, turn: 0,
        deltaTime: 1
      });
      expect(result.x).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(-WALK_SPEED);
    });

    it('rotates left (positive rotation)', () => {
      const result = calculateMovement({
        x: 0, z: 0, rotation: 0,
        forward: 0, turn: 1,
        deltaTime: 1
      });
      expect(result.rotation).toBeCloseTo(TURN_SPEED);
    });

    it('rotates right (negative rotation)', () => {
      const result = calculateMovement({
        x: 0, z: 0, rotation: 0,
        forward: 0, turn: -1,
        deltaTime: 1
      });
      expect(result.rotation).toBeCloseTo(-TURN_SPEED);
    });

    it('moves in rotated direction (90 degrees = positive X)', () => {
      const result = calculateMovement({
        x: 0, z: 0, rotation: Math.PI / 2,
        forward: 1, turn: 0,
        deltaTime: 1
      });
      expect(result.x).toBeCloseTo(WALK_SPEED);
      expect(result.z).toBeCloseTo(0);
    });

    it('respects deltaTime', () => {
      const result = calculateMovement({
        x: 0, z: 0, rotation: 0,
        forward: 1, turn: 0,
        deltaTime: 0.5
      });
      expect(result.z).toBeCloseTo(WALK_SPEED * 0.5);
    });
  });

  describe('normalizeMovement', () => {
    it('returns unchanged for zero movement', () => {
      const result = normalizeMovement(0, 0);
      expect(result.x).toBe(0);
      expect(result.z).toBe(0);
    });

    it('returns unchanged for magnitude <= 1', () => {
      const result = normalizeMovement(0.5, 0.5);
      expect(result.x).toBe(0.5);
      expect(result.z).toBe(0.5);
    });

    it('normalizes diagonal movement to unit length', () => {
      // 1, 1 has magnitude sqrt(2) ≈ 1.414
      const result = normalizeMovement(1, 1);
      const magnitude = Math.sqrt(result.x * result.x + result.z * result.z);
      expect(magnitude).toBeCloseTo(1);
    });

    it('diagonal speed equals cardinal speed after normalization', () => {
      // Cardinal movement (1, 0) has magnitude 1
      const cardinal = normalizeMovement(1, 0);
      const cardinalMagnitude = Math.sqrt(cardinal.x * cardinal.x + cardinal.z * cardinal.z);

      // Diagonal movement (1, 1) after normalization should also have magnitude 1
      const diagonal = normalizeMovement(1, 1);
      const diagonalMagnitude = Math.sqrt(diagonal.x * diagonal.x + diagonal.z * diagonal.z);

      expect(cardinalMagnitude).toBeCloseTo(diagonalMagnitude);
    });
  });

  describe('isMoving', () => {
    it('returns false when no keys pressed', () => {
      const keys = { forward: false, backward: false, left: false, right: false };
      expect(isMoving(keys)).toBe(false);
    });

    it('returns true when forward pressed', () => {
      const keys = { forward: true, backward: false, left: false, right: false };
      expect(isMoving(keys)).toBe(true);
    });

    it('returns true when turning', () => {
      const keys = { forward: false, backward: false, left: true, right: false };
      expect(isMoving(keys)).toBe(true);
    });

    it('returns false when conflicting keys cancel out', () => {
      const keys = { forward: true, backward: true, left: true, right: true };
      expect(isMoving(keys)).toBe(false);
    });
  });
});
