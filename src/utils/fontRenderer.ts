// Font rendering utility - matches Drafter MVP's PIL font rendering
// This creates the exact same text rendering as the desktop app

import { ensureTikTokFont, getCachedFontMetrics, clearMetricsCache } from './ensureFont'

export interface FontStyle {
  fontChoice: 'Regular' | 'Medium' | 'SemiBold'
  fontSize: number
  outlinePx: number
  lineSpacing: number
  verticalAlignment?: 'top' | 'center' | 'bottom'
  yOffset: number
  autoFit: boolean
  fillColor: string
  outlineColor: string
}

export interface TextMetrics {
  width: number
  height: number
  lineHeight: number
}

export class FontRenderer {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private fontCache: Map<string, FontFace> = new Map()
  private diskOffsetsCache: Map<number, Array<[number, number]>> = new Map()

  constructor() {
    // Only initialize canvas on client side
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')!
    }
  }

  // Generate circular outline offsets (cached for performance)
  private makeDiskOffsets(r: number): Array<[number, number]> {
    if (this.diskOffsetsCache.has(r)) {
      return this.diskOffsetsCache.get(r)!
    }

    const pts: Array<[number, number]> = []
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x*x + y*y <= r*r) pts.push([x, y])
      }
    }
    const sortedPts = pts.sort((a,b) => (a[0]**2 + a[1]**2) - (b[0]**2 + b[1]**2))
    this.diskOffsetsCache.set(r, sortedPts)
    return sortedPts
  }

  // Load TikTok Sans font (matches desktop app font loading)
  async loadTikTokFont(weight: 'Regular' | 'Medium' | 'SemiBold'): Promise<boolean> {
    // Only work on client side
    if (typeof window === 'undefined') {
      return false
    }

    const fontWeight = weight === 'SemiBold' ? 600 : weight === 'Medium' ? 500 : 400
    
    try {
      // Use the robust font loading utility
      const loaded = await ensureTikTokFont(fontWeight, 52)
      
      if (loaded) {
        this.fontCache.set(weight, new FontFace('TikTok Sans', 'local("TikTok Sans")'))
        return true
      }
      
      return false
    } catch (error) {
      console.warn(`Failed to load TikTok Sans ${weight}:`, error)
      return false
    }
  }

  // Measure text (matches desktop app's _measure_line_w)
  measureText(text: string, fontSize: number, fontChoice: 'Regular' | 'Medium' | 'SemiBold'): number {
    if (!this.ctx) return 0
    const weight = fontChoice === 'SemiBold' ? 600 : fontChoice === 'Medium' ? 500 : 400
    const metrics = getCachedFontMetrics(this.ctx, text, fontSize, weight)
    return metrics.width
  }

  // Calculate text block size (matches desktop app's _text_block_size)
  calculateTextBlockSize(
    lines: string[], 
    fontSize: number, 
    fontChoice: 'Regular' | 'Medium' | 'SemiBold',
    lineSpacing: number
  ): TextMetrics {
    if (!this.ctx) return { width: 0, height: 0, lineHeight: 0 }
    
    const weight = fontChoice === 'SemiBold' ? 600 : fontChoice === 'Medium' ? 500 : 400
    
    // Get actual font metrics like desktop app (asc + desc) with caching
    const metrics = getCachedFontMetrics(this.ctx, 'Ag', fontSize, weight)
    const lineHeight = metrics.lineHeight
    
    const width = Math.max(...lines.map(line => this.measureText(line, fontSize, fontChoice)))
    // Full block height includes spacing only BETWEEN lines
    const height = lines.length * lineHeight + Math.max(0, lines.length - 1) * lineSpacing
    
    return { width, height, lineHeight }
  }

  // Wrap text respecting manual line breaks (matches desktop app's text wrapping)
  wrapTextRespectingNewlines(text: string, maxWidth: number, fontSize: number, fontChoice: 'Regular' | 'Medium' | 'SemiBold'): string[] {
    if (!this.ctx) return [text] // Fallback to single line
    
    // Split by manual line breaks first
    const paragraphs = text.split('\n')
    const lines: string[] = []

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('') // Preserve empty lines
        continue
      }

      // Use grapheme cluster segmentation for proper emoji/Unicode handling
      const tokens = this.segmentText(paragraph)
      let currentLine = ''

      for (const token of tokens) {
        const testLine = currentLine ? `${currentLine}${token}` : token
        const testWidth = this.measureText(testLine, fontSize, fontChoice)
        
        if (testWidth <= maxWidth) {
          currentLine = testLine
        } else {
          if (currentLine) {
            lines.push(currentLine)
            currentLine = token
          } else {
            lines.push(token) // Single token too long
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
    }
    
    return lines
  }

  // Segment text into grapheme clusters for proper Unicode handling
  private segmentText(text: string): string[] {
    // Check if Intl.Segmenter is available (modern browsers)
    if ('Segmenter' in Intl) {
      try {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        return Array.from(segmenter.segment(text), s => s.segment)
      } catch (error) {
        console.warn('Intl.Segmenter failed, falling back to word splitting:', error)
      }
    }
    
    // Fallback to word splitting for older browsers
    return text.split(/(\s+)/)
  }

  // Render text with outline (matches desktop app's text rendering)
  renderText(
    imageCanvas: HTMLCanvasElement,
    text: string,
    style: FontStyle,
    centerX: number,
    centerY: number
  ): void {
    if (!this.ctx) return // Skip if not on client side
    
    const ctx = imageCanvas.getContext('2d')!
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Scale SAFE_MARGIN based on canvas size (desktop uses 1080x1920, web preview uses 270x480)
    // For DPR-scaled canvases, use the CSS dimensions for positioning calculations
    // Since we're using setTransform, all coordinates are in CSS pixels
    const dpr = window.devicePixelRatio || 1
    const canvasWidth = imageCanvas.width / dpr
    const canvasHeight = imageCanvas.height / dpr
    
    // SCALE must use CSS width, NOT canvas.width (which includes DPR)
    const SCALE = canvasWidth / 1080
    const SAFE_MARGIN = 64 * SCALE // Scale the margin proportionally
    const DEFAULT_Y_OFFSET = 0 * SCALE // Scale the default Y offset proportionally
    const maxWidth = canvasWidth - SAFE_MARGIN * 2
    
    // Wrap text respecting manual line breaks
    let lines = this.wrapTextRespectingNewlines(text, maxWidth, style.fontSize, style.fontChoice)
    
    // Auto-fit with binary search (more efficient than linear search)
    if (style.autoFit) {
      const minFontSize = 10
      const maxFontSize = style.fontSize
      let bestFontSize = minFontSize
      let bestLines = this.wrapTextRespectingNewlines(text, maxWidth, minFontSize, style.fontChoice)
      
      // Binary search for optimal font size
      let left = minFontSize
      let right = maxFontSize
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const testLines = this.wrapTextRespectingNewlines(text, maxWidth, mid, style.fontChoice)
        const maxLineWidth = Math.max(...testLines.map(line => this.measureText(line, mid, style.fontChoice)))
        
        if (maxLineWidth <= maxWidth) {
          bestFontSize = mid
          bestLines = testLines
          left = mid + 1
        } else {
          right = mid - 1
        }
      }
      
      lines = bestLines
      style.fontSize = bestFontSize
    }
    
    // Calculate text block size
    const metrics = this.calculateTextBlockSize(lines, style.fontSize, style.fontChoice, style.lineSpacing)
    
    // Calculate position using desktop app's compute_y_from_alignment logic
    const imgHeight = canvasHeight
    const blockHeight = metrics.height
    const align = style.verticalAlignment || 'center'
    
    let baseY: number
    if (align === 'top') {
      baseY = SAFE_MARGIN
    } else if (align === 'bottom') {
      baseY = imgHeight - SAFE_MARGIN - blockHeight
    } else { // 'center'
      baseY = (imgHeight - blockHeight) / 2
    }
    
    // Use default Y offset if none provided (matches desktop app behavior)
    // yOffset: positive moves down in Canvas; multiply by SCALE
    const yOffset = style.yOffset !== undefined ? style.yOffset * SCALE : DEFAULT_Y_OFFSET
    const textBlockTop = baseY + yOffset
    
    // Clamp to safe margins (matches desktop app's max/min logic)
    const clampedTop = Math.max(SAFE_MARGIN, Math.min(imgHeight - SAFE_MARGIN - blockHeight, textBlockTop))
    
    // Debug logging
    console.log('Font Renderer Debug:', {
      canvasWidth,
      canvasHeight,
      SCALE,
      SAFE_MARGIN,
      blockHeight,
      baseY,
      yOffset: style.yOffset,
      yOffsetScaled: yOffset,
      textBlockTop,
      clampedTop,
      fontSize: style.fontSize
    })
    
    // Use the provided centerX for horizontal centering (always use canvas center)
    const actualCenterX = canvasWidth / 2
    
    // Set font with correct weight
    const weight = style.fontChoice === 'SemiBold' ? '600' : style.fontChoice === 'Medium' ? '500' : '400'
    ctx.font = `${weight} ${style.fontSize}px "TikTok Sans", sans-serif`
    ctx.textAlign = 'center' // Center each line
    ctx.textBaseline = 'alphabetic' // Use alphabetic baseline like PIL
    
    // Render each line with outline (matches desktop app exactly)
    lines.forEach((line, index) => {
      // Calculate Y position for each line - matches desktop app: top_y + i * (line_h + spacing)
      // PIL positions text with y being the TOP of the text, but canvas positions with y being the BASELINE
      // So we need to add the ascent to convert from PIL top positioning to canvas baseline positioning
      const lineTopY = clampedTop + index * (metrics.lineHeight + style.lineSpacing)
      
      // Get the actual ascent for this line using cached metrics
      const lineWeight = style.fontChoice === 'SemiBold' ? 600 : style.fontChoice === 'Medium' ? 500 : 400
      const lineMetrics = getCachedFontMetrics(this.ctx!, line, style.fontSize, lineWeight)
      const lineY = lineTopY + lineMetrics.ascent
      
      // Draw circular outline using disk offsets (professional quality)
      if (style.outlinePx > 0) {
        const r = Math.round(style.outlinePx)
        const offsets = this.makeDiskOffsets(r)
        
        ctx.fillStyle = style.outlineColor
        for (const [dx, dy] of offsets) {
          ctx.fillText(line, actualCenterX + dx, lineY + dy)
        }
      }
      
      // Draw fill
      ctx.fillStyle = style.fillColor
      ctx.fillText(line, actualCenterX, lineY)
    })
  }

  // Check if TikTok Sans is loaded
  isTikTokSansLoaded(): boolean {
    if (typeof window === 'undefined') return false
    return document.fonts.check('500 16px "TikTok Sans"') || 
           document.fonts.check('600 16px "TikTok Sans"')
  }

  // Cleanup method for memory management
  cleanup(): void {
    clearMetricsCache()
    this.fontCache.clear()
    this.diskOffsetsCache.clear()
  }
}

// Singleton instance
export const fontRenderer = new FontRenderer()
