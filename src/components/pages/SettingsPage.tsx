'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Palette, Volume2, Download, Folder, Database } from 'lucide-react'

export function SettingsPage() {
  const { theme, setTheme, colors } = useTheme()
  const [activeTab, setActiveTab] = useState('themes')

  const tabs = [
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'update', label: 'Update', icon: Download },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'memory', label: 'Memory', icon: Database },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'themes':
        return <ThemesTab />
      case 'audio':
        return <AudioTab />
      case 'update':
        return <UpdateTab />
      case 'folders':
        return <FoldersTab />
      case 'memory':
        return <MemoryTab />
      default:
        return <ThemesTab />
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Settings
          </h1>
          <p 
            className="text-lg"
            style={{ color: colors.textSecondary }}
          >
            Customize your Drafter experience
          </p>
        </div>

        {/* Tab Navigation */}
        <div 
          className="flex space-x-2 p-2 rounded-2xl"
          style={{ backgroundColor: colors.surface }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'shadow-sm' : 'hover:bg-opacity-10'
                }`}
                style={{
                  backgroundColor: isActive ? colors.accent : 'transparent',
                  color: isActive ? 'white' : colors.textSecondary,
                }}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

// Tab Components
function ThemesTab() {
  const { theme, setTheme, colors } = useTheme()

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <h2 
        className="text-xl font-bold mb-6"
        style={{ color: colors.textPrimary }}
      >
        Theme Settings
      </h2>
      
      <div className="space-y-4">
        <div 
          className={`p-4 rounded-xl border transition-all duration-200 ${
            theme === 'dark' ? 'border-purple-500/50' : 'border-gray-300'
          }`}
          style={{ 
            backgroundColor: theme === 'dark' ? colors.accentDim : colors.surfaceSecondary,
            borderColor: theme === 'dark' ? colors.accent : colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                Dark Theme
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Modern dark interface with purple accents
              </p>
            </div>
            <div 
              className={`w-4 h-4 rounded-full border-2 ${
                theme === 'dark' ? 'bg-purple-500 border-purple-500' : 'border-gray-400'
              }`}
            />
          </div>
        </div>

        <div 
          className={`p-4 rounded-xl border transition-all duration-200 ${
            theme === 'light' ? 'border-purple-500/50' : 'border-gray-300'
          }`}
          style={{ 
            backgroundColor: theme === 'light' ? colors.accentDim : colors.surfaceSecondary,
            borderColor: theme === 'light' ? colors.accent : colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                Light Theme
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Clean light interface with purple accents
              </p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: colors.accent,
                color: 'white'
              }}
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AudioTab() {
  const { colors } = useTheme()

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <h2 
        className="text-xl font-bold mb-6"
        style={{ color: colors.textPrimary }}
      >
        Audio & Sound Effects
      </h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
              Enable Sound Effects
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Play sounds for button clicks and notifications
            </p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
              Notification Sounds
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Play sounds for system notifications
            </p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
            Master Volume
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="75"
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}

function UpdateTab() {
  const { colors } = useTheme()

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <h2 
        className="text-xl font-bold mb-6"
        style={{ color: colors.textPrimary }}
      >
        Updates & System
      </h2>
      
      <div className="space-y-4">
        <button
          className="w-full p-4 rounded-xl border transition-all duration-200 hover:bg-opacity-10"
          style={{ 
            backgroundColor: colors.buttonBg,
            borderColor: colors.border,
            color: colors.textPrimary
          }}
        >
          <div className="flex items-center space-x-3">
            <Download size={20} />
            <div className="text-left">
              <div className="font-semibold">Check for Updates</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                Look for the latest version
              </div>
            </div>
          </div>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
              Automatic Updates
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Automatically download and install updates
            </p>
          </div>
          <input type="checkbox" className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function FoldersTab() {
  const { colors } = useTheme()

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <h2 
        className="text-xl font-bold mb-6"
        style={{ color: colors.textPrimary }}
      >
        Folder Settings
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
            Default Project Folder
          </label>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Select folder..."
              className="flex-1 p-3 rounded-lg border"
              style={{ 
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                color: colors.textPrimary 
              }}
            />
            <button
              className="px-4 py-3 rounded-lg border transition-all duration-200"
              style={{ 
                backgroundColor: colors.buttonBg,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              Browse
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
            Output Folder
          </label>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Select folder..."
              className="flex-1 p-3 rounded-lg border"
              style={{ 
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                color: colors.textPrimary 
              }}
            />
            <button
              className="px-4 py-3 rounded-lg border transition-all duration-200"
              style={{ 
                backgroundColor: colors.buttonBg,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemoryTab() {
  const { colors } = useTheme()

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}
    >
      <h2 
        className="text-xl font-bold mb-6"
        style={{ color: colors.textPrimary }}
      >
        Memory & Storage
      </h2>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
              Memory Usage
            </span>
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              45%
            </span>
          </div>
          <div 
            className="w-full h-2 rounded-full"
            style={{ backgroundColor: colors.surfaceSecondary }}
          >
            <div 
              className="h-2 rounded-full"
              style={{ 
                backgroundColor: colors.accent,
                width: '45%'
              }}
            />
          </div>
        </div>

        <button
          className="w-full p-4 rounded-xl border transition-all duration-200 hover:bg-opacity-10"
          style={{ 
            backgroundColor: colors.buttonBg,
            borderColor: colors.border,
            color: colors.textPrimary
          }}
        >
          <div className="flex items-center space-x-3">
            <Database size={20} />
            <div className="text-left">
              <div className="font-semibold">Clear Cache</div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                Free up storage space
              </div>
            </div>
          </div>
        </button>

        <div className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
          <div>Available: 2.5 GB</div>
          <div>Used: 1.2 GB</div>
          <div>Total: 3.7 GB</div>
        </div>
      </div>
    </div>
  )
}


