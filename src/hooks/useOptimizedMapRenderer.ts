import { useRef, useCallback, useEffect } from 'react'
import { useWebWorker } from './useWebWorker'

interface MapObject {
  id: string
  type: 'marker' | 'polyline' | 'infoWindow'
  object: any
  lastUpdate: number
}

interface RenderTask {
  type: 'UPDATE_MARKER' | 'UPDATE_POLYLINE' | 'BATCH_UPDATE'
  data: any
  priority: 'high' | 'medium' | 'low'
}

interface UseOptimizedMapRendererOptions {
  map: any
  maxFPS?: number
  enableBatching?: boolean
  batteryOptimized?: boolean
}

export const useOptimizedMapRenderer = (options: UseOptimizedMapRendererOptions) => {
  const { map, maxFPS = 60, enableBatching = true, batteryOptimized = true } = options
  
  const mapObjectsRef = useRef<Map<string, MapObject>>(new Map())
  const renderQueueRef = useRef<RenderTask[]>([])
  const lastRenderTimeRef = useRef<number>(0)
  const frameRequestRef = useRef<number | null>(null)
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 배터리 정보
  const batteryLevelRef = useRef<number>(1.0)
  
  // FPS 제한 계산
  const frameInterval = 1000 / maxFPS
  
  // 배터리 레벨 모니터링
  useEffect(() => {
    const monitorBattery = async () => {
      try {
        // @ts-ignore
        const battery = await navigator.getBattery?.()
        if (battery) {
          const updateLevel = () => {
            batteryLevelRef.current = battery.level
          }
          updateLevel()
          battery.addEventListener('levelchange', updateLevel)
          return () => battery.removeEventListener('levelchange', updateLevel)
        }
      } catch (error) {
        console.log('배터리 API 사용 불가:', error)
      }
    }
    
    monitorBattery()
  }, [])
  
  // 렌더링 우선순위 결정
  const getRenderPriority = useCallback((task: RenderTask): number => {
    const batteryLevel = batteryLevelRef.current
    
    // 배터리 레벨에 따른 우선순위 조정
    let basePriority = 0
    switch (task.priority) {
      case 'high': basePriority = 3; break
      case 'medium': basePriority = 2; break
      case 'low': basePriority = 1; break
    }
    
    // 배터리가 부족하면 우선순위 낮춤
    if (batteryLevel < 0.2) {
      basePriority = Math.max(1, basePriority - 1)
    }
    
    return basePriority
  }, [])
  
  // 렌더링 작업 처리
  const processRenderQueue = useCallback(() => {
    if (!map || renderQueueRef.current.length === 0) {
      frameRequestRef.current = null
      return
    }
    
    const now = performance.now()
    const timeSinceLastRender = now - lastRenderTimeRef.current
    
    // FPS 제한 확인
    if (timeSinceLastRender < frameInterval) {
      frameRequestRef.current = requestAnimationFrame(processRenderQueue)
      return
    }
    
    const batteryLevel = batteryLevelRef.current
    
    // 배터리 레벨에 따른 처리량 조절
    let maxTasksPerFrame = batteryLevel > 0.5 ? 10 : batteryLevel > 0.2 ? 5 : 2
    
    // 우선순위 정렬
    renderQueueRef.current.sort((a, b) => getRenderPriority(b) - getRenderPriority(a))
    
    const tasksToProcess = renderQueueRef.current.splice(0, maxTasksPerFrame)
    
    try {
      // 배치 처리
      const markerUpdates: any[] = []
      const polylineUpdates: any[] = []
      
      tasksToProcess.forEach(task => {
        switch (task.type) {
          case 'UPDATE_MARKER':
            if (enableBatching) {
              markerUpdates.push(task.data)
            } else {
              updateMarkerImmediate(task.data)
            }
            break
            
          case 'UPDATE_POLYLINE':
            if (enableBatching) {
              polylineUpdates.push(task.data)
            } else {
              updatePolylineImmediate(task.data)
            }
            break
            
          case 'BATCH_UPDATE':
            processBatchUpdate(task.data)
            break
        }
      })
      
      // 배치 업데이트 실행
      if (markerUpdates.length > 0) {
        batchUpdateMarkers(markerUpdates)
      }
      
      if (polylineUpdates.length > 0) {
        batchUpdatePolylines(polylineUpdates)
      }
      
    } catch (error) {
      console.error('렌더링 오류:', error)
    }
    
    lastRenderTimeRef.current = now
    
    // 더 처리할 작업이 있으면 계속
    if (renderQueueRef.current.length > 0) {
      frameRequestRef.current = requestAnimationFrame(processRenderQueue)
    } else {
      frameRequestRef.current = null
    }
  }, [map, frameInterval, enableBatching, getRenderPriority])
  
  // 마커 즉시 업데이트
  const updateMarkerImmediate = useCallback((data: any) => {
    if (!map || !(window as any).kakao?.maps?.LatLng) return
    
    try {
      const { id, position, options = {} } = data
      const existingObject = mapObjectsRef.current.get(id)
      
      if (existingObject && existingObject.type === 'marker') {
        // 기존 마커 위치 업데이트
        const newPosition = new (window as any).kakao.maps.LatLng(position.lat, position.lng)
        existingObject.object.setPosition(newPosition)
        existingObject.lastUpdate = Date.now()
      } else {
        // 새 마커 생성
        const markerPosition = new (window as any).kakao.maps.LatLng(position.lat, position.lng)
        const marker = new (window as any).kakao.maps.Marker({
          position: markerPosition,
          map: map,
          ...options
        })
        
        mapObjectsRef.current.set(id, {
          id,
          type: 'marker',
          object: marker,
          lastUpdate: Date.now()
        })
      }
    } catch (error) {
      console.error('마커 업데이트 오류:', error)
    }
  }, [map])
  
  // 폴리라인 즉시 업데이트
  const updatePolylineImmediate = useCallback((data: any) => {
    if (!map || !(window as any).kakao?.maps?.Polyline) return
    
    try {
      const { id, path, options = {} } = data
      const existingObject = mapObjectsRef.current.get(id)
      
      if (existingObject && existingObject.type === 'polyline') {
        // 기존 폴리라인 제거
        existingObject.object.setMap(null)
      }
      
      // 새 폴리라인 생성
      const linePath = path.map((point: any) => 
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
      
      mapObjectsRef.current.set(id, {
        id,
        type: 'polyline',
        object: polyline,
        lastUpdate: Date.now()
      })
    } catch (error) {
      console.error('폴리라인 업데이트 오류:', error)
    }
  }, [map])
  
  // 배치 마커 업데이트
  const batchUpdateMarkers = useCallback((updates: any[]) => {
    // DOM 조작을 최소화하기 위해 배치 처리
    const fragment = document.createDocumentFragment()
    
    updates.forEach(data => {
      updateMarkerImmediate(data)
    })
  }, [updateMarkerImmediate])
  
  // 배치 폴리라인 업데이트
  const batchUpdatePolylines = useCallback((updates: any[]) => {
    updates.forEach(data => {
      updatePolylineImmediate(data)
    })
  }, [updatePolylineImmediate])
  
  // 배치 업데이트 처리
  const processBatchUpdate = useCallback((data: any) => {
    const { markers = [], polylines = [] } = data
    
    if (markers.length > 0) {
      batchUpdateMarkers(markers)
    }
    
    if (polylines.length > 0) {
      batchUpdatePolylines(polylines)
    }
  }, [batchUpdateMarkers, batchUpdatePolylines])
  
  // 렌더링 작업 추가
  const addRenderTask = useCallback((task: RenderTask) => {
    renderQueueRef.current.push(task)
    
    // 렌더링 루프 시작
    if (!frameRequestRef.current) {
      frameRequestRef.current = requestAnimationFrame(processRenderQueue)
    }
  }, [processRenderQueue])
  
  // 마커 업데이트 (외부 API)
  const updateMarker = useCallback((id: string, position: any, options?: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
    addRenderTask({
      type: 'UPDATE_MARKER',
      data: { id, position, options },
      priority
    })
  }, [addRenderTask])
  
  // 폴리라인 업데이트 (외부 API)
  const updatePolyline = useCallback((id: string, path: any[], options?: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
    addRenderTask({
      type: 'UPDATE_POLYLINE',
      data: { id, path, options },
      priority
    })
  }, [addRenderTask])
  
  // 배치 업데이트 (외부 API)
  const batchUpdate = useCallback((data: any, priority: 'high' | 'medium' | 'low' = 'low') => {
    addRenderTask({
      type: 'BATCH_UPDATE',
      data,
      priority
    })
  }, [addRenderTask])
  
  // 객체 제거
  const removeObject = useCallback((id: string) => {
    const object = mapObjectsRef.current.get(id)
    if (object) {
      try {
        if (object.type === 'marker' || object.type === 'polyline') {
          object.object.setMap(null)
        } else if (object.type === 'infoWindow') {
          object.object.close()
        }
      } catch (error) {
        console.error('객체 제거 오류:', error)
      }
      
      mapObjectsRef.current.delete(id)
    }
  }, [])
  
  // 모든 객체 정리
  const clearAllObjects = useCallback(() => {
    mapObjectsRef.current.forEach((object, id) => {
      removeObject(id)
    })
    
    // 렌더링 큐 정리
    renderQueueRef.current = []
    
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current)
      frameRequestRef.current = null
    }
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
      batchTimeoutRef.current = null
    }
  }, [removeObject])
  
  // 성능 메트릭
  const getPerformanceMetrics = useCallback(() => {
    return {
      objectCount: mapObjectsRef.current.size,
      queueSize: renderQueueRef.current.length,
      batteryLevel: batteryLevelRef.current,
      isRendering: frameRequestRef.current !== null,
      lastRenderTime: lastRenderTimeRef.current
    }
  }, [])
  
  // 정리
  useEffect(() => {
    return () => {
      clearAllObjects()
    }
  }, [clearAllObjects])
  
  return {
    updateMarker,
    updatePolyline,
    batchUpdate,
    removeObject,
    clearAllObjects,
    getPerformanceMetrics
  }
}
