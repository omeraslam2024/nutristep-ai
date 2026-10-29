import { describe, expect, it } from 'vitest';
import { emptyDay, ensureToday, localDateKey, stripSeedData } from './history';
import { generateInitialHistory } from '../data/initialData';

describe('localDateKey', () => {
  it('uses the local date, not UTC', () => {
    // 00:30 local on 28 Oct is still 27 Oct in UTC for any zone east of Greenwich.
    expect(localDateKey(new Date(2026, 9, 28, 0, 30))).toBe('2026-10-28');
  });
});

describe('ensureToday', () => {
  const now = new Date(2026, 9, 27, 9, 0);

  it('creates today for an empty history', () => {
    expect(ensureToday([], now)).toEqual([emptyDay('2026-10-27')]);
  });

  it('keeps history untouched when today exists', () => {
    const h = [emptyDay('2026-10-26'), { ...emptyDay('2026-10-27'), steps: 5 }];
    expect(ensureToday(h, now)).toBe(h);
  });

  it('rolls over to a new day and fills skipped days', () => {
    const h = [{ ...emptyDay('2026-10-24'), steps: 12000 }];
    const out = ensureToday(h, now);
    expect(out.map((d) => d.date)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
    expect(out[3].steps).toBe(0);
  });

  it('crosses month ends', () => {
    const out = ensureToday([emptyDay('2026-10-31')], new Date(2026, 10, 1, 8));
    expect(out.map((d) => d.date)).toEqual(['2026-10-31', '2026-11-01']);
  });
});

describe('stripSeedData', () => {
  it('removes the old demo history', () => {
    const { history, changed } = stripSeedData(generateInitialHistory());
    expect(changed).toBe(true);
    expect(history.every((d) => d.meals.length === 0 && d.steps === 0)).toBe(true);
  });

  it('keeps meals the user logged', () => {
    const day = generateInitialHistory().pop()!;
    day.meals.push({ ...day.meals[0], id: 'meal-1730000000000' });
    const { history } = stripSeedData([day]);
    expect(history[0].meals.map((m) => m.id)).toEqual(['meal-1730000000000']);
  });
});
