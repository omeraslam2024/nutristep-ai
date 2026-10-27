/**
 * Accelerometer step detector, used only where the phone has no hardware step counter (and in the
 * browser/PWA). Works on linear acceleration magnitude (gravity removed), in m/s².
 *
 * Why it does not count while the phone is still or handled:
 * - a footfall must rise above PEAK and fall back below VALLEY before the next one counts;
 * - footfalls must arrive at a walking cadence (MIN..MAX interval);
 * - nothing is credited until CONFIRM_STEPS footfalls in a row keep a steady rhythm. Then those
 *   buffered steps are credited at once, and later steps count one by one. A knock on the table,
 *   picking the phone up or typing produce 1-3 irregular peaks and never reach confirmation;
 * - the signal is smoothed first, and the peak threshold rises with the background vibration level,
 *   so engine or road vibration (many small random peaks) does not look like a cadence.
 */
export const DETECTOR = {
  PEAK: 2.0,
  VALLEY: 0.9,
  /** Peak must also exceed the background level times this factor. */
  NOISE_FACTOR: 1.9,
  SMOOTH_TAU_MS: 45,
  NOISE_TAU_MS: 3000,
  MIN_INTERVAL_MS: 300,
  MAX_INTERVAL_MS: 1500,
  CONFIRM_STEPS: 6,
  /** Each interval may differ from the running average by at most this fraction. */
  RHYTHM_TOLERANCE: 0.45,
};

export class StepDetector {
  private inPeak = false;
  private lastPeakAt = -Infinity;
  private pending = 0;
  private confirmed = false;
  private avgInterval = 0;
  private smooth = 0;
  private noise = 0;
  private lastT: number | null = null;

  reset(): void {
    this.inPeak = false;
    this.lastPeakAt = -Infinity;
    this.pending = 0;
    this.confirmed = false;
    this.avgInterval = 0;
    this.smooth = 0;
    this.noise = 0;
    this.lastT = null;
  }

  /** Feeds one sample; returns how many steps to credit now (usually 0 or 1). */
  push(tMs: number, rawMagnitude: number): number {
    const dt = this.lastT === null ? 0 : Math.max(0, Math.min(200, tMs - this.lastT));
    this.lastT = tMs;
    if (dt === 0) {
      this.smooth = rawMagnitude;
      this.noise = rawMagnitude;
    } else {
      this.smooth += (rawMagnitude - this.smooth) * (1 - Math.exp(-dt / DETECTOR.SMOOTH_TAU_MS));
      this.noise += (rawMagnitude - this.noise) * (1 - Math.exp(-dt / DETECTOR.NOISE_TAU_MS));
    }
    const magnitude = this.smooth;
    const peakThreshold = Math.max(DETECTOR.PEAK, this.noise * DETECTOR.NOISE_FACTOR);

    if (this.inPeak) {
      if (magnitude < Math.max(DETECTOR.VALLEY, this.noise)) this.inPeak = false;
      return 0;
    }
    if (magnitude < peakThreshold) {
      if (tMs - this.lastPeakAt > DETECTOR.MAX_INTERVAL_MS) this.breakRhythm();
      return 0;
    }

    const interval = tMs - this.lastPeakAt;
    if (interval < DETECTOR.MIN_INTERVAL_MS) return 0; // bounce inside one footfall

    this.inPeak = true;
    this.lastPeakAt = tMs;

    if (interval > DETECTOR.MAX_INTERVAL_MS) {
      // First footfall after a pause: start a new candidate walk.
      this.breakRhythm();
      this.pending = 1;
      return 0;
    }

    if (this.avgInterval > 0) {
      const drift = Math.abs(interval - this.avgInterval) / this.avgInterval;
      if (drift > DETECTOR.RHYTHM_TOLERANCE) {
        this.breakRhythm();
        this.pending = 1;
        return 0;
      }
      this.avgInterval = this.avgInterval * 0.7 + interval * 0.3;
    } else {
      this.avgInterval = interval;
    }

    if (this.confirmed) return 1;
    this.pending += 1;
    if (this.pending >= DETECTOR.CONFIRM_STEPS) {
      this.confirmed = true;
      const credit = this.pending;
      this.pending = 0;
      return credit;
    }
    return 0;
  }

  private breakRhythm(): void {
    this.pending = 0;
    this.confirmed = false;
    this.avgInterval = 0;
  }
}

/** Low-pass gravity estimate for devices that only report accelerationIncludingGravity. */
export class GravityFilter {
  private g = { x: 0, y: 0, z: 0 };
  private primed = false;

  linearMagnitude(x: number, y: number, z: number): number {
    if (!this.primed) {
      this.g = { x, y, z };
      this.primed = true;
    }
    const a = 0.9;
    this.g.x = a * this.g.x + (1 - a) * x;
    this.g.y = a * this.g.y + (1 - a) * y;
    this.g.z = a * this.g.z + (1 - a) * z;
    const lx = x - this.g.x;
    const ly = y - this.g.y;
    const lz = z - this.g.z;
    return Math.sqrt(lx * lx + ly * ly + lz * lz);
  }
}
