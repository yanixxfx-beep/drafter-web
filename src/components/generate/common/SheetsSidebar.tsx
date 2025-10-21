// src/components/generate/common/SheetsSidebar.tsx
'use client'
import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import type { GroupsBySheet } from '@/types/sheets'

interface SheetsSidebarProps {
  groups: GroupsBySheet
  onSheetClick: (sheetId: string) => void
  onExportAll: () => void
  onExportPerSheet: () => void
  onExportSelected: () => void
  hasSelected: boolean
}

export default function SheetsSidebar({
  groups,
  onSheetClick,
  onExportAll,
  onExportPerSheet,
  onExportSelected,
  hasSelected
}: SheetsSidebarProps) {
  const { colors } = useTheme()

  return (
    <aside className="w-68 border-r pr-4 space-y-3" style={{ borderColor: colors.border }}>
      <h4 className="font-semibold" style={{ color: colors.text }}>Sheets</h4>
      <ul className="space-y-1">
        {Object.values(groups).map(g => (
          <li key={g.sheetId}>
            <button 
              className="w-full justify-between p-2 rounded hover:bg-opacity-10 transition-colors"
              style={{ 
                backgroundColor: 'transparent',
                color: colors.text,
                border: `1px solid ${colors.border}`
              }}
              onClick={() => onSheetClick(g.sheetId)}
            >
              <span>{g.sheetName}</span><span className="opacity-60">→</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="divider" style={{ borderColor: colors.border }}/>
      <button 
        className="w-full p-2 rounded font-medium"
        style={{ 
          backgroundColor: colors.accent, 
          color: 'white',
          border: 'none'
        }}
        onClick={onExportAll}
      >
        Export ALL (combined ZIP)
      </button>
      <button 
        className="w-full p-2 rounded font-medium"
        style={{ 
          backgroundColor: colors.surface2, 
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
        onClick={onExportPerSheet}
      >
        Export per sheet (multiple ZIPs)
      </button>
      <button 
        className="w-full p-2 rounded font-medium disabled:opacity-50"
        style={{ 
          backgroundColor: colors.surface2, 
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
        onClick={onExportSelected} 
        disabled={!hasSelected}
      >
        Export SELECTED
      </button>
    </aside>
  )
}
