import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { applyCounterReading, type CounterState } from './counterAccounting';
import { GravityFilter, StepDetector } from './stepDetector';

interface StepCounterPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  permission(options?: { request?: boolean }): Promise<{ granted: boolean; required: boolean }>;
  start(): Promise<void>;
  stop(): Promise<void>;
  read(): Promise<{ counter: number }>;
  addListener(event: 'counter', cb: (data: { counter: number }) => void): Promise<PluginListenerHandle>;
}

const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');

/**
 * hardware — Android's step-counter chip; counts all day, even with the app closed.
 * motion    — accelerometer fallback; counts only while the app is open on screen.
 */
export type PedometerMode = 'hardware' | 'motion' | 'none';
export type PedometerStatus = 'off' | 'starting' | 'active' | 'denied' | 'unsupported';

const PREF_KEY = 'nutristep_pedometer_v1';

interface StoredPedometer extends CounterState {
  enabled: boolean;
}

function loadPref(): StoredPedometer {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { enabled: !!p.enabled, lastCounter: typeof p.lastCounter === 'number' ? p.lastCounter : null };
    }
  } catch {}
  return { enabled: false, lastCounter: null };
}

function savePref(p: StoredPedometer): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {}
}

async function detectMode(): Promise<PedometerMode> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { available } = await StepCounter.isAvailable();
      if (available) return 'hardware';
    } catch {}
  }
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window ? 'motion' : 'none';
}

/**
 * One pedometer for the whole app. `onSteps(delta)` receives newly detected steps only, never a
 * total, so readings cannot overwrite each other.
 */
export function usePedometer(onSteps: (delta: number) => void) {
  const [mode, setMode] = useState<PedometerMode>('none');
  const [status, setStatus] = useState<PedometerStatus>('off');
  const [enabled, setEnabled] = useState<boolean>(() => loadPref().enabled);
  // Bumped on every "turn on" tap, so a denied permission can be asked for again.
  const [attempt, setAttempt] = useState(0);

  const onStepsRef = useRef(onSteps);
  onStepsRef.current = onSteps;
  const prefRef = useRef<StoredPedometer>(loadPref());

  useEffect(() => {
    detectMode().then(setMode);
  }, []);

  const applyCounter = useCallback((counter: number) => {
    const { state, delta } = applyCounterReading(prefRef.current, counter);
    prefRef.current = { ...prefRef.current, ...state };
    savePref(prefRef.current);
    if (delta > 0) onStepsRef.current(delta);
  }, []);

  // Hardware step counter
  useEffect(() => {
    if (mode !== 'hardware' || !enabled) return;
    let cancelled = false;
    let handle: PluginListenerHandle | null = null;

    const readNow = () =>
      StepCounter.read()
        .then(({ counter }) => !cancelled && applyCounter(counter))
        .catch(() => {});

    (async () => {
      setStatus('starting');
      const { granted } = await StepCounter.permission({ request: true });
      if (cancelled) return;
      if (!granted) {
        setStatus('denied');
        return;
      }
      handle = await StepCounter.addListener('counter', ({ counter }) => applyCounter(counter));
      await StepCounter.start();
      await readNow();
      if (!cancelled) setStatus('active');
    })().catch(() => !cancelled && setStatus('unsupported'));

    const onVisible = () => document.visibilityState === 'visible' && readNow();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      handle?.remove();
      StepCounter.stop().catch(() => {});
    };
  }, [mode, enabled, attempt, applyCounter]);

  // Accelerometer fallback: only while the app is visible
  useEffect(() => {
    if (mode !== 'motion' || !enabled) return;
    const detector = new StepDetector();
    const gravity = new GravityFilter();

    const onMotion = (e: DeviceMotionEvent) => {
      let mag: number;
      const a = e.acceleration;
      const g = e.accelerationIncludingGravity;
      if (a && a.x !== null && a.y !== null && a.z !== null) {
        mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      } else if (g && g.x !== null && g.y !== null && g.z !== null) {
        mag = gravity.linearMagnitude(g.x, g.y, g.z);
      } else {
        return;
      }
      const credit = detector.push(e.timeStamp || performance.now(), mag);
      if (credit > 0) onStepsRef.current(credit);
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') detector.reset();
    };

    window.addEventListener('devicemotion', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    setStatus('active');
    return () => {
      window.removeEventListener('devicemotion', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mode, enabled]);

  const setPedometerEnabled = useCallback(async (on: boolean) => {
    if (on && mode === 'motion') {
      // iOS Safari asks for motion access; Android browsers do not.
      const DME = (window as any).DeviceMotionEvent;
      if (typeof DME?.requestPermission === 'function') {
        try {
          if ((await DME.requestPermission()) !== 'granted') {
            setStatus('denied');
            return;
          }
        } catch {
          setStatus('denied');
          return;
        }
      }
    }
    prefRef.current = { ...prefRef.current, enabled: on };
    savePref(prefRef.current);
    setEnabled(on);
    if (on) setAttempt((n) => n + 1);
    else setStatus('off');
  }, [mode]);

  return { mode, status: mode === 'none' ? 'unsupported' : status, enabled, setEnabled: setPedometerEnabled };
}
