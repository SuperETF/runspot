export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          name: string
          description: string
          gps_route: Array<{ lat: number; lng: number }>
          distance: number
          duration: number
          difficulty: 'easy' | 'medium' | 'hard'
          course_type: 'park' | 'hangang' | 'urban' | 'mountain' | 'track'
          area: string
          images: string[]
          facilities: {
            toilet?: Array<{ lat: number; lng: number; name: string }>
            convenience_store?: Array<{ lat: number; lng: number; name: string }>
            parking?: Array<{ lat: number; lng: number; name: string }>
            water_fountain?: Array<{ lat: number; lng: number; name: string }>
          }
          created_by: string
          is_verified: boolean
          view_count: number
          rating_avg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          gps_route: Array<{ lat: number; lng: number }>
          distance: number
          duration: number
          difficulty: 'easy' | 'medium' | 'hard'
          course_type: 'park' | 'hangang' | 'urban' | 'mountain' | 'track'
          area: string
          images: string[]
          facilities?: {
            toilet?: Array<{ lat: number; lng: number; name: string }>
            convenience_store?: Array<{ lat: number; lng: number; name: string }>
            parking?: Array<{ lat: number; lng: number; name: string }>
            water_fountain?: Array<{ lat: number; lng: number; name: string }>
          }
          created_by: string
          is_verified?: boolean
          view_count?: number
          rating_avg?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          gps_route?: Array<{ lat: number; lng: number }>
          distance?: number
          duration?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          course_type?: 'park' | 'hangang' | 'urban' | 'mountain' | 'track'
          area?: string
          images?: string[]
          facilities?: {
            toilet?: Array<{ lat: number; lng: number; name: string }>
            convenience_store?: Array<{ lat: number; lng: number; name: string }>
            parking?: Array<{ lat: number; lng: number; name: string }>
            water_fountain?: Array<{ lat: number; lng: number; name: string }>
          }
          created_by?: string
          is_verified?: boolean
          view_count?: number
          rating_avg?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          profile_image: string | null
          total_distance: number
          total_runs: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          profile_image?: string | null
          total_distance?: number
          total_runs?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          profile_image?: string | null
          total_distance?: number
          total_runs?: number
          created_at?: string
        }
      }
      running_logs: {
        Row: {
          id: string
          user_id: string
          course_id: string
          distance: number
          duration: number
          avg_speed: number
          calories: number
          gps_path: Array<{ lat: number; lng: number; timestamp: string }>
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          distance: number
          duration: number
          avg_speed: number
          calories: number
          gps_path: Array<{ lat: number; lng: number; timestamp: string }>
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          distance?: number
          duration?: number
          avg_speed?: number
          calories?: number
          gps_path?: Array<{ lat: number; lng: number; timestamp: string }>
          completed_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          course_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Course = Database['public']['Tables']['courses']['Row']
export type CourseInsert = Database['public']['Tables']['courses']['Insert']
export type CourseUpdate = Database['public']['Tables']['courses']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type RunningLog = Database['public']['Tables']['running_logs']['Row']
export type RunningLogInsert = Database['public']['Tables']['running_logs']['Insert']
export type RunningLogUpdate = Database['public']['Tables']['running_logs']['Update']

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
export type BookmarkUpdate = Database['public']['Tables']['bookmarks']['Update']

// Additional types for the app
export interface CourseWithReviews extends Course {
  reviews: Review[]
  user_bookmark?: Bookmark
}

export interface CourseFilters {
  difficulty: string | null
  course_type: string | null
  area: string | null
  distance: [number, number]
  search: string
}

export interface RunningStats {
  distance: number
  duration: number
  speed: number
  pace: number
  calories: number
  progress: number
}

export interface GPSCoordinate {
  lat: number
  lng: number
  timestamp?: string
}

export type TrackingState = 'idle' | 'running' | 'paused' | 'completed'

export interface DeviationWarning {
  id: string
  message: string
  timestamp: string
  distance: number
}
