/**
 * Base URL of the NutriStep server (server.ts), which holds the Gemini key.
 *
 * In the browser the app is served by that server, so relative paths work. Inside the Android APK
 * the app is loaded from https://localhost, where no server exists — the APK must be built with
 * VITE_API_BASE set to the deployed server, e.g. VITE_API_BASE=https://nutristep-xyz.a.run.app
 */
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
