import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { useOnboardingStore } from '../../../stores/onboarding.store'

interface FAQItem {
  question: string
  answer: string
  emoji: string
}

const faqs: FAQItem[] = [
  {
    emoji: '⏱️',
    question: 'How do I start tracking my time?',
    answer: 'Go to the Tracker tab and tap "Clock In". Your session will start automatically.',
  },
  {
    emoji: '☕',
    question: 'How do I take a break?',
    answer: 'During an active session, tap "Take Break". Your time will pause until you tap "End Break".',
  },
  {
    emoji: '📝',
    question: 'How do I log my daily activities?',
    answer: 'When you clock out, you\'ll be prompted to enter tasks, lessons learned, and optional notes.',
  },
  {
    emoji: '📷',
    question: 'Can I add images to my logs?',
    answer: 'Yes! When logging out, you can add up to 3 images from your camera or gallery.',
  },
  {
    emoji: '📄',
    question: 'How do I export my reports?',
    answer: 'Go to History, select a session, and tap "Export as PDF". You can also export all sessions from the main History screen.',
  },
  {
    emoji: '🎨',
    question: 'How do I change the theme?',
    answer: 'Go to Profile → Settings to switch between light/dark mode and choose your accent color.',
  },
  {
    emoji: '🔄',
    question: 'What if I lose internet connection?',
    answer: 'Don\'t worry! The app works offline. Your data will sync automatically when you\'re back online.',
  },
  {
    emoji: '🎯',
    question: 'How do I set my OJT requirements?',
    answer: 'Go to Profile → OJT Configuration to set your required hours and target dates.',
  },
]

export default function HelpScreen() {
  const router = useRouter()
  const { resetOnboarding } = useOnboardingStore()

  const handleReplayTutorial = () => {
    resetOnboarding()
    router.replace('/onboarding')
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-6 py-8">
        <ThemedText weight="bold" className="text-3xl mb-2">
          Help & Support 💡
        </ThemedText>
        <ThemedText variant="secondary" className="text-base mb-8">
          Everything you need to know
        </ThemedText>

        {/* Quick Actions */}
        <ThemedCard className="mb-6">
          <ThemedText variant="secondary" className="text-sm mb-4">
            📚 Quick Start
          </ThemedText>
          
          <Button
            variant="outline"
            onPress={handleReplayTutorial}
            className="mb-3"
          >
            🎓 Replay Tutorial
          </Button>
          
          <Button
            variant="outline"
            onPress={() => router.push('/(app)/(dashboard)')}
          >
            🚀 Go to Dashboard
          </Button>
        </ThemedCard>

        {/* FAQs */}
        <ThemedText weight="bold" className="text-2xl mb-4">
          Frequently Asked Questions
        </ThemedText>

        {faqs.map((faq, index) => (
          <ThemedCard key={index} className="mb-3">
            <View className="flex-row items-start mb-2">
              <ThemedText className="text-2xl mr-3">{faq.emoji}</ThemedText>
              <View className="flex-1">
                <ThemedText weight="semibold" className="text-base mb-2">
                  {faq.question}
                </ThemedText>
                <ThemedText variant="secondary" className="text-sm leading-5">
                  {faq.answer}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>
        ))}

        {/* Contact Support */}
        <ThemedCard className="mt-4 mb-8">
          <ThemedText weight="bold" className="text-lg mb-2">
            Still need help? 🤝
          </ThemedText>
          <ThemedText variant="secondary" className="mb-4">
            Contact us for additional support
          </ThemedText>
          <Button variant="outline">
            📧 Contact Support
          </Button>
        </ThemedCard>

        <Button onPress={() => router.back()}>
          Back to Settings
        </Button>
      </ScrollView>
    </ThemedView>
  )
}