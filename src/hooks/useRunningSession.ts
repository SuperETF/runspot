'use client'

import { useState, useCallback } from 'react'
import { useRunningStore } from '@/stores/runningStore'

// 임시로 any 타입 사용 (실제 Course 타입이 복잡함)
type Course = any

export function useRunningSession() {
  // 기본 런닝 상태
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // 런닝 스토어 액션들
  const startTracking = useRunningStore((state) => state.startTracking)
  const pauseTrackingStore = useRunningStore((state) => state.pauseTracking)
  const resumeTrackingStore = useRunningStore((state) => state.resumeTracking)
  const stopTrackingStore = useRunningStore((state) => state.stopTracking)

  // 런닝 시작
  const startRunning = useCallback((course: Course) => {
    setIsRunning(true)
    setIsPaused(false)
    startTracking(course)
  }, [startTracking])

  // 런닝 일시정지
  const pauseRunning = useCallback(() => {
    setIsPaused(true)
    pauseTrackingStore()
  }, [pauseTrackingStore])

  // 런닝 재시작
  const resumeRunning = useCallback(() => {
    setIsPaused(false)
    resumeTrackingStore()
  }, [resumeTrackingStore])

  // 런닝 종료
  const stopRunning = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setIsCompleted(true)
    stopTrackingStore()
  }, [stopTrackingStore])

  // 런닝 리셋 (새로 시작할 때)
  const resetRunning = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setIsCompleted(false)
  }, [])

  return {
    // 상태
    isRunning,
    isPaused,
    isCompleted,
    
    // 액션
    startRunning,
    pauseRunning,
    resumeRunning,
    stopRunning,
    resetRunning
  }
}
