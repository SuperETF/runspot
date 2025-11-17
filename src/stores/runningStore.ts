import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Course, RunningStats, GPSCoordinate, TrackingState, DeviationWarning } from '@/types/database'
import { calculateDistance, calculateCourseTotalDistance, calculateCourseProgressAlongRoute } from '@/utils/mapUtils'

interface RunningState {
  // Tracking state
  trackingState: TrackingState
  setTrackingState: (state: TrackingState) => void
  
  // Current course being tracked
  courseData: Course | null
  setCourseData: (course: Course | null) => void
  
  // Real-time statistics
  currentStats: RunningStats
  updateStats: (stats: Partial<RunningStats>) => void
  resetStats: () => void
  
  // Course-based navigation distances (km)
  totalCourseDistance: number
  distanceAlongCourse: number
  remainingCourseDistance: number
  
  // GPS tracking
  userPath: GPSCoordinate[]
  addGPSPoint: (point: GPSCoordinate) => void
  clearUserPath: () => void
  
  // Current position
  currentPosition: GPSCoordinate | null
  setCurrentPosition: (position: GPSCoordinate | null) => void
  
  // Deviation warnings
  deviationWarnings: DeviationWarning[]
  addDeviationWarning: (warning: DeviationWarning) => void
  clearDeviationWarnings: () => void
  
  // Session data
  sessionStartTime: Date | null
  setSessionStartTime: (time: Date | null) => void
  
  // Pause/resume functionality
  pausedTime: number
  setPausedTime: (time: number) => void
  
  // Actions
  startTracking: (course: Course) => void
  updatePosition: (position: GPSCoordinate) => void
  pauseTracking: () => void
  resumeTracking: () => void
  stopTracking: () => void
  completeTracking: () => void
}

const defaultStats: RunningStats = {
  distance: 0,
  duration: 0,
  speed: 0,
  pace: 0,
  calories: 0,
  progress: 0
}

export const useRunningStore = create<RunningState>()(
  persist(
    (set, get) => ({
  // Initial state
  trackingState: 'idle',
  courseData: null,
  currentStats: defaultStats,
  userPath: [],
  currentPosition: null,
  deviationWarnings: [],
  sessionStartTime: null,
  pausedTime: 0,
  totalCourseDistance: 0,
  distanceAlongCourse: 0,
  remainingCourseDistance: 0,
  
  // Actions
  setTrackingState: (state) => 
    set({ trackingState: state }),
    
  setCourseData: (course) => 
    set({ courseData: course }),
    
  updateStats: (newStats) => 
    set((state) => ({ 
      currentStats: { ...state.currentStats, ...newStats } 
    })),
    
  resetStats: () => 
    set({ currentStats: defaultStats }),
    
  addGPSPoint: (point) => 
    set((state) => ({ 
      userPath: [...state.userPath, point] 
    })),
    
  clearUserPath: () => 
    set({ userPath: [] }),
    
  setCurrentPosition: (position) => 
    set({ currentPosition: position }),
    
  addDeviationWarning: (warning) => 
    set((state) => ({ 
      deviationWarnings: [...state.deviationWarnings, warning] 
    })),
    
  clearDeviationWarnings: () => 
    set({ deviationWarnings: [] }),
    
  setSessionStartTime: (time) => 
    set({ sessionStartTime: time }),
    
  setPausedTime: (time) => 
    set({ pausedTime: time }),
    
  startTracking: (course) => {
    const totalCourseDistance = course.gps_route ? calculateCourseTotalDistance(course.gps_route as any) : 0
    set({
      trackingState: 'running',
      courseData: course,
      currentStats: defaultStats,
      userPath: [],
      currentPosition: null,
      deviationWarnings: [],
      sessionStartTime: new Date(),
      pausedTime: 0,
      totalCourseDistance,
      distanceAlongCourse: 0,
      remainingCourseDistance: totalCourseDistance
    })
  },
  
  updatePosition: (position) => {
    const state = get()

    // 현재 위치 업데이트 및 경로에 추가
    const newPath = state.currentPosition
      ? [...state.userPath, position]
      : state.userPath.length === 0
        ? [position]
        : [...state.userPath, position]

    // 이전 포인트와의 거리 계산 (km → m)
    let addedDistanceMeters = 0
    if (state.currentPosition) {
      const segmentKm = calculateDistance(state.currentPosition, position)
      addedDistanceMeters = segmentKm * 1000
    } else if (state.userPath.length > 0) {
      const last = state.userPath[state.userPath.length - 1]
      const segmentKm = calculateDistance(last, position)
      addedDistanceMeters = segmentKm * 1000
    }

    const now = new Date()
    const sessionStartTime = state.sessionStartTime
    const elapsedMs = sessionStartTime ? now.getTime() - sessionStartTime.getTime() - state.pausedTime : 0
    const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000))

    const newDistanceMeters = state.currentStats.distance * 1000 + addedDistanceMeters
    const newDistanceKm = newDistanceMeters / 1000

    // 속도/페이스 계산 (단순 모델)
    let speed = state.currentStats.speed
    let pace = state.currentStats.pace
    if (newDistanceKm > 0 && elapsedSec > 0) {
      const hours = elapsedSec / 3600
      speed = newDistanceKm / hours // km/h
      const paceMinutes = (elapsedSec / 60) / newDistanceKm // 분/km
      pace = paceMinutes
    }

    const calories = state.currentStats.calories

    // 코스 기준 진행/남은 거리 계산 (gps_route가 있을 때만)
    let totalCourseDistance = state.totalCourseDistance
    let distanceAlongCourse = state.distanceAlongCourse
    let remainingCourseDistance = state.remainingCourseDistance

    if (state.courseData?.gps_route && state.courseData.gps_route.length > 1) {
      const progress = calculateCourseProgressAlongRoute(state.courseData.gps_route as any, position)
      totalCourseDistance = progress.totalDistance
      distanceAlongCourse = progress.distanceAlongRoute
      remainingCourseDistance = progress.remainingDistance
    }

    set({
      currentPosition: position,
      userPath: newPath,
      currentStats: {
        ...state.currentStats,
        distance: newDistanceKm,
        duration: elapsedSec,
        speed,
        pace,
        calories,
        progress: totalCourseDistance > 0 ? distanceAlongCourse / totalCourseDistance : state.currentStats.progress
      },
      totalCourseDistance,
      distanceAlongCourse,
      remainingCourseDistance
    })
  },
  
  pauseTracking: () => {
    const state = get()
    if (state.trackingState === 'running' && state.sessionStartTime) {
      const pauseStartTime = Date.now()
      const sessionStart = state.sessionStartTime.getTime()
      const currentRunTime = pauseStartTime - sessionStart - state.pausedTime
      
      set({ 
        trackingState: 'paused',
        // 일시정지 시점을 저장 (resume 시 계산용)
        pausedTime: state.pausedTime + currentRunTime
      })
    }
  },
  
  resumeTracking: () => {
    const state = get()
    if (state.trackingState === 'paused') {
      // 일시정지 시간은 그대로 유지하고 상태만 변경
      set({ 
        trackingState: 'running'
        // sessionStartTime은 그대로 유지
      })
    }
  },
  
  stopTracking: () => {
    set({
      trackingState: 'idle',
      courseData: null,
      currentStats: defaultStats,
      userPath: [],
      currentPosition: null,
      deviationWarnings: [],
      sessionStartTime: null,
      pausedTime: 0,
      totalCourseDistance: 0,
      distanceAlongCourse: 0,
      remainingCourseDistance: 0
    })
    // localStorage에서 런닝 데이터 제거
    localStorage.removeItem('running-store')
  },
  
  completeTracking: () => {
    set({ trackingState: 'completed' })
    // 완주 시에는 데이터 유지 (결과 확인을 위해)
  }
}),
    {
      name: 'running-store', // localStorage 키 이름
      partialize: (state) => ({
        // 런닝 중일 때만 저장할 데이터 선택
        trackingState: state.trackingState,
        courseData: state.courseData,
        currentStats: state.currentStats,
        userPath: state.userPath,
        currentPosition: state.currentPosition,
        sessionStartTime: state.sessionStartTime,
        pausedTime: state.pausedTime,
        totalCourseDistance: state.totalCourseDistance,
        distanceAlongCourse: state.distanceAlongCourse,
        remainingCourseDistance: state.remainingCourseDistance,
      }),
      // 런닝 중이 아닐 때는 저장하지 않음
      skipHydration: false,
    }
  )
)
