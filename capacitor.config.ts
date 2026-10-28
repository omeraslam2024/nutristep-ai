import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutristep.ai',
  appName: 'NutriStep AI',
  webDir: 'dist',
  // Transparent while the page loads, so the theme-aware window background shows instead of white.
  backgroundColor: '#00000000',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;
