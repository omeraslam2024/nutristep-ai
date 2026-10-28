import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Droplets, Dumbbell, Footprints, PartyPopper, Plus, Sparkles, X } from 'lucide-react';
import { DayLog, MealType, UserProfile } from '../types';
import { FoodPick } from '../data/foods';
import { buildCoachAdvice, CoachTip } from '../utils/coach';
import { AI_ENABLED } from '../utils/features';

const TIP_STYLE: Record<CoachTip['kind'], { icon: React.ElementType; tint: string }> = {
  meal: { icon: Sparkles, tint: 'bg-lilac text-lilac-ink' },
  move: { icon: Footprints, tint: 'bg-mint text-leaf-ink' },
  water: { icon: Droplets, tint: 'bg-cloud text-cloud-ink' },
  protein: { icon: Dumbbell, tint: 'bg-peach text-coral-ink' },
  praise: { icon: PartyPopper, tint: 'bg-butter text-butter-ink' },
};

/** Free, offline coach: tips and next-meal ideas worked out on the phone from today's numbers. */
export const CoachSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  today: DayLog;
  history: DayLog[];
  onLog: (food: FoodPick, meal: MealType) => void;
  onOpenAiChat: () => void;
}> = ({ open, onClose, profile, today, history, onLog, onOpenAiChat }) => {
  const advice = useMemo(() => buildCoachAdvice(profile, today, history), [profile, today, history]);
  const [logged, setLogged] = useState<string | null>(null);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2b2236]/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="bg-slate-900 w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-[1.75rem] px-5 pb-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between pt-3">
          <div>
            <h2 id="coach-title" className="font-display text-2xl font-semibold text-ink">
              Coach
            </h2>
            <p className="text-xs text-slate-400">Ideas from today's numbers · works offline</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-slate-800 text-ink flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {advice.tips.map((t) => {
            const { icon: Icon, tint } = TIP_STYLE[t.kind];
            return (
              <li key={t.id} className="flex gap-3 rounded-2xl bg-slate-800/60 p-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{t.title}</span>
                  <span className="block text-sm text-slate-400">{t.body}</span>
                </span>
              </li>
            );
          })}
        </ul>

        <h3 className="mt-6 font-display text-lg font-semibold text-ink">
          {advice.nextMeal} ideas{advice.mealBudget > 0 ? ` under ${advice.mealBudget} kcal` : ''}
        </h3>
        {advice.ideas.length ? (
          <ul className="mt-2 space-y-1">
            {advice.ideas.map((f) => (
              <li key={f.id} className="flex items-center gap-3 p-2 rounded-2xl">
                <span className="w-12 h-12 rounded-2xl bg-peach flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                  {f.emoji}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-ink leading-snug">{f.name}</span>
                  <span className="block text-xs text-slate-400 truncate">
                    {f.kcal} kcal · {f.protein} g protein · {f.serving}
                  </span>
                </span>
                <button
                  onClick={() => {
                    onLog(f, advice.nextMeal);
                    setLogged(f.id);
                  }}
                  disabled={logged === f.id}
                  aria-label={`Log ${f.name} as ${advice.nextMeal.toLowerCase()}`}
                  className={`h-9 px-3 rounded-full text-sm font-semibold flex items-center gap-1 shrink-0 cursor-pointer ${
                    logged === f.id ? 'bg-mint text-leaf-ink' : 'btn-primary'
                  }`}
                >
                  {logged === f.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {logged === f.id ? 'Logged' : 'Log'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">You have used today's budget — water, tea without sugar or a walk are the best picks now.</p>
        )}

        {AI_ENABLED && (
          <button
            onClick={onOpenAiChat}
            className="mt-6 w-full h-12 rounded-full bg-lilac text-lilac-ink font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Chat with the AI coach
          </button>
        )}
        <p className="mt-4 text-[11px] text-slate-400 text-center">
          Suggestions are general wellness ideas, not medical advice.
        </p>
      </motion.div>
    </div>
  );
};
