// src/components/pages/Step1MultiSheet.tsx
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { MultiSheetSelector } from '@/components/MultiSheetSelector'
import { MultiSheetWorkflow, type SheetConfig } from '@/lib/workflow/MultiSheetWorkflow'
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@/components/ui/Icon'

interface GoogleSheet {
  id: string
  name: string
  url: string
}

interface Step1MultiSheetProps {
  onNext: (projectData: any) => void
  onBack: () => void
  className?: string
}

export function Step1MultiSheet({ onNext, onBack, className = '' }: Step1MultiSheetProps) {
  const { colors } = useTheme()
  const { data: session } = useSession()
  const [spreadsheets, setSpreadsheets] = useState<GoogleSheet[]>([])
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [selectedSheets, setSelectedSheets] = useState<SheetConfig[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    current: string
    completed: number
    total: number
  } | null>(null)

  const workflow = MultiSheetWorkflow.getInstance()

  // Fetch spreadsheets when authenticated
  useEffect(() => {
    if (session?.accessToken) {
      fetchSpreadsheets()
    }
  }, [session])

  const fetchSpreadsheets = async () => {
    try {
      setIsLoadingSheets(true)
      const response = await fetch('/api/sheets/list', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.error) {
        console.error('API Error:', data.error)
        alert(`Error: ${data.error}. Please try signing out and back in.`)
      } else if (data.spreadsheets) {
        setSpreadsheets(data.spreadsheets)
        console.log(`Found ${data.spreadsheets.length} spreadsheets`)
      }
    } catch (error) {
      console.error('Failed to fetch spreadsheets:', error)
      alert('Failed to connect to Google Sheets. Please try again.')
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handlePreviewSheet = async (sheetId: string): Promise<{ headers: string[]; sampleRows: string[][] }> => {
    try {
      const response = await fetch('/api/sheets/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: sheetId, sheetName: 'Sheet1' }),
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      return {
        headers: data.headers,
        sampleRows: data.sampleRows
      }
    } catch (error) {
      console.error('Failed to preview sheet:', error)
      throw error
    }
  }

  const handleSelectionChange = (sheets: SheetConfig[]) => {
    setSelectedSheets(sheets)
  }

  const handleNext = async () => {
    if (selectedSheets.length === 0) {
      alert('Please select at least one sheet to continue.')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationProgress({ current: 'Initializing...', completed: 0, total: selectedSheets.length })

      // Create project
      const project = workflow.createProject(
        'Multi-Sheet Project',
        selectedSheets,
        {
          fontChoice: 'Medium',
          fontSize: 52,
          outlinePx: 6,
          lineSpacing: 12,
          verticalAlignment: 'center',
          horizontalAlignment: 'center',
          yOffset: -100,
          xOffset: 0,
          textRotation: 0,
          autoFit: true,
          rotateBg180: false,
          useSafeZone: true,
          safeZoneFormat: '9:16',
          showSafeZoneOverlay: false
        },
        'perSheet' // Default to per-sheet customization
      )

      // Generate slides for all sheets
      const slideGroups = await workflow.generateSlidesForAllSheets(
        session?.accessToken || '',
        [], // Available images - you'll need to pass this from parent
        (progress) => {
          setGenerationProgress(progress)
        }
      )

      // Pass data to next step
      onNext({
        project,
        slideGroups,
        totalSlides: slideGroups.reduce((sum, group) => sum + group.slides.length, 0),
        totalSheets: slideGroups.length
      })

    } catch (error) {
      console.error('Failed to generate slides:', error)
      alert('Failed to generate slides. Please try again.')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(null)
    }
  }

  if (isLoadingSheets) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-lg" style={{ color: colors.text }}>
          Loading your Google Sheets...
        </p>
      </div>
    )
  }

  if (spreadsheets.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
          No spreadsheets found
        </h3>
        <p className="mb-4" style={{ color: colors.textMuted }}>
          Make sure you have Google Sheets in your Drive, then try signing out and back in.
        </p>
        <button
          onClick={fetchSpreadsheets}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Step 1: Select Ideas
        </h2>
        <p className="text-lg" style={{ color: colors.textMuted }}>
          Choose your Google Sheets files to access your idea files
        </p>
      </div>

      {/* Multi-sheet selector */}
      <MultiSheetSelector
        spreadsheets={spreadsheets}
        onSelectionChange={handleSelectionChange}
        onPreviewSheet={handlePreviewSheet}
        colors={colors}
      />

      {/* Generation progress */}
      {isGenerating && generationProgress && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: colors.text }}>
              Generating slides... {generationProgress.completed}/{generationProgress.total}
            </span>
            <span style={{ color: colors.textSecondary }}>
              {Math.round((generationProgress.completed / generationProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(generationProgress.completed / generationProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Processing: {generationProgress.current}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            color: colors.text 
          }}
        >
          <ChevronLeftIcon size="sm" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm" style={{ color: colors.textMuted }}>
            {selectedSheets.length} sheet{selectedSheets !== 1 ? 's' : ''} selected
          </div>
          
          <button
            onClick={handleNext}
            disabled={selectedSheets.length === 0 || isGenerating}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: selectedSheets.length > 0 && !isGenerating ? colors.accent : colors.surface,
              color: selectedSheets.length > 0 && !isGenerating ? colors.accentText : colors.textMuted
            }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRightIcon size="sm" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
