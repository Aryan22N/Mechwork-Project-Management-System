import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.solardashboard.app',
  appName: 'Solar Management',
  webDir: 'capacitor-dummy',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://your-solar-domain.com',
    cleartext: isDev,
  },
  android: {
    allowMixedContent: isDev,
  },
};

export default config;
