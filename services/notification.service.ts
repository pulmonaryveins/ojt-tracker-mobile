import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications')
      return false
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return false
    }

    // For Android, set notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5865f2',
      })
    }

    return true
  }

  static async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      })
      return token.data
    } catch (error) {
      console.error('Error getting push token:', error)
      return null
    }
  }

  static async scheduleSessionReminder(hours: number = 9): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()

    // Use CalendarTriggerInput for daily repeating notifications
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏱️ Time to Log Your OJT',
        body: "Don't forget to track your hours today!",
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    })
  }

  static async scheduleBreakReminder(minutes: number = 120): Promise<void> {
    // Use TimeIntervalTriggerInput for time-based notifications
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☕ Take a Break',
        body: "You've been working for 2 hours. Time for a short break!",
        sound: true,
      },
      trigger: {
        seconds: minutes * 60,
        repeats: false,
      } as Notifications.TimeIntervalTriggerInput,
    })
  }

  static async sendLocalNotification(
    title: string,
    body: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Send immediately
    })
  }

  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync()
  }
}