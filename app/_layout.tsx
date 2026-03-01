import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { View, ActivityIndicator, LogBox, Linking } from 'react-native'
import { useAuthStore } from '../stores/auth.store'
import { useOnboardingStore } from '../stores/onboarding.store'
import { DebugUtils, setupGlobalErrorHandling } from '../utils/debug'
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

// Initialize debugging
setupGlobalErrorHandling()

/** Extract recovery tokens from a Supabase password-reset deep link.
 *  Supabase appends tokens in the URL hash after redirecting:
 *  ojttracker://reset-password#access_token=XXX&refresh_token=YYY&type=recovery
 */
function extractRecoveryParams(url: string): { access_token: string; refresh_token: string } | null {
  const hash = url.split('#')[1] ?? ''
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const type = params.get('type')

  if (type === 'recovery' && accessToken) {
    return {
      access_token: accessToken,
      refresh_token: params.get('refresh_token') ?? '',
    }
  }
  return null
}

function RootLayoutNav() {
  const router = useRouter()
  const segments = useSegments()
  const navigationState = useRootNavigationState()
  const { user, initialized, loading } = useAuthStore()
  const { hasCompletedOnboarding } = useOnboardingStore()
  const [isNavigating, setIsNavigating] = useState(false)

  // Holds recovery tokens from the deep link until navigation is ready.
  const [pendingRecovery, setPendingRecovery] = useState<{
    access_token: string
    refresh_token: string
  } | null>(null)

  // Log system info once
  useEffect(() => {
    DebugUtils.logSystemInfo()
  }, [])

  // ─── Root-level deep link handler ─────────────────────────────────────────
  // Must live here (not in (auth)/_layout) so it fires even when the user has
  // an existing session and the guard would otherwise redirect them to the
  // dashboard before (auth)/_layout ever mounts.
  useEffect(() => {
    // Cold start: app opened directly from the recovery email link
    Linking.getInitialURL().then((url) => {
      if (!url) return
      console.log('🔗 Initial URL:', url)
      const params = extractRecoveryParams(url)
      if (params) {
        console.log('🔑 Recovery tokens found in initial URL')
        setPendingRecovery(params)
      }
    })

    // Warm start: app already running when the link is tapped
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received:', url)
      const params = extractRecoveryParams(url)
      if (params) {
        console.log('🔑 Recovery tokens found in live deep link')
        setPendingRecovery(params)
      }
    })

    return () => subscription.remove()
  }, [])

  // ─── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized || !navigationState?.key || isNavigating) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'
    const inDebug = segments[0] === 'debug'
    // Reset-password must remain reachable while a recovery session is active
    const inResetPassword = segments.includes('reset-password')

    if (inDebug || loading) return

    // Priority 0: Recovery link — navigate to reset-password with tokens as
    // route params so the screen can call setSession() itself. Runs before all
    // other checks so a logged-in user is not redirected to the dashboard when
    // they tap a recovery email link.
    if (pendingRecovery && !inResetPassword) {
      console.log('➡️ Navigating to reset-password (recovery flow)')
      setIsNavigating(true)
      setPendingRecovery(null)
      router.replace({
        pathname: '/(auth)/reset-password',
        params: pendingRecovery,
      })
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    setIsNavigating(true)

    // Priority 1: Onboarding (only for new users without an account)
    if (!hasCompletedOnboarding && !user && !inOnboarding) {
      console.log('➡️ Redirecting to onboarding')
      router.replace('/onboarding')
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    // Priority 2: Unauthenticated user outside the auth group
    if (!user && !inAuthGroup && !inOnboarding) {
      console.log('➡️ Redirecting to login (user is null)')
      router.replace('/(auth)/login')
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    // Priority 3: Redirect authenticated users away from auth screens.
    // Exception: reset-password must stay accessible while the user holds a
    // recovery session (setSession was called with the recovery token).
    if (user && (inAuthGroup || inOnboarding) && !inResetPassword) {
      console.log('➡️ Redirecting to dashboard')
      router.replace('/(app)/(dashboard)')
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    setIsNavigating(false)
  }, [user, initialized, segments, hasCompletedOnboarding, navigationState?.key, loading, pendingRecovery])

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
