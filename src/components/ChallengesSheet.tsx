import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Trophy, X } from 'lucide-react';
import { DayLog, UserProfile } from '../types';
import { ActiveChallenge, CHALLENGES, ChallengeId, evaluateChallenge } from '../utils/challenges';
import { localDateKey } from '../utils/history';
import { ProgressRing } from './ui/ProgressRing';

/** Pick a 30, 60 or 90-day challenge and follow it day by day. One challenge at a time. */
export const ChallengesSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  active: ActiveChallenge | null;
  onChange: (c: ActiveChallenge | null) => void;
  history: DayLog[];
  profile: UserProfile;
}> = ({ open, onClose, active, onChange, history, profile }) => {
  const [confirmQuit, setConfirmQuit] = useState(false);
  if (!open) return null;
  const progress = active ? evaluateChallenge(active, history, profile) : null;
  const stepGoal = (profile.stepGoal || 10000).toLocaleString();

  const ruleText = (r: string) =>
    r === 'Reach your step goal' ? `Walk ${stepGoal} steps` : r === 'Drink your water goal' ? `Drink ${((profile.waterTargetMl || 2500) / 1000).toFixed(1)} L of water` : r;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2b2236]/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenges-title"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="bg-slate-900 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-[1.75rem] px-5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between pt-3">
          <div>
            <h2 id="challenges-title" className="font-display text-2xl font-semibold text-ink">
              Challenges
            </h2>
            <p className="text-xs text-slate-400">Build the habit, one day at a time</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-slate-800 text-ink flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {progress ? (
          <section className="mt-5">
            <div className="flex items-center gap-5">
              <ProgressRing
                value={progress.done / progress.def.days}
                size={112}
                stroke={12}
                color="var(--leaf)"
                track="var(--mint)"
                label={`${progress.done} of ${progress.def.days} days done`}
              >
                <span className="num text-2xl font-semibold text-ink">{progress.done}</span>
                <span className="text-[11px] text-slate-400">of {progress.def.days}</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-ink">{progress.def.title}</p>
                <p className="text-sm text-slate-400">
                  {progress.finished
                    ? `Finished — ${progress.done} of ${progress.def.days} days done`
                    : `Day ${progress.dayNumber} of ${progress.def.days}`}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {progress.def.rules.map((r) => (
                    <li key={r} className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-leaf-ink" /> {ruleText(r)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {progress.finished && (
              <div className="mt-4 rounded-2xl bg-butter p-4 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-butter-ink shrink-0" />
                <p className="text-sm text-ink">
                  {progress.done >= progress.def.days * 0.8
                    ? 'Challenge complete — fantastic consistency!'
                    : 'Challenge over. Every green day counts — try again and beat your score.'}
                </p>
              </div>
            )}

            <div
              className="mt-5 grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${progress.def.days <= 30 ? 10 : 15}, minmax(0, 1fr))` }}
              role="img"
              aria-label={`${progress.done} green days so far`}
            >
              {progress.statuses.map((s, i) => (
                <span
                  key={i}
                  className={`aspect-square rounded-md ${
                    s === 'done'
                      ? 'bg-leaf'
                      : s === 'missed'
                      ? 'bg-slate-700'
                      : s === 'today'
                      ? 'border-2 border-dashed border-coral'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">Green: goals met · grey: missed · dashed: today</p>

            <div className="mt-5 flex gap-2">
              {progress.finished ? (
                <button onClick={() => onChange(null)} className="flex-1 h-12 rounded-full btn-primary font-semibold cursor-pointer">
                  Choose a new challenge
                </button>
              ) : confirmQuit ? (
                <>
                  <button
                    onClick={() => {
                      onChange(null);
                      setConfirmQuit(false);
                    }}
                    className="flex-1 h-12 rounded-full bg-peach text-coral-ink font-semibold cursor-pointer"
                  >
                    Yes, stop it
                  </button>
                  <button onClick={() => setConfirmQuit(false)} className="flex-1 h-12 rounded-full bg-slate-800 text-ink font-semibold cursor-pointer">
                    Keep going
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmQuit(true)} className="h-12 px-5 rounded-full bg-slate-800 text-slate-300 font-semibold cursor-pointer">
                  Stop challenge
                </button>
              )}
            </div>
          </section>
        ) : (
          <ul className="mt-5 space-y-3">
            {CHALLENGES.map((c) => (
              <li key={c.id} className="rounded-[1.5rem] bg-slate-800/60 p-4">
                <div className="flex items-center gap-3">
                  <span className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${c.tint}`}>
                    <span className="num text-xl font-semibold leading-none">{c.days}</span>
                    <span className="text-[10px] font-semibold">days</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink">{c.title}</p>
                    <p className="text-xs text-slate-400">Every day: {c.rules.map((r) => { const t = ruleText(r); return t.charAt(0).toLowerCase() + t.slice(1); }).join(' + ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => onChange({ id: c.id as ChallengeId, startDate: localDateKey() })}
                  className="mt-3 w-full h-11 rounded-full btn-primary font-semibold cursor-pointer"
                >
                  Start today
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
};
