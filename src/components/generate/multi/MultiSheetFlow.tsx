'use client'
import React from 'react'
import Step1MultiSheet from './Step1MultiSheet'
import Step2MultiSheet from './Step2MultiSheet'
import Step3MultiSheet from './Step3MultiSheet'
import type { SheetSelection, RunConfig } from '@/types/sheets'
import type { Slide } from '@/types/slide'

export default function MultiSheetFlow() {
  const [step, setStep] = React.useState<1|2|3>(1)
  const [selection, setSelection] = React.useState<SheetSelection>({ spreadsheetId: '', sheets: [] })
  const [run, setRun] = React.useState<RunConfig>({ applyMode: 'all', sheets: [] })
  const [slidesBySheet, setSlidesBySheet] = React.useState<Record<string, Slide[]>>({})

  const generateSlides = async () => {
    // TODO: map rows from each selected sheet into Slide[] using run.sheets config
    // setSlidesBySheet({ [sheetId]: slides, ... })
    console.log('Generate slides for:', run)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-sm ${
          step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1. Select sheets
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2. Configure
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3. Review & Export
        </div>
      </div>

      {step === 1 && <Step1MultiSheet value={selection} onChange={setSelection} />}
      {step === 2 && <Step2MultiSheet selection={selection} value={run} onChange={setRun} />}
      {step === 3 && (
        <Step3MultiSheet 
          run={run} 
          slidesBySheet={slidesBySheet} 
          onReroll={(sheetId, id) => {
            console.log('Reroll slide:', sheetId, id)
          }} 
          onEdit={(sheetId, id) => {
            console.log('Edit slide:', sheetId, id)
          }} 
        />
      )}

      <div className="flex justify-between pt-2">
        <button 
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" 
          disabled={step === 1} 
          onClick={() => setStep(prev => (prev - 1) as any)}
        >
          Back
        </button>
        {step < 3 ? (
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" 
            onClick={() => setStep(prev => (prev + 1) as any)} 
            disabled={(step === 1 && selection.sheets.length === 0)}
          >
            Next
          </button>
        ) : (
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" 
            onClick={generateSlides}
          >
            Generate
          </button>
        )}
      </div>
    </div>
  )
}
