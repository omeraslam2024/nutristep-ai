import { UserProfile, DayLog } from '../types';
import { DEFAULT_USER_PROFILE, generateInitialHistory } from '../data/initialData';

const PROFILE_KEY = 'nutristep_profile_v1';
const HISTORY_KEY = 'nutristep_history_v1';
const PROFILE_BACKUP_KEY = 'nutristep_profile_backup_v1';
const HISTORY_BACKUP_KEY = 'nutristep_history_backup_v1';

export function loadStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY) || localStorage.getItem('nutristep_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.weightKg === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored profile, attempting backup recovery:', err);
    try {
      const backup = localStorage.getItem(PROFILE_BACKUP_KEY);
      if (backup) return JSON.parse(backup);
    } catch {}
  }
  return DEFAULT_USER_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    const json = JSON.stringify(profile);
    localStorage.setItem(PROFILE_KEY, json);
    // Maintain secondary backup
    localStorage.setItem(PROFILE_BACKUP_KEY, json);
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
}

export function loadStoredHistory(): DayLog[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY) || localStorage.getItem('nutristep_history');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored history, attempting backup recovery:', err);
    try {
      const backup = localStorage.getItem(HISTORY_BACKUP_KEY);
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
          return parsedBackup;
        }
      }
    } catch {}
  }
  return generateInitialHistory();
}

export function saveStoredHistory(history: DayLog[]): void {
  try {
    const json = JSON.stringify(history);
    localStorage.setItem(HISTORY_KEY, json);
    // Periodically update rolling backup
    localStorage.setItem(HISTORY_BACKUP_KEY, json);
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

export function exportUserDataJSON(profile: UserProfile, history: DayLog[]): string {
  const payload = {
    app: 'NutriStep AI',
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    profile,
    history,
  };
  return JSON.stringify(payload, null, 2);
}

export function importUserDataJSON(jsonStr: string): { profile: UserProfile; history: DayLog[] } | null {
  try {
    const data = JSON.parse(jsonStr);
    if (data && data.profile && Array.isArray(data.history)) {
      saveStoredProfile(data.profile);
      saveStoredHistory(data.history);
      return { profile: data.profile, history: data.history };
    }
  } catch (err) {
    console.error('Failed to import user data JSON:', err);
  }
  return null;
}
