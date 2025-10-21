// src/components/generate/Orchestrator.tsx
'use client'
import React from 'react'
import SingleSheetFlow from '@/components/generate/SingleSheetFlow'
import MultiSheetFlow from '@/components/generate/multi/MultiSheetFlow'
import { useGenerateStore } from '@/store/generateStore'

export default function Orchestrator(){
  const { mode, setMode } = useGenerateStore()
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button 
          className={`px-4 py-2 rounded ${mode==='single'?'bg-blue-500 text-white':'bg-gray-200 text-gray-700'}`} 
          onClick={()=>setMode('single')}
        >
          Single Sheet
        </button>
        <button 
          className={`px-4 py-2 rounded ${mode==='multi'?'bg-blue-500 text-white':'bg-gray-200 text-gray-700'}`} 
          onClick={()=>setMode('multi')}
        >
          Multi Sheet
        </button>
      </div>
      {mode==='single' ? <SingleSheetFlow/> : <MultiSheetFlow/>}
    </div>
  )
}