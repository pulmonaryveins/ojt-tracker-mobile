import { useState, useEffect } from 'react'
import { View, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { ThemedCard } from '../../components/themed/ThemedCard'
import { Button } from '../../components/ui/Button'
import { DateTimePicker } from '../../components/ui/DateTimePicker'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../stores/auth.store'
import { SessionService } from '../../services/session.service'
import { useTheme } from '../../hooks/useTheme'

interface ManualBreak {
  id: string
  startTime: string
  endTime: string
}

export default function ManualEntryModal() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  const params = useLocalSearchParams()
  
  const [date, setDate] = useState(new Date().toISOString())
  const [timeIn, setTimeIn] = useState('')
  const [timeOut, setTimeOut] = useState('')
  const [description, setDescription] = useState('')
  const [breaks, setBreaks] = useState<ManualBreak[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const format12Hour = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatTime24 = (time: string): string => {
    // Convert time picker value to HH:MM:SS format
    const date = new Date(time)
    return date.toTimeString().split(' ')[0]
  }

  const parseTimeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const addBreak = () => {
    setBreaks([
      ...breaks,
      {
        id: `break_${Date.now()}`,
        startTime: '',
        endTime: '',
      },
    ])
  }

  const removeBreak = (id: string) => {
    setBreaks(breaks.filter(b => b.id !== id))
  }

  const updateBreak = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const validateManualEntry = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Check required fields
    if (!date) {
      newErrors.date = 'Date is required'
    }
    if (!timeIn) {
      newErrors.timeIn = 'Time In is required'
    }
    if (!timeOut) {
      newErrors.timeOut = 'Time Out is required'
    }

    // If basic fields are missing, return early
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }

    // Extract date directly from ISO string to avoid timezone conversion issues
    const sessionDate = date.split('T')[0]
    const timeInFormatted = formatTime24(timeIn)
    const timeOutFormatted = formatTime24(timeOut)

    const startTime = new Date(`${sessionDate}T${timeInFormatted}`)
    const endTime = new Date(`${sessionDate}T${timeOutFormatted}`)

    // Check if Time Out is after Time In
    if (endTime <= startTime) {
      newErrors.timeOut = 'Time Out must be after Time In'
    }

    // Calculate minimum session duration (15 minutes)
    const sessionDurationMs = endTime.getTime() - startTime.getTime()
    const sessionDurationMinutes = Math.floor(sessionDurationMs / (1000 * 60))
    
    // Validate breaks
    let totalBreakMinutes = 0
    breaks.forEach((breakItem, index) => {
      if (!breakItem.startTime) {
        newErrors[`break_${index}_start`] = 'Break start time is required'
      }
      if (!breakItem.endTime) {
        newErrors[`break_${index}_end`] = 'Break end time is required'
      }

      if (breakItem.startTime && breakItem.endTime) {
        const breakStart = new Date(`${sessionDate}T${formatTime24(breakItem.startTime)}`)
        const breakEnd = new Date(`${sessionDate}T${formatTime24(breakItem.endTime)}`)

        // Check if break is within session time
        if (breakStart < startTime) {
          newErrors[`break_${index}_start`] = 'Break cannot start before Time In'
        }
        if (breakEnd > endTime) {
          newErrors[`break_${index}_end`] = 'Break cannot end after Time Out'
        }

        // Check if break end is after break start
        if (breakEnd <= breakStart) {
          newErrors[`break_${index}_end`] = 'Break end must be after break start'
        }

        // Check minimum break duration (1 minute)
        const breakDurationMs = breakEnd.getTime() - breakStart.getTime()
        const breakDurationMinutes = Math.floor(breakDurationMs / (1000 * 60))
        if (breakDurationMinutes < 1) {
          newErrors[`break_${index}_end`] = 'Break must be at least 1 minute'
        }

        // Check maximum break duration (2 hours)
        if (breakDurationMinutes > 120) {
          newErrors[`break_${index}_end`] = 'Break cannot exceed 2 hours'
        }

        totalBreakMinutes += breakDurationMinutes
      }
    })

    // Check if work time (after breaks) meets minimum requirement (15 minutes)
    const workMinutes = sessionDurationMinutes - totalBreakMinutes
    if (workMinutes < 15) {
      newErrors.timeOut = 'Work time must be at least 15 minutes (excluding breaks)'
    }

    // Check for overlapping breaks
    for (let i = 0; i < breaks.length; i++) {
      if (!breaks[i].startTime || !breaks[i].endTime) continue
      
      const break1Start = new Date(`${sessionDate}T${formatTime24(breaks[i].startTime)}`)
      const break1End = new Date(`${sessionDate}T${formatTime24(breaks[i].endTime)}`)

      for (let j = i + 1; j < breaks.length; j++) {
        if (!breaks[j].startTime || !breaks[j].endTime) continue
        
        const break2Start = new Date(`${sessionDate}T${formatTime24(breaks[j].startTime)}`)
        const break2End = new Date(`${sessionDate}T${formatTime24(breaks[j].endTime)}`)

        // Check for overlap
        if (
          (break1Start < break2End && break1End > break2Start) ||
          (break2Start < break1End && break2End > break1Start)
        ) {
          newErrors[`break_${j}_start`] = 'Breaks cannot overlap'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateManualEntry()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving')
      return
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }

    setShowConfirmModal(true)
  }

  const confirmSave = async () => {
    setShowConfirmModal(false)
    
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.')
      return
    }

    try {
      setLoading(true)

      // Extract date directly from ISO string to avoid timezone conversion issues
      const sessionDate = date.split('T')[0]
      const timeInFormatted = formatTime24(timeIn)
      const timeOutFormatted = formatTime24(timeOut)

      const startTime = new Date(`${sessionDate}T${timeInFormatted}`)
      const endTime = new Date(`${sessionDate}T${timeOutFormatted}`)

      // Calculate total duration in seconds
      const totalDurationSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      )

      // Calculate total break time
      // Note: breaks are only used for calculation, not stored in database
      let totalBreakSeconds = 0
      const breakRecords: Array<{ start: string; end: string | null }> = []

      breaks.forEach(breakItem => {
        if (breakItem.startTime && breakItem.endTime) {
          const breakStart = new Date(`${sessionDate}T${formatTime24(breakItem.startTime)}`)
          const breakEnd = new Date(`${sessionDate}T${formatTime24(breakItem.endTime)}`)
          const breakDurationSeconds = Math.floor(
            (breakEnd.getTime() - breakStart.getTime()) / 1000
          )
          totalBreakSeconds += breakDurationSeconds
          breakRecords.push({
            start: formatTime24(breakItem.startTime),
            end: formatTime24(breakItem.endTime),
          })
        }
      })

      // Calculate work duration
      const workDurationSeconds = totalDurationSeconds - totalBreakSeconds
      const totalHours = parseFloat((workDurationSeconds / 3600).toFixed(2))

      console.log('📝 Creating manual session entry...')
      console.log('Date:', sessionDate)
      console.log('Time In:', timeInFormatted)
      console.log('Time Out:', timeOutFormatted)
      console.log('Work Duration:', workDurationSeconds, 'seconds')
      console.log('Total Hours:', totalHours)
      console.log('Breaks:', breakRecords.length)

      // Create the session with manual entry
      const sessionId = await SessionService.createManualSession(
        user.id,
        sessionDate,
        timeInFormatted,
        timeOutFormatted,
        totalHours,
        description.trim() || null,
        breakRecords.length > 0 ? breakRecords : null
      )

      console.log('✅ Manual session created:', sessionId)

      // Close the modal and redirect to Activity Logs
      setLoading(false)
      
      Alert.alert(
        'Success! 🎉',
        `Manual time entry saved successfully.\n\nDate: ${sessionDate}\nHours: ${totalHours.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.dismiss()
              router.push('/(app)/(logs)')
            },
          },
        ],
        { cancelable: false }
      )
      return
    } catch (error: any) {
      console.error('❌ Error creating manual entry:', error)
      Alert.alert('Error', error.message || 'Failed to save manual entry')
      setLoading(false)
    }
  }

  const calculateTotalHours = (): string => {
    if (!timeIn || !timeOut) return '0.00'

    try {
      // Extract date directly from ISO string to avoid timezone conversion issues
      const sessionDate = date.split('T')[0]
      const timeInFormatted = formatTime24(timeIn)
      const timeOutFormatted = formatTime24(timeOut)

      const startTime = new Date(`${sessionDate}T${timeInFormatted}`)
      const endTime = new Date(`${sessionDate}T${timeOutFormatted}`)

      if (endTime <= startTime) return '0.00'

      let totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      // Subtract break time
      breaks.forEach(breakItem => {
        if (breakItem.startTime && breakItem.endTime) {
          const breakStart = new Date(`${sessionDate}T${formatTime24(breakItem.startTime)}`)
          const breakEnd = new Date(`${sessionDate}T${formatTime24(breakItem.endTime)}`)
          const breakSeconds = Math.floor((breakEnd.getTime() - breakStart.getTime()) / 1000)
          totalSeconds -= breakSeconds
        }
      })

      const hours = Math.max(0, totalSeconds / 3600)
      return hours.toFixed(2)
    } catch (error) {
      return '0.00'
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/(app)/(logs)')
              }
            }}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText weight="bold" style={{ fontSize: 28 }}>
              Manual Time Entry
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 14, marginTop: 4 }}>
              Enter your time manually for days you forgot to clock in/out
            </ThemedText>
          </View>
        </View>

        {/* Info Card */}
        <ThemedCard style={{ padding: 16, marginBottom: 24, backgroundColor: colors.accent + '10' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={24} color={colors.accent} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <ThemedText weight="semibold" style={{ fontSize: 14, marginBottom: 4 }}>
                Manual Entry Information
              </ThemedText>
              <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                Use this feature only when you forget to clock in/out. All entries must be at least 15 minutes (excluding breaks) and follow OJT time tracking rules.
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Date Picker */}
        <DateTimePicker
          label="Date *"
          value={date}
          onChange={setDate}
          error={errors.date}
          mode="date"
          maximumDate={new Date().toISOString()}
          placeholder="Select date"
        />

        {/* Time In */}
        <DateTimePicker
          label="Time In *"
          value={timeIn}
          onChange={setTimeIn}
          error={errors.timeIn}
          mode="time"
          placeholder="Select time in"
        />

        {/* Time Out */}
        <DateTimePicker
          label="Time Out *"
          value={timeOut}
          onChange={setTimeOut}
          error={errors.timeOut}
          mode="time"
          placeholder="Select time out"
        />

        {/* Description */}
        <View style={{ marginBottom: 16 }}>
          <ThemedText weight="medium" style={{ fontSize: 14, marginBottom: 8 }}>
            Task Description
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
            placeholder="What did you work on?"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Breaks Section */}
        <ThemedCard style={{ padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <ThemedText weight="bold" style={{ fontSize: 16 }}>
              Break Periods
            </ThemedText>
            <Button
              variant="outline"
              onPress={addBreak}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add" size={18} color={colors.accent} style={{ marginRight: 4 }} />
                <ThemedText weight="semibold" style={{ color: colors.accent, fontSize: 14 }}>
                  Add Break
                </ThemedText>
              </View>
            </Button>
          </View>

          {breaks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="cafe-outline" size={48} color={colors.textSecondary} />
              <ThemedText variant="secondary" style={{ fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                No breaks added yet.{'\n'}Tap "Add Break" to include break periods.
              </ThemedText>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {breaks.map((breakItem, index) => (
                <View
                  key={breakItem.id}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <ThemedText weight="semibold" style={{ fontSize: 14 }}>
                      Break {index + 1}
                    </ThemedText>
                    <TouchableOpacity onPress={() => removeBreak(breakItem.id)}>
                      <Ionicons name="trash-outline" size={20} color="#ed4245" />
                    </TouchableOpacity>
                  </View>

                  <DateTimePicker
                    label="Break Start"
                    value={breakItem.startTime}
                    onChange={(value) => updateBreak(breakItem.id, 'startTime', value)}
                    error={errors[`break_${index}_start`]}
                    mode="time"
                    placeholder="Select break start time"
                  />

                  <DateTimePicker
                    label="Break End"
                    value={breakItem.endTime}
                    onChange={(value) => updateBreak(breakItem.id, 'endTime', value)}
                    error={errors[`break_${index}_end`]}
                    mode="time"
                    placeholder="Select break end time"
                  />
                </View>
              ))}
            </View>
          )}
        </ThemedCard>

        {/* Calculated Total Hours */}
        <ThemedCard style={{ padding: 20, marginBottom: 24, backgroundColor: colors.accent + '15' }}>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
              Calculated Total Hours
            </ThemedText>
            <ThemedText weight="bold" style={{ fontSize: 48, color: colors.accent }}>
              {calculateTotalHours()}
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 14 }}>
              hours (excluding breaks)
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 32 }}>
          <Button
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText weight="bold" style={{ color: '#fff', fontSize: 16 }}>
                Save Manual Entry
              </ThemedText>
            </View>
          </Button>

          <Button
            variant="outline"
            onPress={() => {
              if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/(app)/(logs)')
              }
            }}
            disabled={loading}
          >
            <ThemedText weight="bold" style={{ fontSize: 16 }}>
              Cancel
            </ThemedText>
          </Button>
        </View>

        {/* Instructions */}
        <ThemedCard style={{ padding: 20, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Ionicons name="help-circle" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <ThemedText weight="semibold" style={{ fontSize: 14 }}>
              Requirements
            </ThemedText>
          </View>
          <View style={{ gap: 8, paddingLeft: 28 }}>
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>
              • Minimum work time: 15 minutes (excluding breaks)
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>
              • Break duration: 1 minute to 2 hours per break
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>
              • Breaks must be within session time
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>
              • Breaks cannot overlap
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 12 }}>
              • You'll be asked to fill out a Daily Work Log after saving
            </ThemedText>
          </View>
        </ThemedCard>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Manual Entry"
        type="info"
        message={`Are you sure you want to save this manual time entry?\n\nDate: ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\nTime In: ${timeIn ? new Date(timeIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}\nTime Out: ${timeOut ? new Date(timeOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}\nBreaks: ${breaks.filter(b => b.startTime && b.endTime).length}\nTotal Hours: ${calculateTotalHours()}h\n\nThis will be recorded as a completed session.`}
        actions={[
          {
            text: 'Cancel',
            onPress: () => setShowConfirmModal(false),
            variant: 'outline',
          },
          {
            text: 'Save Entry',
            onPress: confirmSave,
            variant: 'primary',
          },
        ]}
      />
    </ThemedView>
  )
}
