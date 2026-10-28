import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Footprints, ShieldCheck } from 'lucide-react';
import { FitnessGoal, UserProfile } from '../types';
import { calculateTargetCalories } from '../utils/healthCalculations';
import { AI_ENABLED } from '../utils/features';
import type { usePedometer } from '../utils/pedometer/usePedometer';
import { CountUp, ProgressRing } from './ui/ProgressRing';
import { ThaliIllustration } from './ui/ThaliIllustration';

interface OnboardingProps {
  initial: UserProfile;
  pedometer: ReturnType<typeof usePedometer>;
  onDone: (profile: UserProfile) => void;
}

const GOALS: { id: FitnessGoal; label: string; hint: string }[] = [
  { id: 'lose_weight', label: 'Lose weight', hint: 'About 0.5 kg a week' },
  { id: 'maintain', label: 'Stay healthy', hint: 'Keep my weight' },
  { id: 'gain_muscle', label: 'Build muscle', hint: 'Eat a little more' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ initial, pedometer, onDone }) => {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [p, setP] = useState<UserProfile>(initial);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const aboutValid = p.name.trim().length > 0 && p.age >= 13 && p.age <= 100 && p.heightCm >= 120 && p.weightKg >= 30;
  const finished: UserProfile = {
    ...p,
    name: p.name.trim(),
    targetWeightKg:
      p.goal === 'lose_weight' ? Math.round(p.weightKg * 0.93) : p.goal === 'gain_muscle' ? Math.round(p.weightKg * 1.04) : p.weightKg,
    onboarded: true,
  };

  return (
    <div
      className="min-h-screen flex flex-col max-w-lg mx-auto px-5"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)', paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
    >
      {/* Header: brand on the welcome step, progress after it */}
      <div className="flex items-center gap-3 h-12">
        {step === 0 ? (
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center p-1.5">
              <img src="/icon-white.svg" alt="" className="w-full h-full" />
            </span>
            <span className="font-display text-xl font-semibold text-ink">NutriStep</span>
          </div>
        ) : (
          <>
            {step < 3 ? (
              <button
                onClick={() => go(step - 1)}
                aria-label="Back"
                className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-ink cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <span className="w-9" />
            )}
            <div className="flex-1 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div className="h-full bg-coral rounded-full" animate={{ width: i <= step ? '100%' : '0%' }} />
                </div>
              ))}
            </div>
            <span className="w-9" />
          </>
        )}
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          initial={{ opacity: 0, x: 40 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 * dir }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col"
        >
          {step === 0 && (
            <div className="flex-1 flex flex-col justify-center">
              <ThaliIllustration size={Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 60 : 300)} />
              <h1 className="mt-8 font-display text-[32px] leading-[1.15] font-semibold text-ink">
                Every step earns you a little more to eat.
              </h1>
              <p className="mt-3 text-base text-slate-400 leading-relaxed">
                {AI_ENABLED
                  ? 'Snap or log your meals. Walk, and NutriStep adds the calories you burn back to your day.'
                  : 'Log meals in seconds. Walk, and NutriStep adds the calories you burn back to your day.'}
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex-1 pt-6 space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink">About you</h1>
                <p className="mt-2 text-sm text-slate-400">Used only on this phone to work out your daily calories.</p>
              </div>
              <Field label="First name">
                <input
                  autoFocus
                  value={p.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              </Field>
              <Field label="Sex (for the calorie formula)" group>
                <Segmented
                  value={p.gender}
                  options={[
                    ['female', 'Female'],
                    ['male', 'Male'],
                  ]}
                  onChange={(v) => set('gender', v as UserProfile['gender'])}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Age">
                  <NumberInput value={p.age} onChange={(v) => set('age', v)} unit="yrs" />
                </Field>
                <Field label="Height">
                  <NumberInput value={p.heightCm} onChange={(v) => set('heightCm', v)} unit="cm" />
                </Field>
                <Field label="Weight">
                  <NumberInput value={p.weightKg} onChange={(v) => set('weightKg', v)} unit="kg" />
                </Field>
              </div>
              <Field label="Your goal" group>
                <div className="grid grid-cols-3 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => set('goal', g.id)}
                      aria-pressed={p.goal === g.id}
                      className={`rounded-2xl p-3 text-left border transition-colors cursor-pointer min-h-[76px] ${
                        p.goal === g.id ? 'border-coral bg-peach' : 'border-transparent bg-slate-900'
                      }`}
                    >
                      <span className="block text-sm font-bold text-white">{g.label}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{g.hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center text-center">
              <div className="mx-auto w-24 h-24 rounded-[2rem] bg-mint flex items-center justify-center">
                <Footprints className="w-11 h-11 text-leaf-ink" />
              </div>
              <h1 className="mt-8 font-display text-3xl font-semibold text-ink">Count your steps automatically</h1>
              <p className="mt-3 text-base text-slate-400 leading-relaxed">
                {pedometer.mode === 'hardware'
                  ? "NutriStep reads your phone's step sensor, so walking adds calories back to your day — even with the app closed."
                  : 'NutriStep counts your steps while the app is open, so walking adds calories back to your day.'}
              </p>
              <div className="mt-6 surface p-4 flex gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-leaf-ink shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">
                  {pedometer.mode === 'hardware' ? (
                    <>
                      Android will ask for <strong>Physical activity</strong> access.{' '}
                    </>
                  ) : null}
                  Your steps stay on this phone.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <p className="text-sm font-semibold text-coral-ink">You're all set, {finished.name}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Your daily budget</h1>
              <div className="mt-8">
                <ProgressRing value={1} size={220} stroke={18} color="var(--coral)" track="var(--ring-track)" label="Daily calorie budget">
                  <CountUp value={calculateTargetCalories(finished)} className="num text-5xl font-semibold text-ink" />
                  <span className="text-sm text-slate-400 mt-1">kcal a day</span>
                </ProgressRing>
              </div>
              <p className="mt-8 text-base text-slate-400 max-w-xs">
                Plus whatever you burn walking. Aim for {finished.stepGoal.toLocaleString()} steps.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="pt-4 space-y-2">
        {step === 0 && <Primary onClick={() => go(1)}>Get started <ArrowRight className="w-5 h-5" /></Primary>}
        {step === 1 && (
          <Primary disabled={!aboutValid} onClick={() => go(2)}>
            Continue
          </Primary>
        )}
        {step === 2 && (
          <>
            <Primary
              onClick={async () => {
                await pedometer.setEnabled(true);
                go(3);
              }}
            >
              Turn on step counting
            </Primary>
            <button onClick={() => go(3)} className="w-full py-3 text-sm font-semibold text-slate-400 min-h-[48px] cursor-pointer">
              Not now
            </button>
          </>
        )}
        {step === 3 && <Primary onClick={() => onDone(finished)}>Start tracking</Primary>}
      </div>
    </div>
  );
};

const inputCls =
  'w-full bg-slate-900 border-2 border-transparent rounded-2xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-coral min-h-[52px]';

/** `group` for button groups: a <label> would forward taps on its text to the first button. */
const Field: React.FC<{ label: string; group?: boolean; children: React.ReactNode }> = ({ label, group, children }) =>
  group ? (
    <div role="group" aria-label={label} className="space-y-2">
      <span className="block text-sm font-semibold text-slate-300">{label}</span>
      {children}
    </div>
  ) : (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );

const NumberInput: React.FC<{ value: number; onChange: (v: number) => void; unit: string }> = ({ value, onChange, unit }) => (
  <div className="flex items-center bg-slate-900 border-2 border-transparent rounded-2xl focus-within:border-coral">
    <input
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) && value > 0 ? value : ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full min-w-0 bg-transparent px-3.5 py-3.5 text-base text-white focus:outline-none min-h-[52px] tabular-nums"
    />
    <span className="pr-3 text-xs text-slate-400">{unit}</span>
  </div>
);

const Segmented: React.FC<{ value: string; options: [string, string][]; onChange: (v: string) => void }> = ({
  value,
  options,
  onChange,
}) => (
  <div className="grid gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
    {options.map(([id, label]) => (
      <button
        key={id}
        type="button"
        aria-pressed={value === id}
        onClick={() => onChange(id)}
        className={`relative py-2.5 rounded-xl text-sm font-semibold min-h-[44px] cursor-pointer ${value === id ? 'text-white' : 'text-slate-400'}`}
      >
        {value === id && (
          <motion.span layoutId={`seg-${options.map((o) => o[0]).join()}`} className="absolute inset-0 rounded-xl bg-slate-800 border border-slate-700" />
        )}
        <span className="relative">{label}</span>
      </button>
    ))}
  </div>
);

const Primary: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({
  onClick,
  disabled,
  children,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full py-4 rounded-full btn-primary font-semibold text-base min-h-[56px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100 cursor-pointer"
  >
    {children}
  </button>
);

export { Segmented };
