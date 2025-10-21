// src/components/generate/common/StepHeader.tsx
'use client'
import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useGenerateStore } from '@/store/generateStore'

interface StepHeaderProps {
  title: string
  description?: string
  showBackButton?: boolean
  onBack?: () => void
  showNextButton?: boolean
  onNext?: () => void
  nextButtonText?: string
  nextButtonDisabled?: boolean
}

export default function StepHeader({
  title,
  description,
  showBackButton = false,
  onBack,
  showNextButton = false,
  onNext,
  nextButtonText = 'Next',
  nextButtonDisabled = false
}: StepHeaderProps) {
  const { colors } = useTheme()
  const { step } = useGenerateStore()

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex justify-center">
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

      {/* Title and description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {description}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {(showBackButton || showNextButton) && (
        <div className="flex justify-between">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg border flex items-center gap-2"
              style={{ 
                backgroundColor: colors.surface2, 
                borderColor: colors.border, 
                color: colors.text 
              }}
            >
              ← Previous
            </button>
          )}
          
          {showNextButton && onNext && (
            <button
              onClick={onNext}
              disabled={nextButtonDisabled}
              className="px-6 py-3 rounded-lg border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: nextButtonDisabled ? colors.surface2 : colors.accent, 
                borderColor: nextButtonDisabled ? colors.border : colors.accent, 
                color: nextButtonDisabled ? colors.textMuted : 'white'
              }}
            >
              {nextButtonText} →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
