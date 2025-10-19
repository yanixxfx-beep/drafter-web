'use client'
import React from 'react'
import SingleSheetFlow from './SingleSheetFlow'
import MultiSheetFlow from './multi/MultiSheetFlow'

export default function Orchestrator() {
  const [mode, setMode] = React.useState<'single'|'multi'>('single')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-4">
        <button 
          className={`px-4 py-2 rounded-lg border transition-all ${
            mode === 'single' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
          }`} 
          onClick={() => setMode('single')}
        >
          Single Sheet
        </button>
        <button 
          className={`px-4 py-2 rounded-lg border transition-all ${
            mode === 'multi' 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
          }`} 
          onClick={() => setMode('multi')}
        >
          Multi Sheet
        </button>
      </div>
      {mode === 'single' ? <SingleSheetFlow/> : <MultiSheetFlow/>}
    </div>
  )
}
