import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Clock, Flame, Footprints, Plus, Radio, Route, Volume2 } from 'lucide-react';
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
  const counting = pedometer.enabled && pedometer.status === 'active';

  // Celebrate the moment the goal is crossed, however the steps arrived.
  const prev = useRef(steps);
  useEffect(() => {
    if (prev.current < goal && steps >= goal) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 }, colors: ['#2fae78', '#ff7e5f', '#ffeaae', '#e2d8ff'] });
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
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm text-slate-400">Today</p>
          <h1 className="font-display text-[28px] leading-tight font-semibold text-ink">Steps</h1>
        </div>
        <button
          onClick={speak}
          aria-label="Read steps aloud"
          title="Read steps aloud"
          className="w-11 h-11 rounded-full surface flex items-center justify-center text-ink active:scale-95 transition-transform cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <section className="flex flex-col items-center py-2">
            <ProgressRing value={steps / goal} size={Math.round(Math.min(232, window.innerWidth * 0.66))} stroke={20} color="var(--leaf)" track="var(--mint)" label={`${steps} of ${goal} steps`}>
              <Footprints className="w-7 h-7 text-leaf-ink" />
              <CountUp value={steps} className="num text-[44px] font-semibold text-ink leading-none mt-1" />
              <span className="text-sm text-slate-400 mt-1">of {goal.toLocaleString()} steps</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={reached ? 'done' : 'todo'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 px-3 py-1 rounded-full bg-mint text-leaf-ink text-xs font-semibold tabular-nums"
                >
                  {reached ? 'Goal reached!' : `${(goal - steps).toLocaleString()} to go`}
                </motion.span>
              </AnimatePresence>
            </ProgressRing>
          </section>

          <div className="grid grid-cols-3 gap-3">
            <Metric
              icon={<Route className="w-4 h-4" />}
              tint="bg-cloud text-cloud-ink"
              value={profile.unitSystem === 'imperial' ? `${metrics.distanceMiles}` : `${metrics.distanceKm}`}
              unit={profile.unitSystem === 'imperial' ? 'mi' : 'km'}
            />
            <Metric icon={<Flame className="w-4 h-4" />} tint="bg-peach text-coral-ink" value={`${metrics.caloriesBurned}`} unit="kcal" />
            <Metric icon={<Clock className="w-4 h-4" />} tint="bg-butter text-butter-ink" value={`${metrics.activeMinutes}`} unit="min" />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <HourlyChart hourlySteps={hourlySteps} />

          {/* Automatic counting */}
          <section className="surface p-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-lilac text-lilac-ink flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">Automatic counting</p>
                <p className="text-xs text-slate-400">
                  {pedometer.status === 'denied'
                    ? 'Needs "Physical activity" access'
                    : pedometer.status === 'unsupported'
                    ? 'Not available on this device'
                    : counting
                    ? pedometer.mode === 'hardware'
                      ? "On · uses your phone's step sensor"
                      : 'On · counts while the app is open'
                    : 'Off'}
                </p>
              </div>
              {pedometer.status !== 'unsupported' && (
                <button
                  role="switch"
                  aria-checked={counting}
                  aria-label="Automatic step counting"
                  onClick={() => pedometer.setEnabled(!pedometer.enabled || pedometer.status === 'denied')}
                  className={`relative w-14 h-8 rounded-full transition-colors shrink-0 cursor-pointer ${counting ? 'bg-leaf' : 'bg-slate-700'}`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 rounded-full bg-[#ffffff] shadow"
                    animate={{ left: counting ? 28 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              {pedometer.status === 'denied'
                ? 'Tap the switch to ask again. If no prompt appears, open Android Settings › Apps › NutriStep › Permissions.'
                : pedometer.mode === 'hardware'
                ? 'Counts all day, even with the app closed. A phone lying still or riding in a car adds nothing.'
                : 'A still phone, a car ride or handling the phone does not add steps.'}
            </p>
          </section>

          {/* Manual entry, for treadmill or time without the phone */}
          <section className="surface overflow-hidden">
            <button
              onClick={() => setManualOpen((o) => !o)}
              aria-expanded={manualOpen}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <p className="font-semibold text-ink">Add steps by hand</p>
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
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[500, 1000, 2500].map((n) => (
                        <button
                          key={n}
                          onClick={() => onAddSteps(n)}
                          className="h-12 rounded-2xl bg-mint text-leaf-ink num font-semibold active:scale-95 transition-transform cursor-pointer"
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
                        className="flex-1 min-w-0 bg-slate-800 rounded-2xl px-4 text-sm text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-coral min-h-[48px]"
                      />
                      <button type="submit" className="btn-primary px-5 rounded-2xl font-semibold text-sm flex items-center gap-1 min-h-[48px] cursor-pointer">
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

const Metric: React.FC<{ icon: React.ReactNode; tint: string; value: string; unit: string }> = ({ icon, tint, value, unit }) => (
  <div className="surface p-3">
    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${tint}`}>{icon}</span>
    <p className="mt-2 text-ink">
      <span className="num text-xl font-semibold">{value}</span> <span className="text-xs text-slate-400">{unit}</span>
    </p>
  </div>
);

/** Today's steps per hour, 6:00 to 23:00; the last three hours are highlighted. */
const HourlyChart: React.FC<{ hourlySteps: HourlyStep[] }> = ({ hourlySteps }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const byHour = new Map(hourlySteps.map((h) => [h.hour, h.steps]));
  const max = Math.max(500, ...hours.map((h) => byHour.get(h) || 0));
  const now = new Date().getHours();
  const best = hours.reduce((b, h) => ((byHour.get(h) || 0) > (byHour.get(b) || 0) ? h : b), hours[0]);
  const fmtHour = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
  const summary = byHour.size
    ? `Most active at ${fmtHour(best)} with ${(byHour.get(best) || 0).toLocaleString()} steps`
    : 'No steps recorded yet today';

  return (
    <section className="surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Steps per hour</h2>
        <span className="text-xs text-slate-400 tabular-nums">
          {byHour.size ? `Peak ${fmtHour(best)} · ${(byHour.get(best) || 0).toLocaleString()}` : ''}
        </span>
      </div>
      <div className="mt-4 h-28 flex items-end gap-1" role="img" aria-label={summary}>
        {hours.map((h) => {
          const v = byHour.get(h) || 0;
          const recent = h <= now && h > now - 3;
          return (
            <div key={h} className="flex-1 h-full flex flex-col justify-end">
              <motion.div
                className="rounded-full"
                style={{ backgroundColor: v ? (recent ? 'var(--coral)' : '#a48df5') : 'var(--color-slate-800)' }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(v ? 8 : 4, (v / max) * 100)}%` }}
                transition={{ duration: 0.7, delay: (h - 6) * 0.02, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400 tabular-nums">
        <span>6a</span>
        <span>10a</span>
        <span>2p</span>
        <span>6p</span>
        <span>11p</span>
      </div>
    </section>
  );
};
