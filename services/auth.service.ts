import { supabase } from '@/lib/supabase'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  school: string
  yearLevel: string
  workplace: string
}

export class AuthService {
  static async signUp(data: SignUpData) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: data.fullName,
        school: data.school,
        year_level: data.yearLevel,
        workplace: data.workplace,
      })

    if (profileError) throw profileError

    return authData
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'ojttracker://reset-password',
    })

    if (error) throw error
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  }
}