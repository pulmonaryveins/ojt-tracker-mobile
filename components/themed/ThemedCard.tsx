import { View, type ViewProps } from 'react-native'
import { useTheme } from '../../hooks/useTheme'

interface ThemedCardProps extends ViewProps {
  children?: React.ReactNode
}

export function ThemedCard({ style, children, ...props }: ThemedCardProps) {
  const { colors } = useTheme()

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}