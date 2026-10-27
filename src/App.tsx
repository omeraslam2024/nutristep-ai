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
import { StreakCounterModal } from './components/StreakCounterModal';
import { UserProfile, DayLog, LoggedMeal, MealType } from './types';
import { calculateStepMetrics, calculateStreakInfo, calculateTargetCalories } from './utils/healthCalculations';
import {
  loadStoredProfile,
  saveStoredProfile,
  loadStoredHistory,
  saveStoredHistory,
} from './utils/offlineStorage';
import { ensureToday, stripSeedData } from './utils/history';
import { usePedometer } from './utils/pedometer/usePedometer';

export default function App() {
  // Load persistent state using multi-level offline storage strategy
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredProfile());
  const [history, setHistory] = useState<DayLog[]>(() => ensureToday(stripSeedData(loadStoredHistory()).history));

  // Current view tab
  const [currentView, setCurrentView] = useState<'dashboard' | 'movement' | 'analytics'>('dashboard');

  // Modals state
  const [isPlateScannerOpen, setIsPlateScannerOpen] = useState<boolean>(false);
  const [scannerMealType, setScannerMealType] = useState<MealType>('Lunch');
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [coachInitialPrompt, setCoachInitialPrompt] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState<boolean>(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);

  // Sync to local storage with resilient rolling backup
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveStoredHistory(history);
  }, [history]);

  // Start a new day log at midnight and when the app comes back from the background.
  useEffect(() => {
    const roll = () => setHistory((prev) => ensureToday(prev));
    const timer = setInterval(roll, 60_000);
    document.addEventListener('visibilitychange', roll);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', roll);
    };
  }, []);

  // ensureToday guarantees the last entry is today.
  const todayLog = history[history.length - 1];

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

  // Real dynamic streak computation based on dual goals (Calories & Steps)
  const streakInfo = calculateStreakInfo(history, profile);
  const targetCalories = calculateTargetCalories(profile);
  const netRemaining = targetCalories - caloriesConsumed + todayLog.caloriesBurned;
  const speechSummary = `Hello ${profile.name.split(' ')[0]}! You are on a ${
    streakInfo.currentStreak
  } day streak. You have ${Math.max(
    0,
    netRemaining
  )} calories remaining to eat today, and you took ${todayLog.steps.toLocaleString()} steps. Tap the big green camera button to take a picture of your food!`;

  // Handlers: every write goes to today's log, rolling the day over first if midnight has passed.
  const updateToday = (fn: (today: DayLog) => DayLog) => {
    setHistory((prev) => {
      const copy = ensureToday(prev).slice();
      copy[copy.length - 1] = fn(copy[copy.length - 1]);
      return copy;
    });
  };

  const handleMealLogged = (newMeal: LoggedMeal) =>
    updateToday((today) => ({ ...today, meals: [...today.meals, newMeal] }));

  const handleDeleteMeal = (mealId: string) =>
    updateToday((today) => ({ ...today, meals: today.meals.filter((m) => m.id !== mealId) }));

  /** Adds newly walked steps (a delta, never a total) to today and the current hour. */
  const handleAddSteps = (delta: number) => {
    if (!(delta > 0)) return;
    const hour = new Date().getHours();
    updateToday((today) => {
      const steps = today.steps + delta;
      const metrics = calculateStepMetrics(steps, profile.weightKg, profile.heightCm);
      const hourlySteps = today.hourlySteps.some((h) => h.hour === hour)
        ? today.hourlySteps.map((h) => (h.hour === hour ? { ...h, steps: h.steps + delta } : h))
        : [...today.hourlySteps, { hour, steps: delta }];
      return {
        ...today,
        steps,
        distanceKm: metrics.distanceKm,
        caloriesBurned: metrics.caloriesBurned,
        activeMinutes: metrics.activeMinutes,
        hourlySteps,
      };
    });
  };

  const pedometer = usePedometer(handleAddSteps);

  const handleLogWeight = (weight: number) => {
    setProfile((prev) => ({ ...prev, weightKg: weight }));
    updateToday((today) => ({ ...today, weightLogged: weight }));
  };

  const handleUpdateWater = (newWaterMl: number) => updateToday((today) => ({ ...today, waterMl: newWaterMl }));

  const openPlateScannerForType = (type: MealType) => {
    setScannerMealType(type);
    setIsPlateScannerOpen(true);
  };

  const handleAskCoachAboutMeal = (meal: LoggedMeal) => {
    setCoachInitialPrompt(
      `Coach, please analyze my ${meal.mealType}: "${meal.meal_name}" (${meal.total_calories} kcal, ${meal.total_macros.protein_g}g Protein, ${meal.total_macros.carbs_g}g Carbs, ${meal.total_macros.fat_g}g Fat). Is it well balanced for my fitness goal (${profile.goal}), and what can I pair with it next?`
    );
    setIsCoachOpen(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 text-base">
      {/* Top Application Header */}
      <Header
        profile={profile}
        streakDays={streakInfo.currentStreak}
        streakInfo={streakInfo}
        speechSummary={speechSummary}
        onOpenStreakModal={() => setIsStreakModalOpen(true)}
        onOpenPlateScanner={() => openPlateScannerForType('Lunch')}
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStepModal={() => {
          setCurrentView('movement');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Primary Sub-Nav Bar - 100% Proportional Grid (Never Clipped) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 py-2.5 w-full max-w-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-base font-black transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base sm:text-xl">🍽️</span>
              <span className="truncate">Food</span>
            </button>

            <button
              onClick={() => setCurrentView('movement')}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-base font-black transition-all cursor-pointer ${
                currentView === 'movement'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base sm:text-xl">👟</span>
              <span className="truncate">Steps</span>
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-base font-black transition-all cursor-pointer ${
                currentView === 'analytics'
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base sm:text-xl">📈</span>
              <span className="truncate">Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 pb-28 md:pb-12 overflow-x-hidden">
        {/* VIEW 1: Main Dashboard (Net Calories + Food Timeline + Quick Step Widget) */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Visual Dual-Goal Streak Counter Banner */}
            <div className="bg-gradient-to-r from-amber-950/35 via-slate-900 to-slate-900 border border-amber-500/25 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsStreakModalOpen(true)}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
                  title="View Streak Details & Award"
                >
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center">
                    <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span className="text-xs font-black text-white leading-none mt-0.5">
                      {streakInfo.currentStreak}d
                    </span>
                  </div>
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                      <span>{streakInfo.currentStreak}-Day Dual Goal Streak</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {streakInfo.motivationalBadge.title}
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>
                      Consecutive days hitting <strong className="text-slate-200">both</strong> your step goal ({profile.stepGoal?.toLocaleString() || '10,000'} steps) &amp; calorie target ({targetCalories} kcal).
                    </span>
                    <button
                      onClick={() => setIsStreakModalOpen(true)}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-xs"
                    >
                      View Breakdown &rarr;
                    </button>
                  </p>
                </div>
              </div>

              {/* 7-Day Flame Matrix Strip - Proportional Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full md:w-auto self-stretch md:self-auto bg-slate-950/60 p-1.5 sm:p-2 rounded-xl border border-slate-800/80">
                {streakInfo.past7Days.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIsStreakModalOpen(true)}
                    className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer ${
                      day.isToday
                        ? 'border-cyan-500/50 bg-slate-800/90 ring-1 ring-cyan-500/30'
                        : day.bothMet
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60 opacity-60'
                    }`}
                    title={`${day.dayShort}: ${day.bothMet ? 'Both Goals Met' : day.isToday ? 'Today in progress' : 'Missed'}`}
                  >
                    <span className="text-[10px] font-bold text-slate-400">{day.dayShort}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs">
                      {day.bothMet ? (
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ) : day.isToday ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold">✕</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
                  onAskCoachAboutMeal={handleAskCoachAboutMeal}
                />
              </div>

              {/* Right Column: Mini Step Tracker Card + AI Coach Callout */}
              <div className="lg:col-span-5 space-y-6">
                {/* Movement Card Preview */}
                <StepMovementTracker
                  profile={profile}
                  currentSteps={todayLog.steps}
                  hourlySteps={todayLog.hourlySteps}
                  onAddSteps={handleAddSteps}
                  pedometer={pedometer}
                  compact
                />

                {/* Water Intake & Hydration Tracker */}
                <WaterTracker
                  waterMl={todayLog.waterMl ?? 0}
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
              onAddSteps={handleAddSteps}
              pedometer={pedometer}
              onBackToHome={() => setCurrentView('dashboard')}
            />

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white">How steps offset your calories</h4>
                <p className="text-xs text-slate-400 max-w-xl mt-1">
                  Walking burned <strong>+{todayLog.caloriesBurned} kcal</strong> today. These active calories are automatically added back into your net remaining food allowance!
                </p>
              </div>
              <button
                onClick={() => openPlateScannerForType('Dinner')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer shrink-0 min-h-[48px]"
              >
                Log Nutritious Dinner Plate
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Weekly & Monthly Analytics */}
        {currentView === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Back to Home Navigation Bar for Analytics */}
            <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 min-h-[48px]"
              >
                <span className="text-emerald-400 font-black text-sm">← Back to Home</span>
              </button>
              <span className="text-xs sm:text-sm font-black text-purple-300 flex items-center gap-1.5">
                <span>📈 Nutrition &amp; Step Trends</span>
              </span>
            </div>

            <AnalyticsCharts
              history={history}
              profile={profile}
              onLogWeight={handleLogWeight}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation - Giant, Colorful & Safe on All Phones */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t-2 border-slate-800 px-3 pt-2 flex items-center justify-around shadow-2xl"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)',
        }}
      >
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
            currentView === 'dashboard'
              ? 'text-emerald-300 font-black scale-105'
              : 'text-slate-400 hover:text-white font-bold'
          }`}
        >
          <span className="text-2xl">🍽️</span>
          <span className="text-xs font-black">Food</span>
        </button>

        <button
          onClick={() => setCurrentView('movement')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
            currentView === 'movement'
              ? 'text-cyan-300 font-black scale-105'
              : 'text-slate-400 hover:text-white font-bold'
          }`}
        >
          <span className="text-2xl">👟</span>
          <span className="text-xs font-black">Steps</span>
        </button>

        {/* GIANT CENTER SNAP BUTTON */}
        <button
          onClick={() => openPlateScannerForType('Lunch')}
          className="flex flex-col items-center -mt-8 cursor-pointer group active:scale-90 transition-transform min-h-[56px] min-w-[56px]"
          title="Take photo of food plate"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-500 p-0.5 shadow-2xl shadow-emerald-500/60 border-4 border-slate-950 flex items-center justify-center text-slate-950">
            <Camera className="w-8 h-8 stroke-[3]" />
          </div>
          <span className="text-xs font-black text-emerald-300 mt-1 uppercase tracking-wider">
            📸 Snap
          </span>
        </button>

        <button
          onClick={() => setIsCoachOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-purple-300 hover:text-purple-200 font-bold transition-all cursor-pointer min-h-[48px] min-w-[48px]"
        >
          <span className="text-2xl">🤖</span>
          <span className="text-xs font-black">Coach</span>
        </button>

        <button
          onClick={() => setCurrentView('analytics')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
            currentView === 'analytics'
              ? 'text-indigo-300 font-black scale-105'
              : 'text-slate-400 hover:text-white font-bold'
          }`}
        >
          <span className="text-2xl">📈</span>
          <span className="text-xs font-black">Reports</span>
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
        waterMl={todayLog.waterMl ?? 0}
        meals={todayLog.meals}
        initialPrompt={coachInitialPrompt}
        onClearInitialPrompt={() => setCoachInitialPrompt(null)}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={(updated) => setProfile(updated)}
      />

      {/* Visual Streak Counter Modal */}
      <StreakCounterModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakInfo={streakInfo}
        profile={profile}
        todaySteps={todayLog.steps}
        todayCalories={caloriesConsumed}
        targetCalories={targetCalories}
        onOpenCoach={() => {
          setIsCoachOpen(true);
          setCoachInitialPrompt(
            `Coach, I'm currently on a ${streakInfo.currentStreak}-day streak hitting both my calorie (${targetCalories} kcal) and step (${profile.stepGoal || 10000} steps) goals! What is your best advice to sustain this momentum without burnout?`
          );
        }}
      />

      {/* Connectivity & Offline Notification Toast */}
      <OfflineIndicator />
    </div>
  );
}
