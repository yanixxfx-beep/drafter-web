// src/components/generate/common/SlideEditorCanvas.tsx
'use client'
import React, { useRef, useEffect } from 'react'
import { renderSlideToCanvas, type Slide } from '@/lib/render/SlideRenderer'

interface SlideEditorCanvasProps {
  slide: Slide
  cssSize: { width: number; height: number }
  exportSize: { width: number; height: number }
  dpr?: number
  className?: string
}

export default function SlideEditorCanvas({ 
  slide, 
  cssSize, 
  exportSize, 
  dpr = 1,
  className 
}: SlideEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const render = async () => {
      try {
        const renderedCanvas = await renderSlideToCanvas({
          slide,
          scale: cssSize.width / exportSize.width,
          dpr
        })
        
        const ctx = canvas.getContext('2d')!
        canvas.width = cssSize.width * dpr
        canvas.height = cssSize.height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, cssSize.width, cssSize.height)
        ctx.drawImage(renderedCanvas, 0, 0, cssSize.width, cssSize.height)
      } catch (error) {
        console.error('Failed to render slide:', error)
      }
    }

    render()
  }, [slide, cssSize, exportSize, dpr])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: cssSize.width,
        height: cssSize.height,
      }}
    />
  )
}
