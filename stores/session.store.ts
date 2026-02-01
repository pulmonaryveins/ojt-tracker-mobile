import { create } from 'zustand'
import { Session } from '../types/models'
import { SessionService } from '../services/session.service'

interface SessionState {
  activeSession: Session | null
  isLoading: boolean
  error: string | null
  
  // Actions
  startSession: (userId: string) => Promise<void>
  endSession: (sessionId: string, dailyLog?: { journal: string; notes?: string }) => Promise<void>
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
      const session = get().activeSession
      if (!session) throw new Error('No active session')

      // Calculate end time and duration
      const now = new Date()
      const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      // Calculate duration in seconds (this should match tracker logic)
      const startDateTime = new Date(`${session.date}T${session.start_time}`)
      const endDateTime = new Date(`${session.date}T${endTime}`)
      const totalDurationSeconds = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000)
      
      // Calculate break time if any
      const breaks = session.breaks || []
      let totalBreakSeconds = 0
      for (const breakItem of breaks) {
        if (breakItem.end_time) {
          const breakStart = new Date(`${session.date}T${breakItem.start_time}`)
          const breakEnd = new Date(`${session.date}T${breakItem.end_time}`)
          totalBreakSeconds += Math.floor((breakEnd.getTime() - breakStart.getTime()) / 1000)
        }
      }
      
      const workDurationSeconds = Math.max(0, totalDurationSeconds - totalBreakSeconds)
      const totalHours = workDurationSeconds / 3600
      
      // End the session with calculated values
      await SessionService.endSession(
        sessionId,
        endTime,
        workDurationSeconds,
        totalHours,
        dailyLog?.notes
      )
      
      // Update session with journal data if provided
      if (dailyLog?.journal) {
        const { supabase } = await import('../lib/supabase')
        await supabase
          .from('sessions')
          .update({ journal: dailyLog.journal })
          .eq('id', sessionId)
      }
      
      // Clear interval
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