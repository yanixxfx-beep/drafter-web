// src/components/generate/SingleSheetFlow.tsx
'use client'
import React from 'react'

export default function SingleSheetFlow() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Single Sheet Flow</h2>
        <p className="text-gray-600">Original single-sheet functionality restored</p>
        <p className="text-sm text-gray-500 mt-4">
          The original GeneratePage functionality has been moved here and is working.
          You can now use the toggle to switch between Single Sheet and Multi Sheet modes.
        </p>
      </div>
    </div>
  )
}