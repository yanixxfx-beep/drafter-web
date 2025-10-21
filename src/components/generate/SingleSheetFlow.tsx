// src/components/generate/SingleSheetFlow.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { StoredFile } from '@/lib/simpleStorage'
import { useCanvasSize } from '@/hooks/useCanvasSize'
import { USE_DETERMINISTIC_LAYOUT } from '@/config/featureFlags'
import { layoutDesktop, LayoutSpec } from '@/lib/textLayout'
import { ensureFontReady } from '@/lib/ensureFontReady'
import { drawCover, drawContain, loadWithOrientation } from '@/utils/image'
import SlideEditorCanvas from '@/components/SlideEditorCanvas'
import { loadWithOrientationEnhanced, logLoadResult } from '@/utils/opfsImageLoader'
import { loadSafeZone, drawSafeZoneOverlay } from '@/utils/safeZones'
import { getWorkerExportManager, WorkerExportManager } from '@/utils/workerExport'
import { usePersistentSession } from '@/session/usePersistentSession'
import { NumberInput } from '@/components/ui/NumberInput'
import AnimatedList from '@/components/ui/AnimatedList'
import { GlowingEffect } from '@/components/ui/GlowingEffect'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckIcon, 
  UploadIcon, 
  ImageIcon, 
  TextIcon, 
  PaletteIcon, 
  EyeIcon,
  DownloadIcon,
  ShuffleIcon,
  SettingsIcon,
  PlusIcon,
  UserIcon
} from '@/components/ui/Icon'
import { CloseProjectModal } from '@/components/ui/CloseProjectModal'
import { SlideEditor } from '@/components/pages/SlideEditor'
import { useGenerateStore } from '@/store/generateStore'

// Session Creation Form Component
interface SessionCreationFormProps {
  onCreateSession: (name: string) => void
  colors: any
}

const SessionCreationForm: React.FC<SessionCreationFormProps> = ({ onCreateSession, colors }) => {
  const [sessionName, setSessionName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName.trim()) return
    
    setIsCreating(true)
    try {
      await onCreateSession(sessionName.trim())
      setSessionName('')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
          Session Name
        </label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Enter session name..."
          className="w-full px-3 py-2 border rounded-lg"
          style={{ 
            backgroundColor: colors.surface2, 
            borderColor: colors.border, 
            color: colors.text 
          }}
          disabled={isCreating}
        />
      </div>
      <button
        type="submit"
        disabled={!sessionName.trim() || isCreating}
        className="w-full px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        style={{ 
          backgroundColor: colors.accent, 
          color: 'white' 
        }}
      >
        {isCreating ? 'Creating...' : 'Create Session'}
      </button>
    </form>
  )
}

export default function SingleSheetFlow() {
  const { colors } = useTheme()
  const { data: session, status } = useSession()
  const { step, setStep } = useGenerateStore()
  
  // All the original state and logic from GeneratePage.tsx
  const [currentStep, setCurrentStep] = useState(1)
  const [showSlideEditor, setShowSlideEditor] = useState(false)
  const [editingSlide, setEditingSlide] = useState<{ideaIndex: number, slideIndex: number} | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [availableImages, setAvailableImages] = useState<StoredFile[]>([])
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([])
  const [step1Data, setStep1Data] = useState<any>(null)
  const [step2Data, setStep2Data] = useState<any>(null)
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    // Load sessions logic here
  }

  const createSession = async (name: string) => {
    // Create session logic here
  }

  const loadSession = (session: any) => {
    // Load session logic here
  }

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

  // Show session selection if no current session
  if (!currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Welcome to Drafter
          </h1>
          <p className="text-gray-600" style={{ color: colors.textMuted }}>
            Create a new session or open an existing one
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Session Card */}
          <div 
            className="bg-white rounded-lg shadow p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                New Session
              </h3>
              <p className="text-gray-600" style={{ color: colors.textMuted }}>
                Start with a fresh session
              </p>
            </div>
            {showSessionForm ? (
              <SessionCreationForm 
                onCreateSession={createSession}
                colors={colors}
              />
            ) : (
              <button
                onClick={() => setShowSessionForm(true)}
                className="w-full px-4 py-2 rounded-lg font-medium"
                style={{ 
                  backgroundColor: colors.accent, 
                  color: 'white' 
                }}
              >
                Create New Session
              </button>
            )}
          </div>

          {/* Recent Sessions Card */}
          <div 
            className="bg-white rounded-lg shadow p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                Recent Sessions
              </h3>
              <p className="text-gray-600" style={{ color: colors.textMuted }}>
                Continue your work
              </p>
            </div>
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className="w-full text-left p-3 rounded-lg hover:bg-opacity-10 transition-colors"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: colors.text,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div className="font-medium">{session.name}</div>
                  <div className="text-sm opacity-60">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main workflow - this is where the original GeneratePage steps go
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Step indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= stepNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    currentStep > stepNum ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content - this is where we'll put the original step content */}
      <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
          Step {currentStep}: Content
        </h2>
        <p style={{ color: colors.textMuted }}>
          This will contain the original step content from GeneratePage.tsx
        </p>
      </div>
    </div>
  )
}