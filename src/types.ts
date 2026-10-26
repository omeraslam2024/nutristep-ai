export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface MealItem {
  id: string;
  item_name: string;
  estimated_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
  confidence?: number;
  visual_clues?: string;
}

export interface LoggedMeal {
  id: string;
  timestamp: string; // ISO string
  mealType: MealType;
  meal_name: string;
  confidence_score?: number;
  total_calories: number;
  total_macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg?: number;
  };
  detected_items: MealItem[];
  dietary_flags?: string[];
  nutritionist_tip?: string;
  image_url?: string;
  source: 'camera' | 'upload' | 'sample' | 'voice' | 'barcode' | 'manual';
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
export type FitnessGoal = 'lose_weight' | 'maintain' | 'gain_muscle';
export type UnitSystem = 'metric' | 'imperial';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  stepGoal: number;
  waterTargetMl?: number; // Target water in ml (default 2500ml = 10 glasses of 250ml)
  unitSystem: UnitSystem;
  customCalorieTarget?: number;
  customMacros?: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface HourlyStep {
  hour: number; // 0-23
  steps: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  steps: number;
  activeMinutes: number;
  distanceKm: number;
  caloriesBurned: number;
  hourlySteps: HourlyStep[];
  meals: LoggedMeal[];
  weightLogged?: number;
  waterMl?: number; // Total water intake today in ml
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SamplePlate {
  id: string;
  title: string;
  subtitle: string;
  mealType: MealType;
  image_url: string;
  fallbackData: {
    meal_name: string;
    confidence_score: number;
    total_calories: number;
    total_macros: {
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
      sodium_mg: number;
    };
    detected_items: Omit<MealItem, 'id'>[];
    dietary_flags: string[];
    nutritionist_tip: string;
  };
}
