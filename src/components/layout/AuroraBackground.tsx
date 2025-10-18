'use client'

import { useTheme } from '@/context/ThemeContext'

export function AuroraBackground() {
  const { theme, colors } = useTheme()

  if (theme === 'light') {
    return (
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 50%, ${colors.surfaceSecondary} 100%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-purple-50/10 to-pink-50/20" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 50%, ${colors.surfaceSecondary} 100%)`
        }}
      />
      
      {/* Aurora effect */}
      <div className="absolute inset-0 aurora-bg">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
    </div>
  )
}


