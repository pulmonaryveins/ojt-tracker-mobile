import { useState, useRef } from 'react'
import { View, FlatList, Dimensions, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../components/themed/ThemedView'
import { ThemedText } from '../components/themed/ThemedText'
import { Button } from '../components/ui/Button'
import { useOnboardingStore } from '../stores/onboarding.store'
import { useTheme } from '../hooks/useTheme'
import { MotiView } from 'moti'

const { width } = Dimensions.get('window')

interface OnboardingSlide {
  id: string
  emoji: string
  title: string
  description: string
  color: string
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '⏱️',
    title: 'Track Your Time',
    description: 'Easily log your OJT hours with our simple time tracker. Clock in, take breaks, and clock out seamlessly.',
    color: '#5865f2',
  },
  {
    id: '2',
    emoji: '📊',
    title: 'Monitor Progress',
    description: 'View detailed statistics and track your progress towards completing your required OJT hours.',
    color: '#3ba55d',
  },
  {
    id: '3',
    emoji: '📝',
    title: 'Document Your Journey',
    description: 'Log daily tasks, lessons learned, and upload images. Export reports as PDF for submission.',
    color: '#eb459e',
  },
  {
    id: '4',
    emoji: '🎯',
    title: 'Stay Organized',
    description: 'Calendar view, session history, and smart reminders help you stay on track with your OJT goals.',
    color: '#faa81a',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const { accentColor } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const { setOnboardingComplete } = useOnboardingStore()

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setOnboardingComplete()
    router.replace('/(auth)/login')
  }

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 100 }}
      >
        <View
          className="w-32 h-32 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: `${item.color}20` }}
        >
          <ThemedText className="text-7xl">{item.emoji}</ThemedText>
        </View>
      </MotiView>

      <MotiView
        from={{ translateY: 20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'timing', delay: 200 }}
      >
        <ThemedText weight="bold" className="text-3xl mb-4 text-center">
          {item.title}
        </ThemedText>
        
        <ThemedText variant="secondary" className="text-base text-center leading-6">
          {item.description}
        </ThemedText>
      </MotiView>
    </View>
  )

  return (
    <ThemedView className="flex-1">
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          className="absolute top-12 right-6 z-10 px-4 py-2"
        >
          <ThemedText variant="secondary" weight="semibold">
            Skip
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
        scrollEnabled={true}
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className="h-2 rounded-full mx-1"
            style={{
              width: currentIndex === index ? 24 : 8,
              backgroundColor: currentIndex === index ? accentColor : '#36393f',
            }}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View className="px-6 mb-12">
        <Button onPress={handleNext}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </ThemedView>
  )
}