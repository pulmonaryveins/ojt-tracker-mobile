import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../stores/auth.store'
import { useTheme } from '../../hooks/useTheme'

interface FormData {
  fullName: string
  school: string
  yearLevel: string
  workplace: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignupScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const signUp = useAuthStore((state) => state.signUp)
  const signOut = useAuthStore((state) => state.signOut)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    school: '',
    yearLevel: '',
    workplace: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    icon?: string
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  })

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year']

  const showModal = (
    title: string, 
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info',
    icon?: string
  ) => {
    setModal({ visible: true, title, message, type, icon })
  }

  const closeModal = () => {
    setModal((prev) => ({ ...prev, visible: false }))
    
    if (modal.type === 'success') {
      setTimeout(() => {
        router.replace('/(auth)/login')
      }, 300)
    }
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSignup = async () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name can only contain letters and spaces'
    }

    if (!formData.school.trim()) {
      newErrors.school = 'School is required'
    } else if (formData.school.trim().length < 3) {
      newErrors.school = 'School name must be at least 3 characters'
    }

    if (!formData.yearLevel) {
      newErrors.yearLevel = 'Year level is required'
    }

    if (!formData.workplace.trim()) {
      newErrors.workplace = 'Workplace is required'
    } else if (formData.workplace.trim().length < 3) {
      newErrors.workplace = 'Workplace name must be at least 3 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        newErrors.password = passwordError
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      showModal('Validation Error', firstError, 'error', 'alert-circle')
      return
    }

    setLoading(true)

    try {
      console.log('🔄 Starting signup process...')
      
      const userId = await signUp(
        formData.email.trim(),
        formData.password,
        {
          full_name: formData.fullName.trim(),
          school: formData.school.trim(),
          year_level: formData.yearLevel,
          workplace: formData.workplace.trim(),
        }
      )
      
      console.log('✅ User created with ID:', userId)
      
      if (!userId) {
        throw new Error('Failed to create account. Please try again.')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('🔄 Signing out to prevent auto-login...')
      try {
        await signOut()
        console.log('✅ Signed out successfully')
      } catch (signOutError) {
        console.error('⚠️ Sign out error (non-critical):', signOutError)
      }
      
      showModal(
        'Check Your Email',
        `We've sent a verification link to ${formData.email}.\n\nPlease check your inbox and click the verification link to activate your account.\n\nAfter verifying, you can sign in with your credentials.`,
        'success',
        'mail'
      )
      
      setFormData({
        fullName: '',
        school: '',
        yearLevel: '',
        workplace: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      
    } catch (error: any) {
      console.error('❌ Signup error:', error)
      
      let errorTitle = 'Signup Failed'
      let errorMessage = 'Failed to create account. Please try again.'
      let errorIcon = 'alert-circle'
      
      if (error.message?.includes('already registered') || 
          error.message?.includes('User already registered') ||
          error.message?.includes('duplicate key')) {
        errorTitle = 'Email Already Exists'
        errorMessage = 'This email is already registered. Please use a different email or try logging in.'
        errorIcon = 'mail'
      } else if (error.message?.includes('Invalid email')) {
        errorTitle = 'Invalid Email'
        errorMessage = 'Please enter a valid email address.'
        errorIcon = 'mail'
      } else if (error.message?.includes('Password')) {
        errorTitle = 'Weak Password'
        errorMessage = 'Your password does not meet the requirements. Please use a stronger password.'
        errorIcon = 'lock-closed'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorTitle = 'Network Error'
        errorMessage = 'Unable to connect. Please check your internet connection and try again.'
        errorIcon = 'cloud-offline'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal(errorTitle, errorMessage, 'error', errorIcon)
    } finally {
      setLoading(false)
    }
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
            paddingVertical: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.accent + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="person-add" size={40} color={colors.accent} />
            </View>
            <ThemedText weight="bold" style={{ fontSize: 36, marginBottom: 8 }}>
              Create Account
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 16, textAlign: 'center' }}>
              Start tracking your OJT journey
            </ThemedText>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Input
              label="Full Name"
              placeholder="Juan Dela Cruz"
              value={formData.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              error={errors.fullName}
              autoCapitalize="words"
              editable={!loading}
            />

            <Input
              label="School"
              placeholder="University of Cebu"
              value={formData.school}
              onChangeText={(text) => updateField('school', text)}
              error={errors.school}
              autoCapitalize="words"
              editable={!loading}
            />

            <Select
              label="Year Level"
              placeholder="Select your year level"
              value={formData.yearLevel}
              options={yearLevels}
              onValueChange={(value) => updateField('yearLevel', value)}
              error={errors.yearLevel}
            />

            <Input
              label="OJT Workplace"
              placeholder="Company Name"
              value={formData.workplace}
              onChangeText={(text) => updateField('workplace', text)}
              error={errors.workplace}
              autoCapitalize="words"
              editable={!loading}
            />

            <Input
              label="Email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />

            <Input
              label="Password"
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
            />
          </View>

          <Button 
            onPress={handleSignup} 
            loading={loading} 
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {!loading && <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </ThemedText>
            </View>
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="secondary">Already have an account? </ThemedText>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/login')}
              disabled={loading}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <ThemedText weight="semibold" variant="accent" style={{ marginRight: 4 }}>
                Sign In
              </ThemedText>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        icon={modal.icon}
      />
    </ThemedView>
  )
}