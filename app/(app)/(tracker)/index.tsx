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

type Session = Database['public']['Tables']['sessions']['Row']
type Break = Database['public']['Tables']['breaks']['Row']

export default function TrackerScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [activeBreak, setActiveBreak] = useState<Break | null>(null)
  const [breaks, setBreaks] = useState<Break[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
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

  const [timeOutConfirmVisible, setTimeOutConfirmVisible] = useState(false)

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

  // Load active session on mount and when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadActiveSession()
    }, [user?.id])
  )

  const checkPendingSync = async () => {
    const pending = await OfflineService.getPendingActions()
    setHasPendingSync(pending.length > 0)
  }

  const syncPendingData = async () => {
    try {
      await SessionService.syncPendingActions()
      setHasPendingSync(false)
      await loadActiveSession()
      showModal('Sync Complete', 'All data has been synced successfully', 'success')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    }
  }

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
      
      // Show success message
      const message = isOnline
        ? `Session completed: ${totalHours.toFixed(2)} hours worked`
        : `Session saved locally. Will sync when online.`
      
      showModal('Time Out Successful! 🎉', message, 'success')
      
      // Navigate to logs after a short delay
      setTimeout(() => {
        console.log('📋 Navigating to activity logs...')
        router.push('/(app)/(logs)')
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Time Out error:', error)
      showModal('Time Out Failed', error.message || 'Failed to end session', 'error')
    } finally {
      setActionLoading(false)
    }
  }

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

  // ===================================
  // FORCE RESET / DELETE HANDLERS
  // ===================================

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
            {activeSession 
              ? activeBreak 
                ? '☕ On break' 
                : '⏱️ Session in progress'
              : 'Tap Time In to start your OJT session'}
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

        {/* Session Status Card */}
        <ThemedCard
          style={{
            marginBottom: 24,
            padding: 32,
            backgroundColor: activeSession ? colors.accent + '15' : colors.card,
            borderWidth: activeSession ? 2 : 0,
            borderColor: activeSession ? colors.accent : 'transparent',
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
                borderColor: activeSession 
                  ? activeBreak 
                    ? '#faa81a' 
                    : colors.accent 
                  : colors.border,
              }}
            >
              <Ionicons
                name={activeSession 
                  ? activeBreak 
                    ? 'cafe' 
                    : 'checkmark-circle' 
                  : 'time-outline'}
                size={56}
                color={activeSession 
                  ? activeBreak 
                    ? '#faa81a' 
                    : colors.accent 
                  : colors.textSecondary}
              />
            </View>

            {/* Status Text */}
            <ThemedText
              weight="bold"
              style={{
                fontSize: 24,
                marginBottom: 8,
                color: activeSession 
                  ? activeBreak 
                    ? '#faa81a' 
                    : colors.accent 
                  : colors.text,
              }}
            >
              {activeSession 
                ? activeBreak 
                  ? 'On Break' 
                  : 'Clocked In' 
                : 'Ready to Start'}
            </ThemedText>

            {activeSession ? (
              <>
                <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 24 }}>
                  Started at{' '}
                  {format12Hour(new Date(`${activeSession.date}T${activeSession.start_time}`))}
                </ThemedText>

                {/* Elapsed Time */}
                <View
                  style={{
                    backgroundColor: colors.background,
                    padding: 20,
                    borderRadius: 12,
                    marginBottom: 16,
                    width: '100%',
                  }}
                >
                  <ThemedText
                    variant="secondary"
                    style={{ fontSize: 12, textAlign: 'center', marginBottom: 8 }}
                  >
                    {activeBreak ? 'Work Time (excluding break)' : 'Work Time'}
                  </ThemedText>
                  <ThemedText
                    weight="bold"
                    style={{
                      fontSize: 40,
                      textAlign: 'center',
                      fontVariant: ['tabular-nums'],
                      color: activeBreak ? colors.textSecondary : colors.accent,
                    }}
                  >
                    {getElapsedTime()}
                  </ThemedText>
                  <ThemedText
                    variant="secondary"
                    style={{ fontSize: 14, textAlign: 'center', marginTop: 8 }}
                  >
                    {getElapsedHours().toFixed(2)} hours
                  </ThemedText>
                </View>

                {/* Break Time Display */}
                {breaks.length > 0 && (
                  <View
                    style={{
                      backgroundColor: '#faa81a20',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 24,
                      width: '100%',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cafe" size={20} color="#faa81a" style={{ marginRight: 8 }} />
                      <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                        Total Break Time: {formatBreakTime(getTotalBreakTime())}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Minimum Time Warning */}
                {!activeBreak && (() => {
                  const workDuration = SessionService.getSessionWorkDuration(activeSession, breaks)
                  const minRequired = 15 // 15 minutes
                  
                  if (workDuration < minRequired) {
                    const remaining = minRequired - workDuration
                    return (
                      <View
                        style={{
                          backgroundColor: '#faa81a20',
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 12,
                          width: '100%',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="time-outline" size={16} color="#faa81a" style={{ marginRight: 6 }} />
                          <ThemedText style={{ fontSize: 12, color: '#faa81a' }}>
                            Work {remaining} more minute{remaining !== 1 ? 's' : ''} to enable Time Out
                          </ThemedText>
                        </View>
                      </View>
                    )
                  }
                  return null
                })()}

                {/* Action Buttons */}
                <View style={{ width: '100%', gap: 12 }}>
                  {activeBreak ? (
                    <Button
                      onPress={handleEndBreak}
                      loading={actionLoading}
                      disabled={actionLoading}
                      style={{ backgroundColor: '#3ba55d', borderColor: '#3ba55d' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <ThemedText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                          End Break
                        </ThemedText>
                      </View>
                    </Button>
                  ) : (
                    <Button
                      onPress={handleStartBreak}
                      loading={actionLoading}
                      disabled={actionLoading}
                      variant="outline"
                      style={{ borderColor: '#faa81a' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="cafe" size={20} color="#faa81a" style={{ marginRight: 8 }} />
                        <ThemedText weight="bold" style={{ color: '#faa81a', fontSize: 16 }}>
                          Start Break
                        </ThemedText>
                      </View>
                    </Button>
                  )}

                  <Button
                    onPress={handleTimeOut}
                    loading={actionLoading}
                    disabled={actionLoading || !!activeBreak}
                    style={{
                      backgroundColor: '#ed4245',
                      borderColor: '#ed4245',
                      opacity: activeBreak ? 0.5 : 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="log-out" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <ThemedText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                        Time Out
                      </ThemedText>
                    </View>
                  </Button>

                  {/* Force Delete Session Button */}
                  <Button
                    variant="outline"
                    onPress={handleForceReset}
                    disabled={actionLoading}
                    style={{
                      borderColor: '#ed4245',
                      marginTop: 4,
                      opacity: actionLoading ? 0.5 : 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="trash-outline" size={20} color="#ed4245" style={{ marginRight: 8 }} />
                      <ThemedText weight="bold" style={{ color: '#ed4245', fontSize: 14 }}>
                        Force Delete Session
                      </ThemedText>
                    </View>
                  </Button>
                </View>
              </>
            ) : (
              <>
                {/* Description Input */}
                <View style={{ width: '100%', marginBottom: 24 }}>
                  <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                    Task Description (Optional)
                  </ThemedText>
                  <TextInput
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      color: colors.text,
                      fontSize: 14,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                    placeholder="What are you working on today?"
                    placeholderTextColor={colors.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>

                <Button 
                  onPress={handleTimeIn} 
                  loading={actionLoading}
                  disabled={actionLoading}
                  style={{ width: '100%' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="log-in" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <ThemedText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                      Time In
                    </ThemedText>
                  </View>
                </Button>

                {/* Clean Up Stuck Sessions Button */}
                <Button
                  variant="outline"
                  onPress={handleCleanupStaleSessions}
                  disabled={actionLoading}
                  style={{
                    borderColor: '#ed4245',
                    marginTop: 12,
                    opacity: actionLoading ? 0.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="trash-bin" size={20} color="#ed4245" style={{ marginRight: 8 }} />
                    <ThemedText weight="bold" style={{ color: '#ed4245', fontSize: 14 }}>
                      Clean Up All Stuck Sessions
                    </ThemedText>
                  </View>
                </Button>
              </>
            )}
          </View>
        </ThemedCard>

        {/* Session Details */}
        {activeSession && (
          <ThemedCard style={{ padding: 20, marginBottom: 24 }}>
            <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 16 }}>
              Session Details
            </ThemedText>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary">Date</ThemedText>
                </View>
                <ThemedText weight="semibold">
                  {new Date(activeSession.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary">Time In</ThemedText>
                </View>
                <ThemedText weight="semibold">
                  {format12Hour(new Date(`${activeSession.date}T${activeSession.start_time}`))}
                </ThemedText>
              </View>

              {breaks.length > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="cafe-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <ThemedText variant="secondary">Breaks Taken</ThemedText>
                  </View>
                  <ThemedText weight="semibold">{breaks.length}</ThemedText>
                </View>
              )}

              {activeSession.description && (
                <View
                  style={{
                    paddingTop: 12,
                    marginTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
                        Description
                      </ThemedText>
                      <ThemedText style={{ fontSize: 14 }}>{activeSession.description}</ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ThemedCard>
        )}

        {/* Instructions */}
        {!activeSession && (
          <>
          <ThemedCard style={{ padding: 20, backgroundColor: colors.accent + '10' }}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <Ionicons name="information-circle" size={24} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 16 }}>
                How It Works
              </ThemedText>
            </View>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row' }}>
                <ThemedText variant="secondary" style={{ marginRight: 8 }}>1.</ThemedText>
                <ThemedText variant="secondary" style={{ flex: 1 }}>
                  Tap "Time In" when you arrive at your OJT workplace
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <ThemedText variant="secondary" style={{ marginRight: 8 }}>2.</ThemedText>
                <ThemedText variant="secondary" style={{ flex: 1 }}>
                  Use "Start Break" for lunch or rest periods (after 30 minutes of work)
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <ThemedText variant="secondary" style={{ marginRight: 8 }}>3.</ThemedText>
                <ThemedText variant="secondary" style={{ flex: 1 }}>
                  "End Break" when you resume work (minimum 1 minute)
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <ThemedText variant="secondary" style={{ marginRight: 8 }}>4.</ThemedText>
                <ThemedText variant="secondary" style={{ flex: 1 }}>
                  Tap "Time Out" when you finish (minimum 15 minutes of work)
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <ThemedText variant="secondary" style={{ marginRight: 8 }}>💡</ThemedText>
                <ThemedText variant="secondary" style={{ flex: 1 }}>
                  Works offline! Your data will sync when you're back online.
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <ThemedText variant="secondary" style={{ marginRight: 8 }}>📝</ThemedText>
                <ThemedText variant="secondary" style={{ flex: 1 }}>
                  Forgot to clock in/out? Use "Manual Time Entry" below.
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          {/* Manual Entry Card */}
          <ThemedCard style={{ padding: 20, marginTop: 16, backgroundColor: colors.accent + '05' }}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <Ionicons name="create" size={24} color={colors.accent} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>
                  Manual Time Entry
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  Forgot to clock in or out? Enter your time manually and it will be saved just like an automatic entry.
                </ThemedText>
              </View>
            </View>
            <Button
              onPress={() => router.push('/modals/manual-entry')}
              variant="outline"
              style={{ borderColor: colors.accent }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add-circle" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <ThemedText weight="bold" style={{ color: colors.accent, fontSize: 14 }}>
                  Create Manual Entry
                </ThemedText>
              </View>
            </Button>
          </ThemedCard>
          </>
        )}
      </ScrollView>

      <Modal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      {/* Time Out Confirmation Modal */}
      <Modal
        visible={timeOutConfirmVisible}
        title="Confirm Time Out"
        message="Are you sure you want to end this session? You will be redirected to your activity logs."
        type="warning"
        onClose={() => setTimeOutConfirmVisible(false)}
        actions={[
          {
            text: 'Cancel',
            onPress: () => {
              console.log('❌ Time Out cancelled')
              setTimeOutConfirmVisible(false)
            },
            variant: 'outline',
          },
          {
            text: 'Time Out',
            onPress: confirmTimeOut,
            variant: 'danger',
          },
        ]}
      />
    </ThemedView>
  )
}