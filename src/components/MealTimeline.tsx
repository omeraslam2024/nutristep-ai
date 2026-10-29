import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Apple, Coffee, Moon, Plus, Soup, Sparkles, Trash2 } from 'lucide-react';
import { LoggedMeal, MealType } from '../types';

interface MealTimelineProps {
  meals: LoggedMeal[];
  onOpenPlateScannerForType: (type: MealType) => void;
  onDeleteMeal: (mealId: string) => void;
  onAskCoachAboutMeal?: (meal: LoggedMeal) => void;
}

const SECTIONS: { type: MealType; title: string; icon: React.ElementType; tint: string }[] = [
  { type: 'Breakfast', title: 'Breakfast', icon: Coffee, tint: 'bg-peach text-coral-ink' },
  { type: 'Lunch', title: 'Lunch', icon: Soup, tint: 'bg-mint text-leaf-ink' },
  { type: 'Snack', title: 'Snack', icon: Apple, tint: 'bg-butter text-butter-ink' },
  { type: 'Dinner', title: 'Dinner', icon: Moon, tint: 'bg-lilac text-lilac-ink' },
];

export const MealTimeline: React.FC<MealTimelineProps> = ({
  meals,
  onOpenPlateScannerForType,
  onDeleteMeal,
  onAskCoachAboutMeal,
}) => {
  const total = meals.reduce((s, m) => s + m.total_calories, 0);

  return (
    <section className="surface p-5" aria-labelledby="meals-title">
      <div className="flex items-baseline justify-between">
        <h2 id="meals-title" className="font-display text-xl font-semibold text-ink">
          Today's meals
        </h2>
        <span className="num text-sm text-slate-400">{total.toLocaleString()} kcal</span>
      </div>

      <ul className="mt-3 space-y-1">
        {SECTIONS.map(({ type, title, icon: Icon, tint }) => {
          const logged = meals.filter((m) => m.mealType === type);
          if (!logged.length) {
            return (
              <li key={type} className="flex items-center gap-3 py-2">
                <span className="w-11 h-11 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block text-xs text-slate-400">Nothing logged yet</span>
                </span>
                <button
                  onClick={() => onOpenPlateScannerForType(type)}
                  aria-label={`Add ${title.toLowerCase()}`}
                  className="btn-primary px-4 h-9 rounded-full text-sm font-semibold active:scale-95 transition-transform cursor-pointer"
                >
                  Add
                </button>
              </li>
            );
          }
          return (
            <AnimatePresence key={type} initial={false}>
              {logged.map((meal) => (
                <motion.li
                  key={meal.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 py-2">
                    {meal.image_url ? (
                      <img
                        src={meal.image_url}
                        alt=""
                        loading="lazy"
                        className="w-11 h-11 rounded-2xl object-cover shrink-0 bg-slate-800"
                      />
                    ) : (
                      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tint}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-ink truncate">{meal.meal_name}</span>
                      <span className="block text-xs text-slate-400 truncate">
                        {title} · P {Math.round(meal.total_macros.protein_g)} · C {Math.round(meal.total_macros.carbs_g)} · F{' '}
                        {Math.round(meal.total_macros.fat_g)}
                        {meal.source === 'sample' ? ' · Quick pick' : ''}
                      </span>
                    </span>
                    <span className="num text-base font-semibold text-ink">{meal.total_calories}</span>
                    {onAskCoachAboutMeal && (
                      <button
                        onClick={() => onAskCoachAboutMeal(meal)}
                        aria-label={`Ask the coach about ${meal.meal_name}`}
                        className="w-9 h-9 rounded-full text-lilac-ink hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteMeal(meal.id)}
                      aria-label={`Delete ${meal.meal_name}`}
                      className="w-9 h-9 rounded-full text-slate-400 hover:text-coral-ink hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
              <li key={`${type}-more`} className="pl-14 -mt-1 mb-1">
                <button
                  onClick={() => onOpenPlateScannerForType(type)}
                  className="text-xs font-semibold text-coral-ink py-1 cursor-pointer"
                >
                  + Add more to {title.toLowerCase()}
                </button>
              </li>
            </AnimatePresence>
          );
        })}
      </ul>
    </section>
  );
};
