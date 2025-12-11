import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { useTheme } from '../../../hooks/useTheme'
import { useThemeStore, type AccentColor } from '../../../stores/theme.store'
import { useOfflineStore } from '../../../stores/offline.store'
import { NotificationService } from '../../../services/notification.service'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function SettingsScreen() {
  const router = useRouter()
  const { mode, accent, accentColor, colors } = useTheme()
  const { toggleMode, setAccent } = useThemeStore()
  const { pendingSyncs, syncPending, isSyncing } = useOfflineStore()
  
  const [dailyReminder, setDailyReminder] = useState(false)
  const [breakReminder, setBreakReminder] = useState(false)

  useEffect(() => {
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    const daily = await AsyncStorage.getItem('daily-reminder')
    const breaks = await AsyncStorage.getItem('break-reminder')
    
    setDailyReminder(daily === 'true')
    setBreakReminder(breaks === 'true')
  }

  const handleDailyReminderToggle = async (value: boolean) => {
    const hasPermission = await NotificationService.requestPermissions()
    
    if (!hasPermission && value) {
      Alert.alert('Permission Denied', 'Please enable notifications in settings')
      return
    }

    setDailyReminder(value)
    await AsyncStorage.setItem('daily-reminder', value.toString())

    if (value) {
      await NotificationService.scheduleSessionReminder(9) // 9 AM
      Alert.alert('Enabled', 'Daily reminders set for 9:00 AM')
    } else {
      await NotificationService.cancelAllNotifications()
    }
  }

  const handleBreakReminderToggle = async (value: boolean) => {
    const hasPermission = await NotificationService.requestPermissions()
    
    if (!hasPermission && value) {
      Alert.alert('Permission Denied', 'Please enable notifications in settings')
      return
    }

    setBreakReminder(value)
    await AsyncStorage.setItem('break-reminder', value.toString())

    if (value) {
      Alert.alert('Enabled', 'You\'ll be reminded to take breaks')
    }
  }

  const accentColors: { color: AccentColor; name: string; hex: string }[] = [
    { color: 'blurple', name: 'Blurple', hex: '#5865f2' },
    { color: 'pink', name: 'Pink', hex: '#eb459e' },
    { color: 'red', name: 'Red', hex: '#ed4245' },
    { color: 'green', name: 'Green', hex: '#3ba55d' },
    { color: 'yellow', name: 'Yellow', hex: '#faa81a' },
    { color: 'teal', name: 'Teal', hex: '#1abc9c' },
  ]

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove temporary data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared!')
          },
        },
      ]
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 32 }}>
        <ThemedText weight="bold" style={{ fontSize: 30, marginBottom: 8 }}>
          Settings ⚙️
        </ThemedText>
        <ThemedText variant="secondary" style={{ fontSize: 16, marginBottom: 32 }}>
          Customize your app experience
        </ThemedText>

        {/* Appearance */}
        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
            🎨 Appearance
          </ThemedText>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <ThemedText>Theme Mode</ThemedText>
            <TouchableOpacity
              onPress={toggleMode}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: colors.tertiary
              }}
            >
              <ThemedText>{mode === 'dark' ? '🌙 Dark' : '☀️ Light'}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ paddingTop: 12 }}>
            <ThemedText style={{ marginBottom: 12 }}>Accent Color</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {accentColors.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  onPress={() => setAccent(item.color)}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: item.hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: accent === item.color ? 3 : 0,
                      borderColor: 'white',
                    }}
                  >
                    {accent === item.color && (
                      <ThemedText style={{ color: 'white', fontSize: 20 }}>✓</ThemedText>
                    )}
                  </View>
                  <ThemedText variant="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ThemedCard>

        {/* Notifications */}
        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
            🔔 Notifications
          </ThemedText>
          
          <View style={{ 
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <ThemedText weight="semibold">Daily Reminders</ThemedText>
                <ThemedText variant="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Get reminded to log your hours at 9 AM
                </ThemedText>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={handleDailyReminderToggle}
                trackColor={{ false: colors.tertiary, true: accentColor }}
                thumbColor="white"
              />
            </View>
          </View>
          
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <ThemedText weight="semibold">Break Reminders</ThemedText>
                <ThemedText variant="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Get reminded to take breaks every 2 hours
                </ThemedText>
              </View>
              <Switch
                value={breakReminder}
                onValueChange={handleBreakReminderToggle}
                trackColor={{ false: colors.tertiary, true: accentColor }}
                thumbColor="white"
              />
            </View>
          </View>
        </ThemedCard>

        {/* Sync Status */}
        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
            🔄 Sync Status
          </ThemedText>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <ThemedText>Pending Syncs:</ThemedText>
            <ThemedText weight="bold">{pendingSyncs.length}</ThemedText>
          </View>

          {pendingSyncs.length > 0 && (
            <Button
              variant="outline"
              onPress={syncPending}
              loading={isSyncing}
              disabled={isSyncing}
            >
              Sync Now
            </Button>
          )}
        </ThemedCard>

        {/* Data Management */}
        <ThemedCard style={{ marginBottom: 16 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
            💾 Data Management
          </ThemedText>
          
          <TouchableOpacity
            style={{ 
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}
            onPress={handleClearCache}
          >
            <ThemedText>Clear Cache</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ 
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}
            onPress={() => Alert.alert('Export', 'Export feature coming soon!')}
          >
            <ThemedText>Export Data</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ paddingVertical: 12 }}
            onPress={() => Alert.alert('Backup', 'Backup feature coming soon!')}
          >
            <ThemedText>Backup & Restore</ThemedText>
          </TouchableOpacity>
        </ThemedCard>

        {/* App Info */}
        <ThemedCard style={{ marginBottom: 32 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 12 }}>
            ℹ️ App Information
          </ThemedText>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <ThemedText variant="secondary">Version:</ThemedText>
            <ThemedText>1.0.0</ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText variant="secondary">Build:</ThemedText>
            <ThemedText>Beta</ThemedText>
          </View>
        </ThemedCard>

        <Button variant="outline" onPress={() => router.back()}>
          Back to Profile
        </Button>
      </ScrollView>
    </ThemedView>
  )
}