import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/auth.store'
import { SessionService } from '../../../services/session.service'
import { PDFExportService } from '../../../services/pdf-export.service'
import { useTheme } from '../../../hooks/useTheme'
import { supabase } from '../../../lib/supabase'
import type { Database } from '../../../types/supabase'
import type { Session as SessionModel } from '../../../types/models'

type Session = Database['public']['Tables']['sessions']['Row']

export default function LogsScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [exportingAll, setExportingAll] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadSessions()
    }, [user?.id])
  )

  useEffect(() => {
    filterSessions()
  }, [sessions, searchQuery])

  const loadSessions = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('📋 Loading sessions from database...')
      
      // Load all completed sessions (sessions with end_time)
      const allSessions = await SessionService.getSessions(user.id, 100, 0)
      
      // Filter to only show completed sessions and sort by date (newest first)
      const completedSessions = allSessions
        .filter(s => s.end_time !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      console.log(`✅ Loaded ${completedSessions.length} completed sessions`)
      setSessions(completedSessions)
      
    } catch (error) {
      console.error('❌ Error loading sessions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterSessions = () => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = sessions.filter(session => {
      const date = new Date(session.date).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }).toLowerCase()
      const description = (session.description || '').toLowerCase()
      const startTime = formatTime12Hour(session.start_time).toLowerCase()
      const endTime = formatTime12Hour(session.end_time).toLowerCase()
      
      return date.includes(query) || 
             description.includes(query) ||
             startTime.includes(query) ||
             endTime.includes(query)
    })
    
    setFilteredSessions(filtered)
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadSessions()
  }, [user?.id])

  const formatTime12Hour = (time: string | null) => {
    if (!time) return '-'
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const hour12 = hours % 12 || 12
      return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
    } catch {
      return time
    }
  }

  const handleDeleteSession = (session: Session) => {
    setSessionToDelete(session)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    if (!sessionToDelete) return

    try {
      setDeleteModalVisible(false)
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id)

      if (error) throw error

      Alert.alert('Success', 'Session deleted successfully')
      loadSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
      Alert.alert('Error', 'Failed to delete session')
    } finally {
      setSessionToDelete(null)
    }
  }

  const handleEditSession = (session: Session) => {
    router.push(`/(app)/(logs)/${session.id}`)
  }

  const handleExportAll = async () => {
    if (sessions.length === 0) {
      Alert.alert('No Sessions', 'There are no sessions to export')
      return
    }

    setExportingAll(true)
    try {
      // Transform sessions to include breaks
      const sessionsToExport: SessionModel[] = sessions.map(s => ({
        ...s,
        breaks: ((s as any).breaks as any) || null,
      }))
      
      await PDFExportService.exportMultipleSessions(sessionsToExport)
      Alert.alert('Success', `Exported ${sessions.length} sessions to PDF`)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export sessions: ' + error.message)
    } finally {
      setExportingAll(false)
    }
  }

  const totalHours = sessions.reduce((sum, session) => sum + session.total_hours, 0)
  const avgHoursPerDay = sessions.length > 0 ? totalHours / sessions.length : 0
  const displaySessions = filteredSessions

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="notebook-outline" size={64} color={colors.textSecondary} />
        <ThemedText style={{ marginTop: 16 }}>Loading logs...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText weight="bold" style={{ fontSize: 32 }}>
              Activity Logs
            </ThemedText>
            {sessions.length > 0 && (
              <TouchableOpacity
                onPress={handleExportAll}
                disabled={exportingAll}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: exportingAll ? 0.6 : 1,
                }}
              >
                <Ionicons name="document-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <ThemedText weight="semibold" style={{ color: '#fff', fontSize: 13 }}>
                  {exportingAll ? 'Exporting...' : 'Export All'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            Track your OJT work history
          </ThemedText>
        </View>

        {/* Search Bar */}
        <View style={{ marginBottom: 20 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: searchQuery ? colors.accent : colors.border,
          }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              placeholder="Search by date, tasks, or keywords..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                paddingVertical: 12,
                fontFamily: 'System',
              }}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery !== '' && (
            <ThemedText variant="secondary" style={{ fontSize: 12, marginTop: 8, marginLeft: 4 }}>
              Found {displaySessions.length} session{displaySessions.length !== 1 ? 's' : ''}
            </ThemedText>
          )}
        </View>

        {/* View Toggle */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setView('list')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              backgroundColor: view === 'list' ? colors.accent : colors.card,
              borderRadius: 8,
            }}
          >
            <Ionicons name="list" size={18} color={view === 'list' ? '#fff' : colors.text} style={{ marginRight: 8 }} />
            <ThemedText
              weight="semibold"
              style={{ fontSize: 14, color: view === 'list' ? '#fff' : colors.text }}
            >
              List View
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setView('calendar')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              backgroundColor: view === 'calendar' ? colors.accent : colors.card,
              borderRadius: 8,
            }}
          >
            <Ionicons name="calendar" size={18} color={view === 'calendar' ? '#fff' : colors.text} style={{ marginRight: 8 }} />
            <ThemedText
              weight="semibold"
              style={{ fontSize: 14, color: view === 'calendar' ? '#fff' : colors.text }}
            >
              Calendar View
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <ThemedCard style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="time" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <ThemedText variant="secondary" style={{ fontSize: 11 }}>
                Total Hours
              </ThemedText>
            </View>
            <ThemedText weight="bold" style={{ fontSize: 24, color: colors.accent }}>
              {totalHours.toFixed(1)}
            </ThemedText>
          </ThemedCard>

          <ThemedCard style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <ThemedText variant="secondary" style={{ fontSize: 11 }}>
                Total Days
              </ThemedText>
            </View>
            <ThemedText weight="bold" style={{ fontSize: 24, color: colors.accent }}>
              {sessions.length}
            </ThemedText>
          </ThemedCard>

          <ThemedCard style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="trending-up" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <ThemedText variant="secondary" style={{ fontSize: 11 }}>
                Avg/Day
              </ThemedText>
            </View>
            <ThemedText weight="bold" style={{ fontSize: 24, color: colors.accent }}>
              {avgHoursPerDay.toFixed(1)}
            </ThemedText>
          </ThemedCard>
        </View>

        {/* Conditional Content */}
        {view === 'calendar' ? (
          renderCalendarView()
        ) : (
          <>
            {/* Sessions List */}
            <View style={{ marginBottom: 24 }}>
              <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 16 }}>
                {searchQuery ? 'Search Results' : 'All Sessions'}
              </ThemedText>

              {displaySessions.length === 0 ? (
                <ThemedCard style={{ padding: 32, alignItems: 'center' }}>
                  <MaterialCommunityIcons 
                    name={searchQuery ? "magnify" : "notebook-outline"} 
                    size={64} 
                    color={colors.textSecondary} 
                    style={{ marginBottom: 16 }} 
                  />
                  <ThemedText weight="semibold" style={{ fontSize: 16, marginBottom: 8 }}>
                    {searchQuery ? 'No results found' : 'No sessions yet'}
                  </ThemedText>
                  <ThemedText variant="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
                    {searchQuery ? 'Try a different search term' : 'Start tracking your OJT hours to see them here'}
                  </ThemedText>
                </ThemedCard>
              ) : (
                <View style={{ gap: 12 }}>
                  {displaySessions.map((session) => (
                    <ThemedCard key={session.id} style={{ padding: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Ionicons name="calendar-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                            <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                              {formatTime12Hour(session.start_time)} - {formatTime12Hour(session.end_time)}
                            </ThemedText>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="hourglass-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                              Duration: {session.total_hours.toFixed(2)} hours
                            </ThemedText>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                          <View style={{
                            backgroundColor: colors.accent + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                          }}>
                            <ThemedText weight="bold" style={{ fontSize: 20, color: colors.accent }}>
                              {session.total_hours.toFixed(1)}h
                            </ThemedText>
                          </View>
                          <ThemedText variant="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                            total hours
                          </ThemedText>
                        </View>
                      </View>

                      {/* Breaks not displayed - not stored in database */}

                      {session.description && (
                        <View
                          style={{
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginBottom: 12,
                          }}
                        >
                          <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                          <ThemedText variant="secondary" style={{ fontSize: 13, flex: 1 }}>
                            {session.description}
                          </ThemedText>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleEditSession(session)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            backgroundColor: colors.accent + '15',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.accent + '30',
                          }}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                          <ThemedText weight="semibold" style={{ fontSize: 13, color: colors.accent }}>
                            Edit
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteSession(session)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 12,
                            backgroundColor: '#ed424515',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#ed424530',
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ed4245" style={{ marginRight: 6 }} />
                          <ThemedText weight="semibold" style={{ fontSize: 13, color: '#ed4245' }}>
                            Delete
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </ThemedCard>
                  ))}
                </View>
              )}
            </View>

            {/* Export Button */}
            {sessions.length > 0 && (
              <TouchableOpacity
                style={{
                  padding: 16,
                  backgroundColor: colors.card,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Ionicons name="download-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <ThemedText weight="semibold" style={{ color: colors.accent }}>
                  Export to PDF
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Delete Session"
        type="warning"
        message={`Are you sure you want to delete this session?\n\nDate: ${sessionToDelete ? new Date(sessionToDelete.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}\nHours: ${sessionToDelete?.total_hours.toFixed(1) || 0}h\n\nThis action cannot be undone.`}
        actions={[
          {
            text: 'Cancel',
            onPress: () => setDeleteModalVisible(false),
            variant: 'outline',
          },
          {
            text: 'Delete',
            onPress: confirmDelete,
            variant: 'danger',
          },
        ]}
      />
    </ThemedView>
  )

  function renderCalendarView() {
    const getHeatmapColor = (hours: number) => {
      if (hours === 0) return colors.tertiary
      if (hours < 4) return `${colors.accent}33`
      if (hours < 6) return `${colors.accent}66`
      if (hours < 8) return `${colors.accent}99`
      return colors.accent
    }

    // Group sessions by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = session.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(session)
      return acc
    }, {} as Record<string, Session[]>)

    // Get current month dates
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

    return (
      <View style={{ marginBottom: 24 }}>
        <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 16 }}>
          Calendar View - {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </ThemedText>

        <ThemedCard style={{ padding: 16 }}>
          {/* Day headers */}
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText variant="secondary" style={{ fontSize: 12, fontWeight: '600' }}>
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }} />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const daySessions = sessionsByDate[date] || []
              const totalHours = daySessions.reduce((sum, s) => sum + s.total_hours, 0)
              const isToday = day === today.getDate()

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => {
                    if (daySessions.length > 0) {
                      setSearchQuery(new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
                      setView('list')
                    }
                  }}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    padding: 2,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: getHeatmapColor(totalHours),
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: isToday ? 2 : 0,
                      borderColor: colors.accent,
                    }}
                  >
                    <ThemedText weight={isToday ? 'bold' : 'normal'} style={{ fontSize: 14 }}>
                      {day}
                    </ThemedText>
                    {totalHours > 0 && (
                      <ThemedText weight="bold" style={{ fontSize: 10, color: colors.accent }}>
                        {totalHours.toFixed(1)}h
                      </ThemedText>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>Less</ThemedText>
            {[0, 2, 5, 8, 10].map(hours => (
              <View
                key={hours}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  backgroundColor: getHeatmapColor(hours),
                }}
              />
            ))}
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>More</ThemedText>
          </View>

          <ThemedText variant="secondary" style={{ fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            Tap a highlighted day to view sessions
          </ThemedText>
        </ThemedCard>
      </View>
    )
  }
}