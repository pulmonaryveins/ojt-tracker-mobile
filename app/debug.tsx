import { View, ScrollView } from 'react-native'
import { ThemedView } from '../components/themed/ThemedView'
import { ThemedText } from '../components/themed/ThemedText'
import { ThemedCard } from '../components/themed/ThemedCard'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/auth.store'
import { useOnboardingStore } from '../stores/onboarding.store'
import { useRouter } from 'expo-router'

export default function DebugScreen() {
  const { user, session, initialized } = useAuthStore()
  const { hasCompletedOnboarding } = useOnboardingStore()
  const router = useRouter()

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
        <ThemedText weight="bold" style={{ fontSize: 24, marginBottom: 24 }}>
          Debug Info 🔍
        </ThemedText>

        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText weight="bold" style={{ marginBottom: 8 }}>Auth State:</ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 4 }}>
            Initialized: {initialized ? '✅' : '❌'}
          </ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 4 }}>
            User: {user?.email || '❌ Not logged in'}
          </ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            Session: {session ? '✅ Active' : '❌ None'}
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText weight="bold" style={{ marginBottom: 8 }}>Onboarding:</ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            Completed: {hasCompletedOnboarding ? '✅' : '❌'}
          </ThemedText>
        </ThemedCard>

        <View style={{ gap: 12 }}>
          <Button onPress={() => router.push('/onboarding')}>
            Go to Onboarding
          </Button>
          <Button onPress={() => router.push('/(auth)/login')}>
            Go to Login
          </Button>
          <Button onPress={() => router.push('/(app)/(dashboard)')}>
            Go to Dashboard
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  )
}