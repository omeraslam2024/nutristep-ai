import { DayLog } from '../types';
import { localDateKey } from './history';

export type StepPeriod = 'day' | 'week' | 'month' | 'year';

export interface StepReport {
  bars: { key: string; label: string; value: number }[];
  total: number;
  /** Average per day over the period (per hour for 'day' is not useful, so it is the day total). */
  dailyAverage: number;
  best: { label: string; value: number } | null;
  /** Days in the period on which the step goal was reached. */
  goalDays: number;
  /** Days in the period that are covered (for "x of y days"). */
  days: number;
}

const DAY_MS = 86_400_000;

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Step totals for one period, ending today:
 *   day   — today's steps by hour (6:00–23:00)
 *   week  — last 7 days, one bar per day
 *   month — last 30 days, one bar per day
 *   year  — last 12 months, one bar per month (total steps)
 * Days without a log count as 0, so a skipped day shows as a gap rather than disappearing.
 */
export function buildStepReport(history: DayLog[], period: StepPeriod, stepGoal: number, now: Date = new Date()): StepReport {
  const byDate = new Map(history.map((d) => [d.date, d]));
  const todayKey = localDateKey(now);

  if (period === 'day') {
    const today = byDate.get(todayKey);
    const byHour = new Map((today?.hourlySteps ?? []).map((h) => [h.hour, h.steps]));
    const bars = Array.from({ length: 18 }, (_, i) => {
      const h = i + 6;
      return { key: String(h), label: h % 6 === 0 ? `${h % 12 || 12}${h < 12 ? 'a' : 'p'}` : '', value: byHour.get(h) || 0 };
    });
    const total = today?.steps ?? 0;
    const best = bars.reduce<StepReport['best']>((b, x) => (x.value > (b?.value ?? 0) ? { label: `${Number(x.key) % 12 || 12} ${Number(x.key) < 12 ? 'AM' : 'PM'}`, value: x.value } : b), null);
    return { bars, total, dailyAverage: total, best, goalDays: total >= stepGoal ? 1 : 0, days: 1 };
  }

  if (period === 'week' || period === 'month') {
    const n = period === 'week' ? 7 : 30;
    const bars = Array.from({ length: n }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i));
      const key = localDateKey(d);
      const label =
        period === 'week'
          ? d.toLocaleDateString('en-US', { weekday: 'narrow' })
          : i % 5 === 4 || i === 0
          ? String(d.getDate())
          : '';
      return { key, label, value: byDate.get(key)?.steps ?? 0 };
    });
    return summarise(bars, stepGoal, (b) => dateFromKey(b.key).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }));
  }

  // year: 12 calendar months ending with the current one
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (11 - i), 1));
  const bars = months.map((m) => {
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const value = history.filter((d) => d.date.startsWith(key)).reduce((s, d) => s + d.steps, 0);
    return { key, label: m.toLocaleDateString('en-US', { month: 'narrow' }), value };
  });
  const yearDays = history.filter((d) => {
    const t = dateFromKey(d.date).getTime();
    return t >= months[0].getTime() && t <= now.getTime();
  });
  const total = bars.reduce((s, b) => s + b.value, 0);
  const firstDay = yearDays.length ? dateFromKey(yearDays[0].date).getTime() : now.getTime();
  const days = Math.max(1, Math.round((now.getTime() - firstDay) / DAY_MS) + 1);
  const best = bars.reduce<StepReport['best']>(
    (b, x) => (x.value > (b?.value ?? 0) ? { label: dateFromKey(`${x.key}-01`).toLocaleDateString('en-US', { month: 'long' }), value: x.value } : b),
    null
  );
  return {
    bars,
    total,
    dailyAverage: Math.round(total / days),
    best,
    goalDays: yearDays.filter((d) => d.steps >= stepGoal).length,
    days,
  };
}

function summarise(
  bars: StepReport['bars'],
  stepGoal: number,
  bestLabel: (b: StepReport['bars'][number]) => string
): StepReport {
  const total = bars.reduce((s, b) => s + b.value, 0);
  const bestBar = bars.reduce<StepReport['bars'][number] | null>((b, x) => (x.value > (b?.value ?? 0) ? x : b), null);
  return {
    bars,
    total,
    dailyAverage: Math.round(total / bars.length),
    best: bestBar ? { label: bestLabel(bestBar), value: bestBar.value } : null,
    goalDays: bars.filter((b) => b.value >= stepGoal).length,
    days: bars.length,
  };
}
