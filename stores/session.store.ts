import { create } from 'zustand'
import { Session } from '../types/models'
import { SessionService } from '../services/session.service'

interface SessionState {
  activeSession: Session | null
  isLoading: boolean
  error: string | null
  
  // Actions
  startSession: (userId: string) => Promise<void>
  endSession: (sessionId: string, dailyLog?: { tasks: string; lessonsLearned?: string; notes?: string }) => Promise<void>
  startBreak: (sessionId: string) => Promise<void>
  endBreak: (sessionId: string) => Promise<void>
  loadActiveSession: (userId: string) => Promise<void>
  clearActiveSession: () => void
  updateCurrentHours: () => void
  currentHours: number
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isLoading: false,
  error: null,
  currentHours: 0,

  startSession: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const session = await SessionService.startSession(userId)
      set({ activeSession: session, isLoading: false })
      
      // Start updating current hours every minute
      const interval = setInterval(() => {
        get().updateCurrentHours()
      }, 60000)
      
      // Store interval ID for cleanup
      ;(session as any)._intervalId = interval
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  endSession: async (sessionId: string, dailyLog) => {
    set({ isLoading: true, error: null })
    try {
      await SessionService.endSession(sessionId, dailyLog)
      
      // Clear interval
      const session = get().activeSession
      if (session && (session as any)._intervalId) {
        clearInterval((session as any)._intervalId)
      }
      
      set({ activeSession: null, currentHours: 0, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  startBreak: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const session = await SessionService.startBreak(sessionId)
      set({ activeSession: session, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  endBreak: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const session = await SessionService.endBreak(sessionId)
      set({ activeSession: session, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  loadActiveSession: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const session = await SessionService.getActiveSession(userId)
      set({ activeSession: session, isLoading: false })
      
      if (session) {
        // Start updating current hours
        const interval = setInterval(() => {
          get().updateCurrentHours()
        }, 60000)
        ;(session as any)._intervalId = interval
        
        // Initial update
        get().updateCurrentHours()
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  clearActiveSession: () => {
    const session = get().activeSession
    if (session && (session as any)._intervalId) {
      clearInterval((session as any)._intervalId)
    }
    set({ activeSession: null, currentHours: 0 })
  },

  updateCurrentHours: () => {
    const session = get().activeSession
    if (session && session.status !== 'completed') {
      const hours = SessionService.calculateCurrentHours(session)
      set({ currentHours: hours })
    }
  },
}))