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

export default function LoginScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { signIn, loading } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  
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

  const handleLogin = async () => {
    setErrors({})

    const newErrors: typeof errors = {}
    
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await signIn(email.trim(), password)
      
      showModal(
        'Welcome Back',
        'Successfully logged in to your account.',
        'success',
        'checkmark-circle'
      )
      
      setTimeout(() => {
        closeModal()
      }, 1500)
    } catch (error: any) {
      console.error('Login error:', error)
      
      let errorMessage = 'Failed to sign in. Please try again.'
      let errorIcon = 'alert-circle'
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        errorIcon = 'lock-closed'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in.'
        errorIcon = 'mail'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.'
        errorIcon = 'cloud-offline'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal('Login Failed', errorMessage, 'error', errorIcon)
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
              <Ionicons name="log-in" size={40} color={colors.accent} />
            </View>
            <ThemedText weight="bold" style={{ fontSize: 36, marginBottom: 8 }}>
              Welcome Back
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 16, textAlign: 'center' }}>
              Sign in to continue tracking your OJT
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
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }
              }}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              disabled={loading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="help-circle-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <ThemedText variant="secondary" style={{ fontSize: 14 }}>
                  Forgot Password?
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <Button onPress={handleLogin} loading={loading} disabled={loading}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {!loading && <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                Sign In
              </ThemedText>
            </View>
          </Button>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
            <ThemedText variant="secondary">Don't have an account? </ThemedText>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/signup')}
              disabled={loading}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <ThemedText weight="semibold" variant="accent" style={{ marginRight: 4 }}>
                Sign Up
              </ThemedText>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Enhanced Modal with Icon */}
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