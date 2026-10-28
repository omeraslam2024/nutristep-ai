import React from 'react';
import { motion } from 'motion/react';
import { Droplets, Minus, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WaterTrackerProps {
  waterMl: number;
  waterTargetMl?: number;
  onUpdateWater: (newWaterMl: number) => void;
  unitSystem?: 'metric' | 'imperial';
}

const GLASS_ML = 250;

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  waterMl,
  waterTargetMl = 2500,
  onUpdateWater,
  unitSystem = 'metric',
}) => {
  const goalGlasses = Math.max(1, Math.round(waterTargetMl / GLASS_ML));
  const glasses = Math.floor(waterMl / GLASS_ML);
  const fmt = (ml: number) => (unitSystem === 'imperial' ? `${Math.round(ml * 0.033814)} oz` : `${+(ml / 1000).toFixed(2)} L`);

  const setWater = (next: number) => {
    const updated = Math.max(0, next);
    onUpdateWater(updated);
    navigator.vibrate?.(12);
    if (updated >= waterTargetMl && waterMl < waterTargetMl) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ['#38bdf8', '#0ea5e9', '#94d04a'] });
    }
  };

  return (
    <section className="surface p-5" aria-labelledby="water-title">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-cloud text-cloud-ink flex items-center justify-center">
          <Droplets className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <h3 id="water-title" className="font-display text-xl font-semibold text-ink leading-tight">
            Water
          </h3>
          <p className="text-xs text-slate-400 tabular-nums">
            {fmt(waterMl)} of {fmt(waterTargetMl)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWater(waterMl - GLASS_ML)}
            disabled={waterMl <= 0}
            aria-label="Remove a glass"
            className="w-11 h-11 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform cursor-pointer"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setWater(waterMl + GLASS_ML)}
            aria-label="Add a glass (250 ml)"
            className="w-11 h-11 rounded-full btn-primary flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(goalGlasses, 12)}, minmax(0, 1fr))` }}>
        {Array.from({ length: Math.min(goalGlasses, 12) }, (_, i) => {
          const filled = i < glasses;
          return (
            <button
              key={i}
              onClick={() => setWater((i + 1) * GLASS_ML === waterMl ? i * GLASS_ML : (i + 1) * GLASS_ML)}
              aria-label={`Set to ${i + 1} glass${i ? 'es' : ''}`}
              aria-pressed={filled}
              className="relative h-12 rounded-lg bg-slate-800 overflow-hidden cursor-pointer"
            >
              <motion.span
                className="absolute inset-x-0 bottom-0 bg-[#7cb8f5]"
                initial={false}
                animate={{ height: filled ? '100%' : '0%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: filled ? i * 0.02 : 0 }}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {glasses >= goalGlasses ? 'Hydration goal reached' : `${goalGlasses - glasses} more glasses of ${GLASS_ML} ml`}
      </p>
    </section>
  );
};
