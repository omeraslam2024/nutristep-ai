import { describe, expect, it } from 'vitest';
import { CUISINES, FOODS, searchFoods } from './foods';

describe('quick picks data', () => {
  it('has about 100 dishes with unique ids', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  });

  it('every dish has a meal, a known cuisine and sane numbers', () => {
    for (const f of FOODS) {
      expect(f.meals.length).toBeGreaterThan(0);
      expect(CUISINES).toContain(f.cuisine);
      expect(f.kcal).toBeGreaterThan(0);
      // Calories from macros should be within ~25 % of the stated calories.
      const fromMacros = f.protein * 4 + f.carbs * 4 + f.fat * 9;
      expect(Math.abs(fromMacros - f.kcal) / f.kcal).toBeLessThan(0.25);
    }
  });

  it('every meal has dishes from several cuisines', () => {
    for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const) {
      const cuisines = new Set(searchFoods('', meal, 'All').map((f) => f.cuisine));
      expect(cuisines.size).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('searchFoods', () => {
  it('filters by meal', () => {
    expect(searchFoods('', 'Breakfast', 'All').every((f) => f.meals.includes('Breakfast'))).toBe(true);
    expect(searchFoods('', 'Breakfast', 'All').some((f) => f.id === 'pk-chicken-karahi')).toBe(false);
  });

  it('filters by cuisine', () => {
    expect(searchFoods('', 'All', 'Thai').every((f) => f.cuisine === 'Thai')).toBe(true);
  });

  it('matches words in any order, ignoring case', () => {
    expect(searchFoods('KARAHI chicken', 'All', 'All').map((f) => f.id)).toContain('pk-chicken-karahi');
  });

  it('returns nothing for an unknown dish', () => {
    expect(searchFoods('zzzz', 'All', 'All')).toEqual([]);
  });
});
