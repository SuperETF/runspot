import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { User as AppUser } from '@/types/database'

interface AuthState {
  // Auth user (from Supabase Auth)
  user: User | null
  setUser: (user: User | null) => void
  
  // App user profile (from our users table)
  profile: AppUser | null
  setProfile: (profile: AppUser | null) => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Auth modal state
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  authMode: 'login' | 'signup'
  setAuthMode: (mode: 'login' | 'signup') => void
  
  // Actions
  signOut: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  profile: null,
  isLoading: true,
  showAuthModal: false,
  authMode: 'login',
  
  // Actions
  setUser: (user) => set({ user }),
  
  setProfile: (profile) => set({ profile }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  
  setAuthMode: (mode) => set({ authMode: mode }),
  
  signOut: () => {
    set({ 
      user: null, 
      profile: null,
      showAuthModal: false 
    })
  },
  
  isAuthenticated: () => {
    const { user } = get()
    return !!user
  }
}))
