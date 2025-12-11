import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { useAuthStore } from '../../../stores/auth.store'
import { useTheme } from '../../../hooks/useTheme'

interface Session {
  id: string
  date: string
  start_time: string
  end_time: string | null
  total_hours: number
  description: string | null
}

export default function LogsScreen() {
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all')

  useFocusEffect(
    useCallback(() => {
      loadSessions()
    }, [user?.id])
  )

  const loadSessions = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // TODO: Load from Supabase
      // Mock data for now
      setSessions([
        {
          id: '1',
          date: '2024-12-05',
          start_time: '08:00',
          end_time: '17:00',
          total_hours: 8,
          description: 'Worked on project documentation',
        },
        {
          id: '2',
          date: '2024-12-04',
          start_time: '09:00',
          end_time: '16:30',
          total_hours: 7.5,
          description: 'Team meeting and code review',
        },
      ])
      
      console.log('✅ Sessions loaded')
    } catch (error) {
      console.error('❌ Error loading sessions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadSessions()
  }, [user?.id])

  const totalHours = sessions.reduce((sum, session) => sum + session.total_hours, 0)
  const avgHoursPerDay = sessions.length > 0 ? totalHours / sessions.length : 0

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
        <View style={{ marginBottom: 32 }}>
          <ThemedText weight="bold" style={{ fontSize: 32, marginBottom: 8 }}>
            Activity Logs
          </ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            Track your OJT work history
          </ThemedText>
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

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {(['all', 'week', 'month'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: filter === f ? colors.accent : colors.card,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <ThemedText
                weight="semibold"
                style={{
                  fontSize: 13,
                  color: filter === f ? '#fff' : colors.text,
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sessions List */}
        <View style={{ marginBottom: 24 }}>
          <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 16 }}>
            Recent Sessions
          </ThemedText>

          {sessions.length === 0 ? (
            <ThemedCard style={{ padding: 32, alignItems: 'center' }}>
              <MaterialCommunityIcons name="notebook-outline" size={64} color={colors.textSecondary} style={{ marginBottom: 16 }} />
              <ThemedText weight="semibold" style={{ fontSize: 16, marginBottom: 8 }}>
                No sessions yet
              </ThemedText>
              <ThemedText variant="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
                Start tracking your OJT hours to see them here
              </ThemedText>
            </ThemedCard>
          ) : (
            <View style={{ gap: 12 }}>
              {sessions.map((session) => (
                <ThemedCard key={session.id} style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </ThemedText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                          {session.start_time} - {session.end_time || 'In progress'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText weight="bold" style={{ fontSize: 20, color: colors.accent }}>
                        {session.total_hours.toFixed(1)}h
                      </ThemedText>
                      <ThemedText variant="secondary" style={{ fontSize: 11 }}>
                        hours
                      </ThemedText>
                    </View>
                  </View>

                  {session.description && (
                    <View
                      style={{
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                      <ThemedText variant="secondary" style={{ fontSize: 13, flex: 1 }}>
                        {session.description}
                      </ThemedText>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 10,
                        backgroundColor: colors.card,
                        borderRadius: 6,
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                      <ThemedText weight="semibold" style={{ fontSize: 12, color: colors.accent }}>
                        Edit
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 10,
                        backgroundColor: colors.card,
                        borderRadius: 6,
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ed4245" style={{ marginRight: 6 }} />
                      <ThemedText weight="semibold" style={{ fontSize: 12, color: '#ed4245' }}>
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
      </ScrollView>
    </ThemedView>
  )
}