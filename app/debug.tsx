import { useState, useEffect } from 'react'
import { View, ScrollView, Share, Alert } from 'react-native'
import { ThemedView } from '../components/themed/ThemedView'
import { ThemedText } from '../components/themed/ThemedText'
import { ThemedCard } from '../components/themed/ThemedCard'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/auth.store'
import { useOnboardingStore } from '../stores/onboarding.store'
import { useRouter } from 'expo-router'
import { DebugUtils } from '../utils/debug'

export default function DebugScreen() {
  const { user, session, initialized } = useAuthStore()
  const { hasCompletedOnboarding } = useOnboardingStore()
  const router = useRouter()
  
  const [debugLogs, setDebugLogs] = useState<any[]>([])
  const [errorLogs, setErrorLogs] = useState<any[]>([])

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const [debug, errors] = await Promise.all([
        DebugUtils.getDebugLogs(),
        DebugUtils.getErrorLogs()
      ])
      setDebugLogs(debug)
      setErrorLogs(errors)
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const handleExportLogs = async () => {
    try {
      const exportData = await DebugUtils.exportLogs()
      if (exportData) {
        await Share.share({
          message: exportData,
          title: 'OJT Tracker Debug Logs'
        })
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs')
    }
  }

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await DebugUtils.clearLogs()
            await loadLogs()
          }
        }
      ]
    )
  }

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
          <ThemedText weight="bold" style={{ marginBottom: 8 }}>Debug Tools:</ThemedText>
          <View style={{ gap: 8 }}>
            <Button onPress={handleExportLogs} style={{ marginBottom: 4 }}>
              📤 Export Debug Logs
            </Button>
            <Button onPress={handleClearLogs} variant="outline" style={{ marginBottom: 4 }}>
              🗑️ Clear All Logs
            </Button>
            <Button onPress={() => router.push('/(app)/(profile)/edit-profile')} style={{ marginBottom: 4 }}>
              🧪 Test Edit Profile
            </Button>
            <Button onPress={() => router.push('/(app)/(profile)/ojt-setup')}>
              🧪 Test OJT Setup
            </Button>
          </View>
        </ThemedCard>

        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText weight="bold" style={{ marginBottom: 8, color: '#ef4444' }}>
            Recent Errors ({errorLogs.length}):
          </ThemedText>
          {errorLogs.length === 0 ? (
            <ThemedText variant="secondary">No errors logged</ThemedText>
          ) : (
            errorLogs.slice(-3).map((error, index) => (
              <View key={index} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 4 }}>
                <ThemedText style={{ fontSize: 12, color: '#dc2626' }}>
                  {error.message}
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: '#666' }}>
                  {error.timestamp}
                </ThemedText>
              </View>
            ))
          )}
        </ThemedCard>

        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText weight="bold" style={{ marginBottom: 8 }}>
            Recent Debug Logs ({debugLogs.length}):
          </ThemedText>
          {debugLogs.length === 0 ? (
            <ThemedText variant="secondary">No debug logs available</ThemedText>
          ) : (
            debugLogs.slice(-5).map((log, index) => (
              <View key={index} style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 4 }}>
                <ThemedText style={{ fontSize: 12 }}>
                  [{log.component}] {log.message}
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: '#666' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </ThemedText>
              </View>
            ))
          )}
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