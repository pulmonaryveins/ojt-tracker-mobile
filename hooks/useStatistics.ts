import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Statistics } from '../types/models'
import { useAuthStore } from '../stores/auth.store'
import { dateUtils } from '../utils/timezone'

export function useStatistics() {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: ['statistics', user?.id],
    queryFn: async (): Promise<Statistics> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Get stats from view
      const { data: stats, error: statsError } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsError) throw statsError

      // Get OJT config for calculations
      const { data: config, error: configError } = await supabase
        .from('ojt_configs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (configError) throw configError

      const now = dateUtils.nowPH()
      const startDate = new Date(config.start_date)
      const daysSinceStart = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Calculate estimated finish date
      const hoursRemaining = stats.hours_remaining || 0
      const avgHoursPerDay = stats.avg_hours_per_day || 0
      
      let daysNeeded = 0
      if (avgHoursPerDay > 0) {
        daysNeeded = Math.ceil(hoursRemaining / avgHoursPerDay)
      } else if (config.daily_target_hours) {
        daysNeeded = Math.ceil(hoursRemaining / config.daily_target_hours)
      } else {
        daysNeeded = Math.ceil(hoursRemaining / 8) // Default 8 hours/day
      }

      const estimatedFinishDate = new Date(now)
      estimatedFinishDate.setDate(estimatedFinishDate.getDate() + daysNeeded)

      // Check if on track
      const expectedHours = config.daily_target_hours 
        ? daysSinceStart * config.daily_target_hours
        : (daysSinceStart * config.required_hours) / 
          (config.required_hours / (config.daily_target_hours || 8))
      
      const isOnTrack = stats.total_hours_completed >= expectedHours * 0.9 // 90% tolerance

      return {
        totalHoursCompleted: stats.total_hours_completed || 0,
        hoursRemaining: stats.hours_remaining || config.required_hours,
        requiredHours: config.required_hours,
        progressPercentage: stats.progress_percentage || 0,
        daysWorked: stats.days_worked || 0,
        avgHoursPerDay: stats.avg_hours_per_day || 0,
        estimatedFinishDate,
        isOnTrack,
        daysSinceStart,
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}