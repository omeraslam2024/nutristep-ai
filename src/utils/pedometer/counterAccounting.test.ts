import { describe, expect, it } from 'vitest';
import { applyCounterReading } from './counterAccounting';

describe('applyCounterReading', () => {
  it('does not import steps taken before the first reading', () => {
    expect(applyCounterReading({ lastCounter: null }, 54321)).toEqual({ state: { lastCounter: 54321 }, delta: 0 });
  });

  it('credits the difference between readings', () => {
    expect(applyCounterReading({ lastCounter: 1000 }, 1250).delta).toBe(250);
  });

  it('credits nothing when the counter has not moved (phone still)', () => {
    expect(applyCounterReading({ lastCounter: 1000 }, 1000).delta).toBe(0);
  });

  it('handles a reboot (counter restarts from zero)', () => {
    expect(applyCounterReading({ lastCounter: 9000 }, 120)).toEqual({ state: { lastCounter: 120 }, delta: 120 });
  });

  it('ignores invalid readings', () => {
    expect(applyCounterReading({ lastCounter: 10 }, NaN).delta).toBe(0);
    expect(applyCounterReading({ lastCounter: 10 }, -5).delta).toBe(0);
  });
});
