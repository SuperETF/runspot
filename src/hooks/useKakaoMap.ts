import { useRef, useState, useEffect, useCallback } from 'react'

interface MapOptions {
  center: { lat: number; lng: number }
  level?: number
}

interface UseKakaoMapOptions {
  onMapReady?: (map: any) => void
}

export const useKakaoMap = (options: UseKakaoMapOptions = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  
  // 지도 객체들 참조 (메모리 관리용)
  const mapObjectsRef = useRef<{
    markers: any[]
    polylines: any[]
    infoWindows: any[]
  }>({
    markers: [],
    polylines: [],
    infoWindows: []
  })

  const { onMapReady } = options

  // 카카오맵 초기화
  const initializeMap = useCallback((mapOptions: MapOptions) => {
    if (!(window as any).kakao?.maps?.LatLng || !mapContainer.current) {
      return false
    }

    try {
      const options = {
        center: new (window as any).kakao.maps.LatLng(mapOptions.center.lat, mapOptions.center.lng),
        level: mapOptions.level || 3
      }

      const kakaoMap = new (window as any).kakao.maps.Map(mapContainer.current, options)
      setMap(kakaoMap)
      setIsMapReady(true)
      onMapReady?.(kakaoMap)
      
      return true
    } catch (error) {
      console.error('카카오맵 초기화 오류:', error)
      return false
    }
  }, [onMapReady])

  // 마커 추가 (메모리 관리)
  const addMarker = useCallback((position: { lat: number; lng: number }, options: any = {}) => {
    if (!map || !(window as any).kakao?.maps?.Marker) return null

    try {
      const markerPosition = new (window as any).kakao.maps.LatLng(position.lat, position.lng)
      const marker = new (window as any).kakao.maps.Marker({
        position: markerPosition,
        map: map,
        ...options
      })

      // 메모리 관리를 위해 참조 저장
      mapObjectsRef.current.markers.push(marker)
      
      return marker
    } catch (error) {
      console.error('마커 생성 오류:', error)
      return null
    }
  }, [map])

  // 폴리라인 추가 (메모리 관리)
  const addPolyline = useCallback((path: Array<{ lat: number; lng: number }>, options: any = {}) => {
    if (!map || !(window as any).kakao?.maps?.Polyline || path.length < 2) return null

    try {
      const linePath = path.map(point => 
        new (window as any).kakao.maps.LatLng(point.lat, point.lng)
      )
      
      const polyline = new (window as any).kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 5,
        strokeColor: '#00FF88',
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        ...options
      })

      polyline.setMap(map)
      
      // 메모리 관리를 위해 참조 저장
      mapObjectsRef.current.polylines.push(polyline)
      
      return polyline
    } catch (error) {
      console.error('폴리라인 생성 오류:', error)
      return null
    }
  }, [map])

  // 정보창 추가 (메모리 관리)
  const addInfoWindow = useCallback((content: string, position: { lat: number; lng: number }) => {
    if (!map || !(window as any).kakao?.maps?.InfoWindow) return null

    try {
      const infoWindow = new (window as any).kakao.maps.InfoWindow({
        content: content
      })

      const markerPosition = new (window as any).kakao.maps.LatLng(position.lat, position.lng)
      infoWindow.open(map, { getPosition: () => markerPosition })
      
      // 메모리 관리를 위해 참조 저장
      mapObjectsRef.current.infoWindows.push(infoWindow)
      
      return infoWindow
    } catch (error) {
      console.error('정보창 생성 오류:', error)
      return null
    }
  }, [map])

  // 지도 범위 설정
  const setBounds = useCallback((points: Array<{ lat: number; lng: number }>) => {
    if (!map || !(window as any).kakao?.maps?.LatLngBounds || points.length === 0) return

    try {
      const bounds = new (window as any).kakao.maps.LatLngBounds()
      points.forEach(point => {
        bounds.extend(new (window as any).kakao.maps.LatLng(point.lat, point.lng))
      })
      map.setBounds(bounds)
    } catch (error) {
      console.error('지도 범위 설정 오류:', error)
    }
  }, [map])

  // 모든 지도 객체 정리
  const clearAllMapObjects = useCallback(() => {
    const objects = mapObjectsRef.current

    // 마커 정리
    objects.markers.forEach(marker => {
      try {
        marker.setMap(null)
      } catch (error) {
        console.error('마커 정리 오류:', error)
      }
    })

    // 폴리라인 정리
    objects.polylines.forEach(polyline => {
      try {
        polyline.setMap(null)
      } catch (error) {
        console.error('폴리라인 정리 오류:', error)
      }
    })

    // 정보창 정리
    objects.infoWindows.forEach(infoWindow => {
      try {
        infoWindow.close()
      } catch (error) {
        console.error('정보창 정리 오류:', error)
      }
    })

    // 참조 초기화
    mapObjectsRef.current = {
      markers: [],
      polylines: [],
      infoWindows: []
    }
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearAllMapObjects()
    }
  }, [clearAllMapObjects])

  return {
    mapContainer,
    map,
    isMapReady,
    initializeMap,
    addMarker,
    addPolyline,
    addInfoWindow,
    setBounds,
    clearAllMapObjects
  }
}
