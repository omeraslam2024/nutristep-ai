import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import App from './App.tsx';
import '@fontsource-variable/figtree';
import '@fontsource-variable/fredoka';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Offline support for the web/PWA build. The Android app ships its files inside the APK, where a
// service worker only adds a failing precache step.
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
} else {
  navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  // Android back button: step back through open sheets and tabs (see useBackToClose); on Home with
  // nothing open, leave the app.
  NativeApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else NativeApp.exitApp();
  });
}
