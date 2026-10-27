import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Apple, Coffee, Moon, Plus, Sparkles, Sun, Trash2 } from 'lucide-react';
import { LoggedMeal, MealType } from '../types';

interface MealTimelineProps {
  meals: LoggedMeal[];
  onOpenPlateScannerForType: (type: MealType) => void;
  onDeleteMeal: (mealId: string) => void;
  onAskCoachAboutMeal?: (meal: LoggedMeal) => void;
}

const SECTIONS: { type: MealType; title: string; icon: React.ElementType; tint: string }[] = [
  { type: 'Breakfast', title: 'Breakfast', icon: Coffee, tint: 'bg-amber-500/15 text-amber-400' },
  { type: 'Lunch', title: 'Lunch', icon: Sun, tint: 'bg-emerald-500/15 text-emerald-400' },
  { type: 'Dinner', title: 'Dinner', icon: Moon, tint: 'bg-indigo-500/15 text-indigo-400' },
  { type: 'Snack', title: 'Snacks', icon: Apple, tint: 'bg-rose-500/15 text-rose-400' },
];

export const MealTimeline: React.FC<MealTimelineProps> = ({
  meals,
  onOpenPlateScannerForType,
  onDeleteMeal,
  onAskCoachAboutMeal,
}) => {
  const total = meals.reduce((s, m) => s + m.total_calories, 0);

  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="meals-title">
      <div className="flex items-baseline justify-between">
        <h3 id="meals-title" className="text-lg font-bold text-white">
          Meals
        </h3>
        <span className="text-sm text-slate-400 tabular-nums">{total.toLocaleString()} kcal</span>
      </div>

      <div className="mt-3 divide-y divide-slate-800">
        {SECTIONS.map(({ type, title, icon: Icon, tint }) => {
          const logged = meals.filter((m) => m.mealType === type);
          const kcal = logged.reduce((s, m) => s + m.total_calories, 0);
          return (
            <div key={type} className="py-3.5">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {logged.length ? `${kcal.toLocaleString()} kcal` : 'Nothing logged'}
                  </p>
                </div>
                <button
                  onClick={() => onOpenPlateScannerForType(type)}
                  aria-label={`Add ${title.toLowerCase()}`}
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {logged.map((meal) => (
                  <motion.div
                    key={meal.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 ml-[52px] rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex gap-3">
                      {meal.image_url ? (
                        <img
                          src={meal.image_url}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-800"
                          loading="lazy"
                          onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                        />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm font-semibold text-white leading-snug line-clamp-2">{meal.meal_name}</p>
                          {meal.source === 'sample' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">Quick pick</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400 tabular-nums">
                          <span className="font-semibold text-white">{meal.total_calories} kcal</span> · P{' '}
                          {Math.round(meal.total_macros.protein_g)} · C {Math.round(meal.total_macros.carbs_g)} · F{' '}
                          {Math.round(meal.total_macros.fat_g)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {onAskCoachAboutMeal && (
                          <button
                            onClick={() => onAskCoachAboutMeal(meal)}
                            aria-label={`Ask the coach about ${meal.meal_name}`}
                            className="w-9 h-9 rounded-lg text-purple-400 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          aria-label={`Delete ${meal.meal_name}`}
                          className="w-9 h-9 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
