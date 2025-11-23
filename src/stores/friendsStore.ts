import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  getFriends, 
  getFriendsLocations, 
  shareLocation, 
  getLocationSettings,
  updateLocationSettings 
} from '@/lib/friends'
import type { 
  FriendWithDetails, 
  FriendLocationData, 
  UserLocationSettings,
  LocationSharingStatus 
} from '@/types/database'

interface FriendsState {
  // 친구 목록
  friends: FriendWithDetails[]
  friendsLoading: boolean
  
  // 친구 위치 데이터
  friendsLocations: FriendLocationData[]
  locationsLoading: boolean
  lastLocationUpdate: Date | null
  
  // 위치 공유 설정
  locationSettings: UserLocationSettings | null
  settingsLoading: boolean
  
  // 실시간 위치 공유 상태
  isLocationSharing: boolean
  locationSharingInterval: NodeJS.Timeout | null
  
  // Actions
  loadFriends: () => Promise<void>
  loadFriendsLocations: (userLocation?: { lat: number; lng: number }) => Promise<void>
  loadLocationSettings: () => Promise<void>
  updateLocationSharingSettings: (settings: Partial<UserLocationSettings>) => Promise<void>
  
  // 위치 공유 제어
  startLocationSharing: (options?: { isRunning?: boolean; courseId?: string }) => Promise<void>
  stopLocationSharing: () => void
  shareCurrentLocation: (
    latitude: number, 
    longitude: number, 
    options?: {
      accuracy?: number
      speed?: number
      heading?: number
      isRunning?: boolean
      courseId?: string
    }
  ) => Promise<void>
  
  // 상태 초기화
  reset: () => void
}

const defaultLocationSettings: UserLocationSettings = {
  id: '',
  user_id: '',
  sharing_status: 'disabled',
  share_during_running: false,
  share_with_friends: false,
  location_update_interval: 30,
  created_at: '',
  updated_at: ''
}

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set, get) => ({
      // Initial state
      friends: [],
      friendsLoading: false,
      friendsLocations: [],
      locationsLoading: false,
      lastLocationUpdate: null,
      locationSettings: null,
      settingsLoading: false,
      isLocationSharing: false,
      locationSharingInterval: null,

      // Load friends list
      loadFriends: async () => {
        set({ friendsLoading: true })
        try {
          const result = await getFriends()
          if (result.success && result.data) {
            set({ friends: result.data })
          }
        } catch (error) {
          console.error('친구 목록 로드 실패:', error)
        } finally {
          set({ friendsLoading: false })
        }
      },

      // Load friends locations
      loadFriendsLocations: async (userLocation) => {
        set({ locationsLoading: true })
        try {
          const result = await getFriendsLocations(userLocation)
          if (result.success && result.data) {
            set({ 
              friendsLocations: result.data,
              lastLocationUpdate: new Date()
            })
          }
        } catch (error) {
          console.error('친구 위치 로드 실패:', error)
        } finally {
          set({ locationsLoading: false })
        }
      },

      // Load location settings
      loadLocationSettings: async () => {
        set({ settingsLoading: true })
        try {
          const result = await getLocationSettings()
          if (result.success && result.data) {
            set({ locationSettings: result.data })
          }
        } catch (error) {
          console.error('위치 설정 로드 실패:', error)
        } finally {
          set({ settingsLoading: false })
        }
      },

      // Update location sharing settings
      updateLocationSharingSettings: async (settings) => {
        try {
          const result = await updateLocationSettings(settings)
          if (result.success && result.data) {
            set({ locationSettings: result.data })
            
            // 위치 공유가 비활성화되면 공유 중단
            if (result.data.sharing_status === 'disabled') {
              get().stopLocationSharing()
            }
          }
        } catch (error) {
          console.error('위치 설정 업데이트 실패:', error)
        }
      },

      // Start location sharing
      startLocationSharing: async (options = {}) => {
        const state = get()
        
        // 이미 공유 중이면 중단
        if (state.isLocationSharing) {
          state.stopLocationSharing()
        }

        // 위치 설정 확인
        if (!state.locationSettings) {
          await state.loadLocationSettings()
        }

        const settings = state.locationSettings
        if (!settings || settings.sharing_status === 'disabled') {
          console.log('위치 공유가 비활성화되어 있습니다.')
          return
        }

        // 런닝 중이 아닌데 running_only 설정인 경우
        if (settings.sharing_status === 'running_only' && !options.isRunning) {
          console.log('런닝 중에만 위치를 공유할 수 있습니다.')
          return
        }

        set({ isLocationSharing: true })

        // 주기적으로 위치 공유
        const interval = setInterval(async () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                await state.shareCurrentLocation(
                  position.coords.latitude,
                  position.coords.longitude,
                  {
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed || undefined,
                    heading: position.coords.heading || undefined,
                    isRunning: options.isRunning,
                    courseId: options.courseId
                  }
                )
              },
              (error) => {
                console.error('위치 정보 가져오기 실패:', error)
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
              }
            )
          }
        }, (settings.location_update_interval || 30) * 1000)

        set({ locationSharingInterval: interval })
      },

      // Stop location sharing
      stopLocationSharing: () => {
        const state = get()
        
        if (state.locationSharingInterval) {
          clearInterval(state.locationSharingInterval)
        }
        
        set({ 
          isLocationSharing: false,
          locationSharingInterval: null 
        })
      },

      // Share current location
      shareCurrentLocation: async (latitude, longitude, options = {}) => {
        try {
          const result = await shareLocation(latitude, longitude, options)
          if (!result.success) {
            console.error('위치 공유 실패:', result.error)
          }
        } catch (error) {
          console.error('위치 공유 중 오류:', error)
        }
      },

      // Reset state
      reset: () => {
        const state = get()
        state.stopLocationSharing()
        
        set({
          friends: [],
          friendsLoading: false,
          friendsLocations: [],
          locationsLoading: false,
          lastLocationUpdate: null,
          locationSettings: null,
          settingsLoading: false,
          isLocationSharing: false,
          locationSharingInterval: null
        })
      }
    }),
    {
      name: 'friends-store',
      partialize: (state) => ({
        // 지속적으로 저장할 데이터만 선택
        friends: state.friends,
        locationSettings: state.locationSettings,
        lastLocationUpdate: state.lastLocationUpdate
      }),
      skipHydration: false
    }
  )
)
