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
  const [step3Data, setStep3Data] = useState<any>(null)
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  
  // Google Sheets states
  const [spreadsheets, setSpreadsheets] = useState<any[]>([])
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('')
  
  // Canvas ref for useCanvasSize hook
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const getCanvasDimensions = () => {
    const format = step2Data?.safeZoneFormat || '9:16'
    if (format === '3:4') {
      return { w: 270, h: 360 } // 3:4 aspect ratio (270/360 = 0.75)
    }
    return { w: 270, h: 480 } // 9:16 aspect ratio (270/480 = 0.5625)
  }
  const { w: CSS_W, h: CSS_H } = useCanvasSize(canvasRef, getCanvasDimensions())

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
    loadSpreadsheets()
  }, [])

  const loadSessions = async () => {
    try {
      const stored = localStorage.getItem('drafter_sessions')
      const sessions = stored ? JSON.parse(stored) : []
      setSessions(sessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      setSessions([])
    }
  }

  const createSession = async (name: string) => {
    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: new Date()
    }
    
    const updatedSessions = [...sessions, newSession]
    setSessions(updatedSessions)
    localStorage.setItem('drafter_sessions', JSON.stringify(updatedSessions))
    
    setCurrentSession(newSession)
    setShowSessionForm(false)
    setCurrentStep(1)
  }

  const loadSession = (session: any) => {
    setCurrentSession(session)
    if (session.step1Data) setStep1Data(session.step1Data)
    if (session.step2Data) setStep2Data(session.step2Data)
    if (session.step3Data) setStep3Data(session.step3Data)
    setShowSessionForm(false)
    setCurrentStep(1)
  }

  const loadSpreadsheets = async () => {
    try {
      const response = await fetch('/api/sheets/list', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSpreadsheets(data.spreadsheets || [])
      }
    } catch (error) {
      console.error('Failed to load spreadsheets:', error)
    }
  }

  const loadSheetsForSpreadsheet = async (spreadsheetId: string) => {
    setIsLoadingSheets(true)
    try {
      const response = await fetch(`/api/sheets/read?spreadsheetId=${spreadsheetId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableSheets(data.sheetNames || [])
        setSelectedSpreadsheet(spreadsheetId)
      }
    } catch (error) {
      console.error('Failed to load sheets:', error)
    } finally {
      setIsLoadingSheets(false)
    }
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

  // Main workflow - render the appropriate step
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Step 1: Select Ideas
          </h2>
          <p className="text-gray-600" style={{ color: colors.textMuted }}>
            Choose a spreadsheet and select the ideas you want to work with
          </p>
        </div>

        {/* Google Sheets Selection */}
        <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Select Spreadsheet
          </h3>
          <div className="space-y-4">
            <select
              value={step1Data?.spreadsheetId || ''}
              onChange={(e) => {
                const spreadsheetId = e.target.value
                if (spreadsheetId) {
                  loadSheetsForSpreadsheet(spreadsheetId)
                }
              }}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ 
                backgroundColor: colors.surface2, 
                borderColor: colors.border, 
                color: colors.text 
              }}
            >
              <option value="">Choose a spreadsheet...</option>
              {spreadsheets.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </option>
              ))}
            </select>
            
            {isLoadingSheets && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                  Loading sheets...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sheet Selection */}
        {availableSheets.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Select Sheets
            </h3>
            <div className="space-y-2">
              {availableSheets.map((sheetName) => (
                <label key={sheetName} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSheets.includes(sheetName)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSheets([...selectedSheets, sheetName])
                      } else {
                        setSelectedSheets(selectedSheets.filter(s => s !== sheetName))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                    style={{ accentColor: colors.accent }}
                  />
                  <span style={{ color: colors.text }}>{sheetName}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Next Button */}
        {selectedSheets.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Next Step →
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
          Step 2: Preview & Customize Text
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Customize your text appearance and preview the results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Text Settings
            </h3>
            <div className="space-y-4">
              {/* Font Choice */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Font
                </label>
                <select
                  value={step2Data?.fontChoice || 'Regular'}
                  onChange={(e) => setStep2Data({...step2Data, fontChoice: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="Regular">TikTok Sans Regular</option>
                  <option value="SemiBold">TikTok Sans SemiBold</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Font Size: {step2Data?.fontSize || 48}px
                </label>
                <input
                  type="range"
                  min="24"
                  max="72"
                  value={step2Data?.fontSize || 48}
                  onChange={(e) => setStep2Data({...step2Data, fontSize: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              {/* Outline */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Outline: {step2Data?.outlinePx || 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={step2Data?.outlinePx || 0}
                  onChange={(e) => setStep2Data({...step2Data, outlinePx: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Preview
          </h3>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border rounded-lg"
              style={{ borderColor: colors.border }}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 border rounded-lg font-medium"
          style={{ 
            backgroundColor: colors.surface2, 
            borderColor: colors.border, 
            color: colors.text 
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          Next Step →
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Step 3: Review & Export
        </h2>
        <p className="text-gray-600" style={{ color: colors.textMuted }}>
          Review your generated drafts and export them
        </p>
      </div>

      {/* Generated Ideas Display */}
      <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
          Generated Ideas
        </h3>
        {generatedIdeas.length > 0 ? (
          <div className="space-y-4">
            {generatedIdeas.map((idea, ideaIndex) => (
              <div key={idea.ideaId} className="border rounded-lg p-4" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: colors.text }}>
                    Idea {idea.ideaId}: {idea.ideaText}
                  </h4>
                  <button
                    onClick={() => {
                      const newIdeas = [...generatedIdeas]
                      newIdeas[ideaIndex].isExpanded = !newIdeas[ideaIndex].isExpanded
                      setGeneratedIdeas(newIdeas)
                    }}
                    className="text-sm px-3 py-1 rounded"
                    style={{ 
                      backgroundColor: colors.surface2, 
                      color: colors.text 
                    }}
                  >
                    {idea.isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                
                {idea.isExpanded && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {idea.slides.map((slide, slideIndex) => (
                      <div key={slide.id} className="relative">
                        <img
                          src={slide.thumbnail || slide.image}
                          alt={slide.caption}
                          className="w-full aspect-[9/16] object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingSlide({ ideaIndex, slideIndex })
                              setShowSlideEditor(true)
                            }}
                            className="px-3 py-1 bg-white text-black rounded text-sm font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p style={{ color: colors.textMuted }}>
              No ideas generated yet. Go back to previous steps to generate content.
            </p>
          </div>
        )}
      </div>

      {/* Export Options */}
      {generatedIdeas.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {/* Export logic */}}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
          >
            Export All as ZIP
          </button>
          <button
            onClick={() => {/* Export individual logic */}}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Export Selected
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 border rounded-lg font-medium"
          style={{ 
            backgroundColor: colors.surface2, 
            borderColor: colors.border, 
            color: colors.text 
          }}
        >
          ← Previous
        </button>
      </div>
    </div>
  )

  // Main workflow - render the appropriate step
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

      {/* Step content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  )
}