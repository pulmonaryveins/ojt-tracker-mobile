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
          theme_mode: string | null
          accent_color: string | null
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
          theme_mode?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          school?: string
          year_level?: string
          workplace?: string
          profile_picture_url?: string | null
          theme_mode?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ojt_setup: {
        Row: {
          id: string
          user_id: string
          required_hours: number
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          required_hours: number
          start_date: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          required_hours?: number
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ojt_setup_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          start_time: string
          end_time: string | null
          duration: number
          total_hours: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          start_time: string
          end_time?: string | null
          duration?: number
          total_hours?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          start_time?: string
          end_time?: string | null
          duration?: number
          total_hours?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      breaks: {
        Row: {
          id: string
          session_id: string
          start_time: string
          end_time: string | null
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          start_time: string
          end_time?: string | null
          duration?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breaks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type OJTSetup = Database['public']['Tables']['ojt_setup']['Row']
export type OJTSetupInsert = Database['public']['Tables']['ojt_setup']['Insert']
export type OJTSetupUpdate = Database['public']['Tables']['ojt_setup']['Update']

export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export type Break = Database['public']['Tables']['breaks']['Row']
export type BreakInsert = Database['public']['Tables']['breaks']['Insert']
export type BreakUpdate = Database['public']['Tables']['breaks']['Update']