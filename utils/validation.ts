import { z } from 'zod'

export const sessionValidation = {
  maxSessionHours: 16,
  maxBreaks: 4,
  maxBreakHours: 4,
  maxTextLength: 500,
}

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  school: z.string().min(2, 'School name required'),
  yearLevel: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year']),
  workplace: z.string().min(2, 'Workplace required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const ojtSetupSchema = z.object({
  requiredHours: z.number().min(1).max(1000),
  startDate: z.date().max(new Date(), 'Start date cannot be in the future'),
  dailyTargetHours: z.number().min(0).max(24).optional(),
})

export const dailyLogSchema = z.object({
  tasks: z.string().min(1, 'Tasks are required').max(500),
  lessonsLearned: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
})

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 8
}