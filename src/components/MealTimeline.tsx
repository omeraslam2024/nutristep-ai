import React from 'react';
import { Utensils, Clock, Trash2, Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { LoggedMeal, MealType } from '../types';

interface MealTimelineProps {
  meals: LoggedMeal[];
  onOpenPlateScannerForType: (type: MealType) => void;
  onDeleteMeal: (mealId: string) => void;
  onAskCoachAboutMeal?: (meal: LoggedMeal) => void;
}

export const MealTimeline: React.FC<MealTimelineProps> = ({
  meals,
  onOpenPlateScannerForType,
  onDeleteMeal,
  onAskCoachAboutMeal,
}) => {
  const mealSections: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 lg:p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-amber-400">
            Nutrition Journal &bull; Today&apos;s Plates
          </span>
          <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
            Meals &amp; Nutritional Log
          </h3>
        </div>

        <button
          onClick={() => onOpenPlateScannerForType('Snack')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Log</span>
        </button>
      </div>

      {/* Sections for each meal type */}
      <div className="space-y-4">
        {mealSections.map((sectionType) => {
          const sectionMeals = meals.filter((m) => m.mealType === sectionType);
          const sectionCals = sectionMeals.reduce((s, m) => s + m.total_calories, 0);

          return (
            <div
              key={sectionType}
              className="bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{sectionType}</h4>
                    <span className="text-[11px] text-slate-400">
                      {sectionMeals.length} {sectionMeals.length === 1 ? 'dish' : 'dishes'} &bull;{' '}
                      <strong className="text-amber-300">{sectionCals} kcal</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenPlateScannerForType(sectionType)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add {sectionType}</span>
                </button>
              </div>

              {/* Meals List */}
              <div className="p-3 space-y-2.5">
                {sectionMeals.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No plate logged for {sectionType} yet. Click &ldquo;Add {sectionType}&rdquo; to snap a photo or use a sample!
                  </div>
                ) : (
                  sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {meal.image_url ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                            <img
                              src={meal.image_url}
                              alt={meal.meal_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            <Utensils className="w-5 h-5 text-slate-500" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white">{meal.meal_name}</h5>
                            {meal.confidence_score && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {Math.round(meal.confidence_score * 100)}% AI Match
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                            <span className="font-bold text-amber-300">
                              {meal.total_calories} kcal
                            </span>
                            <span>P: <strong className="text-rose-300">{meal.total_macros.protein_g}g</strong></span>
                            <span>C: <strong className="text-amber-300">{meal.total_macros.carbs_g}g</strong></span>
                            <span>F: <strong className="text-sky-300">{meal.total_macros.fat_g}g</strong></span>
                            {meal.total_macros.fiber_g > 0 && (
                              <span>Fib: <strong className="text-emerald-300">{meal.total_macros.fiber_g}g</strong></span>
                            )}
                          </div>

                          {/* Items breakdown pill list */}
                          {meal.detected_items && meal.detected_items.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {meal.detected_items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium"
                                >
                                  {it.item_name} ({it.estimated_weight_g}g)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {onAskCoachAboutMeal && (
                          <button
                            onClick={() => onAskCoachAboutMeal(meal)}
                            className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-purple-950/40 text-xs font-semibold border border-transparent hover:border-purple-500/30 transition-all cursor-pointer"
                            title="Ask AI Coach for recommendations about this meal"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="hidden sm:inline">Ask Coach</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete meal entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
