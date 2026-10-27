import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronDown, Clock, Flame, MapPin, Plus, Smartphone, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HourlyStep, UserProfile } from '../types';
import { calculateStepMetrics } from '../utils/healthCalculations';
import { speakText } from '../utils/speechHelper';
import type { usePedometer } from '../utils/pedometer/usePedometer';
import { CountUp, ProgressRing } from './ui/ProgressRing';

interface StepsViewProps {
  profile: UserProfile;
  steps: number;
  hourlySteps: HourlyStep[];
  pedometer: ReturnType<typeof usePedometer>;
  onAddSteps: (delta: number) => void;
}

export const StepsView: React.FC<StepsViewProps> = ({ profile, steps, hourlySteps, pedometer, onAddSteps }) => {
  const goal = profile.stepGoal || 10000;
  const metrics = calculateStepMetrics(steps, profile.weightKg, profile.heightCm);
  const reached = steps >= goal;
  const [manualOpen, setManualOpen] = useState(false);
  const [custom, setCustom] = useState('');

  // Celebrate the moment the goal is crossed, however the steps arrived.
  const prev = useRef(steps);
  useEffect(() => {
    if (prev.current < goal && steps >= goal) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 }, colors: ['#5bb324', '#94d04a', '#22d3ee'] });
    }
    prev.current = steps;
  }, [steps, goal]);

  const speak = () =>
    speakText(
      reached
        ? `Goal reached! ${steps.toLocaleString()} steps and ${metrics.caloriesBurned} calories burned today.`
        : `${steps.toLocaleString()} steps today. ${(goal - steps).toLocaleString()} more to reach your goal.`
    );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-sm text-slate-400">Movement</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Steps today</h2>
        </div>
        <button
          onClick={speak}
          aria-label="Read steps aloud"
          title="Read steps aloud"
          className="w-12 h-12 rounded-2xl surface flex items-center justify-center text-slate-300 active:scale-95 transition-transform cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="surface p-6 lg:col-span-5 flex flex-col items-center text-center">
          <ProgressRing
            value={steps / goal}
            size={220}
            stroke={18}
            color="url(#steps-grad)"
            defs={
              <linearGradient id="steps-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-cyan-400)" />
                <stop offset="100%" stopColor="var(--color-emerald-500)" />
              </linearGradient>
            }
            label={`${steps} of ${goal} steps`}
          >
            <CountUp value={steps} className="text-5xl font-bold tracking-tight text-white" />
            <span className="text-sm text-slate-400 mt-1">of {goal.toLocaleString()}</span>
          </ProgressRing>

          <AnimatePresence mode="wait">
            <motion.p
              key={reached ? 'done' : 'todo'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`mt-4 text-sm font-semibold flex items-center gap-1.5 ${reached ? 'text-emerald-400' : 'text-slate-300'}`}
            >
              {reached && <CheckCircle2 className="w-4 h-4" />}
              {reached ? 'Daily goal reached' : `${(goal - steps).toLocaleString()} steps to go`}
            </motion.p>
          </AnimatePresence>

          <div className="mt-5 grid grid-cols-3 gap-3 w-full">
            <Metric icon={<Flame className="w-4 h-4 text-orange-400" />} value={`${metrics.caloriesBurned}`} unit="kcal" />
            <Metric
              icon={<MapPin className="w-4 h-4 text-sky-400" />}
              value={profile.unitSystem === 'imperial' ? `${metrics.distanceMiles}` : `${metrics.distanceKm}`}
              unit={profile.unitSystem === 'imperial' ? 'mi' : 'km'}
            />
            <Metric icon={<Clock className="w-4 h-4 text-amber-400" />} value={`${metrics.activeMinutes}`} unit="min" />
          </div>
        </section>

        <div className="lg:col-span-7 space-y-5">
          <HourlyChart hourlySteps={hourlySteps} />

          {/* Phone step counter */}
          <section className="surface p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white">Automatic counting</h3>
                  <StatusPill status={pedometer.status} enabled={pedometer.enabled} />
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {pedometer.status === 'denied'
                    ? 'Allow "Physical activity" for NutriStep. If no prompt appears, open Android Settings › Apps › NutriStep › Permissions.'
                    : pedometer.mode === 'hardware'
                    ? "Uses your phone's built-in step sensor. It counts all day, even with the app closed, and ignores a phone lying still or riding in a car."
                    : pedometer.status === 'unsupported'
                    ? 'This device has no motion sensor. Add steps manually below.'
                    : 'Counts while NutriStep is open. A still phone, a car ride or handling the phone does not add steps.'}
                </p>
              </div>
            </div>
            {pedometer.status !== 'unsupported' && (
              <button
                onClick={() => pedometer.setEnabled(!pedometer.enabled || pedometer.status === 'denied')}
                className={`w-full py-3 rounded-2xl font-bold text-sm min-h-[48px] transition-colors cursor-pointer ${
                  pedometer.enabled && pedometer.status !== 'denied'
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-brand-lime on-brand active:scale-[0.98]'
                }`}
              >
                {pedometer.status === 'denied'
                  ? 'Allow access'
                  : pedometer.enabled
                  ? 'Turn off'
                  : 'Count my steps automatically'}
              </button>
            )}
          </section>

          {/* Manual entry, for treadmill or time without the phone */}
          <section className="surface overflow-hidden">
            <button
              onClick={() => setManualOpen((o) => !o)}
              aria-expanded={manualOpen}
              className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <h3 className="font-bold text-white">Add steps manually</h3>
                <p className="text-xs text-slate-400 mt-0.5">For a treadmill or a walk without your phone</p>
              </div>
              <motion.span animate={{ rotate: manualOpen ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {manualOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="px-5 pb-5 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[500, 1000, 2500].map((n) => (
                        <button
                          key={n}
                          onClick={() => onAddSteps(n)}
                          className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm min-h-[48px] active:scale-95 transition-transform cursor-pointer tabular-nums"
                        >
                          +{n.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const n = Math.round(Number(custom));
                        if (n > 0 && n <= 50000) {
                          onAddSteps(n);
                          setCustom('');
                        }
                      }}
                    >
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="50000"
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder="Other amount"
                        aria-label="Number of steps to add"
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                      />
                      <button
                        type="submit"
                        className="px-4 rounded-xl bg-brand-lime on-brand font-bold text-sm flex items-center gap-1 min-h-[48px] cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; value: string; unit: string }> = ({ icon, value, unit }) => (
  <div className="rounded-2xl bg-slate-950/60 border border-slate-800 py-3 flex flex-col items-center">
    {icon}
    <span className="mt-1 text-lg font-bold text-white tabular-nums">{value}</span>
    <span className="text-[11px] text-slate-400">{unit}</span>
  </div>
);

const StatusPill: React.FC<{ status: string; enabled: boolean }> = ({ status, enabled }) => {
  const [text, cls] =
    status === 'active'
      ? ['On', 'bg-emerald-500/15 text-emerald-400']
      : status === 'denied'
      ? ['Needs permission', 'bg-amber-500/15 text-amber-400']
      : status === 'starting'
      ? ['Starting…', 'bg-slate-800 text-slate-400']
      : status === 'unsupported'
      ? ['Not available', 'bg-slate-800 text-slate-400']
      : [enabled ? 'On' : 'Off', 'bg-slate-800 text-slate-400'];
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>;
};

/** Today's steps per hour, 6:00 to 23:00. */
const HourlyChart: React.FC<{ hourlySteps: HourlyStep[] }> = ({ hourlySteps }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const byHour = new Map(hourlySteps.map((h) => [h.hour, h.steps]));
  const max = Math.max(500, ...hours.map((h) => byHour.get(h) || 0));
  const now = new Date().getHours();
  const best = hours.reduce((b, h) => ((byHour.get(h) || 0) > (byHour.get(b) || 0) ? h : b), hours[0]);
  const summary = byHour.size
    ? `Most active hour: ${best}:00 with ${(byHour.get(best) || 0).toLocaleString()} steps`
    : 'No steps recorded yet today';

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">By hour</h3>
        <span className="text-xs text-slate-400">{byHour.size ? `Peak ${best}:00` : ''}</span>
      </div>
      <div className="mt-4 h-28 flex items-end gap-1" role="img" aria-label={summary}>
        {hours.map((h) => {
          const v = byHour.get(h) || 0;
          return (
            <div key={h} className="flex-1 h-full flex flex-col justify-end">
              <motion.div
                className={`rounded-t-md ${h === now ? 'bg-emerald-500' : 'bg-cyan-400/70'}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(v ? 6 : 2, (v / max) * 100)}%` }}
                transition={{ duration: 0.7, delay: (h - 6) * 0.02, ease: [0.22, 1, 0.36, 1] }}
                style={{ opacity: v ? 1 : 0.25 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 tabular-nums">
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </section>
  );
};
