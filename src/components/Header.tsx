import React from 'react';
import { Flame, Footprints, Bot, Settings, Plus, Camera, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  profile: UserProfile;
  streakDays: number;
  onOpenPlateScanner: () => void;
  onOpenCoach: () => void;
  onOpenSettings: () => void;
  onOpenStepModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  streakDays,
  onOpenPlateScanner,
  onOpenCoach,
  onOpenSettings,
  onOpenStepModal,
}) => {
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand logo & tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                NutriStep <span className="text-emerald-400 font-extrabold text-sm px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">AI</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                🔥 {streakDays}-Day Streak
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{todayFormatted} &bull; Welcome back, {profile.name.split(' ')[0]}</p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Snap / Log Food Button */}
          <button
            onClick={onOpenPlateScanner}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span className="hidden sm:inline">Snap Food Plate</span>
            <span className="sm:hidden">Snap</span>
          </button>

          {/* Quick Steps trigger */}
          <button
            onClick={onOpenStepModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            title="Log steps or start sensor walk"
          >
            <Footprints className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Step Tracker</span>
          </button>

          {/* AI Health Coach button */}
          <button
            onClick={onOpenCoach}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-medium transition-all group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Coach</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="User Profile & BMR / TDEE Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
