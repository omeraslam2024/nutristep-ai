import React from 'react';
import { ChevronRight, Footprints, Moon, Monitor, Pencil, Share2, Sun, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { calculateTargetCalories, StreakInfo } from '../utils/healthCalculations';
import type { ThemePref } from '../utils/theme';
import type { usePedometer } from '../utils/pedometer/usePedometer';

interface ProfileViewProps {
  profile: UserProfile;
  streakInfo: StreakInfo;
  themePref: ThemePref;
  onThemeChange: (t: ThemePref) => void;
  pedometer: ReturnType<typeof usePedometer>;
  onEditProfile: () => void;
  onShare: () => void;
}

const GOAL_LABEL: Record<UserProfile['goal'], string> = {
  lose_weight: 'Lose weight',
  maintain: 'Stay healthy',
  gain_muscle: 'Build muscle',
};

export const ProfileView: React.FC<ProfileViewProps> = (p) => {
  const { profile } = p;
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase();
  const weight =
    profile.unitSystem === 'imperial' ? `${Math.round(profile.weightKg * 2.20462)} lb` : `${profile.weightKg} kg`;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <header className="pt-1">
        <p className="text-sm text-slate-400">You</p>
        <h1 className="font-display text-[28px] leading-tight font-semibold text-ink">Profile</h1>
      </header>
      <section className="surface p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-lilac text-lilac-ink flex items-center justify-center font-display text-2xl font-semibold shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink truncate">{profile.name || 'Your profile'}</h2>
          <p className="text-sm text-slate-400">
            {GOAL_LABEL[profile.goal]} · {weight}
          </p>
        </div>
        <button
          onClick={p.onEditProfile}
          aria-label="Edit profile and goals"
          className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Tile label="Daily budget" value={`${calculateTargetCalories(profile).toLocaleString()}`} unit="kcal" />
        <Tile label="Step goal" value={(profile.stepGoal || 10000).toLocaleString()} unit="steps" />
        <Tile label="Best streak" value={`${p.streakInfo.longestStreak}`} unit="days" />
      </section>

      <section className="surface overflow-hidden p-1">
        <Row icon={<Target className="w-5 h-5" />} tint="bg-peach text-coral-ink" title="Goals and body" hint="Weight, height, activity, targets" onClick={p.onEditProfile} />
        <Row
          icon={<Footprints className="w-5 h-5" />}
          tint="bg-mint text-leaf-ink"
          title="Automatic step counting"
          hint={p.pedometer.status === 'active' ? 'On' : p.pedometer.status === 'denied' ? 'Needs permission' : p.pedometer.status === 'unsupported' ? 'Not available on this device' : 'Off'}
          onClick={() => p.pedometer.setEnabled(!p.pedometer.enabled || p.pedometer.status === 'denied')}
          trailing={
            <Switch on={p.pedometer.enabled && p.pedometer.status !== 'denied'} disabled={p.pedometer.status === 'unsupported'} />
          }
        />
        <Row icon={<Share2 className="w-5 h-5" />} tint="bg-lilac text-lilac-ink" title="Share today's progress" hint="A picture for WhatsApp, Instagram and more" onClick={p.onShare} />
      </section>

      <section className="surface p-5">
        <h3 className="font-display text-lg font-semibold text-ink">Appearance</h3>
        <p className="text-xs text-slate-400 mt-0.5">"System" follows your phone's dark mode setting.</p>
        <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-full bg-slate-800">
          {(
            [
              ['system', 'System', Monitor],
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => p.onThemeChange(id)}
              aria-pressed={p.themePref === id}
              className={`relative py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer ${
                p.themePref === id ? 'text-white' : 'text-slate-400'
              }`}
            >
              {p.themePref === id && (
                <motion.span layoutId="theme-seg" className="absolute inset-0 rounded-full bg-slate-900 shadow-sm" />
              )}
              <Icon className="relative w-4 h-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-slate-500 pb-2">NutriStep {__APP_VERSION__} · your data stays on this phone</p>
    </div>
  );
};

const Tile: React.FC<{ label: string; value: string; unit: string }> = ({ label, value, unit }) => (
  <div className="surface p-4">
    <p className="text-[11px] font-medium text-slate-400">{label}</p>
    <p className="mt-1 num text-xl font-semibold text-ink">{value}</p>
    <p className="text-[11px] text-slate-400">{unit}</p>
  </div>
);

const Row: React.FC<{
  icon: React.ReactNode;
  tint: string;
  title: string;
  hint: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}> = ({ icon, tint, title, hint, onClick, trailing }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 p-3.5 rounded-[1.4rem] text-left hover:bg-slate-800/60 transition-colors cursor-pointer min-h-[64px]">
    <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tint}`}>{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block font-semibold text-ink">{title}</span>
      <span className="block text-xs text-slate-400 truncate">{hint}</span>
    </span>
    {trailing ?? <ChevronRight className="w-5 h-5 text-slate-500" />}
  </button>
);

const Switch: React.FC<{ on: boolean; disabled?: boolean }> = ({ on, disabled }) => (
  <span
    aria-hidden="true"
    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${on ? 'bg-leaf' : 'bg-slate-700'} ${disabled ? 'opacity-40' : ''}`}
  >
    <motion.span
      className="absolute top-1 w-5 h-5 rounded-full bg-[#ffffff] shadow"
      animate={{ left: on ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
    />
  </span>
);
