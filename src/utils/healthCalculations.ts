import { UserProfile, FitnessGoal, ActivityLevel } from '../types';

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
