// src/components/generate/common/DaySection.tsx
'use client'
import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import type { Slide } from '@/types/slide'
import SlideCard from './SlideCard'

interface DaySectionProps {
  dayKey: string
  slides: Slide[]
  onExportDay: () => void
  onReroll: (slideId: string) => void
  onEdit: (slideId: string) => void
  onToggleSelect: (slideId: string) => void
  selectedSlides: Record<string, boolean>
}

export default function DaySection({
  dayKey,
  slides,
  onExportDay,
  onReroll,
  onEdit,
  onToggleSelect,
  selectedSlides
}: DaySectionProps) {
  const { colors } = useTheme()

  return (
    <article className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium opacity-80" style={{ color: colors.text }}>{dayKey}</h4>
        <div className="flex gap-2">
          <button 
            className="px-2 py-1 rounded text-xs"
            style={{ 
              backgroundColor: colors.surface2, 
              color: colors.text,
              border: `1px solid ${colors.border}`
            }}
            onClick={onExportDay}
          >
            Export day
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {slides.map(slide => (
          <SlideCard
            key={slide.id}
            slide={slide}
            isSelected={selectedSlides[slide.id] || false}
            onToggleSelect={() => onToggleSelect(slide.id)}
            onReroll={() => onReroll(slide.id)}
            onEdit={() => onEdit(slide.id)}
          />
        ))}
      </div>
    </article>
  )
}
