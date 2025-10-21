// src/components/generate/common/SlideCard.tsx
'use client'
import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import type { Slide } from '@/types/slide'

interface SlideCardProps {
  slide: Slide
  isSelected: boolean
  onToggleSelect: () => void
  onReroll: () => void
  onEdit: () => void
}

export default function SlideCard({
  slide,
  isSelected,
  onToggleSelect,
  onReroll,
  onEdit
}: SlideCardProps) {
  const { colors } = useTheme()

  return (
    <figure 
      className={`border rounded p-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{ 
        borderColor: isSelected ? colors.accent : colors.border,
        backgroundColor: colors.surface2
      }}
    >
      <img 
        src={slide.thumbUrl ?? ''} 
        alt="thumb" 
        className="w-full aspect-[9/16] object-cover rounded"
      />
      <div className="flex justify-between mt-2">
        <label className="inline-flex items-center gap-2 text-xs">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={onToggleSelect}
            style={{ accentColor: colors.accent }}
          /> 
          Select
        </label>
        <div className="flex gap-2">
          <button 
            className="px-2 py-1 rounded text-xs"
            style={{ 
              backgroundColor: colors.surface, 
              color: colors.text,
              border: `1px solid ${colors.border}`
            }}
            onClick={onReroll}
          >
            Re‑roll
          </button>
          <button 
            className="px-2 py-1 rounded text-xs"
            style={{ 
              backgroundColor: colors.surface, 
              color: colors.text,
              border: `1px solid ${colors.border}`
            }}
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
      </div>
    </figure>
  )
}
