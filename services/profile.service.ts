import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export class ProfileService {
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Profile not found for user:', userId)
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  }

  static async createProfile(profile: ProfileInsert): Promise<Profile> {
    try {
      console.log('📝 Creating profile with data:', {
        id: profile.id,
        full_name: profile.full_name,
        school: profile.school,
        year_level: profile.year_level,
        workplace: profile.workplace,
      })

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: profile.id,
          full_name: profile.full_name,
          school: profile.school,
          year_level: profile.year_level,
          workplace: profile.workplace,
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error creating profile:', error)
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }

      console.log('✅ Profile created:', data.full_name)
      return data
    } catch (error) {
      console.error('❌ Error creating profile:', error)
      throw error
    }
  }

  static async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<Profile> {
    try {
      console.log('🔄 Updating profile for user:', userId)
      console.log('📝 Update data:', updates)

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error updating profile:', error)
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }

      console.log('✅ Profile updated successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }
  }

  // Helper method to get total hours from sessions
  static async getTotalHours(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('total_hours')
        .eq('user_id', userId)

      if (error) throw error

      const total = data.reduce((sum, session) => sum + (session.total_hours || 0), 0)
      return total
    } catch (error) {
      console.error('Error calculating total hours:', error)
      return 0
    }
  }
}