import { useState } from 'react'
import { View, TouchableOpacity, Modal, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from '../themed/ThemedText'
import { ThemedCard } from '../themed/ThemedCard'
import { Button } from './Button'
import { useTheme } from '../../hooks/useTheme'

interface DateTimePickerProps {
  label?: string
  value: string | null
  onChange: (date: string) => void
  error?: string
  placeholder?: string
  mode?: 'date' | 'time' | 'datetime'
  minimumDate?: string
  maximumDate?: string
  disabled?: boolean
}

export function DateTimePicker({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
  mode = 'date',
  minimumDate,
  maximumDate,
  disabled = false,
}: DateTimePickerProps) {
  const { colors } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date()
  )
  const [isPM, setIsPM] = useState(false)
  const [hourInput, setHourInput] = useState('')
  const [minuteInput, setMinuteInput] = useState('')

  const formatDisplay = (dateString: string | null) => {
    if (!dateString) return placeholder

    const date = new Date(dateString)
    
    if (mode === 'time') {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleConfirm = () => {
    console.log(`${mode} confirmed:`, tempDate.toISOString())
    setIsVisible(false)
    onChange(tempDate.toISOString())
  }

  const handleCancel = () => {
    setIsVisible(false)
    setTempDate(value ? new Date(value) : new Date())
  }

  const handleOpen = () => {
    const date = value ? new Date(value) : new Date()
    setTempDate(date)
    if (mode === 'time') {
      setIsPM(date.getHours() >= 12)
      setHourInput(String(date.getHours() % 12 || 12))
      setMinuteInput(String(date.getMinutes()).padStart(2, '0'))
    }
    setIsVisible(true)
  }

  const adjustDate = (field: 'year' | 'month' | 'day' | 'hour' | 'minute', increment: number) => {
    const newDate = new Date(tempDate)
    
    if (field === 'year') {
      newDate.setFullYear(newDate.getFullYear() + increment)
    } else if (field === 'month') {
      newDate.setMonth(newDate.getMonth() + increment)
    } else if (field === 'day') {
      newDate.setDate(newDate.getDate() + increment)
    } else if (field === 'hour') {
      let currentHour = newDate.getHours()
      let hour12 = currentHour % 12 || 12
      hour12 += increment
      
      if (hour12 > 12) hour12 = 1
      if (hour12 < 1) hour12 = 12
      
      const newHour24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12)
      newDate.setHours(newHour24)
    } else if (field === 'minute') {
      newDate.setMinutes(newDate.getMinutes() + increment)
    }

    if (minimumDate && newDate < new Date(minimumDate)) return
    if (maximumDate && newDate > new Date(maximumDate)) return

    setTempDate(newDate)
  }

  const toggleAMPM = () => {
    const newDate = new Date(tempDate)
    const currentHour = newDate.getHours()
    
    if (isPM) {
      // Switching to AM
      newDate.setHours(currentHour - 12)
      setIsPM(false)
    } else {
      // Switching to PM
      newDate.setHours(currentHour + 12)
      setIsPM(true)
    }
    
    setTempDate(newDate)
  }

  const get12Hour = () => {
    const hour = tempDate.getHours()
    const hour12 = hour % 12 || 12
    return hour12
  }

  const handleHourInput = (text: string) => {
    const num = parseInt(text, 10)
    if (text === '' || (num >= 1 && num <= 12)) {
      setHourInput(text)
      if (num >= 1 && num <= 12) {
        const newDate = new Date(tempDate)
        const newHour24 = isPM ? (num === 12 ? 12 : num + 12) : (num === 12 ? 0 : num)
        newDate.setHours(newHour24)
        setTempDate(newDate)
      }
    }
  }

  const handleMinuteInput = (text: string) => {
    const num = parseInt(text, 10)
    if (text === '' || (num >= 0 && num <= 59)) {
      setMinuteInput(text)
      if (num >= 0 && num <= 59) {
        const newDate = new Date(tempDate)
        newDate.setMinutes(num)
        setTempDate(newDate)
      }
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <ThemedText
          weight="medium"
          style={{
            fontSize: 14,
            marginBottom: 8,
            color: error ? '#ed4245' : colors.text,
          }}
        >
          {label}
        </ThemedText>
      )}

      <TouchableOpacity
        onPress={handleOpen}
        disabled={disabled}
        style={{
          backgroundColor: disabled ? '#36393f' : colors.background,
          borderWidth: 1,
          borderColor: error ? '#ed4245' : colors.border,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
          opacity: disabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons 
            name={mode === 'time' ? 'time-outline' : 'calendar-outline'} 
            size={20} 
            color={value ? colors.accent : colors.textSecondary} 
            style={{ marginRight: 10 }}
          />
          <ThemedText
            style={{
              fontSize: 16,
              color: value ? colors.text : colors.textSecondary,
            }}
          >
            {formatDisplay(value)}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Ionicons name="alert-circle" size={14} color="#ed4245" style={{ marginRight: 4 }} />
          <ThemedText
            style={{
              fontSize: 12,
              color: '#ed4245',
            }}
          >
            {error}
          </ThemedText>
        </View>
      )}

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <ThemedCard style={{ width: '100%', maxWidth: 420, padding: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: colors.accent + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons 
                  name={mode === 'time' ? 'time' : 'calendar'} 
                  size={24} 
                  color={colors.accent} 
                />
              </View>
              <ThemedText weight="bold" style={{ fontSize: 20, flex: 1 }}>
                {mode === 'time' ? 'Select Time' : 'Select Date'}
              </ThemedText>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              {mode === 'time' ? (
                <>
                  {/* Hour */}
                  <View style={{ marginBottom: 20 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                      HOUR
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <TouchableOpacity
                        onPress={() => adjustDate('hour', -1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-down" size={24} color={colors.accent} />
                      </TouchableOpacity>
                      <TextInput
                        value={hourInput}
                        onChangeText={handleHourInput}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          minWidth: 100,
                          paddingVertical: 16,
                          paddingHorizontal: 24,
                          backgroundColor: colors.background,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: colors.accent,
                          color: colors.text,
                          fontFamily: 'System',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          fontSize: 32,
                        }}
                        placeholder="12"
                        placeholderTextColor={colors.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => adjustDate('hour', 1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-up" size={24} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Minute */}
                  <View style={{ marginBottom: 20 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                      MINUTE
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <TouchableOpacity
                        onPress={() => adjustDate('minute', -1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-down" size={24} color={colors.accent} />
                      </TouchableOpacity>
                      <TextInput
                        value={minuteInput}
                        onChangeText={handleMinuteInput}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                          minWidth: 100,
                          paddingVertical: 16,
                          paddingHorizontal: 24,
                          backgroundColor: colors.background,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: colors.accent,
                          color: colors.text,
                          fontFamily: 'System',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          fontSize: 32,
                        }}
                        placeholder="00"
                        placeholderTextColor={colors.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => adjustDate('minute', 1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-up" size={24} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* AM/PM Toggle */}
                  <View style={{ marginBottom: 20 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                      PERIOD
                    </ThemedText>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (isPM) toggleAMPM();
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          backgroundColor: !isPM ? colors.accent : colors.secondary,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: !isPM ? colors.accent : colors.border,
                        }}
                      >
                        <ThemedText 
                          weight="bold" 
                          style={{ 
                            textAlign: 'center', 
                            fontSize: 18,
                            color: !isPM ? '#ffffff' : colors.text
                          }}
                        >
                          AM
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          if (!isPM) toggleAMPM();
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          backgroundColor: isPM ? colors.accent : colors.secondary,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isPM ? colors.accent : colors.border,
                        }}
                      >
                        <ThemedText 
                          weight="bold" 
                          style={{ 
                            textAlign: 'center', 
                            fontSize: 18,
                            color: isPM ? '#ffffff' : colors.text
                          }}
                        >
                          PM
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Year */}
                  <View style={{ marginBottom: 20 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                      YEAR
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <TouchableOpacity
                        onPress={() => adjustDate('year', -1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-down" size={24} color={colors.accent} />
                      </TouchableOpacity>
                      <View style={{
                        minWidth: 120,
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.accent,
                      }}>
                        <ThemedText weight="bold" style={{ textAlign: 'center', fontSize: 32 }}>
                          {tempDate.getFullYear()}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => adjustDate('year', 1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-up" size={24} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Month */}
                  <View style={{ marginBottom: 20 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                      MONTH
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <TouchableOpacity
                        onPress={() => adjustDate('month', -1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-down" size={24} color={colors.accent} />
                      </TouchableOpacity>
                      <View style={{
                        minWidth: 120,
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.accent,
                      }}>
                        <ThemedText weight="bold" style={{ textAlign: 'center', fontSize: 24 }}>
                          {tempDate.toLocaleString('en-US', { month: 'long' })}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => adjustDate('month', 1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-up" size={24} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Day */}
                  <View style={{ marginBottom: 20 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                      DAY
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <TouchableOpacity
                        onPress={() => adjustDate('day', -1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-down" size={24} color={colors.accent} />
                      </TouchableOpacity>
                      <View style={{
                        minWidth: 100,
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: colors.accent,
                      }}>
                        <ThemedText weight="bold" style={{ textAlign: 'center', fontSize: 32 }}>
                          {String(tempDate.getDate()).padStart(2, '0')}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => adjustDate('day', 1)}
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: colors.accent + '15',
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="chevron-up" size={24} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Preview */}
            <View 
              style={{ 
                marginBottom: 24, 
                padding: 20, 
                backgroundColor: colors.accent + '10',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.accent + '30',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons 
                  name={mode === 'time' ? 'checkmark-circle-outline' : 'calendar-outline'} 
                  size={20} 
                  color={colors.accent} 
                  style={{ marginRight: 8 }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                  SELECTED
                </ThemedText>
              </View>
              <ThemedText weight="bold" style={{ textAlign: 'center', fontSize: 18, color: colors.accent }}>
                {mode === 'time'
                  ? tempDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : tempDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
              </ThemedText>
            </View>

            <View style={{ gap: 12 }}>
              <Button onPress={handleConfirm}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <ThemedText weight="bold" style={{ color: '#ffffff' }}>
                    {mode === 'time' ? 'Confirm Time' : 'Confirm Date'}
                  </ThemedText>
                </View>
              </Button>
              <Button variant="outline" onPress={handleCancel}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={20} color={colors.text} style={{ marginRight: 8 }} />
                  <ThemedText weight="bold">Cancel</ThemedText>
                </View>
              </Button>
            </View>
          </ThemedCard>
        </View>
      </Modal>
    </View>
  )
}