import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { Button } from '../../components/ui/Button'
import { useSessionStore } from '../../stores/session.store'
import { MotiView } from 'moti'

export default function BreakTimerModal() {
  const router = useRouter()
  const { activeSession, endBreak } = useSessionStore()
  const [breakDuration, setBreakDuration] = useState(0)

  useEffect(() => {
    if (!activeSession?.breaks.length) return

    const lastBreak = activeSession.breaks[activeSession.breaks.length - 1]
    if (!lastBreak.start || lastBreak.end) return

    const interval = setInterval(() => {
      const start = new Date(lastBreak.start)
      const now = new Date()
      const duration = (now.getTime() - start.getTime()) / 1000 // seconds
      setBreakDuration(duration)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleEndBreak = async () => {
    try {
      await endBreak(activeSession!.id)
      router.back()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ alignItems: 'center' }}
      >
        <ThemedText style={{ fontSize: 60, marginBottom: 16 }}>☕</ThemedText>
        
        <ThemedText weight="bold" style={{ fontSize: 36, marginBottom: 8 }}>
          On Break
        </ThemedText>
        
        <ThemedText variant="secondary" style={{ fontSize: 18, marginBottom: 32 }}>
          Take your time to rest
        </ThemedText>

        <ThemedText weight="bold" style={{ fontSize: 60, marginBottom: 48 }}>
          {formatTime(breakDuration)}
        </ThemedText>

        <Button size="lg" onPress={handleEndBreak}>
          Resume Work ▶️
        </Button>
      </MotiView>
    </ThemedView>
  )
}