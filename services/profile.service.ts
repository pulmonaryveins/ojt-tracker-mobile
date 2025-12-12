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

  // Upload profile picture
  static async uploadProfilePicture(
    userId: string,
    imageUri: string
  ): Promise<string> {
    try {
      console.log('📸 Uploading profile picture for user:', userId)

      // Try Supabase Storage first
      try {
        // Convert image URI to blob
        const response = await fetch(imageUri)
        const blob = await response.blob()
        
        // Generate unique filename
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`,
            upsert: true,
          })

        if (uploadError) {
          console.warn('⚠️ Storage upload failed, using base64 fallback:', uploadError.message)
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl

        // Update profile with new picture URL
        await this.updateProfile(userId, {
          profile_picture_url: publicUrl,
        })

        console.log('✅ Profile picture uploaded to storage:', publicUrl)
        return publicUrl
      } catch (storageError: any) {
        // Fallback to base64 if storage is not configured or fails
        console.log('📦 Using base64 fallback for profile picture')
        
        const response = await fetch(imageUri)
        const blob = await response.blob()
        
        // Convert to base64
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        
        const base64Data = await base64Promise
        
        // Update profile with base64 data
        await this.updateProfile(userId, {
          profile_picture_url: base64Data,
        })

        console.log('✅ Profile picture saved as base64')
        return base64Data
      }
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:', error)
      throw new Error(
        error.message?.includes('fetch')
          ? 'Failed to read image file. Please try again.'
          : 'Failed to upload profile picture. Please try again.'
      )
    }
  }

  // Delete profile picture
  static async deleteProfilePicture(userId: string, pictureUrl: string): Promise<void> {
    try {
      // Check if it's a base64 image (starts with data:image)
      if (pictureUrl.startsWith('data:image')) {
        // Just remove from profile, no storage deletion needed
        await this.updateProfile(userId, {
          profile_picture_url: null,
        })
        console.log('✅ Base64 profile picture removed')
        return
      }

      // Extract file path from URL for storage images
      const urlParts = pictureUrl.split('/profile-pictures/')
      if (urlParts.length < 2) {
        // Just update profile if we can't parse the URL
        await this.updateProfile(userId, {
          profile_picture_url: null,
        })
        return
      }

      const filePath = urlParts[1]

      // Delete from storage
      const { error } = await supabase.storage
        .from('profile-pictures')
        .remove([filePath])

      if (error) {
        console.warn('⚠️ Could not delete from storage:', error.message)
      }

      // Update profile to remove picture URL
      await this.updateProfile(userId, {
        profile_picture_url: null,
      })

      console.log('✅ Profile picture deleted')
    } catch (error) {
      console.error('❌ Error deleting profile picture:', error)
      // Don't throw, just log - we still want to clear the profile field
      await this.updateProfile(userId, {
        profile_picture_url: null,
      })
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