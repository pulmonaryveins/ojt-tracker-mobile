import { format, toZonedTime } from 'date-fns-tz'
import { parseISO } from 'date-fns'

const MANILA_TZ = 'Asia/Manila'

export const dateUtils = {
  /**
   * Get current date/time in Philippine timezone
   */
  getPHDate(): Date {
    return toZonedTime(new Date(), MANILA_TZ)
  },

  /**
   * Format a date to Philippine timezone
   */
  formatPH(date: Date | string, formatStr: string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const zonedDate = toZonedTime(dateObj, MANILA_TZ)
    return format(zonedDate, formatStr, { timeZone: MANILA_TZ })
  },

  /**
   * Convert UTC date to Philippine timezone
   */
  toPHTime(utcDate: Date | string): Date {
    const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate
    return toZonedTime(dateObj, MANILA_TZ)
  },

  /**
   * Get today's date in PH timezone (YYYY-MM-DD format)
   */
  getTodayPH(): string {
    return this.formatPH(this.getPHDate(), 'yyyy-MM-dd')
  },

  /**
   * Check if a date is today in PH timezone
   */
  isToday(date: Date | string): boolean {
    const dateStr = this.formatPH(date, 'yyyy-MM-dd')
    const todayStr = this.getTodayPH()
    return dateStr === todayStr
  },

  /**
   * Get start of week in PH timezone
   */
  getWeekStartPH(): Date {
    const now = this.getPHDate()
    const day = now.getDay()
    const diff = now.getDate() - day
    return new Date(now.setDate(diff))
  },

  /**
   * Calculate hours between two dates
   */
  getHoursDifference(start: Date | string, end: Date | string): number {
    const startDate = typeof start === 'string' ? parseISO(start) : start
    const endDate = typeof end === 'string' ? parseISO(end) : end
    const diffMs = endDate.getTime() - startDate.getTime()
    return diffMs / (1000 * 60 * 60)
  },

  /**
   * Calculate minutes between two dates
   */
  getMinutesDifference(start: Date | string, end: Date | string): number {
    const startDate = typeof start === 'string' ? parseISO(start) : start
    const endDate = typeof end === 'string' ? parseISO(end) : end
    const diffMs = endDate.getTime() - startDate.getTime()
    return diffMs / (1000 * 60)
  },
}