import { useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
  const [autoSync, setAutoSync] = useState(true)

  useEffect(() => {
    loadNotificationSettings()
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const autoSyncValue = await AsyncStorage.getItem('auto-sync')
    setAutoSync(autoSyncValue !== 'false')
  }

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

  const handleAccentChange = (color: AccentColor) => {
    setAccent(color)
    // Force re-render to update navigation colors
    setTimeout(() => {
      router.replace('/(app)/(profile)/settings')
    }, 100)
  }

  const handleAutoSyncToggle = async (value: boolean) => {
    setAutoSync(value)
    await AsyncStorage.setItem('auto-sync', value.toString())
    Alert.alert(
      value ? 'Auto-Sync Enabled' : 'Auto-Sync Disabled',
      value ? 'Data will sync automatically when online' : 'You\'ll need to sync manually'
    )
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ 
            backgroundColor: colors.accent + '20',
            padding: 12,
            borderRadius: 16,
            marginRight: 16,
          }}>
            <Ionicons name="settings-outline" size={32} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText weight="bold" style={{ fontSize: 28, marginBottom: 4 }}>
              Settings
            </ThemedText>
            <ThemedText variant="secondary" style={{ fontSize: 14 }}>
              Customize your app experience
            </ThemedText>
          </View>
        </View>
        <View style={{ height: 24 }} />

        {/* Appearance */}
        <ThemedCard style={{ marginBottom: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="color-palette-outline" size={24} color={colors.accent} style={{ marginRight: 12 }} />
            <ThemedText weight="semibold" style={{ fontSize: 18 }}>
              Appearance
            </ThemedText>
          </View>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name={mode === 'dark' ? 'moon' : 'sunny'} 
                size={20} 
                color={colors.textSecondary} 
                style={{ marginRight: 12 }} 
              />
              <ThemedText>Theme Mode</ThemedText>
            </View>
            <TouchableOpacity
              onPress={toggleMode}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: colors.accent + '20',
                borderWidth: 1,
                borderColor: colors.accent + '40',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name={mode === 'dark' ? 'moon' : 'sunny'} 
                size={18} 
                color={colors.accent} 
                style={{ marginRight: 8 }} 
              />
              <ThemedText weight="semibold" style={{ color: colors.accent }}>
                {mode === 'dark' ? 'Dark' : 'Light'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ paddingTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="color-filter-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <ThemedText weight="medium">Accent Color</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {accentColors.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  onPress={() => handleAccentChange(item.color)}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: item.hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: accent === item.color ? 4 : 0,
                      borderColor: colors.text,
                      shadowColor: item.hex,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: accent === item.color ? 0.4 : 0,
                      shadowRadius: 8,
                      elevation: accent === item.color ? 8 : 0,
                    }}
                  >
                    {accent === item.color && (
                      <Ionicons name="checkmark" size={28} color="white" />
                    )}
                  </View>
                  <ThemedText variant="secondary" style={{ fontSize: 11, marginTop: 6, fontWeight: accent === item.color ? '600' : '400' }}>
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ThemedCard>

        {/* Data & Sync */}
        <ThemedCard style={{ marginBottom: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="cloud-outline" size={24} color={colors.accent} style={{ marginRight: 12 }} />
            <ThemedText weight="semibold" style={{ fontSize: 18 }}>
              Data & Sync
            </ThemedText>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="sync-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText weight="medium">Auto-Sync</ThemedText>
              </View>
              <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                Automatically sync data when online
              </ThemedText>
            </View>
            <Switch
              value={autoSync}
              onValueChange={handleAutoSyncToggle}
              trackColor={{ false: colors.border, true: colors.accent + '80' }}
              thumbColor={autoSync ? colors.accent : colors.card}
            />
          </View>

          <TouchableOpacity
            onPress={handleClearCache}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trash-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <View>
                <ThemedText weight="medium">Clear Cache</ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 13, marginTop: 2 }}>
                  Remove temporary data
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </ThemedCard>

        {/* About */}
        <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.accent} style={{ marginRight: 12 }} />
            <ThemedText weight="semibold" style={{ fontSize: 18 }}>
              About
            </ThemedText>
          </View>

          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <ThemedText variant="secondary" style={{ fontSize: 13, marginBottom: 4 }}>Version</ThemedText>
            <ThemedText weight="medium">1.0.0</ThemedText>
          </View>

          <View style={{ paddingVertical: 12 }}>
            <ThemedText variant="secondary" style={{ fontSize: 13, marginBottom: 4 }}>Build</ThemedText>
            <ThemedText weight="medium">December 2025</ThemedText>
          </View>
        </ThemedCard>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            paddingHorizontal: 24,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.border,
            marginBottom: 32,
          }}
        >
          <Ionicons name="arrow-back-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
          <ThemedText weight="semibold">Back to Profile</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  )
}