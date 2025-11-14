'use client'

import React from 'react'
import { Home, Play, Store, Bookmark, User } from 'lucide-react'
import { usePlatformDetection } from '@/hooks/usePlatformDetection'
import { useSafeArea } from '@/hooks/useSafeArea'
import { useRouter, usePathname } from 'next/navigation'

interface TabItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
}

interface SafeAreaTabBarProps {
  className?: string
}

const tabItems: TabItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    path: '/'
  },
  {
    id: 'running',
    label: '런닝',
    icon: Play,
    path: '/running'
  },
  {
    id: 'spots',
    label: '스팟',
    icon: Store,
    path: '/spots'
  },
  {
    id: 'saved',
    label: '저장',
    icon: Bookmark,
    path: '/saved'
  },
  {
    id: 'profile',
    label: '프로필',
    icon: User,
    path: '/profile'
  }
]

export default function SafeAreaTabBar({ className = '' }: SafeAreaTabBarProps) {
  const { isIOS, isAndroid } = usePlatformDetection()
  const { safeAreaInsets, viewport, hasHomeIndicator } = useSafeArea()
  const router = useRouter()
  const pathname = usePathname()

  const handleTabPress = (path: string) => {
    router.push(path)
  }

  // iOS Cupertino 스타일 탭 바
  const CupertinoTabBar = () => {
    const tabHeight = 49
    const totalHeight = tabHeight + safeAreaInsets.bottom
    
    return (
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white/95 backdrop-blur-xl border-t border-gray-200/30
          ${className}
        `}
        style={{ 
          height: `${totalHeight}px`,
          paddingBottom: `${safeAreaInsets.bottom}px`,
          paddingLeft: `${safeAreaInsets.left}px`,
          paddingRight: `${safeAreaInsets.right}px`
        }}
      >
        <div 
          className="flex items-center justify-around px-2"
          style={{ height: `${tabHeight}px` }}
        >
          {tabItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabPress(item.path)}
                className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ease-out active:scale-95"
                style={{ minHeight: `${tabHeight}px` }}
              >
                <div className="relative mb-1">
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span 
                  className={`text-xs font-medium transition-colors duration-200 ${
                    isActive ? 'text-blue-500' : 'text-gray-400'
                  }`}
                  style={{ 
                    fontSize: '10px',
                    letterSpacing: '0.01em'
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Android Material Design 3 스타일 네비게이션 바
  const MaterialNavigationBar = () => {
    const tabHeight = 64
    const totalHeight = tabHeight + safeAreaInsets.bottom
    
    return (
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white shadow-lg border-t border-gray-100
          ${className}
        `}
        style={{ 
          height: `${totalHeight}px`,
          paddingBottom: `${safeAreaInsets.bottom}px`,
          paddingLeft: `${safeAreaInsets.left}px`,
          paddingRight: `${safeAreaInsets.right}px`
        }}
      >
        <div 
          className="flex items-center justify-around px-4"
          style={{ height: `${tabHeight}px` }}
        >
          {tabItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabPress(item.path)}
                className={`
                  flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-2xl
                  transition-all duration-300 relative overflow-hidden
                  ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
                style={{ 
                  minHeight: `${tabHeight}px`,
                  transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
                }}
              >
                {/* Material Design 3 State Layer */}
                {isActive && (
                  <div 
                    className="absolute inset-0 bg-blue-500/10 rounded-2xl"
                    style={{
                      animation: 'materialRipple 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
                    }}
                  />
                )}
                
                <div className="relative mb-1">
                  <div 
                    className={`
                      p-1 rounded-full transition-all duration-300
                      ${isActive ? 'bg-blue-500' : 'bg-transparent'}
                    `}
                  >
                    <Icon 
                      className={`w-6 h-6 transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}
                    />
                  </div>
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                
                <span 
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isActive ? 'text-blue-700' : 'text-gray-600'
                  }`}
                  style={{ 
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    fontWeight: isActive ? '500' : '400'
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 웹 스타일 네비게이션 바
  const WebNavigationBar = () => {
    const tabHeight = 56
    const totalHeight = tabHeight + safeAreaInsets.bottom
    
    return (
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white border-t border-gray-200 shadow-lg
          ${className}
        `}
        style={{ 
          height: `${totalHeight}px`,
          paddingBottom: `${safeAreaInsets.bottom}px`
        }}
      >
        <div 
          className="flex items-center justify-around px-6"
          style={{ height: `${tabHeight}px` }}
        >
          {tabItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabPress(item.path)}
                className={`
                  flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg
                  transition-all duration-200 hover:bg-gray-50
                  ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <div className="relative mb-1">
                  <Icon className="w-6 h-6" />
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 플랫폼별 컴포넌트 선택
  if (isIOS) {
    return <CupertinoTabBar />
  } else if (isAndroid) {
    return <MaterialNavigationBar />
  } else {
    return <WebNavigationBar />
  }
}

// 탭바 높이를 반환하는 유틸리티 훅
export function useTabBarHeight() {
  const { isIOS, isAndroid } = usePlatformDetection()
  const { safeAreaInsets } = useSafeArea()
  
  const getTabBarHeight = () => {
    if (isIOS) {
      return 49 + safeAreaInsets.bottom
    } else if (isAndroid) {
      return 64 + safeAreaInsets.bottom
    } else {
      return 56 + safeAreaInsets.bottom
    }
  }
  
  return getTabBarHeight()
}
