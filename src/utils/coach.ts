import { DayLog, MealType, UserProfile } from '../types';
import { FOODS, FoodPick } from '../data/foods';
import { calculateMacroTargets, calculateTargetCalories } from './healthCalculations';

/**
 * The offline coach: suggestions worked out from today's numbers and the Quick picks list, on the
 * phone, with no AI service. Every tip says why it is suggested.
 */
export interface CoachTip {
  id: string;
  kind: 'meal' | 'move' | 'water' | 'protein' | 'praise';
  title: string;
  body: string;
}

export interface CoachAdvice {
  nextMeal: MealType;
  /** kcal that fit the next meal without going over the day's budget. */
  mealBudget: number;
  ideas: FoodPick[];
  tips: CoachTip[];
}

/** Share of the day's calories usually eaten at each meal. */
const MEAL_SHARE: Record<MealType, number> = { Breakfast: 0.25, Lunch: 0.35, Snack: 0.1, Dinner: 0.3 };

export function nextMealFor(hour: number, loggedTypes: Set<MealType>): MealType {
  const order: [MealType, number][] = [
    ['Breakfast', 11],
    ['Lunch', 16],
    ['Snack', 18],
    ['Dinner', 24],
  ];
  for (const [meal, until] of order) {
    if (hour < until && !loggedTypes.has(meal)) return meal;
  }
  return hour >= 21 ? 'Snack' : 'Dinner';
}

export function buildCoachAdvice(profile: UserProfile, today: DayLog, history: DayLog[], now: Date = new Date()): CoachAdvice {
  const target = calculateTargetCalories(profile);
  const macros = calculateMacroTargets(profile, target);
  const eaten = today.meals.reduce((s, m) => s + m.total_calories, 0);
  const protein = today.meals.reduce((s, m) => s + m.total_macros.protein_g, 0);
  const left = target + today.caloriesBurned - eaten;
  const hour = now.getHours();
  const nextMeal = nextMealFor(hour, new Set(today.meals.map((m) => m.mealType)));
  const mealBudget = Math.max(0, Math.min(left, Math.round(target * MEAL_SHARE[nextMeal] * 1.15)));
  const proteinShort = protein < macros.protein_g * (hour < 14 ? 0.25 : 0.55);

  // Cuisines the user has logged before (quick picks carry their cuisine as a tag) come first.
  const liked = new Map<string, number>();
  for (const d of history.slice(-30)) {
    for (const m of d.meals) for (const flag of m.dietary_flags ?? []) liked.set(flag, (liked.get(flag) ?? 0) + 1);
  }
  const ideas = FOODS.filter((f) => f.meals.includes(nextMeal) && f.kcal <= Math.max(mealBudget, 150))
    .map((f) => ({
      f,
      score:
        Math.min(liked.get(f.cuisine) ?? 0, 5) * 6 +
        (proteinShort ? (f.protein * 4) / f.kcal * 20 : 0) +
        // prefer dishes that use the budget well, not tiny ones
        (f.kcal / Math.max(mealBudget, 1)) * 5,
    }))
    .sort((a, b) => b.score - a.score || a.f.kcal - b.f.kcal)
    .slice(0, 4)
    .map((x) => x.f);

  const tips: CoachTip[] = [];
  const stepGoal = profile.stepGoal || 10000;
  const stepsLeft = stepGoal - today.steps;

  if (left < 0) {
    const walkMin = Math.round((Math.abs(left) / 100) * 20);
    tips.push({
      id: 'over',
      kind: 'move',
      title: `${Math.abs(left)} kcal over budget`,
      body: `A ${walkMin}-minute brisk walk burns about that much — or keep the next meal light.`,
    });
  } else if (stepsLeft > 0) {
    const minutes = Math.max(5, Math.round(stepsLeft / 100));
    tips.push({
      id: 'steps',
      kind: 'move',
      title: `${stepsLeft.toLocaleString()} steps to your goal`,
      body:
        hour >= 19
          ? `A ${Math.min(minutes, 30)}-minute walk after dinner gets you most of the way, and helps digestion.`
          : `That is about ${minutes} minutes of brisk walking — try 10 minutes after each meal.`,
    });
  } else {
    tips.push({ id: 'steps-done', kind: 'praise', title: 'Step goal reached', body: 'Every extra step now earns a little more food. Nice work!' });
  }

  if (proteinShort) {
    tips.push({
      id: 'protein',
      kind: 'protein',
      title: 'Add some protein',
      body: `You have had ${Math.round(protein)} g of ${macros.protein_g} g. Eggs, daal, chicken, yogurt or chana are easy wins.`,
    });
  }

  const water = today.waterMl ?? 0;
  const waterGoal = profile.waterTargetMl || 2500;
  if (water < waterGoal * Math.min(1, (hour - 7) / 14)) {
    const glasses = Math.ceil((waterGoal - water) / 250);
    tips.push({ id: 'water', kind: 'water', title: `${glasses} more glasses of water`, body: 'A glass before each meal also helps you feel full sooner.' });
  }

  return { nextMeal, mealBudget, ideas, tips };
}
