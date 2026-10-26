import React, { useState, useEffect, useRef } from 'react';
import {
  Footprints,
  Flame,
  Milestone,
  Play,
  Pause,
  Plus,
  Compass,
  Clock,
  Award,
  Zap,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, HourlyStep } from '../types';
import { calculateStepMetrics } from '../utils/healthCalculations';

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
  const [customAddSteps, setCustomAddSteps] = useState<number>(1000);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [sensorStatus, setSensorStatus] = useState<string>('Ready');

  // Simulation timer ref
  const walkIntervalRef = useRef<any>(null);

  // Calculate metrics based on user's weight & height
  const metrics = calculateStepMetrics(currentSteps, profile.weightKg, profile.heightCm);
  const stepGoal = profile.stepGoal || 10000;
  const progressPct = Math.min(100, Math.round((currentSteps / stepGoal) * 100));
  const isGoalReached = currentSteps >= stepGoal;

  // Real-time walking simulator
  useEffect(() => {
    if (isSimulatingWalk) {
      walkIntervalRef.current = setInterval(() => {
        // ~10-14 steps every 2 seconds simulating brisk walk (100-110 steps/min)
        const delta = Math.floor(Math.random() * 5) + 10;
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

  // Real device motion accelerometer step detection algorithm
  useEffect(() => {
    if (!isSensorActive) return;

    let lastAccelMagnitude = 0;
    let lastStepTime = 0;
    const threshold = 11.5; // Acceleration peak threshold for human walking (~1.2g)

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) {
        setSensorStatus('No accelerometer sensor detected on this device');
        return;
      }

      const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const now = Date.now();

      // Peak detection with minimum refractory period of 300ms (max 3.3 steps/sec)
      if (magnitude > threshold && lastAccelMagnitude <= threshold && now - lastStepTime > 320) {
        lastStepTime = now;
        const currentHour = new Date().getHours();
        onUpdateSteps(currentSteps + 1, { hour: currentHour, steps: 1 });
        setSensorStatus('Counting steps in real time from accelerometer movement');
      }
      lastAccelMagnitude = magnitude;
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      // For iOS 13+ permission request
      const DME = window.DeviceMotionEvent as any;
      if (typeof DME.requestPermission === 'function') {
        DME.requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
              setSensorStatus('Pedometer sensor active! Walk with your device.');
            } else {
              setSensorStatus('Motion permission denied by user');
              setIsSensorActive(false);
            }
          })
          .catch(() => {
            setSensorStatus('Permission request failed');
            setIsSensorActive(false);
          });
      } else {
        window.addEventListener('devicemotion', handleMotion);
        setSensorStatus('Pedometer sensor active! Walk with your device.');
      }
    } else {
      setSensorStatus('Device motion API not available in this browser environment');
      setIsSensorActive(false);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isSensorActive, currentSteps, onUpdateSteps]);

  const handleManualAdd = (stepsToAdd: number) => {
    const currentHour = new Date().getHours();
    const newTotal = currentSteps + stepsToAdd;
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

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 lg:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
              Module B &bull; Movement &amp; Step Tracker
            </span>
            {isGoalReached && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Goal Reached!
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
            Daily Activity &amp; Active Burn
          </h3>
        </div>

        {/* Sync Apple Health / Health Connect simulation badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleManualAdd(1500)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            title="Simulate syncing steps from Apple Health or Google Health Connect"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync HealthKit / Health Connect</span>
          </button>
        </div>
      </div>

      {/* Main Stats Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step Count Circular Progress Display */}
        <div className="lg:col-span-5 bg-slate-950/50 rounded-2xl p-5 border border-slate-800/80 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Circular Progress Ring */}
          <div className="relative w-44 h-44 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-slate-800 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-cyan-400 fill-none transition-all duration-700"
                strokeWidth="10"
                strokeDasharray="314.16"
                strokeDashoffset={314.16 - (314.16 * progressPct) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <Footprints className="w-6 h-6 text-cyan-400 mb-1" />
              <span className="text-3xl font-black text-white tracking-tight">
                {currentSteps.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                of {stepGoal.toLocaleString()} goal
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 mt-2 font-medium">
            {progressPct}% of daily movement objective completed
          </div>
        </div>

        {/* Right: Metrics Grid + Real-Time Sensor / Walk Simulator */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Calories Burned from steps */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-semibold">Active Burn</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-cyan-300">
                {metrics.caloriesBurned}
              </div>
              <span className="text-[11px] text-slate-400">kcal burned</span>
            </div>

            {/* Distance */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span className="font-semibold">Distance</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {profile.unitSystem === 'imperial'
                  ? `${metrics.distanceMiles} mi`
                  : `${metrics.distanceKm} km`}
              </div>
              <span className="text-[11px] text-slate-400">covered</span>
            </div>

            {/* Active Minutes */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold">Active Time</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {metrics.activeMinutes}
              </div>
              <span className="text-[11px] text-slate-400">minutes brisk walk</span>
            </div>
          </div>

          {/* Interactive Step Simulator & Mobile Accelerometer */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Live Walk Session &amp; Sensor Modes
              </span>
              <span className="text-[11px] text-slate-400">{sensorStatus}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Walk simulator button */}
              <button
                onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isSimulatingWalk
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isSimulatingWalk ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulatingWalk ? 'Pause Walking Session' : 'Start Walk Session (~105 spm)'}</span>
              </button>

              {/* Mobile device accelerometer toggle */}
              <button
                onClick={() => setIsSensorActive(!isSensorActive)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isSensorActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSensorActive ? 'Live Sensor Pedometer Active' : 'Enable Device Accelerometer'}</span>
              </button>
            </div>

            {/* Quick manual additions */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Quick add:</span>
              {[500, 1000, 2500, 5000].map((stepAmt) => (
                <button
                  key={stepAmt}
                  onClick={() => handleManualAdd(stepAmt)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  +{stepAmt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Step Distribution Chart */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Today&apos;s Hourly Movement Pattern
          </span>
          <span className="text-xs text-slate-400 font-medium">Cadence breakdown</span>
        </div>

        {/* Bar chart representation */}
        <div className="h-28 flex items-end justify-between gap-1.5 pt-4 px-2">
          {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => {
            const stepEntry = hourlySteps.find((h) => h.hour === hour);
            const count = stepEntry ? stepEntry.steps : 0;
            const maxHourSteps = 2000;
            const heightPct = Math.min(100, Math.max(10, Math.round((count / maxHourSteps) * 100)));

            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <span className="text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  {count > 0 ? count : ''}
                </span>
                <div
                  className="w-full max-w-[28px] bg-gradient-to-t from-cyan-600 to-teal-400 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium">
                  {hour > 12 ? `${hour - 12}p` : `${hour}a`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones & Badges */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Award className="w-4 h-4 text-amber-400" /> Milestones:
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            currentSteps >= 5000
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          🥉 5K Daily Steps
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            currentSteps >= 10000
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          🥈 10K Champion
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            metrics.caloriesBurned >= 400
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          🔥 400 Active Burn
        </span>
      </div>
    </div>
  );
};
