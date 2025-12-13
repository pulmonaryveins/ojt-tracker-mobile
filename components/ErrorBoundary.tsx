import React, { Component, ReactNode } from 'react'
import { View, ScrollView } from 'react-native'
import { ThemedView } from './themed/ThemedView'
import { ThemedText } from './themed/ThemedText'
import { ThemedCard } from './themed/ThemedCard'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('🚨 Error info:', errorInfo)
    
    // Log to a service or storage that can be accessed later
    this.logErrorToStorage(error, errorInfo)
    
    this.setState({ error, errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  private logErrorToStorage = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        platform: 'android', // We know this is happening on Android
      }
      
      // Store error for debugging
      const AsyncStorage = require('@react-native-async-storage/async-storage').default
      const existingErrors = await AsyncStorage.getItem('app_errors') || '[]'
      const errors = JSON.parse(existingErrors)
      errors.push(errorData)
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10)
      }
      
      await AsyncStorage.setItem('app_errors', JSON.stringify(errors))
      console.log('✅ Error logged to storage for debugging')
    } catch (storageError) {
      console.error('❌ Failed to log error to storage:', storageError)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ThemedView style={{ flex: 1, padding: 20 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedCard style={{ padding: 24, marginBottom: 20 }}>
              <ThemedText weight="bold" style={{ fontSize: 24, marginBottom: 16, color: '#ef4444' }}>
                Oops! Something went wrong
              </ThemedText>
              
              <ThemedText style={{ fontSize: 16, marginBottom: 20, lineHeight: 24 }}>
                This screen encountered an error and couldn't load properly. This helps us identify and fix the issue.
              </ThemedText>

              <View style={{ backgroundColor: '#f8f8f8', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <ThemedText weight="semibold" style={{ fontSize: 14, marginBottom: 8 }}>
                  Error Details:
                </ThemedText>
                <ThemedText style={{ fontSize: 12, fontFamily: 'monospace', color: '#666' }}>
                  {this.state.error?.message || 'Unknown error'}
                </ThemedText>
              </View>

              <Button onPress={this.handleRetry} style={{ marginBottom: 12 }}>
                Try Again
              </Button>
              
              <Button 
                onPress={() => {
                  // Navigate back to profile safely
                  require('expo-router').router.replace('/(app)/(profile)')
                }}
                variant="outline"
              >
                Back to Profile
              </Button>
            </ThemedCard>

            {__DEV__ && (
              <ThemedCard style={{ padding: 16 }}>
                <ThemedText weight="semibold" style={{ fontSize: 14, marginBottom: 8 }}>
                  Debug Info (Dev Mode):
                </ThemedText>
                <ThemedText style={{ fontSize: 10, fontFamily: 'monospace', color: '#666' }}>
                  {this.state.error?.stack}
                </ThemedText>
                {this.state.errorInfo && (
                  <ThemedText style={{ fontSize: 10, fontFamily: 'monospace', color: '#666', marginTop: 8 }}>
                    {this.state.errorInfo.componentStack}
                  </ThemedText>
                )}
              </ThemedCard>
            )}
          </ScrollView>
        </ThemedView>
      )
    }

    return this.props.children
  }
}