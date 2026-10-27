import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Offline support for the web/PWA build. The Android app ships its files inside the APK, where a
// service worker only adds a failing precache step.
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
} else {
  navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
}
