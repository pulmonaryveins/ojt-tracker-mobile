import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuthStore } from '../../stores/auth.store'
import { useTheme } from '../../hooks/useTheme'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { requestPasswordReset, loading } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ email?: string }>({})
  
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
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleRequestReset = async () => {
    setErrors({})

    const newErrors: typeof errors = {}
    
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await requestPasswordReset(email.trim())
      
      showModal(
        'Check Your Email',
        'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.',
        'success',
        'mail'
      )
      
      setTimeout(() => {
        closeModal()
        router.back()
      }, 3000)
    } catch (error: any) {
      console.error('Password reset request error:', error)
      
      let errorMessage = 'Failed to send reset email. Please try again.'
      let errorIcon = 'alert-circle'
      
      if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address.'
        errorIcon = 'person-remove'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.'
        errorIcon = 'cloud-offline'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal('Reset Failed', errorMessage, 'error', errorIcon)
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
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Icon */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                padding: 8,
              }}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
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
              <Ionicons name="key" size={40} color={colors.accent} />
            </View>
            <ThemedText weight="bold" style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>
              Forgot Password?
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 16, textAlign: 'center', paddingHorizontal: 16 }}>
              Enter your email address and we'll send you a link to reset your password
            </ThemedText>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              autoFocus
            />
          </View>

          <Button onPress={handleRequestReset} loading={loading} disabled={loading}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {!loading && <Ionicons name="mail-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                Send Reset Link
              </ThemedText>
            </View>
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
            <ThemedText variant="secondary">Remember your password? </ThemedText>
            <TouchableOpacity 
              onPress={() => router.back()}
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

      {/* Modal */}
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
