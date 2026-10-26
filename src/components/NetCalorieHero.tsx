import React from 'react';
import { Flame, Utensils, Footprints, Target, ArrowUpRight, TrendingDown, Sparkles, Plus } from 'lucide-react';
import { UserProfile } from '../types';
import { calculateTargetCalories, calculateMacroTargets, calculateTDEE } from '../utils/healthCalculations';

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
  const dailyTarget = calculateTargetCalories(profile);
  const tdee = calculateTDEE(profile);
  const macroTargets = calculateMacroTargets(profile, dailyTarget);

  // Net Calorie Formula:
  // Remaining = Daily Goal - Consumed + Burned
  const remainingCalories = dailyTarget - caloriesConsumed + caloriesBurned;
  const isOverBudget = remainingCalories < 0;

  // Percentage of daily budget utilized
  const netEnergyConsumed = Math.max(0, caloriesConsumed - caloriesBurned);
  const budgetProgressPct = Math.min(100, Math.round((netEnergyConsumed / dailyTarget) * 100));

  // Macro percentages
  const proteinPct = Math.min(100, Math.round((proteinConsumed / macroTargets.protein_g) * 100));
  const carbsPct = Math.min(100, Math.round((carbsConsumed / macroTargets.carbs_g) * 100));
  const fatPct = Math.min(100, Math.round((fatConsumed / macroTargets.fat_g) * 100));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 lg:p-7 shadow-xl shadow-black/40 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner with Formula & Goal badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-400">
              Module C &bull; Net Caloric Balance
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {profile.goal === 'lose_weight'
                ? 'Fat Loss Target'
                : profile.goal === 'gain_muscle'
                ? 'Muscle Build Surplus'
                : 'Maintenance'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Daily Energy &amp; Nutrient Balance
            </h2>
          </div>
        </div>

        {/* Live Mathematical Formula Pill */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs text-slate-300 self-start sm:self-auto shadow-inner">
          <span className="text-slate-400 font-mono">Formula:</span>
          <span className="font-semibold text-emerald-300">Remaining</span>
          <span className="text-slate-500">=</span>
          <span className="font-medium text-slate-300">Goal ({dailyTarget})</span>
          <span className="text-slate-500">-</span>
          <span className="font-medium text-amber-300">Food ({caloriesConsumed})</span>
          <span className="text-slate-500">+</span>
          <span className="font-medium text-cyan-300">Steps (+{caloriesBurned})</span>
        </div>
      </div>

      {/* Main Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
        {/* Left Column: Big Remaining Calories Gauge */}
        <div className="md:col-span-5 flex flex-col justify-between bg-slate-950/50 rounded-2xl p-5 border border-slate-800/80">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase tracking-wider font-semibold">Net Remaining Budget</span>
              <span className="text-slate-500 font-medium">BMR: {Math.round(dailyTarget * 0.75)} kcal</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl sm:text-5xl font-black tracking-tight ${
                  isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {Math.abs(remainingCalories).toLocaleString()}
              </span>
              <span className="text-base sm:text-lg font-semibold text-slate-400">
                {isOverBudget ? 'kcal over limit' : 'kcal remaining'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {isOverBudget
                ? 'You have exceeded your net caloric ceiling for today. Extra steps will help offset the surplus!'
                : `You have room for about ${Math.round(remainingCalories)} kcal of nutritious fuel today.`}
            </p>
          </div>

          {/* Calorie Progress Ring / Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Net Intake vs Goal</span>
              <span className={budgetProgressPct > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                {budgetProgressPct}% used
              </span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
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

          {/* Quick buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={onOpenPlateScanner}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>+ Log Food Plate</span>
            </button>
            <button
              onClick={onOpenStepModal}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>+ Add / Sync Steps</span>
            </button>
          </div>
        </div>

        {/* Right Column: 3 Stat Cards (Goal, Consumed, Burned) + Macro Visualizer */}
        <div className="md:col-span-7 flex flex-col justify-between gap-4">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Daily Target */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium truncate">Daily Goal</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {dailyTarget.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">TDEE {tdee} kcal</span>
            </div>

            {/* Consumed */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                <Utensils className="w-3.5 h-3.5" />
                <span className="font-medium truncate">Food Eaten</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-300 tracking-tight">
                {caloriesConsumed.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">kcal intake</span>
            </div>

            {/* Burned */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-medium truncate">Steps Burned</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-cyan-300 tracking-tight">
                +{caloriesBurned}
              </div>
              <span className="text-[11px] text-slate-500">{steps.toLocaleString()} steps</span>
            </div>
          </div>

          {/* Daily Macro Visualizer */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Daily Macro Visualizer
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Fiber: <strong className="text-slate-200">{fiberConsumed}g</strong> / 30g
              </span>
            </div>

            {/* Protein Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Protein
                </span>
                <span className="text-slate-300 font-medium">
                  <strong>{proteinConsumed}g</strong> / {macroTargets.protein_g}g
                  <span className="text-slate-500 ml-1.5">({Math.max(0, macroTargets.protein_g - proteinConsumed)}g left)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
            </div>

            {/* Carbs Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Carbohydrates
                </span>
                <span className="text-slate-300 font-medium">
                  <strong>{carbsConsumed}g</strong> / {macroTargets.carbs_g}g
                  <span className="text-slate-500 ml-1.5">({Math.max(0, macroTargets.carbs_g - carbsConsumed)}g left)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
            </div>

            {/* Fat Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-sky-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Healthy Fats
                </span>
                <span className="text-slate-300 font-medium">
                  <strong>{fatConsumed}g</strong> / {macroTargets.fat_g}g
                  <span className="text-slate-500 ml-1.5">({Math.max(0, macroTargets.fat_g - fatConsumed)}g left)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
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
