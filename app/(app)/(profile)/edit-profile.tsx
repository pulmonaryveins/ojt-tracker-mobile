import { useState, useEffect } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image, Alert, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { Modal } from '../../../components/ui/Modal'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { useAuthStore } from '../../../stores/auth.store'
import { ProfileService } from '../../../services/profile.service'
import { useTheme } from '../../../hooks/useTheme'
import type { Database } from '../../../types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

// Debug function that works on Android
const debugLog = async (message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [EditProfile] ${message}`
  
  console.log(logMessage, data || '')
  
  try {
    // Store debug logs for review
    const existingLogs = await AsyncStorage.getItem('debug_logs') || '[]'
    const logs = JSON.parse(existingLogs)
    logs.push({ timestamp, component: 'EditProfile', message, data })
    
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50)
    }
    
    await AsyncStorage.setItem('debug_logs', JSON.stringify(logs))
  } catch (error) {
    console.error('Failed to store debug log:', error)
  }
}

function EditProfileContent() {
  const router = useRouter()
  const { colors } = useTheme()
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
  
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
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
    debugLog('Component mounted, starting to load profile', { userId: user?.id })
    loadProfile()
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) {
      await debugLog('No user ID available, stopping profile load')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      await debugLog('Starting profile load', { userId: user.id })
      
      // Add platform-specific safety check
      if (Platform.OS === 'android') {
        await debugLog('Running on Android platform')
      }
      
      const data = await ProfileService.getProfile(user.id)
      await debugLog('Profile data loaded', { hasData: !!data, dataKeys: data ? Object.keys(data) : [] })
      
      if (data) {
        setProfile(data)
        setFormData({
          fullName: data.full_name || '',
          school: data.school || '',
          yearLevel: data.year_level || '',
          workplace: data.workplace || '',
        })
        setProfilePicture(data.profile_picture_url)
        await debugLog('Profile state updated successfully')
      } else {
        await debugLog('No profile data received from service')
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error)
      await debugLog('ERROR in loadProfile', { 
        error: error.message, 
        stack: error.stack,
        name: error.name,
        cause: error.cause 
      })
      showModal('Error', 'Failed to load profile. Please try again.', 'error')
    } finally {
      setLoading(false)
      await debugLog('Profile load complete')
    }
  }

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModal({ visible: true, title, message, type })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, visible: false }))
    
    if (modal.type === 'success') {
      setTimeout(() => {
        // Use replace instead of back to ensure navigation works
        router.replace('/(app)/(profile)')
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

  const pickImage = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        await uploadProfilePicture(imageUri)
      }
    } catch (error: any) {
      console.error('Error picking image:', error)
      showModal('Error', error.message || 'Failed to select image. Please try again.', 'error')
    }
  }

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        await uploadProfilePicture(imageUri)
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      showModal('Error', 'Failed to take photo', 'error')
    }
  }

  const uploadProfilePicture = async (imageUri: string) => {
    if (!user?.id) return

    try {
      setUploadingImage(true)
      console.log('📤 Starting upload for:', imageUri)
      const publicUrl = await ProfileService.uploadProfilePicture(user.id, imageUri)
      setProfilePicture(publicUrl)
      
      // Don't show modal, just update silently for better UX
      console.log('✅ Upload complete:', publicUrl)
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error)
      
      let errorMessage = 'Failed to upload profile picture. '
      
      if (error.message?.includes('storage')) {
        errorMessage += 'Storage not configured. Please contact support.'
      } else if (error.message?.includes('network')) {
        errorMessage += 'Please check your internet connection.'
      } else {
        errorMessage += 'Please try again.'
      }
      
      showModal('Upload Failed', errorMessage, 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeProfilePicture = async () => {
    if (!user?.id || !profilePicture) return

    Alert.alert(
      'Remove Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true)
              await ProfileService.deleteProfilePicture(user.id, profilePicture)
              setProfilePicture(null)
              showModal('Success', 'Profile picture removed', 'success')
            } catch (error) {
              console.error('Error removing profile picture:', error)
              showModal('Error', 'Failed to remove profile picture', 'error')
            } finally {
              setUploadingImage(false)
            }
          },
        },
      ]
    )
  }

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        profilePicture ? { text: 'Remove Picture', onPress: removeProfilePicture, style: 'destructive' } : null,
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    )
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
      showModal('Validation Error', firstError, 'error')
      return
    }

    if (!user?.id) {
      console.error('❌ No user ID found')
      showModal('Error', 'User not found. Please log in again.', 'error')
      return
    }

    console.log('📝 Current user ID:', user.id)
    console.log('📝 Form data:', formData)

    setSaving(true)

    try {
      console.log('🔄 Calling updateProfile...')
      
      const updatedProfile = await ProfileService.updateProfile(user.id, {
        full_name: formData.fullName.trim(),
        school: formData.school.trim(),
        year_level: formData.yearLevel,
        workplace: formData.workplace.trim(),
      })
      
      console.log('✅ Profile updated successfully:', updatedProfile)
      
      showModal(
        'Profile Updated',
        'Your profile has been updated successfully.',
        'success'
      )
      
    } catch (error: any) {
      console.error('❌ Update error:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error keys:', Object.keys(error))
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      })
      
      let errorMessage = 'Failed to update profile. Please try again.'
      
      if (error.message?.includes('JWT')) {
        errorMessage = 'Session expired. Please log in again.'
      } else if (error.message?.includes('policy')) {
        errorMessage = 'Permission denied. Please contact support.'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal('Update Failed', errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user?.id) {
    debugLog('Showing loading screen', { loading, hasUser: !!user?.id })
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading profile...</ThemedText>
        <ThemedText variant="secondary" style={{ marginTop: 8, fontSize: 12 }}>
          Platform: {Platform.OS}
        </ThemedText>
      </ThemedView>
    )
  }

  // Additional safety check for required dependencies
  try {
    if (!ThemedView || !ThemedText || !ThemedCard) {
      debugLog('ERROR: Missing themed components')
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Error: Missing UI components</Text>
        </View>
      )
    }
  } catch (error) {
    debugLog('ERROR: Component validation failed', error)
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
                <Ionicons name="person-outline" size={24} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText weight="bold" style={{ fontSize: 28, marginBottom: 4 }}>
                  Edit Profile
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 14 }}>
                  Update your personal information
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Profile Picture Section */}
          <ThemedCard
            style={{
              marginBottom: 24,
              padding: 24,
              backgroundColor: colors.accent + '10',
              borderWidth: 2,
              borderColor: colors.accent + '30',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <ThemedText weight="semibold" style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
                Profile Picture
              </ThemedText>
              
              <View style={{ position: 'relative', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={showImageOptions}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: colors.card,
                    borderWidth: 4,
                    borderColor: colors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    shadowColor: colors.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  {profilePicture ? (
                    <Image
                      source={{ uri: profilePicture }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={70} color={colors.textSecondary} />
                    </View>
                  )}
                  {uploadingImage && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="cloud-upload" size={32} color="#fff" style={{ marginBottom: 8 }} />
                      <ThemedText style={{ color: '#fff', fontSize: 12 }}>Uploading...</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: colors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 4,
                    borderColor: colors.card,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Ionicons name="camera" size={22} color="#fff" />
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={uploadingImage}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: colors.accent,
                    borderRadius: 12,
                    opacity: uploadingImage ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="images" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                    Gallery
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={takePhoto}
                  disabled={uploadingImage}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: colors.accent,
                    opacity: uploadingImage ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="camera" size={18} color={colors.accent} style={{ marginRight: 8 }} />
                  <ThemedText style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>
                    Camera
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              {profilePicture && (
                <TouchableOpacity
                  onPress={removeProfilePicture}
                  disabled={uploadingImage}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    opacity: uploadingImage ? 0.5 : 1,
                  }}
                >
                  <ThemedText style={{ color: '#ed4245', fontSize: 13, fontWeight: '500' }}>
                    Remove Picture
                  </ThemedText>
                </TouchableOpacity>
              )}
              
              <ThemedText variant="secondary" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                Upload a clear photo of yourself
              </ThemedText>
            </View>
          </ThemedCard>

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={20} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText variant="secondary" style={{ fontSize: 13, flex: 1 }}>
                All fields marked with * are required
              </ThemedText>
            </View>
          </ThemedCard>

          {/* Form Section */}
          <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="clipboard-outline" size={22} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 18 }}>
                Personal Details
              </ThemedText>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="person" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                    FULL NAME *
                  </ThemedText>
                </View>
                <Input
                  placeholder="Juan Dela Cruz"
                  value={formData.fullName}
                  onChangeText={(text) => updateField('fullName', text)}
                  error={errors.fullName}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="school" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                    SCHOOL *
                  </ThemedText>
                </View>
                <Input
                  placeholder="University of Cebu"
                  value={formData.school}
                  onChangeText={(text) => updateField('school', text)}
                  error={errors.school}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="ribbon" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                    YEAR LEVEL *
                  </ThemedText>
                </View>
                <Select
                  placeholder="Select your year level"
                  value={formData.yearLevel}
                  options={yearLevels}
                  onValueChange={(value) => updateField('yearLevel', value)}
                  error={errors.yearLevel}
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="business" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                    OJT WORKPLACE *
                  </ThemedText>
                </View>
                <Input
                  placeholder="Company Name"
                  value={formData.workplace}
                  onChangeText={(text) => updateField('workplace', text)}
                  error={errors.workplace}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>
            </View>
          </ThemedCard>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Button 
              onPress={handleSave} 
              loading={saving} 
              disabled={saving}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            >
              {!saving && <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button 
              variant="outline"
              onPress={() => router.replace('/(app)/(profile)')}
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

export default function EditProfileScreen() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        debugLog('ERROR: Screen crashed', { error: error.message, stack: error.stack })
      }}
    >
      <EditProfileContent />
    </ErrorBoundary>
  )
}