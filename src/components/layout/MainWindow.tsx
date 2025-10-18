'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { EnhancedSidebar } from './EnhancedSidebar'
import { ContentArea } from './ContentArea'
import { AuroraBackground } from './AuroraBackground'

export function MainWindow() {
  const { theme, colors } = useTheme()
  const { data: session, status } = useSession()
  const [currentPage, setCurrentPage] = useState('home')

  // Handle Google Sheets connection callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Check if user just completed Google OAuth and is authenticated
    if (status === 'authenticated' && session?.user) {
      // If there's a sheets_connected parameter, mark as connected
      if (urlParams.get('sheets_connected') === 'true') {
        localStorage.setItem('sheets_connected', 'true')
        console.log('✅ Google Sheets connected successfully!')
      }
      
      // Clean up URL parameters
      if (urlParams.toString()) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [status, session])

  return (
    <div 
      className="h-screen w-full overflow-hidden flex"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Aurora Background */}
      <AuroraBackground />
      
      {/* Enhanced Sidebar with Hover */}
      <EnhancedSidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      
      {/* Content Area */}
      <ContentArea currentPage={currentPage} />
    </div>
  )
}
