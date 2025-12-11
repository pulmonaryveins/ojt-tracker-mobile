import { useState, useEffect } from 'react'
import { View, ScrollView } from 'react-native'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/auth.store'
import { SessionService } from '../../../services/session.service'
import { Session } from '../../../types/models'
import { dateUtils } from '../../../utils/timezone'
import { useTheme } from '../../../hooks/useTheme'

interface DayData {
  date: string
  hours: number
  hasSession: boolean
}

export default function CalendarScreen() {
  const user = useAuthStore((state) => state.user)
  const { accentColor } = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<DayData[]>([])
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    loadMonthData()
  }, [currentMonth, user?.id])

  const loadMonthData = async () => {
    if (!user?.id) return

    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    try {
      const data = await SessionService.getSessionsByDateRange(user.id, startDate, endDate)
      setSessions(data)

      // Generate calendar data
      const days: DayData[] = []
      const daysInMonth = endDate.getDate()

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
        const dateStr = dateUtils.formatPH(date, 'yyyy-MM-dd')
        const daySessions = data.filter(s => s.date === dateStr)
        const totalHours = daySessions.reduce((sum, s) => sum + s.total_hours, 0)

        days.push({
          date: dateStr,
          hours: totalHours,
          hasSession: daySessions.length > 0,
        })
      }

      setCalendarData(days)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    }
  }

  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return '#2f3136'
    if (hours < 4) return `${accentColor}33`
    if (hours < 6) return `${accentColor}66`
    if (hours < 8) return `${accentColor}99`
    return accentColor
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
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {calendarData.map((day) => (
              <View
                key={day.date}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: getHeatmapColor(day.hours),
                }}
              >
                <ThemedText style={{ fontSize: 12 }}>
                  {new Date(day.date).getDate()}
                </ThemedText>
                {day.hasSession && (
                  <ThemedText weight="bold" style={{ fontSize: 10 }}>
                    {day.hours.toFixed(0)}h
                  </ThemedText>
                )}
              </View>
            ))}
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
                  backgroundColor: getHeatmapColor(hours),
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