import { useThemeStore } from '../stores/theme.store'
import { useMemo } from 'react'

export function useTheme() {
  const { mode, accent, accentColor } = useThemeStore()

  const colors = useMemo(() => {
    const isDark = mode === 'dark'
    
    return {
      // Base colors
      background: isDark ? '#1e1f22' : '#ffffff',
      secondary: isDark ? '#2b2d31' : '#f2f3f5',
      tertiary: isDark ? '#36393f' : '#e3e5e8',
      
      // Text colors
      text: isDark ? '#f2f3f5' : '#2b2d31',
      textSecondary: isDark ? '#b5bac1' : '#4e5058',
      textMuted: isDark ? '#80848e' : '#5c5e66',
      
      // UI colors
      border: isDark ? '#36393f' : '#e3e5e8',
      card: isDark ? '#2b2d31' : '#ffffff',
      
      // Accent
      accent: accentColor,
      accentLight: `${accentColor}20`, // 20% opacity
      accentDark: `${accentColor}80`, // 80% opacity
      
      // Status colors
      success: '#3ba55d',
      error: '#ed4245',
      warning: '#faa81a',
      info: '#5865f2',
    }
  }, [mode, accentColor])

  return {
    mode,
    accent,
    accentColor,
    colors,
  }
}