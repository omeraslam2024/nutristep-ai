import React, { useState, useEffect, useRef } from 'react';
import {
  Footprints,
  Flame,
  Play,
  Pause,
  Compass,
  Clock,
  Award,
  Zap,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, HourlyStep } from '../types';
import { calculateStepMetrics } from '../utils/healthCalculations';
import { speakText, stopSpeaking } from '../utils/speechHelper';
import type { usePedometer } from '../utils/pedometer/usePedometer';

interface StepMovementTrackerProps {
  profile: UserProfile;
  currentSteps: number;
  hourlySteps: HourlyStep[];
  onAddSteps: (delta: number) => void;
  pedometer: ReturnType<typeof usePedometer>;
  compact?: boolean;
  onBackToHome?: () => void;
}

export const StepMovementTracker: React.FC<StepMovementTrackerProps> = ({
  profile,
  currentSteps,
  onAddSteps,
  pedometer,
  onBackToHome,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Calculate metrics based on user's weight & height
  const metrics = calculateStepMetrics(currentSteps, profile.weightKg, profile.heightCm);
  const stepGoal = profile.stepGoal || 10000;
  const progressPct = Math.min(100, Math.round((currentSteps / stepGoal) * 100));
  const isGoalReached = currentSteps >= stepGoal;
  const stepsRemaining = Math.max(0, stepGoal - currentSteps);

  // Celebrate the moment the goal is crossed, however the steps arrived.
  const prevStepsRef = useRef(currentSteps);
  useEffect(() => {
    if (prevStepsRef.current < stepGoal && currentSteps >= stepGoal) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#06b6d4', '#10b981', '#3b82f6'] });
    }
    prevStepsRef.current = currentSteps;
  }, [currentSteps, stepGoal]);

  const sensorLabel =
    pedometer.status === 'active'
      ? pedometer.mode === 'hardware'
        ? 'Counting all day'
        : 'Counting while app is open'
      : pedometer.status === 'denied'
      ? 'Permission needed'
      : pedometer.status === 'unsupported'
      ? 'Not available'
      : pedometer.status === 'starting'
      ? 'Starting…'
      : 'Off';

  const handleSpeakSteps = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      let speech = '';
      if (isGoalReached) {
        speech = `Congratulations! You reached your goal of ${stepGoal.toLocaleString()} steps! You have taken ${currentSteps.toLocaleString()} steps and burned ${metrics.caloriesBurned} calories. Fantastic work!`;
      } else {
        speech = `You have taken ${currentSteps.toLocaleString()} steps today. You need ${stepsRemaining.toLocaleString()} more steps to reach your goal. Tap Start Walking or take a healthy stroll!`;
      }

      speakText(speech);
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-7 space-y-6 shadow-2xl max-w-full overflow-hidden">
      {/* Universal Navigation / Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 min-h-[48px] min-w-[48px] justify-center"
              title="Return to Home Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-400" />
              <span className="text-xs sm:text-sm font-black hidden xs:inline">Home</span>
            </button>
          )}

          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/20 border-2 border-cyan-500/30 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shrink-0">
            👟
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm uppercase tracking-wider font-black text-cyan-400">
                Pedometer &amp; Movement
              </span>
              {isGoalReached && (
                <span className="text-xs font-black px-2 py-0.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Done!
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Daily Movement &amp; Steps
            </h3>
          </div>
        </div>

        {/* Read Out Loud Button */}
        <button
          type="button"
          onClick={handleSpeakSteps}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer shadow-md min-h-[48px] ${
            isSpeaking
              ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse'
              : 'bg-cyan-600/30 hover:bg-cyan-600/40 border-cyan-400/50 text-cyan-200'
          }`}
          title="Hear your step progress aloud"
        >
          {isSpeaking ? (
            <VolumeX className="w-5 h-5 text-rose-300 animate-spin" />
          ) : (
            <Volume2 className="w-5 h-5 text-cyan-300 stroke-[3]" />
          )}
          <span>{isSpeaking ? 'Stop Voice' : '🔊 Hear Steps'}</span>
        </button>
      </div>

      {/* Main Stats Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left: Responsive Step Display */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-3xl p-5 sm:p-6 border-2 border-cyan-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
          <Footprints className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />

          {/* Large Responsive Steps Number */}
          <div className="text-5xl sm:text-6xl font-black text-cyan-300 tracking-tight truncate max-w-full">
            {currentSteps.toLocaleString()}
          </div>
          <span className="text-sm sm:text-base font-extrabold text-slate-300 mt-1">
            Goal: {stepGoal.toLocaleString()} steps
          </span>

          {/* Big Progress Bar */}
          <div className="w-full mt-4 space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm font-black text-slate-300">
              <span>{isGoalReached ? '🎉 100% Completed' : `${stepsRemaining.toLocaleString()} steps left`}</span>
              <span className="text-cyan-400">{progressPct}%</span>
            </div>
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

        </div>

        {/* Right: Metrics Grid + Big Action Buttons */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* 3 Metric Cards - Fully Responsive Proportions */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Calories Burned */}
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-3 sm:p-4 text-center overflow-hidden">
              <span className="text-xl sm:text-2xl block mb-1">🔥</span>
              <div className="text-lg sm:text-2xl font-black text-cyan-300 truncate">
                {metrics.caloriesBurned}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 block truncate">kcal burned</span>
            </div>

            {/* Distance */}
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-3 sm:p-4 text-center overflow-hidden">
              <span className="text-xl sm:text-2xl block mb-1">📍</span>
              <div className="text-lg sm:text-2xl font-black text-white truncate">
                {profile.unitSystem === 'imperial'
                  ? `${metrics.distanceMiles} mi`
                  : `${metrics.distanceKm} km`}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 block truncate">Distance</span>
            </div>

            {/* Active Time */}
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-3 sm:p-4 text-center overflow-hidden">
              <span className="text-xl sm:text-2xl block mb-1">⏱️</span>
              <div className="text-lg sm:text-2xl font-black text-amber-300 truncate">
                {metrics.activeMinutes}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 block truncate">Minutes walk</span>
            </div>
          </div>

          {/* Quick Add Steps Buttons */}
          <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 block">
              Quick Log Steps:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((stepAmt) => (
                <button
                  key={stepAmt}
                  onClick={() => onAddSteps(stepAmt)}
                  className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-sm text-center min-h-[48px]"
                >
                  +{stepAmt.toLocaleString()} 👟
                </button>
              ))}
            </div>

            {/* Phone step counter */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" /> Phone step counter
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    pedometer.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : pedometer.status === 'denied'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {sensorLabel}
                </span>
              </div>

              {pedometer.status !== 'unsupported' && (
                <button
                  onClick={() => pedometer.setEnabled(!pedometer.enabled || pedometer.status === 'denied')}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md min-h-[48px] ${
                    pedometer.enabled && pedometer.status !== 'denied'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-2 border-cyan-500/50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>
                    {pedometer.status === 'denied'
                      ? 'Allow physical activity access'
                      : pedometer.enabled
                      ? 'Turn off step counting'
                      : 'Count my steps automatically'}
                  </span>
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center pt-1">
                {pedometer.status === 'denied'
                  ? 'If no prompt appears, allow "Physical activity" for NutriStep in Android Settings › Apps.'
                  : pedometer.mode === 'hardware'
                  ? "Uses your phone's built-in step sensor, which only counts real walking — even when the app is closed."
                  : 'Counts while this screen is open. A phone lying still, in a car or being handled does not add steps.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
