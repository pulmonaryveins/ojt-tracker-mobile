import { TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from 'react-native'
import { ThemedText } from '../themed/ThemedText'
import { useTheme } from '../../hooks/useTheme'

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const { accentColor, colors } = useTheme()

  const getBackgroundColor = () => {
    if (disabled || loading) return colors.tertiary
    switch (variant) {
      case 'primary':
        return accentColor
      case 'secondary':
        return colors.secondary
      case 'outline':
        return 'transparent'
      case 'danger':
        return colors.error
      default:
        return accentColor
    }
  }

  const getTextColor = () => {
    if (variant === 'outline') return colors.text
    return '#ffffff'
  }

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 }
      case 'md':
        return { paddingVertical: 14, paddingHorizontal: 20 }
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 32 }
      default:
        return { paddingVertical: 14, paddingHorizontal: 20 }
    }
  }

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14
      case 'md':
        return 16
      case 'lg':
        return 18
      default:
        return 16
    }
  }

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        typeof children === 'string' ? (
          <ThemedText
            weight="semibold"
            style={{
              color: getTextColor(),
              fontSize: getFontSize(),
            }}
          >
            {children}
          </ThemedText>
        ) : (
          children
        )
      )}
    </TouchableOpacity>
  )
}