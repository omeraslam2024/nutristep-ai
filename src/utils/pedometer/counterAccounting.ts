/**
 * Turns readings of Android's hardware step counter (TYPE_STEP_COUNTER: steps since the phone last
 * booted) into step deltas for the app's daily log.
 *
 * - The first reading ever only sets the reference: steps taken before the app was installed are
 *   not imported.
 * - After a reboot the counter restarts from 0, so a reading below the previous one is itself the
 *   delta.
 * - Steps taken while the app was closed are credited when it next reads the counter.
 */
export interface CounterState {
  lastCounter: number | null;
}

export function applyCounterReading(
  state: CounterState,
  counter: number
): { state: CounterState; delta: number } {
  if (!Number.isFinite(counter) || counter < 0) return { state, delta: 0 };
  if (state.lastCounter === null) return { state: { lastCounter: counter }, delta: 0 };
  const delta = counter >= state.lastCounter ? counter - state.lastCounter : counter;
  return { state: { lastCounter: counter }, delta };
}
