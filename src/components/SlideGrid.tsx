// src/components/SlideGrid.tsx
import React from 'react'
import { SlideCard } from '@/components/SlideCard'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { mulberry32 } from '@/lib/rand'
import type { Slide } from '@/types/slide'

interface SlideGridProps {
  slides: Slide[]
  onExport?: (slide: Slide) => void
  onRandomize?: (slide: Slide) => void
  onEdit?: (slide: Slide) => void
  className?: string
  columns?: number
}

export function SlideGrid({ 
  slides, 
  onExport, 
  onRandomize, 
  onEdit, 
  className = '',
  columns = 4 
}: SlideGridProps) {
  // Export single slide
  const handleExport = async (slide: Slide) => {
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
  const handleRandomize = async (slide: Slide) => {
    // This would need access to available images
    // For now, just update the slide with a new seed
    const updatedSlide: Slide = {
      ...slide,
      seed: slide.id + '_' + Date.now(),
      _rev: slide._rev + 1,
      updatedAt: Date.now(),
      thumbUrl: null // Will be regenerated
    }
    
    if (onRandomize) {
      onRandomize(updatedSlide)
    }
  }
  
  // Edit slide
  const handleEdit = (slide: Slide) => {
    if (onEdit) {
      onEdit(slide)
    }
  }
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }
  
  return (
    <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || 'grid-cols-4'} ${className}`}>
      {slides.map((slide) => (
        <SlideCard
          key={slide.id}
          slide={slide}
          onExport={onExport || handleExport}
          onRandomize={onRandomize || handleRandomize}
          onEdit={onEdit || handleEdit}
        />
      ))}
    </div>
  )
}
