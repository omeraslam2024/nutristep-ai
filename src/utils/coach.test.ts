import { describe, expect, it } from 'vitest';
import { buildCoachAdvice, nextMealFor } from './coach';
import { emptyDay } from './history';
import { DEFAULT_USER_PROFILE } from '../data/initialData';
import { LoggedMeal } from '../types';

const profile = { ...DEFAULT_USER_PROFILE, name: 'Omer', onboarded: true };

function meal(type: LoggedMeal['mealType'], kcal: number, protein = 10, flags: string[] = []): LoggedMeal {
  return {
    id: `m-${Math.random()}`,
    timestamp: '',
    mealType: type,
    meal_name: 'x',
    total_calories: kcal,
    total_macros: { protein_g: protein, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    detected_items: [],
    dietary_flags: flags,
    source: 'manual',
  };
}

describe('nextMealFor', () => {
  it('follows the time of day and skips meals already logged', () => {
    expect(nextMealFor(8, new Set())).toBe('Breakfast');
    expect(nextMealFor(8, new Set(['Breakfast']))).toBe('Lunch');
    expect(nextMealFor(20, new Set())).toBe('Dinner');
  });
});

describe('buildCoachAdvice', () => {
  it('suggests dishes for the next meal that fit the budget', () => {
    const today = { ...emptyDay('2026-10-28'), meals: [meal('Breakfast', 400)] };
    const a = buildCoachAdvice(profile, today, [today], new Date(2026, 9, 28, 12));
    expect(a.nextMeal).toBe('Lunch');
    expect(a.ideas.length).toBeGreaterThan(0);
    expect(a.ideas.every((f) => f.meals.includes('Lunch') && f.kcal <= Math.max(a.mealBudget, 150))).toBe(true);
  });

  it('prefers cuisines the user logs', () => {
    const past = { ...emptyDay('2026-10-27'), meals: [meal('Dinner', 600, 30, ['Thai']), meal('Lunch', 600, 30, ['Thai'])] };
    const today = emptyDay('2026-10-28');
    const a = buildCoachAdvice(profile, today, [past, today], new Date(2026, 9, 28, 13));
    expect(a.nextMeal).toBe('Lunch');
    expect(a.ideas[0].cuisine).toBe('Thai');
  });

  it('tells you how far you are over and how long a walk would fix it', () => {
    const today = { ...emptyDay('2026-10-28'), meals: [meal('Lunch', 3000)] };
    const a = buildCoachAdvice(profile, today, [today], new Date(2026, 9, 28, 15));
    expect(a.tips[0].kind).toBe('move');
    expect(a.tips[0].title).toMatch(/over budget/);
  });

  it('praises a reached step goal', () => {
    const today = { ...emptyDay('2026-10-28'), steps: 12000 };
    const a = buildCoachAdvice(profile, today, [today], new Date(2026, 9, 28, 15));
    expect(a.tips.some((t) => t.kind === 'praise')).toBe(true);
  });
});
