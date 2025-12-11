import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

interface PendingSession {
  id: string
  action: 'time_in' | 'time_out' | 'start_break' | 'end_break'
  data: any
  timestamp: number
}

export class OfflineService {
  private static PENDING_KEY = '@pending_sessions'
  private static ACTIVE_SESSION_KEY = '@active_session'

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch()
    return state.isConnected ?? false
  }

  /**
   * Save active session locally
   */
  static async saveActiveSessionLocally(session: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.ACTIVE_SESSION_KEY,
        JSON.stringify(session)
      )
      console.log('✅ Session saved locally')
    } catch (error) {
      console.error('❌ Error saving session locally:', error)
    }
  }

  /**
   * Get active session from local storage
   */
  static async getActiveSessionLocally(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.ACTIVE_SESSION_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('❌ Error getting local session:', error)
      return null
    }
  }

  /**
   * Clear active session from local storage
   */
  static async clearActiveSessionLocally(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ACTIVE_SESSION_KEY)
      console.log('✅ Local session cleared')
    } catch (error) {
      console.error('❌ Error clearing local session:', error)
    }
  }

  /**
   * Save breaks locally
   */
  static async saveBreaksLocally(sessionId: string, breaks: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `@breaks_${sessionId}`,
        JSON.stringify(breaks)
      )
      console.log('✅ Breaks saved locally')
    } catch (error) {
      console.error('❌ Error saving breaks locally:', error)
    }
  }

  /**
   * Get breaks from local storage
   */
  static async getBreaksLocally(sessionId: string): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(`@breaks_${sessionId}`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('❌ Error getting local breaks:', error)
      return []
    }
  }

  /**
   * Queue action for later sync
   */
  static async queueAction(action: PendingSession): Promise<void> {
    try {
      const pending = await this.getPendingActions()
      pending.push(action)
      await AsyncStorage.setItem(this.PENDING_KEY, JSON.stringify(pending))
      console.log('✅ Action queued for sync:', action.action)
    } catch (error) {
      console.error('❌ Error queuing action:', error)
    }
  }

  /**
   * Get pending actions
   */
  static async getPendingActions(): Promise<PendingSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('❌ Error getting pending actions:', error)
      return []
    }
  }

  /**
   * Clear pending actions after sync
   */
  static async clearPendingActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PENDING_KEY)
      console.log('✅ Pending actions cleared')
    } catch (error) {
      console.error('❌ Error clearing pending actions:', error)
    }
  }

  /**
   * Remove specific pending action
   */
  static async removePendingAction(actionId: string): Promise<void> {
    try {
      const pending = await this.getPendingActions()
      const filtered = pending.filter(a => a.id !== actionId)
      await AsyncStorage.setItem(this.PENDING_KEY, JSON.stringify(filtered))
      console.log('✅ Pending action removed:', actionId)
    } catch (error) {
      console.error('❌ Error removing pending action:', error)
    }
  }
}