// src/components/pages/Step3Page.tsx
import React, { useState, useEffect } from 'react'
import { SlideGrid } from '@/components/SlideGrid'
import { SlideEditorUnified } from '@/components/SlideEditorUnified'
import { useThumbnails } from '@/hooks/useThumbnails'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { mulberry32 } from '@/lib/rand'
import type { Slide } from '@/types/slide'

interface Step3PageProps {
  slides: Slide[]
  availableImages: string[]
  onUpdateSlides: (slides: Slide[]) => void
  onExportAll: () => void
  className?: string
}

export function Step3Page({ 
  slides, 
  availableImages, 
  onUpdateSlides, 
  onExportAll,
  className = ''
}: Step3PageProps) {
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSlides, setFilteredSlides] = useState<Slide[]>(slides)
  
  const { generateThumbnails, updateSlideThumbnail } = useThumbnails()
  
  // Generate thumbnails when slides change
  useEffect(() => {
    if (slides.length > 0) {
      generateThumbnails(slides, 216)
    }
  }, [slides, generateThumbnails])
  
  // Filter slides based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSlides(slides)
    } else {
      const filtered = slides.filter(slide => 
        slide.textLayers.some(layer => 
          layer.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      setFilteredSlides(filtered)
    }
  }, [slides, searchQuery])
  
  // Handle slide export
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
  
  // Handle slide randomization
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
    
    // Update the slide in the list
    const updatedSlides = slides.map(s => s.id === slide.id ? updatedSlide : s)
    onUpdateSlides(updatedSlides)
    
    // Regenerate thumbnail
    updateSlideThumbnail(updatedSlide, 216)
  }
  
  // Handle slide edit
  const handleEditSlide = (slide: Slide) => {
    setEditingSlide(slide)
  }
  
  // Handle save edited slide
  const handleSaveEditedSlide = (updatedSlide: Slide) => {
    const updatedSlides = slides.map(s => s.id === updatedSlide.id ? updatedSlide : s)
    onUpdateSlides(updatedSlides)
    setEditingSlide(null)
  }
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingSlide(null)
  }
  
  // Batch randomize all slides
  const handleRandomizeAll = () => {
    if (availableImages.length === 0) return
    
    const updatedSlides = slides.map(slide => {
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
    
    onUpdateSlides(updatedSlides)
    
    // Regenerate all thumbnails
    updatedSlides.forEach(slide => {
      updateSlideThumbnail(slide, 216)
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
  
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Generated Slides ({filteredSlides.length})
            </h1>
            <p className="text-gray-600 mt-1">
              Review, edit, and export your slides
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
              onClick={onExportAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export All
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search slides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
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
              {searchQuery ? 'Try adjusting your search terms' : 'Generate some slides to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

