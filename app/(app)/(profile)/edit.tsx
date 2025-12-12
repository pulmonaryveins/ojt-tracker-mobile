import { useState, useEffect } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { Modal } from '../../../components/ui/Modal'
import { useAuthStore } from '../../../stores/auth.store'
import { ProfileService } from '../../../services/profile.service'
import type { Database } from '../../../types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function EditProfileScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    school: '',
    yearLevel: '',
    workplace: '',
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

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year']

  useEffect(() => {
    loadProfile()
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await ProfileService.getProfile(user.id)
      
      if (data) {
        setProfile(data)
        setFormData({
          fullName: data.full_name || '',
          school: data.school || '',
          yearLevel: data.year_level || '',
          workplace: data.workplace || '',
        })
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error)
      showModal('Error', 'Failed to load profile. Please try again.', 'error')
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
        router.back()
      }, 300)
    }
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validate Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name can only contain letters and spaces'
    }

    // Validate School
    if (!formData.school.trim()) {
      newErrors.school = 'School is required'
    } else if (formData.school.trim().length < 3) {
      newErrors.school = 'School name must be at least 3 characters'
    }

    // Validate Year Level
    if (!formData.yearLevel) {
      newErrors.yearLevel = 'Year level is required'
    }

    // Validate Workplace
    if (!formData.workplace.trim()) {
      newErrors.workplace = 'Workplace is required'
    } else if (formData.workplace.trim().length < 3) {
      newErrors.workplace = 'Workplace name must be at least 3 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      showModal('Validation Error ⚠️', firstError, 'error')
      return
    }

    if (!user?.id) {
      showModal('Error', 'User not found. Please log in again.', 'error')
      return
    }

    setSaving(true)

    try {
      console.log('🔄 Updating profile...')
      
      await ProfileService.updateProfile(user.id, {
        full_name: formData.fullName.trim(),
        school: formData.school.trim(),
        year_level: formData.yearLevel,
        workplace: formData.workplace.trim(),
      })
      
      console.log('✅ Profile updated successfully')
      
      showModal(
        'Success! 🎉',
        'Your profile has been updated successfully.',
        'success'
      )
      
    } catch (error: any) {
      console.error('❌ Update error:', error)
      
      let errorMessage = 'Failed to update profile. Please try again.'
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal('Update Failed', errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading profile...</ThemedText>
      </ThemedView>
    )
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ 
              backgroundColor: colors.accent + '20',
              padding: 12,
              borderRadius: 16,
              marginRight: 16,
            }}>
              <Ionicons name="create-outline" size={28} color={colors.accent} />
            </View>
            <ThemedText weight="bold" style={{ fontSize: 30 }}>
              Edit Profile
            </ThemedText>
          </View>
          <ThemedText variant="secondary" style={{ fontSize: 16, marginBottom: 32, marginLeft: 60 }}>
            Update your OJT information
          </ThemedText>

          <View style={{ marginBottom: 24 }}>
            <Input
              label="Full Name *"
              placeholder="Juan Dela Cruz"
              value={formData.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              error={errors.fullName}
              autoCapitalize="words"
              editable={!saving}
            />

            <Input
              label="School *"
              placeholder="University of Cebu"
              value={formData.school}
              onChangeText={(text) => updateField('school', text)}
              error={errors.school}
              autoCapitalize="words"
              editable={!saving}
            />

            <Select
              label="Year Level *"
              placeholder="Select your year level"
              value={formData.yearLevel}
              options={yearLevels}
              onValueChange={(value) => updateField('yearLevel', value)}
              error={errors.yearLevel}
            />

            <Input
              label="OJT Workplace *"
              placeholder="Company Name"
              value={formData.workplace}
              onChangeText={(text) => updateField('workplace', text)}
              error={errors.workplace}
              autoCapitalize="words"
              editable={!saving}
            />
          </View>

          <View style={{ gap: 12 }}>
            <Button 
              onPress={handleSave} 
              loading={saving} 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button 
              variant="outline"
              onPress={() => router.back()}
              disabled={saving}
            >
              Cancel
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