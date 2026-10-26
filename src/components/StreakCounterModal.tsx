import React from 'react';
import { Flame, Check, X, Trophy, Footprints, Utensils, Target, Sparkles, ChevronRight } from 'lucide-react';
import { StreakInfo, StreakDaySummary } from '../utils/healthCalculations';
import { UserProfile } from '../types';

interface StreakCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakInfo: StreakInfo;
  profile: UserProfile;
  todaySteps: number;
  todayCalories: number;
  targetCalories: number;
  onOpenCoach?: () => void;
}

export const StreakCounterModal: React.FC<StreakCounterModalProps> = ({
  isOpen,
  onClose,
  streakInfo,
  profile,
  todaySteps,
  todayCalories,
  targetCalories,
  onOpenCoach,
}) => {
  if (!isOpen) return null;

  const stepGoal = profile.stepGoal || 10000;
  const stepsRemaining = Math.max(0, stepGoal - todaySteps);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header Hero Gradient */}
        <div className="relative p-6 bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              Consistency Streak
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Large Streak Display */}
          <div className="mt-4 flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-xl shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center">
                <Flame className="w-8 h-8 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-xl font-black text-white">{streakInfo.currentStreak}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {streakInfo.currentStreak} Day{streakInfo.currentStreak === 1 ? '' : 's'}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {streakInfo.motivationalBadge.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Consecutive days hitting <strong className="text-white">both</strong> daily step and calorie goals.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>Personal Best: <strong className="text-emerald-300">{streakInfo.longestStreak} days</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Today's Goals Checklist */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Today&apos;s Dual Target Status
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  streakInfo.isTodayComplete
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {streakInfo.isTodayComplete ? 'Streak Extended ✓' : 'In Progress Today'}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Step Goal Row */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      streakInfo.todayStepsMet
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Daily Step Goal</span>
                    <span className="text-[11px] text-slate-400">
                      {todaySteps.toLocaleString()} / {stepGoal.toLocaleString()} steps
                    </span>
                  </div>
                </div>
                {streakInfo.todayStepsMet ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3 stroke-[3]" /> Met
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {stepsRemaining.toLocaleString()} steps left
                  </span>
                )}
              </div>

              {/* Calorie Goal Row */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      streakInfo.todayCalMet
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Daily Calorie Target</span>
                    <span className="text-[11px] text-slate-400">
                      {todayCalories.toLocaleString()} / {targetCalories.toLocaleString()} kcal
                    </span>
                  </div>
                </div>
                {streakInfo.todayCalMet ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <Check className="w-3 h-3 stroke-[3]" /> On Track
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {Math.abs(targetCalories - todayCalories)} kcal {todayCalories < targetCalories ? 'remaining' : 'over'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Past 7-Day Visual Tracker */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Last 7 Days Activity
            </span>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {streakInfo.past7Days.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    day.isToday
                      ? 'border-cyan-500/50 bg-slate-800/80 ring-1 ring-cyan-500/30'
                      : day.bothMet
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400">{day.dayShort}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      day.bothMet
                        ? 'bg-amber-500/20 text-amber-400'
                        : day.isToday
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {day.bothMet ? (
                      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ) : day.isToday ? (
                      '•'
                    ) : (
                      '✕'
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">
                    {Math.round(day.steps / 1000)}k
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Award Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 flex items-center gap-3">
            <div className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 shrink-0">
              {streakInfo.motivationalBadge.icon}
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">{streakInfo.motivationalBadge.title}</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">{streakInfo.motivationalBadge.description}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          {onOpenCoach ? (
            <button
              onClick={() => {
                onClose();
                onOpenCoach();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Coach for Streak Strategy</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
