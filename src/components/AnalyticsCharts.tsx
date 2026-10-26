import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart, Scale, Calendar, ArrowUpRight } from 'lucide-react';
import { DayLog, UserProfile } from '../types';
import { calculateTargetCalories } from '../utils/healthCalculations';

interface AnalyticsChartsProps {
  history: DayLog[];
  profile: UserProfile;
  onLogWeight?: (weight: number) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  history,
  profile,
  onLogWeight,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'calories' | 'steps' | 'macros' | 'weight'>('calories');
  const [newWeightInput, setNewWeightInput] = useState<string>(profile.weightKg.toString());

  const targetCals = calculateTargetCalories(profile);
  const stepGoal = profile.stepGoal || 10000;

  // Compute averages
  const avgSteps = Math.round(
    history.reduce((s, d) => s + d.steps, 0) / (history.length || 1)
  );
  const avgCalsConsumed = Math.round(
    history.reduce(
      (s, d) => s + d.meals.reduce((ms, m) => ms + m.total_calories, 0),
      0
    ) / (history.length || 1)
  );
  const avgActiveBurn = Math.round(
    history.reduce((s, d) => s + d.caloriesBurned, 0) / (history.length || 1)
  );

  // Compute macro distribution across history
  const totalP = history.reduce(
    (s, d) => s + d.meals.reduce((ms, m) => ms + m.total_macros.protein_g, 0),
    0
  );
  const totalC = history.reduce(
    (s, d) => s + d.meals.reduce((ms, m) => ms + m.total_macros.carbs_g, 0),
    0
  );
  const totalF = history.reduce(
    (s, d) => s + d.meals.reduce((ms, m) => ms + m.total_macros.fat_g, 0),
    0
  );
  const grandMacro = totalP * 4 + totalC * 4 + totalF * 9 || 1;
  const pRatio = Math.round(((totalP * 4) / grandMacro) * 100);
  const cRatio = Math.round(((totalC * 4) / grandMacro) * 100);
  const fRatio = Math.round(((totalF * 9) / grandMacro) * 100);

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeightInput);
    if (!isNaN(w) && w > 30 && w < 300 && onLogWeight) {
      onLogWeight(w);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 lg:p-6 space-y-6 shadow-xl">
      {/* Header with Range & Metric tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">
            Module C &bull; Weekly &amp; Monthly Insights
          </span>
          <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
            Trends &amp; Performance Analytics
          </h3>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('calories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'calories'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calorie Balance
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'steps'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Steps
          </button>
          <button
            onClick={() => setActiveTab('macros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'macros'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Macros Ratio
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'weight'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weight
          </button>
        </div>
      </div>

      {/* 3 Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 font-semibold block">7-Day Avg Steps</span>
          <span className="text-xl sm:text-2xl font-black text-cyan-300">
            {avgSteps.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">goal: {stepGoal.toLocaleString()}</span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 font-semibold block">7-Day Avg Intake</span>
          <span className="text-xl sm:text-2xl font-black text-amber-300">
            {avgCalsConsumed.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">target: {targetCals.toLocaleString()} kcal</span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 font-semibold block">7-Day Avg Burn</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-300">
            +{avgActiveBurn}
          </span>
          <span className="text-[10px] text-slate-500 block">kcal active steps</span>
        </div>
      </div>

      {/* Chart View based on Active Tab */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        {activeTab === 'calories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Calorie Intake vs Active Step Burn
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Intake
                </span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400" /> Burned
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-3 border-t border-dashed border-rose-400" /> Goal ({targetCals})
                </span>
              </div>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
              {history.map((day) => {
                const dayIntake = day.meals.reduce((s, m) => s + m.total_calories, 0);
                const dayBurn = day.caloriesBurned;
                const maxVal = 2800;
                const intakeHeight = Math.min(100, Math.round((dayIntake / maxVal) * 100));
                const burnHeight = Math.min(100, Math.round((dayBurn / maxVal) * 100));
                const dName = new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(
                  new Date(day.date + 'T00:00:00')
                );

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {dayIntake}k
                    </span>
                    <div className="w-full flex items-end justify-center gap-1">
                      <div
                        className="w-3 sm:w-4 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm"
                        style={{ height: `${intakeHeight}%` }}
                        title={`Intake: ${dayIntake} kcal`}
                      />
                      <div
                        className="w-3 sm:w-4 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm"
                        style={{ height: `${burnHeight}%` }}
                        title={`Burned: +${dayBurn} kcal`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{dName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Daily Step Volume &amp; Consistency
              </span>
              <span className="text-xs text-slate-400">Target: {stepGoal.toLocaleString()} steps</span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
              {history.map((day) => {
                const maxSteps = Math.max(stepGoal * 1.3, 14000);
                const heightPct = Math.min(100, Math.round((day.steps / maxSteps) * 100));
                const isOverGoal = day.steps >= stepGoal;
                const dName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
                  new Date(day.date + 'T00:00:00')
                );

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <span className="text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {(day.steps / 1000).toFixed(1)}k
                    </span>
                    <div
                      className={`w-full max-w-[28px] rounded-t-md transition-all ${
                        isOverGoal
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                          : 'bg-gradient-to-t from-cyan-700 to-cyan-500'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">{dName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'macros' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                Macronutrient Energy Distribution
              </span>
              <span className="text-xs text-slate-400">Aggregate past 7 days</span>
            </div>

            {/* Visual ratio bar */}
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${pRatio}%` }} className="bg-rose-500" title={`Protein: ${pRatio}%`} />
              <div style={{ width: `${cRatio}%` }} className="bg-amber-400" title={`Carbs: ${cRatio}%`} />
              <div style={{ width: `${fRatio}%` }} className="bg-sky-400" title={`Fat: ${fRatio}%`} />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Protein
                </div>
                <div className="text-xl font-bold text-white">{pRatio}%</div>
                <span className="text-[10px] text-slate-500">{totalP}g logged</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Carbohydrates
                </div>
                <div className="text-xl font-bold text-white">{cRatio}%</div>
                <span className="text-[10px] text-slate-500">{totalC}g logged</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Dietary Fat
                </div>
                <div className="text-xl font-bold text-white">{fRatio}%</div>
                <span className="text-[10px] text-slate-500">{totalF}g logged</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                Weight Trajectory &amp; Progress
              </span>

              {/* Log new weight form */}
              <form onSubmit={handleSaveWeight} className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. 75.5"
                />
                <span className="text-slate-400 text-xs">{profile.unitSystem === 'imperial' ? 'lbs' : 'kg'}</span>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-semibold cursor-pointer"
                >
                  Log Weight
                </button>
              </form>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Current Weight</span>
                <div className="text-2xl font-black text-white mt-0.5">
                  {profile.weightKg} {profile.unitSystem === 'imperial' ? 'lbs' : 'kg'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Target Goal</span>
                <div className="text-2xl font-black text-purple-300 mt-0.5">
                  {profile.targetWeightKg} {profile.unitSystem === 'imperial' ? 'lbs' : 'kg'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Weight trend is progressing steadily toward your {profile.targetWeightKg}kg objective with consistent caloric management and step volume.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
