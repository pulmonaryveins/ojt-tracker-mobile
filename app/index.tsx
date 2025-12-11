import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../stores/auth.store'
import { useOnboardingStore } from '../stores/onboarding.store'
import { ThemedText } from '../components/themed/ThemedText'

export default function Index() {
  const router = useRouter()
  const { user, initialized } = useAuthStore()
  const { hasCompletedOnboarding } = useOnboardingStore()

  useEffect(() => {
    if (!initialized) return

    // Wait a bit for everything to initialize
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding && !user) {
        router.replace('/onboarding')
      } else if (!user) {
        router.replace('/(auth)/login')
      } else {
        router.replace('/(app)/(dashboard)')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [initialized, user, hasCompletedOnboarding])

  return (
    <View 
      style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#1e1f22' 
      }}
    >
      <ActivityIndicator size="large" color="#5865f2" />
      <ThemedText className="mt-4 text-base" style={{ color: '#fff' }}>
        Loading OJT Tracker...
      </ThemedText>
    </View>
  )
}