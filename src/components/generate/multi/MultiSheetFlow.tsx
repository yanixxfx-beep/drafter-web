// src/components/generate/multi/MultiSheetFlow.tsx
'use client'
import React, { useState, useMemo } from 'react'
import Step1MultiSheet from './Step1MultiSheet'
import Step2MultiSheet from './Step2MultiSheet'
import Step3MultiSheet from './Step3MultiSheet'
import { type SheetSelection, type RunConfig, type SlidesBySheet } from '@/types/sheets'
import { type Slide } from '@/types/slide'
import { defaultDayResolver } from '@/lib/grouping/dayResolvers'

export default function MultiSheetFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [sheetSelection, setSheetSelection] = useState<SheetSelection | null>(null)
  const [runConfig, setRunConfig] = useState<RunConfig | null>(null)
  const [generatedSlides, setGeneratedSlides] = useState<SlidesBySheet>({})
  
  const handleStep1Next = (selection: SheetSelection) => {
    setSheetSelection(selection)
    setCurrentStep(2)
  }

  const handleStep2Next = (config: RunConfig) => {
    setRunConfig(config)
    setCurrentStep(3)
    
    // TODO: Generate slides here and populate generatedSlides
    // For now, we'll use mock data
    const mockSlides: SlidesBySheet = {}
    if (sheetSelection) {
      sheetSelection.selectedSheets.forEach(sheetName => {
        mockSlides[sheetName] = [
          // Mock slides - replace with actual generation logic
          {
            id: `${sheetName}-slide-1`,
            image: '/assets/logo/logo_drafter_transparent.png',
            caption: `Mock slide 1 for ${sheetName}`,
            format: '9:16' as const,
            thumbUrl: '/assets/logo/logo_drafter_transparent.png',
            textLayers: [{ text: `Mock slide 1 for ${sheetName}` }],
            sourceSheet: sheetName
          } as Slide
        ]
      })
    }
    setGeneratedSlides(mockSlides)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getSheetName = (sheetId: string) => {
    return sheetId // For now, sheetId is the sheet name
  }

  const handleReroll = (sheetId: string, slideId: string) => {
    console.log('Reroll slide:', sheetId, slideId)
    // TODO: Implement reroll logic
  }

  const handleEdit = (sheetId: string, slideId: string) => {
    console.log('Edit slide:', sheetId, slideId)
    // TODO: Implement edit logic
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
          run={runConfig}
          slidesBySheet={generatedSlides}
          getSheetName={getSheetName}
          resolveDay={defaultDayResolver}
          onReroll={handleReroll}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}