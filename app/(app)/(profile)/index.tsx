import { useState, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity, RefreshControl, Modal, Pressable, Image } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemedView } from '../../../components/themed/ThemedView'
import { ThemedText } from '../../../components/themed/ThemedText'
import { ThemedCard } from '../../../components/themed/ThemedCard'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/auth.store'
import { ProfileService } from '../../../services/profile.service'
import { OJTSetupService } from '../../../services/ojt-setup.service'
import { useTheme } from '../../../hooks/useTheme'
import { supabase } from '../../../lib/supabase'
import type { Database } from '../../../types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type OJTSetup = Database['public']['Tables']['ojt_setup']['Row']

export default function ProfileScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((state) => state.user)
  const authLoading = useAuthStore((state) => state.loading)
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ojtSetup, setOjtSetup] = useState<OJTSetup | null>(null)
  const [totalHours, setTotalHours] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false) // ✅ NEW

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Profile screen focused, reloading data...')
      loadProfileData()
    }, [user?.id])
  )

  const loadProfileData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const profileData = await ProfileService.getProfile(user.id)
      setProfile(profileData)
      
      const setupData = await OJTSetupService.getSetup(user.id)
      setOjtSetup(setupData)
      
      const hours = await ProfileService.getTotalHours(user.id)
      setTotalHours(hours)
      
      console.log('✅ Profile loaded')
    } catch (error) {
      console.error('❌ Error loading profile data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadProfileData()
  }, [user?.id])

  // ✅ NEW: Show confirmation modal
  const handleSignOutPress = () => {
    console.log('======================')
    console.log('🔘 Sign Out button clicked')
    console.log('======================')
    setShowSignOutModal(true)
  }

  // ✅ NEW: Actual sign out logic
  const confirmSignOut = async () => {
    console.log('✅ User confirmed sign out')
    setShowSignOutModal(false)
    
    try {
      setSigningOut(true)
      
      console.log('🔥 STEP 1: Clearing local state...')
      useAuthStore.setState({ user: null, session: null })
      
      console.log('🔥 STEP 2: Clearing AsyncStorage...')
      await AsyncStorage.clear()
      
      console.log('🔥 STEP 3: Signing out from Supabase...')
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('✅ All steps completed successfully')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('🔄 Navigating to login...')
      router.replace('/(auth)/login')
      console.log('✅ Navigation complete')
      
    } catch (error: any) {
      console.error('❌ ERROR during sign out:', error)
      setSigningOut(false)
    }
  }

  const progressPercentage = ojtSetup 
    ? Math.min((totalHours / ojtSetup.required_hours) * 100, 100)
    : 0

  const remainingHours = ojtSetup 
    ? Math.max(ojtSetup.required_hours - totalHours, 0)
    : 0

  const isDisabled = authLoading || signingOut

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
        <ThemedText style={{ marginTop: 16 }}>Loading profile...</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* ✅ Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          onPress={() => setShowSignOutModal(false)}
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
                  backgroundColor: '#ed424520',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="log-out" size={32} color="#ed4245" />
              </View>
              <ThemedText weight="bold" style={{ fontSize: 24, marginBottom: 8 }}>
                Sign Out
              </ThemedText>
              <ThemedText variant="secondary" style={{ textAlign: 'center', fontSize: 15 }}>
                Are you sure you want to sign out?
              </ThemedText>
            </View>

            <View style={{ gap: 12 }}>
              <Button
                onPress={confirmSignOut}
                disabled={signingOut}
                loading={signingOut}
                style={{ backgroundColor: '#ed4245' }}
              >
                <ThemedText weight="semibold" style={{ color: '#fff' }}>
                  {signingOut ? 'Signing Out...' : 'Yes, Sign Out'}
                </ThemedText>
              </Button>

              <Button
                variant="outline"
                onPress={() => setShowSignOutModal(false)}
                disabled={signingOut}
              >
                <ThemedText weight="semibold">Cancel</ThemedText>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
        {/* Header with Profile Picture */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 4,
              borderColor: colors.accent,
              overflow: 'hidden',
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {profile?.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={60} color={colors.accent} />
            )}
          </View>
          <ThemedText weight="bold" style={{ fontSize: 28, marginBottom: 4 }}>
            {profile?.full_name || 'User'}
          </ThemedText>
          <ThemedText variant="secondary" style={{ fontSize: 14 }}>
            {user?.email}
          </ThemedText>
        </View>

        {/* Setup Warning */}
        {(!profile?.school || 
          !profile?.workplace || 
          profile?.school.trim() === '' || 
          profile?.workplace.trim() === '' ||
          profile?.full_name?.trim() === '' ||
          !ojtSetup) && (
          <ThemedCard 
            style={{ 
              marginBottom: 24, 
              backgroundColor: '#faa81a20', 
              borderWidth: 2,
              borderColor: '#faa81a' 
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="warning" size={48} color="#faa81a" style={{ marginBottom: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                {!ojtSetup ? 'Set Up Your OJT Requirements' : 'Complete Your Profile'}
              </ThemedText>
              <ThemedText variant="secondary" style={{ textAlign: 'center', marginBottom: 16, fontSize: 14 }}>
                {!ojtSetup 
                  ? 'Configure your required hours and start date to begin tracking'
                  : 'Please fill in all your information to continue using the app'}
              </ThemedText>
              <Button 
                onPress={() => router.push(
                  !ojtSetup 
                    ? '/(app)/(profile)/ojt-setup' 
                    : '/(app)/(profile)/edit-profile'
                )}
                disabled={isDisabled}
              >
                {!ojtSetup ? '⚙️ Set Up OJT' : '✏️ Complete Profile'}
              </Button>
            </View>
          </ThemedCard>
        )}

        {/* Progress Card */}
        {ojtSetup && (
          <ThemedCard style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="bar-chart" size={24} color={colors.accent} style={{ marginRight: 12 }} />
              <ThemedText weight="bold" style={{ fontSize: 20 }}>
                OJT Progress
              </ThemedText>
            </View>

            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  {totalHours.toFixed(1)} / {ojtSetup.required_hours} hours
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 12, color: colors.accent }}>
                  {progressPercentage.toFixed(1)}%
                </ThemedText>
              </View>
              <View
                style={{
                  height: 12,
                  backgroundColor: colors.card,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: colors.accent,
                    borderRadius: 6,
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                  Completed
                </ThemedText>
                <ThemedText weight="bold" style={{ fontSize: 18, color: '#3ba55d' }}>
                  {totalHours.toFixed(1)}h
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                  Remaining
                </ThemedText>
                <ThemedText weight="bold" style={{ fontSize: 18, color: '#faa81a' }}>
                  {remainingHours.toFixed(1)}h
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                  Total Required
                </ThemedText>
                <ThemedText weight="bold" style={{ fontSize: 18, color: colors.accent }}>
                  {ojtSetup.required_hours}h
                </ThemedText>
              </View>
            </View>
          </ThemedCard>
        )}

        {/* Personal Information */}
        <View style={{ marginBottom: 24 }}>
          <ThemedText weight="bold" style={{ fontSize: 20, marginBottom: 16 }}>
            Personal Information
          </ThemedText>

          <ThemedCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                  Full Name
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                  {profile?.full_name || 'Not set'}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          <ThemedCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="school-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                  School
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                  {profile?.school || 'Not set'}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          <ThemedCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="book-education-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                  Year Level
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                  {profile?.year_level || 'Not set'}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          <ThemedCard>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                  OJT Workplace
                </ThemedText>
                <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                  {profile?.workplace || 'Not set'}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* OJT Requirements */}
        {ojtSetup && (
          <View style={{ marginBottom: 24 }}>
            <ThemedText weight="bold" style={{ fontSize: 20, marginBottom: 16 }}>
              OJT Requirements
            </ThemedText>

            <ThemedCard style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                    Required Hours
                  </ThemedText>
                  <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                    {ojtSetup.required_hours} hours
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>

            <ThemedCard style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                    Start Date
                  </ThemedText>
                  <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                    {new Date(ojtSetup.start_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </ThemedText>
                </View>
              </View>
            </ThemedCard>

            {ojtSetup.end_date && (
              <ThemedCard>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flag-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                      Expected End Date
                    </ThemedText>
                    <ThemedText weight="semibold" style={{ fontSize: 15 }}>
                      {new Date(ojtSetup.end_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </ThemedText>
                  </View>
                </View>
              </ThemedCard>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={{ marginBottom: 24 }}>
          <ThemedText weight="bold" style={{ fontSize: 20, marginBottom: 16 }}>
            Actions
          </ThemedText>

          <ThemedCard style={{ marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                try {
                  console.log('🧪 Navigating to edit-profile')
                  router.push('/(app)/(profile)/edit-profile')
                } catch (error) {
                  console.error('❌ Navigation error to edit-profile:', error)
                  Alert.alert('Navigation Error', 'Failed to navigate to Edit Profile screen')
                }
              }}
              disabled={isDisabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText weight="semibold" style={{ fontSize: 15, marginBottom: 2 }}>
                  Edit Profile
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  Update your personal information
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </ThemedCard>

          <ThemedCard style={{ marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                try {
                  console.log('🧪 Navigating to ojt-setup')
                  router.push('/(app)/(profile)/ojt-setup')
                } catch (error) {
                  console.error('❌ Navigation error to ojt-setup:', error)
                  Alert.alert('Navigation Error', 'Failed to navigate to OJT Setup screen')
                }
              }}
              disabled={isDisabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="settings-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText weight="semibold" style={{ fontSize: 15, marginBottom: 2 }}>
                  {ojtSetup ? 'Update OJT Setup' : 'Set Up OJT'}
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  {ojtSetup ? 'Modify your OJT requirements' : 'Configure your OJT hours and dates'}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </ThemedCard>

          <ThemedCard>
            <TouchableOpacity
              onPress={() => router.push('/(app)/(profile)/settings')}
              disabled={isDisabled}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="cog-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText weight="semibold" style={{ fontSize: 15, marginBottom: 2 }}>
                  Settings
                </ThemedText>
                <ThemedText variant="secondary" style={{ fontSize: 12 }}>
                  App preferences and customization
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </ThemedCard>
        </View>

        {/* ✅ Sign Out Button - USES MODAL NOW */}
        <Button
          variant="outline"
          onPress={handleSignOutPress}
          loading={signingOut}
          disabled={isDisabled}
          style={{
            borderColor: '#ed4245',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="log-out-outline" size={18} color="#ed4245" style={{ marginRight: 8 }} />
            <ThemedText weight="semibold" style={{ color: '#ed4245' }}>
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </ThemedText>
          </View>
        </Button>

        {/* Footer */}
        <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <ThemedText variant="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
            Member since {profile?.created_at 
              ? new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })
              : 'Unknown'}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  )
}