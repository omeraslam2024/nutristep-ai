import { UserProfile, FitnessGoal, ActivityLevel, DayLog, LoggedMeal } from '../types';
import { localDateKey } from './history';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

export function calculateBMR(profile: UserProfile): number {
  const { weightKg, heightCm, age, gender } = profile;
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const mult = ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.375;
  return Math.round(bmr * mult);
}

export function calculateTargetCalories(profile: UserProfile): number {
  if (profile.customCalorieTarget && profile.customCalorieTarget > 500) {
    return profile.customCalorieTarget;
  }
  const tdee = calculateTDEE(profile);
  switch (profile.goal) {
    case 'lose_weight':
      return Math.max(1200, Math.round(tdee - 500));
    case 'gain_muscle':
      return Math.round(tdee + 350);
    case 'maintain':
    default:
      return tdee;
  }
}

export function calculateMacroTargets(profile: UserProfile, targetCalories: number) {
  if (profile.customMacros) {
    return profile.customMacros;
  }

  let pPct = 0.3;
  let cPct = 0.45;
  let fPct = 0.25;

  if (profile.goal === 'lose_weight') {
    pPct = 0.35; // 35% protein for satiety & muscle retention
    cPct = 0.35;
    fPct = 0.3;
  } else if (profile.goal === 'gain_muscle') {
    pPct = 0.3;
    cPct = 0.5; // High carb for muscle glycogen & training energy
    fPct = 0.2;
  }

  const protein_g = Math.round((targetCalories * pPct) / 4);
  const carbs_g = Math.round((targetCalories * cPct) / 4);
  const fat_g = Math.round((targetCalories * fPct) / 9);

  return { protein_g, carbs_g, fat_g };
}

export function calculateStepMetrics(steps: number, weightKg: number, heightCm: number) {
  // Estimated stride length ~ 0.415 of height
  const strideMeters = (heightCm * 0.415) / 100;
  const distanceKm = Math.round(((steps * strideMeters) / 1000) * 100) / 100;
  const distanceMiles = Math.round(distanceKm * 0.621371 * 100) / 100;
  
  // MET calorie burn: ~0.75 kcal per kg per km
  const caloriesBurned = Math.round(weightKg * distanceKm * 0.75);
  // Average brisk cadence ~105 steps/min
  const activeMinutes = Math.round(steps / 105);

  return {
    distanceKm,
    distanceMiles,
    caloriesBurned,
    activeMinutes,
  };
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { ft, in: inches };
}

export function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
}

export interface StreakDaySummary {
  date: string;
  dayLabel: string;
  dayShort: string;
  steps: number;
  stepGoal: number;
  stepMet: boolean;
  caloriesConsumed: number;
  calorieTarget: number;
  calMet: boolean;
  bothMet: boolean;
  isToday: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isTodayComplete: boolean;
  todayStepsMet: boolean;
  todayCalMet: boolean;
  past7Days: StreakDaySummary[];
  motivationalBadge: {
    title: string;
    description: string;
    icon: string;
    color: string;
  };
}

export function isDayCalorieGoalMet(
  consumed: number,
  targetCalories: number,
  goal: FitnessGoal,
  caloriesBurned = 0
): boolean {
  if (consumed === 0) return false;
  if (goal === 'lose_weight') {
    const net = consumed - caloriesBurned;
    return consumed <= targetCalories + 150 || net <= targetCalories;
  } else if (goal === 'gain_muscle') {
    return consumed >= targetCalories - 150;
  } else {
    return Math.abs(consumed - targetCalories) <= 300;
  }
}

export function calculateStreakInfo(history: DayLog[], profile: UserProfile): StreakInfo {
  const targetCalories = calculateTargetCalories(profile);
  const stepGoal = profile.stepGoal || 10000;

  const evaluatedDays = history.map((day, index) => {
    const isToday = index === history.length - 1;
    const consumed = day.meals.reduce((sum: number, m: LoggedMeal) => sum + m.total_calories, 0);
    const stepMet = day.steps >= stepGoal;
    const calMet = isDayCalorieGoalMet(consumed, targetCalories, profile.goal, day.caloriesBurned);
    const bothMet = stepMet && calMet;

    const dateObj = new Date(day.date + 'T00:00:00');
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    return {
      date: day.date,
      dayLabel,
      dayShort,
      steps: day.steps,
      stepGoal,
      stepMet,
      caloriesConsumed: consumed,
      calorieTarget: targetCalories,
      calMet,
      bothMet,
      isToday,
    };
  });

  const todayEval = evaluatedDays[evaluatedDays.length - 1];
  const isTodayComplete = todayEval ? todayEval.bothMet : false;

  let currentStreak = 0;
  let startIndex = evaluatedDays.length - 1;
  if (!isTodayComplete) {
    startIndex = evaluatedDays.length - 2;
  }

  for (let i = startIndex; i >= 0; i--) {
    if (evaluatedDays[i]?.bothMet) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let running = 0;
  for (const day of evaluatedDays) {
    if (day.bothMet) {
      running++;
      if (running > longestStreak) longestStreak = running;
    } else {
      running = 0;
    }
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // The last 7 calendar days; days before the first log show as missed.
  const byDate = new Map(evaluatedDays.map((d) => [d.date, d]));
  const past7Days: StreakDaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = localDateKey(d);
    return (
      byDate.get(date) ?? {
        date,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
        steps: 0,
        stepGoal,
        stepMet: false,
        caloriesConsumed: 0,
        calorieTarget: targetCalories,
        calMet: false,
        bothMet: false,
        isToday: i === 6,
      }
    );
  });

  // Milestone badge
  let motivationalBadge = {
    title: 'Streak Starter',
    description: 'Log both goals today to ignite your streak!',
    icon: '🔥',
    color: 'from-amber-500 to-orange-500',
  };

  if (currentStreak >= 30) {
    motivationalBadge = {
      title: 'Fitness Titan',
      description: '30+ Days of flawless consistency!',
      icon: '👑',
      color: 'from-yellow-400 to-amber-500',
    };
  } else if (currentStreak >= 14) {
    motivationalBadge = {
      title: 'Iron Consistency',
      description: '2 Full weeks of hitting both nutrition & movement targets!',
      icon: '⚡',
      color: 'from-cyan-400 to-blue-500',
    };
  } else if (currentStreak >= 7) {
    motivationalBadge = {
      title: '7-Day Warrior',
      description: 'A full week streak! Your metabolism is firing.',
      icon: '🏆',
      color: 'from-emerald-400 to-teal-500',
    };
  } else if (currentStreak >= 3) {
    motivationalBadge = {
      title: 'Habit Ignited',
      description: '3+ Days in a row! Momentum is on your side.',
      icon: '🔥',
      color: 'from-amber-400 to-rose-500',
    };
  } else if (currentStreak >= 1) {
    motivationalBadge = {
      title: 'Streak Active',
      description: 'Great start! Keep the streak alive today.',
      icon: '✨',
      color: 'from-amber-500 to-yellow-500',
    };
  }

  return {
    currentStreak,
    longestStreak,
    isTodayComplete,
    todayStepsMet: todayEval?.stepMet || false,
    todayCalMet: todayEval?.calMet || false,
    past7Days,
    motivationalBadge,
  };
}
