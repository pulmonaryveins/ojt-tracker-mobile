import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeMode = 'light' | 'dark'
export type AccentColor = 'blurple' | 'pink' | 'red' | 'green' | 'yellow' | 'teal'

interface ThemeState {
  mode: ThemeMode
  accent: AccentColor
  accentColor: string
  toggleMode: () => void
  setAccent: (accent: AccentColor) => void
}

const accentColors: Record<AccentColor, string> = {
  blurple: '#5865f2',
  pink: '#eb459e',
  red: '#ed4245',
  green: '#3ba55d',
  yellow: '#faa81a',
  teal: '#1abc9c',
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      accent: 'blurple',
      accentColor: accentColors.blurple,

      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'dark' ? 'light' : 'dark',
        })),

      setAccent: (accent) =>
        set({
          accent,
          accentColor: accentColors[accent],
        }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)