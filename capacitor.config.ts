interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
  };
  plugins?: Record<string, any>;
  ios?: Record<string, any>;
  android?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.runspot.seoul',
  appName: 'RunSpot Seoul',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  
  plugins: {
    // 위치 서비스 설정
    Geolocation: {
      permissions: {
        location: 'always'
      }
    },
    
    // 백그라운드 모드 설정
    BackgroundMode: {
      enabled: true,
      title: 'RunSpot이 백그라운드에서 실행 중입니다',
      text: 'GPS 추적을 위해 백그라운드에서 실행됩니다',
      silent: false,
      hidden: false,
      bigText: false,
      resume: true,
      icon: 'icon',
      color: '00FF88'
    },
    
    // 로컬 알림 설정
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#00FF88',
      sound: 'beep.wav'
    },
    
    // 푸시 알림 설정
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    // 카메라 설정
    Camera: {
      permissions: {
        camera: 'required',
        photos: 'required'
      }
    },
    
    // 파일시스템 설정
    Filesystem: {
      permissions: {
        publicStorage: 'required'
      }
    },
    
    // 디바이스 정보 설정
    Device: {
      permissions: {
        device: 'required'
      }
    },
    
    // 네트워크 설정
    Network: {
      permissions: {
        network: 'required'
      }
    },
    
    // 상태바 설정
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000'
    },
    
    // 스플래시 스크린 설정
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#00FF88',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
    },
    
    // 햅틱 피드백 설정
    Haptics: {
      permissions: {
        vibrate: 'required'
      }
    },
    
    // 키보드 설정
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    
    // 앱 설정
    App: {
      permissions: {
        app: 'required'
      }
    },
    
    // 브라우저 설정
    Browser: {
      permissions: {
        browser: 'required'
      }
    },
    
    // 클립보드 설정
    Clipboard: {
      permissions: {
        clipboard: 'required'
      }
    },
    
    // 다이얼로그 설정
    Dialog: {
      permissions: {
        dialog: 'required'
      }
    },
    
    // 토스트 설정
    Toast: {
      duration: 'short'
    },
    
    // 액션 시트 설정
    ActionSheet: {
      permissions: {
        actionSheet: 'required'
      }
    },
    
    // 모션 센서 설정
    Motion: {
      permissions: {
        motion: 'required'
      }
    },
    
    // 스크린 리더 설정
    ScreenReader: {
      permissions: {
        screenReader: 'required'
      }
    }
  },
  
  // iOS 설정
  ios: {
    scheme: 'RunSpot Seoul',
    contentInset: 'automatic',
    backgroundColor: '#000000',
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    limitsNavigationsToAppBoundDomains: false,
    webContentsDebuggingEnabled: false,
    scrollEnabled: true,
    preferredContentMode: 'mobile'
  },
  
  // Android 설정
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    initialFocus: true,
    appendUserAgent: 'RunSpot Seoul App',
    overrideUserAgent: '',
    useLegacyBridge: false
  }
};

export default config;
