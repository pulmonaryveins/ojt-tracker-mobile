import { useEffect, useState } from 'react'
import { View, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { DateTimePicker } from '../../../components/ui/DateTimePicker'
import { SessionService } from '../../../services/session.service'
import { PDFExportService } from '../../../services/pdf-export.service'
import { useTheme } from '../../../hooks/useTheme'
import { dateUtils } from '../../../utils/timezone'
import type { Session, Break } from '../../../types/models'

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit form state
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBreaks, setEditBreaks] = useState<Break[]>([])

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

  useEffect(() => {
    loadSession()
  }, [id])

  useEffect(() => {
    if (session && isEditing) {
      setEditStartTime(session.start_time)
      setEditEndTime(session.end_time || '')
      setEditDescription(session.description || '')
      // Breaks are not stored in database, start with empty array
      setEditBreaks([])
    }
  }, [isEditing, session])

  const loadSession = async () => {
    if (!id) return

    setLoading(true)
    try {
      const data = await SessionService.getSessionById(id) as any
      // Transform database row to Session model
      // Note: breaks are not stored in database, set to null
      const sessionData: Session = {
        ...data,
        breaks: null,
      }
      setSession(sessionData)
    } catch (error) {
      Alert.alert('Error', 'Failed to load session')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!session || !editStartTime) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      // Calculate duration and total hours
      let duration = 0
      let totalHours = 0
      
      if (editEndTime) {
        const start = new Date(`2000-01-01T${editStartTime}`)
        const end = new Date(`2000-01-01T${editEndTime}`)
        duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
        
        // Calculate break duration
        let breakDuration = 0
        editBreaks.forEach(br => {
          if (br.end) {
            const breakStart = new Date(`2000-01-01T${br.start}`)
            const breakEnd = new Date(`2000-01-01T${br.end}`)
            breakDuration += (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60)
          }
        })
        
        totalHours = (duration - breakDuration) / 60
      }

      // Update session (breaks are not stored in database, only used for calculation)
      await SessionService.updateSession(session.id, {
        start_time: editStartTime,
        end_time: editEndTime || null,
        duration,
        total_hours: totalHours,
        description: editDescription || null,
      })

      Alert.alert('Success', 'Session updated successfully')
      setIsEditing(false)
      loadSession()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update session: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddBreak = () => {
    setEditBreaks([...editBreaks, { start: '12:00', end: '12:30' }])
  }

  const handleRemoveBreak = (index: number) => {
    setEditBreaks(editBreaks.filter((_, i) => i !== index))
  }

  const handleUpdateBreak = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...editBreaks]
    updated[index] = { ...updated[index], [field]: value }
    setEditBreaks(updated)
  }

  const handleExport = async () => {
    if (!session) return

    setExporting(true)
    try {
      await PDFExportService.exportSession(session)
      Alert.alert('Success', 'Report exported successfully!')
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SessionService.deleteSession(id!)
              Alert.alert('Success', 'Session deleted')
              router.back()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete session')
            }
          },
        },
      ]
    )
  }

  if (loading || !session) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-6 py-8">
        <View className="flex-row justify-between items-center mb-2">
          <ThemedText weight="bold" className="text-3xl">
            Session Details
          </ThemedText>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
        
        <ThemedText variant="secondary" className="text-base mb-8">
          {dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}
        </ThemedText>

        {isEditing ? (
          // Edit Mode
          <>
            {/* Time Info Edit */}
            <ThemedCard className="mb-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="time-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <ThemedText variant="secondary" className="text-sm">
                  Time Information
                </ThemedText>
              </View>
              
              <View className="mb-4">
                <ThemedText className="mb-2">Start Time:</ThemedText>
                <TextInput
                  value={editStartTime}
                  onChangeText={setEditStartTime}
                  placeholder="HH:MM (24-hour)"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                  }}
                />
              </View>

              <View className="mb-4">
                <ThemedText className="mb-2">End Time:</ThemedText>
                <TextInput
                  value={editEndTime}
                  onChangeText={setEditEndTime}
                  placeholder="HH:MM (24-hour)"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 16,
                  }}
                />
              </View>
            </ThemedCard>

            {/* Breaks Edit */}
            <ThemedCard className="mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="cafe-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" className="text-sm">
                    Breaks ({editBreaks.length})
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleAddBreak}>
                  <Ionicons name="add-circle" size={24} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {editBreaks.map((breakItem, index) => (
                <View key={index} className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                  <View className="flex-row justify-between items-center mb-2">
                    <ThemedText weight="medium">Break {index + 1}</ThemedText>
                    <TouchableOpacity onPress={() => handleRemoveBreak(index)}>
                      <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <ThemedText variant="secondary" className="text-xs mb-1">Start</ThemedText>
                      <TextInput
                        value={breakItem.start}
                        onChangeText={(value) => handleUpdateBreak(index, 'start', value)}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                          padding: 8,
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                      />
                    </View>
                    <View className="flex-1">
                      <ThemedText variant="secondary" className="text-xs mb-1">End</ThemedText>
                      <TextInput
                        value={breakItem.end || ''}
                        onChangeText={(value) => handleUpdateBreak(index, 'end', value)}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                          padding: 8,
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ThemedCard>

            {/* Description Edit */}
            <ThemedCard className="mb-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="document-text-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <ThemedText variant="secondary" className="text-sm">
                  Description
                </ThemedText>
              </View>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What did you work on today?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.text,
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 16,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
              />
            </ThemedCard>

            {/* Edit Actions */}
            <View className="space-y-3 mt-4 mb-8">
              <Button onPress={handleSave} loading={saving} disabled={saving}>
                Save Changes
              </Button>
              <Button variant="outline" onPress={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </View>
          </>
        ) : (
          // View Mode
          <>
            {/* Time Info */}
            <ThemedCard className="mb-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="time-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <ThemedText variant="secondary" className="text-sm">
                  Time Information
                </ThemedText>
              </View>
              
              <View className="flex-row justify-between mb-3">
                <ThemedText variant="secondary">Time In:</ThemedText>
                <ThemedText weight="medium">
                  {formatTime12Hour(session.start_time)}
                </ThemedText>
              </View>

              <View className="flex-row justify-between mb-3">
                <ThemedText variant="secondary">Time Out:</ThemedText>
                <ThemedText weight="medium">
                  {session.end_time
                    ? formatTime12Hour(session.end_time)
                    : 'Not ended'}
                </ThemedText>
              </View>

              <View className="flex-row justify-between">
                <ThemedText variant="secondary">Total Hours:</ThemedText>
                <ThemedText weight="bold" className="text-xl">
                  {session.total_hours.toFixed(2)}h
                </ThemedText>
              </View>
            </ThemedCard>

            {/* Breaks Display - Hidden since breaks are not stored in database */}

            {/* Description */}
            {session.description && (
              <ThemedCard className="mb-4">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="document-text-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" className="text-sm">
                    Description
                  </ThemedText>
                </View>
                <ThemedText className="text-base">{session.description}</ThemedText>
              </ThemedCard>
            )}

            {/* Actions */}
            <View className="space-y-3 mt-8 mb-8">
              <Button 
                onPress={handleExport}
                loading={exporting}
                disabled={exporting}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="document-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: '#ffffff' }}>Export as PDF</ThemedText>
                </View>
              </Button>
              
              <Button variant="outline" onPress={() => router.back()}>
                Back to History
              </Button>
              
              <Button variant="danger" onPress={handleDelete}>
                <View className="flex-row items-center justify-center">
                  <Ionicons name="trash-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: '#ffffff' }}>Delete Session</ThemedText>
                </View>
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  )
}