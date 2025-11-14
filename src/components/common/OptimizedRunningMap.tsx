'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { GPSCoordinate } from '@/types/database'
import LocationPermission from './LocationPermission'
import { Navigation, Battery, Zap, Activity } from 'lucide-react'
import { useBatteryOptimizedGPS } from '@/hooks/useBatteryOptimizedGPS'
import { useOptimizedMapRenderer } from '@/hooks/useOptimizedMapRenderer'
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization'
import { useKakaoMap } from '@/hooks/useKakaoMap'

interface OptimizedGPSPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy?: number
}

interface OptimizedRunningMapProps {
  isRunning: boolean
  onLocationUpdate?: (location: OptimizedGPSPoint) => void
  onDistanceUpdate?: (distance: number) => void
  courseRoute?: Array<{ lat: number; lng: number }>
  userLocation?: { lat: number; lng: number } | null
  showStartPoint?: boolean
  currentCheckpoint?: number
  passedCheckpoints?: number[]
  isCompleted?: boolean
}

export default function OptimizedRunningMap({ 
  isRunning, 
  onLocationUpdate, 
  onDistanceUpdate, 
  courseRoute = [], 
  userLocation, 
  showStartPoint = false,
  currentCheckpoint = 0,
  passedCheckpoints = [],
  isCompleted = false
}: OptimizedRunningMapProps) {
  // 배터리 최적화 훅
  const {
    batteryInfo,
    optimizationSettings,
    isLowPowerMode,
    getGPSOptions,
    getRenderSettings,
    shouldRunBackgroundTask,
    getBatteryStatus
  } = useBatteryOptimization({
    onBatteryLevelChange: (level, settings) => {
      console.log(`🔋 배터리 레벨 변경: ${Math.round(level * 100)}%`, settings)
    },
    onOptimizationChange: (settings) => {
      console.log('⚡ 최적화 설정 변경:', settings)
    }
  })
  
  // 카카오맵 훅
  const { 
    mapContainer, 
    map, 
    isMapReady, 
    initializeMap, 
    clearAllMapObjects 
  } = useKakaoMap({
    onMapReady: (kakaoMap) => {
      console.log('🗺️ 최적화된 지도 준비 완료')
    }
  })
  
  // 최적화된 지도 렌더러
  const {
    updateMarker,
    updatePolyline,
    batchUpdate,
    removeObject,
    getPerformanceMetrics
  } = useOptimizedMapRenderer({
    map,
    maxFPS: getRenderSettings().maxFPS,
    enableBatching: optimizationSettings.backgroundProcessing,
    batteryOptimized: true
  })
  
  // 배터리 최적화된 GPS 추적
  const { 
    gpsPath, 
    currentLocation, 
    totalDistance, 
    error: gpsError,
    resetPath,
    getPerformanceMetrics: getGPSMetrics
  } = useBatteryOptimizedGPS(isRunning, {
    onLocationUpdate: (location) => {
      onLocationUpdate?.(location)
      
      // 현재 위치 마커 업데이트 (고우선순위)
      if (isMapReady) {
        updateMarker('current-location', location, {
          title: '현재 위치'
        }, 'high')
      }
    },
    onDistanceUpdate,
    onBatteryLevelChange: (level) => {
      console.log(`📍 GPS 배터리 최적화: ${Math.round(level * 100)}%`)
    }
  })
  
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [performanceStats, setPerformanceStats] = useState<any>({})
  
  // 카카오맵 초기화
  useEffect(() => {
    const loadKakaoMaps = () => {
      if ((window as any).kakao && (window as any).kakao.maps) {
        if ((window as any).kakao.maps.LatLng) {
          initializeMapWithLocation()
        } else {
          (window as any).kakao.maps.load(() => {
            initializeMapWithLocation()
          })
        }
      } else {
        setTimeout(loadKakaoMaps, 100)
      }
    }
    
    const initializeMapWithLocation = () => {
      if (navigator.geolocation) {
        const gpsOptions = getGPSOptions()
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationPermission('granted')
            const success = initializeMap({
              center: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              },
              level: 3
            })
            
            if (success) {
              updateMarker('current-location', {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }, { title: '현재 위치' }, 'high')
            }
          },
          (error) => {
            setLocationPermission('denied')
            initializeMap({
              center: { lat: 37.5665, lng: 126.9780 },
              level: 3
            })
          },
          gpsOptions
        )
      } else {
        initializeMap({
          center: { lat: 37.5665, lng: 126.9780 },
          level: 3
        })
      }
    }
    
    loadKakaoMaps()
  }, [initializeMap, updateMarker, getGPSOptions])
  
  // 코스 경로 표시 (배터리 최적화)
  useEffect(() => {
    if (!isMapReady || !courseRoute || courseRoute.length < 2) return
    
    // 배터리 레벨에 따른 경로 단순화
    const shouldSimplify = batteryInfo.level < 0.3 && courseRoute.length > 50
    const routeToRender = shouldSimplify ? 
      courseRoute.filter((_, index) => index % 2 === 0) : // 50% 포인트 제거
      courseRoute
    
    // 코스 경로선 업데이트 (중우선순위)
    updatePolyline('course-route', routeToRender, {
      strokeWeight: batteryInfo.level > 0.5 ? 6 : 4,
      strokeColor: '#FF6B35',
      strokeOpacity: batteryInfo.level > 0.3 ? 0.7 : 0.5,
      strokeStyle: 'shortdash'
    }, 'medium')
    
    // 시작점 마커 표시
    if (showStartPoint && courseRoute.length > 0) {
      const startPoint = courseRoute[0]
      updateMarker('start-point', startPoint, {
        title: '시작점'
      }, 'medium')
    }
  }, [isMapReady, courseRoute, showStartPoint, updatePolyline, updateMarker, batteryInfo.level])
  
  // GPS 경로 표시 (실시간 업데이트)
  useEffect(() => {
    if (!isMapReady || gpsPath.length < 2) return
    
    // 배터리 최적화: 낮은 배터리에서는 업데이트 빈도 감소
    const shouldUpdate = batteryInfo.level > 0.2 || gpsPath.length % 5 === 0
    
    if (shouldUpdate) {
      updatePolyline('gps-path', gpsPath, {
        strokeWeight: batteryInfo.level > 0.5 ? 5 : 3,
        strokeColor: '#00FF88',
        strokeOpacity: batteryInfo.level > 0.3 ? 0.8 : 0.6,
        strokeStyle: 'solid'
      }, 'high')
    }
  }, [isMapReady, gpsPath, updatePolyline, batteryInfo.level])
  
  // 성능 모니터링 (백그라운드 작업)
  useEffect(() => {
    if (!shouldRunBackgroundTask('analytics')) return
    
    const interval = setInterval(() => {
      const renderMetrics = getPerformanceMetrics()
      const gpsMetrics = getGPSMetrics()
      const batteryStatus = getBatteryStatus()
      
      setPerformanceStats({
        render: renderMetrics,
        gps: gpsMetrics,
        battery: batteryStatus,
        timestamp: Date.now()
      })
    }, optimizationSettings.updateFrequency * 5) // 5배 간격으로 모니터링
    
    return () => clearInterval(interval)
  }, [
    shouldRunBackgroundTask, 
    getPerformanceMetrics, 
    getGPSMetrics, 
    getBatteryStatus, 
    optimizationSettings.updateFrequency
  ])
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearAllMapObjects()
      resetPath()
    }
  }, [clearAllMapObjects, resetPath])
  
  // 위치 권한이 거부된 경우
  if (locationPermission === 'denied') {
    return (
      <div className="relative w-full h-[300px] bg-gray-900 rounded-2xl overflow-hidden">
        <LocationPermission 
          onPermissionGranted={(position) => {
            setLocationPermission('granted')
            const success = initializeMap({
              center: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              },
              level: 3
            })
            
            if (success) {
              updateMarker('current-location', {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }, { title: '현재 위치' }, 'high')
            }
          }}
          onPermissionDenied={() => {
            setLocationPermission('denied')
          }}
        />
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-[300px] bg-gray-900 rounded-2xl overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ background: '#1a1a1a' }}
      />
      
      {/* 배터리 상태 표시 */}
      {isLowPowerMode && (
        <div className="absolute top-3 left-3 bg-orange-500/20 border border-orange-500 rounded-xl px-3 py-2 z-10">
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <Battery className="w-4 h-4" />
            <span>절전 모드</span>
          </div>
        </div>
      )}
      
      {/* GPS 오류 표시 */}
      {gpsError && (
        <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500 rounded-xl px-3 py-2 z-10">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <Navigation className="w-4 h-4" />
            <span>GPS 오류</span>
          </div>
        </div>
      )}
      
      {/* 런닝 상태 표시 */}
      {isRunning && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-[#00FF88]/20 border border-[#00FF88] rounded-xl px-3 py-2 z-10">
          <div className="flex items-center gap-2 text-sm text-[#00FF88]">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            <span>최적화된 GPS 추적</span>
            {batteryInfo.level < 0.5 && (
              <Zap className="w-3 h-3 ml-1" />
            )}
          </div>
        </div>
      )}
      
      {/* 거리 및 성능 정보 */}
      {totalDistance > 0 && (
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md rounded-xl px-3 py-2 z-10">
          <div className="text-sm text-white space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[#00FF88] font-semibold">
                {totalDistance.toFixed(2)}km
              </span>
              {optimizationSettings.backgroundProcessing && (
                <Activity className="w-3 h-3 text-green-400" />
              )}
            </div>
            
            {/* 개발 모드에서만 성능 정보 표시 */}
            {process.env.NODE_ENV === 'development' && performanceStats.battery && (
              <div className="text-xs text-gray-400">
                배터리: {performanceStats.battery.level}% | 
                FPS: {getRenderSettings().maxFPS} | 
                객체: {performanceStats.render?.objectCount || 0}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 배터리 최적화 알림 */}
      {batteryInfo.level < 0.2 && !batteryInfo.charging && (
        <div className="absolute bottom-3 right-3 bg-red-500/20 border border-red-500 rounded-xl px-3 py-2 z-10">
          <div className="text-xs text-red-400 text-center">
            <Battery className="w-4 h-4 mx-auto mb-1" />
            <div>배터리 부족</div>
            <div>성능 제한됨</div>
          </div>
        </div>
      )}
    </div>
  )
}
