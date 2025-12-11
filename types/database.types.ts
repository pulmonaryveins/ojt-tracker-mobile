export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          school: string
          year_level: string
          workplace: string
          profile_picture_url: string | null
          theme_mode: 'light' | 'dark'
          accent_color: 'blurple' | 'pink' | 'red' | 'green' | 'yellow' | 'teal'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          school: string
          year_level: string
          workplace: string
          profile_picture_url?: string | null
          theme_mode?: 'light' | 'dark'
          accent_color?: 'blurple' | 'pink' | 'red' | 'green' | 'yellow' | 'teal'
        }
        Update: {
          full_name?: string
          school?: string
          year_level?: string
          workplace?: string
          profile_picture_url?: string | null
          theme_mode?: 'light' | 'dark'
          accent_color?: 'blurple' | 'pink' | 'red' | 'green' | 'yellow' | 'teal'
        }
      }
      ojt_configs: {
        Row: {
          id: string
          user_id: string
          required_hours: number
          start_date: string
          daily_target_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          required_hours: number
          start_date: string
          daily_target_hours?: number | null
        }
        Update: {
          required_hours?: number
          start_date?: string
          daily_target_hours?: number | null
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          time_in: string
          time_out: string | null
          breaks: Json
          total_hours: number
          status: 'ongoing' | 'on_break' | 'completed' | 'auto_closed'
          tasks: string | null
          lessons_learned: string | null
          notes: string | null
          image_urls: string[]
          synced: boolean
          local_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          date?: string
          time_in: string
          time_out?: string | null
          breaks?: Json
          status?: 'ongoing' | 'on_break' | 'completed' | 'auto_closed'
          tasks?: string | null
          lessons_learned?: string | null
          notes?: string | null
          image_urls?: string[]
          synced?: boolean
          local_id?: string | null
        }
        Update: {
          time_out?: string | null
          breaks?: Json
          status?: 'ongoing' | 'on_break' | 'completed' | 'auto_closed'
          tasks?: string | null
          lessons_learned?: string | null
          notes?: string | null
          image_urls?: string[]
          synced?: boolean
        }
      }
    }
    Views: {
      user_statistics: {
        Row: {
          user_id: string | null
          total_hours_completed: number
          days_worked: number
          avg_hours_per_day: number
          required_hours: number | null
          hours_remaining: number
          progress_percentage: number
        }
      }
    }
  }
}