import { create } from 'zustand'
import { Course, CourseFilters, GPSCoordinate } from '@/types/database'

interface CourseState {
  // Filters
  filters: CourseFilters
  setFilters: (filters: Partial<CourseFilters>) => void
  resetFilters: () => void
  
  // Selected course
  selectedCourse: Course | null
  setSelectedCourse: (course: Course | null) => void
  
  // User location
  userLocation: GPSCoordinate | null
  setUserLocation: (location: GPSCoordinate | null) => void
  
  // Courses list
  courses: Course[]
  setCourses: (courses: Course[]) => void
  addCourse: (course: Course) => void
  updateCourse: (courseId: string, updates: Partial<Course>) => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // View mode (map/list)
  viewMode: 'map' | 'list' | 'split'
  setViewMode: (mode: 'map' | 'list' | 'split') => void
}

const defaultFilters: CourseFilters = {
  difficulty: null,
  course_type: null,
  area: null,
  distance: [0, 30],
  search: ''
}

export const useCourseStore = create<CourseState>((set) => ({
  // Initial state
  filters: defaultFilters,
  selectedCourse: null,
  userLocation: null,
  courses: [],
  isLoading: false,
  viewMode: 'split',
  
  // Actions
  setFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    })),
    
  resetFilters: () => 
    set({ filters: defaultFilters }),
    
  setSelectedCourse: (course) => 
    set({ selectedCourse: course }),
    
  setUserLocation: (location) => 
    set({ userLocation: location }),
    
  setCourses: (courses) => 
    set({ courses }),
    
  addCourse: (course) => 
    set((state) => ({ 
      courses: [...state.courses, course] 
    })),
    
  updateCourse: (courseId, updates) => 
    set((state) => ({
      courses: state.courses.map(course => 
        course.id === courseId ? { ...course, ...updates } : course
      )
    })),
    
  setIsLoading: (loading) => 
    set({ isLoading: loading }),
    
  setViewMode: (mode) => 
    set({ viewMode: mode })
}))
