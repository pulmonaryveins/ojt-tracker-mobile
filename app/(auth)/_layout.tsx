import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function AuthLayout() {
  const router = useRouter()
  const [isProcessingLink, setIsProcessingLink] = useState(false)

  useEffect(() => {
    // Handle deep links for password reset
    const handleDeepLink = async (event: { url: string }) => {
      let url = event.url
      
      console.log('🔗 Deep link received:', url)
      
      // Prevent duplicate processing
      if (isProcessingLink) {
        console.log('⏭️ Already processing a link, skipping')
        return
      }
      
      // Check if this is a password reset or recovery link
      if (url.includes('reset-password') || url.includes('type=recovery') || url.includes('#access_token')) {
        setIsProcessingLink(true)
        
        try {
          let accessToken = ''
          let refreshToken = ''
          
          // Extract tokens from URL hash (Supabase appends tokens after redirect)
          const hashPart = url.split('#')[1] || ''
          const hashParams = new URLSearchParams(hashPart)
          accessToken = hashParams.get('access_token') || ''
          refreshToken = hashParams.get('refresh_token') || ''
          const type = hashParams.get('type') || ''
          
          console.log('🔑 Token type:', type)
          console.log('🔑 Has access token:', !!accessToken)
          console.log('🔑 Has refresh token:', !!refreshToken)
          
          if (accessToken) {
            console.log('✅ Setting recovery session')
            
            // Set the session with the recovery tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (!error && data.session) {
              console.log('✅ Recovery session set successfully')
              // Navigate to reset password screen
              setTimeout(() => {
                router.push('/(auth)/reset-password')
                setIsProcessingLink(false)
              }, 500)
            } else {
              console.error('❌ Error setting session:', error)
              setIsProcessingLink(false)
              router.push('/(auth)/forgot-password')
            }
          } else {
            console.log('⚠️ No access token found in URL')
            setIsProcessingLink(false)
            router.push('/(auth)/forgot-password')
          }
        } catch (error) {
          console.error('❌ Error processing deep link:', error)
          setIsProcessingLink(false)
          router.push('/(auth)/forgot-password')
        }
      }
    }

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink)

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL:', url)
        handleDeepLink({ url })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [isProcessingLink])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  )
}
