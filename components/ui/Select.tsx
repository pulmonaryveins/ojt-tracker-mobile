import { useState } from 'react'
import { View, TouchableOpacity, Modal, FlatList } from 'react-native'
import { ThemedText } from '../themed/ThemedText'
import { ThemedCard } from '../themed/ThemedCard'
import { useTheme } from '../../hooks/useTheme'

interface SelectProps {
  label?: string
  placeholder?: string
  value: string
  options: string[]
  onValueChange: (value: string) => void
  error?: string
}

export function Select({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onValueChange,
  error,
}: SelectProps) {
  const { colors } = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  const handleSelect = (option: string) => {
    onValueChange(option)
    setModalVisible(false)
  }

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

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <ThemedText
          style={{
            fontSize: 16,
            color: value ? colors.text : colors.textMuted,
          }}
        >
          {value || placeholder}
        </ThemedText>
        <ThemedText style={{ fontSize: 16 }}>▼</ThemedText>
      </TouchableOpacity>

      {error && (
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <ThemedCard
              style={{
                width: 320,
                maxHeight: 400,
                padding: 0,
              }}
            >
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <ThemedText weight="bold" style={{ fontSize: 18 }}>
                  {label || 'Select an option'}
                </ThemedText>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: value === item ? colors.accentLight : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ThemedText
                        weight={value === item ? 'semibold' : 'normal'}
                        style={{ fontSize: 16 }}
                      >
                        {item}
                      </ThemedText>
                      {value === item && (
                        <ThemedText style={{ fontSize: 16 }}>✓</ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 300 }}
              />

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  padding: 16,
                  alignItems: 'center',
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <ThemedText weight="semibold" variant="accent">
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </ThemedCard>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}