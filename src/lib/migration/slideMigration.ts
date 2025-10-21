// src/lib/migration/slideMigration.ts
import type { Slide, TextLayer, ImageRef } from '@/types/slide'

// Current slide format from GeneratePage
interface CurrentSlide {
  id: string
  caption: string
  image: string
  thumbnail: string | null
  createdAt: Date
  slideNumber: number
  imageSource: 'affiliate' | 'ai-method'
  format?: '9:16' | '3:4'
  lastModified?: number
}

// Convert current slide format to new Slide format
export function migrateSlideToNewFormat(
  currentSlide: CurrentSlide,
  step2Data: any
): Slide {
  // Determine export size based on format
  const exportSize = currentSlide.format === '3:4' 
    ? { w: 1080, h: 1440 }
    : { w: 1080, h: 1920 }

  // Create image reference
  const imageRef: ImageRef = {
    kind: 'local',
    localId: currentSlide.image
  }

  // Create text layer from caption
  const textLayer: TextLayer = {
    id: `${currentSlide.id}_text`,
    kind: 'title',
    text: currentSlide.caption,
    x: 0,
    y: 0,
    w: exportSize.w,
    h: exportSize.h,
    align: 'center',
    font: 'TikTok Sans',
    size: step2Data?.fontSize || 52,
    lineHeight: step2Data?.lineSpacing || 12,
    color: '#ffffff',
    stroke: step2Data?.outlinePx ? {
      color: '#000000',
      width: step2Data.outlinePx
    } : undefined
  }

  return {
    id: currentSlide.id,
    seed: `${currentSlide.id}_${currentSlide.lastModified || Date.now()}`,
    _rev: 1,
    updatedAt: currentSlide.lastModified || Date.now(),
    exportSize,
    imageRef,
    textLayers: [textLayer],
    templateId: undefined,
    watermark: undefined,
    thumbUrl: currentSlide.thumbnail
  }
}

// Convert new Slide format back to current format for compatibility
export function migrateSlideToCurrentFormat(slide: Slide): CurrentSlide {
  return {
    id: slide.id,
    caption: slide.textLayers[0]?.text || '',
    image: slide.imageRef.kind === 'local' ? slide.imageRef.localId || '' : '',
    thumbnail: slide.thumbUrl,
    createdAt: new Date(slide.updatedAt),
    slideNumber: parseInt(slide.id.split('_').pop() || '1'),
    imageSource: 'affiliate', // Default, can be determined by position
    format: slide.exportSize.h === 1440 ? '3:4' : '9:16',
    lastModified: slide.updatedAt
  }
}

