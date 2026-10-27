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
    <div className="space-y-5 max-w-2xl mx-auto">
      <section className="surface p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-[#ffffff] shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{profile.name || 'Your profile'}</h2>
          <p className="text-sm text-slate-400">
            {GOAL_LABEL[profile.goal]} · {weight}
          </p>
        </div>
        <button
          onClick={p.onEditProfile}
          aria-label="Edit profile and goals"
          className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 cursor-pointer active:scale-95 transition-transform"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Tile label="Daily budget" value={`${calculateTargetCalories(profile).toLocaleString()}`} unit="kcal" />
        <Tile label="Step goal" value={(profile.stepGoal || 10000).toLocaleString()} unit="steps" />
        <Tile label="Best streak" value={`${p.streakInfo.longestStreak}`} unit="days" />
      </section>

      <section className="surface divide-y divide-slate-800 overflow-hidden">
        <Row icon={<Target className="w-5 h-5 text-emerald-400" />} title="Goals and body" hint="Weight, height, activity, targets" onClick={p.onEditProfile} />
        <Row
          icon={<Footprints className="w-5 h-5 text-cyan-400" />}
          title="Automatic step counting"
          hint={p.pedometer.status === 'active' ? 'On' : p.pedometer.status === 'denied' ? 'Needs permission' : p.pedometer.status === 'unsupported' ? 'Not available on this device' : 'Off'}
          onClick={() => p.pedometer.setEnabled(!p.pedometer.enabled || p.pedometer.status === 'denied')}
          trailing={
            <Switch on={p.pedometer.enabled && p.pedometer.status !== 'denied'} disabled={p.pedometer.status === 'unsupported'} />
          }
        />
        <Row icon={<Share2 className="w-5 h-5 text-purple-400" />} title="Share today's progress" hint="A picture for WhatsApp, Instagram and more" onClick={p.onShare} />
      </section>

      <section className="surface p-5">
        <h3 className="font-bold text-white">Appearance</h3>
        <p className="text-xs text-slate-400 mt-0.5">"System" follows your phone's dark mode setting.</p>
        <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800">
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
              className={`relative py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer ${
                p.themePref === id ? 'text-white' : 'text-slate-400'
              }`}
            >
              {p.themePref === id && (
                <motion.span layoutId="theme-seg" className="absolute inset-0 rounded-xl bg-slate-900 border border-slate-700 shadow-sm" />
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
    <p className="mt-1 text-xl font-bold text-white tabular-nums">{value}</p>
    <p className="text-[11px] text-slate-400">{unit}</p>
  </div>
);

const Row: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}> = ({ icon, title, hint, onClick, trailing }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-800/40 transition-colors cursor-pointer min-h-[64px]">
    <span className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block font-semibold text-white">{title}</span>
      <span className="block text-xs text-slate-400 truncate">{hint}</span>
    </span>
    {trailing ?? <ChevronRight className="w-5 h-5 text-slate-500" />}
  </button>
);

const Switch: React.FC<{ on: boolean; disabled?: boolean }> = ({ on, disabled }) => (
  <span
    aria-hidden="true"
    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${on ? 'bg-emerald-500' : 'bg-slate-700'} ${disabled ? 'opacity-40' : ''}`}
  >
    <motion.span
      className="absolute top-1 w-5 h-5 rounded-full bg-[#ffffff] shadow"
      animate={{ left: on ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
    />
  </span>
);
