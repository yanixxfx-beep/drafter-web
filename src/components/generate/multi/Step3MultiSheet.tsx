// src/components/generate/multi/Step3MultiSheet.tsx
'use client'
import React, { useState } from 'react'
import { type RunConfig } from '@/types/sheets'

interface Step3MultiSheetProps {
  runConfig: RunConfig
  onBack: () => void
}

export default function Step3MultiSheet({ runConfig, onBack }: Step3MultiSheetProps) {
  const [generatedDrafts, setGeneratedDrafts] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // TODO: Implement actual draft generation
      console.log('Generating drafts for config:', runConfig)
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      setGeneratedDrafts([
        { id: 1, sheetName: 'Monday', ideas: 5, slides: 25 },
        { id: 2, sheetName: 'Tuesday', ideas: 3, slides: 15 },
      ])
    } catch (error) {
      console.error('Failed to generate drafts:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportSheet = (sheetName: string) => {
    console.log(`Exporting drafts for sheet: ${sheetName}`)
    // TODO: Implement individual sheet export
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Step 3: Multi-Sheet Review & Export</h2>
        <p className="text-gray-600">Review and export your generated drafts by sheet</p>
      </div>
      
      {generatedDrafts.length === 0 ? (
        <div className="text-center">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? 'Generating...' : 'Generate Drafts'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {generatedDrafts.map(draft => (
              <div key={draft.id} className="p-4 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{draft.sheetName}</h3>
                  <button 
                    onClick={() => handleExportSheet(draft.sheetName)}
                    className="btn btn-sm btn-primary"
                  >
                    Export {draft.sheetName}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {draft.ideas} ideas • {draft.slides} slides
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Export will be named: {runConfig.sheetSelections[0]?.spreadsheetName}_{draft.sheetName.toLowerCase()}.zip
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onBack} className="btn btn-secondary">
        Back to Settings
      </button>
    </div>
  )
}