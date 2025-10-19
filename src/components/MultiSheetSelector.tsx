// src/components/MultiSheetSelector.tsx
import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'

interface GoogleSheet {
  id: string
  name: string
  url: string
}

interface SheetConfig {
  sheetId: string
  sheetName: string
  isSelected: boolean
  previewData?: {
    headers: string[]
    sampleRows: string[][]
  }
  settings: {
    slideColumns: string[]
    format: '9:16' | '3:4' | 'combined'
    customName?: string
  }
}

interface MultiSheetSelectorProps {
  spreadsheets: GoogleSheet[]
  onSelectionChange: (selectedSheets: SheetConfig[]) => void
  onPreviewSheet: (sheetId: string) => Promise<{ headers: string[]; sampleRows: string[][] }>
  colors: any
  className?: string
}

export function MultiSheetSelector({
  spreadsheets,
  onSelectionChange,
  onPreviewSheet,
  colors,
  className = ''
}: MultiSheetSelectorProps) {
  const [sheetConfigs, setSheetConfigs] = useState<SheetConfig[]>([])
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set())
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set())
  const [applyMode, setApplyMode] = useState<'all' | 'perSheet'>('all')

  // Initialize sheet configs when spreadsheets change
  useEffect(() => {
    const configs = spreadsheets.map(sheet => ({
      sheetId: sheet.id,
      sheetName: sheet.name,
      isSelected: false,
      settings: {
        slideColumns: [],
        format: '9:16' as const,
        customName: sheet.name
      }
    }))
    setSheetConfigs(configs)
  }, [spreadsheets])

  // Update parent when selection changes
  useEffect(() => {
    const selectedSheets = sheetConfigs.filter(config => config.isSelected)
    onSelectionChange(selectedSheets)
  }, [sheetConfigs, onSelectionChange])

  const toggleSheetSelection = (sheetId: string) => {
    setSheetConfigs(prev => 
      prev.map(config => 
        config.sheetId === sheetId 
          ? { ...config, isSelected: !config.isSelected }
          : config
      )
    )
  }

  const toggleSheetExpansion = (sheetId: string) => {
    setExpandedSheets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sheetId)) {
        newSet.delete(sheetId)
      } else {
        newSet.add(sheetId)
      }
      return newSet
    })
  }

  const loadSheetPreview = async (sheetId: string) => {
    if (loadingPreviews.has(sheetId)) return

    setLoadingPreviews(prev => new Set(prev).add(sheetId))
    
    try {
      const previewData = await onPreviewSheet(sheetId)
      
      setSheetConfigs(prev => 
        prev.map(config => 
          config.sheetId === sheetId 
            ? { ...config, previewData }
            : config
        )
      )
    } catch (error) {
      console.error('Failed to load sheet preview:', error)
    } finally {
      setLoadingPreviews(prev => {
        const newSet = new Set(prev)
        newSet.delete(sheetId)
        return newSet
      })
    }
  }

  const updateSheetSettings = (sheetId: string, settings: Partial<SheetConfig['settings']>) => {
    setSheetConfigs(prev => 
      prev.map(config => 
        config.sheetId === sheetId 
          ? { ...config, settings: { ...config.settings, ...settings } }
          : config
      )
    )
  }

  const selectAllSheets = () => {
    setSheetConfigs(prev => 
      prev.map(config => ({ ...config, isSelected: true }))
    )
  }

  const deselectAllSheets = () => {
    setSheetConfigs(prev => 
      prev.map(config => ({ ...config, isSelected: false }))
    )
  }

  const selectedCount = sheetConfigs.filter(config => config.isSelected).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
            Select Sheets ({selectedCount} selected)
          </h3>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Choose which Google Sheets to include in this project
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={selectAllSheets}
            className="px-3 py-1 text-sm rounded border"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text 
            }}
          >
            Select All
          </button>
          <button
            onClick={deselectAllSheets}
            className="px-3 py-1 text-sm rounded border"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text 
            }}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Apply mode toggle */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          Settings Mode:
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => setApplyMode('all')}
            className={`px-3 py-1 text-sm rounded ${
              applyMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Apply to All Sheets
          </button>
          <button
            onClick={() => setApplyMode('perSheet')}
            className={`px-3 py-1 text-sm rounded ${
              applyMode === 'perSheet' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Customize Per Sheet
          </button>
        </div>
      </div>

      {/* Sheets list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sheetConfigs.map((config) => (
          <div
            key={config.sheetId}
            className="border rounded-lg"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: config.isSelected ? colors.accent : colors.border 
            }}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleSheetSelection(config.sheetId)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center"
                  style={{ 
                    backgroundColor: config.isSelected ? colors.accent : 'transparent',
                    borderColor: colors.accent
                  }}
                >
                  {config.isSelected && (
                    <Icon name="check" size="sm" className="text-white" />
                  )}
                </button>
                
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: colors.text }}>
                    {config.settings.customName || config.sheetName}
                  </h4>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {config.sheetName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadSheetPreview(config.sheetId)}
                  disabled={loadingPreviews.has(config.sheetId)}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Preview sheet data"
                >
                  <Icon name="eye" size="sm" />
                </button>
                
                <button
                  onClick={() => toggleSheetExpansion(config.sheetId)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  {expandedSheets.has(config.sheetId) ? (
                    <Icon name="chevron-down" size="sm" />
                  ) : (
                    <Icon name="chevron-right" size="sm" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded sheet details */}
            {expandedSheets.has(config.sheetId) && (
              <div className="border-t p-3" style={{ borderColor: colors.border }}>
                {/* Preview data */}
                {config.previewData && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                      Preview (first 3 rows):
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ backgroundColor: colors.surface2 }}>
                            {config.previewData.headers.map((header, index) => (
                              <th key={index} className="p-2 text-left" style={{ color: colors.text }}>
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {config.previewData.sampleRows.slice(0, 3).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="p-2" style={{ color: colors.textMuted }}>
                                  {cell || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sheet settings */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                      Custom Name (optional)
                    </label>
                    <input
                      type="text"
                      value={config.settings.customName || ''}
                      onChange={(e) => updateSheetSettings(config.sheetId, { customName: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ 
                        backgroundColor: colors.background, 
                        borderColor: colors.border,
                        color: colors.text 
                      }}
                      placeholder={config.sheetName}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                      Slide Format
                    </label>
                    <select
                      value={config.settings.format}
                      onChange={(e) => updateSheetSettings(config.sheetId, { 
                        format: e.target.value as '9:16' | '3:4' | 'combined' 
                      })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ 
                        backgroundColor: colors.background, 
                        borderColor: colors.border,
                        color: colors.text 
                      }}
                    >
                      <option value="9:16">9:16 (TikTok/Instagram Stories)</option>
                      <option value="3:4">3:4 (Instagram Post)</option>
                      <option value="combined">Mixed (Random per slide)</option>
                    </select>
                  </div>

                  {config.previewData && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Slide Columns (auto-detected)
                      </label>
                      <div className="text-sm" style={{ color: colors.textMuted }}>
                        {config.settings.slideColumns.length > 0 
                          ? config.settings.slideColumns.join(', ')
                          : 'No slide columns detected'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: colors.surface2 }}>
          <h4 className="font-medium mb-2" style={{ color: colors.text }}>
            Project Summary
          </h4>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {selectedCount} sheet{selectedCount !== 1 ? 's' : ''} selected
            {applyMode === 'all' && ' • Settings will apply to all sheets'}
            {applyMode === 'perSheet' && ' • Each sheet can have custom settings'}
          </p>
        </div>
      )}
    </div>
  )
}
