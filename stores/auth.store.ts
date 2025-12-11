import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<string> // ✅ ADD THIS
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  setUser: (user) => {
    console.log('📝 Store: Setting user:', user?.email || 'null')
    set({ user })
  },

  setSession: (session) => {
    console.log('📝 Store: Setting session:', session ? 'exists' : 'null')
    set({ session })
  },

  signIn: async (email: string, password: string) => {
    console.log('🔐 Auth Store: signIn() called')
    console.log('   Email:', email)
    
    try {
      set({ loading: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        throw error
      }

      if (!data.user || !data.session) {
        throw new Error('No user data returned')
      }

      console.log('✅ Sign in successful:', data.user.email)
      
      set({
        user: data.user,
        session: data.session,
        loading: false,
      })
    } catch (error) {
      console.error('❌ Auth store signIn error:', error)
      set({ loading: false })
      throw error
    }
  },

  // ✅ ADD THIS FUNCTION
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    console.log('📝 Auth Store: signUp() called')
    console.log('   Email:', email)
    console.log('   Metadata:', metadata)
    
    try {
      set({ loading: true })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined, // Prevent auto-login
        },
      })

      if (error) {
        console.error('❌ Sign up error:', error)
        throw error
      }

      if (!data.user) {
        throw new Error('No user data returned')
      }

      console.log('✅ Sign up successful:', data.user.id)
      
      set({ loading: false })
      
      return data.user.id
    } catch (error) {
      console.error('❌ Auth store signUp error:', error)
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    console.log('🔄 Sign out started...')
    
    try {
      set({ loading: true })

      console.log('🧹 Clearing local state...')
      set({ user: null, session: null })

      console.log('🧹 Clearing AsyncStorage...')
      await AsyncStorage.removeItem('supabase.auth.token')

      console.log('🔐 Signing out from Supabase...')
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Supabase signOut error:', error)
        throw error
      }

      console.log('✅ Signed out successfully')
      
      set({ loading: false })
    } catch (error) {
      console.error('❌ Error signing out:', error)
      set({ loading: false })
      throw error
    }
  },

  initialize: async () => {
    console.log('🔄 Initializing auth...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ Error getting session:', error)
        throw error
      }

      if (session) {
        console.log('✅ Session found:', session.user.email)
        set({
          user: session.user,
          session: session,
          initialized: true,
        })
      } else {
        console.log('ℹ️ No session found')
        set({
          user: null,
          session: null,
          initialized: true,
        })
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('🔔 Auth state changed:', _event)
        
        if (_event === 'SIGNED_OUT') {
          console.log('✅ Processing SIGNED_OUT event')
          set({
            user: null,
            session: null,
          })
          await AsyncStorage.removeItem('supabase.auth.token')
        } else if (_event === 'SIGNED_IN' && session) {
          console.log('✅ Processing SIGNED_IN event:', session.user.email)
          set({
            user: session.user,
            session: session,
          })
        } else if (_event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed')
          set({
            user: session.user,
            session: session,
          })
        }
      })
    } catch (error) {
      console.error('❌ Initialize error:', error)
      set({ initialized: true })
    }
  },
}))