import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../../components/themed/ThemedView'
import { ThemedText } from '../../components/themed/ThemedText'
import { ThemedCard } from '../../components/themed/ThemedCard'
import { Button } from '../../components/ui/Button'
import { MotiView } from 'moti'

const motivationalQuotes = [
  { emoji: '🚀', quote: "Every hour logged is a step closer to your goal!" },
  { emoji: '💪', quote: "Stay consistent, stay motivated!" },
  { emoji: '🎯', quote: "Progress, not perfection!" },
  { emoji: '⭐', quote: "You're doing great! Keep going!" },
  { emoji: '🔥', quote: "Transform your effort into excellence!" },
  { emoji: '🌟', quote: "Small steps lead to big achievements!" },
  { emoji: '💡', quote: "Learn something new every day!" },
  { emoji: '🏆', quote: "Your future self will thank you!" },
]

export default function MotivationModal() {
  const router = useRouter()
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]

  return (
    <ThemedView className="flex-1 justify-center items-center px-6">
      <MotiView
        from={{ scale: 0, rotate: '-180deg' }}
        animate={{ scale: 1, rotate: '0deg' }}
        transition={{ type: 'spring', damping: 15 }}
        className="items-center mb-8"
      >
        <ThemedText className="text-8xl mb-4">{randomQuote.emoji}</ThemedText>
      </MotiView>

      <ThemedCard className="mb-8 items-center py-8">
        <ThemedText weight="bold" className="text-2xl text-center mb-4">
          {randomQuote.quote}
        </ThemedText>
        <ThemedText variant="secondary" className="text-center">
          Keep tracking your progress and achieve your OJT goals!
        </ThemedText>
      </ThemedCard>

      <Button onPress={() => router.back()}>
        Let's Go! 🚀
      </Button>
    </ThemedView>
  )
}