import React, { useState } from 'react';
import { Flame, Check, X, Footprints, Utensils, Target, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { StreakInfo } from '../utils/healthCalculations';
import { UserProfile } from '../types';
import { speakText, stopSpeaking } from '../utils/speechHelper';

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
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  if (!isOpen) return null;

  const stepGoal = profile.stepGoal || 10000;
  const stepsRemaining = Math.max(0, stepGoal - todaySteps);

  const handleSpeakStreak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const text = `You are on a ${streakInfo.currentStreak} day consistency streak! You have completed ${todaySteps} steps out of your ${stepGoal} step goal, and eaten ${todayCalories} calories. Keep the fire burning!`;
      speakText(text);
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 7000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 2.75rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] max-w-lg w-full shadow-lg overflow-hidden flex flex-col my-auto max-h-full">
        {/* Header Hero Gradient */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1 min-h-[48px] min-w-[48px] justify-center shrink-0"
                title="Back to Home Dashboard"
              >
                <span className="text-emerald-400 font-bold text-sm">← Back</span>
              </button>

              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 truncate">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                Streak Details
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSpeakStreak}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                title="Hear streak status"
              >
                {isSpeaking ? <VolumeX className="w-5 h-5 animate-spin text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                title="Close Streak Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Huge Graphical Streak Display */}
          <div className="mt-5 flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-[1.5rem] bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center">
                <Flame className="w-9 h-9 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-2xl font-bold text-white">{streakInfo.currentStreak}d</span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {streakInfo.currentStreak} Days
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {streakInfo.motivationalBadge.title}
                </span>
              </div>
              <p className="text-sm text-slate-300 font-bold mt-1">
                Hitting <strong className="text-white">both</strong> daily steps and calorie targets.
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-semibold">
                <span>Personal Best: <strong className="text-emerald-300">{streakInfo.longestStreak} days</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Today's Goals Checklist */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Today&apos;s 2 Goals
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                  streakInfo.isTodayComplete
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {streakInfo.isTodayComplete ? 'Streak Extended ✓' : 'In Progress Today'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Step Goal Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                      streakInfo.todayStepsMet
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    👟
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Step Goal</span>
                    <span className="text-xs font-bold text-slate-300">
                      {todaySteps.toLocaleString()} / {stepGoal.toLocaleString()} steps
                    </span>
                  </div>
                </div>
                {streakInfo.todayStepsMet ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    <Check className="w-4 h-4 stroke-[3]" /> Done
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    {stepsRemaining.toLocaleString()} left
                  </span>
                )}
              </div>

              {/* Calorie Goal Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                      streakInfo.todayCalMet
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    🍽️
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Calorie Target</span>
                    <span className="text-xs font-bold text-slate-300">
                      {todayCalories.toLocaleString()} / {targetCalories.toLocaleString()} kcal
                    </span>
                  </div>
                </div>
                {streakInfo.todayCalMet ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    <Check className="w-4 h-4 stroke-[3]" /> On Track
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    {Math.abs(targetCalories - todayCalories)} kcal {todayCalories < targetCalories ? 'remaining' : 'over'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Past 7-Day Visual Tracker */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Last 7 Days Flame Record
            </span>

            <div className="grid grid-cols-7 gap-2 text-center">
              {streakInfo.past7Days.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    day.isToday
                      ? 'border-cyan-500/60 bg-slate-800 ring-2 ring-cyan-500/40'
                      : day.bothMet
                      ? 'border-amber-500/40 bg-amber-500/15'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-300">{day.dayShort}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm">
                    {day.bothMet ? (
                      <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ) : day.isToday ? (
                      '•'
                    ) : (
                      '✕'
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {Math.round(day.steps / 1000)}k
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Award Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/30 flex items-center gap-4">
            <div className="text-3xl p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 shrink-0">
              {streakInfo.motivationalBadge.icon}
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">{streakInfo.motivationalBadge.title}</h5>
              <p className="text-xs text-slate-300 font-bold mt-0.5">{streakInfo.motivationalBadge.description}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          {onOpenCoach ? (
            <button
              onClick={() => {
                onClose();
                onOpenCoach();
              }}
              className="flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Coach for Advice</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
