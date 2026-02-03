import { View, Text } from 'react-native'
import { MotiView } from 'moti'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../utils/cn'

interface ProgressBarProps {
  progress: number // 0-100
  showPercentage?: boolean
  height?: number
  label?: string
}

export function ProgressBar({ 
  progress, 
  showPercentage = true,
  height = 30,
  label
}: ProgressBarProps) {
  const { accentColor } = useTheme()
  const clampedProgress = Math.min(Math.max(progress, 0), 100)
  
  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm mb-2 text-text-secondary">
          {label}
        </Text>
      )}
      <View 
        className="w-full rounded-full overflow-hidden bg-dark-tertiary"
        style={{ height }}
      >
        <MotiView
          className="h-full items-center justify-center"
          style={{ backgroundColor: accentColor }}
          from={{ width: '0%' }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ type: 'timing', duration: 800 }}
        >
          {showPercentage && (
            <Text className="text-white text-xs font-bold">
              {clampedProgress.toFixed(0)}%
            </Text>
          )}
        </MotiView>
      </View>
    </View>
  )
}