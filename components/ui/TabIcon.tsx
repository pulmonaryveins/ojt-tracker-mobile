import { View, Text } from 'react-native'

interface TabIconProps {
  emoji: string
  focused: boolean
  color: string
}

export function TabIcon({ emoji, focused, color }: TabIconProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: focused ? `${color}20` : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: focused ? 26 : 24,
          opacity: focused ? 1 : 0.6,
        }}
      >
        {emoji}
      </Text>
    </View>
  )
}