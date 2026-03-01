import { Tabs } from 'expo-router'
import { useTheme } from '../../hooks/useTheme'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { View, TouchableOpacity, Platform } from 'react-native'

export default function AppLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
          paddingHorizontal: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      {/* Hidden index route */}
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="(dashboard)"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: focused ? `${color}18` : 'transparent',
            }}>
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="(logs)"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: focused ? `${color}18` : 'transparent',
            }}>
              <MaterialCommunityIcons
                name={focused ? 'notebook' : 'notebook-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Centre FAB — Create Entry */}
      <Tabs.Screen
        name="(tracker)"
        options={{
          title: 'Add Entry',
          tabBarLabel: () => null,
          tabBarButton: ({ onPress, onLongPress, accessibilityLabel, accessibilityState }) => (
            <TouchableOpacity
              onPress={onPress ?? undefined}
              onLongPress={onLongPress ?? undefined}
              accessibilityLabel={accessibilityLabel}
              accessibilityState={accessibilityState}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: Platform.OS === 'ios' ? 20 : 8,
              }}
              activeOpacity={0.85}
            >
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 2,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 6,
              }}>
                <Ionicons name="add" size={28} color="#ffffff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="(reports)"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: focused ? `${color}18` : 'transparent',
            }}>
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: focused ? `${color}18` : 'transparent',
            }}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}
