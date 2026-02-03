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
          height: Platform.OS === 'ios' ? 82 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: Platform.OS === 'ios' ? 12 : 14,
          paddingHorizontal: 8,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarIconStyle: {
          marginTop: 0,
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
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'stats-chart' : 'stats-chart-outline'} 
                size={26} 
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
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'timer' : 'timer-outline'} 
                size={26} 
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
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <MaterialCommunityIcons 
                name={focused ? 'notebook' : 'notebook-outline'} 
                size={26} 
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
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'document-text' : 'document-text-outline'} 
                size={26} 
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
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: focused ? `${color}15` : 'transparent',
            }}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={26} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}