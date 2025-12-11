import { supabase } from '../lib/supabase'
import { OfflineService } from './offline.service'
import type { Database } from '../types/supabase'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type Break = Database['public']['Tables']['breaks']['Row']

export class SessionService {
  /**
   * Get active session (online or offline)
   */
  static async getActiveSession(userId: string): Promise<Session | null> {
    const isOnline = await OfflineService.isOnline()

    // Try to get from local storage first
    const localSession = await OfflineService.getActiveSessionLocally()
    if (localSession && !localSession.end_time) {
      console.log('📱 Using local session')
      return localSession
    }

    // If online, fetch from server
    if (isOnline) {
      try {
        const response = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .is('end_time', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (response.error && response.error.code !== 'PGRST116') {
          throw response.error
        }

        // Save to local storage
        if (response.data) {
          await OfflineService.saveActiveSessionLocally(response.data)
        }

        return response.data
      } catch (error) {
        console.error('❌ Error fetching from server, using local:', error)
        return localSession
      }
    }

    console.log('⚠️ Offline mode, using local session')
    return localSession
  }

  /**
   * Get breaks for a session (with offline support)
   */
  static async getSessionBreaks(sessionId: string): Promise<Break[]> {
    const isOnline = await OfflineService.isOnline()

    // Try local first
    const localBreaks = await OfflineService.getBreaksLocally(sessionId)

    if (isOnline) {
      try {
        const response = await supabase
          .from('breaks')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (response.error) throw response.error

        const breaks = response.data || []
        
        // Save to local storage
        await OfflineService.saveBreaksLocally(sessionId, breaks)
        
        return breaks
      } catch (error) {
        console.error('❌ Error fetching breaks, using local:', error)
        return localBreaks
      }
    }

    return localBreaks
  }

  /**
   * Create session (with offline support)
   */
  static async createSession(
    userId: string,
    date: string,
    startTime: string,
    description?: string
  ): Promise<Session> {
    const isOnline = await OfflineService.isOnline()

    const tempId = `temp_${Date.now()}`
    const sessionData: any = {
      id: tempId,
      user_id: userId,
      date,
      start_time: startTime,
      duration: 0,
      total_hours: 0,
      description: description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      end_time: null,
    }

    // Save locally first
    await OfflineService.saveActiveSessionLocally(sessionData)

    if (isOnline) {
      try {
        // Try to save to server
        const response = await supabase
          .from('sessions')
          .insert({
            user_id: userId,
            date,
            start_time: startTime,
            duration: 0,
            total_hours: 0,
            description: description || null,
          })
          .select()
          .single()

        if (response.error) throw response.error

        // Update local storage with server ID
        await OfflineService.saveActiveSessionLocally(response.data)
        console.log('✅ Session saved to server')
        return response.data
      } catch (error) {
        console.error('❌ Failed to save to server, queuing for sync:', error)
        // Queue for later sync
        await OfflineService.queueAction({
          id: tempId,
          action: 'time_in',
          data: {
            user_id: userId,
            date,
            start_time: startTime,
            duration: 0,
            total_hours: 0,
            description: description || null,
          },
          timestamp: Date.now(),
        })
      }
    } else {
      console.log('⚠️ Offline mode: Session will sync when online')
      // Queue for later sync
      await OfflineService.queueAction({
        id: tempId,
        action: 'time_in',
        data: {
          user_id: userId,
          date,
          start_time: startTime,
          duration: 0,
          total_hours: 0,
          description: description || null,
        },
        timestamp: Date.now(),
      })
    }

    return sessionData
  }

  /**
   * End session (with offline support)
   */
  static async endSession(
    sessionId: string,
    endTime: string,
    duration: number,
    totalHours: number,
    description?: string
  ): Promise<void> {
    const isOnline = await OfflineService.isOnline()

    // Update local storage
    const localSession = await OfflineService.getActiveSessionLocally()
    if (localSession) {
      localSession.end_time = endTime
      localSession.duration = duration
      localSession.total_hours = totalHours
      localSession.description = description || null
      await OfflineService.saveActiveSessionLocally(localSession)
    }

    if (isOnline) {
      try {
        // Skip if it's a temp ID (not synced yet)
        if (!sessionId.startsWith('temp_')) {
          const response = await supabase
            .from('sessions')
            .update({
              end_time: endTime,
              duration,
              total_hours: totalHours,
              description: description || null,
            })
            .eq('id', sessionId)

          if (response.error) throw response.error

          // Clear local storage after successful sync
          await OfflineService.clearActiveSessionLocally()
          console.log('✅ Session ended on server')
        } else {
          // Queue for sync
          await OfflineService.queueAction({
            id: sessionId,
            action: 'time_out',
            data: {
              end_time: endTime,
              duration,
              total_hours: totalHours,
              description,
            },
            timestamp: Date.now(),
          })
        }
      } catch (error) {
        console.error('❌ Failed to save to server, queuing for sync:', error)
        // Queue for later sync
        await OfflineService.queueAction({
          id: sessionId,
          action: 'time_out',
          data: {
            end_time: endTime,
            duration,
            total_hours: totalHours,
            description,
          },
          timestamp: Date.now(),
        })
      }
    } else {
      console.log('⚠️ Offline mode: Time Out will sync when online')
      // Queue for later sync
      await OfflineService.queueAction({
        id: sessionId,
        action: 'time_out',
        data: {
          end_time: endTime,
          duration,
          total_hours: totalHours,
          description,
        },
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Start break (with offline support)
   */
  static async startBreak(sessionId: string, startTime: string): Promise<Break> {
    const isOnline = await OfflineService.isOnline()

    const tempId = `temp_break_${Date.now()}`
    const breakData: any = {
      id: tempId,
      session_id: sessionId,
      start_time: startTime,
      duration: 0,
      end_time: null,
      created_at: new Date().toISOString(),
    }

    // Get local breaks and add new one
    const localBreaks = await OfflineService.getBreaksLocally(sessionId)
    localBreaks.push(breakData)
    await OfflineService.saveBreaksLocally(sessionId, localBreaks)

    if (isOnline && !sessionId.startsWith('temp_')) {
      try {
        const response = await supabase
          .from('breaks')
          .insert({
            session_id: sessionId,
            start_time: startTime,
            duration: 0,
          })
          .select()
          .single()

        if (response.error) throw response.error

        // Update local with server ID
        const updatedBreaks = localBreaks.map(b =>
          b.id === tempId ? response.data : b
        )
        await OfflineService.saveBreaksLocally(sessionId, updatedBreaks)

        console.log('✅ Break started on server')
        return response.data
      } catch (error) {
        console.error('❌ Failed to start break on server, queuing:', error)
        await OfflineService.queueAction({
          id: tempId,
          action: 'start_break',
          data: { session_id: sessionId, start_time: startTime },
          timestamp: Date.now(),
        })
      }
    } else {
      await OfflineService.queueAction({
        id: tempId,
        action: 'start_break',
        data: { session_id: sessionId, start_time: startTime },
        timestamp: Date.now(),
      })
    }

    return breakData
  }

  /**
   * End break (with offline support)
   */
  static async endBreak(
    breakId: string,
    endTime: string,
    duration: number
  ): Promise<void> {
    const isOnline = await OfflineService.isOnline()

    // Update local breaks
    const localSession = await OfflineService.getActiveSessionLocally()
    if (localSession) {
      const localBreaks = await OfflineService.getBreaksLocally(localSession.id)
      const updatedBreaks = localBreaks.map(b =>
        b.id === breakId ? { ...b, end_time: endTime, duration } : b
      )
      await OfflineService.saveBreaksLocally(localSession.id, updatedBreaks)
    }

    if (isOnline && !breakId.startsWith('temp_')) {
      try {
        const response = await supabase
          .from('breaks')
          .update({
            end_time: endTime,
            duration,
          })
          .eq('id', breakId)

        if (response.error) throw response.error

        console.log('✅ Break ended on server')
      } catch (error) {
        console.error('❌ Failed to end break on server, queuing:', error)
        await OfflineService.queueAction({
          id: breakId,
          action: 'end_break',
          data: { end_time: endTime, duration },
          timestamp: Date.now(),
        })
      }
    } else {
      await OfflineService.queueAction({
        id: breakId,
        action: 'end_break',
        data: { end_time: endTime, duration },
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Get active break for session
   */
  static async getActiveBreak(sessionId: string): Promise<Break | null> {
    const breaks = await this.getSessionBreaks(sessionId)
    return breaks.find(b => b.end_time === null) || null
  }

  /**
   * Sync pending actions
   */
  static async syncPendingActions(): Promise<void> {
    const pending = await OfflineService.getPendingActions()
    if (pending.length === 0) return

    console.log(`🔄 Syncing ${pending.length} pending actions...`)

    for (const action of pending) {
      try {
        switch (action.action) {
          case 'time_in':
            await supabase.from('sessions').insert(action.data)
            break
          case 'time_out':
            // Find the real session ID if it was synced
            const localSession = await OfflineService.getActiveSessionLocally()
            if (localSession && !localSession.id.startsWith('temp_')) {
              await supabase
                .from('sessions')
                .update(action.data)
                .eq('id', localSession.id)
            }
            break
          case 'start_break':
            await supabase.from('breaks').insert(action.data)
            break
          case 'end_break':
            const localBreaks = await OfflineService.getBreaksLocally(action.data.session_id)
            const realBreak = localBreaks.find(b => !b.id.startsWith('temp_'))
            if (realBreak) {
              await supabase
                .from('breaks')
                .update(action.data)
                .eq('id', realBreak.id)
            }
            break
        }
        
        // Remove synced action
        await OfflineService.removePendingAction(action.id)
        console.log('✅ Synced:', action.action)
      } catch (error) {
        console.error('❌ Failed to sync:', action.action, error)
        // Keep action in queue for retry
        break
      }
    }

    console.log('✅ Sync completed')
  }

  /**
   * Get all sessions for user
   */
  static async getSessions(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Session[]> {
    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1)
      }

      const response = await query

      if (response.error) {
        console.error('Error fetching sessions:', response.error)
        throw response.error
      }

      return response.data || []
    } catch (error) {
      console.error('Error in getSessions:', error)
      throw error
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const response = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (response.error) {
        console.error('Error deleting session:', response.error)
        throw response.error
      }
    } catch (error) {
      console.error('Error in deleteSession:', error)
      throw error
    }
  }

  /**
   * Update session description
   */
  static async updateSessionDescription(
    sessionId: string,
    description: string
  ): Promise<void> {
    try {
      const response = await supabase
        .from('sessions')
        .update({ description })
        .eq('id', sessionId)

      if (response.error) {
        console.error('Error updating session description:', response.error)
        throw response.error
      }
    } catch (error) {
      console.error('Error in updateSessionDescription:', error)
      throw error
    }
  }

  /**
   * Create manual session entry
   * For students who forgot to clock in/out
   */
  static async createManualSession(
    userId: string,
    date: string,
    timeIn: string,
    timeOut: string,
    totalHours: number,
    notes: string | null,
    breaks: Array<{ start_time: string; duration: number }>
  ): Promise<string> {
    try {
      console.log('📝 Creating manual session entry...')

      // Create the session with status completed
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          date,
          start_time: timeIn,
          end_time: timeOut,
          duration: Math.floor((new Date(`${date}T${timeOut}`).getTime() - new Date(`${date}T${timeIn}`).getTime()) / 1000),
          total_hours: totalHours,
          description: notes,
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating manual session:', sessionError)
        throw sessionError
      }

      console.log('✅ Manual session created:', session.id)
      console.log('Session data:', session)

      return session.id
    } catch (error) {
      console.error('❌ Error creating manual session:', error)
      throw error
    }
  }

  /**
   * Get total hours for user
   */
  static async getTotalHours(userId: string): Promise<number> {
    try {
      const response = await supabase
        .from('sessions')
        .select('total_hours')
        .eq('user_id', userId)
        .not('end_time', 'is', null)

      if (response.error) {
        console.error('Error fetching total hours:', response.error)
        throw response.error
      }

      const totalHours = response.data?.reduce(
        (sum, session) => sum + (session.total_hours || 0),
        0
      ) || 0

      return totalHours
    } catch (error) {
      console.error('Error in getTotalHours:', error)
      throw error
    }
  }

  /**
   * Get sessions by date range
   */
  static async getSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Session[]> {
    try {
      const response = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (response.error) {
        console.error('Error fetching sessions by date range:', response.error)
        throw response.error
      }

      return response.data || []
    } catch (error) {
      console.error('Error in getSessionsByDateRange:', error)
      throw error
    }
  }

  /**
   * Get today's session
   */
  static async getTodaySession(userId: string): Promise<Session | null> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const response = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (response.error) {
        console.error('Error fetching today session:', response.error)
        throw response.error
      }

      return response.data
    } catch (error) {
      console.error('Error in getTodaySession:', error)
      throw error
    }
  }

  // ===================================
  // FORCE DELETE / RESET METHODS
  // ===================================

  /**
   * Force delete a session (for stuck sessions)
   * Deletes breaks first, then the session
   */
  static async forceDeleteSession(sessionId: string): Promise<void> {
    try {
      console.log('🗑️ Force deleting session:', sessionId)
      
      // Check if session exists first
      const { data: sessionCheck, error: checkError } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle()
      
      if (checkError) {
        console.error('Error checking session:', checkError)
        throw new Error(`Failed to verify session: ${checkError.message}`)
      }
      
      if (!sessionCheck) {
        console.log('⚠️ Session not found in database, may already be deleted')
        return
      }
      
      console.log('✅ Session found, proceeding with deletion...')
      
      // Delete associated breaks first
      console.log('🗑️ Deleting breaks for session...')
      const { error: breaksError } = await supabase
        .from('breaks')
        .delete()
        .eq('session_id', sessionId)
      
      if (breaksError) {
        console.error('⚠️ Error deleting breaks (continuing anyway):', breaksError)
        // Don't throw, continue with session deletion
      } else {
        console.log('✅ Breaks deleted successfully')
      }
      
      // Delete the session
      console.log('🗑️ Deleting session from database...')
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
      
      if (error) {
        console.error('❌ Error deleting session:', error)
        throw new Error(`Failed to delete session: ${error.message}`)
      }
      
      console.log('✅ Session force deleted successfully from database')
    } catch (error: any) {
      console.error('❌ Error force deleting session:', error)
      throw error
    }
  }

  /**
   * Clean up all stale sessions (sessions with no end_time)
   * Useful for cleaning up stuck sessions from database
   */
  static async cleanupStaleSessions(userId: string): Promise<number> {
    try {
      console.log('🧹 Cleaning up stale sessions...')
      
      // Get all sessions with no end_time
      const { data, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .is('end_time', null)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        console.log(`Found ${data.length} stale session(s)`)
        
        for (const session of data) {
          await this.forceDeleteSession(session.id)
        }
        
        console.log(`✅ Cleaned up ${data.length} stale sessions`)
        return data.length
      }
      
      console.log('No stale sessions found')
      return 0
    } catch (error) {
      console.error('❌ Error cleaning up stale sessions:', error)
      throw error
    }
  }

  /**
   * Force reset current session (delete from database and clear local storage)
   */
  static async forceResetCurrentSession(sessionId: string): Promise<void> {
    try {
      console.log('🔄 Force resetting current session:', sessionId)
      
      // Delete from database if it has a real ID (not temp)
      if (!sessionId.startsWith('temp_')) {
        console.log('📡 Deleting from database...')
        await this.forceDeleteSession(sessionId)
        console.log('✅ Database deletion complete')
      } else {
        console.log('⚠️ Temp session ID detected, skipping database deletion')
      }
      
      // Clear local storage
      console.log('🧹 Clearing local storage...')
      await OfflineService.clearActiveSessionLocally()
      console.log('✅ Local storage cleared')
      
      // Clear pending actions related to this session
      console.log('🧹 Clearing pending actions...')
      const pending = await OfflineService.getPendingActions()
      let clearedCount = 0
      for (const action of pending) {
        if (action.id === sessionId || action.data?.session_id === sessionId) {
          await OfflineService.removePendingAction(action.id)
          clearedCount++
        }
      }
      console.log(`✅ Cleared ${clearedCount} pending action(s)`)
      
      console.log('✅ Session force reset complete')
    } catch (error: any) {
      console.error('❌ Error force resetting session:', error)
      console.error('Error stack:', error.stack)
      throw error
    }
  }

  // ===================================
  // VALIDATION METHODS
  // ===================================

  /**
   * Validate time out
   */
  static validateTimeOut(
    session: Session,
    breaks: Break[]
  ): { valid: boolean; error?: string } {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    console.log('🔍 Validating Time Out...')
    console.log('Session date:', session.date)
    console.log('Today:', today)
    console.log('Breaks:', breaks.length, 'breaks with total duration:', breaks.reduce((sum, b) => sum + b.duration, 0), 'seconds')
    
    // Check if session is from today (or allow sessions from today's date in any timezone)
    const sessionDate = session.date.split('T')[0] // Handle both date strings
    if (sessionDate !== today) {
      console.log('❌ Session is not from today')
      return {
        valid: false,
        error: 'Cannot time out a session from a different day. Please start a new session for today.',
      }
    }

    // Check for active break
    const activeBreak = breaks.find(b => b.end_time === null)
    if (activeBreak) {
      console.log('❌ Active break found')
      return {
        valid: false,
        error: 'Please end your current break before timing out.',
      }
    }

    // Calculate session duration (excluding breaks)
    const startTime = new Date(`${sessionDate}T${session.start_time}`)
    const totalBreakSeconds = breaks.reduce((sum, b) => sum + b.duration, 0)
    const sessionDurationMs = now.getTime() - startTime.getTime()
    const workDurationSeconds = Math.floor(sessionDurationMs / 1000) - totalBreakSeconds

    console.log('⏱️ Session started:', startTime.toISOString())
    console.log('⏱️ Current time:', now.toISOString())
    console.log('⏱️ Total session duration:', Math.floor(sessionDurationMs / 1000), 'seconds')
    console.log('☕ Total break duration:', totalBreakSeconds, 'seconds')
    console.log('💼 Work duration (excluding breaks):', workDurationSeconds, 'seconds', `(${(workDurationSeconds / 60).toFixed(1)} minutes)`)

    // Minimum session duration: 15 minutes (900 seconds)
    const MINIMUM_DURATION_SECONDS = 900
    if (workDurationSeconds < MINIMUM_DURATION_SECONDS) {
      const remainingSeconds = MINIMUM_DURATION_SECONDS - workDurationSeconds
      const remainingMinutes = Math.ceil(remainingSeconds / 60)
      console.log(`❌ Session too short: ${workDurationSeconds}s < ${MINIMUM_DURATION_SECONDS}s (need ${remainingSeconds}s more)`)
      return {
        valid: false,
        error: `Session too short. Please work for at least ${remainingMinutes} more minute(s) before timing out.`,
      }
    }

    // Check if time out is after time in
    if (now <= startTime) {
      console.log('❌ Time Out is before or equal to Time In')
      return {
        valid: false,
        error: 'Time Out must be after Time In.',
      }
    }

    console.log('✅ Validation passed!')
    return { valid: true }
  }

  /**
   * Validate break duration
   */
  static validateBreakDuration(
    breakStartTime: string,
    sessionDate: string
  ): { valid: boolean; error?: string } {
    const now = new Date()
    const breakStart = new Date(`${sessionDate}T${breakStartTime}`)
    const breakDurationMs = now.getTime() - breakStart.getTime()
    const breakDurationMinutes = Math.floor(breakDurationMs / (1000 * 60))

    // Minimum break duration: 1 minute
    if (breakDurationMinutes < 1) {
      return {
        valid: false,
        error: 'Break must be at least 1 minute long.',
      }
    }

    // Maximum break duration: 2 hours (120 minutes)
    const MAX_BREAK_MINUTES = 120
    if (breakDurationMinutes > MAX_BREAK_MINUTES) {
      return {
        valid: false,
        error: `Break too long (${breakDurationMinutes} minutes). Maximum allowed is ${MAX_BREAK_MINUTES} minutes.`,
      }
    }

    return { valid: true }
  }

  /**
   * Validate start break
   */
  static validateStartBreak(
    session: Session
  ): { valid: boolean; error?: string } {
    const now = new Date()
    const startTime = new Date(`${session.date}T${session.start_time}`)
    const workDurationMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))

    // Must work at least 30 minutes before taking first break
    const MINIMUM_WORK_BEFORE_BREAK = 30
    if (workDurationMinutes < MINIMUM_WORK_BEFORE_BREAK) {
      const remainingMinutes = MINIMUM_WORK_BEFORE_BREAK - workDurationMinutes
      return {
        valid: false,
        error: `Please work for at least ${remainingMinutes} more minute(s) before taking a break.`,
      }
    }

    return { valid: true }
  }

  /**
   * Check if session is from today
   */
  static isSessionFromToday(session: Session): boolean {
    const today = new Date().toISOString().split('T')[0]
    return session.date === today
  }

  /**
   * Get session work duration in minutes (excluding breaks)
   */
  static getSessionWorkDuration(session: Session, breaks: Break[]): number {
    const now = new Date()
    const startTime = new Date(`${session.date}T${session.start_time}`)
    const totalBreakSeconds = breaks.reduce((sum, b) => sum + b.duration, 0)
    const sessionDurationMs = now.getTime() - startTime.getTime()
    const workDurationSeconds = Math.floor(sessionDurationMs / 1000) - totalBreakSeconds
    return Math.floor(workDurationSeconds / 60)
  }
}