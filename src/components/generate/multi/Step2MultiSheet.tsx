// src/components/generate/multi/Step2MultiSheet.tsx
'use client'
import React from 'react'
import { type SheetSelection, type RunConfig } from '@/types/sheets'

interface Step2MultiSheetProps {
  sheetSelection: SheetSelection
  onNext: (config: RunConfig) => void
  onBack: () => void
}

export default function Step2MultiSheet({ sheetSelection, onNext, onBack }: Step2MultiSheetProps) {
  const handleNext = () => {
    const config: RunConfig = {
      sheetSelections: [sheetSelection],
      globalSettings: {
        // Add global settings here
      },
      perSheetSettings: {}
    }
    onNext(config)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Step 2: Multi-Sheet Settings</h2>
        <p className="text-gray-600">Configure settings for your selected sheets</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Selected Sheets:</h3>
          <p className="text-sm text-gray-600 mb-2">
            Spreadsheet: {sheetSelection.spreadsheetName}
          </p>
          <div className="flex flex-wrap gap-2">
            {sheetSelection.selectedSheets.map(sheetName => (
              <span key={sheetName} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {sheetName}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Settings Mode</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="settingsMode" value="global" defaultChecked />
                <span>Apply same settings to all sheets</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="settingsMode" value="per-sheet" />
                <span>Configure settings per sheet</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
        <button onClick={handleNext} className="btn btn-primary">
          Generate Drafts
        </button>
      </div>
    </div>
  )
}