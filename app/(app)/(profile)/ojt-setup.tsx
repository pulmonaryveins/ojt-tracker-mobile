import { useState, useEffect } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { DateTimePicker } from '../../../components/ui/DateTimePicker'
import { Modal } from '../../../components/ui/Modal'
import { useAuthStore } from '../../../stores/auth.store'
import { OJTSetupService } from '../../../services/ojt-setup.service'
import { useTheme } from '../../../hooks/useTheme'

interface OJTSetupForm {
  required_hours: number
  start_date: string | null
  end_date: string | null
}

export default function OJTSetupScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<OJTSetupForm>({
    required_hours: 500,
    start_date: null,
    end_date: null,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  })

  useEffect(() => {
    loadSetup()
  }, [user?.id])

  const loadSetup = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await OJTSetupService.getSetup(user.id)
      
      if (data) {
        setFormData({
          required_hours: data.required_hours,
          start_date: data.start_date,
          end_date: data.end_date,
        })
        console.log('✅ OJT setup loaded:', data)
      } else {
        console.log('ℹ️ No existing OJT setup found')
      }
    } catch (error) {
      console.error('❌ Error loading OJT setup:', error)
    } finally {
      setLoading(false)
    }
  }

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModal({ visible: true, title, message, type })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, visible: false }))
    
    if (modal.type === 'success') {
      setTimeout(() => {
        router.replace('/(app)/(profile)')
      }, 300)
    }
  }

  const updateField = (field: keyof OJTSetupForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleCancel = () => {
    console.log('🔙 Cancelling OJT setup...')
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(app)/(profile)')
    }
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validate Required Hours
    if (!formData.required_hours || formData.required_hours <= 0) {
      newErrors.required_hours = 'Required hours must be greater than 0'
    } else if (formData.required_hours > 10000) {
      newErrors.required_hours = 'Required hours seems too high'
    }

    // Validate Start Date
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    // Validate End Date
    if (formData.end_date && formData.start_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      
      if (end <= start) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      showModal('Validation Error', firstError, 'error')
      return
    }

    if (!user?.id) {
      showModal('Error', 'User not found. Please log in again.', 'error')
      return
    }

    setSaving(true)

    try {
      console.log('🔄 Saving OJT setup...')
      console.log('📝 Form data:', formData)
      
      // Upsert (insert or update) the setup
      await OJTSetupService.upsertSetup({
        user_id: user.id,
        required_hours: formData.required_hours,
        start_date: formData.start_date!,
        end_date: formData.end_date,
      })
      
      console.log('✅ OJT setup saved successfully')
      
      showModal(
        'Setup Saved',
        'Your OJT requirements have been saved successfully.',
        'success'
      )
      
    } catch (error: any) {
      console.error('❌ Save error:', error)
      
      let errorMessage = 'Failed to save OJT setup. Please try again.'
      
      if (error.message?.includes('JWT')) {
        errorMessage = 'Session expired. Please log in again.'
      } else if (error.message?.includes('policy')) {
        errorMessage = 'Permission denied. Please contact support.'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal('Save Failed', errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading OJT setup...</ThemedText>
      </ThemedView>
    )
  }

  // Calculate estimated completion date
  const calculateEndDate = () => {
    if (!formData.start_date) return null
    
    const start = new Date(formData.start_date)
    const daysNeeded = Math.ceil(formData.required_hours / 8)
    const weeksNeeded = Math.ceil(daysNeeded / 5)
    
    const estimatedEnd = new Date(start)
    estimatedEnd.setDate(estimatedEnd.getDate() + (weeksNeeded * 7))
    
    return estimatedEnd.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons name="settings-outline" size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText weight="bold" style={{ fontSize: 28, marginBottom: 4 }}>
                  OJT Setup
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 14 }}>
                  Configure your OJT requirements
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <ThemedCard 
            style={{ 
              marginBottom: 24, 
              padding: 16,
              backgroundColor: colors.accent + '10',
              borderWidth: 1,
              borderColor: colors.accent + '30',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="information-circle" size={20} color={colors.accent} style={{ marginRight: 12, marginTop: 2 }} />
              <ThemedText variant="secondary" style={{ fontSize: 13, flex: 1 }}>
                Set your required OJT hours and training period. This helps track your progress accurately.
              </ThemedText>
            </View>
          </ThemedCard>

          {/* Requirements Card */}
          <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="time-outline" size={22} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 18 }}>
                Hour Requirements
              </ThemedText>
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="hourglass" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  REQUIRED OJT HOURS *
                </ThemedText>
              </View>
              <Input
                placeholder="500"
                value={formData.required_hours?.toString() || ''}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0
                  updateField('required_hours', hours)
                }}
                error={errors.required_hours}
                keyboardType="numeric"
                editable={!saving}
              />
            </View>
          </ThemedCard>

          {/* Timeline Card */}
          <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="calendar-outline" size={22} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 18 }}>
                Training Period
              </ThemedText>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="play-circle" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                    OJT START DATE *
                  </ThemedText>
                </View>
                <DateTimePicker
                  value={formData.start_date}
                  onChange={(date) => {
                    console.log('📅 Start date selected:', date)
                    updateField('start_date', date)
                  }}
                  error={errors.start_date}
                  placeholder="Select start date"
                  mode="date"
                  disabled={saving}
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="flag" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                    EXPECTED END DATE (OPTIONAL)
                  </ThemedText>
                </View>
                <DateTimePicker
                  value={formData.end_date}
                  onChange={(date) => {
                    console.log('📅 End date selected:', date)
                    updateField('end_date', date)
                  }}
                  error={errors.end_date}
                  placeholder="Select end date"
                  mode="date"
                  minimumDate={formData.start_date || undefined}
                  disabled={saving}
                />
              </View>
            </View>
          </ThemedCard>

          {/* Estimation Card */}
          {formData.start_date && (
            <ThemedCard 
              style={{ 
                marginBottom: 24, 
                padding: 16,
                backgroundColor: '#3ba55d15',
                borderWidth: 1,
                borderColor: '#3ba55d40',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="analytics" size={20} color="#3ba55d" style={{ marginRight: 10 }} />
                <ThemedText weight="semibold" style={{ fontSize: 14, color: '#3ba55d' }}>
                  Estimated Completion
                </ThemedText>
              </View>
              <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                Based on 8 hours/day, 5 days/week:
              </ThemedText>
              <ThemedText weight="bold" style={{ fontSize: 18 }}>
                {calculateEndDate()}
              </ThemedText>
            </ThemedCard>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Button 
              onPress={handleSave} 
              loading={saving} 
              disabled={saving}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            >
              {!saving && <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>

            <Button 
              variant="outline"
              onPress={handleCancel}
              disabled={saving}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close-circle-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
              </View>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />
    </ThemedView>
  )
}