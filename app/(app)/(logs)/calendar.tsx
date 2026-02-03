import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/auth.store'
import { SessionService } from '../../../services/session.service'
import type { Database } from '../../../types/supabase'
import { dateUtils } from '../../../utils/timezone'
import { useTheme } from '../../../hooks/useTheme'

type Session = Database['public']['Tables']['sessions']['Row']

interface DayData {
  date: string
  hours: number
  hasSession: boolean
  sessionId?: string
}

export default function CalendarScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { colors } = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<DayData[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    loadMonthData()
  }, [currentMonth, user?.id])

  const loadMonthData = async () => {
    if (!user?.id) return

    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    try {
      const startDateStr = dateUtils.formatPH(startDate, 'yyyy-MM-dd')
      const endDateStr = dateUtils.formatPH(endDate, 'yyyy-MM-dd')
      const data = await SessionService.getSessionsByDateRange(user.id, startDateStr, endDateStr)
      setSessions(data)

      // Generate calendar data
      const days: DayData[] = []
      const daysInMonth = endDate.getDate()
      const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({
          date: '',
          hours: 0,
          hasSession: false,
        })
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
        const dateStr = dateUtils.formatPH(date, 'yyyy-MM-dd')
        const daySessions = data.filter(s => s.date === dateStr)
        const totalHours = daySessions.reduce((sum, s) => sum + s.total_hours, 0)

        days.push({
          date: dateStr,
          hours: totalHours,
          hasSession: daySessions.length > 0,
          sessionId: daySessions[0]?.id,
        })
      }

      setCalendarData(days)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    }
  }

  const getHeatmapColor = (hours: number, isSelected: boolean, isToday: boolean) => {
    if (isToday && hours === 0) return `${colors.accent}20`
    if (isToday && hours > 0) return colors.accent
    if (isSelected) return colors.accent
    if (hours === 0) return 'transparent'
    if (hours < 4) return `${colors.accent}30`
    if (hours < 6) return `${colors.accent}60`
    if (hours < 8) return `${colors.accent}90`
    return colors.accent
  }

  const handleDatePress = (day: DayData) => {
    if (!day.hasSession || !day.sessionId) return
    setSelectedDate(day.date)
    router.push(`/(app)/(logs)/${day.sessionId}`)
  }

  const isToday = (dateStr: string) => {
    if (!dateStr) return false
    const today = dateUtils.formatPH(new Date(), 'yyyy-MM-dd')
    return dateStr === today
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const totalHours = sessions.reduce((sum, s) => sum + s.total_hours, 0)
  const daysWorked = sessions.filter(s => s.total_hours > 0).length

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
        <ThemedText weight="bold" style={{ fontSize: 30, marginBottom: 8 }}>
          Calendar View 📅
        </ThemedText>
        <ThemedText variant="secondary" style={{ fontSize: 16, marginBottom: 32 }}>
          Visual overview of your work days
        </ThemedText>

        {/* Month Selector */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Button variant="outline" size="sm" onPress={() => changeMonth('prev')}>
            ← Prev
          </Button>
          <ThemedText weight="semibold" style={{ fontSize: 20 }}>
            {dateUtils.formatPH(currentMonth, 'MMMM yyyy')}
          </ThemedText>
          <Button variant="outline" size="sm" onPress={() => changeMonth('next')}>
            Next →
          </Button>
        </View>

        {/* Stats for Month */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          <ThemedCard style={{ flex: 1 }}>
            <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              Total Hours
            </ThemedText>
            <ThemedText weight="bold" style={{ fontSize: 24 }}>
              {totalHours.toFixed(1)}h
            </ThemedText>
          </ThemedCard>

          <ThemedCard style={{ flex: 1 }}>
            <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              Days Worked
            </ThemedText>
            <ThemedText weight="bold" style={{ fontSize: 24 }}>
              {daysWorked}
            </ThemedText>
          </ThemedCard>
        </View>

        {/* Calendar Heatmap */}
        <ThemedCard style={{ marginBottom: 32 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
            Activity Heatmap
          </ThemedText>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {calendarData.map((day, index) => {
              const dayIsToday = isToday(day.date)
              const dayIsSelected = selectedDate === day.date
              
              return (
                <TouchableOpacity
                  key={day.date || `empty-${index}`}
                  disabled={!day.hasSession || !day.date}
                  onPress={() => handleDatePress(day)}
                  activeOpacity={0.7}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: getHeatmapColor(day.hours, dayIsSelected, dayIsToday),
                    borderWidth: dayIsToday ? 2.5 : 0,
                    borderColor: colors.accent,
                    opacity: day.date && day.hasSession ? 1 : 0.3,
                  }}
                >
                  {day.date && (
                    <>
                      <ThemedText style={{ fontSize: 12 }}>
                        {new Date(day.date).getDate()}
                      </ThemedText>
                      {day.hasSession && (
                        <ThemedText weight="bold" style={{ fontSize: 10 }}>
                          {day.hours.toFixed(0)}h
                        </ThemedText>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <ThemedText variant="muted" style={{ fontSize: 12 }}>Less</ThemedText>
            {[0, 2, 5, 8, 10].map(hours => (
              <View
                key={hours}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  backgroundColor: getHeatmapColor(hours, false, false),
                }}
              />
            ))}
            <ThemedText variant="muted" style={{ fontSize: 12 }}>More</ThemedText>
          </View>
        </ThemedCard>
      </ScrollView>
    </ThemedView>
  )
}