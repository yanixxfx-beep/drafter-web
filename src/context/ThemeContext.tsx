'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  colors: {
    background: string
    surface: string
    surface2: string
    accent: string
    accentDim: string
    accentHover: string
    text: string
    textMuted: string
    textSecondary: string
    border: string
    hover: string
    titlebar: string
    buttonBg: string
    buttonHover: string
    buttonPressed: string
  }
}

const darkColors = {
  background: '#0A0A0A',
  surface: '#1E1E1E', // Slightly lighter grey
  surface2: '#2A2A2A',
  accent: '#7C5CFF',
  accentDim: '#3A2B66',
  accentHover: '#8B70FF',
  text: '#FFFFFF',
  textMuted: '#B0B0B0',
  textSecondary: '#808080',
  border: 'rgba(255,255,255,0.15)',
  hover: 'rgba(255,255,255,0.1)',
  titlebar: 'rgba(26, 26, 26, 0.95)',
  buttonBg: 'rgba(255,255,255,0.08)',
  buttonHover: 'rgba(255,255,255,0.12)',
  buttonPressed: 'rgba(255,255,255,0.16)',
}

const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  accent: '#7C5CFF',
  accentDim: '#E0E7FF',
  accentHover: '#8B70FF',
  text: '#1E293B',
  textMuted: '#64748B',
  textSecondary: '#94A3B8',
  border: 'rgba(0,0,0,0.15)',
  hover: 'rgba(0,0,0,0.08)',
  titlebar: 'rgba(255, 255, 255, 0.95)',
  buttonBg: 'rgba(0,0,0,0.05)',
  buttonHover: 'rgba(0,0,0,0.08)',
  buttonPressed: 'rgba(0,0,0,0.12)',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('drafter-theme') as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('drafter-theme', newTheme)
  }

  const colors = theme === 'dark' ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
