import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, Camera, Flame, Footprints, House, UserRound } from 'lucide-react';
import { HomeView, defaultMealType } from './components/HomeView';
import { StepsView } from './components/StepsView';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { PlateScannerModal } from './components/PlateScannerModal';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AiCoachDrawer } from './components/AiCoachDrawer';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StreakCounterModal } from './components/StreakCounterModal';
import { UserProfile, DayLog, LoggedMeal, MealType } from './types';
import { calculateStepMetrics, calculateStreakInfo, calculateTargetCalories } from './utils/healthCalculations';
import { loadStoredProfile, saveStoredProfile, loadStoredHistory, saveStoredHistory } from './utils/offlineStorage';
import { ensureToday, stripSeedData } from './utils/history';
import { usePedometer } from './utils/pedometer/usePedometer';
import { useTheme } from './utils/theme';
import { AI_ENABLED } from './utils/features';
import { speakText } from './utils/speechHelper';
import { renderShareCard } from './utils/shareCard';
import { shareFile } from './utils/share';

type View = 'home' | 'steps' | 'reports' | 'profile';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredProfile());
  const [history, setHistory] = useState<DayLog[]>(() => ensureToday(stripSeedData(loadStoredHistory()).history));
  const [view, setView] = useState<View>('home');
  const theme = useTheme();

  const [isPlateScannerOpen, setIsPlateScannerOpen] = useState(false);
  const [scannerMealType, setScannerMealType] = useState<MealType>('Lunch');
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachInitialPrompt, setCoachInitialPrompt] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; action?: { label: string; run: () => void } } | null>(null);

  useEffect(() => saveStoredProfile(profile), [profile]);
  useEffect(() => saveStoredHistory(history), [history]);

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
  const caloriesConsumed = todayLog.meals.reduce((s, m) => s + m.total_calories, 0);
  const macroSum = (k: 'protein_g' | 'carbs_g' | 'fat_g') =>
    Math.round(todayLog.meals.reduce((s, m) => s + m.total_macros[k], 0) * 10) / 10;
  const streakInfo = calculateStreakInfo(history, profile);
  const targetCalories = calculateTargetCalories(profile);
  const netRemaining = targetCalories - caloriesConsumed + todayLog.caloriesBurned;

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

  const openScanner = (type: MealType) => {
    setScannerMealType(type);
    setIsPlateScannerOpen(true);
  };

  const askCoach = (prompt: string | null) => {
    if (!AI_ENABLED) return;
    setCoachInitialPrompt(prompt);
    setIsCoachOpen(true);
  };

  const goTo = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareToday = async () => {
    try {
      const blob = await renderShareCard({
        name: profile.name,
        dateLabel: new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
        steps: todayLog.steps,
        stepGoal: profile.stepGoal || 10000,
        distanceKm: todayLog.distanceKm,
        eaten: caloriesConsumed,
        burned: todayLog.caloriesBurned,
        streak: streakInfo.currentStreak,
        mealsLogged: todayLog.meals.length,
      });
      await shareFile(blob, `nutristep-${todayLog.date}.jpg`, `My day on NutriStep: ${todayLog.steps.toLocaleString()} steps 💪`);
    } catch {
      setToast({ text: 'Could not open sharing on this device.' });
    }
  };

  const speakSummary = () =>
    speakText(
      `${profile.name ? `Hello ${profile.name.split(' ')[0]}. ` : ''}You have ${Math.max(0, netRemaining)} calories left today and ${todayLog.steps.toLocaleString()} steps. Your streak is ${streakInfo.currentStreak} days.`
    );

  // Milestone: offer to share the moment the step goal is crossed.
  const prevSteps = useRef(todayLog.steps);
  useEffect(() => {
    const goal = profile.stepGoal || 10000;
    if (prevSteps.current < goal && todayLog.steps >= goal) {
      setToast({ text: `${goal.toLocaleString()} steps — goal reached!`, action: { label: 'Share', run: shareToday } });
    }
    prevSteps.current = todayLog.steps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayLog.steps]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!profile.onboarded) {
    return (
      <Onboarding
        initial={profile}
        pedometer={pedometer}
        onDone={(p) => {
          setProfile(p);
          setView('home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-white flex flex-col font-sans">
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => goTo('home')} className="flex items-center gap-2.5 cursor-pointer" aria-label="NutriStep home">
            <span className="w-9 h-9 rounded-xl bg-[#ffffff] p-1 shadow-sm flex items-center justify-center">
              <img src="/icon.svg" alt="" className="w-full h-full" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Nutri<span className="text-emerald-400">Step</span>
            </span>
          </button>
          <button
            onClick={() => setIsStreakModalOpen(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-amber-500/15 text-amber-400 text-sm font-bold cursor-pointer active:scale-95 transition-transform"
            aria-label={`${streakInfo.currentStreak}-day streak, view details`}
          >
            <Flame className="w-4 h-4 fill-amber-400/40" />
            <span className="tabular-nums">{streakInfo.currentStreak}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-2 pb-32 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === 'home' && (
              <HomeView
                profile={profile}
                today={todayLog}
                streakInfo={streakInfo}
                pedometer={pedometer}
                onOpenScanner={openScanner}
                onOpenSteps={() => goTo('steps')}
                onOpenStreak={() => setIsStreakModalOpen(true)}
                onOpenCoach={() => askCoach(null)}
                onShare={shareToday}
                onSpeak={speakSummary}
                onDeleteMeal={handleDeleteMeal}
                onAskCoachAboutMeal={(meal) =>
                  askCoach(
                    `Coach, please analyze my ${meal.mealType}: "${meal.meal_name}" (${meal.total_calories} kcal, ${meal.total_macros.protein_g}g protein, ${meal.total_macros.carbs_g}g carbs, ${meal.total_macros.fat_g}g fat). Is it balanced for my goal (${profile.goal}), and what should I pair with it next?`
                  )
                }
                onUpdateWater={handleUpdateWater}
              />
            )}
            {view === 'steps' && (
              <StepsView
                profile={profile}
                steps={todayLog.steps}
                hourlySteps={todayLog.hourlySteps}
                pedometer={pedometer}
                onAddSteps={handleAddSteps}
              />
            )}
            {view === 'reports' && (
              <div className="space-y-5">
                <div className="px-1">
                  <p className="text-sm text-slate-400">Trends</p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Reports</h2>
                </div>
                <AnalyticsCharts history={history} profile={profile} onLogWeight={handleLogWeight} />
              </div>
            )}
            {view === 'profile' && (
              <ProfileView
                profile={profile}
                streakInfo={streakInfo}
                themePref={theme.pref}
                onThemeChange={theme.setPref}
                pedometer={pedometer}
                onEditProfile={() => setIsSettingsOpen(true)}
                onShare={shareToday}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation — the same five destinations on every screen */}
      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
      >
        <div className="max-w-xl mx-auto grid grid-cols-5 items-end px-2 pt-1.5">
          <NavItem icon={House} label="Home" active={view === 'home'} onClick={() => goTo('home')} />
          <NavItem icon={Footprints} label="Steps" active={view === 'steps'} onClick={() => goTo('steps')} />
          <div className="flex justify-center">
            <button
              onClick={() => openScanner(defaultMealType())}
              aria-label={AI_ENABLED ? 'Snap your plate' : 'Log food'}
              className="-mt-7 w-16 h-16 rounded-[1.4rem] bg-brand-lime on-brand flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-slate-950 active:scale-90 transition-transform cursor-pointer"
            >
              <Camera className="w-7 h-7" strokeWidth={2.4} />
            </button>
          </div>
          <NavItem icon={BarChart3} label="Reports" active={view === 'reports'} onClick={() => goTo('reports')} />
          <NavItem icon={UserRound} label="Profile" active={view === 'profile'} onClick={() => goTo('profile')} />
        </div>
      </nav>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-4 bottom-28 z-50 max-w-md mx-auto surface px-4 py-3 flex items-center gap-3"
          >
            <span className="flex-1 text-sm font-semibold text-white">{toast.text}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.run();
                  setToast(null);
                }}
                className="px-4 py-2 rounded-xl bg-brand-lime on-brand text-sm font-bold min-h-[44px] cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PlateScannerModal
        isOpen={isPlateScannerOpen}
        onClose={() => setIsPlateScannerOpen(false)}
        onMealLogged={handleMealLogged}
        defaultMealType={scannerMealType}
        key={scannerMealType}
      />

      {AI_ENABLED && (
        <AiCoachDrawer
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          profile={profile}
          caloriesConsumed={caloriesConsumed}
          caloriesBurned={todayLog.caloriesBurned}
          steps={todayLog.steps}
          proteinConsumed={macroSum('protein_g')}
          carbsConsumed={macroSum('carbs_g')}
          fatConsumed={macroSum('fat_g')}
          waterMl={todayLog.waterMl ?? 0}
          meals={todayLog.meals}
          initialPrompt={coachInitialPrompt}
          onClearInitialPrompt={() => setCoachInitialPrompt(null)}
        />
      )}

      {isSettingsOpen && (
        <ProfileSettingsModal
          isOpen
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onSaveProfile={(updated) => setProfile(updated)}
        />
      )}

      <StreakCounterModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakInfo={streakInfo}
        profile={profile}
        todaySteps={todayLog.steps}
        todayCalories={caloriesConsumed}
        targetCalories={targetCalories}
        onOpenCoach={!AI_ENABLED ? undefined : () => {
          setIsStreakModalOpen(false);
          askCoach(
            `Coach, I'm on a ${streakInfo.currentStreak}-day streak hitting both my calorie (${targetCalories} kcal) and step (${profile.stepGoal || 10000} steps) goals. How do I keep it going without burning out?`
          );
        }}
      />

      <OfflineIndicator />
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ElementType; label: string; active: boolean; onClick: () => void }> = ({
  icon: Icon,
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`relative flex flex-col items-center justify-center gap-1 h-14 rounded-2xl cursor-pointer transition-colors ${
      active ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
    }`}
  >
    {active && (
      <motion.span
        layoutId="nav-pill"
        className="absolute top-1 w-12 h-8 rounded-full bg-emerald-500/15"
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
      />
    )}
    <Icon className="relative w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 2} />
    <span className={`relative text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </button>
);
