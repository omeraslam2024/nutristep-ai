import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Flag, Flame, Footprints, Share2, Sparkles, Trophy, Utensils, Volume2 } from 'lucide-react';
import { DayLog, LoggedMeal, MealType, UserProfile } from '../types';
import { calculateMacroTargets, calculateTargetCalories, StreakInfo } from '../utils/healthCalculations';
import { CountUp, ProgressRing } from './ui/ProgressRing';
import { MealTimeline } from './MealTimeline';
import { WaterTracker } from './WaterTracker';
import { AI_ENABLED } from '../utils/features';
import { usePedometer } from '../utils/pedometer/usePedometer';

interface HomeViewProps {
  profile: UserProfile;
  today: DayLog;
  streakInfo: StreakInfo;
  pedometer: ReturnType<typeof usePedometer>;
  onOpenScanner: (type: MealType) => void;
  onOpenSteps: () => void;
  onOpenStreak: () => void;
  onOpenProfile: () => void;
  onOpenCoach: () => void;
  coachPreview: string;
  onOpenChallenges: () => void;
  challenge: { title: string; subtitle: string; pct: number } | null;
  onShare: () => void;
  onSpeak: () => void;
  onDeleteMeal: (id: string) => void;
  onAskCoachAboutMeal: (meal: LoggedMeal) => void;
  onUpdateWater: (ml: number) => void;
}

const enter = (i: number) => ({
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
  const stepGoal = profile.stepGoal || 10000;
  const stepPct = Math.min(100, Math.round((today.steps / stepGoal) * 100));
  const firstName = profile.name ? profile.name.split(' ')[0] : '';

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <motion.header {...enter(0)} className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <h1 className="font-display text-[clamp(22px,7vw,28px)] leading-tight font-semibold text-ink break-words">
            Salaam{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RoundButton label="Share today's progress" onClick={p.onShare}>
            <Share2 className="w-5 h-5" />
          </RoundButton>
          <button
            onClick={p.onOpenProfile}
            aria-label="Open your profile"
            className="w-11 h-11 rounded-full bg-lilac text-lilac-ink font-display font-semibold text-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          >
            {(firstName || '?').charAt(0).toUpperCase()}
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-4">
          {/* Energy card */}
          <motion.section {...enter(1)} className="surface p-5" aria-label="Today's calories">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={budget > 0 ? eaten / budget : 0}
                size={Math.round(Math.min(136, window.innerWidth * 0.34))}
                stroke={13}
                color={left < 0 ? 'var(--coral-ink)' : 'var(--coral)'}
                track="var(--ring-track)"
                label={`${Math.abs(left)} kilocalories ${left < 0 ? 'over' : 'left'} of ${budget}`}
              >
                <CountUp value={Math.abs(left)} className="num text-[clamp(22px,7vw,30px)] font-semibold text-ink leading-none" />
                <span className="text-xs text-slate-400 mt-1">{left < 0 ? 'kcal over' : 'kcal left'}</span>
              </ProgressRing>
              <ul className="flex-1 min-w-0 space-y-3">
                <Fact icon={<Utensils className="w-4 h-4" />} tint="bg-peach text-coral-ink" label="Eaten" value={eaten.toLocaleString()} />
                <Fact
                  icon={<Flame className="w-4 h-4" />}
                  tint="bg-mint text-leaf-ink"
                  label="Burned by steps"
                  value={`+${today.caloriesBurned.toLocaleString()}`}
                />
                <Fact icon={<Flag className="w-4 h-4" />} tint="bg-butter text-butter-ink" label="Daily goal" value={target.toLocaleString()} />
              </ul>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <Macro label="Protein" value={sum('protein_g')} target={macros.protein_g} color="#8b6cf0" />
              <Macro label="Carbs" value={sum('carbs_g')} target={macros.carbs_g} color="#f5b53f" />
              <Macro label="Fat" value={sum('fat_g')} target={macros.fat_g} color="#2fae78" />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                {eaten === 0
                  ? 'Tap the camera to log your first meal.'
                  : left < 0
                  ? `${Math.abs(left)} kcal over — a 20-minute walk burns about 100.`
                  : left < budget * 0.15
                  ? 'Nearly at your budget — go light tonight.'
                  : 'Nicely on track today.'}
              </p>
              <button
                onClick={p.onSpeak}
                aria-label="Read today's summary aloud"
                title="Read aloud"
                className="w-10 h-10 shrink-0 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </motion.section>

          {/* Steps + streak tiles */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              {...enter(2)}
              onClick={p.onOpenSteps}
              className="rounded-[1.5rem] bg-mint p-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Steps</span>
                <Footprints className="w-5 h-5 text-leaf-ink" />
              </div>
              <p className="mt-2 num text-[28px] font-semibold text-ink leading-none">
                <CountUp value={today.steps} />
              </p>
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                of {stepGoal.toLocaleString()} · {stepPct}%
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-900/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-leaf"
                  initial={{ width: 0 }}
                  animate={{ width: `${stepPct}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              {!(p.pedometer.enabled && p.pedometer.status === 'active') && (
                <p className="mt-2 text-[11px] font-semibold text-leaf-ink">Turn on auto counting ›</p>
              )}
            </motion.button>

            <motion.button
              {...enter(3)}
              onClick={p.onOpenStreak}
              className="rounded-[1.5rem] bg-butter p-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Streak</span>
                <Flame className="w-5 h-5 text-butter-ink" />
              </div>
              <p className="mt-2 text-ink leading-none">
                <span className="num text-[28px] font-semibold">{p.streakInfo.currentStreak}</span>{' '}
                <span className="text-sm text-slate-400">{p.streakInfo.currentStreak === 1 ? 'day' : 'days'}</span>
              </p>
              <WeekDots streakInfo={p.streakInfo} />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              {...enter(4)}
              onClick={p.onOpenCoach}
              className="surface w-full p-4 text-left flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span className="w-11 h-11 rounded-2xl bg-lilac text-lilac-ink flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-ink">Coach</span>
                <span className="block text-xs text-slate-400 line-clamp-2">{p.coachPreview}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </motion.button>

            <motion.button
              {...enter(5)}
              onClick={p.onOpenChallenges}
              className="surface w-full p-4 text-left flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span className="w-11 h-11 rounded-2xl bg-butter text-butter-ink flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-ink">{p.challenge ? p.challenge.title : 'Challenges'}</span>
                {p.challenge ? (
                  <>
                    <span className="block text-xs text-slate-400">{p.challenge.subtitle}</span>
                    <span className="mt-1.5 block h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <span className="block h-full rounded-full bg-leaf" style={{ width: `${p.challenge.pct}%` }} />
                    </span>
                  </>
                ) : (
                  <span className="block text-xs text-slate-400">Start a 30, 60 or 90-day challenge</span>
                )}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </motion.button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <motion.div {...enter(6)}>
            <MealTimeline
              meals={today.meals}
              onOpenPlateScannerForType={p.onOpenScanner}
              onDeleteMeal={p.onDeleteMeal}
              onAskCoachAboutMeal={AI_ENABLED ? p.onAskCoachAboutMeal : undefined}
            />
          </motion.div>
          <motion.div {...enter(6)}>
            <WaterTracker
              waterMl={today.waterMl ?? 0}
              waterTargetMl={profile.waterTargetMl || 2500}
              onUpdateWater={p.onUpdateWater}
              unitSystem={profile.unitSystem}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export function defaultMealType(): MealType {
  const h = new Date().getHours();
  return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 22 ? 'Dinner' : 'Snack';
}

const RoundButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className="w-11 h-11 rounded-full surface flex items-center justify-center text-ink active:scale-95 transition-transform cursor-pointer"
  >
    {children}
  </button>
);

const Fact: React.FC<{ icon: React.ReactNode; tint: string; label: string; value: string }> = ({ icon, tint, label, value }) => (
  <li className="flex items-center gap-3">
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>{icon}</span>
    <span className="min-w-0">
      <span className="block text-xs text-slate-400 leading-tight">{label}</span>
      <span className="block num text-lg font-semibold text-ink leading-tight">{value}</span>
    </span>
  </li>
);

const Macro: React.FC<{ label: string; value: number; target: number; color: string }> = ({ label, value, target, color }) => {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <p className="text-xs font-semibold text-ink">{label}</p>
      <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-400 tabular-nums">
        {value} / {target} g
      </p>
    </div>
  );
};

/** The last 7 calendar days, oldest first: a filled dot for days both goals were met. */
const WeekDots: React.FC<{ streakInfo: StreakInfo }> = ({ streakInfo }) => (
  <div className="mt-3 grid grid-cols-7 gap-0.5">
    {streakInfo.past7Days.map((d) => (
      <div key={d.date} className="flex flex-col items-center gap-1">
        <span
          className={`w-4 h-4 rounded-full ${
            d.bothMet ? 'bg-[#f5b53f]' : d.isToday ? 'border-2 border-dashed border-[#f5b53f]' : 'bg-slate-900/60'
          }`}
        />
        <span className="text-[9px] font-semibold text-slate-400">{d.dayLabel}</span>
      </div>
    ))}
  </div>
);
