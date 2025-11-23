import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.runspot.app',
  appName: 'RunSpot',
  webDir: 'out', // Next.js static export directory
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    NativeNavigation: {
      // 네이티브 네비게이션 플러그인 설정
      enableBackgroundLocation: true,
      locationUpdateInterval: 1000, // 1초마다 위치 업데이트
      navigationAccuracy: 'high'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;
