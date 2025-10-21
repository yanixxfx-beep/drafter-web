// src/components/pages/GeneratePage.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { useGenerateStore } from '@/store/generateStore'
import StepHeader from '@/components/generate/common/StepHeader'
import MultiSheetFlow from '@/components/generate/multi/MultiSheetFlow'

export default function GeneratePage() {
  const { colors } = useTheme()
  const { data: session, status } = useSession()
  const { step, setStep } = useGenerateStore()
  const [showProjectSelection, setShowProjectSelection] = useState(true)
  const [recentProjects, setRecentProjects] = useState([])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg" style={{ color: colors.text }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
          Please sign in to continue
        </h1>
        <button
          onClick={() => signIn('google')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  if (showProjectSelection) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Create New Project
          </h1>
          <p className="text-gray-600" style={{ color: colors.textMuted }}>
            Start a new project or open a recent one
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Project Card */}
          <div 
            className="p-6 rounded-lg border-2 border-dashed cursor-pointer hover:border-blue-500 transition-colors"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.surface2
            }}
            onClick={() => setShowProjectSelection(false)}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
                <span className="text-2xl text-white">+</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                New Project
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Create a new project from scratch
              </p>
            </div>
          </div>

          {/* Recent Projects */}
          <div 
            className="p-6 rounded-lg border cursor-pointer hover:border-blue-500 transition-colors"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.surface2
            }}
            onClick={() => setShowProjectSelection(false)}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accentDim }}>
                <span className="text-2xl text-white">📁</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                Recent Projects
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Open a recent project
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main workflow - use MultiSheetFlow directly
  return <MultiSheetFlow />
}