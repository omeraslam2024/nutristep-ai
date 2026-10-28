import { describe, expect, it } from 'vitest';
import { buildStepReport } from './stepReports';
import { emptyDay } from './history';
import { DayLog } from '../types';

const now = new Date(2026, 9, 28, 18, 0); // 28 Oct 2026

function day(date: string, steps: number, hourly: [number, number][] = []): DayLog {
  return { ...emptyDay(date), steps, hourlySteps: hourly.map(([hour, s]) => ({ hour, steps: s })) };
}

const history: DayLog[] = [
  day('2026-08-15', 12000),
  day('2026-10-20', 4000),
  day('2026-10-22', 9000),
  day('2026-10-26', 11000),
  day('2026-10-28', 6240, [
    [8, 1180],
    [13, 900],
    [17, 4160],
  ]),
];

describe('buildStepReport', () => {
  it('day: today by hour', () => {
    const r = buildStepReport(history, 'day', 8000, now);
    expect(r.total).toBe(6240);
    expect(r.bars).toHaveLength(18);
    expect(r.best).toEqual({ label: '5 PM', value: 4160 });
    expect(r.goalDays).toBe(0);
  });

  it('week: last 7 days, skipped days count as 0', () => {
    const r = buildStepReport(history, 'week', 8000, now);
    // 22 Oct … 28 Oct
    expect(r.bars.map((b) => b.value)).toEqual([9000, 0, 0, 0, 11000, 0, 6240]);
    expect(r.total).toBe(26240);
    expect(r.dailyAverage).toBe(Math.round(26240 / 7));
    expect(r.goalDays).toBe(2);
    expect(r.best?.value).toBe(11000);
  });

  it('month: last 30 days', () => {
    const r = buildStepReport(history, 'month', 8000, now);
    expect(r.bars).toHaveLength(30);
    expect(r.total).toBe(4000 + 9000 + 11000 + 6240);
    expect(r.days).toBe(30);
  });

  it('year: 12 monthly totals ending this month', () => {
    const r = buildStepReport(history, 'year', 8000, now);
    expect(r.bars).toHaveLength(12);
    expect(r.bars[11].value).toBe(4000 + 9000 + 11000 + 6240);
    expect(r.bars[9].value).toBe(12000); // August
    expect(r.goalDays).toBe(3);
    expect(r.best?.label).toBe('October');
  });

  it('handles an empty history', () => {
    const r = buildStepReport([], 'year', 8000, now);
    expect(r.total).toBe(0);
    expect(r.best).toBeNull();
  });
});
