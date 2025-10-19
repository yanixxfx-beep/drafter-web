'use client'
import React from 'react'
import type { RunConfig, SheetConfig, SheetSelection, TextSettings, FormatSettings } from '@/types/sheets'

export default function Step2MultiSheet({
  selection, value, onChange
}: { selection: SheetSelection; value?: RunConfig; onChange: (v: RunConfig) => void }) {
  const [mode, setMode] = React.useState<'all'|'perSheet'>(value?.applyMode ?? 'all')

  const [globalText, setGlobalText] = React.useState<TextSettings>({ 
    font: 'TikTokSans_18pt_Regular', 
    size: 56, 
    lineHeight: 1.15, 
    color: '#fff' 
  })
  const [globalFormat, setGlobalFormat] = React.useState<FormatSettings>({ 
    width: 1080, 
    height: 1920, 
    templateId: undefined, 
    watermark: false 
  })

  const [perSheet, setPerSheet] = React.useState<Record<string, SheetConfig>>({})

  React.useEffect(() => {
    const cfg: RunConfig = mode === 'all'
      ? { 
          applyMode: 'all', 
          sheets: selection.sheets.map(s => ({ 
            sheetId: s.id, 
            sheetName: s.name, 
            text: globalText, 
            format: globalFormat 
          })) 
        }
      : { 
          applyMode: 'perSheet', 
          sheets: selection.sheets.map(s => 
            perSheet[s.id] ?? { 
              sheetId: s.id, 
              sheetName: s.name, 
              text: globalText, 
              format: globalFormat 
            }
          ) 
        }
    onChange(cfg)
  }, [mode, globalText, globalFormat, perSheet, selection, onChange])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button 
          className={`px-4 py-2 rounded-lg border transition-all ${
            mode === 'all' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
          }`} 
          onClick={() => setMode('all')}
        >
          Apply once to all
        </button>
        <button 
          className={`px-4 py-2 rounded-lg border transition-all ${
            mode === 'perSheet' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
          }`} 
          onClick={() => setMode('perSheet')}
        >
          Customize per sheet
        </button>
      </div>

      {mode === 'all' ? (
        <div className="grid grid-cols-2 gap-4">
          <TextSettingsForm value={globalText} onChange={setGlobalText} />
          <FormatSettingsForm value={globalFormat} onChange={setGlobalFormat} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {selection.sheets.map(s => (
            <details key={s.id} className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium">{s.name}</summary>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <TextSettingsForm 
                  value={perSheet[s.id]?.text ?? globalText} 
                  onChange={(v) => setPerSheet(ps => ({
                    ...ps, 
                    [s.id]: {
                      ...(ps[s.id] ?? { sheetId: s.id, sheetName: s.name, text: v, format: globalFormat }), 
                      text: v 
                    }
                  }))} 
                />
                <FormatSettingsForm 
                  value={perSheet[s.id]?.format ?? globalFormat} 
                  onChange={(v) => setPerSheet(ps => ({
                    ...ps, 
                    [s.id]: {
                      ...(ps[s.id] ?? { sheetId: s.id, sheetName: s.name, text: globalText, format: v }), 
                      format: v 
                    }
                  }))} 
                />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

function TextSettingsForm({ value, onChange }: { value: TextSettings; onChange: (v: TextSettings) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-medium">Text Settings</h4>
      <label className="flex flex-col gap-1">
        Font
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={value.font} 
          onChange={e => onChange({...value, font: e.target.value})}
        />
      </label>
      <label className="flex flex-col gap-1">
        Size
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          type="number" 
          value={value.size} 
          onChange={e => onChange({...value, size: +e.target.value})}
        />
      </label>
      <label className="flex flex-col gap-1">
        Line height
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          type="number" 
          step="0.05" 
          value={value.lineHeight} 
          onChange={e => onChange({...value, lineHeight: +e.target.value})}
        />
      </label>
      <label className="flex flex-col gap-1">
        Color
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={value.color} 
          onChange={e => onChange({...value, color: e.target.value})}
        />
      </label>
    </div>
  )
}

function FormatSettingsForm({ value, onChange }: { value: FormatSettings; onChange: (v: FormatSettings) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-medium">Format Settings</h4>
      <label className="flex flex-col gap-1">
        Width
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          type="number" 
          value={value.width} 
          onChange={e => onChange({...value, width: +e.target.value})}
        />
      </label>
      <label className="flex flex-col gap-1">
        Height
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          type="number" 
          value={value.height} 
          onChange={e => onChange({...value, height: +e.target.value})}
        />
      </label>
      <label className="flex flex-col gap-1">
        Template ID
        <input 
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={value.templateId ?? ''} 
          onChange={e => onChange({...value, templateId: e.target.value || undefined})}
        />
      </label>
      <label className="inline-flex items-center gap-2">
        <input 
          type="checkbox" 
          checked={!!value.watermark} 
          onChange={e => onChange({...value, watermark: e.target.checked})}
          className="rounded"
        />
        Watermark
      </label>
    </div>
  )
}
