// src/components/pages/Step3MultiSheet.tsx
import React, { useState, useEffect } from 'react'
import { SlideGrid } from '@/components/SlideGrid'
import { SlideEditorUnified } from '@/components/SlideEditorUnified'
import { useThumbnails } from '@/hooks/useThumbnails'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { mulberry32 } from '@/lib/rand'
import { ExportManager } from '@/lib/export/ExportManager'
import type { Slide } from '@/types/slide'
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ShuffleIcon, EyeIcon, FolderIcon } from '@/components/ui/Icon'

interface GeneratedSlideGroup {
  sheetName: string
  sheetId: string
  slides: Slide[]
  totalIdeas: number
  generatedAt: Date
}

interface Step3MultiSheetProps {
  slideGroups: GeneratedSlideGroup[]
  availableImages: string[]
  onUpdateSlides: (slideGroups: GeneratedSlideGroup[]) => void
  onExportAll: () => void
  onBack: () => void
  className?: string
}

export function Step3MultiSheet({ 
  slideGroups, 
  availableImages, 
  onUpdateSlides, 
  onExportAll,
  onBack,
  className = '' 
}: Step3MultiSheetProps) {
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSheet, setSelectedSheet] = useState<string | 'all'>('all')
  const [filteredSlides, setFilteredSlides] = useState<Slide[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{
    current: string
    completed: number
    total: number
  } | null>(null)

  const { generateThumbnails, updateSlideThumbnail } = useThumbnails()
  const exportManager = ExportManager.getInstance()

  // Generate thumbnails when slide groups change
  useEffect(() => {
    const allSlides = slideGroups.flatMap(group => group.slides)
    if (allSlides.length > 0) {
      generateThumbnails(allSlides, 216)
    }
  }, [slideGroups, generateThumbnails])

  // Filter slides based on search query and selected sheet
  useEffect(() => {
    let slides = slideGroups.flatMap(group => group.slides)

    // Filter by sheet
    if (selectedSheet !== 'all') {
      const selectedGroup = slideGroups.find(group => group.sheetId === selectedSheet)
      slides = selectedGroup ? selectedGroup.slides : []
    }

    // Filter by search query
    if (searchQuery.trim()) {
      slides = slides.filter(slide => 
        slide.textLayers.some(layer => 
          layer.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    setFilteredSlides(slides)
  }, [slideGroups, searchQuery, selectedSheet])

  // Export single slide
  const handleExportSlide = async (slide: Slide) => {
    try {
      const canvas = await renderSlideToCanvas({ slide, scale: 1 })
      const blob = await new Promise<Blob>(resolve => 
        canvas.toBlob(b => resolve(b!), 'image/png', 1)
      )
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `drafter-slide-${slide.id}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export slide:', error)
    }
  }

  // Randomize slide image
  const handleRandomizeSlide = async (slide: Slide) => {
    if (availableImages.length === 0) return
    
    const rnd = mulberry32(slide.id + '_' + Date.now())
    const randomImage = availableImages[Math.floor(rnd() * availableImages.length)]
    
    const updatedSlide: Slide = {
      ...slide,
      imageRef: {
        kind: 'local',
        localId: randomImage
      },
      _rev: slide._rev + 1,
      updatedAt: Date.now(),
      thumbUrl: null
    }
    
    // Update the slide in the appropriate group
    const updatedGroups = slideGroups.map(group => ({
      ...group,
      slides: group.slides.map(s => s.id === slide.id ? updatedSlide : s)
    }))
    
    onUpdateSlides(updatedGroups)
    updateSlideThumbnail(updatedSlide, 216)
  }

  // Edit slide
  const handleEditSlide = (slide: Slide) => {
    setEditingSlide(slide)
  }

  // Save edited slide
  const handleSaveEditedSlide = (updatedSlide: Slide) => {
    const updatedGroups = slideGroups.map(group => ({
      ...group,
      slides: group.slides.map(s => s.id === updatedSlide.id ? updatedSlide : s)
    }))
    
    onUpdateSlides(updatedGroups)
    setEditingSlide(null)
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingSlide(null)
  }

  // Export all slides grouped by sheet
  const handleExportAllGrouped = async () => {
    try {
      setIsExporting(true)
      setExportProgress({ current: 'Preparing export...', completed: 0, total: slideGroups.length })

      // Group slides by sheet
      const slidesBySheet: Record<string, Slide[]> = {}
      slideGroups.forEach(group => {
        slidesBySheet[group.sheetName] = group.slides
      })

      // Export using ExportManager
      const zipBlob = await exportManager.exportSlidesBySheet(
        slidesBySheet,
        { format: 'png', scale: 1, includeMetadata: true },
        (progress) => {
          setExportProgress({
            current: progress.sheet || 'Exporting...',
            completed: progress.completed,
            total: progress.total
          })
        }
      )

      // Download the ZIP
      exportManager.downloadBlob(zipBlob, 'drafter-multi-sheet-export.zip')
      
    } catch (error) {
      console.error('Failed to export slides:', error)
      alert('Failed to export slides. Please try again.')
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  // Randomize all slides in current view
  const handleRandomizeAll = () => {
    if (availableImages.length === 0) return
    
    const updatedGroups = slideGroups.map(group => ({
      ...group,
      slides: group.slides.map(slide => {
        const rnd = mulberry32(slide.id + '_' + Date.now())
        const randomImage = availableImages[Math.floor(rnd() * availableImages.length)]
        
        return {
          ...slide,
          imageRef: {
            kind: 'local',
            localId: randomImage
          },
          _rev: slide._rev + 1,
          updatedAt: Date.now(),
          thumbUrl: null
        }
      })
    }))
    
    onUpdateSlides(updatedGroups)
    
    // Regenerate all thumbnails
    updatedGroups.forEach(group => {
      group.slides.forEach(slide => {
        updateSlideThumbnail(slide, 216)
      })
    })
  }

  if (editingSlide) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Slides
            </button>
          </div>
          
          <SlideEditorUnified
            slide={editingSlide}
            onSave={handleSaveEditedSlide}
            onCancel={handleCancelEdit}
            availableImages={availableImages}
          />
        </div>
      </div>
    )
  }

  const totalSlides = slideGroups.reduce((sum, group) => sum + group.slides.length, 0)

  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Generated Slides ({totalSlides})
            </h1>
            <p className="text-gray-600 mt-1">
              Review, edit, and export your slides from {slideGroups.length} sheet{slideGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRandomizeAll}
              disabled={availableImages.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Randomize All
            </button>
            <button
              onClick={handleExportAllGrouped}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export All (Grouped)'}
            </button>
          </div>
        </div>

        {/* Export progress */}
        {isExporting && exportProgress && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800">
                Exporting... {exportProgress.completed}/{exportProgress.total}
              </span>
              <span className="text-blue-600">
                {Math.round((exportProgress.completed / exportProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(exportProgress.completed / exportProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-700">
              {exportProgress.current}
            </p>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex items-center space-x-4 mb-6">
          {/* Sheet filter */}
          <div className="flex items-center space-x-2">
            <FolderIcon size="sm" className="text-gray-500" />
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sheets ({totalSlides} slides)</option>
              {slideGroups.map(group => (
                <option key={group.sheetId} value={group.sheetId}>
                  {group.sheetName} ({group.slides.length} slides)
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search slides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View mode */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Slides Grid/List */}
        {filteredSlides.length > 0 ? (
          <SlideGrid
            slides={filteredSlides}
            onExport={handleExportSlide}
            onRandomize={handleRandomizeSlide}
            onEdit={handleEditSlide}
            columns={viewMode === 'grid' ? 4 : 1}
            className={viewMode === 'list' ? 'space-y-4' : ''}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No slides found
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms' : 'No slides in the selected sheet'}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <ChevronLeftIcon size="sm" />
            <span>Back to Settings</span>
          </button>

          <div className="text-sm text-gray-500">
            {filteredSlides.length} of {totalSlides} slides shown
          </div>
        </div>
      </div>
    </div>
  )
}

