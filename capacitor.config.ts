import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.solardashboard.app',
  appName: 'Solar Management',
  webDir: 'capacitor-dummy',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://solar-project-dashboard.vercel.app/',
    cleartext: isDev,
  },
  android: {
    allowMixedContent: isDev,
  },
};

export default config;
