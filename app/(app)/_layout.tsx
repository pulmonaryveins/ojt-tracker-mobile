import { Tabs } from 'expo-router'
import { useTheme } from '../../hooks/useTheme'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { View, Platform } from 'react-native'

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
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          paddingHorizontal: 4,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* Hide the index route from the tab bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
      
      <Tabs.Screen
        name="(dashboard)"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'stats-chart' : 'stats-chart-outline'} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(tracker)"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'timer' : 'timer-outline'} 
                size={22} 
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
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <MaterialCommunityIcons 
                name={focused ? 'notebook' : 'notebook-outline'} 
                size={22} 
                color={color} 
              />
            </View>
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
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'document-text' : 'document-text-outline'} 
                size={22} 
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
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}