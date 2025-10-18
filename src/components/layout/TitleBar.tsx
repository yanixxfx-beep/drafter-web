'use client'

import { useTheme } from '@/context/ThemeContext'
import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const { colors } = useTheme()

  return (
    <div 
      className="h-12 flex items-center justify-between px-4 border-b"
      style={{ 
        backgroundColor: colors.titlebar,
        borderColor: colors.border 
      }}
    >
      {/* App Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-semibold" style={{ color: colors.textPrimary }}>
          Drafter
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center space-x-2">
        <button
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
          onClick={() => window.electron?.minimize?.()}
        >
          <Minus size={16} style={{ color: colors.textSecondary }} />
        </button>
        <button
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
          onClick={() => window.electron?.maximize?.()}
        >
          <Square size={14} style={{ color: colors.textSecondary }} />
        </button>
        <button
          className="w-8 h-8 rounded flex items-center justify-center hover:bg-red-500 hover:bg-opacity-20 transition-colors"
          onClick={() => window.electron?.close?.()}
        >
          <X size={16} style={{ color: colors.textSecondary }} />
        </button>
      </div>
    </div>
  )
}


