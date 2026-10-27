import { useEffect, useState } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

export type ThemePref = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const KEY = 'nutristep_theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function loadThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

function resolve(pref: ThemePref): ResolvedTheme {
  if (pref !== 'system') return pref;
  return media().matches ? 'dark' : 'light';
}

/** Sets data-theme on <html>, the browser theme colour and the Android status/navigation bar icons. */
function apply(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme;
  const bg = theme === 'dark' ? '#0b100d' : '#f4f6f0';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  if (Capacitor.isNativePlatform()) {
    // DARK = light icons on a dark background.
    SystemBars.setStyle({ style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
  }
}

/** Follows the phone's light/dark setting unless the user picked one in Profile. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(loadThemePref);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(pref));

  useEffect(() => {
    const update = () => {
      const r = resolve(pref);
      setResolved(r);
      apply(r);
    };
    update();
    try {
      localStorage.setItem(KEY, pref);
    } catch {}
    if (pref !== 'system') return;
    const m = media();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, [pref]);

  return { pref, resolved, setPref };
}
