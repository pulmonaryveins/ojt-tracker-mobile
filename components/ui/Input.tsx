import { View, TextInput, type TextInputProps } from 'react-native'
import { ThemedText } from '../themed/ThemedText'
import { useTheme } from '../../hooks/useTheme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors } = useTheme()

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <ThemedText
          variant="secondary"
          weight="medium"
          style={{
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {label}
        </ThemedText>
      )}
      
      <TextInput
        style={[
          {
            backgroundColor: colors.secondary,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            fontSize: 16,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      
      {error && typeof error === 'string' && (
        <ThemedText
          style={{
            color: colors.error,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {error}
        </ThemedText>
      )}
    </View>
  )
}