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
import MultiSheetFlow from '@/components/generate/multi/MultiSheetFlow'

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

interface Step1Data {
  spreadsheetId: string
  spreadsheetName: string
  sheetName: string
  ideas: any[]
  slideColumns: string[]
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
  }>
}

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
  
  // Multi-sheet mode toggle
  const [isMultiSheetMode, setIsMultiSheetMode] = useState(false)
  
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
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]) // For multiple sheet selection
  
  // Step 2 Preview states
  const [currentCaption, setCurrentCaption] = useState<string>('')
  const [currentImage, setCurrentImage] = useState<string>('')
  const [availableImages, setAvailableImages] = useState<Array<StoredFile & { url: string; fileHandle?: FileSystemFileHandle; id: string }>>([])
  const [fontLoaded, setFontLoaded] = useState<boolean>(false)
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null)
  
  // Step 3 Draft states
  const [generatedIdeas, setGeneratedIdeas] = useState<Array<{
    ideaId: number
    ideaText: string
    slides: Array<{
      id: string
      caption: string
      image: string
      thumbnail: string | null  // DataURL string instead of canvas element
      createdAt: Date
      slideNumber: number
      imageSource: 'affiliate' | 'ai-method'
      format?: '9:16' | '3:4'
      lastModified?: number
      rotateBg180?: boolean
      flipH?: boolean
      styleOverride?: any
    }>
    isExpanded: boolean
  }>>([])
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
    // From here on, ALWAYS use DESKTOP UNITS (1080×1440 or 1080×1920).
    // No per-draw *SCALE is needed anymore.
    return { ctx, base, scale, dpr }
  }
  
  // Update canvas dimensions when format changes
  useEffect(() => {
    if (canvasRef.current) {
      const dimensions = getCanvasDimensions()
      canvasRef.current.style.width = `${dimensions.w}px`
      canvasRef.current.style.height = `${dimensions.h}px`
    }
  }, [step2Data?.safeZoneFormat])

  // Worker export manager
  const [workerManager] = useState(() => {
    try {
      return getWorkerExportManager()
    } catch (error) {
      console.warn('Worker export not available:', error)
      return null
    }
  })

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
    if (session.step1Data) setStep1Data(session.step1Data)
    if (session.step2Data) setStep2Data(session.step2Data)
    if (session.step3Data) setStep3Data(session.step3Data)
    setShowSessionCreation(false)
    setCurrentStep(1)
  }

  // Render preview with exact same font rendering as desktop app
  const renderPreview = async () => {
    if (!currentImage || !currentCaption) {
      setPreviewCanvas(null)
      return
    }

    // Skip if canvas size is 0×0 (hidden tab, collapsed container, etc.)
    if (CSS_W === 0 || CSS_H === 0) {
      console.log('Skipping preview render: canvas size is 0×0')
      return
    }

    try {
      // Initialize canvas with proper transform FIRST
      const format = step2Data?.safeZoneFormat || '9:16'
      const canvas = document.createElement('canvas')
      const { ctx: transformedCtx, base } = initPreviewCanvas(canvas, format as '9:16' | '3:4', CSS_W)
      
      transformedCtx.imageSmoothingEnabled = true
      transformedCtx.imageSmoothingQuality = 'high'

      // Load and draw background image
      const img = await loadWithOrientationEnhanced(currentImage)
      drawCover(transformedCtx, img, base.w, base.h)
              
              // Clean up image resources
              if (img instanceof ImageBitmap && 'close' in img) {
                img.close()
              }
        
      // Render text with deterministic layout
      if (currentCaption && USE_DETERMINISTIC_LAYOUT) {
        try {
          const fontWeight = step2Data?.fontChoice === 'SemiBold' ? 600 : 
                           step2Data?.fontChoice === 'Medium' ? 500 : 400
          
          // Lock fonts before measuring
          await ensureFontReady([fontWeight], step2Data?.fontSize || 52)
      
          // Create layout spec in desktop space
          const spec: LayoutSpec = {
            text: currentCaption,
            fontFamily: 'TikTok Sans',
            fontWeight: fontWeight as 400 | 500 | 600,
            fontPx: step2Data?.fontSize || 52,
            lineSpacingPx: step2Data?.lineSpacing || 12,
            yOffsetPx: step2Data?.yOffset !== undefined ? step2Data.yOffset : -100,
            xOffsetPx: step2Data?.xOffset !== undefined ? step2Data.xOffset : 0,
            align: (step2Data?.verticalAlignment || 'center') as 'top' | 'center' | 'bottom',
            horizontalAlign: (step2Data?.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
            textRotation: step2Data?.textRotation !== undefined ? step2Data.textRotation : 0,
            safeMarginPx: 64,
            maxTextWidthPx: base.w - 2 * 64,
            deskW: base.w,
            deskH: base.h,
            useSafeZone: step2Data?.useSafeZone ?? true,
            safeZoneFormat: step2Data?.safeZoneFormat ?? '9:16'
          }
      
          // Compute layout in desktop space
          const L = layoutDesktop(transformedCtx, spec)
          
          // Set font in desktop units (transform scales it)
          transformedCtx.font = `${spec.fontWeight} ${spec.fontPx}px "${spec.fontFamily}", Arial, sans-serif`
          
          // Set horizontal alignment
          transformedCtx.textAlign = spec.horizontalAlign === 'left' ? 'start' : 
                         spec.horizontalAlign === 'right' ? 'end' : 'center'
          transformedCtx.textBaseline = 'alphabetic'
          transformedCtx.fillStyle = 'white'
          
          // Draw text with circular outline algorithm (following ChatGPT spec)
          const outlinePx = step2Data?.outlinePx || 6
          const outlineColor = step2Data?.outlineColor || 'black'
          const fillColor = step2Data?.fillColor || 'white'
          
          // Generate circular outline offsets (in desktop units)
          function makeDiskOffsets(r: number): Array<[number, number]> {
            const pts: Array<[number, number]> = []
            for (let y = -r; y <= r; y++) {
              for (let x = -r; x <= r; x++) {
                if (x*x + y*y <= r*r) pts.push([x, y])
              }
            }
            return pts.sort((a,b) => (a[0]**2 + a[1]**2) - (b[0]**2 + b[1]**2))
          }
          
          const outlineOffsets = outlinePx > 0 ? makeDiskOffsets(Math.round(outlinePx)) : []
          
          // Draw text using desktop coordinates (no scaling needed)
          for (let i = 0; i < L.lines.length; i++) {
            const x = L.centerX
            const y = L.baselines[i]
            
            // Apply rotation if specified
            if (spec.textRotation !== 0) {
              transformedCtx.save()
              transformedCtx.translate(x, y)
              transformedCtx.rotate((spec.textRotation * Math.PI) / 180)
              transformedCtx.translate(-x, -y)
            }
            
            // Draw outline first if specified
            if (outlinePx > 0 && outlineOffsets.length > 0) {
              transformedCtx.fillStyle = outlineColor
              for (const [dx, dy] of outlineOffsets) {
                transformedCtx.fillText(L.lines[i], x + dx, y + dy)
              }
            }
            
            // Draw fill
            transformedCtx.fillStyle = fillColor
            transformedCtx.fillText(L.lines[i], x, y)
            
            // Restore rotation
            if (spec.textRotation !== 0) {
              transformedCtx.restore()
            }
          }
          
          // Draw safe zone overlay if enabled
          if (step2Data?.showSafeZoneOverlay && step2Data?.useSafeZone) {
            const safeZone = loadSafeZone(step2Data.safeZoneFormat)
            if (safeZone) {
              // Load and draw the PNG overlay
              const overlayImg = new Image()
              overlayImg.onload = () => {
                transformedCtx.save()
                transformedCtx.globalAlpha = 0.7
                transformedCtx.drawImage(overlayImg, 0, 0, base.w, base.h)
                transformedCtx.restore()
              }
              overlayImg.src = '/assets/backgrounds/overlays/safezones/overlay.png'
            }
          }
          
          // Optional: debug overlay to prove the math (following ChatGPT spec)
          if (process.env.NODE_ENV === 'development') {
            transformedCtx.save()
            transformedCtx.strokeStyle = 'rgba(0,255,0,.65)' // center line
            transformedCtx.beginPath()
            transformedCtx.moveTo(0, base.h/2)
            transformedCtx.lineTo(base.w, base.h/2)
            transformedCtx.stroke()
            
            transformedCtx.strokeStyle = 'rgba(255,0,0,.65)' // block rect
            transformedCtx.strokeRect(0, L.blockY, base.w, L.blockH)
            transformedCtx.restore()
          }
          
        } catch (error) {
          console.warn('Deterministic layout failed, using fallback:', error)
          // Fallback to simple canvas text rendering
          const fallbackCtx = canvas.getContext('2d')!
          fallbackCtx.font = `${step2Data?.fontChoice === 'SemiBold' ? '600' : '500'} ${step2Data?.fontSize || 52}px "TikTok Sans", sans-serif`
          fallbackCtx.textAlign = 'center'
          fallbackCtx.textBaseline = 'middle'
          fallbackCtx.fillStyle = 'white'
          fallbackCtx.fillText(currentCaption, base.w / 2, base.h / 2)
        }
      } else if (currentCaption) {
        // Fallback for when feature flag is off
        const format = step2Data?.safeZoneFormat || '9:16'
        const { ctx: fallbackCtx, base } = initPreviewCanvas(canvas, format as '9:16' | '3:4', CSS_W)
        fallbackCtx.font = `${step2Data?.fontChoice === 'SemiBold' ? '600' : '500'} ${step2Data?.fontSize || 52}px "TikTok Sans", sans-serif`
        fallbackCtx.textAlign = 'center'
        fallbackCtx.textBaseline = 'middle'
        fallbackCtx.fillStyle = 'white'
        fallbackCtx.fillText(currentCaption, base.w / 2, base.h / 2)
      }
      
      setPreviewCanvas(canvas)
    } catch (error) {
      console.warn('Preview rendering failed:', error)
      setPreviewCanvas(null)
    }
  }

  // Re-render preview when caption or settings change
  useEffect(() => {
    renderPreview()
  }, [currentCaption, currentImage, step2Data, fontLoaded, CSS_W, CSS_H])

  // Fetch spreadsheets when authenticated
  useEffect(() => {
    if (session?.accessToken) {
      fetchSpreadsheets()
    }
  }, [session])

  const loadSavedData = async () => {
    try {
      setStep2Data({
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
      })
    } catch (error) {
      console.error('Failed to load saved data:', error)
    }
  }

  const loadImagesFromStorage = async () => {
    try {
      // Get current format from step2Data or default to 9:16
      const currentFormat = step2Data?.safeZoneFormat || '9:16'
      
      
      // Load images from OPFS session store
      console.log('loadImagesFromStorage check:')
      console.log('  sessionStore:', !!sessionStore)
      console.log('  ready:', ready)
      console.log('  currentFormat:', currentFormat)
      console.log('  itemCount:', sessionStore?.items?.length || 0)
      
      if (sessionStore && ready) {
        // Load images for both 9:16 and 3:4 formats to support combined mode
        const allImages = sessionStore.items.filter(item => 
          (item.mime?.startsWith('image/') || item.originalName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/))
        )
        
        
        // Convert to the format expected by availableImages
        const imageFiles = await Promise.all(allImages.map(async (item) => {
          try {
            const fileHandle = await sessionStore.storage.getFileHandle(item.opfsPath)
            const file = await fileHandle.getFile()
            const url = URL.createObjectURL(file)
            return {
              name: item.originalName,
              size: item.bytes,
              type: item.mime || 'image/jpeg',
              url: url,
              lastModified: new Date(item.createdAt).getTime(),
              format: item.format || '9:16',
              category: item.category || 'affiliate',
              fileHandle: fileHandle, // Add the file handle for enhanced loading
              id: item.id // Add unique ID for deduplication
            }
          } catch (error) {
            console.warn(`Failed to load image ${item.originalName}:`, error)
            return null
          }
        }))
        
        const validImages = imageFiles.filter(img => img !== null)
        setAvailableImages(validImages)
        console.log(`Loaded ${validImages.length} images from OPFS (${validImages.filter(img => img.format === '9:16').length} 9:16, ${validImages.filter(img => img.format === '3:4').length} 3:4)`)
      } else {
        // Fallback to session store if available
        const allFiles = await store.getAllFiles()
        const imageFiles = allFiles.filter(f => f.type.startsWith('image/')).map(f => ({
          ...f,
          id: f.name + '_' + f.lastModified, // Generate unique ID for fallback
          format: '9:16' as const,
          category: 'affiliate' as const
        }))
      setAvailableImages(imageFiles)
        console.log(`Loaded ${imageFiles.length} images from SimpleStorage fallback`)
      }
    } catch (error) {
      console.error('Failed to load images:', error)
    }
  }

  const fetchSpreadsheets = async () => {
    try {
      setIsLoadingSheets(true)
      const response = await fetch('/api/sheets/list')
      const data = await response.json()
      
      console.log('API Response:', data)
      
      if (data.error) {
        console.error('API Error:', data.error)
        alert(`Error: ${data.error}. Please try signing out and back in.`)
      } else if (data.spreadsheets) {
        setSpreadsheets(data.spreadsheets)
        console.log(`Found ${data.spreadsheets.length} spreadsheets`)
      } else {
        console.log('No spreadsheets field in response')
      }
    } catch (error) {
      console.error('Failed to fetch spreadsheets:', error)
      alert('Failed to connect to Google Sheets. Please try again.')
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleSpreadsheetSelect = async (spreadsheetId: string) => {
    try {
      setSelectedSpreadsheet(spreadsheetId)
      setIsLoadingSheets(true)
      
      const response = await fetch('/api/sheets/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      })
      
      const data = await response.json()
      
      if (data.sheetNames) {
        setAvailableSheets(data.sheetNames)
        const selectedSheet = spreadsheets.find(s => s.id === spreadsheetId)
        setStep1Data({
          spreadsheetId,
          spreadsheetName: selectedSheet?.name || '',
          sheetName: '',
          ideas: [],
          slideColumns: [],
          summary: {
            ideasCount: 0,
            slideCols: []
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch sheet names:', error)
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const handleSheetSelect = async (sheetName: string) => {
    if (!step1Data) return
    
    try {
      setIsLoadingSheets(true)
      
      const response = await fetch('/api/sheets/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: step1Data.spreadsheetId,
          sheetName,
        }),
      })
      
      const data = await response.json()
      
      console.log('Sheet data received:', data)
      
      setStep1Data({
        ...step1Data,
        sheetName,
        ideas: data.ideas || [],
        slideColumns: data.slideColumns || [],
        summary: {
          ideasCount: data.totalIdeas || 0,
          slideCols: data.slideColumns || []
        }
      })
    } catch (error) {
      console.error('Failed to read sheet data:', error)
    } finally {
      setIsLoadingSheets(false)
    }
  }

  // Handle sheet toggle selection for multiple sheets
  const handleSheetToggle = (sheetName: string) => {
    setSelectedSheets(prev => {
      if (prev.includes(sheetName)) {
        // Remove sheet if already selected
        return prev.filter(sheet => sheet !== sheetName)
      } else {
        // Add sheet if not selected
        return [...prev, sheetName]
      }
    })
  }

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        return step1Data !== null && selectedSheets.length > 0
      case 3: // Step 2.5 - Generation
        return step1Data !== null && selectedSheets.length > 0 && step2Data !== null
      case 4: // Step 3 - Drafts (after generation)
        return step1Data !== null && selectedSheets.length > 0 && step2Data !== null && generationPreferences !== null
      default:
        return true
    }
  }

  const nextStep = () => {
    if (currentStep < 4 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Generate balanced format assignments for combined mode
  // Creates 3 balanced groups: pure 9:16, pure 3:4, and mixed (random per slide)
  const generateBalancedFormatAssignments = (totalIdeas: number): Array<{idea: number, format: '9:16' | '3:4' | 'mixed'}> => {
    // Divide into 3 equal groups
    const third = Math.floor(totalIdeas / 3)
    const remainder = totalIdeas % 3
    
    // Calculate group sizes
    const group1Size = third + (remainder > 0 ? 1 : 0) // 9:16
    const group2Size = third + (remainder > 1 ? 1 : 0) // 3:4
    const group3Size = third // mixed
    
    // Create format array (without idea numbers yet)
    const formats: Array<'9:16' | '3:4' | 'mixed'> = [
      ...Array(group1Size).fill('9:16'),
      ...Array(group2Size).fill('3:4'),
      ...Array(group3Size).fill('mixed')
    ]
    
    // Shuffle the formats array using Fisher-Yates algorithm
    for (let i = formats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [formats[i], formats[j]] = [formats[j], formats[i]]
    }
    
    console.log(`Balanced combined format: ${group1Size} ideas (9:16), ${group2Size} ideas (3:4), ${group3Size} ideas (mixed)`)
    console.log(`Format distribution (first 10):`, formats.slice(0, 10))
    
    // Now assign to ideas in order (after shuffle)
    return formats.map((format, index) => ({ idea: index + 1, format }))
  }
  
  // Start generation process
  const startGeneration = async () => {
    if (!step1Data || !step2Data || !step1Data.ideas) return
    
    setIsGeneratingDrafts(true)
    
    const totalIdeas = step1Data.ideas.length
    
    // Generate format assignments based on selection
    let formats: Array<{idea: number, format: '9:16' | '3:4' | 'mixed'}> = []
    if (generationPreferences.format === 'combined') {
      formats = generateBalancedFormatAssignments(totalIdeas)
    } else {
      formats = Array.from({ length: totalIdeas }, (_, i) => ({
        idea: i + 1,
        format: generationPreferences.format as '9:16' | '3:4'
      }))
    }
    
    setGenerationProgress({
      completed: 0,
      total: totalIdeas,
      currentSlide: 1,
      eta: totalIdeas * 3, // 3 seconds per idea estimate
      formats: formats.map(f => ({ slide: f.idea, format: f.format }))
    })
    
    // Generate drafts for each idea
    const newGeneratedIdeas = []
    
    // Track used images to prevent duplicates
    const usedImageIds = new Set<string>()
    
    for (let i = 0; i < totalIdeas; i++) {
      const idea = step1Data.ideas[i]
      const ideaFormat = formats[i].format
      
      // Extract all slide texts from the idea (Slide 1-6 columns)
      const slideTexts = []
      for (const col of step1Data.slideColumns) {
        let text = idea[col] || ''
        
        // Preserve the text exactly as it comes from the spreadsheet
        // Google Sheets API returns text as-is, including quotes
        if (typeof text === 'string' && text.trim() && text.toLowerCase() !== 'nan') {
          // Only trim whitespace from start/end, preserve quotes and special chars
          slideTexts.push(text.trim())
        }
      }
      
      // Skip if no valid texts
      if (slideTexts.length === 0) {
        continue
      }
      
      // Generate slides for this idea
      const slides = []
      
      for (let slideIndex = 0; slideIndex < slideTexts.length; slideIndex++) {
        const slideText = slideTexts[slideIndex]
        
        // Determine format for this slide
        let slideFormat: '9:16' | '3:4' = '9:16'
        if (ideaFormat === '3:4') {
          slideFormat = '3:4'
        } else if (ideaFormat === '9:16') {
          slideFormat = '9:16'
        } else if (ideaFormat === 'mixed') {
          // For mixed ideas, each slide gets random format (purely random)
          slideFormat = Math.random() < 0.5 ? '9:16' : '3:4'
        }
        
        // Create a canvas for this slide at FULL RESOLUTION for export
        const canvas = document.createElement('canvas')
        const base = slideFormat === '3:4' ? { w: 1080, h: 1440 } : { w: 1080, h: 1920 }
        canvas.width = base.w
        canvas.height = base.h
        
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Get a random image for this slide with deduplication
        console.log(`Available images:`, availableImages.length)
        let randomImage: (StoredFile & { url: string; fileHandle?: FileSystemFileHandle }) | null = null
        
        // Smart image selection based on format and slide position
        const isLastSlide = slideIndex === slideTexts.length - 1
        
        if (slideFormat === '3:4') {
          // For 3:4 format, prefer 3:4 images (excluding used ones)
          let formatImages = availableImages.filter(img => img.format === '3:4' && !usedImageIds.has(img.id))
          
          // If this is the last slide, prefer AI Method images (3:4)
          if (isLastSlide) {
            const aiMethodImages = formatImages.filter(img => img.category === 'ai-method')
            if (aiMethodImages.length > 0) {
              formatImages = aiMethodImages
              console.log(`Last slide - using AI Method 3:4 images (unused):`, aiMethodImages.length)
            }
          } else {
            // For non-last slides, prefer Affiliate images (3:4)
            const affiliateImages = formatImages.filter(img => img.category === 'affiliate')
            if (affiliateImages.length > 0) {
              formatImages = affiliateImages
              console.log(`Non-last slide - using Affiliate 3:4 images (unused):`, affiliateImages.length)
            }
          }
          
          console.log(`3:4 format images available (unused):`, formatImages.length)
          if (formatImages.length > 0) {
            randomImage = formatImages[Math.floor(Math.random() * formatImages.length)]
          }
        } else if (slideFormat === '9:16') {
          // For 9:16 format, prefer 9:16 images (excluding used ones)
          let formatImages = availableImages.filter(img => img.format === '9:16' && !usedImageIds.has(img.id))
          
          // If this is the last slide, prefer AI Method images (9:16)
          if (isLastSlide) {
            const aiMethodImages = formatImages.filter(img => img.category === 'ai-method')
            if (aiMethodImages.length > 0) {
              formatImages = aiMethodImages
              console.log(`Last slide - using AI Method 9:16 images (unused):`, aiMethodImages.length)
            }
          } else {
            // For non-last slides, prefer Affiliate images (9:16)
            const affiliateImages = formatImages.filter(img => img.category === 'affiliate')
            if (affiliateImages.length > 0) {
              formatImages = affiliateImages
              console.log(`Non-last slide - using Affiliate 9:16 images (unused):`, affiliateImages.length)
            }
          }
          
          console.log(`9:16 format images available (unused):`, formatImages.length)
          if (formatImages.length > 0) {
            randomImage = formatImages[Math.floor(Math.random() * formatImages.length)]
          }
        }
        
        // If no unused images available, fall back to any available image
        if (!randomImage) {
          const fallbackImages = availableImages.filter(img => 
            img.format === slideFormat && 
            ((isLastSlide && img.category === 'ai-method') || (!isLastSlide && img.category === 'affiliate'))
          )
          if (fallbackImages.length > 0) {
            randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)]
            console.warn(`Using fallback image (may be duplicate):`, randomImage.name)
          }
        }
        
        if (randomImage) {
          // Mark this image as used to prevent duplicates
          usedImageIds.add(randomImage.id)
          console.log(`Using image: ${randomImage.name} (ID: ${randomImage.id})`)
          
          try {
            console.log(`Loading image for slide ${slideIndex + 1}:`, randomImage.name, randomImage.format)
            
            // Use enhanced loader that handles OPFS files properly
            const img = await loadWithOrientationEnhanced(randomImage.fileHandle || randomImage.url)
            console.log(`Image loaded successfully:`, img.width, 'x', img.height)
            drawCover(ctx, img, base.w, base.h)
            console.log(`Image drawn to canvas:`, base.w, 'x', base.h)
            
            // Clean up image resources
            if (img instanceof ImageBitmap && 'close' in img) {
              img.close()
            }
          } catch (error) {
            console.warn('Failed to load image for draft:', error)
            // Continue without image - show text-only slide
          }
        } else {
          console.warn('No random image available for slide', slideIndex + 1)
        }
        
        // Render text on canvas
        if (step2Data && slideText) {
          try {
            const fontWeight = step2Data.fontChoice === 'SemiBold' ? 600 : 
                              step2Data.fontChoice === 'Medium' ? 500 : 400
            
            // Lock fonts before measuring
            await ensureFontReady([fontWeight], step2Data.fontSize || 52)
            
            // Create layout spec in desktop space
            const spec: LayoutSpec = {
              text: slideText,
              fontFamily: 'TikTok Sans',
              fontWeight: fontWeight as 400 | 500 | 600,
              fontPx: step2Data.fontSize || 52,
              lineSpacingPx: step2Data.lineSpacing || 12,
              yOffsetPx: step2Data.yOffset !== undefined ? step2Data.yOffset : -100,
              xOffsetPx: step2Data.xOffset !== undefined ? step2Data.xOffset : 0,
              align: (step2Data.verticalAlignment || 'center') as 'top' | 'center' | 'bottom',
              horizontalAlign: (step2Data.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
              textRotation: step2Data.textRotation !== undefined ? step2Data.textRotation : 0,
              safeMarginPx: 64,
              maxTextWidthPx: base.w - 2 * 64,
              deskW: base.w,
              deskH: base.h,
              useSafeZone: step2Data.useSafeZone ?? true,
              safeZoneFormat: slideFormat
            }
            
            // Compute layout in desktop space
            const L = layoutDesktop(ctx, spec)
            
            // Set font in desktop units (transform scales it)
            ctx.font = `${spec.fontWeight} ${spec.fontPx}px "${spec.fontFamily}", Arial, sans-serif`
            ctx.textAlign = spec.horizontalAlign === 'left' ? 'start' : 
                           spec.horizontalAlign === 'right' ? 'end' : 'center'
            ctx.textBaseline = 'alphabetic'
            ctx.fillStyle = 'white'
            
            // Draw text using desktop coordinates
            for (let j = 0; j < L.lines.length; j++) {
              const x = L.centerX
              const y = L.baselines[j]
              
              // Apply rotation if specified
              if (spec.textRotation !== 0) {
                ctx.save()
                ctx.translate(x, y)
                ctx.rotate((spec.textRotation * Math.PI) / 180)
                ctx.translate(-x, -y)
              }
              
              // Draw outline first if specified
              const outlinePx = step2Data.outlinePx || 6
              if (outlinePx > 0) {
                ctx.fillStyle = 'black'
                ctx.lineWidth = outlinePx * 2
                ctx.strokeText(L.lines[j], x, y)
              }
              
              // Draw fill
              ctx.fillStyle = 'white'
              ctx.fillText(L.lines[j], x, y)
              
              // Restore rotation
              if (spec.textRotation !== 0) {
                ctx.restore()
              }
            }
          } catch (error) {
            console.warn('Failed to render text for draft:', error)
          }
        }
        
        // Generate thumbnail from canvas
        const thumbnailDataURL = canvas.toDataURL('image/png')
        
        // Create the slide object (NO canvas in state!)
        // Determine imageSource based on slide position (matching batch generation logic)
        const isLastSlideOfIdea = slideIndex === slideTexts.length - 1
        const imageSource = isLastSlideOfIdea ? 'ai-method' : 'affiliate'
        
        const slide = {
          id: `idea_${i + 1}_slide_${slideIndex + 1}`,
          caption: slideText,
          image: randomImage?.url || '',
          thumbnail: thumbnailDataURL,
          createdAt: new Date(),
          slideNumber: slideIndex + 1,
          imageSource: imageSource,
          format: slideFormat,
          lastModified: Date.now()
        }
        
        slides.push(slide)
      }
      
      // Create the generated idea object
      const generatedIdea = {
        ideaId: i + 1,
        ideaText: slideTexts.join(' | '), // Combine all slide texts for display
        slides: slides,
        isExpanded: false
      }
      
      newGeneratedIdeas.push(generatedIdea)
      
      // Update progress
      setGenerationProgress(prev => prev ? {
        ...prev,
        completed: i + 1,
        currentSlide: i + 2,
        eta: Math.max(0, (totalIdeas - i - 1) * 3)
      } : null)
      
      // Simulate work time
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Set the generated ideas
    setGeneratedIdeas(newGeneratedIdeas)
    
    setIsGeneratingDrafts(false)
    setGenerationProgress(null)
    
    // Move to step 3 (drafts)
    setCurrentStep(4)
  }

  // Get random caption from ideas
  const getRandomCaption = () => {
    if (!step1Data || !step1Data.ideas || step1Data.ideas.length === 0) return ''
    
    const shuffled = [...step1Data.ideas].sort(() => Math.random() - 0.5)
    const firstCol = step1Data.slideColumns[0]
    
    // Try to get from first slide column
    for (const idea of shuffled) {
      const text = idea[firstCol]
      if (text && text.trim() && text.toLowerCase() !== 'nan') {
        return text.trim()
      }
    }
    
    return ''
  }

  // Get random image from uploaded content
  const getRandomImage = () => {
    if (availableImages.length === 0) return ''
    
    const randomIndex = Math.floor(Math.random() * availableImages.length)
    return availableImages[randomIndex].url
  }

  const handleRandomCaption = () => {
    const caption = getRandomCaption()
    setCurrentCaption(caption)
  }

  const handleRandomImage = () => {
    const image = getRandomImage()
    if (image) {
      setCurrentImage(image)
    } else {
      alert('No images uploaded. Please go to Content page and upload some images first.')
    }
  }

  // Batch export using worker for better performance
  const batchExportSlides = async (slides: Array<{ caption: string; imageUrl: string; slideNumber: number }>) => {
    if (!workerManager || !WorkerExportManager.isSupported() || !step2Data) {
      console.warn('Worker export not available, using sequential export')
      return []
    }

    const fontWeight = step2Data.fontChoice === 'SemiBold' ? 600 : 
                     step2Data.fontChoice === 'Medium' ? 500 : 400

    const format = step2Data.safeZoneFormat || '9:16'
    const jobs = slides.map((slide, index) => ({
      id: `batch_${Date.now()}_${index}`,
      imageUrl: slide.imageUrl,
      spec: {
        text: slide.caption,
        fontFamily: 'TikTok Sans',
        fontWeight: fontWeight as 400 | 500 | 600,
        fontPx: step2Data.fontSize,
        lineSpacingPx: step2Data.lineSpacing,
        yOffsetPx: step2Data.yOffset,
        xOffsetPx: step2Data.xOffset || 0,
        align: step2Data.verticalAlignment as 'top' | 'center' | 'bottom',
        horizontalAlign: (step2Data.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
        textRotation: step2Data.textRotation || 0,
        safeMarginPx: 64,
        maxTextWidthPx: 1080 - 2 * 64,
        deskW: 1080,
        deskH: format === '3:4' ? 1440 : 1920,
        useSafeZone: step2Data.useSafeZone,
        safeZoneFormat: step2Data.safeZoneFormat
      } as LayoutSpec,
      outW: 1080,
      outH: format === '3:4' ? 1440 : 1920,
      outlinePx: step2Data.outlinePx,
      outlineColor: 'black',
      fillColor: 'white'
    }))

    try {
      console.log(`Starting optimized batch export of ${slides.length} slides using worker...`)
      const startTime = performance.now()
      
      const blobs = await workerManager.exportBatch(jobs, (completed, total) => {
        const percentage = Math.round((completed / total) * 100)
        console.log(`Batch export progress: ${completed}/${total} (${percentage}%)`)
        setExportProgress({ completed, total })
      })
      
      const exportTime = performance.now() - startTime
      console.log(`Batch export completed in ${Math.round(exportTime)}ms`)
      
      // Convert blobs to canvases for compatibility with improved error handling
      const results = []
      let successCount = 0
      
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]
        try {
          if (blob.size > 0) {
            const img = await createImageBitmap(blob)
            const canvas = document.createElement('canvas')
            const format = step2Data.safeZoneFormat || '9:16'
            canvas.width = 1080
            canvas.height = format === '3:4' ? 1440 : 1920
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            img.close()
            
            results.push({
              id: jobs[i].id,
              caption: slides[i].caption,
              image: slides[i].imageUrl,
              canvas,
              slideNumber: slides[i].slideNumber,
              createdAt: new Date()
            })
            successCount++
          } else {
            console.warn(`Slide ${i + 1} produced empty blob, skipping`)
          }
        } catch (error) {
          console.error(`Failed to convert slide ${i + 1} blob to canvas:`, error)
        }
      }
      
      console.log(`Batch export results: ${successCount}/${slides.length} slides successfully processed`)
      
      // Clear progress indicator
      setExportProgress(null)
      
      if (successCount === 0) {
        throw new Error('No slides were successfully exported')
      }
      
      return results
    } catch (error) {
      console.error('Batch export failed:', error)
      setExportProgress(null) // Clear progress on error
      return []
    }
  }

  // Generate a single draft slide with high-quality rendering
  const generateDraftSlide = async (caption: string, imageUrl: string): Promise<{
    id: string
    caption: string
    image: string
    canvas: HTMLCanvasElement
    createdAt: Date
  }> => {
    if (!step2Data) {
      throw new Error('Step 2 data not available')
    }

    const id = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Use deterministic layout for export
      if (USE_DETERMINISTIC_LAYOUT) {
        const fontWeight = step2Data.fontChoice === 'SemiBold' ? 600 : 
                         step2Data.fontChoice === 'Medium' ? 500 : 400
        
        // Create layout spec in desktop space
        const spec: LayoutSpec = {
          text: caption,
          fontFamily: 'TikTok Sans',
          fontWeight: fontWeight as 400 | 500 | 600,
          fontPx: step2Data.fontSize,
          lineSpacingPx: step2Data.lineSpacing,
          yOffsetPx: step2Data.yOffset,
          xOffsetPx: step2Data.xOffset || 0,
          align: step2Data.verticalAlignment as 'top' | 'center' | 'bottom',
          horizontalAlign: (step2Data.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
          textRotation: step2Data.textRotation || 0,
          safeMarginPx: 64,
          maxTextWidthPx: 1080 - 2 * 64,
          deskW: 1080,
          deskH: 1920
        }

        // Try worker export first for better performance
        if (workerManager && WorkerExportManager.isSupported()) {
          try {
            const format = step2Data.safeZoneFormat || '9:16'
            const blob = await workerManager.exportSlide({
              id,
              imageUrl,
              spec,
              outW: 1080,
              outH: format === '3:4' ? 1440 : 1920,
              outlinePx: step2Data.outlinePx,
              outlineColor: 'black',
              fillColor: 'white'
            })
            
            // Convert blob to canvas for compatibility
            const img = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
            canvas.width = 1080
            canvas.height = format === '3:4' ? 1440 : 1920
    const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            img.close()
            
            return {
              id,
              caption,
              image: imageUrl,
              canvas,
              createdAt: new Date()
            }
          } catch (error) {
            console.warn('Worker export failed, falling back to main thread:', error)
          }
        }
        
        // Fallback to main thread export
        // Lock fonts before measuring
        await ensureFontReady([fontWeight], step2Data.fontSize)
        
        // Create measuring canvas for layout
        const measureCanvas = document.createElement('canvas')
        const format = step2Data.safeZoneFormat || '9:16'
        measureCanvas.width = 1080
        measureCanvas.height = format === '3:4' ? 1440 : 1920
        const measureCtx = measureCanvas.getContext('2d')!
        
        // Compute layout in desktop space
        const L = layoutDesktop(measureCtx, spec)
        
        // Create high-resolution canvas for 2x supersampling
        const OUT_W = 1080, OUT_H = format === '3:4' ? 1440 : 1920, SS = 2
        const hiCanvas = document.createElement('canvas')
        hiCanvas.width = OUT_W * SS
        hiCanvas.height = OUT_H * SS
        const hiCtx = hiCanvas.getContext('2d')!
        hiCtx.scale(SS, SS)
        hiCtx.imageSmoothingEnabled = true
        hiCtx.imageSmoothingQuality = 'high'

    // Load and draw background image
        const img = await loadWithOrientationEnhanced(imageUrl)
        drawCover(hiCtx, img, OUT_W, OUT_H)
        
        // Clean up image resources
        if (img instanceof ImageBitmap && 'close' in img) {
          img.close()
        }
        
        // Set font for high-res rendering
        hiCtx.font = `${spec.fontWeight} ${spec.fontPx}px "${spec.fontFamily}", Arial, sans-serif`
        
        // Set horizontal alignment
        hiCtx.textAlign = spec.horizontalAlign === 'left' ? 'start' : 
                         spec.horizontalAlign === 'right' ? 'end' : 'center'
        hiCtx.textBaseline = 'alphabetic'
        hiCtx.fillStyle = 'white'
        
        // Draw text with circular outline algorithm (following ChatGPT spec)
        const outlinePx = step2Data.outlinePx || 6
        const outlineColor = 'black'
        const fillColor = 'white'
        
        // Generate circular outline offsets for high-res canvas
        function makeDiskOffsets(r: number): Array<[number, number]> {
          const pts: Array<[number, number]> = []
          for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
              if (x*x + y*y <= r*r) pts.push([x, y])
            }
          }
          return pts.sort((a,b) => (a[0]**2 + a[1]**2) - (b[0]**2 + b[1]**2))
        }
        
        const outlineOffsets = outlinePx > 0 ? makeDiskOffsets(Math.round(outlinePx)) : []
        
        // Draw text using desktop coordinates (no scaling needed in high-res canvas)
        for (let i = 0; i < L.lines.length; i++) {
          const x = L.centerX
          const y = L.baselines[i]
          
          // Apply rotation if specified
          if (spec.textRotation !== 0) {
            hiCtx.save()
            hiCtx.translate(x, y)
            hiCtx.rotate((spec.textRotation * Math.PI) / 180)
            hiCtx.translate(-x, -y)
          }
          
          // Draw outline first if specified
          if (outlinePx > 0 && outlineOffsets.length > 0) {
            hiCtx.fillStyle = outlineColor
            for (const [dx, dy] of outlineOffsets) {
              hiCtx.fillText(L.lines[i], x + dx, y + dy)
            }
          }
          
          // Draw fill
          hiCtx.fillStyle = fillColor
          hiCtx.fillText(L.lines[i], x, y)
          
          // Restore rotation
          if (spec.textRotation !== 0) {
            hiCtx.restore()
          }
        }
        
        // Downsample to final resolution
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = OUT_W
        finalCanvas.height = OUT_H
        const finalCtx = finalCanvas.getContext('2d')!
        finalCtx.imageSmoothingEnabled = true
        finalCtx.imageSmoothingQuality = 'high'
        finalCtx.drawImage(hiCanvas, 0, 0, OUT_W, OUT_H)
        
        return {
          id,
          caption,
          image: imageUrl,
          canvas: finalCanvas,
          createdAt: new Date()
        }
      } else {
        // Fallback to existing high-quality renderer
            const fontStyle = {
              fontChoice: (step2Data.fontChoice === 'SemiBold' ? 'SemiBold' : 
                        step2Data.fontChoice === 'Medium' ? 'Medium' : 'Regular') as 'Regular' | 'Medium' | 'SemiBold',
          fontSize: step2Data.fontSize,
              outlinePx: step2Data.outlinePx,
              lineSpacing: step2Data.lineSpacing,
              verticalAlignment: step2Data.verticalAlignment as 'top' | 'center' | 'bottom',
              yOffset: step2Data.yOffset,
              autoFit: step2Data.autoFit,
              fillColor: 'white',
              outlineColor: 'black'
            }
            
        const job = {
          id,
          imageUrl,
                  caption,
          style: fontStyle
        }

        const { renderHighQualitySlide, supportsHighQualityRendering, renderFallbackSlide } = await import('@/utils/highQualityRenderer')
        
        if (supportsHighQualityRendering()) {
          const result = await renderHighQualitySlide(job)
          return {
            id: result.id,
            caption,
            image: imageUrl,
            canvas: result.canvas,
            createdAt: new Date()
              }
            } else {
          const result = await renderFallbackSlide(job)
          return {
            id: result.id,
            caption,
            image: imageUrl,
            canvas: result.canvas,
            createdAt: new Date()
          }
        }
      }
    } catch (error) {
      console.warn('Export rendering failed, using fallback:', error)
      
      // Ultimate fallback - simple canvas rendering
      const canvas = document.createElement('canvas')
      const format = step2Data?.safeZoneFormat || '9:16'
      canvas.width = 1080
      canvas.height = format === '3:4' ? 1440 : 1920
      const ctx = canvas.getContext('2d')!
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Draw background image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            
            // Simple text rendering
            const weight = fontStyle.fontChoice === 'SemiBold' ? '600' : fontStyle.fontChoice === 'Medium' ? '500' : '400'
            ctx.font = `${weight} ${fontStyle.fontSize}px "TikTok Sans", sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillStyle = fontStyle.fillColor
              ctx.fillText(caption, canvas.width / 2, canvas.height / 2)
          
            resolve({
              id: job.id,
            caption,
            image: imageUrl,
            canvas,
            createdAt: new Date()
            })
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for draft generation'))
      }
      
      img.src = imageUrl
    })
    }
  }

  // Generate all drafts organized by ideas
  const generateAllDrafts = async () => {
    if (!step1Data?.ideas || step1Data.ideas.length === 0) {
      alert('Please ensure you have ideas loaded from Google Sheets')
      return
    }

    // Get images from both categories (matching desktop app logic)
    const affiliateImages = availableImages.filter(img => img.category === 'affiliate')
    const aiMethodImages = availableImages.filter(img => img.category === 'ai-method')
    
    if (affiliateImages.length === 0) {
      alert('Please upload images to the "Affiliate Content" category')
      return
    }
    
    if (aiMethodImages.length === 0) {
      alert('Please upload images to the "AI Method" category')
      return
    }

    setIsGenerating(true)
    const newIdeas: Array<{
      ideaId: number
      ideaText: string
      slides: Array<{
        id: string
        caption: string
        image: string
        canvas: HTMLCanvasElement
        createdAt: Date
        slideNumber: number
        imageSource: 'affiliate' | 'ai-method'
      }>
      isExpanded: boolean
    }> = []

    try {
      // Generate drafts for ALL ideas, organized by idea
      const totalIdeas = step1Data.ideas.length
      
      console.log('Slide columns:', step1Data.slideColumns)
      console.log('Total ideas:', totalIdeas)
      console.log('Max slides per idea:', step1Data.slideColumns.length, '(supports up to 13 slides)')
      console.log('AI Method images available:', aiMethodImages.length)
      console.log('Affiliate images available:', affiliateImages.length)
      
      // Create shuffled arrays for round-robin selection
      const shuffledAffiliateImages = [...affiliateImages].sort(() => Math.random() - 0.5)
      const shuffledAiMethodImages = [...aiMethodImages].sort(() => Math.random() - 0.5)
      
      // Track used AI Method images for round-robin
      let usedAiMethodImages: Array<StoredFile & { url: string }> = []
      let aiMethodImageIndex = 0
      
      for (let ideaIndex = 0; ideaIndex < totalIdeas; ideaIndex++) {
        const idea = step1Data.ideas[ideaIndex]
        const ideaSlides: Array<{
          id: string
          caption: string
          image: string
          canvas: HTMLCanvasElement
          createdAt: Date
          slideNumber: number
          imageSource: 'affiliate' | 'ai-method'
        }> = []
        
        // First, collect all valid slides for this idea
        const validSlides: Array<{ slideIndex: number; caption: string }> = []
        for (let slideIndex = 0; slideIndex < step1Data.slideColumns.length; slideIndex++) {
          const slideColumn = step1Data.slideColumns[slideIndex]
          const caption = idea[slideColumn] || ''
          
          // Skip empty captions
          if (!caption || caption.trim() === '') {
            continue
          }
          
          validSlides.push({ slideIndex, caption })
        }
        
        // Prepare slides for batch export
        const slidesForBatch: Array<{ caption: string; imageUrl: string; slideNumber: number; imageSource: 'affiliate' | 'ai-method' }> = []
        
        for (let i = 0; i < validSlides.length; i++) {
          const { slideIndex, caption } = validSlides[i]
          const isLastSlideOfIdea = i === validSlides.length - 1
          
          // Choose image source based on slide position (matching desktop app)
          let selectedImage: StoredFile & { url: string }
          let imageSource: 'affiliate' | 'ai-method'
          
          if (isLastSlideOfIdea) {
            // Last slide of ANY idea uses AI Method images
            // Use round-robin selection for AI Method images (no repeats within batches)
            
            // FALLBACK: If no AI Method images available, use Affiliate images
            if (aiMethodImages.length === 0) {
              console.warn(`⚠️ No AI Method images available! Using Affiliate images as fallback for last slide.`)
              selectedImage = affiliateImages[Math.floor(Math.random() * affiliateImages.length)]
              imageSource = 'affiliate'
              console.log(`Idea ${ideaIndex + 1}, Slide ${slideIndex + 1}: Using Affiliate image (fallback for last slide)`)
            } else {
              // Calculate which batch we're in (every 38 ideas)
              const batchNumber = Math.floor(ideaIndex / 38)
              const isNewBatch = ideaIndex % 38 === 0
              
              // Reset used images for new batches
              if (isNewBatch) {
                usedAiMethodImages = []
                aiMethodImageIndex = 0
              }
              
              // Use round-robin selection within the batch
              selectedImage = shuffledAiMethodImages[aiMethodImageIndex % aiMethodImages.length]
              usedAiMethodImages.push(selectedImage)
              aiMethodImageIndex++
              imageSource = 'ai-method'
              
              console.log(`Idea ${ideaIndex + 1}, Slide ${slideIndex + 1}: Using AI Method image (batch ${batchNumber + 1})`)
            }
          } else {
            // All other slides use Affiliate images (random selection)
            selectedImage = affiliateImages[Math.floor(Math.random() * affiliateImages.length)]
            imageSource = 'affiliate'
            
            console.log(`Idea ${ideaIndex + 1}, Slide ${slideIndex + 1}: Using Affiliate image`)
          }
          
          slidesForBatch.push({
            caption,
            imageUrl: selectedImage.url,
              slideNumber: slideIndex + 1,
              imageSource
            })
        }
        
        // Try batch export first, fallback to sequential
        let generatedSlides: Array<{
          id: string
          caption: string
          image: string
          canvas: HTMLCanvasElement
          createdAt: Date
          slideNumber: number
          imageSource: 'affiliate' | 'ai-method'
        }> = []
        
        if (slidesForBatch.length > 0) {
          try {
            // Try batch export using worker
            const batchResults = await batchExportSlides(slidesForBatch.map(slide => ({
              caption: slide.caption,
              imageUrl: slide.imageUrl,
              slideNumber: slide.slideNumber
            })))
            
            if (batchResults.length > 0) {
              // Add image source info to batch results
              generatedSlides = batchResults.map((result, index) => ({
                ...result,
                imageSource: slidesForBatch[index].imageSource
              }))
              console.log(`✅ Batch export successful for idea ${ideaIndex + 1}: ${generatedSlides.length}/${slidesForBatch.length} slides`)
            } else {
              throw new Error('Batch export returned no results')
            }
          } catch (error) {
            console.warn(`Batch export failed for idea ${ideaIndex + 1}, falling back to sequential:`, error)
            
            // Fallback to sequential generation
            for (const slide of slidesForBatch) {
              try {
                const draft = await generateDraftSlide(slide.caption, slide.imageUrl)
                generatedSlides.push({
                  ...draft,
                  slideNumber: slide.slideNumber,
                  imageSource: slide.imageSource
                })
              } catch (error) {
                console.error(`Failed to generate slide ${slide.slideNumber} for idea ${ideaIndex + 1}:`, error)
              }
            }
          }
        }
        
        ideaSlides.push(...generatedSlides)
        
        // Only add ideas that have slides
        if (ideaSlides.length > 0) {
          // Get the main idea text (from first slide column)
          const mainIdeaText = idea[step1Data.slideColumns[0]] || `Idea ${ideaIndex + 1}`
          
          newIdeas.push({
            ideaId: ideaIndex + 1,
            ideaText: mainIdeaText,
            slides: ideaSlides,
            isExpanded: false // Start collapsed
          })
        }
      }
      
      setGeneratedIdeas(newIdeas)
      if (newIdeas.length > 0 && newIdeas[0].slides.length > 0) {
        setSelectedDraft(newIdeas[0].slides[0].id)
      }
    } catch (error) {
      console.error('Failed to generate drafts:', error)
      alert('Failed to generate drafts. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Toggle idea expansion
  const toggleIdeaExpansion = (ideaId: number) => {
    setGeneratedIdeas(prev => prev.map(idea => 
      idea.ideaId === ideaId 
        ? { ...idea, isExpanded: !idea.isExpanded }
        : idea
    ))
  }

  // Export functionality - use thumbnail dataURL directly
  const exportDraftAsPNG = (slide: typeof generatedIdeas[0]['slides'][0]) => {
    if (!slide.thumbnail) {
      console.error('No thumbnail available for export')
      alert('Cannot export: slide thumbnail not ready')
      return
    }
    
    const link = document.createElement('a')
    link.download = `drafter-slide-${slide.id}.png`
    link.href = slide.thumbnail
    link.click()
    console.log('✅ Exported slide:', slide.id)
  }

  const exportAllDraftsAsZIP = async () => {
    if (generatedIdeas.length === 0) {
      alert('No drafts to export. Please generate drafts first.')
      return
    }

    setIsExporting(true)
    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      console.log(`📦 Creating ZIP with ${generatedIdeas.length} ideas...`)
      
      // Export each idea's slides into separate folders
      for (const idea of generatedIdeas) {
        const ideaFolder = `idea_${idea.ideaId.toString().padStart(2, '0')}`
        
        for (let i = 0; i < idea.slides.length; i++) {
          const slide = idea.slides[i]
          const slideNumber = (i + 1).toString().padStart(2, '0')
          const fileName = `slide_${slideNumber}.png`
          
          console.log(`Adding ${ideaFolder}/${fileName} to ZIP`)
          
          // Use thumbnail dataURL directly
          if (!slide.thumbnail) {
            console.warn(`Slide ${slideNumber} has no thumbnail, skipping`)
            continue
          }
          
          const base64Data = slide.thumbnail.split(',')[1]
          
          // Add to ZIP in the idea folder
          zip.folder(ideaFolder)?.file(fileName, base64Data, { base64: true })
        }
      }
      
      console.log('🔄 Generating ZIP file...')
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      console.log(`✅ ZIP file generated: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`)
      
      // Download ZIP
      const link = document.createElement('a')
      link.download = `drafter_export_${new Date().toISOString().split('T')[0]}.zip`
      link.href = URL.createObjectURL(zipBlob)
      link.click()
      
      // Clean up
      URL.revokeObjectURL(link.href)
      
      const totalSlides = generatedIdeas.reduce((sum, idea) => sum + idea.slides.length, 0)
      alert(`✅ Successfully exported ${totalSlides} slides from ${generatedIdeas.length} ideas!\n\nZIP file contains:\n${generatedIdeas.length} folders (idea_01, idea_02, etc.)\nEach with their slides (slide_01.png, slide_02.png, etc.)`)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Randomize all images across all slides
  const randomizeAllImages = async () => {
    console.log('🔄 Starting randomizeAllImages...')
    console.log('Generated ideas:', generatedIdeas.length)
    console.log('Available images:', availableImages.length)
    
    if (generatedIdeas.length === 0 || availableImages.length === 0) {
      console.error('❌ No images or drafts available to randomize')
      alert('No images or drafts available to randomize.')
      return
    }

    try {
      // Separate images by source type
      const affiliateImages = availableImages.filter(img => img.category === 'affiliate' || (img.name?.includes('affiliate') || !img.name?.includes('ai-method')))
      const aiMethodImages = availableImages.filter(img => img.category === 'ai-method' || img.name?.includes('ai-method'))
      
      console.log('📊 Image sources:', { 
        affiliate: affiliateImages.length, 
        aiMethod: aiMethodImages.length 
      })
      
      // Debug: Show sample image names
      console.log('🔍 Sample Affiliate images:', affiliateImages.slice(0, 3).map(img => img.name))
      console.log('🔍 Sample AI Method images:', aiMethodImages.slice(0, 3).map(img => img.name))
      
      // Debug: Check slide imageSources
      console.log('🔍 Slide imageSources before randomization:');
      generatedIdeas.forEach((idea, ideaIdx) => {
        idea.slides.forEach((slide, slideIdx) => {
          console.log(`  Idea ${ideaIdx + 1}, Slide ${slideIdx + 1}: ${slide.imageSource}`);
        });
      });

      // Create shuffled copies for each type
      const shuffledAffiliateImages = [...affiliateImages]
      const shuffledAiMethodImages = [...aiMethodImages]
      
      // Shuffle affiliate images
      for (let i = shuffledAffiliateImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledAffiliateImages[i], shuffledAffiliateImages[j]] = [shuffledAffiliateImages[j], shuffledAffiliateImages[i]]
      }
      
      // Shuffle AI method images
      for (let i = shuffledAiMethodImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledAiMethodImages[i], shuffledAiMethodImages[j]] = [shuffledAiMethodImages[j], shuffledAiMethodImages[i]]
      }

      let affiliateIndex = 0
      let aiMethodIndex = 0
      const updatedIdeas = []

      // Regenerate all slides with new images
      for (const idea of generatedIdeas) {
        const updatedSlides = []
        
        for (const slide of idea.slides) {
          // Choose image based on slide's imageSource
          let newImage: StoredFile & { url: string }
          let imageSource: 'affiliate' | 'ai-method'
          
          // FALLBACK: If imageSource is wrong, determine it by slide position
          const isLastSlideOfIdea = slide.slideNumber === idea.slides.length
          const correctImageSource = isLastSlideOfIdea ? 'ai-method' : 'affiliate'
          
          console.log(`🔍 Slide ${slide.slideNumber} imageSource:`, slide.imageSource, `(correct: ${correctImageSource})`);
          
          if (slide.imageSource === 'ai-method' || correctImageSource === 'ai-method') {
            // Use AI Method images for AI Method slides
            console.log(`🎯 AI Method slide - available AI images: ${shuffledAiMethodImages.length}`);
            if (shuffledAiMethodImages.length === 0) {
              console.warn('⚠️ No AI Method images available, using Affiliate as fallback')
              newImage = shuffledAffiliateImages[affiliateIndex % shuffledAffiliateImages.length]
              imageSource = 'affiliate'
              affiliateIndex++
            } else {
              newImage = shuffledAiMethodImages[aiMethodIndex % shuffledAiMethodImages.length]
              imageSource = 'ai-method'
              aiMethodIndex++
              console.log(`✅ Selected AI Method image: ${newImage.name}`);
            }
          } else {
            // Use Affiliate images for Affiliate slides
            console.log(`🎯 Affiliate slide - available Affiliate images: ${shuffledAffiliateImages.length}`);
            newImage = shuffledAffiliateImages[affiliateIndex % shuffledAffiliateImages.length]
            imageSource = 'affiliate'
            affiliateIndex++
            console.log(`✅ Selected Affiliate image: ${newImage.name}`);
          }
          
          console.log(`🎯 Processing slide ${slide.slideNumber} (${slide.imageSource}), using ${imageSource} image:`, {
            id: newImage.id,
            url: newImage.url.substring(0, 50) + '...',
            hasFileHandle: !!newImage.fileHandle
          })

          // Regenerate the slide with the new image
          const canvas = document.createElement('canvas')
          const format = slide.format || step2Data?.safeZoneFormat || '9:16'
          
          if (format === '3:4') {
            canvas.width = 1080
            canvas.height = 1440
          } else {
            canvas.width = 1080
            canvas.height = 1920
          }

          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          // Load and draw the new image
          const img = new Image()
          
          // Create a fresh blob URL to avoid revoked URLs
          let imageUrl = newImage.url
          console.log('🔄 Original URL:', imageUrl.substring(0, 50) + '...')
          
          if (imageUrl.startsWith('blob:')) {
            try {
              // Try to get the file from OPFS and create a fresh blob URL
              if (newImage.fileHandle) {
                console.log('📁 Creating fresh blob URL from file handle...')
                const file = await newImage.fileHandle.getFile()
                imageUrl = URL.createObjectURL(file)
                console.log('✅ New blob URL created:', imageUrl.substring(0, 50) + '...')
              } else {
                console.warn('⚠️ No file handle available, using original URL')
              }
            } catch (error) {
              console.warn('❌ Failed to create fresh blob URL, using original:', error)
            }
          } else {
            console.log('ℹ️ Not a blob URL, using as-is')
          }
          
          img.src = imageUrl
          console.log('📸 Loading image...')
          
          await new Promise((resolve) => {
            img.onload = () => {
              console.log('✅ Image loaded successfully')
              resolve()
            }
            img.onerror = () => {
              console.error('❌ Failed to load image:', imageUrl)
              resolve() // Continue even if image fails to load
            }
          })

          // Paint solid background first (prevents transparency)
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          console.log('🎨 Drawing image to canvas...')
          
          // Draw image if loaded successfully
          if (img.complete && img.naturalWidth > 0) {
            console.log('✅ Drawing image successfully')
            ctx.save()
            drawContain(ctx, img, canvas.width, canvas.height)
            ctx.restore()
          } else {
            console.log('❌ Image failed to load, background remains black')
          }

          // Apply text with existing settings
          if (step2Data) {
            const fontWeight = step2Data.fontChoice === 'SemiBold' ? 600 : 500
            
            const layout = layoutDesktop(ctx, {
              text: slide.caption,
              fontFamily: 'TikTok Sans',
              fontWeight: fontWeight as 400 | 500 | 600,
              fontPx: step2Data.fontSize,
              lineSpacingPx: step2Data.lineSpacing,
              yOffsetPx: step2Data.yOffset,
              xOffsetPx: step2Data.xOffset,
              align: 'center',
              horizontalAlign: 'center',
              textRotation: step2Data.textRotation,
              safeMarginPx: 64,
              maxTextWidthPx: canvas.width - 128,
              deskW: canvas.width,
              deskH: canvas.height,
              useSafeZone: false
            })

            ctx.save()
            ctx.translate(layout.centerX, 0)
            ctx.rotate((step2Data.textRotation * Math.PI) / 180)

            layout.lines.forEach((line, i) => {
              const x = 0
              const y = layout.baselines[i]

              if (step2Data.outlinePx > 0) {
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = step2Data.outlinePx * 2
                ctx.lineJoin = 'round'
                ctx.miterLimit = 2
                ctx.strokeText(line, x, y)
              }

              ctx.fillStyle = '#FFFFFF'
              ctx.fillText(line, x, y)
            })

            ctx.restore()
          }

          // Generate thumbnail from canvas
          const thumbnailDataURL = canvas.toDataURL('image/png')
          console.log('📸 Thumbnail generated for slide', slide.slideNumber)
          
          updatedSlides.push({
            ...slide,
            image: imageUrl,
            thumbnail: thumbnailDataURL,
            imageSource: correctImageSource, // Use the correct imageSource based on position
            lastModified: Date.now()
          })
        }

        updatedIdeas.push({
          ...idea,
          slides: updatedSlides
        })
      }

      console.log('✅ Randomization complete! Updating state...')
      setGeneratedIdeas(updatedIdeas)
      setUsedImages(new Set())
      console.log('🎉 All images randomized successfully!')
      alert('✅ All images randomized successfully!')
    } catch (error) {
      console.error('❌ Failed to randomize images:', error)
      alert('Failed to randomize images. Please try again.')
    }
  }

  // Randomize a single slide's image
  const randomizeSingleSlideImage = async (ideaIndex: number, slideIndex: number) => {
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

      // Filter images by the slide's imageSource
      const slideImageSource = slide.imageSource || 'affiliate'
      
      let availableForSelection = availableImages.filter(img => {
        const isAffiliate = img.category === 'affiliate' || (img.name?.includes('affiliate') || !img.name?.includes('ai-method'))
        const isAiMethod = img.category === 'ai-method' || img.name?.includes('ai-method')
        
        if (slideImageSource === 'ai-method') {
          return isAiMethod
        } else {
          return isAffiliate
        }
      })
      
      // Exclude already used images
      availableForSelection = availableForSelection.filter(img => !usedImages.has(img.id))
      
      // If all images of this type are used, reset the pool for this type
      if (availableForSelection.length === 0) {
        setUsedImages(new Set())
        availableForSelection = availableImages.filter(img => {
          const isAffiliate = img.category === 'affiliate' || (img.name?.includes('affiliate') || !img.name?.includes('ai-method'))
          const isAiMethod = img.category === 'ai-method' || img.name?.includes('ai-method')
          
          if (slideImageSource === 'ai-method') {
            return isAiMethod
          } else {
            return isAffiliate
          }
        })
      }

      // Exclude the current image
      availableForSelection = availableForSelection.filter(img => img.url !== slide.image)
      
      if (availableForSelection.length === 0) {
        alert('No other images available.')
        return
      }

      // Pick a random image
      const randomIndex = Math.floor(Math.random() * availableForSelection.length)
      const newImage = availableForSelection[randomIndex]

      // Regenerate the slide with the new image
      const canvas = document.createElement('canvas')
      const format = slide.format || step2Data?.safeZoneFormat || '9:16'
      
      if (format === '3:4') {
        canvas.width = 1080
        canvas.height = 1440
      } else {
        canvas.width = 1080
        canvas.height = 1920
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Failed to get canvas context')
        return
      }

      // Load and draw the new image
      const img = new Image()
      
      // Create a fresh blob URL to avoid revoked URLs
      let imageUrl = newImage.url
      
      if (imageUrl.startsWith('blob:')) {
        try {
          // Try to get the file from OPFS and create a fresh blob URL
          if (newImage.fileHandle) {
            const file = await newImage.fileHandle.getFile()
            imageUrl = URL.createObjectURL(file)
          }
        } catch (error) {
          console.warn('Failed to create fresh blob URL, using original:', error)
        }
      }
      
      img.src = imageUrl
      
      await new Promise((resolve) => {
        img.onload = () => resolve(true)
        img.onerror = (e) => {
          console.error('Failed to load image:', imageUrl, 'Error:', e)
          resolve(false) // Continue even if image fails to load
        }
      })

      // Paint solid background first (prevents transparency)
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw image if loaded successfully
      if (img.complete && img.naturalWidth > 0) {
        ctx.save()
        drawContain(ctx, img, canvas.width, canvas.height)
        ctx.restore()
      }

      // Apply text with existing settings
      if (step2Data) {
        const fontWeight = step2Data.fontChoice === 'SemiBold' ? 600 : 500
        
        const layout = layoutDesktop(ctx, {
          text: slide.caption,
          fontFamily: 'TikTok Sans',
          fontWeight: fontWeight as 400 | 500 | 600,
          fontPx: step2Data.fontSize,
          lineSpacingPx: step2Data.lineSpacing,
          yOffsetPx: step2Data.yOffset,
          xOffsetPx: step2Data.xOffset,
          align: 'center',
          horizontalAlign: 'center',
          textRotation: step2Data.textRotation,
          safeMarginPx: 64,
          maxTextWidthPx: canvas.width - 128,
          deskW: canvas.width,
          deskH: canvas.height,
          useSafeZone: false
        })

        ctx.save()
        ctx.translate(layout.centerX, 0)
        ctx.rotate((step2Data.textRotation * Math.PI) / 180)

        layout.lines.forEach((line, i) => {
          const x = 0
          const y = layout.baselines[i]

          if (step2Data.outlinePx > 0) {
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = step2Data.outlinePx * 2
            ctx.lineJoin = 'round'
            ctx.miterLimit = 2
            ctx.strokeText(line, x, y)
          }

          ctx.fillStyle = '#FFFFFF'
          ctx.fillText(line, x, y)
        })

        ctx.restore()
      }

      // Generate thumbnail from canvas
      const thumbnailDataURL = canvas.toDataURL('image/png')

      // Update the slide IMMUTABLY
      setGeneratedIdeas(prev =>
        prev.map((idea, iIdx) =>
          iIdx !== ideaIndex ? idea : {
            ...idea,
            slides: idea.slides.map((s, sIdx) =>
              sIdx !== slideIndex ? s : {
                ...s,
                image: imageUrl,
                thumbnail: thumbnailDataURL,
                imageSource: slideImageSource,
                lastModified: Date.now()
              }
            )
          }
        )
      )
      
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
  }, [currentStep, step1Data])

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
  const handleEditSlide = (ideaIndex: number, slideIndex: number) => {
    setEditingSlide({ ideaIndex, slideIndex })
    setShowSlideEditor(true)
  }

  const handleSaveSlide = async (updatedSlide: any) => {
    if (!editingSlide || !step2Data) return
    
    console.log('💾 Saving slide from editor...')
    
    try {
      // Redraw the slide to generate fresh thumbnail
      const canvas = document.createElement('canvas')
      const format = updatedSlide.format || step2Data.safeZoneFormat || '9:16'
      canvas.width = 1080
      canvas.height = format === '3:4' ? 1440 : 1920
      
      const ctx = canvas.getContext('2d')!
      
      // Paint background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Load and draw image
      const img = new Image()
      img.src = updatedSlide.image
      
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
      
      if (img.complete && img.naturalWidth > 0) {
        ctx.save()
        
        // Apply background transformations
        if (updatedSlide.rotateBg180 || updatedSlide.flipH) {
          ctx.translate(canvas.width / 2, canvas.height / 2)
          if (updatedSlide.rotateBg180) ctx.rotate(Math.PI)
          if (updatedSlide.flipH) ctx.scale(-1, 1)
          ctx.translate(-canvas.width / 2, -canvas.height / 2)
        }
        
        drawContain(ctx, img, canvas.width, canvas.height)
        ctx.restore()
      }
      
      // Apply text with style overrides
      const style = updatedSlide.styleOverride && Object.keys(updatedSlide.styleOverride).length > 0 
        ? { ...step2Data, ...updatedSlide.styleOverride }
        : step2Data
        
      await document.fonts.ready
      
      const fontWeight = style.fontChoice === 'SemiBold' ? 600 : 500
      const layout = layoutDesktop(ctx, {
        text: updatedSlide.caption,
        fontFamily: 'TikTok Sans',
        fontWeight: fontWeight as 400 | 500 | 600,
        fontPx: style.fontSize,
        lineSpacingPx: style.lineSpacing,
        yOffsetPx: style.yOffset,
        xOffsetPx: style.xOffset,
        align: 'center',
        horizontalAlign: 'center',
        textRotation: style.textRotation,
        safeMarginPx: 64,
        maxTextWidthPx: canvas.width - 128,
        deskW: canvas.width,
        deskH: canvas.height,
        useSafeZone: false
      })
      
      ctx.save()
      ctx.translate(layout.centerX, 0)
      ctx.rotate((style.textRotation * Math.PI) / 180)
      
      layout.lines.forEach((line, i) => {
        const x = 0
        const y = layout.baselines[i]
        
        if (style.outlinePx > 0) {
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = style.outlinePx * 2
          ctx.lineJoin = 'round'
          ctx.miterLimit = 2
          ctx.strokeText(line, x, y)
        }
        
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(line, x, y)
      })
      
      ctx.restore()
      
      // Generate thumbnail
      const thumbnailDataURL = canvas.toDataURL('image/png')
      console.log('✅ Thumbnail generated from editor')
      
      // Update state immutably
      setGeneratedIdeas(prev =>
        prev.map((idea, iIdx) =>
          iIdx !== editingSlide.ideaIndex ? idea : {
            ...idea,
            slides: idea.slides.map((s, sIdx) =>
              sIdx !== editingSlide.slideIndex ? s : {
                ...updatedSlide,
                thumbnail: thumbnailDataURL,
                lastModified: Date.now()
              }
            )
          }
        )
      )
      
      console.log('✅ Slide saved successfully')
    } catch (error) {
      console.error('❌ Failed to save slide:', error)
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
                <label className="block text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Select Day Sheets
                </label>
                
                <div className="space-y-3">
                  {availableSheets.map((sheet) => (
                    <div 
                      key={sheet}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-opacity-50"
                      style={{ 
                        backgroundColor: colors.surface2, 
                        borderColor: selectedSheets.includes(sheet) ? colors.accent : colors.border,
                        borderWidth: selectedSheets.includes(sheet) ? '2px' : '1px'
                      }}
                      onClick={() => handleSheetToggle(sheet)}
                    >
                      <span className="font-medium" style={{ color: colors.text }}>
                        {sheet}
                      </span>
                      
                      {/* Toggle Circle */}
                      <div 
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{ 
                          borderColor: selectedSheets.includes(sheet) ? colors.accent : colors.border,
                          backgroundColor: selectedSheets.includes(sheet) ? colors.accent : 'transparent'
                        }}
                      >
                        {selectedSheets.includes(sheet) && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'white' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedSheets.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.accent + '20' }}>
                    <p className="text-sm font-medium" style={{ color: colors.accent }}>
                      {selectedSheets.length} sheet{selectedSheets.length !== 1 ? 's' : ''} selected: {selectedSheets.join(', ')}
                    </p>
                  </div>
                )}
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

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
          Step 2: Preview & Customize Text
        </h2>
        <p className="text-xs" style={{ color: colors.textMuted }}>
          Edit caption, customize text style, and preview how it will look
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compact Preview */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
              Preview
            </h3>
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
              <div className={`w-2 h-2 rounded-full ${fontLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>{fontLoaded ? 'TikTok Sans' : 'System Font'}</span>
            </div>
          </div>
          
          <div 
            className="rounded-lg border mb-3 relative overflow-hidden"
            style={{ 
              backgroundColor: colors.surface2, 
              borderColor: colors.border,
              width: `${getCanvasDimensions().w}px`,
              height: `${getCanvasDimensions().h}px`,
              aspectRatio: step2Data?.safeZoneFormat === '3:4' ? '3/4' : '9/16'
            }}
          >
            {previewCanvas ? (
              <img 
                src={previewCanvas.toDataURL()} 
                alt="Preview" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            ) : currentImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={currentImage} 
                  alt="Preview" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
                {/* Fallback CSS text overlay if canvas rendering fails */}
                {currentCaption && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center px-6 py-8"
                    style={{
                      textAlign: (step2Data?.horizontalAlignment || 'center') as any,
                      // Apply X and Y offset positioning to match canvas rendering
                      // Calculate the same positioning as the desktop app
                      transform: `translate(${((step2Data?.xOffset !== undefined ? step2Data.xOffset : 0) * 0.25)}px, ${((step2Data?.yOffset !== undefined ? step2Data.yOffset : 0) * 0.25)}px) rotate(${step2Data?.textRotation || 0}deg)`
                    }}
                  >
                    <p 
                      className="caption font-bold"
                      style={{ 
                        color: 'white',
                        fontSize: `${(step2Data?.fontSize || 52) * 0.25}px`,
                        textShadow: `0 0 ${(step2Data?.outlinePx || 6) * 0.25}px black, 0 0 ${(step2Data?.outlinePx || 6) * 0.5}px black, 0 0 ${(step2Data?.outlinePx || 6) * 0.25}px black`,
                        lineHeight: `${((step2Data?.fontSize || 52) + (step2Data?.lineSpacing || 12)) * 0.25}px`,
                        fontWeight: step2Data?.fontChoice === 'SemiBold' ? 600 : step2Data?.fontChoice === 'Medium' ? 500 : 400,
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {currentCaption}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon size="md" color={colors.textMuted} />
                  <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                    Click Random Image
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRandomImage}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{ 
                backgroundColor: colors.buttonBg, 
                borderColor: colors.border, 
                color: colors.text 
              }}
            >
              <ShuffleIcon size="sm" className="inline mr-1" />
              Random
            </button>
            <button
              onClick={handleRandomCaption}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{ 
                backgroundColor: colors.buttonBg, 
                borderColor: colors.border, 
                color: colors.text 
              }}
            >
              <ShuffleIcon size="sm" className="inline mr-1" />
              Caption
            </button>
          </div>
        </div>

        {/* Caption Editor */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Caption Text
          </h3>
          <textarea
            value={currentCaption}
            onChange={(e) => setCurrentCaption(e.target.value)}
            placeholder="Enter or generate a caption..."
            rows={8}
            className="w-full h-[calc(100%-2rem)] px-3 py-2 rounded-lg border resize-none text-sm"
            style={{ 
              backgroundColor: colors.surface2, 
              borderColor: colors.border, 
              color: colors.text 
            }}
          />
        </div>

        {/* Compact Settings */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Text Settings
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Font Size
                </label>
                <NumberInput
                  value={step2Data?.fontSize || 52}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, fontSize: value } : null)}
                  min={20}
                  max={120}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Outline
                </label>
                <NumberInput
                  value={step2Data?.outlinePx || 6}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, outlinePx: value } : null)}
                  min={0}
                  max={20}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="font-weight-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                Font Weight
              </label>
              <select
                id="font-weight-select"
                name="fontWeight"
                value={step2Data?.fontChoice || 'Medium'}
                onChange={(e) => setStep2Data(prev => prev ? { ...prev, fontChoice: e.target.value } : null)}
                className="w-full px-2 py-1 rounded-lg border text-sm"
                style={{ 
                  backgroundColor: colors.surface2, 
                  borderColor: colors.border, 
                  color: colors.text 
                }}
              >
                <option value="Medium">Medium</option>
                <option value="SemiBold">SemiBold</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vertical-alignment-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Vertical Alignment
              </label>
              <select
                id="vertical-alignment-select"
                name="verticalAlignment"
                value={step2Data?.verticalAlignment || 'center'}
                onChange={(e) => setStep2Data(prev => prev ? { ...prev, verticalAlignment: e.target.value } : null)}
                className="w-full px-2 py-1 rounded-lg border text-sm"
                style={{ 
                  backgroundColor: colors.surface2, 
                  borderColor: colors.border, 
                  color: colors.text 
                }}
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
              </div>
              <div>
                <label htmlFor="horizontal-alignment-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Horizontal Alignment
                </label>
                <select
                  id="horizontal-alignment-select"
                  name="horizontalAlignment"
                  value={step2Data?.horizontalAlignment || 'center'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, horizontalAlignment: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  X Offset
                </label>
                <NumberInput
                  value={step2Data?.xOffset || 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, xOffset: value } : null)}
                  min={-200}
                  max={200}
                  step={1}
                  suffix="px"
                  style={{
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Y Offset
                </label>
                <NumberInput
                  value={step2Data?.yOffset || 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, yOffset: value } : null)}
                  min={-200}
                  max={200}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Line Spacing
                </label>
                <NumberInput
                  value={step2Data?.lineSpacing || 12}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, lineSpacing: value } : null)}
                  min={0}
                  max={50}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Text Rotation
                </label>
                <NumberInput
                  value={step2Data?.textRotation || 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, textRotation: value } : null)}
                  min={-45}
                  max={45}
                  step={1}
                  suffix="°"
                  style={{
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>
            </div>

            {/* Safe Zone Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: colors.text }}>
                Safe Zones
              </h4>
              
              <div className="flex items-center gap-4">
                <label htmlFor="enable-safezone-checkbox" className="flex items-center gap-2">
                  <input
                    id="enable-safezone-checkbox"
                    name="useSafeZone"
                    type="checkbox"
                    checked={step2Data?.useSafeZone ?? true}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, useSafeZone: e.target.checked } : null)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Enable Safe Zone
                  </span>
                </label>
                
                <label htmlFor="show-overlay-checkbox" className="flex items-center gap-2">
                  <input
                    id="show-overlay-checkbox"
                    name="showSafeZoneOverlay"
                    type="checkbox"
                    checked={step2Data?.showSafeZoneOverlay ?? false}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, showSafeZoneOverlay: e.target.checked } : null)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Show Overlay
                  </span>
                </label>
              </div>
              
              <div>
                <label htmlFor="format-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Format
                </label>
                <select
                  id="format-select"
                  name="safeZoneFormat"
                  value={step2Data?.safeZoneFormat || '9:16'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, safeZoneFormat: e.target.value as '9:16' | '3:4' } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="9:16">9:16 (TikTok)</option>
                  <option value="3:4">3:4 (Square)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={step2Data?.autoFit || false}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, autoFit: e.target.checked } : null)}
                  className="mr-1"
                />
                <span style={{ color: colors.textMuted }}>
                  Auto Fit
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={step2Data?.rotateBg180 || false}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, rotateBg180: e.target.checked } : null)}
                  className="mr-1"
                />
                <span style={{ color: colors.textMuted }}>
                  Rotate 180°
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

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

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Step 3: Review & Export
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Review your slides, make final adjustments, and export your content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slides Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              Generated Ideas ({generatedIdeas.length})
            </h3>
            <div className="flex items-center gap-2">
              {generatedIdeas.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔥 Randomize All Images button clicked!')
                    console.log('Available images count:', availableImages.length)
                    console.log('Generated ideas count:', generatedIdeas.length)
                    randomizeAllImages()
                  }}
                  className="px-4 py-2 rounded-lg border flex items-center gap-2 text-sm transition-all hover:scale-105 hover:shadow-lg cursor-pointer relative z-50"
                  style={{ 
                    backgroundColor: colors.accent, 
                    borderColor: colors.accent, 
                    color: '#ffffff',
                    fontWeight: '600'
                  }}
                  title="Click to randomize all images for all ideas"
                >
                  <ShuffleIcon size="sm" />
                  🎲 Randomize All Images
                </button>
              )}
            {generatedIdeas.length === 0 && (
              <button
                onClick={generateAllDrafts}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg border flex items-center gap-2 text-sm"
                style={{ 
                  backgroundColor: colors.accent, 
                  borderColor: colors.accent, 
                  color: 'white' 
                }}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {exportProgress ? (
                        <span>Generating... {exportProgress.completed}/{exportProgress.total}</span>
                      ) : (
                        'Generating...'
                      )}
                  </>
                ) : (
                  <>
                    <TextIcon size="sm" />
                    Generate Ideas
                  </>
                )}
              </button>
            )}
            </div>
          </div>
          
          {generatedIdeas.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <ImageIcon size="lg" color={colors.textMuted} />
                <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
                  No ideas generated yet. Click "Generate Ideas" to create drafts from your spreadsheet.
                </p>
                {step1Data?.ideas && (
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    Ready to generate {step1Data.ideas.length} ideas with multiple slides each
                  </p>
                )}
              </div>
            </div>
          ) : (
            <AnimatedList
              items={generatedIdeas.map((idea) => (
                <div
                  key={idea.ideaId}
                  className="rounded-lg border relative cursor-pointer transition-all duration-200"
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border 
                  }}
                  onClick={() => toggleIdeaExpansion(idea.ideaId)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    variant="purple"
                    borderWidth={1}
                  />
                  {/* Idea Header */}
                  <div
                    className="p-4 flex items-center justify-between relative z-10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                           style={{ backgroundColor: colors.accent, color: 'white' }}>
                        {idea.ideaId}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                          Idea {idea.ideaId}
                        </h4>
                        <p className="text-xs truncate max-w-md" style={{ color: colors.textMuted }}>
                          {idea.ideaText}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded font-medium" style={{ 
                        backgroundColor: colors.accent + '20', 
                        color: colors.accent 
                      }}>
                        {getIdeaFormatLabel(idea)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded" style={{ 
                        backgroundColor: colors.surface2, 
                        color: colors.textMuted 
                      }}>
                        {idea.slides.length} slides
                      </span>
                      <ChevronRightIcon 
                        size="sm" 
                        color={colors.textMuted}
                        className={`transition-transform ${idea.isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>
                  
                  {/* Expanded Slides */}
                  {idea.isExpanded && (
                    <div className="px-4 pb-4 relative z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-3">
                        {idea.slides.map((slide, slideIndex) => {
                          const ideaIndex = generatedIdeas.findIndex(i => i.ideaId === idea.ideaId)
                          return (
                          <div
                            key={slide.id}
                              className={`rounded-lg border-2 cursor-pointer transition-all relative group ${
                              selectedDraft === slide.id ? 'border-solid' : 'border-dashed hover:border-solid'
                            }`}
                            style={{ 
                              backgroundColor: colors.surface2, 
                                borderColor: selectedDraft === slide.id ? colors.accent : colors.border,
                                aspectRatio: slide.format === '3:4' ? '3/4' : '9/16'
                            }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDraft(slide.id)
                              }}
                          >
                            <SlideEditorCanvas
                              key={`${slide.id}-${slide.image}-${slide.lastModified || Date.now()}`}
                              src={slide.image}
                              bgColor="#000000"
                              className="w-full h-full rounded-lg"
                              priority="low"
                              drawOverlay={(ctx, cssW, cssH) => {
                                // Draw text overlay for thumbnails
                                if (!step2Data || !slide.caption) return
                                
                                const fontWeight = step2Data.fontChoice === 'SemiBold' ? 600 : 500
                                
                                // Calculate scale factor to fit thumbnail while maintaining aspect ratio
                                const fullWidth = slide.format === '3:4' ? 1080 : 1080
                                const fullHeight = slide.format === '3:4' ? 1440 : 1920
                                const scaleX = cssW / fullWidth
                                const scaleY = cssH / fullHeight
                                const scale = Math.min(scaleX, scaleY)
                                
                                
                                // Use EXACT same settings as Step 2, but ensure text fits within thumbnail bounds
                                const scaledFontSize = (step2Data.fontSize || 52) * scale
                                const scaledLineSpacing = (step2Data.lineSpacing || 12) * scale
                                const scaledSafeMargin = 64 * scale
                                
                                // Ensure text width doesn't exceed thumbnail bounds
                                const maxTextWidth = Math.min(
                                  (fullWidth - 128) * scale,  // Scaled full width minus margins
                                  cssW - (scaledSafeMargin * 2)  // Actual thumbnail width minus margins
                                )
                                
                                
                                const layout = layoutDesktop(ctx, {
                                  text: slide.caption,
                                  fontFamily: 'TikTok Sans',
                                  fontWeight: fontWeight as 400 | 500 | 600,
                                  fontPx: scaledFontSize,
                                  lineSpacingPx: scaledLineSpacing,
                                  yOffsetPx: (step2Data.yOffset !== undefined ? step2Data.yOffset : 0) * scale,
                                  xOffsetPx: (step2Data.xOffset !== undefined ? step2Data.xOffset : 0) * scale,
                                  align: (step2Data.verticalAlignment || 'center') as 'top' | 'center' | 'bottom',
                                  horizontalAlign: (step2Data.horizontalAlignment || 'center') as 'left' | 'center' | 'right',
                                  textRotation: step2Data.textRotation !== undefined ? step2Data.textRotation : 0,
                                  safeMarginPx: scaledSafeMargin,
                                  maxTextWidthPx: maxTextWidth, // Use the smaller of the two widths
                                  deskW: cssW, // Use actual thumbnail width
                                  deskH: cssH, // Use actual thumbnail height
                                  useSafeZone: step2Data.useSafeZone ?? true,
                                  safeZoneFormat: slide.format || step2Data.safeZoneFormat
                                })
                                

                                // Draw text
                                ctx.save()
                                ctx.translate(layout.centerX, 0)
                                ctx.rotate(((step2Data.textRotation || 0) * Math.PI) / 180)

                                layout.lines.forEach((line, i) => {
                                  const x = 0
                                  const y = layout.baselines[i]

                                  if ((step2Data.outlinePx || 0) > 0) {
                                    ctx.strokeStyle = '#000000'
                                    ctx.lineWidth = (step2Data.outlinePx || 0) * scale * 2
                                    ctx.lineJoin = 'round'
                                    ctx.miterLimit = 2
                                    ctx.strokeText(line, x, y)
                                  }

                                  ctx.fillStyle = '#FFFFFF'
                                  ctx.fillText(line, x, y)
                                })

                                ctx.restore()
                              }}
                            />
                              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              {slideIndex + 1}
                            </div>
                              <div className="absolute top-2 left-2 bg-purple-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded font-medium">
                                {slide.format}
                            </div>
                            {/* Show image source indicator */}
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              {slide.imageSource === 'ai-method' ? 'AI Method' : 'Affiliate'}
                            </div>
                              {/* Action buttons - shown on hover */}
                              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditSlide(ideaIndex, slideIndex)
                                  }}
                                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                                  title="Edit slide"
                                >
                                  <SettingsIcon size="sm" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log(`🔥 Single slide randomize button clicked! Idea: ${ideaIndex}, Slide: ${slideIndex}`)
                                    console.log('Slide current image:', slide.image)
                                    console.log('Available images:', availableImages.length)
                                    randomizeSingleSlideImage(ideaIndex, slideIndex)
                                  }}
                                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white text-xs px-2 py-1 rounded flex items-center gap-1 cursor-pointer z-50 relative"
                                  title="Randomize this slide's image"
                                >
                                  <ShuffleIcon size="sm" />
                                  🎲 Randomize
                                </button>
                          </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              showGradients={true}
              enableArrowNavigation={false}
              displayScrollbar={true}
            />
          )}
        </div>

        {/* Export Options */}
        <div 
          className="p-6 rounded-lg border"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Export Options
          </h3>
          
          {generatedIdeas.length === 0 ? (
            <div className="text-center py-8">
              <TextIcon size="lg" color={colors.textMuted} />
              <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
                Generate ideas first to see export options
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Draft Info */}
              {selectedDraft && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface2 }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                    Selected Slide
                  </h4>
                  {(() => {
                    const selectedSlide = generatedIdeas
                      .flatMap(idea => idea.slides)
                      .find(slide => slide.id === selectedDraft)
                    return selectedSlide ? (
                      <>
                        <p className="text-xs mb-1" style={{ color: colors.textMuted }}>
                          Idea {generatedIdeas.find(idea => idea.slides.some(s => s.id === selectedDraft))?.ideaId}
                        </p>
                        <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
                          {selectedSlide.caption}
                        </p>
                        <button
                          onClick={() => exportDraftAsPNG(selectedSlide)}
                          className="w-full px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-2"
                          style={{ 
                            backgroundColor: colors.buttonBg, 
                            borderColor: colors.border, 
                            color: colors.text 
                          }}
                        >
                          <DownloadIcon size="sm" />
                          Export This Slide
                        </button>
                      </>
                    ) : null
                  })()}
                </div>
              )}

              {/* Export All */}
              <button
                onClick={exportAllDraftsAsZIP}
                disabled={isExporting}
                className="w-full px-4 py-3 rounded-lg border flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: colors.accent, 
                  borderColor: colors.accent, 
                  color: 'white' 
                }}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <DownloadIcon size="sm" />
                    Export All Ideas ({generatedIdeas.reduce((sum, idea) => sum + idea.slides.length, 0)} slides)
                  </>
                )}
              </button>

              {/* Regenerate */}
              <button
                onClick={generateAllDrafts}
                disabled={isGenerating}
                className="w-full px-4 py-2 rounded-lg border text-sm flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: colors.buttonBg, 
                  borderColor: colors.border, 
                  color: colors.text 
                }}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    {exportProgress ? (
                      <span>Regenerating... {exportProgress.completed}/{exportProgress.total}</span>
                    ) : (
                      'Regenerating...'
                    )}
                  </>
                ) : (
                  <>
                    <ShuffleIcon size="sm" />
                    Regenerate All Ideas
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

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

        {/* Multi-Sheet Mode Toggle */}
        {currentStep > 0 && (
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md transition-all ${
                  !isMultiSheetMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setIsMultiSheetMode(false)}
              >
                Single Sheet
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all ${
                  isMultiSheetMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setIsMultiSheetMode(true)}
              >
                Multi Sheet
              </button>
            </div>
          </div>
        )}

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
                console.log(`🔥 SlideEditor randomize button clicked! Idea: ${editingSlide.ideaIndex}, Slide: ${editingSlide.slideIndex}`)
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
        {isMultiSheetMode ? (
          <MultiSheetFlow />
        ) : (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep2_5()}
            {currentStep === 4 && renderStep3()}
          </>
        )}

        {/* Navigation */}
        {!isMultiSheetMode && currentStep !== 3 && (
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