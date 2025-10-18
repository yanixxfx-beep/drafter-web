'use client'

import { useState, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { UploadIcon, ShuffleIcon, ImageIcon, TextIcon, PaletteIcon, PositionIcon } from '@/components/ui/Icon'

interface TextSettings {
  fontSize: number
  fontFamily: string
  fontWeight: string
  textColor: string
  outlineWidth: number
  outlineColor: string
  lineSpacing: number
  textAlign: string
  positionX: number
  positionY: number
  rotation: number
}

const fontFamilies = [
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
  'Verdana', 'Tahoma', 'Comic Sans MS', 'Impact', 'Trebuchet MS'
]

const fontWeights = ['300', '400', '500', '600', '700', '800', '900']

export function EnhancedGeneratePage() {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState('text')
  const [settings, setSettings] = useState<TextSettings>({
    fontSize: 48,
    fontFamily: 'Inter',
    fontWeight: '600',
    textColor: '#FFFFFF',
    outlineWidth: 2,
    outlineColor: '#000000',
    lineSpacing: 1.2,
    textAlign: 'center',
    positionX: 50,
    positionY: 50,
    rotation: 0
  })
  const [text, setText] = useState('Your Text Here')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateSetting = (key: keyof TextSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const randomizeSettings = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.floor(Math.random() * 40) + 24,
      fontFamily: fontFamilies[Math.floor(Math.random() * fontFamilies.length)],
      fontWeight: fontWeights[Math.floor(Math.random() * fontWeights.length)],
      textColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      outlineWidth: Math.floor(Math.random() * 5) + 1,
      positionX: Math.floor(Math.random() * 80) + 10,
      positionY: Math.floor(Math.random() * 80) + 10,
      rotation: Math.floor(Math.random() * 360)
    }))
  }

  const LabeledSlider = ({ 
    label, 
    value, 
    min, 
    max, 
    step = 1, 
    onChange 
  }: {
    label: string
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium" style={{ color: colors.text }}>
          {label}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-1 rounded text-sm text-center"
          style={{ 
            backgroundColor: colors.surface2,
            borderColor: colors.border,
            color: colors.text
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{ 
          background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${((value - min) / (max - min)) * 100}%, ${colors.border} ${((value - min) / (max - min)) * 100}%, ${colors.border} 100%)`
        }}
      />
    </div>
  )

  return (
    <div className="h-full flex">
      {/* Left Panel - Preview */}
      <div className="flex-1 p-6">
        <div className="h-full rounded-xl border" style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border 
        }}>
          <div className="p-4 border-b" style={{ borderColor: colors.border }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              Preview
            </h2>
          </div>
          
          <div className="flex-1 p-6 flex items-center justify-center relative overflow-hidden">
            <div 
              className="relative w-full h-full max-w-md max-h-96 rounded-lg overflow-hidden"
              style={{ backgroundColor: '#000' }}
            >
              {backgroundImage && (
                <img
                  src={backgroundImage}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: `${settings.positionX}%`,
                  top: `${settings.positionY}%`,
                  transform: `translate(-50%, -50%) rotate(${settings.rotation}deg)`,
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: settings.fontFamily,
                  fontWeight: settings.fontWeight,
                  color: settings.textColor,
                  textAlign: settings.textAlign as any,
                  lineHeight: settings.lineSpacing,
                  textShadow: `${settings.outlineWidth}px ${settings.outlineWidth}px 0 ${settings.outlineColor}`,
                  filter: `drop-shadow(0 0 ${settings.outlineWidth}px ${settings.outlineColor})`
                }}
              >
                {text}
              </div>
            </div>
          </div>

          {/* Preview Actions */}
          <div className="p-4 border-t flex space-x-2" style={{ borderColor: colors.border }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              style={{ 
                backgroundColor: colors.surface2,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <ImageIcon size="sm" />
              <span>Choose Image</span>
            </button>
            <button
              onClick={() => setBackgroundImage(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              style={{ 
                backgroundColor: colors.surface2,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <ShuffleIcon size="sm" />
              <span>Random Image</span>
            </button>
            <button
              onClick={randomizeSettings}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              style={{ 
                backgroundColor: colors.surface2,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <ShuffleIcon size="sm" />
              <span>Random Caption</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Controls */}
      <div className="w-80 border-l" style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border 
      }}>
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
            Text Style
          </h2>
        </div>

        <div className="p-4 space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 p-1 rounded-lg" style={{ backgroundColor: colors.surface2 }}>
            {[
              { id: 'text', label: 'Text', icon: TextIcon },
              { id: 'style', label: 'Style', icon: PaletteIcon },
              { id: 'position', label: 'Position', icon: PositionIcon }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'text-white' : 'opacity-70'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? colors.accent : 'transparent'
                  }}
                >
                  <IconComponent size="sm" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Text Content
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg resize-none"
                  style={{ 
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Font Family
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              <LabeledSlider
                label="Font Size"
                value={settings.fontSize}
                min={12}
                max={120}
                onChange={(value) => updateSetting('fontSize', value)}
              />
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Text Color
                </label>
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => updateSetting('textColor', e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Font Weight
                </label>
                <select
                  value={settings.fontWeight}
                  onChange={(e) => updateSetting('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  {fontWeights.map(weight => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </div>

              <LabeledSlider
                label="Outline Width"
                value={settings.outlineWidth}
                min={0}
                max={10}
                onChange={(value) => updateSetting('outlineWidth', value)}
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Outline Color
                </label>
                <input
                  type="color"
                  value={settings.outlineColor}
                  onChange={(e) => updateSetting('outlineColor', e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <LabeledSlider
                label="Line Spacing"
                value={settings.lineSpacing}
                min={0.8}
                max={3}
                step={0.1}
                onChange={(value) => updateSetting('lineSpacing', value)}
              />
            </div>
          )}

          {activeTab === 'position' && (
            <div className="space-y-4">
              <LabeledSlider
                label="Position X"
                value={settings.positionX}
                min={0}
                max={100}
                onChange={(value) => updateSetting('positionX', value)}
              />

              <LabeledSlider
                label="Position Y"
                value={settings.positionY}
                min={0}
                max={100}
                onChange={(value) => updateSetting('positionY', value)}
              />

              <LabeledSlider
                label="Rotation"
                value={settings.rotation}
                min={-180}
                max={180}
                onChange={(value) => updateSetting('rotation', value)}
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Text Align
                </label>
                <select
                  value={settings.textAlign}
                  onChange={(e) => updateSetting('textAlign', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
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
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: colors.border }}>
          <button
            className="w-full py-3 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: colors.accent,
              color: 'white'
            }}
          >
            Generate Content
          </button>
          <button
            className="w-full py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: colors.surface2,
              color: colors.text,
              borderColor: colors.border
            }}
          >
            Reset Settings
          </button>
        </div>
      </div>
    </div>
  )
}


