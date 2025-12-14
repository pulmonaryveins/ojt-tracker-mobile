import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Modal } from '../../../components/ui/Modal'
import { useAuthStore } from '../../../stores/auth.store'
import { supabase } from '../../../lib/supabase'
import { PDFExportService } from '../../../services/pdf-export.service'
import { useTheme } from '../../../hooks/useTheme'
import { dateUtils } from '../../../utils/timezone'
import type { Session } from '../../../types/models'

export default function ReportsScreen() {
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month')
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    actions?: Array<{ text: string; onPress: () => void; variant?: 'primary' | 'outline' }>
  }>({ visible: false, title: '', message: '', type: 'info' })

  // Statistics
  const [totalHours, setTotalHours] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [avgHoursPerDay, setAvgHoursPerDay] = useState(0)
  const [currentMonthHours, setCurrentMonthHours] = useState(0)

  useFocusEffect(
    useCallback(() => {
      loadSessions()
    }, [user?.id])
  )

  useEffect(() => {
    calculateStatistics()
  }, [sessions])

  const loadSessions = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      
      const sessionsWithReports = (data || []).map((s: any) => ({
        ...s,
        breaks: null,
        tasks_completed: s.tasks_completed || null,
        lessons_learned: s.lessons_learned || null,
        report_images: s.report_images || null,
      }))
      
      setSessions(sessionsWithReports)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadSessions()
    setRefreshing(false)
  }

  const calculateStatistics = () => {
    if (sessions.length === 0) {
      setTotalHours(0)
      setTotalSessions(0)
      setAvgHoursPerDay(0)
      setCurrentMonthHours(0)
      return
    }

    // Total hours
    const total = sessions.reduce((sum, session) => sum + session.total_hours, 0)
    setTotalHours(total)
    setTotalSessions(sessions.length)

    // Average hours per day (considering only days with sessions)
    const uniqueDates = new Set(sessions.map(s => s.date))
    const avg = total / uniqueDates.size
    setAvgHoursPerDay(avg)

    // Current month hours
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear
    })
    const monthTotal = monthSessions.reduce((sum, session) => sum + session.total_hours, 0)
    setCurrentMonthHours(monthTotal)
  }

  const getFilteredSessions = () => {
    const now = new Date()
    
    switch (selectedPeriod) {
      case 'week': {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return sessions.filter(s => new Date(s.date) >= weekAgo)
      }
      case 'month': {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return sessions.filter(s => new Date(s.date) >= monthAgo)
      }
      case 'all':
      default:
        return sessions
    }
  }

  const handleExport = async () => {
    const filteredSessions = getFilteredSessions()
    
    if (filteredSessions.length === 0) {
      setModal({
        visible: true,
        title: 'No Data',
        message: 'No sessions found for the selected period.',
        type: 'warning'
      })
      return
    }

    setModal({
      visible: true,
      title: 'Export Report',
      message: `Export ${filteredSessions.length} session${filteredSessions.length > 1 ? 's' : ''} as PDF?`,
      type: 'info',
      actions: [
        {
          text: 'Cancel',
          onPress: () => setModal(prev => ({ ...prev, visible: false })),
          variant: 'outline'
        },
        {
          text: 'Export',
          onPress: async () => {
            setModal(prev => ({ ...prev, visible: false }))
            try {
              setExporting(true)
              await PDFExportService.exportMultipleSessions(filteredSessions)
              setModal({
                visible: true,
                title: 'Success',
                message: 'Report exported successfully!',
                type: 'success'
              })
            } catch (error) {
              console.error('Export error:', error)
              setModal({
                visible: true,
                title: 'Error',
                message: 'Failed to export report',
                type: 'error'
              })
            } finally {
              setExporting(false)
            }
          },
          variant: 'primary'
        }
      ]
    })
  }

  const handleQuickExport = async (type: 'today' | 'week' | 'month') => {
    const now = new Date()
    let filtered: Session[] = []

    switch (type) {
      case 'today': {
        const today = dateUtils.formatPH(now, 'yyyy-MM-dd')
        filtered = sessions.filter(s => s.date === today)
        break
      }
      case 'week': {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        filtered = sessions.filter(s => new Date(s.date) >= weekAgo)
        break
      }
      case 'month': {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        filtered = sessions.filter(s => new Date(s.date) >= monthAgo)
        break
      }
    }

    if (filtered.length === 0) {
      setModal({
        visible: true,
        title: 'No Data',
        message: `No sessions found for ${type}.`,
        type: 'warning'
      })
      return
    }

    try {
      setExporting(true)
      await PDFExportService.exportMultipleSessions(filtered)
      setModal({
        visible: true,
        title: 'Success',
        message: 'Report exported successfully!',
        type: 'success'
      })
    } catch (error) {
      console.error('Export error:', error)
      setModal({
        visible: true,
        title: 'Error',
        message: 'Failed to export report',
        type: 'error'
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
        <ThemedText style={{ marginTop: 16 }}>Loading reports...</ThemedText>
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
              Reports
            </ThemedText>
          </View>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            Export and manage your OJT reports
          </ThemedText>
        </View>

        {/* Statistics Overview */}
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
                Total Sessions
              </ThemedText>
            </View>
            <ThemedText weight="bold" style={{ fontSize: 24, color: colors.accent }}>
              {totalSessions}
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

        <ThemedCard style={{ marginBottom: 24, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="calendar-outline" size={20} color="#3ba55d" style={{ marginRight: 8 }} />
            <ThemedText variant="secondary" style={{ fontSize: 11 }}>
              This Month
            </ThemedText>
          </View>
          <ThemedText weight="bold" style={{ fontSize: 24, color: "#3ba55d" }}>
            {currentMonthHours.toFixed(1)}h
          </ThemedText>
        </ThemedCard>

        {/* Quick Export */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="flash" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <ThemedText weight="bold" style={{ fontSize: 18 }}>
              Quick Export
            </ThemedText>
          </View>
          
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => handleQuickExport('today')}
              disabled={exporting}
              style={{ opacity: exporting ? 0.5 : 1 }}
            >
              <ThemedCard style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.accent + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="today" size={20} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                        Today's Sessions
                      </ThemedText>
                      <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                        Export today's work
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </ThemedCard>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickExport('week')}
              disabled={exporting}
              style={{ opacity: exporting ? 0.5 : 1 }}
            >
              <ThemedCard style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.accent + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                        Past 7 Days
                      </ThemedText>
                      <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                        Last week's sessions
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </ThemedCard>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickExport('month')}
              disabled={exporting}
              style={{ opacity: exporting ? 0.5 : 1 }}
            >
              <ThemedCard style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.accent + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar" size={20} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                        Past 30 Days
                      </ThemedText>
                      <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                        Last month's sessions
                      </ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </ThemedCard>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Export */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="options" size={20} color={colors.accent} style={{ marginRight: 8 }} />
            <ThemedText weight="bold" style={{ fontSize: 18 }}>
              Custom Export
            </ThemedText>
          </View>
          
          <ThemedCard style={{ padding: 16 }}>
            <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
              Select period and export
            </ThemedText>

            {/* Period Selection */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setSelectedPeriod('week')}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: selectedPeriod === 'week' ? colors.accent : colors.background,
                  borderWidth: 1,
                  borderColor: selectedPeriod === 'week' ? colors.accent : colors.border,
                }}
              >
                <ThemedText
                  weight="semibold"
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: selectedPeriod === 'week' ? 'white' : colors.text,
                  }}
                >
                  7 Days
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPeriod('month')}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: selectedPeriod === 'month' ? colors.accent : colors.background,
                  borderWidth: 1,
                  borderColor: selectedPeriod === 'month' ? colors.accent : colors.border,
                }}
              >
                <ThemedText
                  weight="semibold"
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: selectedPeriod === 'month' ? 'white' : colors.text,
                  }}
                >
                  30 Days
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPeriod('all')}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: selectedPeriod === 'all' ? colors.accent : colors.background,
                  borderWidth: 1,
                  borderColor: selectedPeriod === 'all' ? colors.accent : colors.border,
                }}
              >
                <ThemedText
                  weight="semibold"
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: selectedPeriod === 'all' ? 'white' : colors.text,
                  }}
                >
                  All Time
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Export Button */}
            <TouchableOpacity
              onPress={handleExport}
              disabled={exporting || sessions.length === 0}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                backgroundColor: colors.accent,
                borderRadius: 12,
                opacity: exporting || sessions.length === 0 ? 0.5 : 1,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="download-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <ThemedText weight="semibold" style={{ color: 'white', fontSize: 15 }}>
                {exporting ? 'Exporting...' : `Export ${getFilteredSessions().length} Sessions`}
              </ThemedText>
            </TouchableOpacity>
          </ThemedCard>
        </View>

        {/* Info Card */}
        <ThemedCard
          style={{
            padding: 16,
            backgroundColor: colors.accent + '10',
            borderWidth: 1,
            borderColor: colors.accent + '30',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={24} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText weight="semibold" style={{ marginBottom: 6, fontSize: 15 }}>
                Professional Reports
              </ThemedText>
              <ThemedText variant="secondary" style={{ fontSize: 13, lineHeight: 20 }}>
                PDFs include time logs, session reports, tasks completed, and lessons learned. Perfect for academic submissions and supervisor reviews.
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Empty State */}
        {sessions.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60, marginTop: 32 }}>
            <Ionicons name="document-text-outline" size={80} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <ThemedText weight="semibold" style={{ fontSize: 16, marginBottom: 8 }}>
              No sessions yet
            </ThemedText>
            <ThemedText variant="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
              Start tracking your OJT hours{'\n'}to generate reports
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Custom Modal */}
      <Modal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
        actions={modal.actions}
      />
    </ThemedView>
  )
}
