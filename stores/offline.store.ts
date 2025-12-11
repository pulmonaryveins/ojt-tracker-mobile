import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { Session } from '../types/models'
import { SessionService } from '../services/session.service'

interface PendingSync {
  id: string
  type: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

interface OfflineState {
  isOnline: boolean
  pendingSyncs: PendingSync[]
  isSyncing: boolean
  
  // Actions
  setOnlineStatus: (status: boolean) => void
  addPendingSync: (sync: Omit<PendingSync, 'id' | 'timestamp'>) => void
  syncPending: () => Promise<void>
  clearSynced: (id: string) => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingSyncs: [],
      isSyncing: false,

      setOnlineStatus: (status) => {
        set({ isOnline: status })
        
        // Auto-sync when coming back online
        if (status && get().pendingSyncs.length > 0) {
          get().syncPending()
        }
      },

      addPendingSync: (sync) => {
        const newSync: PendingSync = {
          ...sync,
          id: `sync-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        }
        
        set((state) => ({
          pendingSyncs: [...state.pendingSyncs, newSync],
        }))
      },

      syncPending: async () => {
        const { pendingSyncs, isOnline } = get()
        
        if (!isOnline || pendingSyncs.length === 0 || get().isSyncing) {
          return
        }

        set({ isSyncing: true })

        try {
          for (const sync of pendingSyncs) {
            try {
              // Process sync based on type
              switch (sync.type) {
                case 'create':
                  // Create session in Supabase
                  await SessionService.startSession(sync.data.user_id)
                  break
                  
                case 'update':
                  // Update session
                  if (sync.data.sessionId && sync.data.updates) {
                    // Handle different update types
                  }
                  break
                  
                case 'delete':
                  // Delete session
                  if (sync.data.sessionId) {
                    await SessionService.deleteSession(sync.data.sessionId)
                  }
                  break
              }
              
              // Remove synced item
              get().clearSynced(sync.id)
            } catch (error) {
              console.error('Sync error for item:', sync.id, error)
              // Keep in queue to retry later
            }
          }
        } finally {
          set({ isSyncing: false })
        }
      },

      clearSynced: (id) => {
        set((state) => ({
          pendingSyncs: state.pendingSyncs.filter((s) => s.id !== id),
        }))
      },
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Initialize network listener
export function initializeOfflineSync() {
  const unsubscribe = NetInfo.addEventListener((state) => {
    useOfflineStore.getState().setOnlineStatus(state.isConnected ?? false)
  })

  return unsubscribe
}