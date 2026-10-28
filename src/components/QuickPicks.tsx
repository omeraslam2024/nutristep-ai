import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { MealType } from '../types';
import { CUISINES, Cuisine, FoodPick, searchFoods } from '../data/foods';

const MEALS: (MealType | 'All')[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'All'];

/** Searchable list of common dishes, filtered to the meal being logged and an optional cuisine. */
export const QuickPicks: React.FC<{ mealType: MealType; onPick: (food: FoodPick) => void }> = ({ mealType, onPick }) => {
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState<MealType | 'All'>(mealType);
  const [cuisine, setCuisine] = useState<Cuisine | 'All'>('All');
  // Typing searches every meal, so "biryani" is found from the Breakfast list too.
  const results = useMemo(() => searchFoods(query, query ? 'All' : meal, cuisine), [query, meal, cuisine]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 bg-slate-800 rounded-full px-4 h-12 border-2 border-transparent focus-within:border-coral">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <span className="sr-only">Search dishes</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search biryani, pad thai, omelette…"
          className="flex-1 min-w-0 bg-transparent text-ink placeholder-slate-500 focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Clear search" className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </label>

      {!query && (
        <Chips
          label="Meal"
          items={MEALS}
          value={meal}
          onChange={(v) => setMeal(v as MealType | 'All')}
          activeClass="bg-coral text-[#ffffff]"
        />
      )}
      <Chips
        label="Cuisine"
        items={['All', ...CUISINES]}
        value={cuisine}
        onChange={(v) => setCuisine(v as Cuisine | 'All')}
        activeClass="btn-primary"
      />

      <p className="text-xs text-slate-400">
        {results.length} {results.length === 1 ? 'dish' : 'dishes'} · typical values for one serving, adjust the portion before saving
      </p>

      <ul className="space-y-1">
        {results.map((f) => (
          <li key={f.id}>
            <button
              onClick={() => onPick(f)}
              className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-800/70 active:bg-slate-800 text-left cursor-pointer"
            >
              <span className="w-12 h-12 rounded-2xl bg-peach flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                {f.emoji}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-ink leading-snug">{f.name}</span>
                <span className="block text-xs text-slate-400 truncate">
                  {f.serving} · {f.cuisine}
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block num text-base font-semibold text-ink">{f.kcal}</span>
                <span className="block text-[11px] text-slate-400">kcal</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!results.length && (
        <p className="text-sm text-slate-400 text-center py-6">No dish found. Try another word, or use Manual entry.</p>
      )}
    </div>
  );
};

const Chips: React.FC<{
  label: string;
  items: string[];
  value: string;
  onChange: (v: string) => void;
  activeClass: string;
}> = ({ label, items, value, onChange, activeClass }) => (
  <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
    {items.map((it) => (
      <button
        key={it}
        onClick={() => onChange(it)}
        aria-pressed={value === it}
        className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
          value === it ? activeClass : 'bg-slate-800 text-slate-300'
        }`}
      >
        {it}
      </button>
    ))}
  </div>
);
