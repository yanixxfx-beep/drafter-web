'use client'
import React from 'react'
import type { SheetMeta, SheetSelection } from '@/types/sheets'
import { listSheetsForSpreadsheet } from '@/lib/sheets/provider'

export default function Step1MultiSheet({
  value, onChange
}: { value?: SheetSelection; onChange: (val: SheetSelection) => void }) {
  const [spreadsheetId, setSpreadsheetId] = React.useState(value?.spreadsheetId ?? '')
  const [sheets, setSheets] = React.useState<SheetMeta[]>(value?.sheets ?? [])
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchSheets = async () => {
    if (!spreadsheetId) return
    setLoading(true)
    setError(null)
    try {
      const list = await listSheetsForSpreadsheet(spreadsheetId)
      setSheets(list)
      setSelected(Object.fromEntries(list.map(s => [s.id, true]))) // preselect all
    } catch (e: any) { 
      setError(e.message || 'Failed to load sheets') 
    }
    finally { 
      setLoading(false) 
    }
  }

  React.useEffect(() => {
    onChange({ spreadsheetId, sheets: sheets.filter(s => selected[s.id]) })
  }, [spreadsheetId, sheets, selected, onChange])

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">Spreadsheet ID</label>
      <input 
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
        value={spreadsheetId} 
        onChange={e => setSpreadsheetId(e.target.value)} 
        placeholder="1AbC..."
      />
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-fit" 
        onClick={fetchSheets} 
        disabled={!spreadsheetId || loading}
      >
        {loading ? 'Loading...' : 'Load Sheets'}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {sheets.map(s => (
          <label key={s.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={!!selected[s.id]} 
              onChange={e => setSelected(v => ({...v, [s.id]: e.target.checked}))}
              className="rounded"
            />
            <span className="text-sm">
              {s.name} <span className="opacity-60">({s.rowCount} rows)</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
