import { DayLog, UserProfile } from '../types';
import { calculateTargetCalories, isDayCalorieGoalMet } from './healthCalculations';
import { localDateKey } from './history';

export type ChallengeId = 'c30' | 'c60' | 'c90';

export interface ChallengeDef {
  id: ChallengeId;
  days: number;
  title: string;
  rules: string[];
  tint: string;
}

/** Each step up adds one daily habit on top of the previous challenge. */
export const CHALLENGES: ChallengeDef[] = [
  { id: 'c30', days: 30, title: '30-day walk', rules: ['Reach your step goal'], tint: 'bg-mint text-leaf-ink' },
  { id: 'c60', days: 60, title: '60-day balance', rules: ['Reach your step goal', 'Stay within your calories'], tint: 'bg-butter text-butter-ink' },
  {
    id: 'c90',
    days: 90,
    title: '90-day fit for life',
    rules: ['Reach your step goal', 'Stay within your calories', 'Drink your water goal'],
    tint: 'bg-lilac text-lilac-ink',
  },
];

export interface ActiveChallenge {
  id: ChallengeId;
  startDate: string; // YYYY-MM-DD, local
}

export type DayStatus = 'done' | 'missed' | 'today' | 'upcoming';

export interface ChallengeProgress {
  def: ChallengeDef;
  statuses: DayStatus[];
  done: number;
  /** 1-based day number today (capped at the challenge length). */
  dayNumber: number;
  finished: boolean;
  /** Days still possible to complete, including today. */
  remaining: number;
}

export function dayMeetsChallenge(def: ChallengeDef, day: DayLog | undefined, profile: UserProfile): boolean {
  if (!day) return false;
  const stepsOk = day.steps >= (profile.stepGoal || 10000);
  if (def.id === 'c30') return stepsOk;
  const eaten = day.meals.reduce((s, m) => s + m.total_calories, 0);
  const calOk = isDayCalorieGoalMet(eaten, calculateTargetCalories(profile), profile.goal, day.caloriesBurned);
  if (def.id === 'c60') return stepsOk && calOk;
  const waterOk = (day.waterMl ?? 0) >= (profile.waterTargetMl || 2500);
  return stepsOk && calOk && waterOk;
}

export function evaluateChallenge(
  active: ActiveChallenge,
  history: DayLog[],
  profile: UserProfile,
  now: Date = new Date()
): ChallengeProgress {
  const def = CHALLENGES.find((c) => c.id === active.id)!;
  const byDate = new Map(history.map((d) => [d.date, d]));
  const [y, m, d] = active.startDate.split('-').map(Number);
  const todayKey = localDateKey(now);

  const statuses: DayStatus[] = [];
  let done = 0;
  let dayNumber = 0;
  for (let i = 0; i < def.days; i++) {
    const key = localDateKey(new Date(y, m - 1, d + i));
    const met = dayMeetsChallenge(def, byDate.get(key), profile);
    if (key < todayKey) {
      statuses.push(met ? 'done' : 'missed');
    } else if (key === todayKey) {
      statuses.push(met ? 'done' : 'today');
      dayNumber = i + 1;
    } else {
      statuses.push('upcoming');
    }
    if (met && key <= todayKey) done++;
  }
  const finished = !statuses.includes('upcoming') && !statuses.includes('today');
  if (finished) dayNumber = def.days;
  const remaining = statuses.filter((s) => s === 'today' || s === 'upcoming').length;
  return { def, statuses, done, dayNumber, finished, remaining };
}

const KEY = 'nutristep_challenge_v1';

export function loadChallenge(): ActiveChallenge | null {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (v && CHALLENGES.some((c) => c.id === v.id) && /^\d{4}-\d{2}-\d{2}$/.test(v.startDate)) return v;
  } catch {}
  return null;
}

export function saveChallenge(c: ActiveChallenge | null): void {
  try {
    if (c) localStorage.setItem(KEY, JSON.stringify(c));
    else localStorage.removeItem(KEY);
  } catch {}
}
