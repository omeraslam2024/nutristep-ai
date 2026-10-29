import { Capacitor } from '@capacitor/core';

/**
 * AI features (photo analysis, meal-by-text, label scan, coach) need server.ts, which holds the
 * Gemini key. In the browser that server serves the app; in the Android APK it exists only if the
 * build was given VITE_API_BASE. Without it the APK hides every AI entry point instead of showing
 * features that cannot work.
 */
export const AI_ENABLED: boolean = !Capacitor.isNativePlatform() || !!import.meta.env.VITE_API_BASE;
