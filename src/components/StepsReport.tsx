import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Footprints } from 'lucide-react';
import { DayLog } from '../types';
import { buildStepReport, StepPeriod } from '../utils/stepReports';

const PERIODS: [StepPeriod, string][] = [
  ['day', 'Day'],
  ['week', 'Week'],
  ['month', 'Month'],
  ['year', 'Year'],
];

/** Step report with a Day / Week / Month / Year switch: bar chart plus total, average, best and goal days. */
export const StepsReport: React.FC<{ history: DayLog[]; stepGoal: number }> = ({ history, stepGoal }) => {
  const [period, setPeriod] = useState<StepPeriod>('week');
  const r = useMemo(() => buildStepReport(history, period, stepGoal), [history, period, stepGoal]);
  const max = Math.max(...r.bars.map((b) => b.value), period === 'year' ? stepGoal * 30 : period === 'day' ? 1000 : stepGoal);
  const goalLine = period === 'week' || period === 'month' ? stepGoal / max : null;
  const fmt = (n: number) => (n >= 100_000 ? `${Math.round(n / 1000)}k` : n.toLocaleString());

  return (
    <section className="surface p-5" aria-labelledby="steps-report-title">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-2xl bg-mint text-leaf-ink flex items-center justify-center">
          <Footprints className="w-5 h-5" />
        </span>
        <h2 id="steps-report-title" className="font-display text-xl font-semibold text-ink">
          Steps
        </h2>
      </div>

      <div role="tablist" className="mt-4 grid grid-cols-4 gap-1 p-1 rounded-full bg-slate-800">
        {PERIODS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={period === id}
            onClick={() => setPeriod(id)}
            className={`relative h-10 rounded-full text-sm font-semibold cursor-pointer ${period === id ? 'text-btn-fg' : 'text-slate-400'}`}
          >
            {period === id && <motion.span layoutId="steps-period" className="absolute inset-0 rounded-full btn-primary" />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label={period === 'day' ? 'Today' : 'Total'} value={fmt(r.total)} unit="steps" />
        <Stat label="Daily average" value={fmt(r.dailyAverage)} unit="steps" />
        <Stat label={period === 'day' ? 'Busiest hour' : period === 'year' ? 'Best month' : 'Best day'} value={r.best ? fmt(r.best.value) : '—'} unit={r.best?.label ?? ''} />
        <Stat label="Goal reached" value={String(r.goalDays)} unit={`of ${r.days} ${r.days === 1 ? 'day' : 'days'}`} />
      </div>

      <div
        className="relative mt-5 h-36 flex items-end gap-[3px]"
        role="img"
        aria-label={`${PERIODS.find((p) => p[0] === period)![1]} steps: total ${r.total}, daily average ${r.dailyAverage}`}
      >
        {goalLine !== null && goalLine <= 1 && (
          <div className="absolute inset-x-0 border-t-2 border-dashed border-coral/60" style={{ bottom: `${goalLine * 100}%` }} aria-hidden="true" />
        )}
        {r.bars.map((b, i) => (
          <div key={b.key} className="flex-1 h-full flex flex-col justify-end">
            <motion.div
              className={`rounded-full ${b.value >= stepGoal && period !== 'day' && period !== 'year' ? 'bg-leaf' : b.value ? 'bg-[#a48df5]' : 'bg-slate-800'}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(b.value ? 4 : 2, (b.value / max) * 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.01, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px] text-[10px] text-slate-400" aria-hidden="true">
        {r.bars.map((b) => (
          <span key={b.key} className="flex-1 text-center whitespace-nowrap overflow-visible">
            {b.label}
          </span>
        ))}
      </div>
      {(period === 'week' || period === 'month') && (
        <p className="mt-3 text-xs text-slate-400">
          Green bars reached your {stepGoal.toLocaleString()}-step goal; the dashed line marks the goal.
        </p>
      )}
    </section>
  );
};

const Stat: React.FC<{ label: string; value: string; unit: string }> = ({ label, value, unit }) => (
  <div className="rounded-2xl bg-slate-800/60 p-3">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-0.5 num text-xl font-semibold text-ink">{value}</p>
    <p className="text-[11px] text-slate-400 truncate">{unit}</p>
  </div>
);
