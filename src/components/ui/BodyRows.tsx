import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../types';

/**
 * Age, height and weight as full-width rows (label left, field right), so they stay readable with
 * large Android font and display sizes. Values are always stored metric; imperial users type
 * feet + inches and pounds.
 */
export const BodyRows: React.FC<{
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
}> = ({ profile, onChange }) => {
  const imperial = profile.unitSystem === 'imperial';
  const totalIn = profile.heightCm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);

  return (
    <div className="surface divide-y divide-slate-800 overflow-hidden">
      <Row label="Age">
        <Num value={profile.age} unit="years" onChange={(v) => onChange({ age: v })} />
      </Row>
      <Row label="Height">
        {imperial ? (
          <div className="flex items-center gap-2">
            <Num value={ft} unit="ft" width="w-16" onChange={(v) => onChange({ heightCm: round1((v * 12 + inch) * 2.54) })} />
            <Num value={inch} unit="in" width="w-16" onChange={(v) => onChange({ heightCm: round1((ft * 12 + Math.min(11, v)) * 2.54) })} />
          </div>
        ) : (
          <Num value={Math.round(profile.heightCm)} unit="cm" onChange={(v) => onChange({ heightCm: v })} />
        )}
      </Row>
      <Row label="Weight">
        {imperial ? (
          <Num value={Math.round(profile.weightKg * 2.20462)} unit="lb" onChange={(v) => onChange({ weightKg: round1(v / 2.20462) })} />
        ) : (
          <Num value={round1(profile.weightKg)} unit="kg" decimal onChange={(v) => onChange({ weightKg: v })} />
        )}
      </Row>
    </div>
  );
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[64px]">
    <span className="font-semibold text-ink">{label}</span>
    {children}
  </div>
);

/** Number field that lets the user clear it while typing, then commits valid numbers. */
const Num: React.FC<{ value: number; unit: string; onChange: (v: number) => void; width?: string; decimal?: boolean }> = ({
  value,
  unit,
  onChange,
  width = 'w-24',
  decimal,
}) => {
  const [text, setText] = useState(String(value || ''));
  useEffect(() => {
    if (Number(text) !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="flex items-center gap-1.5 shrink-0">
      <input
        type="number"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== '' && Number.isFinite(n)) onChange(n);
        }}
        aria-label={unit}
        className={`${width} h-12 rounded-xl bg-slate-800 border-2 border-transparent px-3 text-right num text-lg font-semibold text-ink focus:outline-none focus:border-coral`}
      />
      <span className="w-10 text-sm text-slate-400">{unit}</span>
    </label>
  );
};
