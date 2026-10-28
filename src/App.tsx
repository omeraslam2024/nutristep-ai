import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, Camera, Footprints, House, UserRound } from 'lucide-react';
import { HomeView, defaultMealType } from './components/HomeView';
import { StepsView } from './components/StepsView';
import { ProfileView } from './components/ProfileView';
import { Onboarding } from './components/Onboarding';
import { PlateScannerModal } from './components/PlateScannerModal';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { StepsReport } from './components/StepsReport';
import { CoachSheet } from './components/CoachSheet';
import { ChallengesSheet } from './components/ChallengesSheet';
import { buildCoachAdvice } from './utils/coach';
import { ActiveChallenge, evaluateChallenge, loadChallenge, saveChallenge } from './utils/challenges';
import { FoodPick } from './data/foods';
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
import { useBackToClose } from './utils/useBackToClose';

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
  const [isCoachTipsOpen, setIsCoachTipsOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [challenge, setChallengeState] = useState<ActiveChallenge | null>(() => loadChallenge());
  const setChallenge = (c: ActiveChallenge | null) => {
    saveChallenge(c);
    setChallengeState(c);
  };
  const [toast, setToast] = useState<{ text: string; action?: { label: string; run: () => void } } | null>(null);

  // Android back: close the open sheet first, then return to Home, then leave the app.
  useBackToClose(view !== 'home', () => setView('home'));
  useBackToClose(isPlateScannerOpen, () => setIsPlateScannerOpen(false));
  useBackToClose(isCoachOpen, () => setIsCoachOpen(false));
  useBackToClose(isSettingsOpen, () => setIsSettingsOpen(false));
  useBackToClose(isStreakModalOpen, () => setIsStreakModalOpen(false));
  useBackToClose(isCoachTipsOpen, () => setIsCoachTipsOpen(false));
  useBackToClose(isChallengesOpen, () => setIsChallengesOpen(false));

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
  const coachAdvice = buildCoachAdvice(profile, todayLog, history);
  const challengeProgress = challenge ? evaluateChallenge(challenge, history, profile) : null;
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

  const handleLogFood = (food: FoodPick, mealType: MealType) =>
    handleMealLogged({
      id: `meal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mealType,
      meal_name: food.name,
      total_calories: food.kcal,
      total_macros: { protein_g: food.protein, carbs_g: food.carbs, fat_g: food.fat, fiber_g: 0 },
      detected_items: [],
      dietary_flags: [food.cuisine],
      source: 'sample',
    });

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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-ink flex flex-col font-sans">
      <main
        className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-6 pb-32 overflow-x-hidden"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1.25rem)' }}
      >
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
                onOpenProfile={() => goTo('profile')}
                onOpenCoach={() => setIsCoachTipsOpen(true)}
                coachPreview={coachAdvice.tips[0]?.title ?? `${coachAdvice.nextMeal} ideas for you`}
                onOpenChallenges={() => setIsChallengesOpen(true)}
                challenge={
                  challengeProgress
                    ? {
                        title: challengeProgress.def.title,
                        subtitle: challengeProgress.finished
                          ? `Finished · ${challengeProgress.done} green days`
                          : `Day ${challengeProgress.dayNumber} of ${challengeProgress.def.days} · ${challengeProgress.done} green`,
                        pct: Math.round((challengeProgress.done / challengeProgress.def.days) * 100),
                      }
                    : null
                }
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
              <div className="space-y-4">
                <header className="pt-1">
                  <p className="text-sm text-slate-400">Trends</p>
                  <h1 className="font-display text-[28px] leading-tight font-semibold text-ink">Reports</h1>
                </header>
                <StepsReport history={history} stepGoal={profile.stepGoal || 10000} />
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
                onOpenChallenges={() => setIsChallengesOpen(true)}
                onShare={shareToday}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation — the same five destinations on every screen */}
      <nav
        aria-label="Main"
        className="fixed bottom-0 inset-x-0 z-40 bg-slate-900 rounded-t-[1.75rem] shadow-[0_-8px_30px_-12px_rgb(80_40_20/0.25)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
      >
        <div className="max-w-xl mx-auto grid grid-cols-5 items-end px-2 pt-2">
          <NavItem icon={House} label="Home" active={view === 'home'} tint="bg-peach text-coral-ink" onClick={() => goTo('home')} />
          <NavItem icon={Footprints} label="Steps" active={view === 'steps'} tint="bg-mint text-leaf-ink" onClick={() => goTo('steps')} />
          <div className="flex justify-center">
            <button
              onClick={() => openScanner(defaultMealType())}
              aria-label={AI_ENABLED ? 'Snap your plate' : 'Log food'}
              className="-mt-8 w-16 h-16 rounded-[1.4rem] bg-coral text-[#ffffff] flex items-center justify-center shadow-lg shadow-[#ff7e5f]/40 active:scale-90 transition-transform cursor-pointer"
            >
              <Camera className="w-7 h-7" strokeWidth={2.4} />
            </button>
          </div>
          <NavItem icon={BarChart3} label="Reports" active={view === 'reports'} tint="bg-lilac text-lilac-ink" onClick={() => goTo('reports')} />
          <NavItem icon={UserRound} label="Profile" active={view === 'profile'} tint="bg-butter text-butter-ink" onClick={() => goTo('profile')} />
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
                className="px-4 py-2 rounded-xl btn-primary text-sm font-bold min-h-[44px] cursor-pointer"
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

      <CoachSheet
        open={isCoachTipsOpen}
        onClose={() => setIsCoachTipsOpen(false)}
        profile={profile}
        today={todayLog}
        history={history}
        onLog={handleLogFood}
        onOpenAiChat={() => {
          setIsCoachTipsOpen(false);
          askCoach(null);
        }}
      />

      <ChallengesSheet
        open={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        active={challenge}
        onChange={setChallenge}
        history={history}
        profile={profile}
      />

      <OfflineIndicator />
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ElementType; label: string; active: boolean; tint: string; onClick: () => void }> = ({
  icon: Icon,
  label,
  active,
  tint,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`relative flex flex-col items-center justify-center gap-1 h-14 cursor-pointer transition-colors ${
      active ? 'text-ink' : 'text-slate-400'
    }`}
  >
    <span className="relative w-12 h-8 flex items-center justify-center">
      {active && (
        <motion.span
          layoutId="nav-pill"
          className={`absolute inset-0 rounded-full ${tint.split(' ')[0]}`}
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <Icon className={`relative w-[22px] h-[22px] ${active ? tint.split(' ')[1] : ''}`} strokeWidth={active ? 2.4 : 2} />
    </span>
    <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </button>
);
