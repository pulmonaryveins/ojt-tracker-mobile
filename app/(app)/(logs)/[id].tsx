import { useEffect, useState } from 'react'
import { View, ScrollView, Alert, TouchableOpacity, TextInput, Image, Modal as RNModal } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { DateTimePicker } from '../../../components/ui/DateTimePicker'
import { Modal } from '../../../components/ui/Modal'
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
  const [isEditingReport, setIsEditingReport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false)
  const [showExportConfirmModal, setShowExportConfirmModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  
  // Edit form state
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editBreaks, setEditBreaks] = useState<Break[]>([])
  
  // Session report state
  const [editTasksCompleted, setEditTasksCompleted] = useState('')
  const [editLessonsLearned, setEditLessonsLearned] = useState('')
  const [editReportImages, setEditReportImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

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
      // Breaks are not stored in database, start with empty array
      setEditBreaks([])
    }
  }, [isEditing, session])

  useEffect(() => {
    if (session && isEditingReport) {
      setEditTasksCompleted(session.tasks_completed || '')
      setEditLessonsLearned(session.lessons_learned || '')
      setEditReportImages(session.report_images || [])
    }
  }, [isEditingReport, session])

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
        tasks_completed: data.tasks_completed || null,
        lessons_learned: data.lessons_learned || null,
        report_images: data.report_images || null,
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
    setShowExportConfirmModal(false)
    try {
      await PDFExportService.exportSession(session)
      // Success message handled by platform-specific behavior
      // Web: Opens print dialog automatically
      // Mobile: Shows share dialog
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message)
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setShowDeleteModal(false)
    try {
      await SessionService.deleteSession(id!)
      Alert.alert('Success', 'Session deleted successfully')
      router.back()
    } catch (error) {
      Alert.alert('Error', 'Failed to delete session')
    }
  }

  const handlePickImage = async () => {
    if (editReportImages.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload up to 3 images per report')
      return
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permission to upload images')
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true)
        // For now, just store the local URI. In production, upload to Supabase Storage
        const imageUri = result.assets[0].uri
        setEditReportImages([...editReportImages, imageUri])
        setUploadingImage(false)
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message)
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setEditReportImages(editReportImages.filter((_, i) => i !== index))
  }

  const handleSaveReport = async () => {
    if (!session) return

    setSaving(true)
    try {
      await SessionService.updateSession(session.id, {
        tasks_completed: editTasksCompleted || null,
        lessons_learned: editLessonsLearned || null,
        report_images: editReportImages.length > 0 ? editReportImages : null,
      })

      Alert.alert('Success', 'Session report saved successfully')
      setIsEditingReport(false)
      loadSession()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save report: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReport = () => {
    setShowDeleteReportModal(true)
  }

  const confirmDeleteReport = async () => {
    setShowDeleteReportModal(false)
    try {
      await SessionService.updateSession(session!.id, {
        tasks_completed: null,
        lessons_learned: null,
        report_images: null,
      })
      Alert.alert('Success', 'Session report deleted successfully')
      loadSession()
    } catch (error) {
      Alert.alert('Error', 'Failed to delete report')
    }
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
        {/* Header Section */}
        <View style={{ marginBottom: 24 }}>
          <View className="flex-row justify-between items-center mb-3">
            <View style={{ flex: 1 }}>
              <ThemedText weight="bold" style={{ fontSize: 28, marginBottom: 6 }}>
                Session Details
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <ThemedText variant="secondary" style={{ fontSize: 15 }}>
                  {dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}
                </ThemedText>
              </View>
            </View>
            {!isEditing && (
              <TouchableOpacity 
                onPress={() => setIsEditing(true)}
                style={{
                  backgroundColor: colors.accent + '15',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.accent + '30',
                }}
              >
                <Ionicons name="pencil" size={22} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
                <ThemedText weight="medium" className="mb-2" style={{ fontSize: 14 }}>Start Time</ThemedText>
                <TextInput
                  value={editStartTime}
                  onChangeText={setEditStartTime}
                  placeholder="HH:MM (24-hour format)"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    padding: 14,
                    borderRadius: 10,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                  Current: {formatTime12Hour(editStartTime)}
                </ThemedText>
              </View>

              <View className="mb-4">
                <ThemedText weight="medium" className="mb-2" style={{ fontSize: 14 }}>End Time</ThemedText>
                <TextInput
                  value={editEndTime}
                  onChangeText={setEditEndTime}
                  placeholder="HH:MM (24-hour format)"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    padding: 14,
                    borderRadius: 10,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                  Current: {formatTime12Hour(editEndTime)}
                </ThemedText>
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

            {/* Session Report */}
            <ThemedCard className="mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="clipboard-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" className="text-sm">
                    Session Report
                  </ThemedText>
                </View>
                {!isEditingReport && (session.tasks_completed || session.lessons_learned || (session.report_images && session.report_images.length > 0)) && (
                  <TouchableOpacity onPress={() => setIsEditingReport(true)}>
                    <Ionicons name="pencil" size={20} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>

              {isEditingReport ? (
                <>
                  {/* Tasks Completed Edit */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                      <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                        Tasks Completed
                      </ThemedText>
                    </View>
                    <TextInput
                      value={editTasksCompleted}
                      onChangeText={setEditTasksCompleted}
                      placeholder="List the tasks you completed today...\n• Task 1\n• Task 2\n• Task 3"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={6}
                      maxLength={1000}
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        padding: 16,
                        borderRadius: 12,
                        fontSize: 15,
                        minHeight: 140,
                        maxHeight: 300,
                        textAlignVertical: 'top',
                        borderWidth: 1,
                        borderColor: colors.border,
                        lineHeight: 24,
                      }}
                    />
                    <ThemedText variant="secondary" style={{ fontSize: 11, marginTop: 6, textAlign: 'right' }}>
                      {editTasksCompleted.length}/1000 characters
                    </ThemedText>
                  </View>

                  {/* Lessons Learned Edit */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="bulb-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                      <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                        Lessons Learned
                      </ThemedText>
                    </View>
                    <TextInput
                      value={editLessonsLearned}
                      onChangeText={setEditLessonsLearned}
                      placeholder="What did you learn today?\n• Lesson 1\n• Lesson 2\n• Key insights"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={6}
                      maxLength={1000}
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        padding: 16,
                        borderRadius: 12,
                        fontSize: 15,
                        minHeight: 140,
                        maxHeight: 300,
                        textAlignVertical: 'top',
                        borderWidth: 1,
                        borderColor: colors.border,
                        lineHeight: 24,
                      }}
                    />
                    <ThemedText variant="secondary" style={{ fontSize: 11, marginTop: 6, textAlign: 'right' }}>
                      {editLessonsLearned.length}/1000 characters
                    </ThemedText>
                  </View>

                  {/* Images Edit */}
                  <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="images-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                        <ThemedText weight="medium" className="text-sm">
                          Photos ({editReportImages.length}/3)
                        </ThemedText>
                      </View>
                      {editReportImages.length < 3 && (
                        <TouchableOpacity onPress={handlePickImage} disabled={uploadingImage}>
                          <Ionicons name="add-circle" size={24} color={uploadingImage ? colors.textSecondary : colors.accent} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {editReportImages.length > 0 && (
                      <View className="flex-row flex-wrap gap-2">
                        {editReportImages.map((imageUri, index) => (
                          <View key={index} className="relative">
                            <Image
                              source={{ uri: imageUri }}
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 8,
                              }}
                            />
                            <TouchableOpacity
                              onPress={() => handleRemoveImage(index)}
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: '#f44336',
                                borderRadius: 12,
                                width: 24,
                                height: 24,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Ionicons name="close" size={16} color="#ffffff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {editReportImages.length === 0 && (
                      <ThemedText variant="secondary" className="text-sm text-center py-4">
                        No photos added yet
                      </ThemedText>
                    )}
                  </View>

                  {/* Report Actions */}
                  <View className="space-y-2 mt-4">
                    <Button onPress={handleSaveReport} loading={saving} disabled={saving}>
                      Save Report
                    </Button>
                    <Button variant="outline" onPress={() => setIsEditingReport(false)} disabled={saving}>
                      Cancel
                    </Button>
                    {(session.tasks_completed || session.lessons_learned || (session.report_images && session.report_images.length > 0)) && (
                      <Button variant="danger" onPress={handleDeleteReport}>
                        Delete Report
                      </Button>
                    )}
                  </View>
                </>
              ) : (
                <>
                  {/* Tasks Completed View */}
                  {session.tasks_completed && (
                    <View className="mb-4">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="checkmark-circle-outline" size={20} color={"#4ade80"} style={{ marginRight: 8 }} />
                        <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                          Tasks Completed
                        </ThemedText>
                      </View>
                      <View style={{ 
                        backgroundColor: colors.card,
                        padding: 14,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#4ade80',
                      }}>
                        <ThemedText style={{ fontSize: 15, lineHeight: 24 }}>
                          {session.tasks_completed}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Lessons Learned View */}
                  {session.lessons_learned && (
                    <View className="mb-4">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="bulb-outline" size={20} color={"#fbbf24"} style={{ marginRight: 8 }} />
                        <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                          Lessons Learned
                        </ThemedText>
                      </View>
                      <View style={{ 
                        backgroundColor: colors.card,
                        padding: 14,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#fbbf24',
                      }}>
                        <ThemedText style={{ fontSize: 15, lineHeight: 24 }}>
                          {session.lessons_learned}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Images View */}
                  {session.report_images && session.report_images.length > 0 && (
                    <View className="mb-4">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="images-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                        <ThemedText weight="medium" className="text-sm">
                          Photos ({session.report_images.length})
                        </ThemedText>
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        {session.report_images.map((imageUri, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setSelectedImage(imageUri)
                              setShowImageViewer(true)
                            }}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: imageUri }}
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 8,
                              }}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Empty State */}
                  {!session.tasks_completed && !session.lessons_learned && (!session.report_images || session.report_images.length === 0) && (
                    <View className="py-6">
                      <ThemedText variant="secondary" className="text-center mb-4">
                        No report created yet
                      </ThemedText>
                      <Button variant="outline" onPress={() => setIsEditingReport(true)}>
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="add-circle-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                          <ThemedText style={{ color: colors.accent }}>Add Report</ThemedText>
                        </View>
                      </Button>
                    </View>
                  )}
                </>
              )}
            </ThemedCard>

            {/* Actions */}
            <View style={{ marginTop: 32, marginBottom: 32, gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowExportConfirmModal(true)}
                disabled={exporting}
                style={{
                  backgroundColor: colors.accent,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  borderRadius: 12,
                  opacity: exporting ? 0.6 : 1,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name="download-outline" size={22} color="#ffffff" style={{ marginRight: 10 }} />
                <ThemedText weight="semibold" style={{ color: '#ffffff', fontSize: 16 }}>
                  {exporting ? 'Exporting...' : 'Export as PDF'}
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  backgroundColor: colors.card,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="arrow-back-outline" size={22} color={colors.text} style={{ marginRight: 10 }} />
                <ThemedText weight="semibold" style={{ fontSize: 16 }}>
                  Back to Activity Logs
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  backgroundColor: '#fee2e2',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#fecaca',
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#dc2626" style={{ marginRight: 10 }} />
                <ThemedText weight="semibold" style={{ color: '#dc2626', fontSize: 16 }}>
                  Delete Session
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Export Confirmation Modal */}
      <Modal
        visible={showExportConfirmModal}
        onClose={() => setShowExportConfirmModal(false)}
        title="Export Session to PDF"
        type="info"
        message={`Export this session as a PDF document?\n\nDate: ${dateUtils.formatPH(session.date, 'MMMM dd, yyyy')}\nTotal Hours: ${session.total_hours.toFixed(2)}h\n\nThe PDF will include all session details and reports.`}
        actions={[
          {
            text: 'Cancel',
            onPress: () => setShowExportConfirmModal(false),
            variant: 'outline',
          },
          {
            text: 'Export PDF',
            onPress: handleExport,
            variant: 'primary',
          },
        ]}
      />

      {/* Delete Session Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Session"
        type="warning"
        message={`Are you sure you want to delete this session?\n\nDate: ${dateUtils.formatPH(session.date, 'MMMM dd, yyyy')}\nTotal Hours: ${session.total_hours.toFixed(2)}h\n\nThis action cannot be undone. All session data including reports and photos will be permanently deleted.`}
        actions={[
          {
            text: 'Cancel',
            onPress: () => setShowDeleteModal(false),
            variant: 'outline',
          },
          {
            text: 'Delete',
            onPress: confirmDelete,
            variant: 'danger',
          },
        ]}
      />

      {/* Delete Report Confirmation Modal */}
      <Modal
        visible={showDeleteReportModal}
        onClose={() => setShowDeleteReportModal(false)}
        title="Delete Session Report"
        type="warning"
        message="Are you sure you want to delete this session report?\n\nThis will remove:\n• Tasks completed\n• Lessons learned\n• All uploaded photos\n\nThe session time data will not be affected. This action cannot be undone."
        actions={[
          {
            text: 'Cancel',
            onPress: () => setShowDeleteReportModal(false),
            variant: 'outline',
          },
          {
            text: 'Delete Report',
            onPress: confirmDeleteReport,
            variant: 'danger',
          },
        ]}
      />

      {/* Image Viewer Modal */}
      <RNModal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowImageViewer(false)
          setSelectedImage(null)
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowImageViewer(false)
            setSelectedImage(null)
          }}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ width: '90%', maxWidth: 500 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingHorizontal: 8,
            }}>
              <ThemedText weight="semibold" style={{ fontSize: 18, color: '#fff' }}>
                Session Photo
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowImageViewer(false)
                  setSelectedImage(null)
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <TouchableOpacity activeOpacity={1}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: '100%',
                    height: 400,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </RNModal>
    </ThemedView>
  )
}