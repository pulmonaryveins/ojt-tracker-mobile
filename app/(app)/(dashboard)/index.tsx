import { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Dimensions } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { useAuthStore } from '../../../stores/auth.store'
import { ProfileService } from '../../../services/profile.service'
import { OJTSetupService } from '../../../services/ojt-setup.service'
import { useTheme } from '../../../hooks/useTheme'
import type { Database } from '../../../types/supabase'

type OJTSetup = Database['public']['Tables']['ojt_setup']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ojtSetup, setOjtSetup] = useState<OJTSetup | null>(null)
  const [totalHours, setTotalHours] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadDashboardData()
    }, [user?.id])
  )

  const loadDashboardData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const [profileData, setupData, hours] = await Promise.all([
        ProfileService.getProfile(user.id),
        OJTSetupService.getSetup(user.id),
        ProfileService.getTotalHours(user.id),
      ])
      
      setProfile(profileData)
      setOjtSetup(setupData)
      setTotalHours(hours)
      
      console.log('✅ Dashboard data loaded')
    } catch (error) {
      console.error('❌ Error loading dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadDashboardData()
  }, [user?.id])

  const progressPercentage = ojtSetup 
    ? Math.min((totalHours / ojtSetup.required_hours) * 100, 100)
    : 0

  const remainingHours = ojtSetup 
    ? Math.max(ojtSetup.required_hours - totalHours, 0)
    : 0

  const daysRemaining = ojtSetup?.end_date
    ? Math.max(0, Math.ceil((new Date(ojtSetup.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="stats-chart-outline" size={64} color={colors.textSecondary} />
        <ThemedText style={{ marginTop: 16 }}>Loading dashboard...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <ThemedText variant="secondary" style={{ fontSize: 14, marginBottom: 4 }}>
            Welcome back,
          </ThemedText>
          <ThemedText weight="bold" style={{ fontSize: 32 }}>
            {profile?.full_name || 'Student'}
          </ThemedText>
        </View>

        {/* Main Progress Card */}
        {ojtSetup ? (
          <ThemedCard 
            style={{ 
              marginBottom: 24, 
              padding: 24,
              backgroundColor: colors.accent + '15',
              borderWidth: 2,
              borderColor: colors.accent + '40',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent + '30',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons name="trophy" size={28} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText weight="bold" style={{ fontSize: 22, marginBottom: 2 }}>
                  OJT Progress
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                  {progressPercentage >= 100 ? 'Completed!' : 'Keep up the great work!'}
                </ThemedText>
              </View>
            </View>

            {/* Progress Circle or Bar */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <ThemedText variant="secondary" style={{ fontSize: 13 }}>
                  {totalHours.toFixed(1)} of {ojtSetup.required_hours} hours
                </ThemedText>
                <ThemedText weight="bold" style={{ fontSize: 13, color: colors.accent }}>
                  {progressPercentage.toFixed(1)}%
                </ThemedText>
              </View>
              
              <View
                style={{
                  height: 16,
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: colors.accent,
                    borderRadius: 8,
                  }}
                />
              </View>
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color="#3ba55d" style={{ marginBottom: 8 }} />
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                  Completed
                </ThemedText>
                <ThemedText weight="bold" style={{ fontSize: 20, color: '#3ba55d' }}>
                  {totalHours.toFixed(0)}h
                </ThemedText>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="hourglass-outline" size={24} color="#faa81a" style={{ marginBottom: 8 }} />
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                  Remaining
                </ThemedText>
                <ThemedText weight="bold" style={{ fontSize: 20, color: '#faa81a' }}>
                  {remainingHours.toFixed(0)}h
                </ThemedText>
              </View>

              {daysRemaining !== null && (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="calendar" size={24} color={colors.accent} style={{ marginBottom: 8 }} />
                  <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                    Days Left
                  </ThemedText>
                  <ThemedText weight="bold" style={{ fontSize: 20, color: colors.accent }}>
                    {daysRemaining}
                  </ThemedText>
                </View>
              )}
            </View>
          </ThemedCard>
        ) : (
          <ThemedCard style={{ marginBottom: 24, backgroundColor: '#faa81a20', borderWidth: 2, borderColor: '#faa81a' }}>
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Ionicons name="warning" size={48} color="#faa81a" style={{ marginBottom: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                Set Up Your OJT
              </ThemedText>
              <ThemedText variant="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
                Configure your requirements to start tracking
              </ThemedText>
            </View>
          </ThemedCard>
        )}

        {/* Quick Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <ThemedCard style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="school-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <ThemedText variant="secondary" style={{ fontSize: 11 }}>
                School
              </ThemedText>
            </View>
            <ThemedText weight="semibold" style={{ fontSize: 13 }} numberOfLines={1}>
              {profile?.school || 'Not set'}
            </ThemedText>
          </ThemedCard>

          <ThemedCard style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="briefcase-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <ThemedText variant="secondary" style={{ fontSize: 11 }}>
                Workplace
              </ThemedText>
            </View>
            <ThemedText weight="semibold" style={{ fontSize: 13 }} numberOfLines={1}>
              {profile?.workplace || 'Not set'}
            </ThemedText>
          </ThemedCard>
        </View>

        {/* OJT Timeline */}
        {ojtSetup && (
          <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="calendar-outline" size={24} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 18 }}>
                OJT Timeline
              </ThemedText>
            </View>

            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="play-circle" size={18} color="#3ba55d" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                    Start Date
                  </ThemedText>
                  <ThemedText weight="semibold" style={{ fontSize: 14 }}>
                    {new Date(ojtSetup.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </View>
              </View>

              {ojtSetup.end_date && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="flag" size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                      Target End Date
                    </ThemedText>
                    <ThemedText weight="semibold" style={{ fontSize: 14 }}>
                      {new Date(ojtSetup.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </ThemedCard>
        )}

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 16 }}>
            Quick Actions
          </ThemedText>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ThemedCard style={{ flex: 1, padding: 20, alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="timer" size={24} color={colors.accent} />
              </View>
              <ThemedText weight="semibold" style={{ fontSize: 13, textAlign: 'center' }}>
                Start Timer
              </ThemedText>
            </ThemedCard>

            <ThemedCard style={{ flex: 1, padding: 20, alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <MaterialCommunityIcons name="notebook-outline" size={24} color={colors.accent} />
              </View>
              <ThemedText weight="semibold" style={{ fontSize: 13, textAlign: 'center' }}>
                View Logs
              </ThemedText>
            </ThemedCard>
          </View>
        </View>

        {/* Footer Info */}
        <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <ThemedText variant="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
            Last updated: {new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  )
}