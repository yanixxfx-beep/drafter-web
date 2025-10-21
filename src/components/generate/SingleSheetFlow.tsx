// src/components/generate/SingleSheetFlow.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { useGenerateStore } from '@/store/generateStore'
import StepHeader from '@/components/generate/common/StepHeader'

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
      <StepHeader
        title="Single Sheet Flow"
        description="Original single-sheet functionality will be moved here"
      />

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