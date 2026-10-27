import React, { useState } from 'react';
import { Flame, Footprints, Settings, Camera, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { UserProfile } from '../types';
import { StreakInfo } from '../utils/healthCalculations';
import { speakText, stopSpeaking } from '../utils/speechHelper';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  profile: UserProfile;
  streakDays: number;
  streakInfo?: StreakInfo;
  speechSummary?: string;
  onOpenPlateScanner: () => void;
  onOpenCoach: () => void;
  onOpenSettings: () => void;
  onOpenStepModal: () => void;
  onOpenStreakModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  streakDays,
  streakInfo,
  speechSummary,
  onOpenPlateScanner,
  onOpenCoach,
  onOpenSettings,
  onOpenStepModal,
  onOpenStreakModal,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const isTodayComplete = streakInfo?.isTodayComplete;

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToSpeak =
        speechSummary ||
        `Hello ${profile.name.split(' ')[0]}! Welcome to NutriStep. You are on a ${streakDays} day streak. Tap the big green camera button to take a photo of your meal plate, or tap the blue shoe button to see your steps!`;
      const ok = speakText(textToSpeak);
      if (ok) {
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 8000);
      }
    }
  };

  return (
    <header
      className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800/90 px-3 sm:px-6 shadow-md"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 2.75rem)',
        paddingBottom: '0.75rem',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Official NutriStep Healthy Progress Logo & Profile Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <img src="/icon.svg" alt="NutriStep Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                NutriStep <span className="text-emerald-400 text-sm px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">AI</span>
              </h1>

              {/* Big Visual Interactive Streak Counter Button */}
              <button
                type="button"
                onClick={onOpenStreakModal}
                className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-black transition-all duration-200 active:scale-95 cursor-pointer shadow-sm hover:shadow-amber-500/25"
                title="Click to view full 7-day streak breakdown and goals"
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-tight">
                  {streakDays} <span className="hidden sm:inline">Day Streak</span>
                </span>
                {isTodayComplete && (
                  <span className="text-[11px] font-black text-emerald-300 bg-emerald-500/25 px-1.5 py-0.2 rounded-md">
                    ✓ DONE
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">
              {todayFormatted} &bull; Welcome, <strong className="text-white font-extrabold">{profile.name.split(' ')[0]}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons: Compact on mobile, rich on desktop */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Voice Speak Button */}
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs sm:text-sm font-extrabold transition-all active:scale-95 cursor-pointer shadow-sm ${
              isSpeaking
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-200'
            }`}
            title="Read your daily status aloud"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 text-rose-400 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-400 stroke-[2.5]" />
            )}
            <span className="hidden md:inline ml-1.5">{isSpeaking ? 'Stop Voice' : 'Hear Status 🔊'}</span>
          </button>

          {/* PWA Install Button (desktop / tablet) */}
          <PWAInstallButton className="hidden sm:inline-flex" />

          {/* Snap Food Button: visible on tablet/desktop, mobile has giant bottom button */}
          <button
            onClick={onOpenPlateScanner}
            className="hidden md:flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-base shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-5 h-5 text-slate-950 stroke-[3]" />
            <span>📸 Snap Food</span>
          </button>

          {/* AI Coach button (tablet/desktop) */}
          <button
            onClick={onOpenCoach}
            className="hidden sm:flex relative items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs sm:text-sm font-bold transition-all group cursor-pointer"
            title="Talk to Coach NutriStep"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:inline">Coach</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
