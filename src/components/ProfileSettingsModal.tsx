import React, { useState } from 'react';
import { X, User, Activity, Target, Flame, Heart, Check, Sliders, Shield } from 'lucide-react';
import { UserProfile, FitnessGoal, ActivityLevel, UnitSystem } from '../types';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacroTargets,
  kgToLbs,
  lbsToKg,
  cmToFtIn,
  ftInToCm,
} from '../utils/healthCalculations';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [ftIn, setFtIn] = useState<{ ft: number; in: number }>(cmToFtIn(profile.heightCm));
  const [lbsWeight, setLbsWeight] = useState<number>(kgToLbs(profile.weightKg));
  const [lbsTargetWeight, setLbsTargetWeight] = useState<number>(kgToLbs(profile.targetWeightKg));

  // Compute live calculations
  const liveBMR = calculateBMR(formData);
  const liveTDEE = calculateTDEE(formData);
  const liveTargetCals = calculateTargetCalories(formData);
  const liveMacros = calculateMacroTargets(formData, liveTargetCals);

  const handleUnitToggle = (unit: UnitSystem) => {
    setFormData((prev) => ({ ...prev, unitSystem: unit }));
  };

  const handleWeightChange = (val: number) => {
    if (formData.unitSystem === 'imperial') {
      setLbsWeight(val);
      setFormData((prev) => ({ ...prev, weightKg: lbsToKg(val) }));
    } else {
      setFormData((prev) => ({ ...prev, weightKg: val }));
      setLbsWeight(kgToLbs(val));
    }
  };

  const handleTargetWeightChange = (val: number) => {
    if (formData.unitSystem === 'imperial') {
      setLbsTargetWeight(val);
      setFormData((prev) => ({ ...prev, targetWeightKg: lbsToKg(val) }));
    } else {
      setFormData((prev) => ({ ...prev, targetWeightKg: val }));
      setLbsTargetWeight(kgToLbs(val));
    }
  };

  const handleHeightChange = (cm: number) => {
    setFormData((prev) => ({ ...prev, heightCm: cm }));
    setFtIn(cmToFtIn(cm));
  };

  const handleFtInChange = (newFt: number, newIn: number) => {
    setFtIn({ ft: newFt, in: newIn });
    const cm = ftInToCm(newFt, newIn);
    setFormData((prev) => ({ ...prev, heightCm: cm }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Personalization &amp; BMR / TDEE Setup
              </h3>
              <p className="text-xs text-slate-400">Mifflin-St Jeor Scientific Energy Formula</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Unit System Switcher */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">Measurement Units</span>
            <div className="flex gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleUnitToggle('metric')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  formData.unitSystem === 'metric'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('imperial')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  formData.unitSystem === 'imperial'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Imperial (lbs / ft-in)
              </button>
            </div>
          </div>

          {/* Basic Biometrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Biological Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Non-binary</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Age (Years)</label>
              <input
                type="number"
                min="14"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Height Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Height {formData.unitSystem === 'metric' ? '(cm)' : '(ft & in)'}
              </label>
              {formData.unitSystem === 'metric' ? (
                <input
                  type="number"
                  min="100"
                  max="240"
                  value={formData.heightCm}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min="3"
                      max="7"
                      value={ftIn.ft}
                      onChange={(e) => handleFtInChange(Number(e.target.value), ftIn.in)}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">ft</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={ftIn.in}
                      onChange={(e) => handleFtInChange(ftIn.ft, Number(e.target.value))}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Weight */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Weight {formData.unitSystem === 'metric' ? '(kg)' : '(lbs)'}
              </label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="300"
                value={formData.unitSystem === 'metric' ? formData.weightKg : lbsWeight}
                onChange={(e) => handleWeightChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target Weight */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Weight {formData.unitSystem === 'metric' ? '(kg)' : '(lbs)'}
              </label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="300"
                value={formData.unitSystem === 'metric' ? formData.targetWeightKg : lbsTargetWeight}
                onChange={(e) => handleTargetWeightChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Activity Level & Fitness Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e) =>
                  setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="sedentary">Sedentary (desk job, minimal exercise)</option>
                <option value="light">Lightly Active (1-3 workout days/wk)</option>
                <option value="moderate">Moderately Active (3-5 workout days/wk)</option>
                <option value="very_active">Very Active (6-7 intense workout days/wk)</option>
                <option value="athlete">Athlete / Heavy physical labor</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Fitness Goal</label>
              <select
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value as FitnessGoal })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="lose_weight">Fat Loss (-500 kcal daily deficit)</option>
                <option value="maintain">Maintenance (Balanced energy equilibrium)</option>
                <option value="gain_muscle">Muscle Hypertrophy (+350 kcal surplus)</option>
              </select>
            </div>
          </div>

          {/* Daily Step Goal */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Daily Step Objective
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="4000"
                max="20000"
                step="500"
                value={formData.stepGoal}
                onChange={(e) => setFormData({ ...formData, stepGoal: Number(e.target.value) })}
                className="flex-1 accent-cyan-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              <span className="text-sm font-bold text-cyan-300 min-w-[90px] text-right">
                {formData.stepGoal.toLocaleString()} steps
              </span>
            </div>
          </div>

          {/* Daily Water Target */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Daily Water Target
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1500"
                max="4500"
                step="250"
                value={formData.waterTargetMl || 2500}
                onChange={(e) => setFormData({ ...formData, waterTargetMl: Number(e.target.value) })}
                className="flex-1 accent-sky-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              <span className="text-sm font-bold text-sky-300 min-w-[90px] text-right">
                {(formData.waterTargetMl || 2500).toLocaleString()} ml
                <span className="text-xs text-slate-500 font-normal block">
                  ({Math.round((formData.waterTargetMl || 2500) / 250)} glasses)
                </span>
              </span>
            </div>
          </div>

          {/* Live Calculated BMR & TDEE Results Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              Calculated Energy Output (Mifflin-St Jeor)
            </span>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Basal Metabolic (BMR)</span>
                <span className="text-lg font-bold text-white">{liveBMR} kcal</span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Daily Expenditure (TDEE)</span>
                <span className="text-lg font-bold text-cyan-300">{liveTDEE} kcal</span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[11px] text-emerald-400 block font-semibold">Recommended Target</span>
                <span className="text-lg font-black text-emerald-300">{liveTargetCals} kcal</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
              <span>Target Protein: <strong className="text-rose-300">{liveMacros.protein_g}g</strong></span>
              <span>Target Carbs: <strong className="text-amber-300">{liveMacros.carbs_g}g</strong></span>
              <span>Target Fat: <strong className="text-sky-300">{liveMacros.fat_g}g</strong></span>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save &amp; Update Goals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
