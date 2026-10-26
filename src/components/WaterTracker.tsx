import React from 'react';
import { Droplets, Plus, Minus, CheckCircle2, Sparkles, GlassWater } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WaterTrackerProps {
  waterMl: number;
  waterTargetMl?: number;
  onUpdateWater: (newWaterMl: number) => void;
  unitSystem?: 'metric' | 'imperial';
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  waterMl,
  waterTargetMl = 2500,
  onUpdateWater,
  unitSystem = 'metric',
}) => {
  const GLASS_SIZE_ML = 250; // standard 250ml glass
  const totalGlassesGoal = Math.round(waterTargetMl / GLASS_SIZE_ML);
  const currentGlassesExact = waterMl / GLASS_SIZE_ML;
  const currentGlasses = Math.floor(currentGlassesExact);
  const progressPct = Math.min(100, Math.round((waterMl / waterTargetMl) * 100));
  const isTargetAchieved = waterMl >= waterTargetMl;

  // Fluid ounces conversion
  const waterOz = Math.round(waterMl * 0.033814);
  const targetOz = Math.round(waterTargetMl * 0.033814);

  const handleAddWater = (amountMl: number) => {
    const updated = Math.max(0, waterMl + amountMl);
    onUpdateWater(updated);

    if (updated >= waterTargetMl && waterMl < waterTargetMl) {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#0ea5e9', '#06b6d4', '#60a5fa'],
      });
    }
  };

  const handleGlassClick = (glassIndex: number) => {
    // clicking on glass N sets water to N * 250ml
    const newTarget = (glassIndex + 1) * GLASS_SIZE_ML;
    handleAddWater(newTarget - waterMl);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 lg:p-6 space-y-5 shadow-xl relative overflow-hidden">
      {/* Background ambient water glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-sky-400">
              Hydration Tracker &bull; Daily Water
            </span>
            {isTargetAchieved && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-400" /> Goal Achieved!
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
            Water Intake &amp; Hydration Ring
          </h3>
        </div>

        {/* Glasses Counter Display */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs text-slate-300 self-start sm:self-auto">
          <Droplets className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="font-semibold text-white">
            <strong className="text-sky-300 text-sm">{currentGlasses}</strong> / {totalGlassesGoal} glasses
          </span>
          <span className="text-slate-500">({GLASS_SIZE_ML}ml each)</span>
        </div>
      </div>

      {/* Main Grid: Visual Progress Ring + Details & Quick-Add Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Circular Progress Ring */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
          <div className="relative w-40 h-40 flex items-center justify-center my-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="48"
                className="stroke-slate-800 fill-none"
                strokeWidth="10"
              />
              {/* Progress ring */}
              <circle
                cx="60"
                cy="60"
                r="48"
                className="stroke-sky-400 fill-none transition-all duration-700"
                strokeWidth="10"
                strokeDasharray="301.59"
                strokeDashoffset={301.59 - (301.59 * progressPct) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Ring Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Droplets className="w-6 h-6 text-sky-400 mb-0.5" />
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {progressPct}%
              </span>
              <span className="text-[11px] text-sky-300 font-semibold">
                {unitSystem === 'imperial'
                  ? `${waterOz} / ${targetOz} oz`
                  : `${waterMl.toLocaleString()} / ${waterTargetMl.toLocaleString()} ml`}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            {isTargetAchieved
              ? '💧 Optimal cellular hydration reached!'
              : `${Math.max(0, waterTargetMl - waterMl)} ml remaining to reach daily hydration target`}
          </p>
        </div>

        {/* Right: Quick-Add Standard Units & Interactive Glasses Grid */}
        <div className="md:col-span-7 flex flex-col justify-between gap-4">
          {/* Quick-Add Buttons for standard units */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-sky-400" /> Quick Add Water
              </span>
              {waterMl > 0 && (
                <button
                  onClick={() => handleAddWater(-250)}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Undo 1 glass (250ml)"
                >
                  <Minus className="w-3 h-3" />
                  <span>Undo 250ml</span>
                </button>
              )}
            </div>

            {/* Prominent Quick-Add Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* +250ml Standard Glass (Prominent) */}
              <button
                onClick={() => handleAddWater(250)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-sky-500/20 to-sky-600/30 hover:from-sky-500/30 hover:to-sky-600/40 border border-sky-500/40 text-sky-200 transition-all active:scale-95 cursor-pointer group shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/30 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <GlassWater className="w-4 h-4 text-sky-300" />
                </div>
                <span className="text-xs font-bold text-white">+250 ml</span>
                <span className="text-[10px] text-sky-300">1 Glass</span>
              </button>

              {/* +500ml Bottle */}
              <button
                onClick={() => handleAddWater(500)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-bold text-white">+500 ml</span>
                <span className="text-[10px] text-slate-400">1 Bottle</span>
              </button>

              {/* +150ml Small Cup */}
              <button
                onClick={() => handleAddWater(150)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-xs font-bold text-white">+150 ml</span>
                <span className="text-[10px] text-slate-400">Small Cup</span>
              </button>

              {/* +750ml Large Flask */}
              <button
                onClick={() => handleAddWater(750)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-white">+750 ml</span>
                <span className="text-[10px] text-slate-400">Sport Flask</span>
              </button>
            </div>
          </div>

          {/* Interactive Row of 10 Glasses */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400">Tap a glass to set intake directly:</span>
              <span className="text-sky-400 font-bold">
                {currentGlasses} of {totalGlassesGoal} filled
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
              {Array.from({ length: totalGlassesGoal }).map((_, idx) => {
                const isFilled = idx < currentGlasses;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleGlassClick(idx)}
                    className={`h-11 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isFilled
                        ? 'bg-sky-500/30 border-sky-400/60 text-sky-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                    }`}
                    title={`Glass #${idx + 1} (${(idx + 1) * GLASS_SIZE_ML}ml)`}
                  >
                    <GlassWater className={`w-4 h-4 ${isFilled ? 'text-sky-300' : 'text-slate-600'}`} />
                    <span className="text-[9px] font-bold mt-0.5">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
