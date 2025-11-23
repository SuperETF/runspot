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
          total_time: number
          avg_pace: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          profile_image?: string | null
          total_distance?: number
          total_runs?: number
          total_time?: number
          avg_pace?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          profile_image?: string | null
          total_distance?: number
          total_runs?: number
          total_time?: number
          avg_pace?: number
          created_at?: string
        }
      }
      running_logs: {
        Row: {
          id: string
          user_id: string
          course_id: string | null
          distance: number
          duration: number
          avg_speed: number
          calories: number
          gps_path: any | null
          completed_at: string
          created_at: string | null
          authentication_count: number | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string | null
          distance: number
          duration: number
          avg_speed: number
          calories: number
          gps_path?: any | null
          completed_at?: string
          authentication_count?: number | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          distance?: number
          duration?: number
          avg_speed?: number
          calories?: number
          gps_path?: any | null
          completed_at?: string
          authentication_count?: number | null
          expires_at?: string | null
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
      spots: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          signature_menu: string
          address: string
          latitude: number
          longitude: number
          phone: string | null
          open_time: string | null
          discount_percentage: number | null
          special_offer: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          logo_url: string | null
          images: string[] | null
          thumbnail_image: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          description: string
          signature_menu: string
          address: string
          latitude: number
          longitude: number
          phone?: string | null
          open_time?: string | null
          discount_percentage?: number | null
          special_offer?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          logo_url?: string | null
          images?: string[] | null
          thumbnail_image?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string
          signature_menu?: string
          address?: string
          latitude?: number
          longitude?: number
          phone?: string | null
          open_time?: string | null
          discount_percentage?: number | null
          special_offer?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          logo_url?: string | null
          images?: string[] | null
          thumbnail_image?: string | null
        }
      }
      spot_coupons: {
        Row: {
          id: string
          user_id: string
          spot_id: string
          coupon_code: string
          discount_info: string
          issued_at: string | null
          expires_at: string
          running_completed_at: string
          auth_location_lat: number
          auth_location_lng: number
          is_active: boolean | null
          created_at: string | null
          running_log_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          spot_id: string
          coupon_code: string
          discount_info: string
          issued_at?: string | null
          expires_at: string
          running_completed_at: string
          auth_location_lat: number
          auth_location_lng: number
          is_active?: boolean | null
          created_at?: string | null
          running_log_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          spot_id?: string
          coupon_code?: string
          discount_info?: string
          issued_at?: string | null
          expires_at?: string
          running_completed_at?: string
          auth_location_lat?: number
          auth_location_lng?: number
          is_active?: boolean | null
          created_at?: string | null
          running_log_id?: string | null
        }
      }
      spot_coupon_history: {
        Row: {
          id: string
          user_id: string
          spot_id: string
          coupon_id: string | null
          coupon_code: string
          discount_info: string
          issued_at: string
          expired_at: string
          used_at: string | null
          running_completed_at: string
          auth_location_lat: number
          auth_location_lng: number
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          spot_id: string
          coupon_id?: string | null
          coupon_code: string
          discount_info: string
          issued_at: string
          expired_at: string
          used_at?: string | null
          running_completed_at: string
          auth_location_lat: number
          auth_location_lng: number
          status: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          spot_id?: string
          coupon_id?: string | null
          coupon_code?: string
          discount_info?: string
          issued_at?: string
          expired_at?: string
          used_at?: string | null
          running_completed_at?: string
          auth_location_lat?: number
          auth_location_lng?: number
          status?: string
          created_at?: string | null
        }
      }
      inquiries: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          subject: string
          message: string
          status: 'pending' | 'in_progress' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          subject: string
          message: string
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          subject?: string
          message?: string
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
      }
      user_location_settings: {
        Row: {
          id: string
          user_id: string
          sharing_status: 'disabled' | 'friends_only' | 'running_only'
          share_during_running: boolean
          share_with_friends: boolean
          location_update_interval: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sharing_status?: 'disabled' | 'friends_only' | 'running_only'
          share_during_running?: boolean
          share_with_friends?: boolean
          location_update_interval?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sharing_status?: 'disabled' | 'friends_only' | 'running_only'
          share_during_running?: boolean
          share_with_friends?: boolean
          location_update_interval?: number
          created_at?: string
          updated_at?: string
        }
      }
      shared_locations: {
        Row: {
          id: string
          user_id: string
          latitude: number
          longitude: number
          accuracy: number | null
          speed: number | null
          heading: number | null
          is_running: boolean
          course_id: string | null
          shared_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          latitude: number
          longitude: number
          accuracy?: number | null
          speed?: number | null
          heading?: number | null
          is_running?: boolean
          course_id?: string | null
          shared_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          speed?: number | null
          heading?: number | null
          is_running?: boolean
          course_id?: string | null
          shared_at?: string
          expires_at?: string
        }
      }
      friend_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          activity_data: any
          course_id: string | null
          running_log_id: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          activity_data: any
          course_id?: string | null
          running_log_id?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          activity_data?: any
          course_id?: string | null
          running_log_id?: string | null
          is_public?: boolean
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

export type Spot = Database['public']['Tables']['spots']['Row']
export type SpotInsert = Database['public']['Tables']['spots']['Insert']
export type SpotUpdate = Database['public']['Tables']['spots']['Update']

export type SpotCoupon = Database['public']['Tables']['spot_coupons']['Row']
export type SpotCouponInsert = Database['public']['Tables']['spot_coupons']['Insert']
export type SpotCouponUpdate = Database['public']['Tables']['spot_coupons']['Update']

export type SpotCouponHistory = Database['public']['Tables']['spot_coupon_history']['Row']
export type SpotCouponHistoryInsert = Database['public']['Tables']['spot_coupon_history']['Insert']
export type SpotCouponHistoryUpdate = Database['public']['Tables']['spot_coupon_history']['Update']

export type Inquiry = Database['public']['Tables']['inquiries']['Row']
export type InquiryInsert = Database['public']['Tables']['inquiries']['Insert']
export type InquiryUpdate = Database['public']['Tables']['inquiries']['Update']

export type Friendship = Database['public']['Tables']['friendships']['Row']
export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert']
export type FriendshipUpdate = Database['public']['Tables']['friendships']['Update']

export type UserLocationSettings = Database['public']['Tables']['user_location_settings']['Row']
export type UserLocationSettingsInsert = Database['public']['Tables']['user_location_settings']['Insert']
export type UserLocationSettingsUpdate = Database['public']['Tables']['user_location_settings']['Update']

export type SharedLocation = Database['public']['Tables']['shared_locations']['Row']
export type SharedLocationInsert = Database['public']['Tables']['shared_locations']['Insert']
export type SharedLocationUpdate = Database['public']['Tables']['shared_locations']['Update']

export type FriendActivity = Database['public']['Tables']['friend_activities']['Row']
export type FriendActivityInsert = Database['public']['Tables']['friend_activities']['Insert']
export type FriendActivityUpdate = Database['public']['Tables']['friend_activities']['Update']

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

// 친구 시스템 관련 추가 타입들
export interface FriendWithDetails extends User {
  friendship_id: string
  friendship_status: 'pending' | 'accepted' | 'blocked'
  friendship_created_at: string
  is_requester: boolean
  is_location_shared?: boolean
  last_shared_location?: SharedLocation
}

export interface FriendRequest {
  id: string
  requester: User
  addressee: User
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export interface LocationSharingSettings {
  sharing_status: 'disabled' | 'friends_only' | 'running_only'
  share_during_running: boolean
  share_with_friends: boolean
  location_update_interval: number
}

export interface FriendLocationData {
  friend: User
  location: SharedLocation
  distance_from_user?: number // 사용자로부터의 거리 (km)
  is_running: boolean
  course?: Course | null
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'
export type LocationSharingStatus = 'disabled' | 'friends_only' | 'running_only'
export type FriendActivityType = 'run_completed' | 'course_reviewed' | 'achievement_unlocked' | 'course_bookmarked'
