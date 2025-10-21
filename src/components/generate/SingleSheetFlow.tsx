// src/components/generate/SingleSheetFlow.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { useGenerateStore } from '@/store/generateStore'

export default function SingleSheetFlow() {
  const { colors } = useTheme()
  const { data: session, status } = useSession()
  const { step, setStep } = useGenerateStore()

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          Single Sheet Flow
        </h1>
        <p className="text-gray-600" style={{ color: colors.textMuted }}>
          Original single-sheet functionality will be moved here
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content placeholder */}
      <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
          Step {step}: Single Sheet Content
        </h2>
        <p style={{ color: colors.textMuted }}>
          This will contain the original single-sheet logic extracted from GeneratePage.tsx
        </p>
      </div>
    </div>
  )
}