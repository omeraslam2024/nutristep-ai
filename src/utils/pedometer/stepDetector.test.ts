import { describe, expect, it } from 'vitest';
import { GravityFilter, StepDetector } from './stepDetector';

const HZ = 50;
const DT = 1000 / HZ;

/** Deterministic pseudo-random noise so failures are reproducible. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function run(detector: StepDetector, samples: number[]): number {
  return samples.reduce((sum, mag, i) => sum + detector.push(i * DT, mag), 0);
}

/**
 * Walking: per step a heel-strike bump (half sine over ~35 % of the step, 3-4.5 m/s²) on top of
 * 0-0.6 m/s² noise — the shape phone accelerometers show for a phone in a pocket or hand.
 */
function walking(steps: number, intervalMs: number, seed = 1, jitter = 0.08): number[] {
  const r = rng(seed);
  const out: number[] = [];
  for (let s = 0; s < steps; s++) {
    const len = Math.round((intervalMs * (1 + (r() - 0.5) * 2 * jitter)) / DT);
    const amp = 3 + r() * 1.5;
    for (let i = 0; i < len; i++) {
      const phase = i / len;
      const bump = phase < 0.35 ? amp * Math.sin((Math.PI * phase) / 0.35) : 0;
      out.push(bump + r() * 0.6);
    }
  }
  return out;
}

function stillness(seconds: number, amplitude: number, seed = 7): number[] {
  const r = rng(seed);
  return Array.from({ length: seconds * HZ }, () => r() * amplitude);
}

describe('StepDetector — stationary phone', () => {
  it('counts nothing for a phone lying still (sensor jitter)', () => {
    expect(run(new StepDetector(), stillness(120, 0.3))).toBe(0);
  });

  it('counts nothing for strong random vibration (car, washing machine)', () => {
    expect(run(new StepDetector(), stillness(120, 2.6, 3))).toBe(0);
  });

  it('counts nothing for engine vibration riding in a car', () => {
    const r = rng(11);
    const samples = Array.from({ length: 120 * HZ }, (_, i) => Math.abs(1.2 * Math.sin(i * 2.7)) + r() * 0.8);
    expect(run(new StepDetector(), samples)).toBe(0);
  });

  it('counts nothing for single knocks on the table', () => {
    const samples = stillness(30, 0.2);
    for (const at of [100, 600, 1100]) samples[at] = 6;
    expect(run(new StepDetector(), samples)).toBe(0);
  });

  it('counts nothing when the phone is picked up and put down', () => {
    const samples = stillness(10, 0.2);
    for (let i = 100; i < 115; i++) samples[i] = 4; // lift
    for (let i = 160; i < 170; i++) samples[i] = 3.5; // set down
    expect(run(new StepDetector(), samples)).toBe(0);
  });

  it('counts nothing for a short burst of shaking', () => {
    const samples = stillness(10, 0.2);
    for (let i = 100; i < 160; i++) samples[i] = i % 4 < 2 ? 5 : 0.1; // 12 Hz shake
    expect(run(new StepDetector(), samples)).toBe(0);
  });
});

describe('StepDetector — walking', () => {
  it('counts a normal walk within ±5 %', () => {
    const counted = run(new StepDetector(), walking(200, 550));
    expect(counted).toBeGreaterThanOrEqual(190);
    expect(counted).toBeLessThanOrEqual(200);
  });

  it('counts a slow walk', () => {
    expect(run(new StepDetector(), walking(60, 1100, 2))).toBeGreaterThanOrEqual(56);
  });

  it('does not count fewer than the confirmation steps (a shuffle)', () => {
    expect(run(new StepDetector(), walking(4, 550, 3))).toBe(0);
  });

  it('stops counting when walking stops', () => {
    const d = new StepDetector();
    const walked = run(d, [...walking(50, 550), ...stillness(60, 0.3)]);
    expect(walked).toBeLessThanOrEqual(50);
    expect(walked).toBeGreaterThanOrEqual(47);
  });
});

describe('GravityFilter', () => {
  it('removes constant gravity', () => {
    const g = new GravityFilter();
    let mag = 0;
    for (let i = 0; i < 200; i++) mag = g.linearMagnitude(0, 9.81, 0);
    expect(mag).toBeLessThan(0.01);
  });
});
