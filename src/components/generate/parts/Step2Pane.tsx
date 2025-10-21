'use client'

import { NumberInput } from '@/components/ui/NumberInput'
import { ImageIcon, ShuffleIcon } from '@/components/ui/Icon'

interface Step2PaneProps {
  colors: any
  fontLoaded: boolean
  getCanvasDimensions: () => { w: number; h: number }
  step2Data: any
  setStep2Data: (fn: (prev: any) => any) => void
  previewCanvas: HTMLCanvasElement | null
  currentImage: string | null
  currentCaption: string
  setCurrentCaption: (caption: string) => void
  handleRandomImage: () => void
  handleRandomCaption: () => void
}

export default function Step2Pane({
  colors,
  fontLoaded,
  getCanvasDimensions,
  step2Data,
  setStep2Data,
  previewCanvas,
  currentImage,
  currentCaption,
  setCurrentCaption,
  handleRandomImage,
  handleRandomCaption
}: Step2PaneProps) {
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
              width: `${getCanvasDimensions().w}px`,
              height: `${getCanvasDimensions().h}px`,
              aspectRatio: step2Data?.safeZoneFormat === '3:4' ? '3/4' : '9/16'
            }}
          >
            {previewCanvas ? (
              <img 
                src={previewCanvas.toDataURL()} 
                alt="Preview" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            ) : currentImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={currentImage} 
                  alt="Preview" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
                {/* Fallback CSS text overlay if canvas rendering fails */}
                {currentCaption && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center px-6 py-8"
                    style={{
                      textAlign: (step2Data?.horizontalAlignment || 'center') as any,
                      // Apply X and Y offset positioning to match canvas rendering
                      // Calculate the same positioning as the desktop app
                      transform: `translate(${((step2Data?.xOffset !== undefined ? step2Data.xOffset : 0) * 0.25)}px, ${((step2Data?.yOffset !== undefined ? step2Data.yOffset : 0) * 0.25)}px) rotate(${step2Data?.textRotation || 0}deg)`
                    }}
                  >
                    <p 
                      className="caption font-bold"
                      style={{ 
                        color: 'white',
                        fontSize: `${(step2Data?.fontSize || 52) * 0.25}px`,
                        textShadow: `0 0 ${(step2Data?.outlinePx || 6) * 0.25}px black, 0 0 ${(step2Data?.outlinePx || 6) * 0.5}px black, 0 0 ${(step2Data?.outlinePx || 6) * 0.25}px black`,
                        lineHeight: `${((step2Data?.fontSize || 52) + (step2Data?.lineSpacing || 12)) * 0.25}px`,
                        fontWeight: step2Data?.fontChoice === 'SemiBold' ? 600 : step2Data?.fontChoice === 'Medium' ? 500 : 400,
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {currentCaption}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon size="md" color={colors.textMuted} />
                  <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                    Click Random Image
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRandomImage}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{ 
                backgroundColor: colors.buttonBg, 
                borderColor: colors.border, 
                color: colors.text 
              }}
            >
              <ShuffleIcon size="sm" className="inline mr-1" />
              Random
            </button>
            <button
              onClick={handleRandomCaption}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{ 
                backgroundColor: colors.buttonBg, 
                borderColor: colors.border, 
                color: colors.text 
              }}
            >
              <ShuffleIcon size="sm" className="inline mr-1" />
              Caption
            </button>
          </div>
        </div>

        {/* Caption Editor */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Caption Text
          </h3>
          <textarea
            value={currentCaption}
            onChange={(e) => setCurrentCaption(e.target.value)}
            placeholder="Enter or generate a caption..."
            rows={8}
            className="w-full h-[calc(100%-2rem)] px-3 py-2 rounded-lg border resize-none text-sm"
            style={{ 
              backgroundColor: colors.surface2, 
              borderColor: colors.border, 
              color: colors.text 
            }}
          />
        </div>

        {/* Compact Settings */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Text Settings
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Font Size
                </label>
                <NumberInput
                  value={step2Data?.fontSize || 52}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, fontSize: value } : null)}
                  min={20}
                  max={120}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Outline
                </label>
                <NumberInput
                  value={step2Data?.outlinePx || 6}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, outlinePx: value } : null)}
                  min={0}
                  max={20}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="font-weight-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                Font Weight
              </label>
              <select
                id="font-weight-select"
                name="fontWeight"
                value={step2Data?.fontChoice || 'Medium'}
                onChange={(e) => setStep2Data(prev => prev ? { ...prev, fontChoice: e.target.value } : null)}
                className="w-full px-2 py-1 rounded-lg border text-sm"
                style={{ 
                  backgroundColor: colors.surface2, 
                  borderColor: colors.border, 
                  color: colors.text 
                }}
              >
                <option value="Medium">Medium</option>
                <option value="SemiBold">SemiBold</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vertical-alignment-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Vertical Alignment
              </label>
              <select
                id="vertical-alignment-select"
                name="verticalAlignment"
                value={step2Data?.verticalAlignment || 'center'}
                onChange={(e) => setStep2Data(prev => prev ? { ...prev, verticalAlignment: e.target.value } : null)}
                className="w-full px-2 py-1 rounded-lg border text-sm"
                style={{ 
                  backgroundColor: colors.surface2, 
                  borderColor: colors.border, 
                  color: colors.text 
                }}
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
              </div>
              <div>
                <label htmlFor="horizontal-alignment-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Horizontal Alignment
                </label>
                <select
                  id="horizontal-alignment-select"
                  name="horizontalAlignment"
                  value={step2Data?.horizontalAlignment || 'center'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, horizontalAlignment: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  X Offset
                </label>
                <NumberInput
                  value={step2Data?.xOffset || 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, xOffset: value } : null)}
                  min={-200}
                  max={200}
                  step={1}
                  suffix="px"
                  style={{
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Y Offset
                </label>
                <NumberInput
                  value={step2Data?.yOffset || 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, yOffset: value } : null)}
                  min={-200}
                  max={200}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Line Spacing
                </label>
                <NumberInput
                  value={step2Data?.lineSpacing || 12}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, lineSpacing: value } : null)}
                  min={0}
                  max={50}
                  step={1}
                  suffix="px"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Text Rotation
                </label>
                <NumberInput
                  value={step2Data?.textRotation || 0}
                  onChange={(value) => setStep2Data(prev => prev ? { ...prev, textRotation: value } : null)}
                  min={-45}
                  max={45}
                  step={1}
                  suffix="°"
                  style={{
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>
            </div>

            {/* Safe Zone Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: colors.text }}>
                Safe Zones
              </h4>
              
              <div className="flex items-center gap-4">
                <label htmlFor="enable-safezone-checkbox" className="flex items-center gap-2">
                  <input
                    id="enable-safezone-checkbox"
                    name="useSafeZone"
                    type="checkbox"
                    checked={step2Data?.useSafeZone ?? true}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, useSafeZone: e.target.checked } : null)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Enable Safe Zone
                  </span>
                </label>
                
                <label htmlFor="show-overlay-checkbox" className="flex items-center gap-2">
                  <input
                    id="show-overlay-checkbox"
                    name="showSafeZoneOverlay"
                    type="checkbox"
                    checked={step2Data?.showSafeZoneOverlay ?? false}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, showSafeZoneOverlay: e.target.checked } : null)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Show Overlay
                  </span>
                </label>
              </div>
              
              <div>
                <label htmlFor="format-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Format
                </label>
                <select
                  id="format-select"
                  name="safeZoneFormat"
                  value={step2Data?.safeZoneFormat || '9:16'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, safeZoneFormat: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="9:16">9:16 (TikTok)</option>
                  <option value="3:4">3:4 (Instagram)</option>
                </select>
              </div>
            </div>

            {/* Background Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: colors.text }}>
                Background
              </h4>
              
              <div>
                <label htmlFor="background-select" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                  Background Type
                </label>
                <select
                  id="background-select"
                  name="backgroundType"
                  value={step2Data?.backgroundType || 'image'}
                  onChange={(e) => setStep2Data(prev => prev ? { ...prev, backgroundType: e.target.value } : null)}
                  className="w-full px-2 py-1 rounded-lg border text-sm"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="image">Image</option>
                  <option value="solid">Solid Color</option>
                </select>
              </div>
              
              {step2Data?.backgroundType === 'solid' && (
                <div>
                  <label htmlFor="background-color" className="block text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                    Background Color
                  </label>
                  <input
                    id="background-color"
                    type="color"
                    value={step2Data?.backgroundColor || '#000000'}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, backgroundColor: e.target.value } : null)}
                    className="w-full h-8 rounded-lg border"
                    style={{ 
                      backgroundColor: colors.surface2, 
                      borderColor: colors.border 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Image Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium" style={{ color: colors.text }}>
                Image
              </h4>
              
              <div className="flex items-center gap-4">
                <label htmlFor="flip-horizontal-checkbox" className="flex items-center gap-2">
                  <input
                    id="flip-horizontal-checkbox"
                    name="flipH"
                    type="checkbox"
                    checked={step2Data?.flipH ?? false}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, flipH: e.target.checked } : null)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Flip Horizontal
                  </span>
                </label>
                
                <label htmlFor="rotate-180-checkbox" className="flex items-center gap-2">
                  <input
                    id="rotate-180-checkbox"
                    name="rotateBg180"
                    type="checkbox"
                    checked={step2Data?.rotateBg180 ?? false}
                    onChange={(e) => setStep2Data(prev => prev ? { ...prev, rotateBg180: e.target.checked } : null)}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    Rotate 180°
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}