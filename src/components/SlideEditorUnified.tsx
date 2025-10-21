// src/components/SlideEditorUnified.tsx
import React, { useState, useCallback, useMemo } from 'react'
import { useCanvasRender } from '@/hooks/useCanvasRender'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { mulberry32 } from '@/lib/rand'
import type { Slide, TextLayer } from '@/types/slide'

interface SlideEditorUnifiedProps {
  slide: Slide
  onSave: (updatedSlide: Slide) => void
  onCancel: () => void
  availableImages?: string[] // URLs of available images
  className?: string
}

export function SlideEditorUnified({ 
  slide, 
  onSave, 
  onCancel, 
  availableImages = [],
  className = ''
}: SlideEditorUnifiedProps) {
  const [editingSlide, setEditingSlide] = useState<Slide>(slide)
  const [isSaving, setIsSaving] = useState(false)
  
  // Canvas ref for the editor
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  
  // Update slide text
  const updateText = useCallback((text: string) => {
    setEditingSlide(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(layer => 
        layer.kind === 'title' ? { ...layer, text } : layer
      )
    }))
  }, [])
  
  // Update slide image
  const updateImage = useCallback((imageUrl: string) => {
    setEditingSlide(prev => ({
      ...prev,
      imageRef: {
        kind: 'local',
        localId: imageUrl
      }
    }))
  }, [])
  
  // Randomize image
  const randomizeImage = useCallback(() => {
    if (availableImages.length === 0) return
    
    const rnd = mulberry32(slide.id + '_' + Date.now())
    const randomImage = availableImages[Math.floor(rnd() * availableImages.length)]
    updateImage(randomImage)
  }, [availableImages, slide.id, updateImage])
  
  // Save changes
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Generate new thumbnail
      const canvas = await renderSlideToCanvas({ slide: editingSlide, scale: 0.25 })
      const blob = await new Promise<Blob>(resolve => 
        canvas.toBlob(b => resolve(b!), 'image/png', 0.92)
      )
      const thumbUrl = URL.createObjectURL(blob)
      
      const updatedSlide: Slide = {
        ...editingSlide,
        _rev: editingSlide._rev + 1,
        updatedAt: Date.now(),
        thumbUrl
      }
      
      onSave(updatedSlide)
    } catch (error) {
      console.error('Failed to save slide:', error)
    } finally {
      setIsSaving(false)
    }
  }, [editingSlide, onSave])
  
  // Draw function for the canvas
  const drawSlide = useCallback(async (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => {
    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)
    
    // Draw background image
    if (editingSlide.imageRef.localId) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = editingSlide.imageRef.localId
        })
        
        // Draw image to cover the canvas
        ctx.drawImage(img, 0, 0, w, h)
      } catch (error) {
        console.warn('Failed to load image:', error)
      }
    }
    
    // Draw text layers
    for (const layer of editingSlide.textLayers) {
      if (!layer.text.trim()) continue
      
      const fontSize = layer.size
      const lineHeight = layer.lineHeight
      
      ctx.save()
      ctx.font = `${fontSize}px ${layer.font}`
      ctx.fillStyle = layer.color
      ctx.textAlign = layer.align
      ctx.textBaseline = 'alphabetic'
      
      if (layer.stroke) {
        ctx.lineWidth = layer.stroke.width
        ctx.strokeStyle = layer.stroke.color
      }
      
      // Simple text wrapping
      const words = layer.text.split(' ')
      const lines: string[] = []
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > layer.w && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)
      
      // Calculate starting position
      const totalHeight = lines.length * lineHeight
      const startY = layer.y + (layer.h - totalHeight) / 2
      
      // Draw each line
      for (let i = 0; i < lines.length; i++) {
        const x = layer.x + layer.w / 2
        const y = startY + (i + 1) * lineHeight
        
        if (layer.stroke) ctx.strokeText(lines[i], x, y)
        ctx.fillText(lines[i], x, y)
      }
      
      ctx.restore()
    }
  }, [editingSlide])
  
  // Canvas size based on slide format
  const canvasSize = useMemo(() => {
    const { w, h } = editingSlide.exportSize
    const maxWidth = 400
    const maxHeight = 600
    
    const scale = Math.min(maxWidth / w, maxHeight / h)
    return {
      width: Math.round(w * scale),
      height: Math.round(h * scale)
    }
  }, [editingSlide.exportSize])
  
  // Use the centralized canvas render hook
  useCanvasRender({
    canvasRef,
    cssWidth: canvasSize.width,
    cssHeight: canvasSize.height,
    draw: drawSlide
  })
  
  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Canvas Preview */}
      <div className="flex justify-center">
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block"
            style={{ width: canvasSize.width, height: canvasSize.height }}
          />
        </div>
      </div>
      
      {/* Text Editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Text
        </label>
        <textarea
          value={editingSlide.textLayers[0]?.text || ''}
          onChange={(e) => updateText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter slide text..."
        />
      </div>
      
      {/* Image Selection */}
      {availableImages.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Background Image
          </label>
          <div className="flex space-x-2">
            <select
              value={editingSlide.imageRef.localId || ''}
              onChange={(e) => updateImage(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an image...</option>
              {availableImages.map((url, index) => (
                <option key={index} value={url}>
                  Image {index + 1}
                </option>
              ))}
            </select>
            <button
              onClick={randomizeImage}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Random
            </button>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

