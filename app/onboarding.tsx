import { useState } from 'react'
import { View, Dimensions, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '../components/themed/ThemedView'
import { ThemedText } from '../components/themed/ThemedText'
import { Button } from '../components/ui/Button'
import { useOnboardingStore } from '../stores/onboarding.store'
import { useTheme } from '../hooks/useTheme'
import { MotiView } from 'moti'

const { width } = Dimensions.get('window')

interface OnboardingSlide {
  id: string
  icon: string
  title: string
  description: string
  color: string
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'rocket-outline',
    title: 'Welcome to OJT Tracker',
    description: 'Your ultimate companion for managing and tracking your On-the-Job Training hours. Stay organized, meet your goals, and succeed in your OJT journey.',
    color: '#5865f2',
  },
  {
    id: '2',
    icon: 'timer-outline',
    title: 'Effortless Time Tracking',
    description: 'Log your work hours manually with precise start and end times. Track breaks and overtime with just a few taps.',
    color: '#3ba55d',
  },
  {
    id: '3',
    icon: 'document-text-outline',
    title: 'Create Session Reports',
    description: 'Document your daily accomplishments, tasks completed, and lessons learned. Add photos to capture important moments and memories.',
    color: '#eb459e',
  },
  {
    id: '4',
    icon: 'stats-chart-outline',
    title: 'Monitor Your Progress',
    description: 'View real-time statistics and detailed analytics. Track completed hours, remaining hours, and estimated completion dates.',
    color: '#faa81a',
  },
  {
    id: '5',
    icon: 'calendar-outline',
    title: 'Stay Organized',
    description: 'Access calendar view for visual overview, browse session history, and set up smart notifications to never miss logging your hours.',
    color: '#1abc9c',
  },
  {
    id: '6',
    icon: 'share-social-outline',
    title: 'Export & Share',
    description: 'Generate professional PDF reports with all your sessions, hours, and accomplishments. Perfect for school submissions and evaluations.',
    color: '#ed4245',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const { accentColor } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const { setOnboardingComplete } = useOnboardingStore()

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
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

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View 
      style={{ 
        width, 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <MotiView
          from={{ scale: 0, opacity: 0, rotate: '-10deg' }}
          animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
          transition={{ type: 'spring', delay: 100, damping: 15 }}
          style={{ alignItems: 'center' }}
        >
          <View
            style={{ 
              width: 176,
              height: 176,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 64,
              backgroundColor: `${item.color}10`,
              borderWidth: 4,
              borderColor: `${item.color}30`,
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <Ionicons name={item.icon as any} size={90} color={item.color} />
          </View>
        </MotiView>

        <MotiView
          from={{ translateY: 30, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'timing', delay: 250, duration: 400 }}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <View 
              style={{ 
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 8,
                backgroundColor: item.color 
              }}
            />
            <ThemedText 
              variant="secondary" 
              style={{ 
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 2,
                color: item.color, 
                fontWeight: '700' 
              }}
            >
              Step {index + 1} of {slides.length}
            </ThemedText>
          </View>
          
          <ThemedText 
            weight="bold" 
            style={{ 
              fontSize: 36,
              marginBottom: 24,
              textAlign: 'center',
              letterSpacing: -1, 
              lineHeight: 44,
              paddingHorizontal: 16,
            }}
          >
            {item.title}
          </ThemedText>
          
          <ThemedText 
            variant="secondary" 
            style={{ 
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 26, 
              opacity: 0.9,
              paddingHorizontal: 16,
              maxWidth: 400,
            }}
          >
            {item.description}
          </ThemedText>
        </MotiView>
      </View>
    </View>
  )

  return (
    <ThemedView className="flex-1">
      {/* Progress Bar */}
      <View className="absolute top-12 left-0 right-0 px-6 z-10">
        <View className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <MotiView
            animate={{
              width: `${((currentIndex + 1) / slides.length) * 100}%`,
            }}
            transition={{ type: 'timing', duration: 300 }}
            style={{
              height: '100%',
              backgroundColor: slides[currentIndex].color,
              borderRadius: 999,
            }}
          />
        </View>
      </View>

      {/* Slides */}
      <View style={{ flex: 1 }}>
        {renderSlide({ item: slides[currentIndex], index: currentIndex })}
      </View>

      {/* Pagination Dots */}
      <View className="flex-row justify-center mb-10">
        {slides.map((slide, index) => (
          <MotiView
            key={index}
            animate={{
              width: currentIndex === index ? 32 : 8,
              backgroundColor: currentIndex === index ? slide.color : '#4a4a4a',
            }}
            transition={{ type: 'timing', duration: 300 }}
            className="h-2 rounded-full mx-1.5"
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View className="px-6 pb-10">
        {currentIndex === slides.length - 1 ? (
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 100 }}
          >
            <Button 
              onPress={handleNext}
              style={{
                backgroundColor: slides[currentIndex].color,
                paddingVertical: 18,
                borderRadius: 16,
                shadowColor: slides[currentIndex].color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                  Get Started
                </ThemedText>
              </View>
            </Button>
          </MotiView>
        ) : (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleSkip}
              className="flex-1 py-4 px-6 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: '#36393f',
              }}
            >
              <ThemedText weight="semibold" style={{ fontSize: 16 }}>
                Skip
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleNext}
              className="flex-1 py-4 px-6 rounded-2xl items-center justify-center flex-row"
              style={{
                backgroundColor: slides[currentIndex].color,
                shadowColor: slides[currentIndex].color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <ThemedText weight="bold" style={{ color: '#fff', fontSize: 16, marginRight: 6 }}>
                Next
              </ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ThemedView>
  )
}