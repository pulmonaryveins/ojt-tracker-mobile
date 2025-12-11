import { useState } from 'react'
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native'
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return placeholder

    const date = new Date(dateString)
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleConfirm = () => {
    console.log('✅ Date confirmed:', tempDate.toISOString())
    setIsVisible(false)
    onChange(tempDate.toISOString())
  }

  const handleCancel = () => {
    setIsVisible(false)
    setTempDate(value ? new Date(value) : new Date())
  }

  const adjustDate = (field: 'year' | 'month' | 'day', increment: number) => {
    const newDate = new Date(tempDate)
    
    if (field === 'year') {
      newDate.setFullYear(newDate.getFullYear() + increment)
    } else if (field === 'month') {
      newDate.setMonth(newDate.getMonth() + increment)
    } else if (field === 'day') {
      newDate.setDate(newDate.getDate() + increment)
    }

    if (minimumDate && newDate < new Date(minimumDate)) return
    if (maximumDate && newDate > new Date(maximumDate)) return

    setTempDate(newDate)
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
        onPress={() => {
          console.log('📅 Opening date picker...')
          !disabled && setIsVisible(true)
        }}
        disabled={disabled}
        style={{
          backgroundColor: disabled ? '#36393f' : colors.background,
          borderWidth: 1,
          borderColor: error ? '#ed4245' : colors.border,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <ThemedText
          style={{
            fontSize: 16,
            color: value ? colors.text : colors.textSecondary,
          }}
        >
          {formatDate(value)}
        </ThemedText>
      </TouchableOpacity>

      {error && (
        <ThemedText
          style={{
            fontSize: 12,
            color: '#ed4245',
            marginTop: 4,
          }}
        >
          {error}
        </ThemedText>
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
          <ThemedCard style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <ThemedText weight="bold" style={{ fontSize: 20, marginBottom: 24, textAlign: 'center' }}>
              📅 Select Date
            </ThemedText>

            <View style={{ marginBottom: 24 }}>
              {/* Year */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
                <ThemedText style={{ width: 80 }}>Year:</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => adjustDate('year', -1)}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#36393f',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText weight="bold" style={{ fontSize: 20 }}>−</ThemedText>
                  </TouchableOpacity>
                  <ThemedText weight="bold" style={{ width: 80, textAlign: 'center', fontSize: 18 }}>
                    {tempDate.getFullYear()}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => adjustDate('year', 1)}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#36393f',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText weight="bold" style={{ fontSize: 20 }}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
                <ThemedText style={{ width: 80 }}>Month:</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => adjustDate('month', -1)}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#36393f',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText weight="bold" style={{ fontSize: 20 }}>−</ThemedText>
                  </TouchableOpacity>
                  <ThemedText weight="bold" style={{ width: 80, textAlign: 'center', fontSize: 18 }}>
                    {tempDate.toLocaleString('en-US', { month: 'short' })}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => adjustDate('month', 1)}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#36393f',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText weight="bold" style={{ fontSize: 20 }}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ThemedText style={{ width: 80 }}>Day:</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => adjustDate('day', -1)}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#36393f',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText weight="bold" style={{ fontSize: 20 }}>−</ThemedText>
                  </TouchableOpacity>
                  <ThemedText weight="bold" style={{ width: 80, textAlign: 'center', fontSize: 18 }}>
                    {tempDate.getDate()}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => adjustDate('day', 1)}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#36393f',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText weight="bold" style={{ fontSize: 20 }}>+</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Preview */}
            <View style={{ marginBottom: 24, padding: 16, backgroundColor: '#36393f', borderRadius: 8 }}>
              <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
                Selected:
              </ThemedText>
              <ThemedText weight="bold" style={{ textAlign: 'center', fontSize: 16 }}>
                {tempDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>

            <View style={{ gap: 12 }}>
              <Button onPress={handleConfirm}>Confirm Date</Button>
              <Button variant="outline" onPress={handleCancel}>Cancel</Button>
            </View>
          </ThemedCard>
        </View>
      </Modal>
    </View>
  )
}