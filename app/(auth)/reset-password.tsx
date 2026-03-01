import { useState, useEffect } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTheme } from '../../hooks/useTheme'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  // Tokens are passed as route params by the root-level deep link handler
  const { access_token, refresh_token } = useLocalSearchParams<{
    access_token?: string
    refresh_token?: string
  }>()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [sessionValid, setSessionValid] = useState<boolean | null>(null)
  const [isResetting, setIsResetting] = useState(false)

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

  // Establish a valid recovery session.
  // When opened from an email link the root layout passes the raw tokens as
  // route params; we exchange them for a session here. Falling back to
  // getSession() handles the edge case where the session was already set.
  useEffect(() => {
    const verifySession = async () => {
      console.log('🔍 Verifying recovery session...')

      const invalidate = (msg: string) => {
        console.log('❌', msg)
        setSessionValid(false)
        showModal(
          'Invalid Link',
          'This password reset link is invalid or has expired. Please request a new one.',
          'error',
          'alert-circle'
        )
        setTimeout(() => router.replace('/(auth)/forgot-password'), 3000)
      }

      try {
        // Path A: tokens arrived via route params (email deep link)
        if (access_token) {
          console.log('🔑 Setting session from recovery tokens')
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token ?? '',
          })

          if (error || !data.session) {
            invalidate(`setSession failed: ${error?.message}`)
            return
          }

          console.log('✅ Recovery session established')
          setSessionValid(true)
          return
        }

        // Path B: no params — check whether a session already exists
        // (e.g., user refreshed the screen after tokens were already exchanged)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Session error:', error)
          setSessionValid(false)
          return
        }

        if (!session) {
          invalidate('No session found and no tokens in params')
          return
        }

        console.log('✅ Existing recovery session found')
        setSessionValid(true)
      } catch (error) {
        console.error('❌ Error verifying session:', error)
        setSessionValid(false)
      }
    }

    verifySession()
  }, [])

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

  const validatePassword = (password: string): string | undefined => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return undefined
  }

  const handleResetPassword = async () => {
    // Prevent multiple submissions
    if (isResetting) return
    
    setErrors({})

    const newErrors: typeof errors = {}
    
    const passwordError = validatePassword(password)
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (passwordError) {
      newErrors.password = passwordError
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsResetting(true)

    try {
      console.log('🔄 Updating password...')
      
      // Update password using Supabase directly for better error handling
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error('❌ Password update error:', error)
        throw error
      }

      console.log('✅ Password updated successfully')
      
      showModal(
        'Password Updated',
        'Your password has been successfully updated. You can now sign in with your new password.',
        'success',
        'checkmark-circle'
      )
      
      // Sign out and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.replace('/(auth)/login')
      }, 2000)
    } catch (error: any) {
      console.error('❌ Password reset error:', error)
      
      let errorMessage = 'Failed to update password. Please try again.'
      let errorIcon = 'alert-circle'
      
      if (error.message?.includes('session') || error.message?.includes('JWT')) {
        errorMessage = 'Your reset link has expired. Please request a new one.'
        errorIcon = 'time'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
        errorIcon = 'cloud-offline'
      } else if (error.message?.includes('password')) {
        errorMessage = error.message
        errorIcon = 'lock-closed'
      } else if (error.message) {
        errorMessage = error.message
      }

      showModal('Reset Failed', errorMessage, 'error', errorIcon)
    } finally {
      setIsResetting(false)
    }
  }

  // Show loading state while verifying session
  if (sessionValid === null) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
        <ThemedText style={{ marginTop: 16 }}>Verifying reset link...</ThemedText>
      </ThemedView>
    )
  }

  // Show error if session is invalid
  if (sessionValid === false) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="alert-circle" size={64} color="#ed4245" style={{ marginBottom: 16 }} />
        <ThemedText weight="bold" style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}>
          Invalid Reset Link
        </ThemedText>
        <ThemedText variant="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          This link has expired or is invalid. Redirecting...
        </ThemedText>
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
              <Ionicons name="lock-closed" size={40} color={colors.accent} />
            </View>
            <ThemedText weight="bold" style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>
              Reset Password
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 16, textAlign: 'center', paddingHorizontal: 16 }}>
              Enter your new password below
            </ThemedText>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Input
              label="New Password"
              placeholder="Enter new password"
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
              autoComplete="password-new"
              editable={!isResetting}
              autoFocus
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                }
              }}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!isResetting}
            />
          </View>

          {/* Password Requirements */}
          <View style={{ marginBottom: 24, padding: 16, backgroundColor: colors.accent + '10', borderRadius: 12 }}>
            <ThemedText variant="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
              Password must contain:
            </ThemedText>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={14} 
                  color={password.length >= 8 ? colors.accent : colors.textSecondary} 
                  style={{ marginRight: 6 }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  At least 8 characters
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={/[a-z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={14} 
                  color={/[a-z]/.test(password) ? colors.accent : colors.textSecondary} 
                  style={{ marginRight: 6 }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  One lowercase letter
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={14} 
                  color={/[A-Z]/.test(password) ? colors.accent : colors.textSecondary} 
                  style={{ marginRight: 6 }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  One uppercase letter
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={14} 
                  color={/[0-9]/.test(password) ? colors.accent : colors.textSecondary} 
                  style={{ marginRight: 6 }}
                />
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  One number
                </ThemedText>
              </View>
            </View>
          </View>

          <Button onPress={handleResetPassword} loading={isResetting} disabled={isResetting}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {!isResetting && <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                {isResetting ? 'Updating Password...' : 'Update Password'}
              </ThemedText>
            </View>
          </Button>
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
