'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

export function DebugMainWindow() {
  const { theme, colors } = useTheme()
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <div 
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      {/* Debug Info */}
      <div className="p-4 bg-red-500 text-white">
        <p>Debug: Theme = {theme}</p>
        <p>Debug: Current Page = {currentPage}</p>
        <p>Debug: Colors loaded = {colors ? 'Yes' : 'No'}</p>
      </div>
      
      {/* Title Bar */}
      <div className="h-12 bg-blue-500 flex items-center justify-between px-4">
        <span className="text-white font-bold">Drafter - Debug Mode</span>
        <div className="flex space-x-2">
          <button 
            onClick={() => setCurrentPage('home')}
            className="px-3 py-1 bg-white text-blue-500 rounded"
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('generate')}
            className="px-3 py-1 bg-white text-blue-500 rounded"
          >
            Generate
          </button>
          <button 
            onClick={() => setCurrentPage('sessions')}
            className="px-3 py-1 bg-white text-blue-500 rounded"
          >
            Sessions
          </button>
          <button 
            onClick={() => setCurrentPage('settings')}
            className="px-3 py-1 bg-white text-blue-500 rounded"
          >
            Settings
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-green-500 p-4">
          <h3 className="text-white font-bold mb-4">Sidebar</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`w-full p-2 rounded ${currentPage === 'home' ? 'bg-white text-green-500' : 'bg-green-600 text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('generate')}
              className={`w-full p-2 rounded ${currentPage === 'generate' ? 'bg-white text-green-500' : 'bg-green-600 text-white'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setCurrentPage('sessions')}
              className={`w-full p-2 rounded ${currentPage === 'sessions' ? 'bg-white text-green-500' : 'bg-green-600 text-white'}`}
            >
              Sessions
            </button>
            <button 
              onClick={() => setCurrentPage('settings')}
              className={`w-full p-2 rounded ${currentPage === 'settings' ? 'bg-white text-green-500' : 'bg-green-600 text-white'}`}
            >
              Settings
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 bg-yellow-500 p-4">
          <h3 className="text-black font-bold mb-4">Content Area</h3>
          <p className="text-black">Current Page: {currentPage}</p>
          <div className="mt-4 p-4 bg-white rounded">
            {currentPage === 'home' && <div>🏠 Home Page Content</div>}
            {currentPage === 'generate' && <div>⚡ Generate Page Content</div>}
            {currentPage === 'sessions' && <div>🕒 Sessions Page Content</div>}
            {currentPage === 'settings' && <div>⚙️ Settings Page Content</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


