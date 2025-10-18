'use client'

import { useTheme } from '@/context/ThemeContext'
import { HomePage } from '@/components/pages/HomePage'
import { GeneratePage } from '@/components/pages/GeneratePage'
import { ProjectsPage } from '@/components/pages/SessionsPage'
import { OPFSUploadPage } from '@/components/pages/OPFSUploadPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import TestPanel from '@/components/TestPanel'

interface ContentAreaProps {
  currentPage: string
}

export function ContentArea({ currentPage }: ContentAreaProps) {
  const { colors } = useTheme()

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'generate':
        return <GeneratePage />
      case 'sessions':
        return <ProjectsPage />
      case 'upload':
        return <OPFSUploadPage />
      case 'settings':
        return <SettingsPage />
      case 'tests':
        return <TestPanel />
      default:
        return <HomePage />
    }
  }

  return (
    <div 
      className="flex-1 h-full overflow-hidden relative z-10"
      style={{ backgroundColor: colors.background }}
    >
      {renderPage()}
    </div>
  )
}
