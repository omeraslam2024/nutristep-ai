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

interface StepMovementTrackerProps {
  profile: UserProfile;
  currentSteps: number;
  hourlySteps: HourlyStep[];
  onUpdateSteps: (newSteps: number, addedHourly?: { hour: number; steps: number }) => void;
  onClose?: () => void;
  onBackToHome?: () => void;
}

export const StepMovementTracker: React.FC<StepMovementTrackerProps> = ({
  profile,
  currentSteps,
  hourlySteps,
  onUpdateSteps,
  onClose,
  onBackToHome,
}) => {
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [isSensorPaused, setIsSensorPaused] = useState<boolean>(false);
  const [sensorStatus, setSensorStatus] = useState<string>('Sensor Ready');
  const [workoutSeconds, setWorkoutSeconds] = useState<number>(0);
  const [sessionStepsGained, setSessionStepsGained] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // References to keep current values without re-attaching listeners
  const stepsRef = useRef<number>(currentSteps);
  stepsRef.current = currentSteps;

  const onUpdateStepsRef = useRef(onUpdateSteps);
  onUpdateStepsRef.current = onUpdateSteps;

  const isSensorPausedRef = useRef<boolean>(isSensorPaused);
  isSensorPausedRef.current = isSensorPaused;

  const isSensorActiveRef = useRef<boolean>(isSensorActive);
  isSensorActiveRef.current = isSensorActive;

  // Pedometer Filter & Gait Rhythm State (Refs)
  const lastStepTimestampRef = useRef<number>(0);
  const isInPeakRef = useRef<boolean>(false);
  const consecutiveRhythmicStepsRef = useRef<number>(0);
  const gravityRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 9.81, z: 0 });
  const walkIntervalRef = useRef<any>(null);

  // Calculate metrics based on user's weight & height
  const metrics = calculateStepMetrics(currentSteps, profile.weightKg, profile.heightCm);
  const stepGoal = profile.stepGoal || 10000;
  const progressPct = Math.min(100, Math.round((currentSteps / stepGoal) * 100));
  const isGoalReached = currentSteps >= stepGoal;
  const stepsRemaining = Math.max(0, stepGoal - currentSteps);

  // Workout stopwatch timer
  useEffect(() => {
    let timer: any = null;
    if ((isSimulatingWalk || (isSensorActive && !isSensorPaused))) {
      timer = setInterval(() => {
        setWorkoutSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulatingWalk, isSensorActive, isSensorPaused]);

  // Real-time walking simulator (Demo mode only, explicit toggle)
  useEffect(() => {
    if (isSimulatingWalk) {
      walkIntervalRef.current = setInterval(() => {
        const delta = Math.floor(Math.random() * 3) + 1; // 1-3 steps per 1.2s (realistic cadence)
        setSessionStepsGained((prev) => prev + delta);
        const currentHour = new Date().getHours();
        onUpdateStepsRef.current(stepsRef.current + delta, { hour: currentHour, steps: delta });
      }, 1200);
    } else {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    }
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, [isSimulatingWalk]);

  // Robust Accelerometer & Pedometer Gait Detection Engine
  useEffect(() => {
    if (!isSensorActive) return;

    // Reset filter states upon activation
    lastStepTimestampRef.current = 0;
    isInPeakRef.current = false;
    consecutiveRhythmicStepsRef.current = 0;
    setSensorStatus('Listening for walking strides...');

    const handleMotion = (event: DeviceMotionEvent) => {
      if (isSensorPausedRef.current) {
        setSensorStatus('Pedometer Paused');
        return;
      }

      let linearMag = 0;

      // Method 1: Use native linear acceleration (gravity-removed) if provided by device
      if (
        event.acceleration &&
        event.acceleration.x !== null &&
        event.acceleration.y !== null &&
        event.acceleration.z !== null
      ) {
        const ax = event.acceleration.x;
        const ay = event.acceleration.y;
        const az = event.acceleration.z;
        linearMag = Math.sqrt(ax * ax + ay * ay + az * az);
      } else if (
        event.accelerationIncludingGravity &&
        event.accelerationIncludingGravity.x !== null &&
        event.accelerationIncludingGravity.y !== null &&
        event.accelerationIncludingGravity.z !== null
      ) {
        // Method 2: High-pass filter to isolate linear body movement from constant 1G earth gravity
        const rawX = event.accelerationIncludingGravity.x;
        const rawY = event.accelerationIncludingGravity.y;
        const rawZ = event.accelerationIncludingGravity.z;

        // Smooth low-pass gravity estimator
        const alpha = 0.85;
        gravityRef.current.x = alpha * gravityRef.current.x + (1 - alpha) * rawX;
        gravityRef.current.y = alpha * gravityRef.current.y + (1 - alpha) * rawY;
        gravityRef.current.z = alpha * gravityRef.current.z + (1 - alpha) * rawZ;

        const linX = rawX - gravityRef.current.x;
        const linY = rawY - gravityRef.current.y;
        const linZ = rawZ - gravityRef.current.z;
        linearMag = Math.sqrt(linX * linX + linY * linY + linZ * linZ);
      } else {
        setSensorStatus('Sensor unsupported');
        return;
      }

      const now = Date.now();

      // Human Gait Biomechanical Constants:
      // Stationary phone resting/jitter is typically < 0.6 m/s².
      // Genuine footfall impact yields a distinct peak > 2.0 m/s².
      // Cadence constraint: Fastest running is ~350ms/step; slow walk is ~1400ms/step.
      const STEP_PEAK_THRESHOLD = 2.1; // m/s² dynamic body acceleration
      const STEP_VALLEY_THRESHOLD = 0.75; // m/s² swing phase dip
      const MIN_STEP_CADENCE_MS = 380; // Debounce: max 2.6 steps/sec
      const MAX_CADENCE_WINDOW_MS = 1600; // Cadence window: consecutive steps must be within 1.6s

      // Detect rising acceleration peak (footstrike)
      if (linearMag > STEP_PEAK_THRESHOLD && !isInPeakRef.current) {
        const timeSinceLastStep = now - lastStepTimestampRef.current;

        if (timeSinceLastStep >= MIN_STEP_CADENCE_MS) {
          isInPeakRef.current = true;

          // Check if this is part of continuous walking cadence
          if (timeSinceLastStep <= MAX_CADENCE_WINDOW_MS) {
            consecutiveRhythmicStepsRef.current += 1;
          } else {
            consecutiveRhythmicStepsRef.current = 1; // Restart rhythm cadence
          }

          // Anti-False-Positive Filter: Require at least 2 rhythmic footfalls
          // This ensures single table knocks, car vibrations, or picking up the phone NEVER count as steps!
          if (consecutiveRhythmicStepsRef.current >= 2) {
            lastStepTimestampRef.current = now;
            const newTotal = stepsRef.current + 1;
            const currentHour = new Date().getHours();
            onUpdateStepsRef.current(newTotal, { hour: currentHour, steps: 1 });
            setSessionStepsGained((prev) => prev + 1);
            setSensorStatus('Walking Step Detected');
          } else {
            lastStepTimestampRef.current = now;
            setSensorStatus('Cadence Syncing...');
          }
        }
      } else if (linearMag < STEP_VALLEY_THRESHOLD && isInPeakRef.current) {
        // Foot has left the ground, leg swing phase reset
        isInPeakRef.current = false;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isSensorActive]); // Notice: NO currentSteps in dependency array! Clean sensor lifecycle!

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
        speech = `You have taken ${currentSteps.toLocaleString()} steps today. You need ${stepsRemaining.toLocaleString()} more steps to reach your goal. Tap Start Walking or take a healthy stroll!`;
      }

      speakText(speech);
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

          {/* Workout active session hud */}
          {(isSimulatingWalk || isSensorActive) && (
            <div className="mt-4 pt-3 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Session: {formatTimer(workoutSeconds)}
              </span>
              <span className="text-emerald-400 font-black">
                +{sessionStepsGained} steps
              </span>
            </div>
          )}
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
                  onClick={() => handleManualAdd(stepAmt)}
                  className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-sm text-center min-h-[48px]"
                >
                  +{stepAmt.toLocaleString()} 👟
                </button>
              ))}
            </div>

            {/* Live Hardware Pedometer Sensor Controls with Pause / Resume */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" /> Device Pedometer Sensor
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSensorActive
                      ? isSensorPaused
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isSensorActive ? (isSensorPaused ? '⏸️ Sensor Paused' : '🟢 Filter Active') : '⚪ Off'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Hardware Sensor Toggle */}
                <button
                  onClick={() => {
                    if (isSensorActive) {
                      setIsSensorActive(false);
                      setIsSensorPaused(false);
                      setSensorStatus('Sensor Turned Off');
                    } else {
                      setIsSensorActive(true);
                      setIsSensorPaused(false);
                      setIsSimulatingWalk(false); // Stop simulation if turning on hardware sensor
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md min-h-[48px] ${
                    isSensorActive
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-2 border-rose-500/50'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-2 border-cyan-500/50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>{isSensorActive ? 'Turn Off Phone Sensor' : '📱 Turn On Phone Sensor'}</span>
                </button>

                {/* Pause / Resume Button (Prevents Stationary False Steps) */}
                {isSensorActive ? (
                  <button
                    onClick={() => setIsSensorPaused(!isSensorPaused)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md min-h-[48px] ${
                      isSensorPaused
                        ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 border-2 border-emerald-500/50'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-2 border-amber-500/50'
                    }`}
                  >
                    {isSensorPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{isSensorPaused ? '▶️ Resume Step Counting' : '⏸️ Pause (Resting / In Car)'}</span>
                  </button>
                ) : (
                  /* Walk Simulation Toggle for Demo Testing */
                  <button
                    onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md min-h-[48px] ${
                      isSimulatingWalk
                        ? 'bg-rose-500/30 text-rose-300 border-2 border-rose-500 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isSimulatingWalk ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isSimulatingWalk ? 'Stop Walk Demo' : '🚶 Test Walk Simulator'}</span>
                  </button>
                )}
              </div>

              {isSensorActive && (
                <p className="text-[11px] text-slate-400 italic text-center pt-1">
                  Biomechanical filter enabled: Only genuine walking strides are counted. Stationary shakes and table vibrations are ignored.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
