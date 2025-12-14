export interface User {
  id: string
  email: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string
  school: string
  year_level: string
  workplace: string
  profile_picture_url: string | null
  created_at: string
  updated_at: string
}

export interface OJTConfig {
  id: string
  user_id: string
  required_hours: number
  start_date: string
  end_date: string | null
  daily_target_hours: number | null
  created_at: string
  updated_at: string
}

export interface Break {
  id: string
  session_id: string
  start_time: string
  end_time: string | null
  duration: number
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  date: string
  start_time: string
  end_time: string | null
  duration: number
  total_hours: number
  breaks: Break[] | null
  description: string | null
  tasks_completed: string | null
  lessons_learned: string | null
  report_images: string[] | null
  created_at: string
  updated_at: string
}

// Statistics interfaces
export interface DailyStats {
  date: string
  hours: number
  sessions: number
}

export interface WeeklyStats {
  week: string
  total_hours: number
  days_worked: number
  avg_hours_per_day: number
}

export interface ProgressStats {
  total_hours: number
  required_hours: number
  percentage: number
  remaining_hours: number
  days_elapsed: number
  estimated_completion_date: string | null
}