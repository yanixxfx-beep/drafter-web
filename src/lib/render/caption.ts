import { layoutDesktop } from '@/lib/textLayout'

export type CaptionStyle = {
  fontChoice: string
  fontSize: number
  lineSpacing: number
  yOffset: number
  xOffset: number
  textRotation: number
  outlinePx: number
  outlineColor?: string
  fillColor?: string
  verticalAlignment: 'top' | 'center' | 'bottom'
  horizontalAlignment: 'left' | 'center' | 'right'
  useSafeZone?: boolean
  safeZoneFormat?: '9:16' | '3:4'
}

export function drawCaptionWithStyle(
  ctx: CanvasRenderingContext2D,
  caption: string,
  canvasWidth: number,
  canvasHeight: number,
  style: CaptionStyle,
  format: '9:16' | '3:4' = '9:16'
) {
  if (!caption) return

  const fontWeight =
    style.fontChoice === 'SemiBold'
      ? 600
      : style.fontChoice === 'Medium'
      ? 500
      : 400

  const layout = layoutDesktop(ctx, {
    text: caption,
    fontFamily: 'TikTok Sans',
    fontWeight: fontWeight as 400 | 500 | 600,
    fontPx: style.fontSize,
    lineSpacingPx: style.lineSpacing,
    yOffsetPx: style.yOffset,
    xOffsetPx: style.xOffset,
    align: style.verticalAlignment,
    horizontalAlign: style.horizontalAlignment,
    textRotation: style.textRotation,
    safeMarginPx: 64,
    maxTextWidthPx: canvasWidth - 128,
    deskW: canvasWidth,
    deskH: canvasHeight,
    useSafeZone: style.useSafeZone ?? false,
    safeZoneFormat: format
  })

  const textAlign =
    style.horizontalAlignment === 'left'
      ? 'left'
      : style.horizontalAlignment === 'right'
      ? 'right'
      : 'center'

  ctx.textAlign = textAlign
  ctx.save()
  ctx.translate(layout.centerX, 0)
  ctx.rotate((style.textRotation * Math.PI) / 180)

  layout.lines.forEach((line, idx) => {
    const x = 0
    const y = layout.baselines[idx]

    if ((style.outlinePx || 0) > 0) {
      ctx.strokeStyle = style.outlineColor ?? '#000000'
      ctx.lineWidth = (style.outlinePx || 0) * 2
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.strokeText(line, x, y)
    }

    ctx.fillStyle = style.fillColor ?? '#FFFFFF'
    ctx.fillText(line, x, y)
  })

  ctx.restore()
}
