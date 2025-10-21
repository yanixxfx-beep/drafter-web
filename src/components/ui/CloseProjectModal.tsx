'use client'

import { useTheme } from '@/context/ThemeContext'
import { X } from 'lucide-react'

interface CloseProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveAndExit: () => void
  onExitWithoutSaving: () => void
  projectName?: string
}

export function CloseProjectModal({
  isOpen,
  onClose,
  onSaveAndExit,
  onExitWithoutSaving,
  projectName = 'this project'
}: CloseProjectModalProps) {
  const { colors } = useTheme()

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-opacity-10"
          style={{ color: colors.textMuted }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Close Project?
          </h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Do you want to save your progress before closing {projectName}?
          </p>
        </div>

        {/* Warning */}
        <div 
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: colors.surface2 }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>
            <span className="font-semibold" style={{ color: colors.accent }}>Note:</span> If you exit without saving, all unsaved changes will be lost.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onSaveAndExit}
            className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: colors.accent,
              color: 'white'
            }}
          >
            Save & Exit
          </button>
          
          <button
            onClick={onExitWithoutSaving}
            className="w-full px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'transparent',
              borderColor: colors.border,
              color: colors.text
            }}
          >
            Exit Without Saving
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              color: colors.textMuted
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}








