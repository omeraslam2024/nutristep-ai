import React, { useState } from 'react';
import { Flame, Utensils, Footprints, Target, Volume2, VolumeX, CheckCircle2, AlertTriangle, Sparkles, Camera } from 'lucide-react';
import { UserProfile } from '../types';
import { calculateTargetCalories, calculateMacroTargets } from '../utils/healthCalculations';
import { speakText, stopSpeaking } from '../utils/speechHelper';

interface NetCalorieHeroProps {
  profile: UserProfile;
  caloriesConsumed: number;
  caloriesBurned: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  fiberConsumed: number;
  steps: number;
  onOpenPlateScanner: () => void;
  onOpenStepModal: () => void;
}

export const NetCalorieHero: React.FC<NetCalorieHeroProps> = ({
  profile,
  caloriesConsumed,
  caloriesBurned,
  proteinConsumed,
  carbsConsumed,
  fatConsumed,
  fiberConsumed,
  steps,
  onOpenPlateScanner,
  onOpenStepModal,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const dailyTarget = calculateTargetCalories(profile);
  const macroTargets = calculateMacroTargets(profile, dailyTarget);

  // Net Calorie Formula: Remaining = Daily Goal - Consumed + Burned
  const remainingCalories = dailyTarget - caloriesConsumed + caloriesBurned;
  const isOverBudget = remainingCalories < 0;

  // Percentage of daily budget utilized
  const netEnergyConsumed = Math.max(0, caloriesConsumed - caloriesBurned);
  const budgetProgressPct = Math.min(100, Math.round((netEnergyConsumed / dailyTarget) * 100));

  // Macro percentages
  const proteinPct = Math.min(100, Math.round((proteinConsumed / macroTargets.protein_g) * 100));
  const carbsPct = Math.min(100, Math.round((carbsConsumed / macroTargets.carbs_g) * 100));
  const fatPct = Math.min(100, Math.round((fatConsumed / macroTargets.fat_g) * 100));

  const handleSpeakStatus = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      let speech = '';
      if (isOverBudget) {
        speech = `Attention. You have exceeded your calorie limit by ${Math.abs(
          remainingCalories
        )} calories. You have walked ${steps} steps today. Taking a short walk will help burn off extra energy!`;
      } else {
        speech = `Great job! You have ${Math.round(
          remainingCalories
        )} calories left to eat today. You have taken ${steps} steps and burned ${caloriesBurned} calories. Tap the green camera button to scan your next plate!`;
      }

      const ok = speakText(speech);
      if (ok) {
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 9000);
      }
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Visual Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Large Graphical Status Bar (Traffic Light colors for low literacy) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 ${
              isOverBudget
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isOverBudget ? '⚠️' : '👍'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm sm:text-base font-black uppercase tracking-wider px-3 py-1 rounded-xl ${
                  isOverBudget
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isOverBudget ? 'Limit Reached' : 'On Track'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                {profile.goal === 'lose_weight' ? '🔥 Fat Loss Goal' : '⚡ Fitness Goal'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {isOverBudget ? 'Calorie Ceiling Reached' : 'Good Nutrition Balance'}
            </h2>
          </div>
        </div>

        {/* Big Audio Readout Button */}
        <button
          type="button"
          onClick={handleSpeakStatus}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm sm:text-base font-black transition-all active:scale-95 cursor-pointer shadow-lg ${
            isSpeaking
              ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse'
              : 'bg-indigo-600/30 hover:bg-indigo-600/40 border-indigo-400/50 text-indigo-200'
          }`}
          title="Listen to your daily nutrition readout"
        >
          {isSpeaking ? (
            <VolumeX className="w-5 h-5 text-rose-300 animate-spin" />
          ) : (
            <Volume2 className="w-5 h-5 text-indigo-300 stroke-[3]" />
          )}
          <span>{isSpeaking ? 'Stop Voice' : '🔊 Hear Summary'}</span>
        </button>
      </div>

      {/* Main High-Impact Calorie Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left Column: GIANT CALORIE METER */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/80 rounded-3xl p-6 border-2 border-slate-800">
          <div>
            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              {isOverBudget ? '⚠️ Over Limit Today' : '🍽️ Calories Left to Eat'}
            </span>

            {/* Giant Numbers with High Contrast */}
            <div className="flex items-baseline gap-3 my-2">
              <span
                className={`text-6xl sm:text-7xl font-black tracking-tighter ${
                  isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {Math.abs(remainingCalories).toLocaleString()}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-300">
                kcal
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-slate-300 mt-2 leading-relaxed">
              {isOverBudget
                ? 'You went over your calorie budget. Take more steps to burn active calories!'
                : `You can still eat about ${Math.round(remainingCalories)} calories of healthy food today.`}
            </p>
          </div>

          {/* Big Visual Progress Gauge Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm font-extrabold">
              <span className="text-slate-300">Intake Meter</span>
              <span className={budgetProgressPct > 100 ? 'text-rose-400' : 'text-emerald-300'}>
                {budgetProgressPct}% Used
              </span>
            </div>
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetProgressPct > 100
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                }`}
                style={{ width: `${Math.min(100, budgetProgressPct)}%` }}
              />
            </div>
          </div>

          {/* Giant 1-Tap Action Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onOpenPlateScanner}
              className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-5 h-5 text-slate-950 stroke-[3]" />
              <span>📸 Scan Food</span>
            </button>
            <button
              onClick={onOpenStepModal}
              className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-500/40 text-cyan-200 font-black text-sm sm:text-base shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Footprints className="w-5 h-5 text-cyan-400 stroke-[3]" />
              <span>👟 Add Steps</span>
            </button>
          </div>
        </div>

        {/* Right Column: 3 BIG PICTORIAL STAT CARDS + MACROS */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* 3 Large Graphical Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Daily Target */}
            <div className="bg-slate-950/80 border-2 border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-indigo-400 text-xs sm:text-sm font-black mb-1">
                <Target className="w-5 h-5 stroke-[2.5]" />
                <span>Daily Goal</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight my-1">
                {dailyTarget.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-slate-400">Target kcal</span>
            </div>

            {/* Consumed / Food Eaten */}
            <div className="bg-slate-950/80 border-2 border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-black mb-1">
                <Utensils className="w-5 h-5 stroke-[2.5]" />
                <span>Food Eaten</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight my-1">
                {caloriesConsumed.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-slate-400">Calories in</span>
            </div>

            {/* Steps Burned */}
            <div className="bg-slate-950/80 border-2 border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-cyan-400 text-xs sm:text-sm font-black mb-1">
                <Flame className="w-5 h-5 stroke-[2.5]" />
                <span>Steps Burned</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight my-1">
                +{caloriesBurned}
              </div>
              <span className="text-xs font-bold text-slate-400">{steps.toLocaleString()} steps</span>
            </div>
          </div>

          {/* Large Graphical Macro Nutrient Breakdown */}
          <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Key Nutrition Gauges
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-extrabold">
                🌾 Fiber: <strong className="text-white">{fiberConsumed}g</strong> / 30g
              </span>
            </div>

            {/* Protein - Big Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-extrabold">
                <span className="text-rose-300 flex items-center gap-1.5">
                  <span className="text-base">🥩</span> Protein (Muscle Building)
                </span>
                <span className="text-white">
                  <strong>{proteinConsumed}g</strong> / {macroTargets.protein_g}g
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </div>

            {/* Carbs - Big Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-extrabold">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <span className="text-base">🍞</span> Carbs (Daily Energy)
                </span>
                <span className="text-white">
                  <strong>{carbsConsumed}g</strong> / {macroTargets.carbs_g}g
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
            </div>

            {/* Fats - Big Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-extrabold">
                <span className="text-blue-300 flex items-center gap-1.5">
                  <span className="text-base">🥑</span> Healthy Fats
                </span>
                <span className="text-white">
                  <strong>{fatConsumed}g</strong> / {macroTargets.fat_g}g
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
