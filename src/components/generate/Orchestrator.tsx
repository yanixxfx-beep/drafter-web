// src/components/generate/Orchestrator.tsx
'use client'
import React from 'react'
import SingleSheetFlow from '@/components/generate/SingleSheetFlow'
import MultiSheetFlow from '@/components/generate/multi/MultiSheetFlow'

export default function Orchestrator() {
  const [mode, setMode] = React.useState<'single'|'multi'>('single')
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button 
          className={`btn ${mode==='single'?'btn-primary':''}`} 
          onClick={()=>setMode('single')}
        >
          Single sheet
        </button>
        <button 
          className={`btn ${mode==='multi'?'btn-primary':''}`} 
          onClick={()=>setMode('multi')}
        >
          Multi sheet
        </button>
      </div>
      {mode==='single' ? <SingleSheetFlow/> : <MultiSheetFlow/>}
    </div>
  )
}