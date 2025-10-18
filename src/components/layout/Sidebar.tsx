'use client'

import { useTheme } from '@/context/ThemeContext'
import { Home, Zap, Clock, Settings, User } from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { colors } = useTheme()

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'generate', label: 'Generate', icon: Zap },
    { id: 'sessions', label: 'Projects', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div 
      className="w-64 h-full border-r flex flex-col relative z-10"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      {/* Logo Section */}
      <div className="p-6 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ color: colors.textPrimary }}>
              Drafter
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              AI Content Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive ? 'shadow-sm' : 'hover:bg-opacity-10'
              }`}
              style={{
                backgroundColor: isActive ? colors.accentDim : 'transparent',
                color: isActive ? colors.textPrimary : colors.textSecondary,
              }}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
            <User size={16} style={{ color: 'white' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              Guest User
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Free Plan
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
