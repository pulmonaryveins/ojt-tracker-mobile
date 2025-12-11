/**
 * ============================================================
 * TIME TRACKER - MANUAL ENTRY ONLY MODE
 * ============================================================
 * 
 * STATUS: Clock In/Clock Out features temporarily disabled
 * 
 * The Clock In and Clock Out features have been commented out 
 * to allow the system to rely solely on Manual Time Entry for 
 * recording Time In and Time Out. This is a temporary measure 
 * while Clock In issues are being resolved.
 * 
 * DISABLED FEATURES:
 * - Clock In button and functionality
 * - Clock Out button and functionality  
 * - Start Break / End Break functionality
 * - Active session tracking and display
 * - Real-time elapsed time counter
 * - Session details card
 * - Force delete / cleanup stuck sessions
 * 
 * ACTIVE FEATURES:
 * - Manual Time Entry (primary method)
 * - Activity Logs viewing
 * - Offline mode support
 * - Data synchronization
 * 
 * TO RE-ENABLE CLOCK IN/OUT:
 * 1. Uncomment state variables (activeSession, activeBreak, breaks, etc.)
 * 2. Uncomment all handler functions (handleTimeIn, handleTimeOut, etc.)
 * 3. Uncomment helper functions (getElapsedTime, getTotalBreakTime, etc.)
 * 4. Uncomment loadActiveSession() and useFocusEffect hook
 * 5. Restore UI sections for session status, details, and action buttons
 * 6. Test thoroughly before deploying
 * 
 * All commented code is preserved below for future re-enablement.
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, Alert, TextInput } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import NetInfo from '@react-native-community/netinfo'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useAuthStore } from '../../../stores/auth.store'
import { SessionService } from '../../../services/session.service'
import { OfflineService } from '../../../services/offline.service'
import { useTheme } from '../../../hooks/useTheme'
import type { Database } from '../../../types/supabase'

// DISABLED - Types not needed for Manual Entry only mode
// type Session = Database['public']['Tables']['sessions']['Row']
// type Break = Database['public']['Tables']['breaks']['Row']

export default function TrackerScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  // DISABLED - State variables for Clock In/Out features
  // const [activeSession, setActiveSession] = useState<Session | null>(null)
  // const [activeBreak, setActiveBreak] = useState<Break | null>(null)
  // const [breaks, setBreaks] = useState<Break[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  // const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  // const [actionLoading, setActionLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [hasPendingSync, setHasPendingSync] = useState(false)
  
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  })

  // DISABLED - Modal for Time Out confirmation
  // const [timeOutConfirmVisible, setTimeOutConfirmVisible] = useState(false)

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false
      setIsOnline(online)
      
      if (online && hasPendingSync) {
        console.log('🌐 Back online, syncing...')
        syncPendingData()
      } else if (!online) {
        console.log('📡 Offline mode')
      }
    })

    return () => unsubscribe()
  }, [hasPendingSync])

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Check for pending sync on mount
  useEffect(() => {
    checkPendingSync()
  }, [])

  // DISABLED - Load active session on mount and when screen focuses
  // (Not needed for Manual Entry only mode)
  /*
  useFocusEffect(
    useCallback(() => {
      loadActiveSession()
    }, [user?.id])
  )
  */

  const checkPendingSync = async () => {
    const pending = await OfflineService.getPendingActions()
    setHasPendingSync(pending.length > 0)
  }

  const syncPendingData = async () => {
    try {
      await SessionService.syncPendingActions()
      setHasPendingSync(false)
      // DISABLED - No need to reload active session for Manual Entry only mode
      // await loadActiveSession()
      showModal('Sync Complete', 'All data has been synced successfully', 'success')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    }
  }

  /* DISABLED - Load Active Session Function
  const loadActiveSession = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get active session
      const sessionData = await SessionService.getActiveSession(user.id)

      if (sessionData) {
        setActiveSession(sessionData)
        setDescription(sessionData.description || '')
        
        // Load breaks for this session
        const breaksData = await SessionService.getSessionBreaks(sessionData.id)
        setBreaks(breaksData)
        
        // Check for active break
        const activeBreakData = await SessionService.getActiveBreak(sessionData.id)
        setActiveBreak(activeBreakData)
        
        console.log('✅ Active session loaded:', sessionData)
        console.log('✅ Breaks loaded:', breaksData)
      } else {
        setActiveSession(null)
        setActiveBreak(null)
        setBreaks([])
        setDescription('')
        console.log('ℹ️ No active session')
      }
    } catch (error) {
      console.error('❌ Error loading active session:', error)
      showModal('Error', 'Failed to load session data', 'error')
    } finally {
      setLoading(false)
      checkPendingSync()
    }
  }
  */

  const showModal = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setModal({ visible: true, title, message, type })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, visible: false }))
  }

  const format12Hour = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // ============================================================
  // CLOCK IN/OUT FEATURES - TEMPORARILY DISABLED
  // TODO: Re-enable these features once Clock In issues are resolved
  // ============================================================
  
  /* DISABLED - Clock In Feature
  const handleTimeIn = async () => {
    if (!user?.id) {
      showModal('Error', 'User not found. Please log in again.', 'error')
      return
    }

    try {
      setActionLoading(true)
      const now = new Date()
      const timeString = now.toTimeString().split(' ')[0]
      const dateString = now.toISOString().split('T')[0]

      console.log('⏰ Time In:', dateString, timeString)

      const session = await SessionService.createSession(
        user.id,
        dateString,
        timeString,
        description.trim()
      )

      setActiveSession(session)
      console.log('✅ Session started:', session)
      
      const message = isOnline 
        ? `Your OJT session started at ${format12Hour(now)}`
        : `Session saved locally. Will sync when online.`
      
      showModal('Time In Successful! 🎉', message, 'success')
      
      if (!isOnline) {
        setHasPendingSync(true)
      }
    } catch (error: any) {
      console.error('❌ Time In error:', error)
      showModal('Time In Failed', error.message || 'Failed to start session', 'error')
    } finally {
      setActionLoading(false)
    }
  }
  */

  /* DISABLED - Clock Out Feature
  const handleTimeOut = async () => {
    if (!activeSession || !user?.id) return

    console.log('🔘 Time Out button clicked')

    // Validate time out
    const validation = SessionService.validateTimeOut(activeSession, breaks)
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error)
      showModal('Cannot Time Out', validation.error!, 'warning')
      return
    }

    console.log('✅ Validation passed, showing confirmation')
    // Show confirmation modal
    setTimeOutConfirmVisible(true)
  }

  const confirmTimeOut = async () => {
    if (!activeSession || !user?.id) return

    try {
      console.log('⏰ Confirming Time Out...')
      setTimeOutConfirmVisible(false)
      setActionLoading(true)
      
      const now = new Date()
      const timeString = now.toTimeString().split(' ')[0]

      // Calculate total break time
      const totalBreakSeconds = breaks.reduce((sum, b) => sum + b.duration, 0)

      // Calculate work duration
      const startTime = new Date(`${activeSession.date}T${activeSession.start_time}`)
      const endTime = new Date(`${activeSession.date}T${timeString}`)
      const totalDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      const workDurationSeconds = totalDurationSeconds - totalBreakSeconds
      const totalHours = workDurationSeconds / 3600

      console.log('⏰ Time Out:', timeString)
      console.log('⏱️ Total Duration:', totalDurationSeconds, 'seconds')
      console.log('☕ Break Time:', totalBreakSeconds, 'seconds')
      console.log('💼 Work Duration:', workDurationSeconds, 'seconds =', totalHours.toFixed(2), 'hours')

      await SessionService.endSession(
        activeSession.id,
        timeString,
        workDurationSeconds,
        totalHours,
        description.trim()
      )

      console.log('✅ Session ended successfully')

      if (!isOnline) {
        setHasPendingSync(true)
      }

      // Reset state
      setActiveSession(null)
      setActiveBreak(null)
      setBreaks([])
      setDescription('')
      
      // Show success message with navigation option
      const message = isOnline
        ? `Session completed: ${totalHours.toFixed(2)} hours worked`
        : `Session saved locally. Will sync when online.`
      
      Alert.alert(
        'Time Out Successful! 🎉',
        message,
        [
          {
            text: 'View in Activity Logs',
            onPress: () => {
              router.push('/(app)/(logs)')
            },
          },
          {
            text: 'Stay Here',
            style: 'cancel',
          },
        ]
      )
      
    } catch (error: any) {
      console.error('❌ Time Out error:', error)
      showModal('Time Out Failed', error.message || 'Failed to end session', 'error')
    } finally {
      setActionLoading(false)
    }
  }
  */

  /* DISABLED - Break Features
  const handleStartBreak = async () => {
    if (!activeSession || activeBreak) return

    // Validate start break
    const validation = SessionService.validateStartBreak(activeSession)
    if (!validation.valid) {
      showModal('Cannot Start Break', validation.error!, 'warning')
      return
    }

    try {
      setActionLoading(true)
      const now = new Date()
      const timeString = now.toTimeString().split(' ')[0]

      console.log('☕ Starting break at:', timeString)

      const newBreak = await SessionService.startBreak(activeSession.id, timeString)

      setActiveBreak(newBreak)
      setBreaks([...breaks, newBreak])
      
      console.log('✅ Break started:', newBreak)
      
      const message = isOnline
        ? `Break started at ${format12Hour(now)}`
        : `Break saved locally. Will sync when online.`
      
      showModal('Break Started ☕', message, 'success')
      
      if (!isOnline) {
        setHasPendingSync(true)
      }
    } catch (error: any) {
      console.error('❌ Start break error:', error)
      showModal('Break Failed', error.message || 'Failed to start break', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndBreak = async () => {
    if (!activeBreak || !activeSession) return

    // Validate break duration
    const validation = SessionService.validateBreakDuration(
      activeBreak.start_time,
      activeSession.date
    )
    if (!validation.valid) {
      showModal('Cannot End Break', validation.error!, 'warning')
      return
    }

    try {
      setActionLoading(true)
      const now = new Date()
      const timeString = now.toTimeString().split(' ')[0]

      // Calculate break duration
      const breakStartTime = new Date(`${activeSession.date}T${activeBreak.start_time}`)
      const breakEndTime = new Date(`${activeSession.date}T${timeString}`)
      const breakDurationSeconds = Math.floor((breakEndTime.getTime() - breakStartTime.getTime()) / 1000)

      console.log('☕ Ending break at:', timeString)
      console.log('⏱️ Break duration:', breakDurationSeconds, 'seconds')

      await SessionService.endBreak(activeBreak.id, timeString, breakDurationSeconds)

      // Update local state
      const updatedBreaks = breaks.map(b => 
        b.id === activeBreak.id 
          ? { ...b, end_time: timeString, duration: breakDurationSeconds }
          : b
      )
      setBreaks(updatedBreaks)
      setActiveBreak(null)
      
      console.log('✅ Break ended')
      
      const message = isOnline
        ? `Break duration: ${(breakDurationSeconds / 60).toFixed(0)} minutes`
        : `Break saved locally. Will sync when online.`
      
      showModal('Break Ended ✅', message, 'success')
      
      if (!isOnline) {
        setHasPendingSync(true)
      }
    } catch (error: any) {
      console.error('❌ End break error:', error)
      showModal('Break Failed', error.message || 'Failed to end break', 'error')
    } finally {
      setActionLoading(false)
    }
  }
  */

  // ===================================
  // FORCE RESET / DELETE HANDLERS - DISABLED
  // (Depends on active sessions from Clock In)
  // ===================================

  /* DISABLED - Force Reset Functions
  const handleForceReset = async () => {
    if (!activeSession) {
      showModal('No Session', 'No active session to delete', 'error')
      return
    }

    console.log('🗑️ Force reset initiated for session:', activeSession.id)
    
    Alert.alert(
      'Force Reset Session',
      `This will permanently delete the session started on ${new Date(activeSession.date).toLocaleDateString()} at ${format12Hour(new Date(`${activeSession.date}T${activeSession.start_time}`))}.\n\nAre you sure?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('❌ Force reset cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Starting force delete...')
              setActionLoading(true)
              
              const sessionId = activeSession.id
              console.log('Session ID to delete:', sessionId)
              
              // Force delete from database
              await SessionService.forceResetCurrentSession(sessionId)
              
              console.log('✅ Database deletion complete, clearing local state...')
              
              // Reset state
              setActiveSession(null)
              setActiveBreak(null)
              setBreaks([])
              setDescription('')
              setHasPendingSync(false)
              
              console.log('✅ Local state cleared')
              
              showModal('Session Deleted', 'The stuck session has been removed successfully.', 'success')
              
              // Reload to verify deletion
              setTimeout(() => {
                console.log('🔄 Reloading session data...')
                loadActiveSession()
              }, 1500)
              
            } catch (error: any) {
              console.error('❌ Force reset error:', error)
              console.error('Error details:', JSON.stringify(error, null, 2))
              showModal('Delete Failed', error.message || 'Failed to delete session. Check console for details.', 'error')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleCleanupStaleSessions = async () => {
    Alert.alert(
      'Clean Up Stuck Sessions',
      'This will delete ALL open sessions (sessions with no end time) from the database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true)
              const count = await SessionService.cleanupStaleSessions(user!.id)
              
              if (count > 0) {
                // Clear local state
                await OfflineService.clearActiveSessionLocally()
                setActiveSession(null)
                setActiveBreak(null)
                setBreaks([])
                setDescription('')
                setHasPendingSync(false)
                
                showModal('Success', `Deleted ${count} stuck session(s)`, 'success')
                await loadActiveSession()
              } else {
                showModal('Info', 'No stuck sessions found', 'info')
              }
            } catch (error: any) {
              console.error('❌ Cleanup error:', error)
              showModal('Error', 'Failed to clean up sessions', 'error')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ]
    )
  }
  */

  // ===================================
  // HELPER FUNCTIONS - DISABLED
  // (Used for displaying active session data)
  // ===================================

  /* DISABLED - Time Calculation Functions
  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!activeSession) return '00:00:00'

    const startTime = new Date(`${activeSession.date}T${activeSession.start_time}`)
    const now = currentTime
    
    let diffMs = now.getTime() - startTime.getTime()
    
    // Subtract completed breaks
    breaks.forEach(b => {
      if (b.end_time) {
        diffMs -= b.duration * 1000
      }
    })
    
    // Subtract current break if active
    if (activeBreak) {
      const breakStart = new Date(`${activeSession.date}T${activeBreak.start_time}`)
      const currentBreakDuration = now.getTime() - breakStart.getTime()
      diffMs -= currentBreakDuration
    }
    
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))

    const hours = Math.floor(diffSeconds / 3600)
    const minutes = Math.floor((diffSeconds % 3600) / 60)
    const seconds = diffSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getElapsedHours = () => {
    if (!activeSession) return 0

    const startTime = new Date(`${activeSession.date}T${activeSession.start_time}`)
    const now = currentTime
    
    let diffMs = now.getTime() - startTime.getTime()
    
    // Subtract break time
    breaks.forEach(b => {
      if (b.end_time) {
        diffMs -= b.duration * 1000
      }
    })
    
    if (activeBreak) {
      const breakStart = new Date(`${activeSession.date}T${activeBreak.start_time}`)
      diffMs -= (now.getTime() - breakStart.getTime())
    }
    
    return Math.max(0, diffMs / (1000 * 60 * 60))
  }

  const getTotalBreakTime = () => {
    const totalSeconds = breaks.reduce((sum, b) => sum + b.duration, 0)
    
    if (activeBreak && activeSession) {
      const breakStart = new Date(`${activeSession.date}T${activeBreak.start_time}`)
      const currentBreakSeconds = Math.floor((currentTime.getTime() - breakStart.getTime()) / 1000)
      return totalSeconds + currentBreakSeconds
    }
    
    return totalSeconds
  }

  const formatBreakTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  */
  // ============================================================
  // END OF DISABLED CLOCK IN/OUT FEATURES
  // ============================================================

  // Set loading to false immediately since we don't need to load active sessions
  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="timer-outline" size={64} color={colors.textSecondary} />
        <ThemedText style={{ marginTop: 16 }}>Loading tracker...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Offline Banner */}
      {!isOnline && (
        <View
          style={{
            backgroundColor: '#faa81a',
            padding: 12,
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cloud-offline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText weight="semibold" style={{ color: '#fff', fontSize: 14 }}>
              Offline Mode - Data will sync when online
            </ThemedText>
          </View>
        </View>
      )}

      {/* Pending Sync Banner */}
      {hasPendingSync && isOnline && (
        <View
          style={{
            backgroundColor: colors.accent,
            padding: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <Ionicons name="sync" size={20} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText weight="semibold" style={{ color: '#fff', fontSize: 14 }}>
              Syncing pending data...
            </ThemedText>
          </View>
          <Button
            onPress={syncPendingData}
            style={{
              backgroundColor: '#fff',
              borderColor: '#fff',
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <ThemedText weight="semibold" style={{ color: colors.accent, fontSize: 12 }}>
              Sync Now
            </ThemedText>
          </Button>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <ThemedText weight="bold" style={{ fontSize: 32, marginBottom: 8 }}>
            Time Tracker
          </ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            Use Manual Time Entry to record your OJT hours
          </ThemedText>
        </View>

        {/* Current Time Display */}
        <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
              Current Time
            </ThemedText>
            <ThemedText weight="bold" style={{ fontSize: 48, fontVariant: ['tabular-nums'] }}>
              {format12Hour(currentTime)}
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 14, marginTop: 4 }}>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Manual Time Entry Promotion Card */}
        <ThemedCard
          style={{
            marginBottom: 24,
            padding: 32,
            backgroundColor: colors.accent + '10',
            borderWidth: 2,
            borderColor: colors.accent,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Status Icon */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.background,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                borderWidth: 4,
                borderColor: colors.accent,
              }}
            >
              <Ionicons
                name="create-outline"
                size={56}
                color={colors.accent}
              />
            </View>

            {/* Status Text */}
            <ThemedText
              weight="bold"
              style={{
                fontSize: 24,
                marginBottom: 8,
                color: colors.accent,
                textAlign: 'center',
              }}
            >
              Manual Time Entry Only
            </ThemedText>

            <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
              Clock In/Out features are temporarily disabled. Please use Manual Time Entry to record your hours.
            </ThemedText>

            {/* Manual Entry Button */}
            <Button
              onPress={() => router.push('/modals/manual-entry')}
              style={{ width: '100%', backgroundColor: colors.accent, borderColor: colors.accent }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                  Create Manual Entry
                </ThemedText>
              </View>
            </Button>
          </View>
        </ThemedCard>

        {/* Instructions for Manual Time Entry */}
        <ThemedCard style={{ padding: 20, backgroundColor: colors.accent + '10' }}>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <Ionicons name="information-circle" size={24} color={colors.accent} style={{ marginRight: 12 }} />
            <ThemedText weight="bold" style={{ fontSize: 16 }}>
              How to Use Manual Time Entry
            </ThemedText>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>1.</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                Tap "Create Manual Entry" button above
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>2.</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                Select the date when you worked
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>3.</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                Enter your Time In and Time Out
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>4.</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                Optionally add break periods (if any)
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>5.</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                Add a description of what you worked on
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>6.</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                Save and view your entry in Activity Logs
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <ThemedText variant="secondary" style={{ marginRight: 8 }}>💡</ThemedText>
              <ThemedText variant="secondary" style={{ flex: 1 }}>
                All time entries are saved to your Activity Logs and count toward your required OJT hours
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

      </ScrollView>

      <Modal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />
    </ThemedView>
  )
}