import React from 'react';
import { motion } from 'motion/react';
import { Camera, ChevronRight, Flame, Footprints, Share2, Sparkles, Volume2 } from 'lucide-react';
import { DayLog, LoggedMeal, MealType, UserProfile } from '../types';
import { calculateMacroTargets, calculateTargetCalories, StreakInfo } from '../utils/healthCalculations';
import { CountUp, ProgressRing } from './ui/ProgressRing';
import { MealTimeline } from './MealTimeline';
import { WaterTracker } from './WaterTracker';
import { AI_ENABLED } from '../utils/features';
import { usePedometer } from '../utils/pedometer/usePedometer';
import { localDateKey } from '../utils/history';

interface HomeViewProps {
  profile: UserProfile;
  today: DayLog;
  streakInfo: StreakInfo;
  pedometer: ReturnType<typeof usePedometer>;
  onOpenScanner: (type: MealType) => void;
  onOpenSteps: () => void;
  onOpenStreak: () => void;
  onOpenCoach: () => void;
  onShare: () => void;
  onSpeak: () => void;
  onDeleteMeal: (id: string) => void;
  onAskCoachAboutMeal: (meal: LoggedMeal) => void;
  onUpdateWater: (ml: number) => void;
}

const card = 'surface p-5 sm:p-6';
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] as const },
});

export const HomeView: React.FC<HomeViewProps> = (p) => {
  const { profile, today } = p;
  const eaten = today.meals.reduce((s, m) => s + m.total_calories, 0);
  const target = calculateTargetCalories(profile);
  const budget = target + today.caloriesBurned;
  const left = budget - eaten;
  const macros = calculateMacroTargets(profile, target);
  const sum = (k: 'protein_g' | 'carbs_g' | 'fat_g') =>
    Math.round(today.meals.reduce((s, m) => s + (m.total_macros[k] || 0), 0));

  const status =
    eaten === 0
      ? { text: 'Log your first meal to start the day', tone: 'text-slate-400' }
      : left < 0
      ? { text: `${Math.abs(left).toLocaleString()} kcal over — a 20-minute walk burns about 100`, tone: 'text-rose-400' }
      : left < budget * 0.15
      ? { text: 'Nearly at your budget — go light tonight', tone: 'text-amber-400' }
      : { text: 'On track for your goal', tone: 'text-emerald-400' };

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <motion.div {...stagger(0)} className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{greeting()}</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
            {profile.name ? profile.name.split(' ')[0] : 'Welcome'}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <IconButton label="Read today's summary aloud" onClick={p.onSpeak}>
            <Volume2 className="w-5 h-5" />
          </IconButton>
          <IconButton label="Share today's progress" onClick={p.onShare}>
            <Share2 className="w-5 h-5" />
          </IconButton>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Energy hero */}
        <motion.section {...stagger(1)} className={`${card} lg:col-span-7`} aria-labelledby="energy-title">
          <div className="flex items-center justify-between">
            <h3 id="energy-title" className="text-sm font-semibold text-slate-400">
              Today's energy
            </h3>
            <span className="text-xs font-medium text-slate-400 tabular-nums">Budget {budget.toLocaleString()} kcal</span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            <ProgressRing
              value={budget > 0 ? eaten / budget : 0}
              size={188}
              stroke={16}
              color={left < 0 ? 'var(--color-rose-400)' : 'url(#energy-grad)'}
              defs={
                <linearGradient id="energy-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--color-teal-400)" />
                  <stop offset="100%" stopColor="var(--color-emerald-500)" />
                </linearGradient>
              }
              label={`${Math.abs(left)} kilocalories ${left < 0 ? 'over' : 'left'} of ${budget}`}
            >
              <CountUp value={Math.abs(left)} className="text-4xl font-bold tracking-tight text-white" />
              <span className="text-xs font-medium text-slate-400 mt-0.5">{left < 0 ? 'kcal over' : 'kcal left'}</span>
            </ProgressRing>

            <div className="w-full flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
                <Stat label="Eaten" value={eaten} />
                <Stat label="Burned" value={today.caloriesBurned} prefix="+" accent="text-emerald-400" />
                <Stat label="Goal" value={target} />
              </div>
              <div className="space-y-2.5">
                <MacroBar label="Protein" value={sum('protein_g')} target={macros.protein_g} color="bg-sky-400" />
                <MacroBar label="Carbs" value={sum('carbs_g')} target={macros.carbs_g} color="bg-amber-400" />
                <MacroBar label="Fat" value={sum('fat_g')} target={macros.fat_g} color="bg-rose-400" />
              </div>
            </div>
          </div>

          <p className={`mt-4 text-sm font-medium ${status.tone}`}>{status.text}</p>

          <button
            onClick={() => p.onOpenScanner(defaultMealType())}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-lime on-brand font-bold text-sm active:scale-[0.98] transition-transform cursor-pointer min-h-[52px]"
          >
            <Camera className="w-5 h-5" />
            {AI_ENABLED ? 'Snap your plate' : 'Log food'}
          </button>
        </motion.section>

        <div className="lg:col-span-5 space-y-5">
          {/* Steps */}
          <motion.button
            {...stagger(2)}
            onClick={p.onOpenSteps}
            className={`${card} w-full text-left flex items-center gap-5 cursor-pointer active:scale-[0.99] transition-transform`}
          >
            <ProgressRing
              value={today.steps / (profile.stepGoal || 10000)}
              size={88}
              stroke={10}
              color="var(--color-cyan-400)"
              label={`${today.steps} of ${profile.stepGoal} steps`}
            >
              <Footprints className="w-6 h-6 text-cyan-400" />
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-400">Steps</p>
              <p className="text-3xl font-bold tracking-tight text-white">
                <CountUp value={today.steps} />
              </p>
              <p className="text-xs text-slate-400 truncate">
                {p.pedometer.enabled && p.pedometer.status === 'active'
                  ? `of ${(profile.stepGoal || 10000).toLocaleString()} · ${today.distanceKm} km`
                  : 'Tap to turn on automatic counting'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </motion.button>

          {/* Streak */}
          <motion.button
            {...stagger(3)}
            onClick={p.onOpenStreak}
            className={`${card} w-full text-left cursor-pointer active:scale-[0.99] transition-transform`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400 fill-amber-400/30" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-white leading-tight">
                  {p.streakInfo.currentStreak}-day streak
                </p>
                <p className="text-xs text-slate-400">Steps goal + calorie goal on the same day</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
            <WeekDots streakInfo={p.streakInfo} />
          </motion.button>

          {AI_ENABLED && (
            <motion.button
              {...stagger(4)}
              onClick={p.onOpenCoach}
              className={`${card} w-full text-left flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-transform`}
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">Ask your coach</p>
                <p className="text-xs text-slate-400 truncate">What to eat with {Math.max(0, left)} kcal left</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div {...stagger(5)} className="lg:col-span-7">
          <MealTimeline
            meals={today.meals}
            onOpenPlateScannerForType={p.onOpenScanner}
            onDeleteMeal={p.onDeleteMeal}
            onAskCoachAboutMeal={AI_ENABLED ? p.onAskCoachAboutMeal : undefined}
          />
        </motion.div>
        <motion.div {...stagger(6)} className="lg:col-span-5">
          <WaterTracker
            waterMl={today.waterMl ?? 0}
            waterTargetMl={profile.waterTargetMl || 2500}
            onUpdateWater={p.onUpdateWater}
            unitSystem={profile.unitSystem}
          />
        </motion.div>
      </div>
    </div>
  );
};

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function defaultMealType(): MealType {
  const h = new Date().getHours();
  return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 22 ? 'Dinner' : 'Snack';
}

const IconButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({
  label,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className="w-12 h-12 rounded-2xl surface flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-transform cursor-pointer"
  >
    {children}
  </button>
);

const Stat: React.FC<{ label: string; value: number; prefix?: string; accent?: string }> = ({
  label,
  value,
  prefix = '',
  accent = 'text-white',
}) => (
  <div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`text-lg font-bold tabular-nums ${accent}`}>
      {prefix}
      {value.toLocaleString()}
    </p>
  </div>
);

const MacroBar: React.FC<{ label: string; value: number; target: number; color: string }> = ({
  label,
  value,
  target,
  color,
}) => {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="text-slate-400 tabular-nums">
          {value} / {target} g
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
};

/** The last 7 calendar days, oldest first; days without data count as missed. */
const WeekDots: React.FC<{ streakInfo: StreakInfo }> = ({ streakInfo }) => {
  const byDate = new Map(streakInfo.past7Days.map((d) => [d.date, d]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = localDateKey(date);
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'narrow' }), day: byDate.get(key), isToday: i === 6 };
  });
  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {days.map(({ key, label, day, isToday }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <span className={`text-[11px] font-medium ${isToday ? 'text-white' : 'text-slate-400'}`}>{label}</span>
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              day?.bothMet ? 'bg-amber-400/20' : isToday ? 'border-2 border-dashed border-amber-400/60' : 'bg-slate-800'
            }`}
          >
            {day?.bothMet && <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />}
          </span>
        </div>
      ))}
    </div>
  );
};
