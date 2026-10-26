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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, HourlyStep } from '../types';
import { calculateStepMetrics } from '../utils/healthCalculations';
import { speakText, stopSpeaking } from '../utils/speechHelper';

interface StepMovementTrackerProps {
  profile: UserProfile;
  currentSteps: number;
  hourlySteps: HourlyStep[];
  onUpdateSteps: (newSteps: number, addedHourly?: { hour: number; steps: number }) => void;
  onClose?: () => void;
}

export const StepMovementTracker: React.FC<StepMovementTrackerProps> = ({
  profile,
  currentSteps,
  hourlySteps,
  onUpdateSteps,
  onClose,
}) => {
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [sensorStatus, setSensorStatus] = useState<string>('Ready');
  const [workoutSeconds, setWorkoutSeconds] = useState<number>(0);
  const [sessionStepsGained, setSessionStepsGained] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Simulation timer ref
  const walkIntervalRef = useRef<any>(null);

  // Calculate metrics based on user's weight & height
  const metrics = calculateStepMetrics(currentSteps, profile.weightKg, profile.heightCm);
  const stepGoal = profile.stepGoal || 10000;
  const progressPct = Math.min(100, Math.round((currentSteps / stepGoal) * 100));
  const isGoalReached = currentSteps >= stepGoal;
  const stepsRemaining = Math.max(0, stepGoal - currentSteps);

  // Active workout stopwatch timer
  useEffect(() => {
    let timer: any = null;
    if (isSimulatingWalk || isSensorActive) {
      timer = setInterval(() => {
        setWorkoutSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setWorkoutSeconds(0);
      setSessionStepsGained(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulatingWalk, isSensorActive]);

  // Real-time walking simulator
  useEffect(() => {
    if (isSimulatingWalk) {
      walkIntervalRef.current = setInterval(() => {
        const delta = Math.floor(Math.random() * 5) + 12;
        setSessionStepsGained((prev) => prev + delta);
        const currentHour = new Date().getHours();
        onUpdateSteps(currentSteps + delta, { hour: currentHour, steps: delta });
      }, 1500);
    } else {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    }
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, [isSimulatingWalk, currentSteps, onUpdateSteps]);

  // Accelerometer movement detection for mobile
  useEffect(() => {
    if (!isSensorActive) return;

    let lastAccelMagnitude = 0;
    let lastStepTime = 0;
    const threshold = 11.5;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) {
        setSensorStatus('No sensor detected on device');
        return;
      }

      const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const now = Date.now();

      if (magnitude > threshold && lastAccelMagnitude <= threshold && now - lastStepTime > 320) {
        lastStepTime = now;
        const currentHour = new Date().getHours();
        onUpdateSteps(currentSteps + 1, { hour: currentHour, steps: 1 });
        setSessionStepsGained((prev) => prev + 1);
        setSensorStatus('Live Pedometer Walking');
      }
      lastAccelMagnitude = magnitude;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isSensorActive, currentSteps, onUpdateSteps]);

  const handleManualAdd = (stepsToAdd: number) => {
    const newTotal = currentSteps + stepsToAdd;
    const currentHour = new Date().getHours();
    onUpdateSteps(newTotal, { hour: currentHour, steps: stepsToAdd });

    if (newTotal >= stepGoal && currentSteps < stepGoal) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'],
      });
    }
  };

  const handleSpeakSteps = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      let speech = '';
      if (isGoalReached) {
        speech = `Congratulations! You reached your goal of ${stepGoal.toLocaleString()} steps! You have taken ${currentSteps.toLocaleString()} steps and burned ${metrics.caloriesBurned} calories. Fantastic work!`;
      } else {
        speech = `You have taken ${currentSteps.toLocaleString()} steps today. You need ${stepsRemaining.toLocaleString()} more steps to reach your goal. Tap the Start Walk button or take a stroll!`;
      }

      speakText(speech);
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border-2 border-cyan-500/30 flex items-center justify-center text-3xl shadow-lg shrink-0">
            👟
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm uppercase tracking-wider font-black text-cyan-400">
                Step Counter
              </span>
              {isGoalReached && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Goal Reached! 🎉
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Daily Movement &amp; Steps
            </h3>
          </div>
        </div>

        {/* Read Out Loud Button */}
        <button
          type="button"
          onClick={handleSpeakSteps}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm sm:text-base font-black transition-all active:scale-95 cursor-pointer shadow-md ${
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: GIANT Step Display */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-3xl p-6 border-2 border-cyan-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
          <Footprints className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />

          {/* Huge Number */}
          <div className="text-6xl sm:text-7xl font-black text-cyan-300 tracking-tighter">
            {currentSteps.toLocaleString()}
          </div>
          <span className="text-base sm:text-lg font-extrabold text-slate-300 mt-1">
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
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Calories Burned */}
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">🔥</span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300">
                {metrics.caloriesBurned}
              </div>
              <span className="text-xs font-bold text-slate-400">kcal burned</span>
            </div>

            {/* Distance */}
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">📍</span>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {profile.unitSystem === 'imperial'
                  ? `${metrics.distanceMiles} mi`
                  : `${metrics.distanceKm} km`}
              </div>
              <span className="text-xs font-bold text-slate-400">Distance</span>
            </div>

            {/* Active Time */}
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">⏱️</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                {metrics.activeMinutes}
              </div>
              <span className="text-xs font-bold text-slate-400">Minutes walk</span>
            </div>
          </div>

          {/* Big Quick Add Steps Buttons */}
          <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-sm font-black uppercase tracking-wider text-slate-200 block">
              1-Tap Add Steps:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((stepAmt) => (
                <button
                  key={stepAmt}
                  onClick={() => handleManualAdd(stepAmt)}
                  className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white font-black text-sm sm:text-base transition-all cursor-pointer shadow-sm text-center"
                >
                  +{stepAmt.toLocaleString()} 👟
                </button>
              ))}
            </div>

            {/* Walk Simulator / Sensor Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-md ${
                  isSimulatingWalk
                    ? 'bg-rose-500/30 text-rose-300 border-2 border-rose-500 animate-pulse'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500/40'
                }`}
              >
                {isSimulatingWalk ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-emerald-300" />}
                <span>{isSimulatingWalk ? 'Pause Walking' : '🚶 Start Walking Now'}</span>
              </button>

              <button
                onClick={() => setIsSensorActive(!isSensorActive)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer shadow-md ${
                  isSensorActive
                    ? 'bg-cyan-500/30 text-cyan-300 border-2 border-cyan-500 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <span>{isSensorActive ? '📱 Pedometer Active' : '📱 Turn On Phone Sensor'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
