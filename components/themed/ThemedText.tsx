import { Text, type TextProps } from 'react-native'
import { useTheme } from '../../hooks/useTheme'

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'muted' | 'accent'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  children?: React.ReactNode
}

export function ThemedText({
  variant = 'primary',
  weight = 'normal',
  style,
  children,
  ...props
}: ThemedTextProps) {
  const { colors } = useTheme()

  const getColor = () => {
    switch (variant) {
      case 'primary':
        return colors.text
      case 'secondary':
        return colors.textSecondary
      case 'muted':
        return colors.textMuted
      case 'accent':
        return colors.accent
      default:
        return colors.text
    }
  }

  const getFontWeight = () => {
    switch (weight) {
      case 'normal':
        return '400'
      case 'medium':
        return '500'
      case 'semibold':
        return '600'
      case 'bold':
        return '700'
      default:
        return '400'
    }
  }

  return (
    <Text
      style={[
        {
          color: getColor(),
          fontWeight: getFontWeight(),
          fontSize: 14,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}