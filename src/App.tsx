import React, { useState, useEffect } from 'react';
import {
  Flame,
  Utensils,
  Footprints,
  Sparkles,
  BarChart3,
  Camera,
  Settings,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Header } from './components/Header';
import { NetCalorieHero } from './components/NetCalorieHero';
import { PlateScannerModal } from './components/PlateScannerModal';
import { StepMovementTracker } from './components/StepMovementTracker';
import { WaterTracker } from './components/WaterTracker';
import { MealTimeline } from './components/MealTimeline';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AiCoachDrawer } from './components/AiCoachDrawer';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { UserProfile, DayLog, LoggedMeal, MealType, HourlyStep } from './types';
import { calculateStepMetrics } from './utils/healthCalculations';
import {
  loadStoredProfile,
  saveStoredProfile,
  loadStoredHistory,
  saveStoredHistory,
} from './utils/offlineStorage';

export default function App() {
  // Load persistent state using multi-level offline storage strategy
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredProfile());
  const [history, setHistory] = useState<DayLog[]>(() => loadStoredHistory());

  // Current view tab
  const [currentView, setCurrentView] = useState<'dashboard' | 'movement' | 'analytics'>('dashboard');

  // Modals state
  const [isPlateScannerOpen, setIsPlateScannerOpen] = useState<boolean>(false);
  const [scannerMealType, setScannerMealType] = useState<MealType>('Lunch');
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState<boolean>(false);

  // Sync to local storage with resilient rolling backup
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveStoredHistory(history);
  }, [history]);

  // Today is the last element in history
  const todayLog = history[history.length - 1] || {
    date: new Date().toISOString().split('T')[0],
    steps: 6420,
    distanceKm: 4.8,
    caloriesBurned: 366,
    activeMinutes: 62,
    hourlySteps: [],
    meals: [],
  };

  // Compute today's consumption
  const caloriesConsumed = todayLog.meals.reduce((s, m) => s + m.total_calories, 0);
  const proteinConsumed = Math.round(
    todayLog.meals.reduce((s, m) => s + m.total_macros.protein_g, 0) * 10
  ) / 10;
  const carbsConsumed = Math.round(
    todayLog.meals.reduce((s, m) => s + m.total_macros.carbs_g, 0) * 10
  ) / 10;
  const fatConsumed = Math.round(
    todayLog.meals.reduce((s, m) => s + m.total_macros.fat_g, 0) * 10
  ) / 10;
  const fiberConsumed = Math.round(
    todayLog.meals.reduce((s, m) => s + (m.total_macros.fiber_g || 0), 0) * 10
  ) / 10;

  // Handlers
  const handleMealLogged = (newMeal: LoggedMeal) => {
    setHistory((prev) => {
      const copy = [...prev];
      const today = { ...copy[copy.length - 1] };
      today.meals = [...today.meals, newMeal];
      copy[copy.length - 1] = today;
      return copy;
    });
  };

  const handleDeleteMeal = (mealId: string) => {
    setHistory((prev) => {
      const copy = [...prev];
      const today = { ...copy[copy.length - 1] };
      today.meals = today.meals.filter((m) => m.id !== mealId);
      copy[copy.length - 1] = today;
      return copy;
    });
  };

  const handleUpdateSteps = (newSteps: number, addedHourly?: { hour: number; steps: number }) => {
    setHistory((prev) => {
      const copy = [...prev];
      const today = { ...copy[copy.length - 1] };
      today.steps = newSteps;

      const metrics = calculateStepMetrics(newSteps, profile.weightKg, profile.heightCm);
      today.distanceKm = metrics.distanceKm;
      today.caloriesBurned = metrics.caloriesBurned;
      today.activeMinutes = metrics.activeMinutes;

      if (addedHourly) {
        const existingIdx = today.hourlySteps.findIndex((h) => h.hour === addedHourly.hour);
        if (existingIdx >= 0) {
          today.hourlySteps[existingIdx].steps += addedHourly.steps;
        } else {
          today.hourlySteps.push({ hour: addedHourly.hour, steps: addedHourly.steps });
        }
      }

      copy[copy.length - 1] = today;
      return copy;
    });
  };

  const handleLogWeight = (weight: number) => {
    setProfile((prev) => ({ ...prev, weightKg: weight }));
    setHistory((prev) => {
      const copy = [...prev];
      const today = { ...copy[copy.length - 1] };
      today.weightLogged = weight;
      copy[copy.length - 1] = today;
      return copy;
    });
  };

  const handleUpdateWater = (newWaterMl: number) => {
    setHistory((prev) => {
      const copy = [...prev];
      const today = { ...copy[copy.length - 1] };
      today.waterMl = newWaterMl;
      copy[copy.length - 1] = today;
      return copy;
    });
  };

  const openPlateScannerForType = (type: MealType) => {
    setScannerMealType(type);
    setIsPlateScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        profile={profile}
        streakDays={5}
        onOpenPlateScanner={() => openPlateScannerForType('Lunch')}
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStepModal={() => {
          setCurrentView('movement');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Primary Sub-Nav Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Net Calorie Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView('movement')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentView === 'movement'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Daily Step Tracker</span>
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentView === 'analytics'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Weekly &amp; Monthly Trends</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini Vision Model Online</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 pb-24 md:pb-12">
        {/* VIEW 1: Main Dashboard (Net Calories + Food Timeline + Quick Step Widget) */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Module C: Net Calorie Hero */}
            <NetCalorieHero
              profile={profile}
              caloriesConsumed={caloriesConsumed}
              caloriesBurned={todayLog.caloriesBurned}
              proteinConsumed={proteinConsumed}
              carbsConsumed={carbsConsumed}
              fatConsumed={fatConsumed}
              fiberConsumed={fiberConsumed}
              steps={todayLog.steps}
              onOpenPlateScanner={() => openPlateScannerForType('Lunch')}
              onOpenStepModal={() => setCurrentView('movement')}
            />

            {/* Two Column Layout: Food Log & Step Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Today's Meals Timeline */}
              <div className="lg:col-span-7">
                <MealTimeline
                  meals={todayLog.meals}
                  onOpenPlateScannerForType={openPlateScannerForType}
                  onDeleteMeal={handleDeleteMeal}
                />
              </div>

              {/* Right Column: Mini Step Tracker Card + AI Coach Callout */}
              <div className="lg:col-span-5 space-y-6">
                {/* Movement Card Preview */}
                <StepMovementTracker
                  profile={profile}
                  currentSteps={todayLog.steps}
                  hourlySteps={todayLog.hourlySteps}
                  onUpdateSteps={handleUpdateSteps}
                />

                {/* Water Intake & Hydration Tracker */}
                <WaterTracker
                  waterMl={todayLog.waterMl ?? 1750}
                  waterTargetMl={profile.waterTargetMl || 2500}
                  onUpdateWater={handleUpdateWater}
                  unitSystem={profile.unitSystem}
                />

                {/* AI Coach Banner */}
                <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        Coach NutriStep Advice
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        You have <strong className="text-emerald-400">{Math.max(0, profile.stepGoal - todayLog.steps).toLocaleString()} steps</strong> remaining to hit your 10,000-step streak milestone.
                      </p>
                      <button
                        onClick={() => setIsCoachOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Chat with AI Coach</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Dedicated Step Movement Tracker */}
        {currentView === 'movement' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <StepMovementTracker
              profile={profile}
              currentSteps={todayLog.steps}
              hourlySteps={todayLog.hourlySteps}
              onUpdateSteps={handleUpdateSteps}
            />

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white">How steps offset your calories</h4>
                <p className="text-xs text-slate-400 max-w-xl mt-1">
                  Walking burned <strong>+{todayLog.caloriesBurned} kcal</strong> today. These active calories are automatically added back into your net remaining food allowance!
                </p>
              </div>
              <button
                onClick={() => openPlateScannerForType('Dinner')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Log Nutritious Dinner Plate
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Weekly & Monthly Analytics */}
        {currentView === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AnalyticsCharts
              history={history}
              profile={profile}
              onLogWeight={handleLogWeight}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation for Mobile / Tablet */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 sm:hidden flex items-center justify-around">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            currentView === 'dashboard' ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span>Intake</span>
        </button>

        <button
          onClick={() => openPlateScannerForType('Lunch')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-bold text-emerald-300 -mt-5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-slate-950">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[10px]">Snap Plate</span>
        </button>

        <button
          onClick={() => setCurrentView('movement')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            currentView === 'movement' ? 'text-cyan-400' : 'text-slate-500'
          }`}
        >
          <Footprints className="w-5 h-5" />
          <span>Steps</span>
        </button>

        <button
          onClick={() => setIsCoachOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-purple-400 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>AI Coach</span>
        </button>

        <button
          onClick={() => setCurrentView('analytics')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            currentView === 'analytics' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Trends</span>
        </button>
      </nav>

      {/* Modals & Drawers */}
      <PlateScannerModal
        isOpen={isPlateScannerOpen}
        onClose={() => setIsPlateScannerOpen(false)}
        onMealLogged={handleMealLogged}
        defaultMealType={scannerMealType}
      />

      <AiCoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        profile={profile}
        caloriesConsumed={caloriesConsumed}
        caloriesBurned={todayLog.caloriesBurned}
        steps={todayLog.steps}
        proteinConsumed={proteinConsumed}
        carbsConsumed={carbsConsumed}
        fatConsumed={fatConsumed}
        waterMl={todayLog.waterMl ?? 1750}
        meals={todayLog.meals}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={(updated) => setProfile(updated)}
      />

      {/* Connectivity & Offline Notification Toast */}
      <OfflineIndicator />
    </div>
  );
}
