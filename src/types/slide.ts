export type ImageRef = { 
  kind: 'local'|'cloud'
  localId?: string
  bucket?: 'user'|'system'
  key?: string
  source?: 'affiliate'|'ai'
  seed?: string
}

export type TextLayer = {
  id: string
  kind: 'title'|'subtitle'|'cta'
  text: string
  x: number
  y: number
  w: number
  h: number
  align: CanvasTextAlign
  font: string
  size: number
  lineHeight: number
  color: string
  stroke?: { color: string; width: number }
}

export type Slide = {
  id: string
  seed: string
  _rev: number
  updatedAt: number
  exportSize: { w: number; h: number }
  imageRef: ImageRef
  textLayers: TextLayer[]
  templateId?: string
  watermark?: { text?: string; img?: ImageRef }
  // NEW for thumbs
  thumbUrl?: string | null
  lastModified?: number
  // Style overrides
  styleOverride?: {
    fontSize?: number
    lineSpacing?: number
    yOffset?: number
    xOffset?: number
    textRotation?: number
    fontChoice?: 'Regular'|'SemiBold'
    outlinePx?: number
  }
  // Background transformations
  rotateBg180?: boolean
  flipH?: boolean
  // Caption for editor
  caption?: string
}