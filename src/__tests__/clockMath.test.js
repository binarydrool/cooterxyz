import {
  getHourAngle,
  getMinuteAngle,
  getSecondAngle,
  getHandAngles,
  degreesToRadians,
  CLOCK_RADIUS,
  CLOCK_THICKNESS,
  TURTLE_COLLISION_RADIUS,
  getAngularPosition,
  checkSecondHandCollision,
  normalizeAngle,
} from '../utils/clockMath';

describe('clockMath', () => {
  describe('degreesToRadians', () => {
    it('converts 0 degrees to 0 radians', () => {
      expect(degreesToRadians(0)).toBe(0);
    });

    it('converts 180 degrees to PI radians', () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    });

    it('converts 360 degrees to 2*PI radians', () => {
      expect(degreesToRadians(360)).toBeCloseTo(Math.PI * 2);
    });

    it('converts 90 degrees to PI/2 radians', () => {
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('getHourAngle', () => {
    it('returns 0 for 12:00', () => {
      expect(getHourAngle(12, 0)).toBe(0);
    });

    it('returns 0 for 0:00 (midnight)', () => {
      expect(getHourAngle(0, 0)).toBe(0);
    });

    it('returns PI/2 for 3:00', () => {
      expect(getHourAngle(3, 0)).toBeCloseTo(Math.PI / 2);
    });

    it('returns PI for 6:00', () => {
      expect(getHourAngle(6, 0)).toBeCloseTo(Math.PI);
    });

    it('returns 3*PI/2 for 9:00', () => {
      expect(getHourAngle(9, 0)).toBeCloseTo((3 * Math.PI) / 2);
    });

    it('handles 24-hour format (15:00 = 3:00)', () => {
      expect(getHourAngle(15, 0)).toBeCloseTo(Math.PI / 2);
    });

    it('accounts for minutes (12:30 is 15 degrees)', () => {
      // 30 minutes = 15 degrees for hour hand
      expect(getHourAngle(12, 30)).toBeCloseTo(degreesToRadians(15));
    });

    it('handles noon wraparound correctly', () => {
      // 11:59 should be just before 12
      const angle = getHourAngle(11, 59);
      expect(angle).toBeCloseTo(degreesToRadians(359.5));
    });
  });

  describe('getMinuteAngle', () => {
    it('returns 0 for 0 minutes', () => {
      expect(getMinuteAngle(0, 0)).toBe(0);
    });

    it('returns PI/2 for 15 minutes', () => {
      expect(getMinuteAngle(15, 0)).toBeCloseTo(Math.PI / 2);
    });

    it('returns PI for 30 minutes', () => {
      expect(getMinuteAngle(30, 0)).toBeCloseTo(Math.PI);
    });

    it('returns 3*PI/2 for 45 minutes', () => {
      expect(getMinuteAngle(45, 0)).toBeCloseTo((3 * Math.PI) / 2);
    });

    it('accounts for seconds', () => {
      // 30 seconds = 3 degrees
      expect(getMinuteAngle(0, 30)).toBeCloseTo(degreesToRadians(3));
    });
  });

  describe('getSecondAngle', () => {
    it('returns 0 for 0 seconds', () => {
      expect(getSecondAngle(0, 0)).toBe(0);
    });

    it('returns PI/2 for 15 seconds', () => {
      expect(getSecondAngle(15, 0)).toBeCloseTo(Math.PI / 2);
    });

    it('returns PI for 30 seconds', () => {
      expect(getSecondAngle(30, 0)).toBeCloseTo(Math.PI);
    });

    it('handles milliseconds for smooth sweep', () => {
      // 500ms = 3 degrees
      expect(getSecondAngle(0, 500)).toBeCloseTo(degreesToRadians(3));
    });

    it('59 seconds + 999ms is close to but not exactly 360', () => {
      const angle = getSecondAngle(59, 999);
      expect(angle).toBeCloseTo(degreesToRadians(359.994), 2);
    });
  });

  describe('getHandAngles', () => {
    it('returns correct angles for midnight', () => {
      const midnight = new Date(2024, 0, 1, 0, 0, 0, 0);
      const angles = getHandAngles(midnight);
      expect(angles.hour).toBe(0);
      expect(angles.minute).toBe(0);
      expect(angles.second).toBe(0);
    });

    it('returns correct angles for 3:00:00', () => {
      const date = new Date(2024, 0, 1, 3, 0, 0, 0);
      const angles = getHandAngles(date);
      expect(angles.hour).toBeCloseTo(Math.PI / 2);
      expect(angles.minute).toBe(0);
      expect(angles.second).toBe(0);
    });

    it('returns correct angles for 6:30:45', () => {
      const date = new Date(2024, 0, 1, 6, 30, 45, 0);
      const angles = getHandAngles(date);
      // Hour: 6 * 30 + 30 * 0.5 = 195 degrees
      expect(angles.hour).toBeCloseTo(degreesToRadians(195));
      // Minute: 30 * 6 + 45 * 0.1 = 184.5 degrees
      expect(angles.minute).toBeCloseTo(degreesToRadians(184.5));
      // Second: 45 * 6 = 270 degrees
      expect(angles.second).toBeCloseTo(degreesToRadians(270));
    });
  });

  describe('constants', () => {
    it('CLOCK_RADIUS is 5', () => {
      expect(CLOCK_RADIUS).toBe(5);
    });

    it('CLOCK_THICKNESS is 0.3', () => {
      expect(CLOCK_THICKNESS).toBe(0.3);
    });

    it('TURTLE_COLLISION_RADIUS is defined', () => {
      expect(TURTLE_COLLISION_RADIUS).toBeGreaterThan(0);
      expect(TURTLE_COLLISION_RADIUS).toBeLessThan(1);
    });
  });

  describe('getAngularPosition', () => {
    it('returns 0 for position on positive Z axis', () => {
      expect(getAngularPosition(0, 1)).toBeCloseTo(0);
    });

    it('returns PI/2 for position on positive X axis', () => {
      expect(getAngularPosition(1, 0)).toBeCloseTo(Math.PI / 2);
    });

    it('returns PI for position on negative Z axis', () => {
      expect(getAngularPosition(0, -1)).toBeCloseTo(Math.PI);
    });

    it('returns 3*PI/2 for position on negative X axis', () => {
      expect(getAngularPosition(-1, 0)).toBeCloseTo(3 * Math.PI / 2);
    });

    it('returns value in 0 to 2*PI range', () => {
      const angle = getAngularPosition(-1, -1);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
    });
  });

  describe('normalizeAngle', () => {
    it('returns same value for angle in range', () => {
      expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
    });

    it('normalizes negative angle', () => {
      expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2);
    });

    it('normalizes angle over 2*PI', () => {
      expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    });

    it('handles multiple rotations', () => {
      expect(normalizeAngle(5 * Math.PI)).toBeCloseTo(Math.PI);
    });
  });

  describe('checkSecondHandCollision', () => {
    it('returns true when turtle is at center (blocks all angles)', () => {
      // At exact center, turtle blocks the second hand regardless of angle
      // This is correct behavior - the turtle shell covers the pivot area
      expect(checkSecondHandCollision(0, 0, 0)).toBe(true);
    });

    it('returns false when turtle is outside clock', () => {
      // Far outside the clock
      expect(checkSecondHandCollision(0, 10, 0)).toBe(false);
    });

    it('returns true when turtle is in path of second hand', () => {
      // Turtle at 3 o'clock position (x=2, z=0), second hand pointing there (PI/2)
      const secondAngle = Math.PI / 2;
      expect(checkSecondHandCollision(secondAngle, 2, 0)).toBe(true);
    });

    it('returns false when turtle is far from second hand path', () => {
      // Turtle at 3 o'clock (x=2, z=0), second hand at 12 o'clock (0)
      expect(checkSecondHandCollision(0, 2, 0)).toBe(false);
    });

    it('returns true when second hand approaches turtle', () => {
      // Turtle at 12 o'clock position (x=0, z=2)
      // Second hand pointing toward 12 o'clock (angle = 0)
      expect(checkSecondHandCollision(0, 0, 2)).toBe(true);
    });

    it('handles wraparound near 0/2*PI', () => {
      // Turtle near 12 o'clock, second hand just past 12
      const turtleZ = 2;
      const secondAngle = 0.05; // Just past 12
      expect(checkSecondHandCollision(secondAngle, 0, turtleZ)).toBe(true);
    });
  });
});
