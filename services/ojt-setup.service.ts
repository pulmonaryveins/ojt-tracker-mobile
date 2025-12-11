import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type OJTSetup = Database['public']['Tables']['ojt_setup']['Row']
type OJTSetupInsert = Database['public']['Tables']['ojt_setup']['Insert']
type OJTSetupUpdate = Database['public']['Tables']['ojt_setup']['Update']

export class OJTSetupService {
  static async getSetup(userId: string): Promise<OJTSetup | null> {
    try {
      const { data, error } = await supabase
        .from('ojt_setup')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No OJT setup found for user:', userId)
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching OJT setup:', error)
      throw error
    }
  }

  static async createSetup(setup: OJTSetupInsert): Promise<OJTSetup> {
    try {
      console.log('📝 Creating OJT setup:', setup)

      const { data, error } = await supabase
        .from('ojt_setup')
        .insert(setup)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating OJT setup:', error)
        throw error
      }

      console.log('✅ OJT setup created successfully')
      return data
    } catch (error) {
      console.error('❌ Error creating OJT setup:', error)
      throw error
    }
  }

  static async updateSetup(userId: string, updates: OJTSetupUpdate): Promise<OJTSetup> {
    try {
      console.log('🔄 Updating OJT setup for user:', userId)
      console.log('📝 Update data:', updates)

      const { data, error } = await supabase
        .from('ojt_setup')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating OJT setup:', error)
        throw error
      }

      console.log('✅ OJT setup updated successfully')
      return data
    } catch (error) {
      console.error('❌ Error updating OJT setup:', error)
      throw error
    }
  }

  static async upsertSetup(setup: OJTSetupInsert): Promise<OJTSetup> {
    try {
      console.log('🔄 Upserting OJT setup:', setup)

      const { data, error } = await supabase
        .from('ojt_setup')
        .upsert(setup, {
          onConflict: 'user_id',
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error upserting OJT setup:', error)
        throw error
      }

      console.log('✅ OJT setup upserted successfully')
      return data
    } catch (error) {
      console.error('❌ Error upserting OJT setup:', error)
      throw error
    }
  }
}