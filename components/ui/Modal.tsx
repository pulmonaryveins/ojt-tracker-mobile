import { Modal as RNModal, View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ThemedText } from '../themed/ThemedText'
import { Button } from './Button'
import { useTheme } from '../../hooks/useTheme'

interface ModalAction {
  text: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
}

interface ModalProps {
  visible: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon?: string
  onClose: () => void
  actions?: ModalAction[]
}

export function Modal({ visible, title, message, type, icon, onClose, actions }: ModalProps) {
  const { colors } = useTheme()

  const iconColors = {
    success: '#3ba55d',
    error: '#ed4245',
    warning: '#faa81a',
    info: colors.accent,
  }

  const defaultIcons = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    warning: 'warning',
    info: 'information-circle',
  }

  const iconName = icon || defaultIcons[type]

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: iconColors[type] + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name={iconName as any} size={32} color={iconColors[type]} />
            </View>
            <ThemedText weight="bold" style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>
              {title}
            </ThemedText>
            <ThemedText variant="secondary" style={{ textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
              {message}
            </ThemedText>
          </View>

          {actions && actions.length > 0 ? (
            <View style={{ gap: 12 }}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onPress={action.onPress}
                  variant={action.variant || 'primary'}
                >
                  <ThemedText weight="semibold" style={{ color: action.variant === 'outline' ? colors.text : '#fff' }}>
                    {action.text}
                  </ThemedText>
                </Button>
              ))}
            </View>
          ) : (
            <Button onPress={onClose}>
              <ThemedText weight="semibold" style={{ color: '#fff' }}>
                Close
              </ThemedText>
            </Button>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}