import { MealType } from '../types';

/**
 * Quick picks: common dishes with typical nutrition for one usual serving. Values are averages
 * from standard food tables and restaurant/home recipes — real dishes vary, so the user can scale
 * the portion before saving.
 *
 * Each dish is tagged with the meals it is usually eaten at, so the Breakfast list shows breakfast
 * food, Dinner shows dinner food, and so on.
 */
export type Cuisine = 'Pakistani' | 'Indian' | 'Chinese' | 'Thai' | 'Asian' | 'Continental' | 'American' | 'Everyday';

export const CUISINES: Cuisine[] = ['Pakistani', 'Indian', 'Chinese', 'Thai', 'Asian', 'Continental', 'American', 'Everyday'];

export interface FoodPick {
  id: string;
  name: string;
  cuisine: Cuisine;
  meals: MealType[];
  /** What one serving means, in words. */
  serving: string;
  /** Approximate weight of that serving in grams (for portion scaling). */
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}

const B: MealType = 'Breakfast';
const L: MealType = 'Lunch';
const D: MealType = 'Dinner';
const S: MealType = 'Snack';

type Row = [id: string, name: string, cuisine: Cuisine, meals: MealType[], serving: string, grams: number, kcal: number, p: number, c: number, f: number, emoji: string];

const ROWS: Row[] = [
  // ── Pakistani ──────────────────────────────────────────────────────────
  ['pk-halwa-puri', 'Halwa puri with chanay', 'Pakistani', [B], '2 puri, halwa, chanay', 380, 950, 20, 120, 45, '🫓'],
  ['pk-aloo-paratha', 'Aloo paratha', 'Pakistani', [B], '1 paratha', 150, 320, 7, 42, 14, '🫓'],
  ['pk-anda-paratha', 'Anda paratha', 'Pakistani', [B], '1 paratha + fried egg', 180, 450, 14, 40, 26, '🍳'],
  ['pk-plain-paratha', 'Plain paratha', 'Pakistani', [B], '1 paratha', 100, 260, 5, 32, 12, '🫓'],
  ['pk-khageena', 'Khageena (desi scrambled eggs)', 'Pakistani', [B], '2 eggs', 140, 250, 14, 4, 20, '🍳'],
  ['pk-desi-omelette', 'Desi omelette', 'Pakistani', [B], '2 eggs', 130, 220, 13, 3, 17, '🍳'],
  ['pk-chai', 'Doodh patti chai', 'Pakistani', [B, S], '1 cup, with sugar', 200, 120, 4, 14, 5, '☕'],
  ['pk-lassi', 'Sweet lassi', 'Pakistani', [B, S], '1 glass', 300, 250, 8, 38, 7, '🥛'],
  ['pk-nihari', 'Nihari with naan', 'Pakistani', [B, D], '1 bowl + 1 naan', 450, 830, 38, 62, 46, '🍲'],
  ['pk-paye', 'Paye with naan', 'Pakistani', [B, D], '1 bowl + 1 naan', 450, 760, 34, 58, 42, '🍲'],
  ['pk-chicken-biryani', 'Chicken biryani', 'Pakistani', [L, D], '1 plate', 350, 650, 30, 75, 24, '🍛'],
  ['pk-daal-chawal', 'Daal chawal', 'Pakistani', [L], '1 plate', 400, 520, 18, 88, 10, '🍛'],
  ['pk-chicken-pulao', 'Chicken pulao', 'Pakistani', [L], '1 plate', 350, 550, 26, 72, 17, '🍚'],
  ['pk-aloo-gosht', 'Aloo gosht with 2 roti', 'Pakistani', [L, D], '1 bowl + 2 roti', 450, 650, 30, 62, 30, '🍲'],
  ['pk-kadhi-chawal', 'Kadhi pakora with rice', 'Pakistani', [L], '1 plate', 400, 560, 15, 78, 20, '🍛'],
  ['pk-mix-sabzi', 'Mix sabzi with 2 roti', 'Pakistani', [L], '1 bowl + 2 roti', 350, 450, 12, 60, 17, '🥘'],
  ['pk-chicken-karahi', 'Chicken karahi', 'Pakistani', [D], '1 serving', 300, 520, 38, 10, 36, '🍲'],
  ['pk-mutton-karahi', 'Mutton karahi', 'Pakistani', [D], '1 serving', 300, 600, 36, 8, 46, '🍲'],
  ['pk-haleem', 'Haleem', 'Pakistani', [D, L], '1 bowl', 300, 450, 26, 40, 20, '🥣'],
  ['pk-seekh-kebab', 'Seekh kebab', 'Pakistani', [D], '4 kebabs', 180, 360, 28, 4, 26, '🍢'],
  ['pk-chicken-tikka', 'Chicken tikka', 'Pakistani', [D], '1 leg piece', 220, 300, 35, 3, 15, '🍗'],
  ['pk-saag-makki', 'Saag with makki roti', 'Pakistani', [D], '1 bowl + 1 roti', 350, 520, 14, 58, 25, '🥬'],
  ['pk-qeema-matar', 'Qeema matar with 2 roti', 'Pakistani', [D, L], '1 bowl + 2 roti', 400, 620, 32, 52, 30, '🍲'],
  ['pk-roti', 'Roti / chapati', 'Pakistani', [B, L, D], '1 roti', 40, 120, 4, 22, 2, '🫓'],
  ['pk-naan', 'Naan', 'Pakistani', [L, D], '1 naan', 90, 280, 8, 48, 6, '🫓'],
  ['pk-samosa', 'Samosa', 'Pakistani', [S], '1 piece', 80, 260, 5, 28, 15, '🥟'],
  ['pk-pakora', 'Pakoray', 'Pakistani', [S], '5 pieces', 100, 280, 8, 26, 16, '🧆'],
  ['pk-chana-chaat', 'Chana chaat', 'Pakistani', [S], '1 plate', 200, 250, 10, 40, 6, '🥗'],
  ['pk-dahi-bhalla', 'Dahi bhallay', 'Pakistani', [S], '1 plate', 220, 300, 10, 42, 10, '🥣'],
  ['pk-gol-gappay', 'Gol gappay', 'Pakistani', [S], '6 pieces', 150, 220, 5, 36, 7, '🫧'],
  ['pk-bun-kebab', 'Bun kebab', 'Pakistani', [S], '1 bun', 170, 350, 14, 38, 16, '🍔'],
  ['pk-jalebi', 'Jalebi', 'Pakistani', [S], '100 g', 100, 380, 3, 60, 15, '🍥'],
  ['pk-kheer', 'Kheer', 'Pakistani', [S], '1 bowl', 200, 300, 8, 45, 10, '🍮'],

  // ── Indian ─────────────────────────────────────────────────────────────
  ['in-masala-dosa', 'Masala dosa', 'Indian', [B], '1 dosa with sambar', 300, 390, 8, 55, 15, '🌯'],
  ['in-idli-sambar', 'Idli with sambar', 'Indian', [B], '3 idli + sambar', 300, 280, 10, 55, 3, '🍚'],
  ['in-poha', 'Poha', 'Indian', [B], '1 plate', 200, 270, 6, 45, 8, '🍚'],
  ['in-upma', 'Upma', 'Indian', [B], '1 bowl', 200, 250, 6, 38, 8, '🥣'],
  ['in-chole-bhature', 'Chole bhature', 'Indian', [L, B], '2 bhature + chole', 350, 650, 18, 80, 28, '🫓'],
  ['in-rajma-chawal', 'Rajma chawal', 'Indian', [L], '1 plate', 400, 500, 17, 85, 9, '🍛'],
  ['in-veg-thali', 'Veg thali', 'Indian', [L], '1 thali', 550, 750, 22, 105, 26, '🍱'],
  ['in-paneer-butter', 'Paneer butter masala with 2 roti', 'Indian', [L, D], '1 bowl + 2 roti', 380, 640, 22, 52, 38, '🧀'],
  ['in-butter-chicken', 'Butter chicken with naan', 'Indian', [D], '1 bowl + 1 naan', 420, 780, 40, 60, 42, '🍛'],
  ['in-palak-paneer', 'Palak paneer', 'Indian', [D], '1 bowl', 250, 330, 16, 12, 24, '🥬'],
  ['in-dal-makhani', 'Dal makhani', 'Indian', [D], '1 bowl', 250, 350, 13, 32, 19, '🍲'],
  ['in-tikka-masala', 'Chicken tikka masala', 'Indian', [D], '1 bowl', 300, 450, 36, 14, 28, '🍛'],
  ['in-veg-biryani', 'Veg biryani', 'Indian', [L, D], '1 plate', 350, 450, 10, 72, 14, '🍚'],
  ['in-pav-bhaji', 'Pav bhaji', 'Indian', [S, D], '2 pav + bhaji', 300, 400, 10, 55, 16, '🍞'],
  ['in-vada-pav', 'Vada pav', 'Indian', [S], '1 piece', 150, 300, 7, 42, 12, '🍔'],
  ['in-dhokla', 'Dhokla', 'Indian', [S, B], '4 pieces', 120, 160, 6, 26, 4, '🧽'],
  ['in-bhel-puri', 'Bhel puri', 'Indian', [S], '1 plate', 150, 250, 6, 40, 8, '🥗'],

  // ── Chinese ────────────────────────────────────────────────────────────
  ['cn-congee', 'Chicken congee', 'Chinese', [B], '1 bowl', 400, 250, 14, 38, 4, '🥣'],
  ['cn-bao', 'Steamed bao buns', 'Chinese', [B, S], '2 buns', 160, 300, 12, 48, 7, '🥟'],
  ['cn-fried-rice', 'Chicken fried rice', 'Chinese', [L, D], '1 plate', 350, 600, 22, 80, 20, '🍚'],
  ['cn-chow-mein', 'Chicken chow mein', 'Chinese', [L, D], '1 plate', 350, 550, 25, 60, 22, '🍜'],
  ['cn-manchurian', 'Chicken manchurian with rice', 'Chinese', [L, D], '1 plate', 400, 620, 28, 75, 22, '🍛'],
  ['cn-kung-pao', 'Kung pao chicken', 'Chinese', [D], '1 serving', 250, 450, 32, 18, 28, '🌶️'],
  ['cn-sweet-sour', 'Sweet and sour chicken', 'Chinese', [D], '1 serving', 280, 500, 26, 55, 18, '🍗'],
  ['cn-beef-broccoli', 'Beef with broccoli', 'Chinese', [D], '1 serving', 280, 380, 30, 16, 21, '🥦'],
  ['cn-szechuan', 'Szechuan chicken', 'Chinese', [D], '1 serving', 250, 420, 30, 20, 24, '🌶️'],
  ['cn-hot-sour', 'Hot and sour soup', 'Chinese', [L, D, S], '1 bowl', 300, 120, 7, 13, 4, '🍲'],
  ['cn-corn-soup', 'Chicken corn soup', 'Chinese', [L, D, S], '1 bowl', 300, 150, 9, 20, 4, '🍲'],
  ['cn-spring-rolls', 'Spring rolls', 'Chinese', [S], '2 rolls', 120, 260, 6, 30, 13, '🥢'],
  ['cn-dumplings', 'Dumplings', 'Chinese', [S, L], '6 pieces', 180, 300, 14, 36, 11, '🥟'],

  // ── Thai ───────────────────────────────────────────────────────────────
  ['th-khao-tom', 'Khao tom (Thai rice soup)', 'Thai', [B], '1 bowl', 400, 250, 14, 36, 5, '🥣'],
  ['th-pad-thai', 'Pad thai', 'Thai', [L, D], '1 plate', 350, 600, 25, 75, 22, '🍜'],
  ['th-green-curry', 'Thai green curry with rice', 'Thai', [L, D], '1 bowl + rice', 450, 650, 28, 70, 28, '🍛'],
  ['th-tom-yum', 'Tom yum soup', 'Thai', [L, S], '1 bowl', 350, 150, 14, 8, 6, '🍲'],
  ['th-red-curry', 'Thai red curry chicken with rice', 'Thai', [D], '1 bowl + rice', 450, 680, 28, 72, 30, '🍛'],
  ['th-massaman', 'Massaman curry with rice', 'Thai', [D], '1 bowl + rice', 450, 700, 26, 75, 32, '🍛'],
  ['th-kra-pao', 'Basil chicken (pad kra pao) with rice', 'Thai', [L, D], '1 plate', 350, 550, 30, 62, 20, '🌿'],
  ['th-papaya-salad', 'Papaya salad (som tam)', 'Thai', [S, L], '1 plate', 200, 150, 4, 26, 3, '🥗'],
  ['th-satay', 'Chicken satay', 'Thai', [S], '4 skewers', 150, 300, 26, 8, 18, '🍢'],
  ['th-mango-rice', 'Mango sticky rice', 'Thai', [S], '1 plate', 220, 400, 5, 70, 12, '🥭'],

  // ── Asian (Japanese, Korean, Vietnamese, Malay) ────────────────────────
  ['as-miso-breakfast', 'Rice, miso soup and egg', 'Asian', [B], '1 set', 350, 350, 15, 50, 9, '🍱'],
  ['as-nasi-lemak', 'Nasi lemak', 'Asian', [B, L], '1 plate', 350, 650, 20, 70, 32, '🍚'],
  ['as-onigiri', 'Onigiri', 'Asian', [S, B], '1 piece', 110, 200, 5, 40, 2, '🍙'],
  ['as-sushi', 'Sushi', 'Asian', [L], '8 pieces', 250, 350, 14, 60, 6, '🍣'],
  ['as-teriyaki-bowl', 'Chicken teriyaki bowl', 'Asian', [L, D], '1 bowl', 400, 600, 34, 78, 14, '🍱'],
  ['as-ramen', 'Ramen', 'Asian', [L, D], '1 bowl', 550, 550, 22, 68, 20, '🍜'],
  ['as-bibimbap', 'Bibimbap', 'Asian', [L], '1 bowl', 450, 550, 22, 75, 18, '🍲'],
  ['as-katsu-curry', 'Chicken katsu curry', 'Asian', [D], '1 plate', 450, 750, 32, 90, 28, '🍛'],
  ['as-bulgogi', 'Beef bulgogi with rice', 'Asian', [D], '1 plate', 400, 600, 32, 70, 20, '🥩'],
  ['as-pho', 'Pho', 'Asian', [D, L], '1 bowl', 600, 450, 28, 55, 10, '🍜'],
  ['as-edamame', 'Edamame', 'Asian', [S], '1 cup', 155, 190, 17, 15, 8, '🫛'],

  // ── Continental ────────────────────────────────────────────────────────
  ['co-avocado-toast', 'Avocado toast with 2 eggs', 'Continental', [B], '1 slice + 2 eggs', 280, 460, 22, 38, 24, '🥑'],
  ['co-oats', 'Oats with milk and banana', 'Continental', [B], '1 bowl', 350, 350, 12, 58, 7, '🥣'],
  ['co-pancakes', 'Pancakes with syrup', 'Continental', [B], '3 pancakes', 230, 520, 10, 85, 15, '🥞'],
  ['co-english', 'Full English breakfast', 'Continental', [B], '1 plate', 450, 850, 40, 45, 55, '🍳'],
  ['co-yogurt-granola', 'Greek yogurt with granola', 'Continental', [B, S], '1 bowl', 250, 300, 18, 38, 9, '🥣'],
  ['co-eggs-toast', 'Scrambled eggs on toast', 'Continental', [B], '2 eggs + 1 toast', 200, 380, 18, 22, 24, '🍞'],
  ['co-chicken-salad', 'Grilled chicken salad', 'Continental', [L], '1 bowl', 350, 350, 35, 14, 17, '🥗'],
  ['co-chicken-sandwich', 'Grilled chicken sandwich', 'Continental', [L], '1 sandwich', 250, 450, 32, 42, 16, '🥪'],
  ['co-caesar', 'Chicken Caesar salad', 'Continental', [L], '1 bowl', 330, 450, 30, 16, 30, '🥗'],
  ['co-tomato-soup', 'Tomato soup with bread', 'Continental', [L, D], '1 bowl + 1 slice', 400, 300, 8, 45, 10, '🍅'],
  ['co-alfredo', 'Chicken alfredo pasta', 'Continental', [L, D], '1 plate', 400, 750, 38, 70, 34, '🍝'],
  ['co-salmon', 'Grilled salmon with vegetables', 'Continental', [D], '1 plate', 350, 520, 40, 18, 30, '🐟'],
  ['co-steak', 'Steak with mashed potato', 'Continental', [D], '1 plate', 400, 750, 50, 35, 44, '🥩'],
  ['co-bolognese', 'Spaghetti bolognese', 'Continental', [D], '1 plate', 400, 650, 32, 80, 20, '🍝'],
  ['co-lasagna', 'Lasagna', 'Continental', [D], '1 piece', 300, 600, 32, 45, 32, '🍝'],
  ['co-fish-chips', 'Fish and chips', 'Continental', [D], '1 plate', 450, 840, 35, 85, 40, '🐟'],

  // ── American ───────────────────────────────────────────────────────────
  ['us-bagel', 'Bagel with cream cheese', 'American', [B], '1 bagel', 130, 360, 12, 56, 10, '🥯'],
  ['us-waffles', 'Waffles with syrup', 'American', [B], '2 waffles', 200, 440, 9, 70, 14, '🧇'],
  ['us-egg-sandwich', 'Egg and cheese breakfast sandwich', 'American', [B], '1 sandwich', 180, 450, 20, 34, 26, '🥪'],
  ['us-cereal', 'Cereal with milk', 'American', [B], '1 bowl', 280, 250, 9, 45, 4, '🥣'],
  ['us-cheeseburger', 'Cheeseburger', 'American', [L, D], '1 burger', 220, 550, 30, 40, 30, '🍔'],
  ['us-chicken-wrap', 'Chicken wrap', 'American', [L], '1 wrap', 250, 500, 30, 45, 22, '🌯'],
  ['us-club', 'Club sandwich', 'American', [L], '1 sandwich', 280, 600, 32, 45, 32, '🥪'],
  ['us-hot-dog', 'Hot dog', 'American', [L, S], '1 hot dog', 100, 300, 11, 24, 18, '🌭'],
  ['us-pizza', 'Pepperoni pizza', 'American', [D, L], '2 slices', 220, 600, 26, 66, 26, '🍕'],
  ['us-fried-chicken', 'Fried chicken', 'American', [D], '2 pieces', 250, 500, 38, 18, 30, '🍗'],
  ['us-bbq-ribs', 'BBQ ribs', 'American', [D], 'Half rack', 300, 750, 48, 22, 52, '🍖'],
  ['us-mac-cheese', 'Mac and cheese', 'American', [D, L], '1 bowl', 280, 500, 18, 50, 25, '🧀'],
  ['us-fries', 'French fries', 'American', [S], 'Medium portion', 117, 360, 4, 47, 17, '🍟'],
  ['us-nuggets', 'Chicken nuggets', 'American', [S], '6 pieces', 100, 280, 15, 16, 17, '🍗'],
  ['us-donut', 'Glazed donut', 'American', [S], '1 donut', 60, 260, 3, 31, 14, '🍩'],
  ['us-milkshake', 'Milkshake', 'American', [S], '1 glass', 350, 500, 12, 70, 18, '🥤'],

  // ── Everyday basics ────────────────────────────────────────────────────
  ['ev-banana', 'Banana', 'Everyday', [B, S], '1 medium', 118, 105, 1, 27, 0, '🍌'],
  ['ev-apple', 'Apple', 'Everyday', [S], '1 medium', 182, 95, 0, 25, 0, '🍎'],
  ['ev-dates', 'Dates (khajoor)', 'Everyday', [S, B], '3 dates', 24, 70, 1, 18, 0, '🌴'],
  ['ev-almonds', 'Almonds', 'Everyday', [S], '1 handful (28 g)', 28, 165, 6, 6, 14, '🌰'],
  ['ev-boiled-egg', 'Boiled egg', 'Everyday', [B, S], '1 egg', 50, 78, 6, 1, 5, '🥚'],
  ['ev-yogurt', 'Plain yogurt (dahi)', 'Everyday', [B, L, S], '1 bowl', 200, 120, 7, 10, 6, '🥛'],
  ['ev-rice', 'Plain boiled rice', 'Everyday', [L, D], '1 cup', 160, 205, 4, 45, 0, '🍚'],
  ['ev-fruit-salad', 'Fruit salad', 'Everyday', [S, B], '1 bowl', 200, 120, 1, 30, 0, '🍓'],
  ['ev-milk', 'Milk', 'Everyday', [B, S], '1 glass', 250, 150, 8, 12, 8, '🥛'],
  ['ev-protein-bar', 'Protein bar', 'Everyday', [S], '1 bar', 60, 200, 20, 22, 7, '🍫'],
];

export const FOODS: FoodPick[] = ROWS.map(([id, name, cuisine, meals, serving, grams, kcal, protein, carbs, fat, emoji]) => ({
  id,
  name,
  cuisine,
  meals,
  serving,
  grams,
  kcal,
  protein,
  carbs,
  fat,
  emoji,
}));

/**
 * Filters the list: by meal (or all), by cuisine (or all), and by a search that matches the name,
 * cuisine or serving, ignoring case and word order ("karahi chicken" finds "Chicken karahi").
 */
export function searchFoods(query: string, meal: MealType | 'All', cuisine: Cuisine | 'All'): FoodPick[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return FOODS.filter((f) => {
    if (meal !== 'All' && !f.meals.includes(meal)) return false;
    if (cuisine !== 'All' && f.cuisine !== cuisine) return false;
    if (!words.length) return true;
    const hay = `${f.name} ${f.cuisine} ${f.serving}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
