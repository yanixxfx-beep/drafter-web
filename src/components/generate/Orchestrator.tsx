// src/components/generate/Orchestrator.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { useGenerateStore } from '@/store/generateStore'
import SingleSheetFlow from '@/components/generate/SingleSheetFlow'
import MultiSheetFlow from '@/components/generate/multi/MultiSheetFlow'

export default function Orchestrator(){
  const { colors } = useTheme()
  const { data: session, status } = useSession()
  const { step, setStep } = useGenerateStore()
  const [showProjectSelection, setShowProjectSelection] = useState(true)

  if (status === 'loading') {
    return <div>Loading...</div>
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
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: colors.surface }}
            onClick={() => {
              setShowProjectSelection(false)
              setStep(1)
            }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                New Project
              </h3>
              <p className="text-gray-600" style={{ color: colors.textMuted }}>
                Start with a fresh project and select your sheets
              </p>
            </div>
          </div>

          {/* Recent Projects Card */}
          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: colors.surface }}
            onClick={() => {
              setShowProjectSelection(false)
              setStep(1)
            }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                Recent Projects
              </h3>
              <p className="text-gray-600" style={{ color: colors.textMuted }}>
                Continue working on your recent projects
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show the main flow (which includes multi-sheet functionality)
  return <SingleSheetFlow />
}