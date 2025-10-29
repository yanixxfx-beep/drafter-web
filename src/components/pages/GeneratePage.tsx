'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'
import { StoredFile } from '@/lib/simpleStorage'
import { USE_DETERMINISTIC_LAYOUT } from '@/config/featureFlags'
import { ensureFontReady } from '@/lib/ensureFontReady'
import SlideEditorCanvas from '@/components/SlideEditorCanvas'
import { loadWithOrientationEnhanced, logLoadResult } from '@/utils/opfsImageLoader'
import { loadSafeZone, drawSafeZoneOverlay } from '@/utils/safeZones'
import { enqueueThumbnail, clearThumbnails } from '@/lib/images/thumbnail'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import type { CaptionSettings, RenderOpts as SlideRenderOpts } from '@/lib/render/SlideRenderer'
import { drawCaptionWithStyle, CaptionStyle } from '@/lib/render/caption'
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
import Step1Pane from '@/components/generate/parts/Step1Pane'
import Step2Pane from '@/components/generate/parts/Step2Pane'
import Step3Pane from '@/components/generate/parts/Step3Pane'

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
      onCreateSession(sessionName.trim())
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="session-name-input" className="sr-only">Session Name</label>
        <input
          id="session-name-input"
          name="sessionName"
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Enter session name..."
          className="w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
          style={{
            backgroundColor: colors.surface2,
            borderColor: sessionName.trim() ? colors.accent : colors.border,
            color: colors.text,
            focusRingColor: colors.accent
          }}
          required
          autoComplete="off"
        />
      </div>
      
      <button
        type="submit"
        disabled={!sessionName.trim() || isCreating}
        className="w-full px-6 py-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        style={{
          backgroundColor: sessionName.trim() ? colors.accent : colors.surface2,
          borderColor: sessionName.trim() ? colors.accent : colors.border,
          color: sessionName.trim() ? 'white' : colors.textMuted,
          boxShadow: sessionName.trim() ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
        }}
      >
        {isCreating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating...
          </>
        ) : (
          <>
            <PlusIcon size="sm" />
            Create Session
          </>
        )}
      </button>
    </form>
  )
}
interface GoogleSheet {
  id: string
  name: string
  url: string
}

interface SheetData {
  sheetName: string
  ideas: any[]
  slideColumns: string[]
}

interface Step1Data {
  spreadsheetId: string
  spreadsheetName: string
  // Support both single sheet (backward compatible) and multi-sheet
  sheetName: string // single sheet mode (kept for backward compat)
  selectedSheets: string[] // new: array of selected sheet names
  // Legacy single sheet data
  ideas: any[]
  slideColumns: string[]
  // New: multi-sheet data (sheetName -> SheetData)
  sheetsData: Record<string, SheetData>
  summary: {
    ideasCount: number
    slideCols: string[]
  }
}

interface Step2Data {
  fontChoice: string
  fontSize: number
  outlinePx: number
  lineSpacing: number
  verticalAlignment: string
  horizontalAlignment: string
  yOffset: number
  xOffset: number
  textRotation: number
  autoFit: boolean
  rotateBg180: boolean
  useSafeZone: boolean
  safeZoneFormat: '9:16' | '3:4'
  showSafeZoneOverlay: boolean
  fillColor?: string
  outlineColor?: string
  backgroundType?: 'image' | 'solid'
  backgroundColor?: string
}

interface SessionData {
  id: string
  name: string
  createdAt: Date
  step1Data?: Step1Data
  step2Data?: Step2Data
  step3Data?: any
  generationPreferences?: {
    format: '9:16' | '3:4' | 'combined'
  }
}

interface Step3Data {
  slides: Array<{
    imagePath: string
    caption: string
    rotate180: boolean
    flipH: boolean
    overrideCenterPx?: [number, number]
    styleOverride: Record<string, any>
    renderOptions?: SlideRenderOpts
  }>
}

type AvailableImage = StoredFile & {
  url: string
  fileHandle?: FileSystemFileHandle
  format: '9:16' | '3:4'
  category: 'affiliate' | 'ai-method'
}
type IdeaFormatPlan = '9:16' | '3:4' | 'mixed'

export function GeneratePage() {
  const { colors } = useTheme()
  const { data: session, status } = useSession()
  const { store: sessionStore, ready } = usePersistentSession()
  
  // Debug session store connection
  useEffect(() => {
    console.log('GeneratePage session store:')
    console.log('  hasStore:', !!sessionStore)
    console.log('  ready:', ready)
    console.log('  itemCount:', sessionStore?.items?.length || 0)
    if (sessionStore?.items) {
      console.log('  sample items:', sessionStore.items.slice(0, 3).map(item => ({
        name: item.originalName,
        format: item.format,
        category: item.category
      })))
    }
  }, [sessionStore, ready])
  
  const [currentStep, setCurrentStep] = useState(0) // Start with session creation
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null)
  
  // Generation Preferences (Step 2.5)
  interface GenerationPreferences {
    format: '9:16' | '3:4' | 'combined'
  }
  const [generationPreferences, setGenerationPreferences] = useState<GenerationPreferences>({
    format: '9:16'
  })
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    completed: number
    total: number
    currentSlide: number
    eta: number
    formats: Array<{slide: number, format: '9:16' | '3:4'}>
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ completed: number; total: number } | null>(null)
  const [showSessionCreation, setShowSessionCreation] = useState(true)
  
  // Google Sheets states
  const [spreadsheets, setSpreadsheets] = useState<GoogleSheet[]>([])
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('')

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 1:
        return true
      case 2:
        // Allow if single sheet OR multi-sheet selection
        return !!(step1Data?.spreadsheetId && (step1Data?.sheetName || (step1Data?.selectedSheets && step1Data.selectedSheets.length > 0)))
      case 3:
        return !!(step1Data?.ideas?.length && step2Data)
      case 4:
        return !!(generatedIdeas.length && !isGeneratingDrafts)
      default:
        return true
    }
  }

  const nextStep = () => {
    setCurrentStep((prev) => {
      const target = Math.min(prev + 1, 4)
      return canProceedToStep(target) ? target : prev
    })
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const resetStep1Summary = (overrides?: Partial<Step1Data>) => {
    setStep1Data((prev) => {
      const base: Step1Data = {
        spreadsheetId: '',
        spreadsheetName: '',
        sheetName: '',
        selectedSheets: [],
        ideas: [],
        slideColumns: [],
        sheetsData: {},
        summary: {
          ideasCount: 0,
          slideCols: []
        }
      }
      return { ...base, ...(prev ?? {}), ...(overrides ?? {}) }
    })
  }

  const fetchSpreadsheets = async () => {
    if (status !== 'authenticated') {
      setSpreadsheets([])
      return
    }

    try {
      setIsLoadingSheets(true)
      const response = await fetch('/api/sheets/list')
      if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheets: ${response.statusText}`)
      }
      const data = await response.json()
      if (Array.isArray(data?.spreadsheets)) {
        setSpreadsheets(data.spreadsheets)
      } else {
        setSpreadsheets([])
      }
    } catch (error) {
      console.error('Failed to fetch spreadsheets:', error)
      setSpreadsheets([])
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleSpreadsheetSelect = async (spreadsheetId: string) => {
    setSelectedSpreadsheet(spreadsheetId)
    setAvailableSheets([])

    if (!spreadsheetId) {
      resetStep1Summary({ spreadsheetId: '', spreadsheetName: '', sheetName: '' })
      return
    }

    try {
      setIsLoadingSheets(true)
      const response = await fetch('/api/sheets/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      })
      if (!response.ok) {
        throw new Error(`Failed to read spreadsheet: ${response.statusText}`)
      }
      const data = await response.json()
      const spreadsheetName = spreadsheets.find((sheet) => sheet.id === spreadsheetId)?.name || ''

      if (Array.isArray(data?.sheetNames)) {
        setAvailableSheets(data.sheetNames)
      } else {
        setAvailableSheets([])
      }

      resetStep1Summary({
        spreadsheetId,
        spreadsheetName,
        sheetName: '',
        ideas: [],
        slideColumns: [],
        summary: {
          ideasCount: 0,
          slideCols: []
        }
      })
    } catch (error) {
      console.error('Failed to fetch sheet names:', error)
      setAvailableSheets([])
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleSheetSelect = async (sheetName: string) => {
    if (!selectedSpreadsheet) {
      return
    }

    if (!sheetName) {
      resetStep1Summary({
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: spreadsheets.find((sheet) => sheet.id === selectedSpreadsheet)?.name || '',
        sheetName: ''
      })
      return
    }

    try {
      setIsLoadingSheets(true)
      const response = await fetch('/api/sheets/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: selectedSpreadsheet,
          sheetName
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to read sheet data: ${response.statusText}`)
      }

      const data = await response.json()
      const ideas = Array.isArray(data?.ideas) ? data.ideas : []
      const slideColumns = Array.isArray(data?.slideColumns) ? data.slideColumns : []

      setStep1Data({
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: spreadsheets.find((sheet) => sheet.id === selectedSpreadsheet)?.name || '',
        sheetName,
        selectedSheets: [sheetName], // single sheet
        ideas,
        slideColumns,
        sheetsData: {
          [sheetName]: {
            sheetName,
            ideas,
            slideColumns
          }
        },
        summary: {
          ideasCount: typeof data?.totalIdeas === 'number' ? data.totalIdeas : ideas.length,
          slideCols: slideColumns
        }
      })
    } catch (error) {
      console.error('Failed to read sheet data:', error)
      // keep prior step1Data but reset counts
      resetStep1Summary({
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: spreadsheets.find((sheet) => sheet.id === selectedSpreadsheet)?.name || '',
        sheetName
      })
    } finally {
      setIsLoadingSheets(false)
    }
  }

  // Multi-sheet selection handler
  const handleMultiSheetSelect = async (sheetNames: string[]) => {
    console.log('📋 MULTI-SHEET SELECTION DEBUG')
    console.log('🎯 Selected sheets:', sheetNames)
    
    if (!selectedSpreadsheet) {
      return
    }

    try {
      setIsLoadingSheets(true)

      // Fetch data for all selected sheets
      const sheetsData: Record<string, SheetData> = {}
      let totalIdeasCount = 0
      const allSlideCols = new Set<string>()

      for (const sheetName of sheetNames) {
        console.log(`📥 Fetching sheet: ${sheetName}`)
        const response = await fetch('/api/sheets/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spreadsheetId: selectedSpreadsheet,
            sheetName
          })
        })

        if (!response.ok) {
          console.warn(`Failed to read sheet ${sheetName}`)
          continue
        }

        const data = await response.json()
        const ideas = Array.isArray(data?.ideas) ? data.ideas : []
        const slideColumns = Array.isArray(data?.slideColumns) ? data.slideColumns : []

        console.log(`📊 Sheet "${sheetName}" data:`, {
          ideasCount: ideas.length,
          slideColumns: slideColumns,
          sampleIdea: ideas[0] ? Object.keys(ideas[0]) : []
        })

        sheetsData[sheetName] = {
          sheetName,
          ideas,
          slideColumns
        }

        totalIdeasCount += ideas.length
        slideColumns.forEach((col: string) => allSlideCols.add(col))
      }

      const mergedIdeas = sheetNames.flatMap(name => 
        (sheetsData[name]?.ideas || []).map((idea: any) => ({
          ...idea,
          _sheetName: name // Tag each idea with its source sheet
        }))
      )

      console.log('🔄 MERGED DATA:', {
        totalIdeas: mergedIdeas.length,
        ideasPerSheet: sheetNames.map(name => ({
          sheet: name,
          count: sheetsData[name]?.ideas?.length || 0
        })),
        slideColumns: Array.from(allSlideCols),
        sampleMergedIdeas: mergedIdeas.slice(0, 3).map(idea => ({
          sheetName: idea._sheetName,
          keys: Object.keys(idea)
        }))
      })

      setStep1Data({
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: spreadsheets.find((sheet) => sheet.id === selectedSpreadsheet)?.name || '',
        sheetName: sheetNames.length === 1 ? sheetNames[0] : '', // single sheet compat
        selectedSheets: sheetNames,
        // Merge all ideas from all sheets with sheet tracking
        ideas: mergedIdeas,
        slideColumns: Array.from(allSlideCols),
        sheetsData,
        summary: {
          ideasCount: totalIdeasCount,
          slideCols: Array.from(allSlideCols)
        }
      })
    } catch (error) {
      console.error('Failed to read multi-sheet data:', error)
      resetStep1Summary({
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: spreadsheets.find((sheet) => sheet.id === selectedSpreadsheet)?.name || ''
      })
    } finally {
      setIsLoadingSheets(false)
    }
  }

  // Step 2 Preview states
  const [currentCaption, setCurrentCaption] = useState<string>('')
  const [currentImage, setCurrentImage] = useState<string>('')
  const [availableImages, setAvailableImages] = useState<AvailableImage[]>([])
  const [fontLoaded, setFontLoaded] = useState<boolean>(false)

  const getRandomItem = <T,>(items: T[]): T | null => {
    if (!items || items.length === 0) return null
    const index = Math.floor(Math.random() * items.length)
    return items[index] ?? null
  }

  const extractCaptionFromIdea = (idea: any): string | null => {
    if (!idea) return null

    if (typeof idea === 'string') {
      const trimmed = idea.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    if (Array.isArray(idea)) {
      for (const entry of idea) {
        const result = extractCaptionFromIdea(entry)
        if (result) return result
      }
      return null
    }

    if (typeof idea === 'object') {
      const priorityKeys = [
        'caption',
        'Caption',
        'idea',
        'Idea',
        'ideaText',
        'text',
        'Text',
        'title',
        'Title',
        'description',
        'Description',
        'content',
        'Content'
      ]

      for (const key of priorityKeys) {
        const value = idea[key]
        if (typeof value === 'string' && value.trim()) {
          return value.trim()
        }
      }

      for (const value of Object.values(idea)) {
        const result = extractCaptionFromIdea(value)
        if (result) return result
      }
    }

    return null
  }

  const handleRandomCaption = useCallback(() => {
    if (!step1Data?.ideas || step1Data.ideas.length === 0) {
      return
    }

    const randomIdea = getRandomItem(step1Data.ideas)
    const caption = extractCaptionFromIdea(randomIdea)

    if (caption) {
      setCurrentCaption(caption)
    }
  }, [step1Data])

  const handleRandomImage = useCallback(() => {
    if (!availableImages || availableImages.length === 0) {
      return
    }

    const pool = availableImages.filter((image) => image.url !== currentImage)
    const candidatePool = pool.length > 0 ? pool : availableImages
    const randomImage = getRandomItem(candidatePool)

    if (randomImage) {
      setCurrentImage(randomImage.url)
    }
  }, [availableImages, currentImage])

  // Step 3 Draft states
  const [generatedIdeas, setGeneratedIdeas] = useState<Array<{
    ideaId: number
    ideaText: string
    sheetName?: string | null // Track which sheet this idea came from
    slides: Array<{
      id: string
      caption: string
      image: string
      renderConfig: SlideRenderConfig
      thumbnail: string | null  // DataURL string instead of canvas element
      createdAt: Date
      slideNumber: number
      imageSource: 'affiliate' | 'ai-method'
      format?: '9:16' | '3:4'
      lastModified?: number
      rotateBg180?: boolean
      flipH?: boolean
      styleOverride?: Partial<Step2Data>
    }>
    isExpanded: boolean
  }>>([])

  type SlideRenderConfig = {
    slide: {
      exportSize: { w: number; h: number }
      backgroundColor: string
      imageRef?: string | null
      imageTransform?: {
        rotate180?: boolean
        flipHorizontal?: boolean
      }
    }
    caption: CaptionSettings
  }

  const drawCaptionUsingStep2Settings = (
    ctx: CanvasRenderingContext2D,
    caption: string,
    canvasWidth: number,
    canvasHeight: number,
    format?: '9:16' | '3:4',
    styleOverride?: Partial<CaptionStyle>
  ) => {
    if (!step2Data || !caption) return

    const style: CaptionStyle = {
      fontChoice: step2Data.fontChoice,
      fontSize: step2Data.fontSize,
      lineSpacing: step2Data.lineSpacing,
      yOffset: step2Data.yOffset,
      xOffset: step2Data.xOffset,
      textRotation: step2Data.textRotation,
      outlinePx: step2Data.outlinePx,
      outlineColor: step2Data.outlineColor ?? '#000000',
      fillColor: step2Data.fillColor ?? '#FFFFFF',
      verticalAlignment: (step2Data.verticalAlignment || 'center') as 'top' | 'center' | 'bottom',
      horizontalAlignment: (step2Data.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
      useSafeZone: step2Data.useSafeZone ?? false,
      safeZoneFormat: step2Data.safeZoneFormat
    }

    const mergedStyle: CaptionStyle = {
      ...style,
      ...styleOverride
    }

    drawCaptionWithStyle(
      ctx,
      caption,
      canvasWidth,
      canvasHeight,
      mergedStyle,
      format || mergedStyle.safeZoneFormat || '9:16'
    )
  }

  const mergeStyleWithOverride = (
    base: Step2Data,
    override?: Partial<Step2Data>
  ): Step2Data => {
    if (!override) {
      return { ...base }
    }

    const merged: Step2Data = { ...base }
    for (const [key, value] of Object.entries(override) as Array<
      [keyof Step2Data, Step2Data[keyof Step2Data]]
    >) {
      if (value !== undefined) {
        merged[key] = value
      }
    }

    return merged
  }

  const buildCaptionSettings = (
    caption: string,
    format: '9:16' | '3:4',
    style: Step2Data
  ): CaptionSettings => {
    const fontWeight =
      style.fontChoice === 'SemiBold'
        ? 600
        : style.fontChoice === 'Medium'
        ? 500
        : 400

    const exportSize = format === '3:4'
      ? { width: 1080, height: 1440 }
      : { width: 1080, height: 1920 }

    return {
      text: caption,
      fillStyle: style.fillColor ?? '#FFFFFF',
      outlineColor: style.outlineColor ?? '#000000',
      layout: {
        fontFamily: 'TikTok Sans',
        fontWeight,
        fontPx: style.fontSize ?? 52,
        lineSpacingPx: style.lineSpacing ?? 12,
        xOffsetPx: style.xOffset ?? 0,
        yOffsetPx: style.yOffset ?? 0,
        outlinePx: style.outlinePx ?? 6,
        align: (style.verticalAlignment || 'center') as 'top' | 'center' | 'bottom',
        horizontalAlign: (style.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
        textRotation: style.textRotation ?? 0,
        safeMarginPx: 64,
        maxTextWidthPx: exportSize.width - 128,
        useSafeZone: style.useSafeZone ?? false,
        safeZoneFormat: style.safeZoneFormat
      }
    }
  }

  const buildRenderConfig = (
    imageUrl: string | null,
    caption: string,
    format: '9:16' | '3:4',
    style: Step2Data,
    override?: Partial<Step2Data>,
    imageTransform?: { rotate180?: boolean; flipHorizontal?: boolean }
  ): SlideRenderConfig => {
    const effectiveStyle = mergeStyleWithOverride(style, override)
    const exportSize = format === '3:4'
      ? { w: 1080, h: 1440 }
      : { w: 1080, h: 1920 }
    const backgroundColor =
      effectiveStyle.backgroundType === 'solid'
        ? effectiveStyle.backgroundColor || '#000000'
        : '#000000'

    return {
      slide: {
        exportSize,
        backgroundColor,
        imageRef: imageUrl,
        imageTransform
      },
      caption: buildCaptionSettings(caption, format, effectiveStyle)
    }
  }

  const THUMBNAIL_SCALE = 1 / 6

  const queueThumbnailForSlide = (slideId: string, renderConfig: SlideRenderConfig) => {
    clearThumbnails(job => job.id === slideId)
    
    // Convert to the format expected by renderSlideToCanvas
    const basicSlide = {
      exportSize: renderConfig.slide.exportSize,
      backgroundColor: renderConfig.slide.backgroundColor,
      imageRef: renderConfig.slide.imageRef,
      imageTransform: renderConfig.slide.imageTransform,
      textLayers: [] // Empty for now - caption is rendered separately
    }
    
    enqueueThumbnail({
      id: slideId,
      opts: {
        slide: basicSlide,
        caption: renderConfig.caption,
        scale: THUMBNAIL_SCALE
      },
      onComplete: (url) => {
        let previousUrl: string | null = null
        
        // Use functional update with proper state handling
        setGeneratedIdeas(prev => {
          // Only update if the slide still exists
          const updated = prev.map(idea => ({
            ...idea,
            slides: idea.slides.map(slide => {
              if (slide.id !== slideId) {
                return slide
              }

              if (slide.thumbnail && slide.thumbnail.startsWith('blob:')) {
                previousUrl = slide.thumbnail
              }

              return {
                ...slide,
                thumbnail: url
              }
            })
          }))

          return updated
        })

        if (previousUrl && previousUrl !== url) {
          try {
            URL.revokeObjectURL(previousUrl)
          } catch (error) {
            console.warn(`Failed to revoke thumbnail for slide ${slideId}`, error)
          }
        }
      },
      onError: (error) => {
        console.error(`Failed to render thumbnail for slide ${slideId}`, error)
      }
    })
  }
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  
  // Image randomization tracking
  const [usedImages, setUsedImages] = useState<Set<string>>(new Set())
  
  // Close project modal
  const [showCloseProjectModal, setShowCloseProjectModal] = useState(false)
  const [sessionName, setSessionName] = useState<string>('Untitled Project')
  
  // Slide editor
  const [showSlideEditor, setShowSlideEditor] = useState(false)
  const [editingSlide, setEditingSlide] = useState<{ideaIndex: number, slideIndex: number} | null>(null)

  // Ensure the session creation panel shows whenever no session is active
  useEffect(() => {
    if (!currentSession && !showSessionCreation) {
      setShowSessionCreation(true)
      setCurrentStep(0)
    }
  }, [currentSession, showSessionCreation])

  // Make sure we land on Step 1 once a session exists
  useEffect(() => {
    if (currentSession && currentStep === 0) {
      setCurrentStep(1)
    }
  }, [currentSession, currentStep])

  function loadSavedData() {
    try {
      setStep2Data((existing) => {
        if (existing) {
          return existing
        }

        return {
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
          showSafeZoneOverlay: false,
          fillColor: '#FFFFFF',
          outlineColor: '#000000',
          backgroundType: 'image',
          backgroundColor: '#000000'
        }
      })
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  async function loadImagesFromStorage() {
    if (!sessionStore || !ready) {
      return
    }

    try {
      const imageItems = sessionStore.items.filter((item) => {
        if (item.mime?.startsWith('image/')) {
          return true
        }
        return /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(item.originalName)
      })

      const images = await Promise.all(
        imageItems.map(async (item) => {
          try {
            const file = await sessionStore.getFile(item.id)
            if (!file) {
              return null
            }

            const url = URL.createObjectURL(file)
            return {
              id: item.id,
              category: (item.category ?? 'affiliate') as 'affiliate' | 'ai-method',
              name: item.originalName,
              type: item.mime || file.type || 'image/jpeg',
              size: item.bytes ?? file.size,
              uploadedAt: new Date(item.createdAt).getTime(),
              url,
              format: (item.format ?? '9:16') as '9:16' | '3:4'
            } as AvailableImage
          } catch (error) {
            console.warn(`Failed to load image ${item.originalName}:`, error)
            return null
          }
        })
      )

      const validImages = images.filter((image): image is AvailableImage => image !== null)

      setAvailableImages(validImages)

      if (!currentImage && validImages.length > 0) {
        setCurrentImage(validImages[0].url)
      }
    } catch (error) {
      console.error('Failed to load images from storage:', error)
    }
  }

  // Load saved data and images on mount
  useEffect(() => {
    loadSavedData()
    // Only load images if session store is ready
    if (sessionStore && ready) {
    loadImagesFromStorage()
    }
  }, [sessionStore, ready])

  // Listen for profile modal open event
  useEffect(() => {
    const handleOpenProfileModal = () => {
      // This will be handled by the parent component that manages the profile modal
      console.log('Profile modal open requested')
    }

    window.addEventListener('openProfileModal', handleOpenProfileModal)
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal)
  }, [])

  // Reload images when format changes or session store becomes ready
  useEffect(() => {
    if (step2Data?.safeZoneFormat && sessionStore && ready) {
      loadImagesFromStorage()
    }
  }, [step2Data?.safeZoneFormat, sessionStore, ready])

  // Check if TikTok Sans font is loaded and load it
        useEffect(() => {
          const loadFonts = async () => {
            try {
              // Dynamically import font utilities only on client side
              const { ensureAllTikTokFonts } = await import('@/utils/ensureFont')
              
              // Load all TikTok Sans fonts with timeout and fallback
              const results = await ensureAllTikTokFonts()
              
              setFontLoaded(results.allLoaded)
              console.log('TikTok Sans fonts loaded:', results)
              
            } catch (error) {
              console.warn('Failed to load TikTok Sans fonts:', error)
              setFontLoaded(false)
            }
          }
          
          loadFonts()
        }, [])

  const getCanvasDimensions = () => {
    const format = step2Data?.safeZoneFormat || '9:16'
    if (format === '3:4') {
      return { w: 270, h: 360 } // 3:4 aspect ratio (270/360 = 0.75)
    }
    return { w: 270, h: 480 } // 9:16 aspect ratio (270/480 = 0.5625)
  }
  // ChatGPT's canvas initialization function
  const initPreviewCanvas = (canvas: HTMLCanvasElement, format: '9:16' | '3:4', cssW: number) => {
    const BASE_DESKTOP = {
      '9:16': { w: 1080, h: 1920 },
      '3:4': { w: 1080, h: 1440 },
    }
    
    const base = BASE_DESKTOP[format]
    const scale = cssW / base.w // e.g. 270/1080 = 0.25
    const dpr = window.devicePixelRatio || 1
    
    // Backing store in device pixels for crisp text
    canvas.width = Math.round(base.w * dpr * scale)
    canvas.height = Math.round(base.h * dpr * scale)

    // CSS size (how it appears on screen). Keep it in CSS pixels.
    canvas.style.width = `${Math.round(base.w * scale)}px`
    canvas.style.height = `${Math.round(base.h * scale)}px`

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
    // From here on, ALWAYS use DESKTOP UNITS (1080??1440 or 1080??1920).
    // No per-draw *SCALE is needed anymore.
    return { ctx, base, scale, dpr }
  }
  
  // Session management functions
  const createSession = (name: string) => {
    const newSession: SessionData = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: new Date()
    }
    
    // Save to localStorage
    const sessions = getStoredSessions()
    sessions.push(newSession)
    localStorage.setItem('drafter_sessions', JSON.stringify(sessions))
    
    setCurrentSession(newSession)
    setSessionName(name)
    setShowSessionCreation(false)
    setCurrentStep(1)
  }

  const getStoredSessions = (): SessionData[] => {
    try {
      const stored = localStorage.getItem('drafter_sessions')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load sessions:', error)
      return []
    }
  }

  const loadSession = (session: SessionData) => {
    setCurrentSession(session)
    setSessionName(session.name)
    if (session.step1Data) setStep1Data(session.step1Data)
    if (session.step2Data) setStep2Data(session.step2Data)
    if (session.step3Data) setStep3Data(session.step3Data)
    setShowSessionCreation(false)
    setCurrentStep(1)
  }

  const exportDraftAsPNG = async (slide: typeof generatedIdeas[0]['slides'][0]) => {
    if (!slide.renderConfig) {
      alert('Slide is still preparing. Please try again in a moment.')
      return
    }

    try {
      const canvas = await renderSlideToCanvas({
        slide: slide.renderConfig.slide,
        caption: slide.renderConfig.caption,
        scale: 1,
        dpr: 1
      })

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png', 1)
      )

      if (!blob) {
        throw new Error('Failed to generate PNG blob')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `drafter-slide-${slide.id}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export slide:', error)
      alert('Export failed. Please try again.')
    }
  }

  const exportAllDraftsAsZIP = async () => {
    if (generatedIdeas.length === 0) {
      alert('No drafts to export. Please generate drafts first.')
      return
    }

    setIsExporting(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      console.log(`?? Creating ZIP with ${generatedIdeas.length} ideas...`)

      // Group ideas by sheet for multi-sheet exports
      const hasMultipleSheets = generatedIdeas.some(idea => idea.sheetName) && 
                                 new Set(generatedIdeas.map(idea => idea.sheetName)).size > 1

      if (hasMultipleSheets) {
        // Multi-sheet export: organize by sheet folders
        const sheetGroups = new Map<string, typeof generatedIdeas>()
        
        for (const idea of generatedIdeas) {
          const sheetName = idea.sheetName || 'unsorted'
          if (!sheetGroups.has(sheetName)) {
            sheetGroups.set(sheetName, [])
          }
          sheetGroups.get(sheetName)!.push(idea)
        }

        for (const [sheetName, ideas] of sheetGroups) {
          const sheetFolder = zip.folder(sheetName)
          if (!sheetFolder) continue

          for (const idea of ideas) {
            const ideaFolder = sheetFolder.folder(`idea_${idea.ideaId.toString().padStart(2, '0')}`)
            if (!ideaFolder) continue

            for (let i = 0; i < idea.slides.length; i++) {
              const slide = idea.slides[i]
              if (!slide.renderConfig) {
                console.warn(`Slide ${slide.id} has no render config, skipping export`)
                continue
              }

              const fileName = `slide_${(i + 1).toString().padStart(2, '0')}.png`

              try {
                const canvas = await renderSlideToCanvas({
                  slide: slide.renderConfig.slide,
                  caption: slide.renderConfig.caption,
                  scale: 1,
                  dpr: 1
                })

                const blob = await new Promise<Blob | null>(resolve =>
                  canvas.toBlob(resolve, 'image/png', 1)
                )

                if (!blob) {
                  console.warn(`Slide ${slide.id} produced an empty blob, skipping`)
                  continue
                }

                ideaFolder.file(fileName, blob)
              } catch (error) {
                console.error(`Failed to export slide ${slide.id}:`, error)
              }
            }
          }
        }
      } else {
        // Single-sheet export: flat structure (backward compatible)
        for (const idea of generatedIdeas) {
          const ideaFolder = zip.folder(`idea_${idea.ideaId.toString().padStart(2, '0')}`)
          if (!ideaFolder) continue

          for (let i = 0; i < idea.slides.length; i++) {
            const slide = idea.slides[i]
            if (!slide.renderConfig) {
              console.warn(`Slide ${slide.id} has no render config, skipping export`)
              continue
            }

            const fileName = `slide_${(i + 1).toString().padStart(2, '0')}.png`

            try {
              const canvas = await renderSlideToCanvas({
                slide: slide.renderConfig.slide,
                caption: slide.renderConfig.caption,
                scale: 1,
                dpr: 1
              })

              const blob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, 'image/png', 1)
              )

              if (!blob) {
                console.warn(`Slide ${slide.id} produced an empty blob, skipping`)
                continue
              }

              ideaFolder.file(fileName, blob)
            } catch (error) {
              console.error(`Failed to export slide ${slide.id}:`, error)
            }
          }
        }
      }

      console.log('?? Generating ZIP file...')

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      console.log(`? ZIP file generated: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`)

      const downloadUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.download = `drafter_export_${new Date().toISOString().split('T')[0]}.zip`
      link.href = downloadUrl
      link.click()
      URL.revokeObjectURL(downloadUrl)

      const totalSlides = generatedIdeas.reduce((sum, idea) => sum + idea.slides.length, 0)
      alert(`? Successfully exported ${totalSlides} slides from ${generatedIdeas.length} ideas!\n\nZIP file contains:\n${generatedIdeas.length} folders (idea_01, idea_02, etc.)\nEach with their slides (slide_01.png, slide_02.png, etc.)`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const assignImagesToIdeas = useCallback(async (ideas: typeof generatedIdeas, seed?: string) => {
    console.log('🎨 ASSIGN IMAGES DEBUG')
    console.log('📊 Input ideas:', {
      count: ideas.length,
      sheets: [...new Set(ideas.map(idea => idea.sheetName))],
      totalSlides: ideas.reduce((sum, idea) => sum + idea.slides.length, 0),
      seed: seed || 'default'
    })

    if (!step2Data) {
      throw new Error('Step 2 settings are required for image assignment.')
    }

    // Filter images by explicit category first
    const affiliateImages = availableImages.filter(
      (img) => img.category === 'affiliate'
    )
    const aiMethodImages = availableImages.filter(
      (img) => img.category === 'ai-method'
    )
    
    console.log('🖼️ Image Categories:', {
      total: availableImages.length,
      affiliate: affiliateImages.length,
      aiMethod: aiMethodImages.length,
      uncategorized: availableImages.length - affiliateImages.length - aiMethodImages.length
    })
    
    // If no explicit categories, fall back to name-based filtering
    // (only if categories weren't set properly)
    const affiliateByFallback = affiliateImages.length === 0 
      ? availableImages.filter(img => !img.name?.includes('ai-method') && !img.category) 
      : affiliateImages
    const aiMethodByFallback = aiMethodImages.length === 0
      ? availableImages.filter(img => img.name?.includes('ai-method'))
      : aiMethodImages

    const shuffledAffiliate = [...affiliateByFallback]
    const shuffledAiMethod = [...aiMethodByFallback]

    // Use seeded shuffle if seed is provided, otherwise use Math.random()
    const shuffleFunction = (arr: any[]) => {
      if (seed) {
        // Simple seeded shuffle using the seed
        let hash = 0
        for (let i = 0; i < seed.length; i++) {
          hash = ((hash << 5) - hash) + seed.charCodeAt(i)
          hash = hash & hash // Convert to 32bit integer
        }
        
        const rng = () => {
          hash = ((hash << 5) - hash) + seed.length
          hash = hash & hash
          return Math.abs(hash) / 2147483648
        }
        
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1))
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
      } else {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
      }
    }
    
    shuffleFunction(shuffledAffiliate)
    shuffleFunction(shuffledAiMethod)

    let affiliateIndex = 0
    let aiMethodIndex = 0
    const thumbJobs: Array<{ slideId: string; renderConfig: SlideRenderConfig }> = []
    const oldThumbUrls: string[] = []
    const newUsedImageIds = new Set<string>()
    const updatedIdeas: typeof generatedIdeas = []
    const baseSettings = step2Data

    for (const idea of ideas) {
      const totalSlides = idea.slides.length
      const updatedSlides: typeof idea.slides = []

      for (let idx = 0; idx < idea.slides.length; idx++) {
        const slide = idea.slides[idx]
        // Respect existing imageSource if set, otherwise determine from slide index
        const desiredSource: 'affiliate' | 'ai-method' = slide.imageSource || 
          (idx === totalSlides - 1 ? 'ai-method' : 'affiliate')

        let chosenImage: AvailableImage | undefined

        if (desiredSource === 'ai-method' && shuffledAiMethod.length > 0) {
          chosenImage = shuffledAiMethod[aiMethodIndex % shuffledAiMethod.length]
          console.log(`🎯 Idea ${idea.ideaId}, Slide ${idx + 1} (LAST): AI Method - "${chosenImage.name}"`)
          aiMethodIndex++
        } else if (desiredSource === 'affiliate' && shuffledAffiliate.length > 0) {
          chosenImage = shuffledAffiliate[affiliateIndex % shuffledAffiliate.length]
          console.log(`📸 Idea ${idea.ideaId}, Slide ${idx + 1}: Affiliate - "${chosenImage.name}"`)
          affiliateIndex++
        } else if (shuffledAffiliate.length > 0) {
          chosenImage = shuffledAffiliate[affiliateIndex % shuffledAffiliate.length]
          console.log(`⚠️ Fallback: Idea ${idea.ideaId}, Slide ${idx + 1}: Affiliate - "${chosenImage.name}"`)
          affiliateIndex++
        } else if (shuffledAiMethod.length > 0) {
          chosenImage = shuffledAiMethod[aiMethodIndex % shuffledAiMethod.length]
          console.log(`⚠️ Fallback: Idea ${idea.ideaId}, Slide ${idx + 1}: AI Method - "${chosenImage.name}"`)
          aiMethodIndex++
        } else if (availableImages.length > 0) {
          chosenImage = availableImages[(idea.ideaId + idx) % availableImages.length]
          console.log(`⚠️ Final Fallback: Idea ${idea.ideaId}, Slide ${idx + 1}: Random - "${chosenImage.name}"`)
        }

        let nextImageUrl = slide.image
        if (chosenImage) {
          newUsedImageIds.add(chosenImage.id)
          if (chosenImage.fileHandle) {
            try {
              const file = await chosenImage.fileHandle.getFile()
              nextImageUrl = URL.createObjectURL(file)
            } catch (error) {
              console.warn('Failed to create blob URL from file handle, using existing URL', error)
              nextImageUrl = chosenImage.url
            }
          } else {
            nextImageUrl = chosenImage.url
          }
        }

        const format = (slide.format || baseSettings.safeZoneFormat || '9:16') as '9:16' | '3:4'
        const renderConfig = buildRenderConfig(
          nextImageUrl || null,
          slide.caption,
          format,
          baseSettings,
          slide.styleOverride,
          {
            rotate180: slide.rotateBg180,
            flipHorizontal: slide.flipH
          }
        )

        if (slide.thumbnail && slide.thumbnail.startsWith('blob:')) {
          oldThumbUrls.push(slide.thumbnail)
        }

        thumbJobs.push({ slideId: slide.id, renderConfig })

          updatedSlides.push({
            ...slide,
            image: nextImageUrl,
            imageSource: chosenImage?.category === 'ai-method' ? 'ai-method' : desiredSource,
            renderConfig,
            thumbnail: null,
            lastModified: Date.now()
          })
        }

      updatedIdeas.push({
        ...idea,
        slides: updatedSlides
      })
    }

    return { updatedIdeas, thumbJobs, oldThumbUrls, newUsedImageIds }
  }, [availableImages, step2Data])

  const randomizeAllImages = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    if (!step2Data) {
      if (!silent) alert('Step 2 settings are required before randomizing images.')
      return
    }

    if (generatedIdeas.length === 0) {
      if (!silent) alert('No images or drafts available to randomize.')
      return
    }

    if (availableImages.length === 0) {
      if (!silent) alert('No images available to randomize.')
      return
    }

    try {
      const { updatedIdeas, thumbJobs, oldThumbUrls, newUsedImageIds } = await assignImagesToIdeas(generatedIdeas)

      setGeneratedIdeas(updatedIdeas)
      setUsedImages(newUsedImageIds)

      thumbJobs.forEach(job => queueThumbnailForSlide(job.slideId, job.renderConfig))
      oldThumbUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url)
        } catch (error) {
          console.warn('Failed to revoke thumbnail URL', error)
        }
      })

      if (!silent) {
        alert('All images randomized successfully!')
      }
    } catch (error) {
      console.error('Failed to randomize images:', error)
      if (!silent) {
        alert('Failed to randomize images. Please try again.')
      }
    }
  }

  // Randomize a single slide's image


  const randomizeSingleSlideImage = async (ideaIndex: number, slideIndex: number) => {
    if (!step2Data) {
      alert('Step 2 settings are required before randomizing images.')
      return
    }

    if (availableImages.length === 0) {
      alert('No images available to randomize.')
      return
    }

    try {
      const idea = generatedIdeas[ideaIndex]
      if (!idea) {
        console.error('Idea not found at index:', ideaIndex)
        return
      }

      const slide = idea.slides[slideIndex]
      if (!slide) {
        console.error('Slide not found at index:', slideIndex)
        return
      }

      const slideImageSource =
        slide.imageSource || (slideIndex === idea.slides.length - 1 ? 'ai-method' : 'affiliate')
      
      console.log(`🔄 Randomizing Idea ${idea.ideaId}, Slide ${slideIndex + 1} (source: ${slideImageSource})`)

      // Filter images by explicit category first (same logic as assignImagesToIdeas)
      const affiliateImages = availableImages.filter(img => img.category === 'affiliate')
      const aiMethodImages = availableImages.filter(img => img.category === 'ai-method')
      
      // If no explicit categories, fall back to name-based filtering
      const affiliateByFallback = affiliateImages.length === 0 
        ? availableImages.filter(img => !img.name?.includes('ai-method') && !img.category) 
        : affiliateImages
      const aiMethodByFallback = aiMethodImages.length === 0
        ? availableImages.filter(img => img.name?.includes('ai-method'))
        : aiMethodImages
      
      let availableForSelection = slideImageSource === 'ai-method' ? aiMethodByFallback : affiliateByFallback
      
      console.log(`📊 Available pools: Affiliate=${affiliateByFallback.length}, AI Method=${aiMethodByFallback.length}, Selected=${availableForSelection.length}`)

      availableForSelection = availableForSelection.filter(img => !usedImages.has(img.id))

      if (availableForSelection.length === 0) {
        console.log('⚠️ No unused images, resetting usedImages and using full pool')
        setUsedImages(new Set())
        availableForSelection = slideImageSource === 'ai-method' ? aiMethodByFallback : affiliateByFallback
      }

      availableForSelection = availableForSelection.filter(img => img.url !== slide.image)

      if (availableForSelection.length === 0) {
        alert('No other images available.')
        return
      }

      const newImage = availableForSelection[Math.floor(Math.random() * availableForSelection.length)]

      let nextImageUrl = newImage.url
      if (newImage.fileHandle) {
        try {
          const file = await newImage.fileHandle.getFile()
          nextImageUrl = URL.createObjectURL(file)
        } catch (error) {
          console.warn('Failed to create fresh blob URL, using existing URL', error)
        }
      }

      const format = (slide.format || step2Data.safeZoneFormat || '9:16') as '9:16' | '3:4'
      const renderConfig = buildRenderConfig(
        nextImageUrl || null,
        slide.caption,
        format,
        step2Data,
        slide.styleOverride,
        {
          rotate180: slide.rotateBg180,
          flipHorizontal: slide.flipH
        }
      )

      const previousThumb = slide.thumbnail

      setGeneratedIdeas(prev =>
        prev.map((ideaItem, iIdx) =>
          iIdx !== ideaIndex
            ? ideaItem
            : {
                ...ideaItem,
                slides: ideaItem.slides.map((s, sIdx) =>
                  sIdx !== slideIndex
                    ? s
                    : {
                        ...s,
                        image: nextImageUrl,
                        imageSource: slideImageSource,
                        renderConfig,
                        thumbnail: null,
                        lastModified: Date.now()
                      }
                )
              }
        )
      )

      if (previousThumb && previousThumb.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previousThumb)
        } catch (error) {
          console.warn('Failed to revoke thumbnail URL', error)
        }
      }

      queueThumbnailForSlide(slide.id, renderConfig)
      setUsedImages(prev => new Set([...prev, newImage.id]))
    } catch (error) {
      console.error('Failed to randomize slide image:', error)
      alert('Failed to randomize image. Please try again.')
    }
  }

  // Initialize Step 2 with random caption and image
  useEffect(() => {
    if (currentStep === 2 && step1Data && !currentCaption) {
      handleRandomCaption()
      handleRandomImage()
    }
  }, [currentStep, step1Data, currentCaption, handleRandomCaption, handleRandomImage])

  // Close project handlers
  const handleSaveAndExit = () => {
    // Note: Project data is automatically saved in the session store
    // No need to manually save here since we're using persistent sessions
    
    setShowCloseProjectModal(false)
    // Reset to initial state
    setCurrentStep(1)
    setStep1Data(null)
    setStep2Data(null)
    setGeneratedIdeas([])
    setShowSessionCreation(true)
    alert('Project saved successfully!')
  }

  const handleExitWithoutSaving = () => {
    setShowCloseProjectModal(false)
    // Reset to initial state without saving
    setCurrentStep(1)
    setStep1Data(null)
    setStep2Data(null)
    setGeneratedIdeas([])
    setShowSessionCreation(true)
  }

  // Slide editor handlers
  const generateAllDrafts = async () => {
    if (!step1Data?.ideas || step1Data.ideas.length === 0) {
      alert('Please ensure you have ideas loaded from Google Sheets')
      return
    }

    setIsGenerating(true)
    try {
      await startGeneration()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditSlide = (ideaIndex: number, slideIndex: number) => {
    setEditingSlide({ ideaIndex, slideIndex })
    setShowSlideEditor(true)
  }

  const toggleIdeaExpansion = (ideaId: number) => {
    setGeneratedIdeas((prev) =>
      prev.map((idea) =>
        idea.ideaId === ideaId ? { ...idea, isExpanded: !idea.isExpanded } : idea
      )
    )
  }

  const getIdeaFormatPlan = (index: number, total: number): IdeaFormatPlan => {
    const pref = generationPreferences.format
    if (pref === 'combined' && total > 0) {
      const bucketSize = Math.max(1, Math.floor(total / 3))
      if (index < bucketSize) return '9:16'
      if (index < bucketSize * 2) return '3:4'
      return 'mixed'
    }
    return pref === '3:4' ? '3:4' : '9:16'
  }

  const getIdeaTitle = (
    idea: any,
    entries: Array<{ column: string; text: string }>,
    fallback: string
  ): string => {
    const priorityKeys = ['Idea', 'Title', 'Hook', 'Topic', 'Headline', 'Subject']
    for (const key of priorityKeys) {
      const value = idea?.[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return entries[0]?.text || fallback
  }

  const startGeneration = useCallback(async () => {
    console.log('🚀 START GENERATION DEBUG')
    console.log('📊 Step1Data:', {
      hasIdeas: !!step1Data?.ideas,
      ideasCount: step1Data?.ideas?.length || 0,
      selectedSheets: step1Data?.selectedSheets || [],
      sheetsData: step1Data?.sheetsData ? Object.keys(step1Data.sheetsData) : [],
      slideColumns: step1Data?.slideColumns || [],
      summary: step1Data?.summary || {}
    })

    if (!step1Data?.ideas || step1Data.ideas.length === 0) {
      alert('Please load ideas in Step 1 before generating drafts.')
      return
    }

    if (!step2Data) {
      alert('Step 2 settings are required before generating drafts.')
      setCurrentStep(2)
      return
    }

    const slideColumns =
      (step1Data.slideColumns && step1Data.slideColumns.length > 0
        ? step1Data.slideColumns
        : step1Data.summary?.slideCols) ?? []

    if (slideColumns.length === 0) {
      alert('No slide columns were detected in your spreadsheet. Please verify the sheet format.')
      return
    }

    console.log('📋 Slide Columns:', slideColumns)

    setIsGeneratingDrafts(true)

    // Calculate total ideas for multi-sheet mode
    let totalIdeas = 0
    if (step1Data.selectedSheets && step1Data.selectedSheets.length > 1 && step1Data.sheetsData) {
      // Multi-sheet mode: sum ideas from all sheets
      for (const sheetData of Object.values(step1Data.sheetsData)) {
        totalIdeas += (sheetData.ideas || []).length
      }
    } else {
      // Single-sheet mode: use merged ideas
      totalIdeas = step1Data.ideas.length
    }
    
    const progressState = {
      completed: 0,
      total: totalIdeas,
      currentSlide: 0,
      eta: 0,
      formats: [] as Array<{ slide: number; format: '9:16' | '3:4' }>
    }
    setGenerationProgress(progressState)

    const startTime = performance.now()
    const baseIdeas: typeof generatedIdeas = []
    let globalSlideCounter = 0
    let completedIdeas = 0
    
    // Track ideaId per sheet for independent numbering
    const sheetCounters = new Map<string, number>()

    console.log('🔄 Processing ideas...')

    try {
      // Check if we have multi-sheet data
      const isMultiSheet = step1Data.selectedSheets && step1Data.selectedSheets.length > 1
      
      if (isMultiSheet && step1Data.sheetsData) {
        // Multi-sheet mode: Process each sheet independently with per-sheet image assignment
        const runId = new Date().toISOString()
        console.log('🌐 Multi-sheet mode: Processing sheets independently')
        console.log('🚀 RUN ID:', runId)
        
        for (const [sheetName, sheetData] of Object.entries(step1Data.sheetsData)) {
          const slideColumns = sheetData.slideColumns || []
          
          if (slideColumns.length === 0) {
            console.warn(`No slide columns found for sheet ${sheetName}, skipping`)
            continue
          }

          const ideas = sheetData.ideas || []
          console.log(`📊 Processing sheet "${sheetName}": ${ideas.length} ideas`)
          
          // PER-SHEET STATE: All variables scoped to this sheet
          const sheetCompletedIdeas: typeof generatedIdeas = []
          
          // Process this sheet's ideas independently
          ideas.forEach((rawIdea, idx) => {
            console.log(`\n📝 Processing ${sheetName} Idea ${idx + 1}:`, {
              sheetName: rawIdea._sheetName || sheetName,
              ideaKeys: Object.keys(rawIdea),
              sampleData: Object.fromEntries(Object.entries(rawIdea).slice(0, 3))
            })
            
            const slideEntries = slideColumns
              .map((column) => {
                const value = rawIdea?.[column]
                const text = value === null || value === undefined ? '' : String(value).trim()
                return { column, text }
              })
              .filter((entry) => entry.text && entry.text.toLowerCase() !== 'nan')

            // Use per-sheet counter for ideaId (1-N per sheet)
            const ideaId = idx + 1
            
            const ideaPlan = getIdeaFormatPlan(idx, ideas.length) // Use sheet's idea count, not total
            const slides: typeof generatedIdeas[0]['slides'] = []

            slideEntries.forEach((entry, slideIdx) => {
              const isLastSlide = slideIdx === slideEntries.length - 1
              const desiredSource: 'affiliate' | 'ai-method' = isLastSlide ? 'ai-method' : 'affiliate'
              const slideFormat =
                ideaPlan === 'mixed'
                  ? (slideIdx % 2 === 0 ? '9:16' : '3:4')
                  : (ideaPlan as '9:16' | '3:4')

              const slideId = `${sheetName}-idea-${ideaId}-slide-${slideIdx + 1}`
              
              console.log(`  📄 ${sheetName} Slide ${slideIdx + 1}/${slideEntries.length}:`, {
                slideId,
                isLastSlide,
                imageSource: desiredSource,
                format: slideFormat,
                caption: entry.text.substring(0, 50) + '...'
              })
              
              slides.push({
                id: slideId,
                caption: entry.text,
                image: '',
                renderConfig: buildRenderConfig(
                  null,
                  entry.text,
                  slideFormat,
                  step2Data
                ),
                thumbnail: null,
                createdAt: new Date(),
                slideNumber: slideIdx + 1,
                imageSource: desiredSource,
                format: slideFormat,
                lastModified: Date.now(),
                rotateBg180: false,
                flipH: false,
                styleOverride: undefined
              })

              globalSlideCounter += 1
              progressState.formats.push({
                slide: globalSlideCounter,
                format: slideFormat === '3:4' ? '3:4' : '9:16'
              })
            })

            const ideaTitle = getIdeaTitle(rawIdea, slideEntries, `${sheetName} Idea ${ideaId}`)

            if (slides.length > 0) {
              sheetCompletedIdeas.push({
                ideaId,
                ideaText: ideaTitle,
                slides,
                isExpanded: false,
                sheetName: sheetName // Use the current sheet name
              })
            }

            completedIdeas++
            progressState.completed = completedIdeas
            progressState.currentSlide = slides.length
            const elapsedSeconds = (performance.now() - startTime) / 1000
            const averagePerIdea = elapsedSeconds / completedIdeas
            progressState.eta = Math.max(0, Math.round(averagePerIdea * (totalIdeas - completedIdeas)))
            setGenerationProgress({ ...progressState })
          })
          
          // Add this sheet's ideas to the base ideas
          baseIdeas.push(...sheetCompletedIdeas)
          
          console.log(`✅ Completed ${sheetName}: ${sheetCompletedIdeas.length} ideas with ${sheetCompletedIdeas.reduce((sum, idea) => sum + idea.slides.length, 0)} slides`)
        }
        
        // Now assign images to each sheet's ideas with per-sheet seeding
        console.log('🎨 Assigning images per sheet with unique seeds')
        const updatedIdeasArray: typeof generatedIdeas = []
        let allThumbJobs: Array<{ slideId: string; renderConfig: SlideRenderConfig }> = []
        let allOldThumbUrls: string[] = []
        let allNewUsedImageIds = new Set<string>()
        
        for (const [sheetName, sheetData] of Object.entries(step1Data.sheetsData)) {
          const sheetIdeas = baseIdeas.filter(idea => idea.sheetName === sheetName)
          if (sheetIdeas.length === 0) continue
          
          const sheetSeed = `${runId}:${sheetName}`
          console.log(`🎨 Assigning images for ${sheetName} with seed: ${sheetSeed}`)
          
          const { updatedIdeas, thumbJobs, oldThumbUrls, newUsedImageIds } = await assignImagesToIdeas(sheetIdeas, sheetSeed)
          
          updatedIdeasArray.push(...updatedIdeas)
          allThumbJobs.push(...thumbJobs)
          allOldThumbUrls.push(...oldThumbUrls)
          newUsedImageIds.forEach(id => allNewUsedImageIds.add(id))
        }
        
        setGeneratedIdeas(updatedIdeasArray)
        setUsedImages(allNewUsedImageIds)
        allThumbJobs.forEach((job) => queueThumbnailForSlide(job.slideId, job.renderConfig))
        allOldThumbUrls.forEach((url) => {
          try {
            URL.revokeObjectURL(url)
          } catch (error) {
            console.warn('Failed to revoke thumbnail URL', error)
          }
        })
        
        console.log('✅ All sheets processed with unique image assignments')
        
        // Continue to image assignment and progress to Step 3
      } else {
        // Single-sheet mode: Process merged ideas (backward compatibility)
        console.log('📄 Single-sheet mode: Processing merged ideas')
        
        step1Data.ideas.forEach((rawIdea, idx) => {
          console.log(`\n📝 Processing Idea ${idx + 1}:`, {
            sheetName: rawIdea._sheetName,
            ideaKeys: Object.keys(rawIdea),
            sampleData: Object.fromEntries(Object.entries(rawIdea).slice(0, 3))
          })
          
          const slideEntries = slideColumns
            .map((column) => {
              const value = rawIdea?.[column]
              const text = value === null || value === undefined ? '' : String(value).trim()
              return { column, text }
            })
            .filter((entry) => entry.text && entry.text.toLowerCase() !== 'nan')

          const sheetName = rawIdea._sheetName || 'default'
          
          // Get or initialize counter for this sheet
          if (!sheetCounters.has(sheetName)) {
            sheetCounters.set(sheetName, 0)
          }
          const currentSheetCount = sheetCounters.get(sheetName)! + 1
          sheetCounters.set(sheetName, currentSheetCount)
          
          // Use per-sheet counter for ideaId
          const ideaId = currentSheetCount
          
          const ideaPlan = getIdeaFormatPlan(idx, totalIdeas)
          const ideaIndex = baseIdeas.length
          const slides: typeof generatedIdeas[0]['slides'] = []

          slideEntries.forEach((entry, slideIdx) => {
            const isLastSlide = slideIdx === slideEntries.length - 1
            const desiredSource: 'affiliate' | 'ai-method' = isLastSlide ? 'ai-method' : 'affiliate'
            const slideFormat =
              ideaPlan === 'mixed'
                ? (slideIdx % 2 === 0 ? '9:16' : '3:4')
                : (ideaPlan as '9:16' | '3:4')

            const slideId = `idea-${ideaId}-slide-${slideIdx + 1}`
            
            console.log(`  📄 Slide ${slideIdx + 1}/${slideEntries.length}:`, {
              slideId,
              isLastSlide,
              imageSource: desiredSource,
              format: slideFormat,
              caption: entry.text.substring(0, 50) + '...'
            })
            
            slides.push({
              id: slideId,
              caption: entry.text,
              image: '',
              renderConfig: buildRenderConfig(
                null,
                entry.text,
                slideFormat,
                step2Data
              ),
              thumbnail: null,
              createdAt: new Date(),
              slideNumber: slideIdx + 1,
              imageSource: desiredSource,
              format: slideFormat,
              lastModified: Date.now(),
              rotateBg180: false,
              flipH: false,
              styleOverride: undefined
            })

            globalSlideCounter += 1
            progressState.formats.push({
              slide: globalSlideCounter,
              format: slideFormat === '3:4' ? '3:4' : '9:16'
            })
          })

          const ideaTitle = getIdeaTitle(rawIdea, slideEntries, `Idea ${ideaId}`)

          if (slides.length > 0) {
            baseIdeas.push({
              ideaId,
              ideaText: ideaTitle,
              slides,
              isExpanded: false,
              sheetName: rawIdea._sheetName || null // Track which sheet this idea came from
            })
          }

          progressState.completed = idx + 1
          progressState.currentSlide = slides.length
          const elapsedSeconds = (performance.now() - startTime) / 1000
          const averagePerIdea = elapsedSeconds / (idx + 1)
          progressState.eta = Math.max(0, Math.round(averagePerIdea * (totalIdeas - (idx + 1))))
          setGenerationProgress({ ...progressState })
        })
      }

      if (baseIdeas.length === 0) {
        alert('No slides were generated. Please verify your spreadsheet content.')
        setGenerationProgress(null)
        setIsGeneratingDrafts(false)
        return
      }

      // Only assign images if not already done (multi-sheet mode already assigns per sheet)
      const isMultiSheet = step1Data.selectedSheets && step1Data.selectedSheets.length > 1
      
      if (!isMultiSheet) {
        // Single-sheet mode: assign images now
        const { updatedIdeas, thumbJobs, oldThumbUrls, newUsedImageIds } = await assignImagesToIdeas(baseIdeas)

        setGeneratedIdeas(updatedIdeas)
        setUsedImages(newUsedImageIds)
        thumbJobs.forEach((job) => queueThumbnailForSlide(job.slideId, job.renderConfig))
        oldThumbUrls.forEach((url) => {
          try {
            URL.revokeObjectURL(url)
          } catch (error) {
            console.warn('Failed to revoke thumbnail URL', error)
          }
        })

        setSelectedDraft(updatedIdeas[0]?.slides[0]?.id ?? null)
      } else {
        // Multi-sheet mode: images already assigned per sheet, just select first draft
        setSelectedDraft(generatedIdeas[0]?.slides[0]?.id ?? null)
      }

      setGenerationProgress(null)
      setCurrentStep(4)
    } catch (error) {
      console.error('Failed to generate drafts:', error)
      alert('Draft generation failed. Please try again.')
    } finally {
      setIsGeneratingDrafts(false)
    }
  }, [assignImagesToIdeas, generationPreferences.format, step1Data, step2Data])



  const handleSaveSlide = async (updatedSlide: any) => {
    if (!editingSlide || !step2Data) return

    try {
      const { ideaIndex, slideIndex } = editingSlide
      const idea = generatedIdeas[ideaIndex]
      if (!idea) return

      const existingSlide = idea.slides[slideIndex]
      if (!existingSlide) return

      const nextFormat = (
        updatedSlide.format ||
        existingSlide.format ||
        step2Data.safeZoneFormat ||
        '9:16'
      ) as '9:16' | '3:4'
      const nextCaption = updatedSlide.caption ?? existingSlide.caption
      const nextImageUrl = updatedSlide.image || existingSlide.image || ''
      const override =
        updatedSlide.styleOverride && Object.keys(updatedSlide.styleOverride).length > 0
          ? updatedSlide.styleOverride
          : existingSlide.styleOverride

      const renderConfig = buildRenderConfig(
        nextImageUrl || null,
        nextCaption,
        nextFormat,
        step2Data,
        override,
        {
          rotate180: updatedSlide.rotateBg180,
          flipHorizontal: updatedSlide.flipH
        }
      )

      const previousThumb = existingSlide.thumbnail

      setGeneratedIdeas(prev =>
        prev.map((ideaItem, iIdx) =>
          iIdx !== ideaIndex
            ? ideaItem
            : {
                ...ideaItem,
                slides: ideaItem.slides.map((slideItem, sIdx) => {
                  if (sIdx !== slideIndex) {
                    return slideItem
                  }

                  const nextSlide = {
                    ...slideItem,
                    ...updatedSlide,
                    image: nextImageUrl,
                    caption: nextCaption,
                    format: nextFormat,
                    styleOverride: override,
                    renderConfig,
                    thumbnail: null,
                    lastModified: Date.now(),
                    imageSource: updatedSlide.imageSource ?? slideItem.imageSource
                  }

                  return nextSlide
                })
              }
        )
      )

      if (previousThumb && previousThumb.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(previousThumb)
        } catch (error) {
          console.warn('Failed to revoke thumbnail URL', error)
        }
      }

      queueThumbnailForSlide(existingSlide.id, renderConfig)
    } catch (error) {
      console.error('Failed to save slide:', error)
      alert('Failed to save slide changes')
    }

    setShowSlideEditor(false)
    setEditingSlide(null)
  }

  const renderStep1 = () => {
    return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Step 1: Select Ideas
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
            Choose your Google Sheets file to access your idea files
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
          {/* Check if user is authenticated */}
        {status === 'unauthenticated' && (
          <div 
            className="p-8 rounded-lg border text-center"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}
          >
            <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <UserIcon size="xl" color="#8B5CF6" />
                </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                  Sign in to Drafter
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                  Sign in with your Google account to access your idea files
              </p>
            </div>
            
            <button
                onClick={() => signIn('google')}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
            >
              Sign in with Google
            </button>
          </div>
        )}

          {/* Check if Google Sheets is connected */}
          {status === 'authenticated' && localStorage.getItem('sheets_connected') !== 'true' && (
            <div 
              className="p-6 rounded-lg border text-center"
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.border 
              }}
            >
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Sheets_logo_%282014-2020%29.svg"
                    alt="Google Sheets"
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                  Connect Google Sheets
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                  Go to your profile settings to connect your Google Sheets account
                  </p>
                </div>
              
              <button
                onClick={() => {
                  // Open profile modal to connect Google Sheets
                  window.dispatchEvent(new CustomEvent('openProfileModal'))
                }}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}
              >
                Open Profile Settings
              </button>
              
              <p className="text-xs mt-4" style={{ color: colors.textMuted }}>
                Click your profile in the sidebar to manage connections
              </p>
            </div>
          )}

          {/* Spreadsheet Selection - only show if authenticated and connected */}
          {status === 'authenticated' && localStorage.getItem('sheets_connected') === 'true' && (
            <div className="space-y-6">
            {/* Spreadsheet Selector */}
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.border 
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Select Spreadsheet
              </h3>
              
              {isLoadingSheets ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-transparent mx-auto mb-2" style={{ borderTopColor: colors.accent }}></div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Loading your spreadsheets...
                  </p>
                </div>
              ) : spreadsheets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                    No spreadsheets found in your Google Drive
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    Make sure you have Google Sheets in your Drive, then try signing out and back in.
                  </p>
                  <button
                    onClick={() => {
                      console.log('Retrying fetch...')
                      fetchSpreadsheets()
                    }}
                    className="mt-3 px-4 py-2 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: colors.surface2, 
                      borderColor: colors.border,
                      color: colors.text 
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                  <>
                    <label htmlFor="spreadsheet-select" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                      Choose a spreadsheet
                    </label>
                <select
                      id="spreadsheet-select"
                      name="spreadsheetId"
                      value={step1Data?.spreadsheetId || ''}
                  onChange={(e) => handleSpreadsheetSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
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
                  </>
              )}
            </div>

            {/* Sheet/Tab Selector */}
            {availableSheets.length > 0 && (
              <div 
                className="p-6 rounded-lg border"
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border 
                }}
              >
                  <label htmlFor="sheet-select" className="block text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Select Day Sheet
                  </label>
                
                <select
                    id="sheet-select"
                    name="sheetName"
                  value={step1Data?.sheetName || ''}
                  onChange={(e) => handleSheetSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="">Select a sheet...</option>
                  {availableSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Summary */}
            {step1Data?.sheetName && (
              <div 
                className="p-6 rounded-lg border"
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border 
                }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Ready to Generate
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {step1Data.summary.ideasCount}
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      Ideas Available
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {step1Data.summary.slideCols.length}
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      Slide Columns
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.surface2 }}>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    <strong>Spreadsheet:</strong> {step1Data.spreadsheetName}<br />
                    <strong>Sheet:</strong> {step1Data.sheetName}<br />
                    <strong>Note:</strong> Content images will be pulled from your Content page.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
  }

  const renderStep2_5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Generate Drafts
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Choose export format and generate drafts from your ideas
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium" style={{ color: colors.text }}>
          Export Format
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: '9:16', label: '9:16 Only', description: 'All ideas in 9:16 format (TikTok vertical)' },
            { value: '3:4', label: '3:4 Only', description: 'All ideas in 3:4 format (Instagram square)' },
            { value: 'combined', label: '9:16 & 3:4 Combined', description: 'Balanced mix: some ideas all 9:16, some all 3:4, some with mixed slides' }
          ].map((option) => (
            <label
              key={option.value}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                generationPreferences.format === option.value ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: generationPreferences.format === option.value ? colors.accent + '20' : colors.surface2,
                borderColor: generationPreferences.format === option.value ? colors.accent : colors.border,
                ringColor: colors.accent
              }}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={generationPreferences.format === option.value}
                  onChange={(e) => setGenerationPreferences(prev => prev ? { ...prev, format: e.target.value as '9:16' | '3:4' | 'combined' } : null)}
                  className="mt-1"
                  style={{ accentColor: colors.accent }}
                />
                <div className="flex-1">
                  <div className="font-medium" style={{ color: colors.text }}>
                    {option.label}
                  </div>
                  <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    {option.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Ideas Count */}
      {step1Data?.ideas && (
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: colors.surface2 }}>
          <div className="text-sm" style={{ color: colors.textMuted }}>
            Found <span className="font-medium" style={{ color: colors.text }}>{step1Data.ideas.length}</span> ideas from your spreadsheet
          </div>
          <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
            {generationPreferences.format === 'combined' 
              ? `Will generate ${step1Data.ideas.length} drafts: ~${Math.floor(step1Data.ideas.length/3)} pure 9:16, ~${Math.floor(step1Data.ideas.length/3)} pure 3:4, ~${Math.floor(step1Data.ideas.length/3)} mixed`
              : `Will generate ${step1Data.ideas.length} drafts in ${generationPreferences.format} format`
            }
          </div>
        </div>
      )}

      {/* Generation Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={startGeneration}
          disabled={isGeneratingDrafts || !step1Data?.ideas || step1Data.ideas.length === 0}
          className="px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
          style={{
            backgroundColor: colors.accent,
            color: 'white'
          }}
        >
          {isGeneratingDrafts ? 'Generating...' : 'Generate Drafts'}
        </button>
      </div>

      {/* Generation Progress */}
      {isGeneratingDrafts && generationProgress && (
        <div className="space-y-4 p-6 rounded-lg border" style={{ backgroundColor: colors.surface2, borderColor: colors.border }}>
          <div className="text-center">
            <h4 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
              Generating Drafts
            </h4>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              Idea {generationProgress.completed} of {generationProgress.total}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                backgroundColor: colors.accent,
                width: `${(generationProgress.completed / generationProgress.total) * 100}%`
              }}
            />
          </div>

          {/* ETA */}
          <div className="text-center text-sm" style={{ color: colors.textMuted }}>
            ETA: {Math.ceil(generationProgress.eta / 60)}m {generationProgress.eta % 60}s
          </div>

          {/* Format Preview */}
          {generationProgress.formats.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: colors.text }}>
                Format Assignment Preview:
              </div>
              <div className="grid grid-cols-5 gap-2">
                {generationProgress.formats.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs text-center ${
                      index < generationProgress.completed ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{
                      backgroundColor: item.format === '9:16' ? colors.accent + '30' : colors.primary + '30',
                      color: colors.text
                    }}
                  >
                    {item.slide}: {item.format}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Helper function to get format label for an idea
  const getIdeaFormatLabel = (idea: typeof generatedIdeas[0]) => {
    const formats = idea.slides.map(slide => slide.format)
    const has916 = formats.includes('9:16')
    const has34 = formats.includes('3:4')
    
    if (has916 && has34) {
      return 'Mixed Formats'
    } else if (has916) {
      return '9:16 Format'
    } else if (has34) {
      return '3:4 Format'
    }
    return 'Unknown'
  }

  // Session Creation Panel
  if (showSessionCreation) {
    const storedSessions = getStoredSessions()
    
    return (
      <div className="h-full overflow-y-auto" style={{ backgroundColor: colors.background }}>
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="w-full max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
                <PlusIcon size="lg" color="white" />
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                Create New Session
              </h1>
              <p className="text-lg" style={{ color: colors.textMuted }}>
                Start a new project or continue from a previous session
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* New Session Card */}
              <div className="rounded-2xl p-8 border-2 border-dashed transition-all duration-200 hover:border-solid relative" 
                   style={{ 
                     backgroundColor: colors.surface1,
                     borderColor: colors.accent
                   }}>
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  variant="purple"
                  borderWidth={2}
                />
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
                      <PlusIcon size="md" color="white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                      New Project
                    </h3>
                    <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                      Create a fresh session for your new content
                    </p>
                    <SessionCreationForm onCreateSession={createSession} colors={colors} />
                  </div>
              </div>
              
              {/* Recent Sessions Card */}
              <div className="rounded-2xl p-8 border relative" 
                   style={{ 
                     backgroundColor: colors.surface1,
                     borderColor: colors.border
                   }}>
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  variant="purple"
                  borderWidth={1}
                />
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.surface2 }}>
                      <SettingsIcon size="md" color={colors.accent} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                      Recent Sessions
                    </h3>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      Continue from where you left off
                    </p>
                  </div>
                
                {storedSessions.length > 0 ? (
                  <div 
                    className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide" 
                    style={{ 
                      position: 'relative',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {storedSessions.slice(-5).reverse().map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        className="w-full p-4 rounded-xl cursor-pointer focus:outline-none relative"
                        style={{ 
                          backgroundColor: colors.surface2, 
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          WebkitTapHighlightColor: 'transparent',
                          userSelect: 'none',
                          boxShadow: 'none',
                          position: 'relative',
                          zIndex: 1
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${colors.surface2}dd`
                          e.currentTarget.style.borderColor = colors.accent + '60'
                          e.currentTarget.style.boxShadow = `0 0 20px ${colors.accent}40, 0 0 40px ${colors.accent}20`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.surface2
                          e.currentTarget.style.borderColor = colors.border
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.currentTarget.blur()}
                        onClick={(e) => {
                          loadSession(session)
                          e.currentTarget.blur()
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="font-medium text-sm">{session.name}</div>
                            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                              {new Date(session.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <ChevronRightIcon size="sm" color={colors.textMuted} />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      No recent sessions found
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Close Project Modal */}
        <CloseProjectModal
          isOpen={showCloseProjectModal}
          onClose={() => setShowCloseProjectModal(false)}
          onSaveAndExit={handleSaveAndExit}
          onExitWithoutSaving={handleExitWithoutSaving}
          projectName={sessionName}
        />

        {/* Slide Editor */}
        {showSlideEditor && editingSlide && step2Data && (
          <SlideEditor
            isOpen={showSlideEditor}
            onClose={() => {
              setShowSlideEditor(false)
              setEditingSlide(null)
            }}
            onSave={handleSaveSlide}
            slide={generatedIdeas[editingSlide.ideaIndex].slides[editingSlide.slideIndex]}
            globalSettings={step2Data}
            onRandomizeImage={() => {
              if (editingSlide) {
                console.log(`???? SlideEditor randomize button clicked! Idea: ${editingSlide.ideaIndex}, Slide: ${editingSlide.slideIndex}`)
                randomizeSingleSlideImage(editingSlide.ideaIndex, editingSlide.slideIndex)
              }
            }}
          />
        )}

        {/* Session Info */}
        {currentSession && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: colors.surface1, borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: colors.text }}>
                  {currentSession.name}
                </h3>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Created: {new Date(currentSession.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowCloseProjectModal(true)}
                className="px-4 py-2 text-sm rounded border font-medium"
                style={{ 
                  backgroundColor: colors.surface2, 
                  borderColor: colors.border,
                  color: colors.text 
                }}
              >
                Save & Close Project
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step <= currentStep ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: step <= currentStep ? colors.accent : colors.surface2,
                    color: step <= currentStep ? 'white' : colors.textMuted
                  }}
                >
                  {step < currentStep ? <CheckIcon size="sm" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      step < currentStep ? '' : 'opacity-30'
                    }`}
                    style={{ backgroundColor: step < currentStep ? colors.accent : colors.border }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Step1Pane
            colors={colors}
            status={status}
            isLoadingSheets={isLoadingSheets}
            spreadsheets={spreadsheets}
            fetchSpreadsheets={fetchSpreadsheets}
            step1Data={step1Data}
            handleSpreadsheetSelect={handleSpreadsheetSelect}
            availableSheets={availableSheets}
            handleSheetSelect={handleSheetSelect}
            handleMultiSheetSelect={handleMultiSheetSelect}
            signIn={signIn}
          />
        )}
        {currentStep === 2 && (
          <Step2Pane
            colors={colors}
            fontLoaded={fontLoaded}
            getCanvasDimensions={getCanvasDimensions}
            step2Data={step2Data}
            setStep2Data={setStep2Data}
            currentImage={currentImage}
            currentCaption={currentCaption}
            setCurrentCaption={setCurrentCaption}
            handleRandomImage={handleRandomImage}
            handleRandomCaption={handleRandomCaption}
            drawCaption={drawCaptionUsingStep2Settings}
          />
        )}
        {currentStep === 3 && renderStep2_5()}
        {currentStep === 4 && (
          <Step3Pane
            colors={colors}
            generatedIdeas={generatedIdeas}
            selectedDraft={selectedDraft}
            setSelectedDraft={setSelectedDraft}
            isGenerating={isGenerating}
            isExporting={isExporting}
            exportProgress={exportProgress}
            step1Data={step1Data}
            step2Data={step2Data}
            availableImages={availableImages}
            randomizeAllImages={randomizeAllImages}
            generateAllDrafts={generateAllDrafts}
            toggleIdeaExpansion={toggleIdeaExpansion}
            getIdeaFormatLabel={getIdeaFormatLabel}
            handleEditSlide={handleEditSlide}
            randomizeSingleSlideImage={randomizeSingleSlideImage}
            exportDraftAsPNG={exportDraftAsPNG}
            exportAllDraftsAsZIP={exportAllDraftsAsZIP}
            drawCaption={drawCaptionUsingStep2Settings}
          />
        )}

        {/* Navigation */}
        {currentStep !== 3 && (
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-lg border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: currentStep === 1 ? colors.surface2 : colors.buttonBg, 
              borderColor: colors.border, 
              color: colors.text 
            }}
          >
            <ChevronLeftIcon size="sm" />
            Previous
          </button>

          <button
            onClick={nextStep}
            disabled={!canProceedToStep(currentStep + 1)}
            className="px-6 py-3 rounded-lg border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: canProceedToStep(currentStep + 1) ? colors.accent : colors.surface2, 
              borderColor: canProceedToStep(currentStep + 1) ? colors.accent : colors.border, 
              color: canProceedToStep(currentStep + 1) ? 'white' : colors.textMuted 
            }}
          >
              {currentStep === 4 ? 'Export' : 'Next'}
              {currentStep < 4 && <ChevronRightIcon size="sm" />}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}

