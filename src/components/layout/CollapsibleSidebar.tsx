'use client'

import { useTheme } from '@/context/ThemeContext'
import { HomeIcon, GenerateIcon, SessionsIcon, SettingsIcon, UploadIcon, MenuIcon } from '@/components/ui/Icon'

interface CollapsibleSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  collapsed: boolean
  onToggle: () => void
}

export function CollapsibleSidebar({ currentPage, onPageChange, collapsed, onToggle }: CollapsibleSidebarProps) {
  const { colors } = useTheme()

  const menuItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'generate', label: 'Generate', icon: GenerateIcon },
    { id: 'sessions', label: 'Sessions', icon: SessionsIcon },
    { id: 'upload', label: 'Upload', icon: UploadIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <div 
      className={`h-full border-r flex flex-col relative z-10 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg" style={{ color: colors.text }}>Drafter</span>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
          style={{ color: colors.text }}
        >
          <MenuIcon size="sm" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-opacity-20' 
                  : 'hover:bg-opacity-10'
              } hover:bg-white`}
              style={{
                backgroundColor: isActive ? `${colors.accent}20` : 'transparent',
                color: isActive ? colors.accent : colors.textMuted
              }}
            >
              <IconComponent 
                size="sm" 
                color={isActive ? colors.accent : colors.textMuted}
              />
              {!collapsed && (
                <span className="font-medium" style={{ color: isActive ? colors.accent : colors.textMuted }}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t" style={{ borderColor: colors.border }}>
          <div className="text-xs opacity-60" style={{ color: colors.textMuted }}>
            Drafter v1.0.0
          </div>
        </div>
      )}
    </div>
  )
}
