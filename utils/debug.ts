import AsyncStorage from '@react-native-async-storage/async-storage'

export class DebugUtils {
  // Get all debug logs stored on device
  static async getDebugLogs() {
    try {
      const logs = await AsyncStorage.getItem('debug_logs') || '[]'
      return JSON.parse(logs)
    } catch (error) {
      console.error('Failed to get debug logs:', error)
      return []
    }
  }

  // Get all error logs stored on device
  static async getErrorLogs() {
    try {
      const errors = await AsyncStorage.getItem('app_errors') || '[]'
      return JSON.parse(errors)
    } catch (error) {
      console.error('Failed to get error logs:', error)
      return []
    }
  }

  // Clear all logs
  static async clearLogs() {
    try {
      await AsyncStorage.multiRemove(['debug_logs', 'app_errors'])
      console.log('✅ All logs cleared')
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  // Export logs as JSON string for sharing
  static async exportLogs() {
    try {
      const debugLogs = await this.getDebugLogs()
      const errorLogs = await this.getErrorLogs()
      
      return JSON.stringify({
        debugLogs,
        errorLogs,
        exportedAt: new Date().toISOString(),
        platform: 'android'
      }, null, 2)
    } catch (error) {
      console.error('Failed to export logs:', error)
      return null
    }
  }

  // Add system info to logs
  static async logSystemInfo() {
    try {
      const { Platform, Dimensions } = require('react-native')
      const { Constants } = require('expo-constants')
      
      const systemInfo = {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        appVersion: Constants.expoConfig?.version,
        screenDimensions: Dimensions.get('screen'),
        timestamp: new Date().toISOString()
      }

      const existingLogs = await AsyncStorage.getItem('debug_logs') || '[]'
      const logs = JSON.parse(existingLogs)
      logs.push({
        timestamp: systemInfo.timestamp,
        component: 'SystemInfo',
        message: 'System information',
        data: systemInfo
      })

      await AsyncStorage.setItem('debug_logs', JSON.stringify(logs))
      console.log('✅ System info logged:', systemInfo)
    } catch (error) {
      console.error('Failed to log system info:', error)
    }
  }
}

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = () => {
  if (__DEV__) {
    // Only in development, add global error handlers
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Log to storage as well as console
      DebugUtils.getDebugLogs().then(logs => {
        const newLogs = [...logs, {
          timestamp: new Date().toISOString(),
          component: 'GlobalError',
          message: 'Console error',
          data: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
        }]
        AsyncStorage.setItem('debug_logs', JSON.stringify(newLogs.slice(-50)))
      })
      
      originalConsoleError(...args)
    }
  }
}