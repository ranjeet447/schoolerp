import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.schoolerp.app',
  appName: 'SchoolERP',
  webDir: 'dist',
  server: {
    // In production, the app loads from the bundled dist/ folder.
    // For development, point to your deployed web app URL:
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      backgroundColor: '#4f46e5',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#4f46e5',
    },
  },
};

export default config;
