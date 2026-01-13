import {
  isInsideCircle,
  getDistanceFromCenter,
  clampToCircle,
  getBoundaryRadius,
} from '../utils/collision';
import { CLOCK_RADIUS } from '../utils/clockMath';

describe('collision', () => {
  describe('getDistanceFromCenter', () => {
    it('returns 0 for origin', () => {
      expect(getDistanceFromCenter(0, 0)).toBe(0);
    });

    it('returns correct distance for point on X axis', () => {
      expect(getDistanceFromCenter(3, 0)).toBe(3);
    });

    it('returns correct distance for point on Z axis', () => {
      expect(getDistanceFromCenter(0, 4)).toBe(4);
    });

    it('returns correct distance for diagonal point', () => {
      // 3-4-5 triangle
      expect(getDistanceFromCenter(3, 4)).toBe(5);
    });

    it('handles negative coordinates', () => {
      expect(getDistanceFromCenter(-3, -4)).toBe(5);
    });
  });

  describe('isInsideCircle', () => {
    // Default margin is 0.1, so effective radius = 5 - 0.1 = 4.9
    const effectiveRadius = CLOCK_RADIUS - 0.1; // 4.9

    it('returns true for origin', () => {
      expect(isInsideCircle(0, 0)).toBe(true);
    });

    it('returns true for point well inside', () => {
      expect(isInsideCircle(1, 1)).toBe(true);
    });

    it('returns true for point exactly at effective boundary', () => {
      expect(isInsideCircle(effectiveRadius, 0)).toBe(true);
    });

    it('returns false for point outside effective boundary', () => {
      // 4.95 is outside effective radius of 4.9
      expect(isInsideCircle(4.95, 0)).toBe(false);
    });

    it('returns false for point at clock radius', () => {
      expect(isInsideCircle(CLOCK_RADIUS, 0)).toBe(false);
    });

    it('uses custom margin when provided', () => {
      // With margin 1, effective radius is 4
      expect(isInsideCircle(4.5, 0, 1)).toBe(false);
      expect(isInsideCircle(3.9, 0, 1)).toBe(true);
    });

    it('handles diagonal positions', () => {
      // Distance = sqrt(3^2 + 3^2) = sqrt(18) ≈ 4.24, inside 4.9
      expect(isInsideCircle(3, 3)).toBe(true);
      // Distance = sqrt(4^2 + 4^2) = sqrt(32) ≈ 5.66, outside 4.9
      expect(isInsideCircle(4, 4)).toBe(false);
    });
  });

  describe('clampToCircle', () => {
    // Default margin is 0.1, so effective radius = 5 - 0.1 = 4.9
    const effectiveRadius = CLOCK_RADIUS - 0.1; // 4.9

    it('returns new position when inside boundary', () => {
      const result = clampToCircle(0, 0, 1, 1);
      expect(result.x).toBe(1);
      expect(result.z).toBe(1);
    });

    it('clamps position when outside boundary', () => {
      const result = clampToCircle(0, 0, 10, 0);
      // Should be clamped to effective radius (4.9)
      expect(result.x).toBeCloseTo(effectiveRadius);
      expect(result.z).toBeCloseTo(0);
    });

    it('maintains direction when clamping', () => {
      const result = clampToCircle(0, 0, 10, 10);
      // Should maintain 45-degree angle
      const angle = Math.atan2(result.z, result.x);
      expect(angle).toBeCloseTo(Math.PI / 4);
    });

    it('handles movement from inside to outside', () => {
      // Starting at (4, 0), trying to move to (6, 0)
      const result = clampToCircle(4, 0, 6, 0);
      expect(result.x).toBeCloseTo(effectiveRadius);
      expect(result.z).toBe(0);
    });

    it('slides along edge for tangential movement', () => {
      // Starting near edge, moving tangentially but going outside
      const result = clampToCircle(4.5, 0, 4.5, 2);
      // Should be clamped to the boundary
      const distance = Math.sqrt(result.x * result.x + result.z * result.z);
      expect(distance).toBeLessThanOrEqual(effectiveRadius + 0.001);
    });
  });

  describe('getBoundaryRadius', () => {
    it('returns correct radius with default margin', () => {
      // Default margin is 0.1
      expect(getBoundaryRadius()).toBe(CLOCK_RADIUS - 0.1);
    });

    it('returns correct radius with custom margin', () => {
      expect(getBoundaryRadius(1)).toBe(CLOCK_RADIUS - 1);
    });
  });
});
