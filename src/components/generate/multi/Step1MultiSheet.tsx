// src/components/generate/multi/Step1MultiSheet.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { listSheetsForSpreadsheet, type SheetMeta } from '@/lib/sheets/provider'
import { type SheetSelection } from '@/types/sheets'

interface Step1MultiSheetProps {
  onNext: (selection: SheetSelection) => void
}

export default function Step1MultiSheet({ onNext }: Step1MultiSheetProps) {
  const [spreadsheets, setSpreadsheets] = useState<any[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('')
  const [sheets, setSheets] = useState<SheetMeta[]>([])
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSpreadsheetSelect = async (spreadsheetId: string) => {
    setLoading(true)
    try {
      const sheetList = await listSheetsForSpreadsheet(spreadsheetId)
      setSheets(sheetList)
      setSelectedSheets([])
    } catch (error) {
      console.error('Failed to load sheets:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSheetSelection = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) 
        ? prev.filter(name => name !== sheetName)
        : [...prev, sheetName]
    )
  }

  const handleNext = () => {
    if (selectedSpreadsheet && selectedSheets.length > 0) {
      onNext({
        spreadsheetId: selectedSpreadsheet,
        spreadsheetName: spreadsheets.find(s => s.id === selectedSpreadsheet)?.name || '',
        selectedSheets
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Step 1: Multi-Sheet Selection</h2>
        <p className="text-gray-600">Select multiple sheets from your spreadsheet</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Spreadsheet</label>
          <select 
            value={selectedSpreadsheet}
            onChange={(e) => {
              setSelectedSpreadsheet(e.target.value)
              handleSpreadsheetSelect(e.target.value)
            }}
            className="w-full p-2 border rounded"
          >
            <option value="">Choose a spreadsheet...</option>
            {spreadsheets.map(spreadsheet => (
              <option key={spreadsheet.id} value={spreadsheet.id}>
                {spreadsheet.name}
              </option>
            ))}
          </select>
        </div>

        {sheets.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Select Sheets</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sheets.map(sheet => (
                <div key={sheet.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={sheet.name}
                    checked={selectedSheets.includes(sheet.name)}
                    onChange={() => toggleSheetSelection(sheet.name)}
                    className="rounded"
                  />
                  <label htmlFor={sheet.name} className="flex-1">
                    {sheet.name} ({sheet.rowCount} rows)
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleNext}
        disabled={selectedSheets.length === 0 || loading}
        className="btn btn-primary"
      >
        {loading ? 'Loading...' : 'Next Step'}
      </button>
    </div>
  )
}