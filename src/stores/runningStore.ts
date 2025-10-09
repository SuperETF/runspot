import { create } from 'zustand'
import { Course, RunningStats, GPSCoordinate, TrackingState, DeviationWarning } from '@/types/database'

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

export const useRunningStore = create<RunningState>((set, get) => ({
  // Initial state
  trackingState: 'idle',
  courseData: null,
  currentStats: defaultStats,
  userPath: [],
  currentPosition: null,
  deviationWarnings: [],
  sessionStartTime: null,
  pausedTime: 0,
  
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
    set({
      trackingState: 'running',
      courseData: course,
      currentStats: defaultStats,
      userPath: [],
      deviationWarnings: [],
      sessionStartTime: new Date(),
      pausedTime: 0
    })
  },
  
  pauseTracking: () => {
    const state = get()
    if (state.trackingState === 'running') {
      set({ 
        trackingState: 'paused',
        pausedTime: state.pausedTime + (Date.now() - (state.sessionStartTime?.getTime() || 0))
      })
    }
  },
  
  resumeTracking: () => {
    const state = get()
    if (state.trackingState === 'paused') {
      set({ 
        trackingState: 'running',
        sessionStartTime: new Date()
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
      pausedTime: 0
    })
  },
  
  completeTracking: () => {
    set({ trackingState: 'completed' })
  }
}))
