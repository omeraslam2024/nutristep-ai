import { describe, expect, it } from 'vitest';
import { CHALLENGES, dayMeetsChallenge, evaluateChallenge } from './challenges';
import { emptyDay } from './history';
import { DEFAULT_USER_PROFILE } from '../data/initialData';
import { DayLog, LoggedMeal } from '../types';

const profile = { ...DEFAULT_USER_PROFILE, name: 'Omer', onboarded: true, stepGoal: 8000, waterTargetMl: 2000, goal: 'maintain' as const };
const c30 = CHALLENGES[0];
const c60 = CHALLENGES[1];
const c90 = CHALLENGES[2];

const meal = (kcal: number): LoggedMeal => ({
  id: 'm',
  timestamp: '',
  mealType: 'Lunch',
  meal_name: 'x',
  total_calories: kcal,
  total_macros: { protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
  detected_items: [],
  source: 'manual',
});

function day(date: string, steps: number, kcal = 0, water = 0): DayLog {
  return { ...emptyDay(date), steps, meals: kcal ? [meal(kcal)] : [], waterMl: water };
}

describe('dayMeetsChallenge', () => {
  it('30-day: steps only', () => {
    expect(dayMeetsChallenge(c30, day('2026-10-01', 8000), profile)).toBe(true);
    expect(dayMeetsChallenge(c30, day('2026-10-01', 7999), profile)).toBe(false);
  });

  it('60-day: steps and calories', () => {
    expect(dayMeetsChallenge(c60, day('2026-10-01', 9000), profile)).toBe(false); // nothing eaten logged
    expect(dayMeetsChallenge(c60, day('2026-10-01', 9000, 1900), profile)).toBe(true);
  });

  it('90-day: steps, calories and water', () => {
    expect(dayMeetsChallenge(c90, day('2026-10-01', 9000, 1900, 1000), profile)).toBe(false);
    expect(dayMeetsChallenge(c90, day('2026-10-01', 9000, 1900, 2000), profile)).toBe(true);
  });

  it('a day without a log does not count', () => {
    expect(dayMeetsChallenge(c30, undefined, profile)).toBe(false);
  });
});

describe('evaluateChallenge', () => {
  const now = new Date(2026, 9, 28, 12); // day 3 of a challenge started on the 26th

  it('marks past days done or missed, today open, the rest upcoming', () => {
    const history = [day('2026-10-26', 9000), day('2026-10-27', 3000), day('2026-10-28', 2000)];
    const p = evaluateChallenge({ id: 'c30', startDate: '2026-10-26' }, history, profile, now);
    expect(p.statuses.slice(0, 4)).toEqual(['done', 'missed', 'today', 'upcoming']);
    expect(p.done).toBe(1);
    expect(p.dayNumber).toBe(3);
    expect(p.finished).toBe(false);
    expect(p.remaining).toBe(28);
  });

  it('today turns done as soon as the goal is met', () => {
    const p = evaluateChallenge({ id: 'c30', startDate: '2026-10-26' }, [day('2026-10-28', 8500)], profile, now);
    expect(p.statuses[2]).toBe('done');
    expect(p.done).toBe(1);
  });

  it('finishes after the last day', () => {
    const p = evaluateChallenge({ id: 'c30', startDate: '2026-09-01' }, [], profile, now);
    expect(p.finished).toBe(true);
    expect(p.dayNumber).toBe(30);
    expect(p.remaining).toBe(0);
  });

  it('crosses month ends', () => {
    const p = evaluateChallenge({ id: 'c30', startDate: '2026-10-20' }, [day('2026-11-01', 9000)], profile, new Date(2026, 10, 1, 9));
    expect(p.dayNumber).toBe(13);
    expect(p.done).toBe(1);
  });
});
