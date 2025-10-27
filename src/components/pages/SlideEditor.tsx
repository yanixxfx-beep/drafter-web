'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { X, RotateCw, FlipHorizontal, Move, Shuffle, Edit3 } from 'lucide-react'
import { drawCaptionWithStyle } from '@/lib/render/caption'
import { loadSafeZone, drawSafeZoneOverlay } from '@/utils/safeZones'
import SlideEditorCanvas from '@/components/SlideEditorCanvas'

interface Step2Data {
  fontChoice: string
  fontSize: number
  outlinePx: number
  lineSpacing: number
  yOffset: number
  xOffset: number
  textRotation: number
  verticalAlignment: 'top' | 'center' | 'bottom'
  horizontalAlignment: 'left' | 'center' | 'right'
  autoFit: boolean
  useSafeZone: boolean
  safeZoneFormat: '9:16' | '3:4'
  showSafeZoneOverlay: boolean
}

interface SlideData {
  id: string
  slideNumber: number
  caption: string
  image: string
  format: '9:16' | '3:4'
  canvas: HTMLCanvasElement
  rotateBg180?: boolean
  flipH?: boolean
  overrideCenterPx?: [number, number] | null
  styleOverride?: Partial<Step2Data>
}

interface SlideEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedSlide: SlideData) => void
  slide: SlideData
  globalSettings: Step2Data
  onRandomizeImage?: () => void
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  slide,
  globalSettings,
  onRandomizeImage
}) => {
  const { colors } = useTheme()
  // No longer need canvasRef - using SlideEditorCanvas component
  const [caption, setCaption] = useState(slide.caption)
  const [rotateBg180, setRotateBg180] = useState(slide.rotateBg180 || false)
  const [flipH, setFlipH] = useState(slide.flipH || false)
  const [overrideCenterPx, setOverrideCenterPx] = useState<[number, number] | null>(slide.overrideCenterPx || null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 })

  // Per-slide style overrides
  const [useStyleOverride, setUseStyleOverride] = useState(!!slide.styleOverride && Object.keys(slide.styleOverride).length > 0)
  const [fontChoice, setFontChoice] = useState(slide.styleOverride?.fontChoice || globalSettings.fontChoice)
  const [fontSize, setFontSize] = useState(slide.styleOverride?.fontSize || globalSettings.fontSize)
  const [outlinePx, setOutlinePx] = useState(slide.styleOverride?.outlinePx || globalSettings.outlinePx)
  const [lineSpacing, setLineSpacing] = useState(slide.styleOverride?.lineSpacing || globalSettings.lineSpacing)
  const [verticalAlignment, setVerticalAlignment] = useState(slide.styleOverride?.verticalAlignment || globalSettings.verticalAlignment)
  const [horizontalAlignment, setHorizontalAlignment] = useState(slide.styleOverride?.horizontalAlignment || globalSettings.horizontalAlignment)
  const [yOffset, setYOffset] = useState(
    slide.styleOverride?.yOffset !== undefined
      ? slide.styleOverride.yOffset
      : globalSettings.yOffset !== undefined
      ? globalSettings.yOffset
      : -100
  )
  const [xOffset, setXOffset] = useState(slide.styleOverride?.xOffset || globalSettings.xOffset)
  const [textRotation, setTextRotation] = useState(slide.styleOverride?.textRotation || globalSettings.textRotation)
  const [autoFit, setAutoFit] = useState(slide.styleOverride?.autoFit || globalSettings.autoFit)
  const [useSafeZone, setUseSafeZone] = useState(slide.styleOverride?.useSafeZone || globalSettings.useSafeZone)
  const [safeZoneFormat, setSafeZoneFormat] = useState(slide.styleOverride?.safeZoneFormat || globalSettings.safeZoneFormat)
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(
    slide.styleOverride?.showSafeZoneOverlay || globalSettings.showSafeZoneOverlay
  )
  const fillColor = slide.styleOverride?.fillColor || globalSettings.fillColor || '#FFFFFF'
  const outlineColor = slide.styleOverride?.outlineColor || globalSettings.outlineColor || '#000000'
  const [backgroundType, setBackgroundType] = useState(slide.styleOverride?.backgroundType || globalSettings.backgroundType || 'image')
  const [backgroundColor, setBackgroundColor] = useState(slide.styleOverride?.backgroundColor || globalSettings.backgroundColor || '#000000')

  const currentStyle = useStyleOverride
    ? {
        fontChoice,
        fontSize,
        outlinePx,
        lineSpacing,
        verticalAlignment,
        horizontalAlignment,
        yOffset,
        xOffset,
        textRotation,
        autoFit,
        useSafeZone,
        safeZoneFormat,
        showSafeZoneOverlay,
        fillColor,
        outlineColor
      }
    : {
        ...globalSettings,
        fillColor: globalSettings.fillColor || '#FFFFFF',
        outlineColor: globalSettings.outlineColor || '#000000'
      }

  const currentBackgroundType = useStyleOverride
    ? backgroundType
    : globalSettings.backgroundType || 'image'
  const currentBackgroundColor = useStyleOverride
    ? backgroundColor
    : globalSettings.backgroundColor || '#000000'

  const exportDimensions = useMemo(() => {
    if (slide.format === '3:4') {
      return { width: 1080, height: 1440 }
    }
    return { width: 1080, height: 1920 }
  }, [slide.format])

  const previewDimensions = useMemo(
    () => ({
      width: Math.round(exportDimensions.width / 3),
      height: Math.round(exportDimensions.height / 3)
    }),
    [exportDimensions]
  )

  const previewDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const imageTransform = useMemo(
    () => ({
      rotate180: rotateBg180,
      flipHorizontal: flipH
    }),
    [rotateBg180, flipH]
  )
    () => ({
      rotate180: rotateBg180,
      flipHorizontal: flipH
    }),
    [rotateBg180, flipH]
  )

  // Create text overlay function for the canvas
  const drawTextOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, cssW: number, cssH: number, _dpr: number) => {
      const format = slide.format || globalSettings.safeZoneFormat || '9:16'
      drawCaptionWithStyle(
        ctx,
        caption,
        cssW,
        cssH,
        {
          fontChoice: currentStyle.fontChoice,
          fontSize: currentStyle.fontSize,
          lineSpacing: currentStyle.lineSpacing,
          yOffset: currentStyle.yOffset,
          xOffset: currentStyle.xOffset,
          textRotation: currentStyle.textRotation,
          outlinePx: currentStyle.outlinePx,
          outlineColor: currentStyle.outlineColor ?? '#000000',
          fillColor: currentStyle.fillColor ?? '#FFFFFF',
          verticalAlignment: currentStyle.verticalAlignment,
          horizontalAlignment: currentStyle.horizontalAlignment,
          useSafeZone: currentStyle.useSafeZone,
          safeZoneFormat: currentStyle.safeZoneFormat
        },
        format
      )

      if (currentStyle.showSafeZoneOverlay && currentStyle.useSafeZone) {
        const safeZone = loadSafeZone(format)
        if (safeZone) {
          const scaleX = cssW / safeZone.canvas[0]
          const scaleY = cssH / safeZone.canvas[1]
          ctx.save()
          ctx.scale(scaleX, scaleY)
          drawSafeZoneOverlay(ctx, safeZone, true)
          ctx.restore()
        }
      }
    },
    [
      caption,
      currentStyle.fontChoice,
      currentStyle.fontSize,
      currentStyle.horizontalAlignment,
      currentStyle.lineSpacing,
      currentStyle.outlineColor,
      currentStyle.outlinePx,
      currentStyle.textRotation,
      currentStyle.useSafeZone,
      currentStyle.verticalAlignment,
      currentStyle.xOffset,
      currentStyle.yOffset,
      currentStyle.safeZoneFormat,
      globalSettings.safeZoneFormat,
      slide.format
    ]
  )

// No need for manual renderPreview calls - the canvas hook handles it automatically

  const handleSave = () => {
    const updatedSlide = {
      ...slide,
      caption,
      rotateBg180,
      flipH,
      overrideCenterPx,
      styleOverride: useStyleOverride
        ? {
            ...currentStyle,
            backgroundType,
            backgroundColor
          }
        : undefined,
    }
    onSave(updatedSlide)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface p-8 rounded-xl shadow-2xl max-w-6xl w-full h-[95vh] flex flex-col"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-textPrimary flex items-center gap-2" style={{ color: colors.text }}>
            <Edit3 size={24} />
            Edit Slide {slide.slideNumber}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface2 transition-colors"
            style={{ backgroundColor: colors.surface2 }}
          >
            <X size={20} style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
          {/* Left: Preview */}
          <div className="flex flex-col items-center justify-center bg-surface2 rounded-lg p-4" style={{ backgroundColor: colors.surface2 }}>
            <div 
              className="relative rounded-lg border border-border cursor-grab active:cursor-grabbing overflow-hidden"
              style={{
                width: previewDimensions.width,
                height: previewDimensions.height,
                backgroundColor: '#000000'
              }}
              onMouseDown={(e) => {
                if (e.button === 0) { // Left click
                  setIsDragging(true)
                  const rect = e.currentTarget.getBoundingClientRect()
                  setDragStartOffset({
                    x: e.clientX - rect.left - (overrideCenterPx ? overrideCenterPx[0] : rect.width / 2 + currentStyle.xOffset),
                    y: e.clientY - rect.top - (overrideCenterPx ? overrideCenterPx[1] : rect.height / 2 + currentStyle.yOffset),
                  })
                }
              }}
              onMouseMove={(e) => {
                if (isDragging) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const newX = e.clientX - rect.left - dragStartOffset.x
                  const newY = e.clientY - rect.top - dragStartOffset.y
                  setOverrideCenterPx([newX, newY])
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              >
                <SlideEditorCanvas
                  src={slide.image}
                  bgColor={currentBackgroundType === 'solid' ? currentBackgroundColor || '#000000' : '#000000'}
                  className="absolute inset-0"
                  cssSize={previewDimensions}
                  exportSize={exportDimensions}
                  dpr={previewDpr}
                  drawOverlay={drawTextOverlay}
                  priority="high"
                  imageTransform={imageTransform}
                />
              </div>
            <div className="mt-4 flex items-center gap-4 text-sm" style={{ color: colors.textMuted }}>
              <div className="flex items-center gap-1">
                <Move size={16} />
                Drag to reposition text
              </div>
              {overrideCenterPx && (
                <button
                  onClick={() => setOverrideCenterPx(null)}
                  className="px-2 py-1 rounded-md bg-surface border border-border text-xs hover:bg-surface1"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                >
                  Reset Position
                </button>
              )}
              {onRandomizeImage && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔥 SlideEditor: Randomize Image button clicked!')
                    console.log('Current slide:', slide.id, slide.slideNumber)
                    console.log('Current image:', slide.image)
                    onRandomizeImage()
                  }}
                  className="px-3 py-1 rounded-md bg-accent text-white text-xs hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer z-50 relative"
                  style={{ backgroundColor: colors.accent }}
                  title="Randomize this slide's background image"
                >
                  <Shuffle size={14} />
                  🎲 Randomize Image
                </button>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex flex-col space-y-6 overflow-y-auto pr-2">
            {/* Caption */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 rounded-lg border text-sm resize-none"
                rows={4}
                style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
              />
            </div>

            {/* Background Controls */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold" style={{ color: colors.text }}>Background</h4>
              <div className="flex items-center space-x-6">
                <label className="flex items-center text-sm cursor-pointer" style={{ color: colors.text }}>
                  <input
                    type="checkbox"
                    checked={rotateBg180}
                    onChange={(e) => setRotateBg180(e.target.checked)}
                    className="mr-2"
                    style={{ accentColor: colors.accent }}
                  />
                  <RotateCw size={16} className="mr-1" />
                  Rotate 180°
                </label>
                <label className="flex items-center text-sm cursor-pointer" style={{ color: colors.text }}>
                  <input
                    type="checkbox"
                    checked={flipH}
                    onChange={(e) => setFlipH(e.target.checked)}
                    className="mr-2"
                    style={{ accentColor: colors.accent }}
                  />
                  <FlipHorizontal size={16} className="mr-1" />
                  Flip Horizontal
                </label>
              </div>
            </div>

            {/* Style Overrides */}
            <div className="border rounded-lg p-4 space-y-4" style={{ borderColor: colors.border, backgroundColor: colors.surface2 }}>
              <label className="flex items-center text-sm font-medium cursor-pointer" style={{ color: colors.text }}>
                <input
                  type="checkbox"
                  checked={useStyleOverride}
                  onChange={(e) => setUseStyleOverride(e.target.checked)}
                  className="mr-2"
                  style={{ accentColor: colors.accent }}
                />
                Override Global Style for this Slide
              </label>

              {useStyleOverride && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Font</label>
                    <select
                      value={fontChoice}
                      onChange={(e) => setFontChoice(e.target.value)}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    >
                      <option value="Medium">Medium</option>
                      <option value="SemiBold">SemiBold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Font Size</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      min={10}
                      max={200}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Outline (px)</label>
                    <input
                      type="number"
                      value={outlinePx}
                      onChange={(e) => setOutlinePx(Number(e.target.value))}
                      min={0}
                      max={20}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Line Spacing</label>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(Number(e.target.value))}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    >
                      <option value={-10}>Tight</option>
                      <option value={0}>Normal</option>
                      <option value={10}>Loose</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Vertical Align</label>
                    <select
                      value={verticalAlignment}
                      onChange={(e) => setVerticalAlignment(e.target.value as 'top' | 'center' | 'bottom')}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Horizontal Align</label>
                    <select
                      value={horizontalAlignment}
                      onChange={(e) => setHorizontalAlignment(e.target.value as 'left' | 'center' | 'right')}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Y Offset (px)</label>
                    <input
                      type="number"
                      value={yOffset}
                      onChange={(e) => setYOffset(Number(e.target.value))}
                      min={-500}
                      max={500}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>X Offset (px)</label>
                    <input
                      type="number"
                      value={xOffset}
                      onChange={(e) => setXOffset(Number(e.target.value))}
                      min={-500}
                      max={500}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Text Rotation (°)</label>
                    <input
                      type="number"
                      value={textRotation}
                      onChange={(e) => setTextRotation(Number(e.target.value))}
                      min={-180}
                      max={180}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Background Type</label>
                    <select
                      value={backgroundType}
                      onChange={(e) => setBackgroundType(e.target.value as 'image' | 'solid')}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                    >
                      <option value="image">Image</option>
                      <option value="solid">Solid Color</option>
                    </select>
                  </div>

                  {backgroundType === 'solid' && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Background Color</label>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-10 rounded border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                      />
                    </div>
                  )}

                  <div className="col-span-2 space-y-2">
                    <label className="flex items-center text-sm cursor-pointer" style={{ color: colors.text }}>
                      <input
                        type="checkbox"
                        checked={autoFit}
                        onChange={(e) => setAutoFit(e.target.checked)}
                        className="mr-2"
                        style={{ accentColor: colors.accent }}
                      />
                      Auto-fit Text
                    </label>
                    
                    <label className="flex items-center text-sm cursor-pointer" style={{ color: colors.text }}>
                      <input
                        type="checkbox"
                        checked={useSafeZone}
                        onChange={(e) => setUseSafeZone(e.target.checked)}
                        className="mr-2"
                        style={{ accentColor: colors.accent }}
                      />
                      Use Safe Zone
                    </label>
                    
                    {useSafeZone && (
                      <div className="ml-6">
                        <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Safe Zone Format</label>
                        <select
                          value={safeZoneFormat}
                          onChange={(e) => setSafeZoneFormat(e.target.value as '9:16' | '3:4')}
                          className="w-full p-2 rounded-md border text-sm"
                          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
                        >
                          <option value="9:16">9:16</option>
                          <option value="3:4">3:4</option>
                        </select>
                      </div>
                    )}
                    
                    <label className="flex items-center text-sm cursor-pointer" style={{ color: colors.text }}>
                      <input
                        type="checkbox"
                        checked={showSafeZoneOverlay}
                        onChange={(e) => setShowSafeZoneOverlay(e.target.checked)}
                        className="mr-2"
                        style={{ accentColor: colors.accent }}
                      />
                      Show Safe Zone Overlay
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.textMuted }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{ backgroundColor: colors.accent, color: 'white' }}
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  )
}



