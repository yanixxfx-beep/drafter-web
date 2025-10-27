'use client'

import { useCallback, useMemo } from 'react'
import SlideEditorCanvas from '@/components/SlideEditorCanvas'
import { NumberInput } from '@/components/ui/NumberInput'
import { ImageIcon, ShuffleIcon } from '@/components/ui/Icon'
import { loadSafeZone, drawSafeZoneOverlay } from '@/utils/safeZones'

interface Step2PaneProps {
  colors: any
  fontLoaded: boolean
  getCanvasDimensions: () => { w: number; h: number }
  step2Data: any
  setStep2Data: (fn: (prev: any) => any) => void
  currentImage: string | null
  currentCaption: string
  setCurrentCaption: (caption: string) => void
  handleRandomImage: () => void
  handleRandomCaption: () => void
  drawCaption: (
    ctx: CanvasRenderingContext2D,
    caption: string,
    canvasWidth: number,
    canvasHeight: number,
    format?: '9:16' | '3:4'
  ) => void
}

export default function Step2Pane({
  colors,
  fontLoaded,
  getCanvasDimensions,
  step2Data,
  setStep2Data,
  currentImage,
  currentCaption,
  setCurrentCaption,
  handleRandomImage,
  handleRandomCaption,
  drawCaption
}: Step2PaneProps) {
  if (!step2Data) {
    return null
  }

  const format = (step2Data?.safeZoneFormat || '9:16') as '9:16' | '3:4'
  const exportSize = useMemo(
    () =>
      format === '3:4'
        ? { width: 1080, height: 1440 }
        : { width: 1080, height: 1920 },
    [format]
  )

  const cssSize = useMemo(() => getCanvasDimensions(), [getCanvasDimensions, format])

  const imageTransform = useMemo(
    () => ({
      rotate180: step2Data?.rotateBg180 ?? false,
      flipHorizontal: step2Data?.flipH ?? false
    }),
    [step2Data?.rotateBg180, step2Data?.flipH]
  )

  const backgroundColor =
    step2Data?.backgroundType === 'solid' ? step2Data?.backgroundColor || '#000000' : '#000000'

  const drawOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, cssW: number, cssH: number, _dpr: number) => {
      if (currentCaption) {
        drawCaption(ctx, currentCaption, cssW, cssH, format)
      }

      if (step2Data?.showSafeZoneOverlay && step2Data?.useSafeZone) {
        const safeZone = loadSafeZone(format)
        if (safeZone) {
          const scaleX = cssW / safeZone.canvas[0]
          const scaleY = cssH / safeZone.canvas[1]
          ctx.save()
          ctx.scale(scaleX, scaleY)
          drawSafeZoneOverlay(ctx, safeZone, true)
          ctx.restore()
        }
      }
    },
    [
      currentCaption,
      drawCaption,
      format,
      step2Data?.showSafeZoneOverlay,
      step2Data?.useSafeZone
    ]
  )

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
          Step 2: Preview & Customize Text
        </h2>
        <p className="text-xs" style={{ color: colors.textMuted }}>
          Edit caption, customize text style, and preview how it will look
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compact Preview */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: colors.text }}>
              Preview
            </h3>
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
              <div className={`w-2 h-2 rounded-full ${fontLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>{fontLoaded ? 'TikTok Sans' : 'System Font'}</span>
            </div>
          </div>

          <div
            className="rounded-lg border mb-3 relative overflow-hidden"
            style={{
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              width: `${cssSize.w}px`,
              height: `${cssSize.h}px`,
              aspectRatio: format === '3:4' ? '3/4' : '9/16'
            }}
          >
            <SlideEditorCanvas
              src={currentImage || undefined}
              bgColor={backgroundColor}
              cssSize={{ width: cssSize.w, height: cssSize.h }}
              exportSize={exportSize}
              imageTransform={imageTransform}
              drawOverlay={drawOverlay}
              className="absolute inset-0"
            />
            {!currentImage && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                style={{ color: colors.textMuted }}
              >
                <ImageIcon size="lg" />
                <p className="mt-2 text-xs">
                  Upload or select an image to preview your caption
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="caption-input" className="block text-xs font-medium" style={{ color: colors.textMuted }}>
              Caption Text
            </label>
            <textarea
              id="caption-input"
              value={currentCaption}
              onChange={(e) => setCurrentCaption(e.target.value)}
              className="w-full h-32 rounded-lg border px-3 py-2 text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2"
              style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
            />
            <div className="flex items-center justify-between text-xs" style={{ color: colors.textMuted }}>
              <span>{currentCaption.length} characters</span>
              <button
                onClick={handleRandomCaption}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: colors.accent }}
              >
                <ShuffleIcon size="sm" />
                Random Caption
              </button>
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={handleRandomImage}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
            >
              <ImageIcon size="sm" />
              Random Image
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className="p-4 rounded-lg border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="font-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Font Weight
                </label>
                <select
                  id="font-select"
                  name="fontChoice"
                  value={step2Data?.fontChoice || 'Medium'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, fontChoice: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
                >
                  <option value="Regular">Regular</option>
                  <option value="Medium">Medium</option>
                  <option value="SemiBold">Semi Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Font Size</label>
                <NumberInput
                  min={16}
                  max={120}
                  step={1}
                  value={step2Data?.fontSize || 52}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, fontSize: value } : null)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Outline Width</label>
                <NumberInput
                  min={0}
                  max={20}
                  step={1}
                  value={step2Data?.outlinePx || 6}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, outlinePx: value } : null)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Line Spacing</label>
                <NumberInput
                  min={0}
                  max={60}
                  step={1}
                  value={step2Data?.lineSpacing || 12}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, lineSpacing: value } : null)}
                />
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border space-y-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Vertical Alignment</label>
                <select
                  value={step2Data?.verticalAlignment || 'center'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, verticalAlignment: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Horizontal Alignment</label>
                <select
                  value={step2Data?.horizontalAlignment || 'center'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, horizontalAlignment: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Y Offset (px)</label>
                <NumberInput
                  min={-500}
                  max={500}
                  step={1}
                  value={step2Data?.yOffset ?? -100}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, yOffset: value } : null)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>X Offset (px)</label>
                <NumberInput
                  min={-500}
                  max={500}
                  step={1}
                  value={step2Data?.xOffset ?? 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, xOffset: value } : null)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Text Rotation (°)</label>
                <NumberInput
                  min={-180}
                  max={180}
                  step={1}
                  value={step2Data?.textRotation ?? 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, textRotation: value } : null)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                <input
                  type="checkbox"
                  checked={step2Data?.autoFit ?? true}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, autoFit: e.target.checked } : null)}
                  className="rounded"
                  style={{ accentColor: colors.accent }}
                />
                Auto-fit Text
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                <input
                  type="checkbox"
                  checked={step2Data?.useSafeZone ?? false}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, useSafeZone: e.target.checked } : null)}
                  className="rounded"
                  style={{ accentColor: colors.accent }}
                />
                Use Safe Zone
              </label>

              {step2Data?.useSafeZone && (
                <div className="ml-6">
                  <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Safe Zone Format</label>
                  <select
                    value={format}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, safeZoneFormat: e.target.value } : null)}
                    className="w-full px-2 py-1 rounded-lg border text-sm"
                    style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
                  >
                    <option value="9:16">9:16</option>
                    <option value="3:4">3:4</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                <input
                  type="checkbox"
                  checked={step2Data?.showSafeZoneOverlay ?? false}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, showSafeZoneOverlay: e.target.checked } : null)}
                  className="rounded"
                  style={{ accentColor: colors.accent }}
                />
                Show Safe Zone Overlay
              </label>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border space-y-4"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
              Background & Image
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Background Type
                </label>
                <select
                  value={step2Data?.backgroundType || 'image'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, backgroundType: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ backgroundColor: colors.surface2, borderColor: colors.border, color: colors.text }}
                >
                  <option value="image">Image</option>
                  <option value="solid">Solid Color</option>
                </select>
              </div>

              {step2Data?.backgroundType === 'solid' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={step2Data?.backgroundColor || '#000000'}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, backgroundColor: e.target.value } : null)}
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: colors.surface2, borderColor: colors.border }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                <input
                  type="checkbox"
                  checked={step2Data?.flipH ?? false}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, flipH: e.target.checked } : null)}
                  className="rounded"
                  style={{ accentColor: colors.accent }}
                />
                Flip Horizontal
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: colors.text }}>
                <input
                  type="checkbox"
                  checked={step2Data?.rotateBg180 ?? false}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, rotateBg180: e.target.checked } : null)}
                  className="rounded"
                  style={{ accentColor: colors.accent }}
                />
                Rotate 180°
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
