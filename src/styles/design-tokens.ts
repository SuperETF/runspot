import { DesignSystem } from '@/hooks/usePlatformDetection'

// 공통 색상 팔레트
export const colors = {
  // 브랜드 컬러
  primary: '#00FF88',
  primaryDark: '#00E077',
  secondary: '#FF6B35',
  
  // 그레이스케일
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712'
  },
  
  // 시스템 컬러
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
}

// iOS Cupertino 디자인 토큰
export const cupertinoTokens = {
  colors: {
    // iOS 시스템 컬러
    systemBlue: '#007AFF',
    systemGreen: '#34C759',
    systemIndigo: '#5856D6',
    systemOrange: '#FF9500',
    systemPink: '#FF2D92',
    systemPurple: '#AF52DE',
    systemRed: '#FF3B30',
    systemTeal: '#5AC8FA',
    systemYellow: '#FFCC00',
    
    // iOS 그레이 컬러
    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',
    
    // 다크모드 대응
    label: '#000000',
    labelDark: '#FFFFFF',
    secondaryLabel: '#3C3C43',
    secondaryLabelDark: '#EBEBF5',
    tertiaryLabel: '#3C3C43',
    tertiaryLabelDark: '#EBEBF5',
    
    // 배경색
    systemBackground: '#FFFFFF',
    systemBackgroundDark: '#000000',
    secondarySystemBackground: '#F2F2F7',
    secondarySystemBackgroundDark: '#1C1C1E',
    tertiarySystemBackground: '#FFFFFF',
    tertiarySystemBackgroundDark: '#2C2C2E',
    
    // 그룹 배경색
    systemGroupedBackground: '#F2F2F7',
    systemGroupedBackgroundDark: '#000000',
    secondarySystemGroupedBackground: '#FFFFFF',
    secondarySystemGroupedBackgroundDark: '#1C1C1E',
    
    // 구분선
    separator: '#3C3C43',
    separatorDark: '#54545B',
    opaqueSeparator: '#C6C6C8',
    opaqueSeparatorDark: '#38383A'
  },
  
  typography: {
    // iOS 텍스트 스타일
    largeTitle: {
      fontSize: '34px',
      fontWeight: '400',
      lineHeight: '41px',
      letterSpacing: '0.37px'
    },
    title1: {
      fontSize: '28px',
      fontWeight: '400',
      lineHeight: '34px',
      letterSpacing: '0.36px'
    },
    title2: {
      fontSize: '22px',
      fontWeight: '400',
      lineHeight: '28px',
      letterSpacing: '0.35px'
    },
    title3: {
      fontSize: '20px',
      fontWeight: '400',
      lineHeight: '25px',
      letterSpacing: '0.38px'
    },
    headline: {
      fontSize: '17px',
      fontWeight: '600',
      lineHeight: '22px',
      letterSpacing: '-0.41px'
    },
    body: {
      fontSize: '17px',
      fontWeight: '400',
      lineHeight: '22px',
      letterSpacing: '-0.41px'
    },
    callout: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '21px',
      letterSpacing: '-0.32px'
    },
    subhead: {
      fontSize: '15px',
      fontWeight: '400',
      lineHeight: '20px',
      letterSpacing: '-0.24px'
    },
    footnote: {
      fontSize: '13px',
      fontWeight: '400',
      lineHeight: '18px',
      letterSpacing: '-0.08px'
    },
    caption1: {
      fontSize: '12px',
      fontWeight: '400',
      lineHeight: '16px',
      letterSpacing: '0px'
    },
    caption2: {
      fontSize: '11px',
      fontWeight: '400',
      lineHeight: '13px',
      letterSpacing: '0.07px'
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '20px',
    xl: '32px',
    xxl: '44px'
  },
  
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
  }
}

// Android Material Design 3 토큰
export const materialTokens = {
  colors: {
    // Material Design 3 색상 시스템
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    background: '#FFFBFE',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#D0BCFF',
    
    // 다크 테마
    primaryDark: '#D0BCFF',
    onPrimaryDark: '#381E72',
    primaryContainerDark: '#4F378B',
    onPrimaryContainerDark: '#EADDFF',
    
    backgroundDark: '#1C1B1F',
    onBackgroundDark: '#E6E1E5',
    surfaceDark: '#1C1B1F',
    onSurfaceDark: '#E6E1E5'
  },
  
  typography: {
    // Material Design 3 타이포그래피
    displayLarge: {
      fontSize: '57px',
      fontWeight: '400',
      lineHeight: '64px',
      letterSpacing: '-0.25px'
    },
    displayMedium: {
      fontSize: '45px',
      fontWeight: '400',
      lineHeight: '52px',
      letterSpacing: '0px'
    },
    displaySmall: {
      fontSize: '36px',
      fontWeight: '400',
      lineHeight: '44px',
      letterSpacing: '0px'
    },
    headlineLarge: {
      fontSize: '32px',
      fontWeight: '400',
      lineHeight: '40px',
      letterSpacing: '0px'
    },
    headlineMedium: {
      fontSize: '28px',
      fontWeight: '400',
      lineHeight: '36px',
      letterSpacing: '0px'
    },
    headlineSmall: {
      fontSize: '24px',
      fontWeight: '400',
      lineHeight: '32px',
      letterSpacing: '0px'
    },
    titleLarge: {
      fontSize: '22px',
      fontWeight: '400',
      lineHeight: '28px',
      letterSpacing: '0px'
    },
    titleMedium: {
      fontSize: '16px',
      fontWeight: '500',
      lineHeight: '24px',
      letterSpacing: '0.15px'
    },
    titleSmall: {
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '20px',
      letterSpacing: '0.1px'
    },
    labelLarge: {
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '20px',
      letterSpacing: '0.1px'
    },
    labelMedium: {
      fontSize: '12px',
      fontWeight: '500',
      lineHeight: '16px',
      letterSpacing: '0.5px'
    },
    labelSmall: {
      fontSize: '11px',
      fontWeight: '500',
      lineHeight: '16px',
      letterSpacing: '0.5px'
    },
    bodyLarge: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '24px',
      letterSpacing: '0.5px'
    },
    bodyMedium: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '20px',
      letterSpacing: '0.25px'
    },
    bodySmall: {
      fontSize: '12px',
      fontWeight: '400',
      lineHeight: '16px',
      letterSpacing: '0.4px'
    }
  },
  
  spacing: {
    xs: '4dp',
    sm: '8dp',
    md: '16dp',
    lg: '24dp',
    xl: '32dp',
    xxl: '48dp'
  },
  
  borderRadius: {
    xs: '4dp',
    sm: '8dp',
    md: '12dp',
    lg: '16dp',
    xl: '28dp',
    full: '50%'
  },
  
  elevation: {
    level0: '0dp',
    level1: '1dp',
    level2: '3dp',
    level3: '6dp',
    level4: '8dp',
    level5: '12dp'
  }
}

// 웹 디자인 토큰 (기본값)
export const webTokens = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.white,
    surface: colors.gray[50],
    text: colors.gray[900],
    textSecondary: colors.gray[600],
    border: colors.gray[200],
    hover: colors.gray[100]
  },
  
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: '700',
      lineHeight: '1.2'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: '600',
      lineHeight: '1.3'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '1.4'
    },
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5'
    },
    caption: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.4'
    }
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  }
}

// 디자인 시스템별 토큰 선택 함수
export const getDesignTokens = (designSystem: DesignSystem) => {
  switch (designSystem) {
    case 'cupertino':
      return cupertinoTokens
    case 'material':
      return materialTokens
    case 'web':
    default:
      return webTokens
  }
}

// 플랫폼별 애니메이션 설정
export const animations = {
  cupertino: {
    // iOS 스타일 애니메이션
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s'
    },
    easing: {
      default: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      ease: 'ease-in-out'
    },
    transform: {
      scale: 'scale(0.95)',
      slideUp: 'translateY(100%)',
      slideDown: 'translateY(-100%)',
      fadeIn: 'opacity: 0'
    }
  },
  
  material: {
    // Material Design 애니메이션
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
    },
    transform: {
      scale: 'scale(0.9)',
      slideUp: 'translateY(56px)',
      slideDown: 'translateY(-56px)',
      fadeIn: 'opacity: 0'
    }
  },
  
  web: {
    // 웹 표준 애니메이션
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '400ms'
    },
    easing: {
      default: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    },
    transform: {
      scale: 'scale(0.98)',
      slideUp: 'translateY(20px)',
      slideDown: 'translateY(-20px)',
      fadeIn: 'opacity: 0'
    }
  }
}
