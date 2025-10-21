// src/components/VirtualSlideGrid.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { SlideCard } from '@/components/SlideCard'
import type { Slide } from '@/types/slide'

interface VirtualSlideGridProps {
  slides: Slide[]
  onExport?: (slide: Slide) => void
  onRandomize?: (slide: Slide) => void
  onEdit?: (slide: Slide) => void
  className?: string
  itemHeight?: number
  containerHeight?: number
  overscan?: number
}

export function VirtualSlideGrid({
  slides,
  onExport,
  onRandomize,
  onEdit,
  className = '',
  itemHeight = 300,
  containerHeight = 600,
  overscan = 5
}: VirtualSlideGridProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate items per row based on container width
  const itemsPerRow = useMemo(() => {
    if (containerWidth === 0) return 4
    return Math.max(1, Math.floor(containerWidth / 250)) // 250px per item
  }, [containerWidth])
  
  // Calculate total rows
  const totalRows = Math.ceil(slides.length / itemsPerRow)
  const totalHeight = totalRows * itemHeight
  
  // Calculate visible range
  const startRow = Math.floor(scrollTop / itemHeight)
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  )
  
  // Add overscan
  const visibleStartRow = Math.max(0, startRow - overscan)
  const visibleEndRow = Math.min(totalRows - 1, endRow + overscan)
  
  // Get visible slides
  const visibleSlides = useMemo(() => {
    const visible: Array<{ slide: Slide; index: number; row: number; col: number }> = []
    
    for (let row = visibleStartRow; row <= visibleEndRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col
        if (index < slides.length) {
          visible.push({
            slide: slides[index],
            index,
            row,
            col
          })
        }
      }
    }
    
    return visible
  }, [slides, visibleStartRow, visibleEndRow, itemsPerRow])
  
  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }
  
  // Update container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleSlides.map(({ slide, index, row, col }) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: row * itemHeight,
              left: col * (containerWidth / itemsPerRow),
              width: containerWidth / itemsPerRow - 16, // 16px gap
              height: itemHeight - 16
            }}
          >
            <SlideCard
              slide={slide}
              onExport={onExport}
              onRandomize={onRandomize}
              onEdit={onEdit}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

