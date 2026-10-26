import React, { useState } from 'react';
import { Utensils, Trash2, Camera, Sparkles, Volume2, VolumeX, Plus } from 'lucide-react';
import { LoggedMeal, MealType } from '../types';
import { speakText, stopSpeaking } from '../utils/speechHelper';

interface MealTimelineProps {
  meals: LoggedMeal[];
  onOpenPlateScannerForType: (type: MealType) => void;
  onDeleteMeal: (mealId: string) => void;
  onAskCoachAboutMeal?: (meal: LoggedMeal) => void;
}

const MEAL_CONFIG: Record<
  MealType,
  { emoji: string; title: string; subtitle: string; bgGradient: string; iconBg: string }
> = {
  Breakfast: {
    emoji: '🍳',
    title: 'Breakfast',
    subtitle: 'Morning Fuel & Eggs',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-900',
    iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  Lunch: {
    emoji: '🥗',
    title: 'Lunch',
    subtitle: 'Midday Power Plate',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-900',
    iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  Dinner: {
    emoji: '🍲',
    title: 'Dinner',
    subtitle: 'Evening Warm Meal',
    bgGradient: 'from-indigo-950/40 via-slate-900 to-slate-900',
    iconBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  Snack: {
    emoji: '🍎',
    title: 'Snacks',
    subtitle: 'Fruits & Quick Bites',
    bgGradient: 'from-rose-950/40 via-slate-900 to-slate-900',
    iconBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
};

export const MealTimeline: React.FC<MealTimelineProps> = ({
  meals,
  onOpenPlateScannerForType,
  onDeleteMeal,
  onAskCoachAboutMeal,
}) => {
  const mealSections: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const [playingMealId, setPlayingMealId] = useState<string | null>(null);

  const handleSpeakMeal = (meal: LoggedMeal) => {
    if (playingMealId === meal.id) {
      stopSpeaking();
      setPlayingMealId(null);
    } else {
      const text = `${meal.mealType}: ${meal.meal_name}. ${meal.total_calories} calories. ${
        meal.total_macros.protein_g
      } grams of protein.`;
      speakText(text);
      setPlayingMealId(meal.id);
      setTimeout(() => setPlayingMealId(null), 6000);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
            🍽️
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Today&apos;s Food Plates
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-bold">
              Photos &amp; Meals Logged Today
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenPlateScannerForType('Snack')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/40 text-emerald-200 font-black text-sm transition-all active:scale-95 cursor-pointer shadow-md"
        >
          <Camera className="w-4 h-4 stroke-[3]" />
          <span>+ Add Food</span>
        </button>
      </div>

      {/* Sections for each meal type */}
      <div className="space-y-5">
        {mealSections.map((sectionType) => {
          const cfg = MEAL_CONFIG[sectionType];
          const sectionMeals = meals.filter((m) => m.mealType === sectionType);
          const sectionCals = sectionMeals.reduce((s, m) => s + m.total_calories, 0);

          return (
            <div
              key={sectionType}
              className={`bg-gradient-to-r ${cfg.bgGradient} border-2 border-slate-800 rounded-3xl overflow-hidden shadow-lg`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-2xl shrink-0 shadow-md ${cfg.iconBg}`}
                  >
                    {cfg.emoji}
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{cfg.title}</span>
                      {sectionMeals.length > 0 && (
                        <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {sectionCals} kcal
                        </span>
                      )}
                    </h4>
                    <span className="text-xs sm:text-sm text-slate-400 font-semibold">
                      {sectionMeals.length === 0
                        ? cfg.subtitle
                        : `${sectionMeals.length} plate${sectionMeals.length === 1 ? '' : 's'} logged`}
                    </span>
                  </div>
                </div>

                {/* Big Button to Snap Food */}
                <button
                  onClick={() => onOpenPlateScannerForType(sectionType)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Snap {cfg.title}</span>
                </button>
              </div>

              {/* Meals List */}
              <div className="p-4 space-y-3">
                {sectionMeals.length === 0 ? (
                  <div
                    onClick={() => onOpenPlateScannerForType(sectionType)}
                    className="py-6 px-4 text-center rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/40 cursor-pointer transition-colors group"
                  >
                    <span className="text-3xl block mb-1.5 group-hover:scale-110 transition-transform">
                      {cfg.emoji}
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-300 group-hover:text-emerald-300">
                      Tap here to take photo of your {cfg.title}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Point camera at your plate or choose a sample meal
                    </span>
                  </div>
                ) : (
                  sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="bg-slate-950/90 border-2 border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Big Food Thumbnail */}
                        {meal.image_url ? (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 shrink-0 shadow-md">
                            <img
                              src={meal.image_url}
                              alt={meal.meal_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl shrink-0">
                            {cfg.emoji}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-base sm:text-lg font-black text-white leading-tight">
                              {meal.meal_name}
                            </h5>
                            {meal.confidence_score && (
                              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✓ AI Match
                              </span>
                            )}
                          </div>

                          {/* Giant Calorie and Macro Labels */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm font-bold text-slate-300 mt-1.5">
                            <span className="text-lg font-black text-amber-300">
                              🔥 {meal.total_calories} kcal
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              🥩 {meal.total_macros.protein_g}g Protein
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              🍞 {meal.total_macros.carbs_g}g Carbs
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              🥑 {meal.total_macros.fat_g}g Fat
                            </span>
                          </div>

                          {/* Food Ingredients Chips */}
                          {meal.detected_items && meal.detected_items.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {meal.detected_items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                                >
                                  {it.item_name} ({it.estimated_weight_g}g)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Audio Speak Button on Each Meal */}
                        <button
                          type="button"
                          onClick={() => handleSpeakMeal(meal)}
                          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                            playingMealId === meal.id
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                              : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
                          }`}
                          title="Read this meal out loud"
                        >
                          {playingMealId === meal.id ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5 stroke-[2.5]" />
                          )}
                        </button>

                        {/* Coach Tip Button */}
                        {onAskCoachAboutMeal && (
                          <button
                            onClick={() => onAskCoachAboutMeal(meal)}
                            className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border-2 border-purple-500/40 text-purple-300 transition-all cursor-pointer"
                            title="Ask Coach about this meal"
                          >
                            <Sparkles className="w-5 h-5" />
                          </button>
                        )}

                        {/* Delete Meal Button */}
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                          title="Delete meal entry"
                        >
                          <Trash2 className="w-5 h-5" />
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
