// src/components/generate/multi/MultiSheetFlow.tsx
'use client'
import React, { useState } from 'react'
import Step1MultiSheet from './Step1MultiSheet'
import Step2MultiSheet from './Step2MultiSheet'
import Step3MultiSheet from './Step3MultiSheet'
import { type SheetSelection, type RunConfig } from '@/types/sheets'

export default function MultiSheetFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [sheetSelection, setSheetSelection] = useState<SheetSelection | null>(null)
  const [runConfig, setRunConfig] = useState<RunConfig | null>(null)
  
  const handleStep1Next = (selection: SheetSelection) => {
    setSheetSelection(selection)
    setCurrentStep(2)
  }

  const handleStep2Next = (config: RunConfig) => {
    setRunConfig(config)
    setCurrentStep(3)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  return (
    <div className="space-y-6">
      {currentStep === 1 && <Step1MultiSheet onNext={handleStep1Next} />}
      {currentStep === 2 && sheetSelection && (
        <Step2MultiSheet 
          sheetSelection={sheetSelection}
          onNext={handleStep2Next} 
          onBack={handleBack} 
        />
      )}
      {currentStep === 3 && runConfig && (
        <Step3MultiSheet 
          runConfig={runConfig}
          onBack={handleBack} 
        />
      )}
    </div>
  )
}