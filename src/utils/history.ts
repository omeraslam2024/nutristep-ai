import { DayLog } from '../types';

/** YYYY-MM-DD in the phone's local time zone (toISOString() would give the UTC date). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + 1));
}

export function emptyDay(date: string): DayLog {
  return {
    date,
    steps: 0,
    distanceKm: 0,
    caloriesBurned: 0,
    activeMinutes: 0,
    hourlySteps: [],
    meals: [],
    waterMl: 0,
  };
}

const MAX_GAP_DAYS = 60;
const MAX_HISTORY_DAYS = 400;

/**
 * Makes the last entry today's log. Days the app was not opened are filled with empty logs, so a
 * skipped day breaks the streak instead of being silently ignored.
 */
export function ensureToday(history: DayLog[], now: Date = new Date()): DayLog[] {
  const today = localDateKey(now);
  const last = history[history.length - 1];
  if (last?.date === today) return history;

  const copy = history.filter((d) => d.date < today);
  let cursor = copy.length ? nextDateKey(copy[copy.length - 1].date) : today;
  let filled = 0;
  while (cursor < today && filled < MAX_GAP_DAYS) {
    copy.push(emptyDay(cursor));
    cursor = nextDateKey(cursor);
    filled++;
  }
  copy.push(emptyDay(today));
  return copy.slice(-MAX_HISTORY_DAYS);
}

/** Meal ids written by the old built-in demo history ("Alex Rivera"). */
const SEED_MEAL_ID = /^(today-m\d|past-\d+-m\d)$/;

/**
 * Earlier builds pre-filled a new install with 7 days of invented meals and steps. Removes them so
 * the user only sees what they logged.
 */
export function stripSeedData(history: DayLog[]): { history: DayLog[]; changed: boolean } {
  let changed = false;
  const cleaned = history.map((day) => {
    if (!day.meals.some((m) => SEED_MEAL_ID.test(m.id))) return day;
    changed = true;
    return { ...emptyDay(day.date), meals: day.meals.filter((m) => !SEED_MEAL_ID.test(m.id)) };
  });
  return { history: cleaned, changed };
}
