'use client'

import React from 'react'
import AnimatedList from '@/components/ui/AnimatedList'
import { GlowingEffect } from '@/components/ui/GlowingEffect'
import SlideEditorCanvas from '@/components/SlideEditorCanvas'
import { 
  ChevronRightIcon, 
  ShuffleIcon, 
  TextIcon, 
  ImageIcon, 
  DownloadIcon, 
  SettingsIcon
} from '@/components/ui/Icon'

interface Step3PaneProps {
  colors: any
  generatedIdeas: any[]
  selectedDraft: string | null
  setSelectedDraft: (id: string) => void
  isGenerating: boolean
  isExporting: boolean
  exportProgress: any
  step1Data: any
  step2Data: any
  availableImages: any[]
  randomizeAllImages: () => void
  generateAllDrafts: () => void
  toggleIdeaExpansion: (ideaId: number) => void
  getIdeaFormatLabel: (idea: any) => string
  handleEditSlide: (ideaIndex: number, slideIndex: number) => void
  randomizeSingleSlideImage: (ideaIndex: number, slideIndex: number) => void
  exportDraftAsPNG: (slide: any) => void
  exportAllDraftsAsZIP: () => void
  drawCaption: (
    ctx: CanvasRenderingContext2D,
    caption: string,
    cssWidth: number,
    cssHeight: number,
    format?: '9:16' | '3:4',
    styleOverride?: any
  ) => void
}

export default function Step3Pane({
  colors,
  generatedIdeas,
  selectedDraft,
  setSelectedDraft,
  isGenerating,
  isExporting,
  exportProgress,
  step1Data,
  step2Data,
  availableImages,
  randomizeAllImages,
  generateAllDrafts,
  toggleIdeaExpansion,
  getIdeaFormatLabel,
  handleEditSlide,
  randomizeSingleSlideImage,
  exportDraftAsPNG,
  exportAllDraftsAsZIP,
  drawCaption
}: Step3PaneProps) {
  
  // State for selected sheet in multi-sheet mode
  const [selectedSheet, setSelectedSheet] = React.useState<string | null>(null)
  
  // Group ideas by sheet if multi-sheet mode
  const groupedIdeas = React.useMemo(() => {
    if (!step1Data?.selectedSheets || step1Data.selectedSheets.length <= 1) {
      // Single sheet or legacy mode - return flat structure
      return { _default: generatedIdeas }
    }
    
    // Multi-sheet mode - group by sheetName
    const grouped: Record<string, typeof generatedIdeas> = {}
    generatedIdeas.forEach(idea => {
      const sheetKey = idea.sheetName || '_default'
      if (!grouped[sheetKey]) {
        grouped[sheetKey] = []
      }
      grouped[sheetKey].push(idea)
    })
    
    return grouped
  }, [generatedIdeas, step1Data?.selectedSheets])

  const sheetNames = Object.keys(groupedIdeas)
  const isMultiSheet = step1Data?.selectedSheets && step1Data.selectedSheets.length > 1
  
  // Initialize selected sheet to first sheet
  React.useEffect(() => {
    if (isMultiSheet && selectedSheet === null && sheetNames.length > 0) {
      setSelectedSheet(sheetNames[0])
    }
  }, [isMultiSheet, selectedSheet, sheetNames])
  
  // Get current ideas to display (either filtered by sheet or all ideas)
  const currentIdeas = React.useMemo(() => {
    if (!isMultiSheet) {
      return generatedIdeas
    }
    if (!selectedSheet) {
      return []
    }
    return groupedIdeas[selectedSheet] || []
  }, [isMultiSheet, selectedSheet, groupedIdeas, generatedIdeas])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Step 3: Review & Export
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Review your slides, make final adjustments, and export your content
        </p>
      </div>

      {/* Sheet Selector - only show for multi-sheet mode */}
      {isMultiSheet && sheetNames.length > 1 && (
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sheetNames.map((sheetName) => (
              <button
                key={sheetName}
                onClick={() => setSelectedSheet(sheetName)}
                className="px-4 py-2 rounded-lg border flex-shrink-0 text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedSheet === sheetName ? colors.accent : colors.surface,
                  borderColor: selectedSheet === sheetName ? colors.accent : colors.border,
                  color: selectedSheet === sheetName ? 'white' : colors.text
                }}
              >
                {sheetName}
                <span className="ml-2 opacity-70">
                  ({groupedIdeas[sheetName]?.length || 0})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slides Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              Generated Ideas ({currentIdeas.length})
              {isMultiSheet && selectedSheet && ` from ${selectedSheet}`}
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
            <div className="space-y-4">
              <AnimatedList
                items={currentIdeas.map((idea) => (
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
                        {idea.slides.map((slide: any, slideIndex: number) => {
                          const ideaIndex = generatedIdeas.findIndex(i => i.ideaId === idea.ideaId)
                          const thumbExport = slide.format === '3:4'
                            ? { width: 1080, height: 1440 }
                            : { width: 1080, height: 1920 }
                          const thumbCss = {
                            width: Math.round(thumbExport.width / 6),
                            height: Math.round(thumbExport.height / 6)
                          }
                          return (
                          <div
                            key={slide.id}
                              className={`rounded-lg border-2 cursor-pointer transition-all relative group ${
                              selectedDraft === slide.id ? 'border-solid' : 'border-dashed hover:border-solid'
                            }`}
                            style={{ 
                              backgroundColor: colors.surface2, 
                              borderColor: selectedDraft === slide.id ? colors.accent : colors.border,
                              width: thumbCss.width,
                              height: thumbCss.height
                            }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDraft(slide.id)
                              }}
                          >
                            {slide.thumbnail ? (
                              <img
                                src={slide.thumbnail}
                                alt={`Slide ${slideIndex + 1}`}
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              <SlideEditorCanvas
                                key={`${slide.id}-${slide.image}-${slide.lastModified || Date.now()}`}
                                src={slide.image}
                                bgColor={slide.renderConfig?.slide.backgroundColor || '#000000'}
                                className="absolute inset-0 rounded-lg"
                                cssSize={thumbCss}
                                exportSize={thumbExport}
                                dpr={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
                                drawOverlay={(ctx, cssW, cssH, _dpr) => {
                                  drawCaption(ctx, slide.caption, cssW, cssH, slide.format, slide.styleOverride)
                                }}
                                imageTransform={{
                                  rotate180: slide.rotateBg180,
                                  flipHorizontal: slide.flipH
                                }}
                              />
                            )}
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
            </div>
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
                          Idea {generatedIdeas.find(idea => idea.slides.some((s: any) => s.id === selectedDraft))?.ideaId}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent"></div>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <TextIcon size="sm" />
                    Regenerate Ideas
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
