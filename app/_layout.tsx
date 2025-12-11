import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { View, ActivityIndicator, LogBox } from 'react-native'
import { useAuthStore } from '../stores/auth.store'
import { useOnboardingStore } from '../stores/onboarding.store'
import '../global.css'

// Suppress known warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Require cycle:',
    'Setting a timer',
    'Sending `onAnimatedValueUpdate`',
    'Reduced motion setting',
  ])
}

const queryClient = new QueryClient()

function RootLayoutNav() {
  const router = useRouter()
  const segments = useSegments()
  const navigationState = useRootNavigationState()
  const { user, initialized, loading } = useAuthStore() // ✅ Add loading state
  const { hasCompletedOnboarding } = useOnboardingStore()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (!initialized || !navigationState?.key || isNavigating) return

    const inAuthGroup = segments[0] === '(auth)'
    const inAppGroup = segments[0] === '(app)'
    const inOnboarding = segments[0] === 'onboarding'
    const inDebug = segments[0] === 'debug'

    // Skip navigation in debug mode or while loading
    if (inDebug || loading) return

    setIsNavigating(true)

    // Priority 1: Check onboarding (only for new users without account)
    if (!hasCompletedOnboarding && !user && !inOnboarding) {
      console.log('➡️ Redirecting to onboarding')
      router.replace('/onboarding')
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    // Priority 2: Check authentication
    if (!user && !inAuthGroup && !inOnboarding) {
      console.log('➡️ Redirecting to login (user is null)')
      router.replace('/(auth)/login')
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    // Priority 3: Redirect authenticated users away from auth screens
    if (user && (inAuthGroup || inOnboarding)) {
      console.log('➡️ Redirecting to dashboard')
      router.replace('/(app)/(dashboard)')
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    setIsNavigating(false)
  }, [user, initialized, segments, hasCompletedOnboarding, navigationState?.key, loading]) // ✅ Add loading to deps

  // Show loading while initializing
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1f22' }}>
        <ActivityIndicator size="large" color="#5865f2" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  // ✅ Initialize auth store on app start
  const initialize = useAuthStore((state) => state.initialize)
  
  useEffect(() => {
    console.log('🚀 App starting, initializing auth...')
    initialize()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  )
}