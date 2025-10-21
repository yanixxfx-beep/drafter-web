// src/components/generate/multi/MultiSheetFlow.tsx
'use client'
import React, { useState, useMemo } from 'react'
import Step1MultiSheet from './Step1MultiSheet'
import Step2MultiSheet from './Step2MultiSheet'
import Step3MultiSheet from './Step3MultiSheet'
import { type SheetSelection, type RunConfig, type SlidesBySheet } from '@/types/sheets'
import { type Slide } from '@/types/slide'
import { defaultDayResolver } from '@/lib/grouping/dayResolvers'
import { useGenerateStore } from '@/store/generateStore'

export default function MultiSheetFlow() {
  const { step, setStep, slidesBySheet, setSlidesBySheet } = useGenerateStore()
  const [sheetSelection, setSheetSelection] = useState<SheetSelection | null>(null)
  const [runConfig, setRunConfig] = useState<RunConfig | null>(null)
  
  const handleStep1Next = (selection: SheetSelection) => {
    setSheetSelection(selection)
    setStep(2)
  }

  const handleStep2Next = (config: RunConfig) => {
    setRunConfig(config)
    setStep(3)
    
    // TODO: Generate slides here and populate generatedSlides
    // For now, we'll use mock data
    const mockSlides: SlidesBySheet = {}
    if (sheetSelection) {
      sheetSelection.selectedSheets.forEach(sheetName => {
        mockSlides[sheetName] = [
          // Mock slides - replace with actual generation logic
          {
            id: `${sheetName}-slide-1`,
            seed: `${sheetName}-1`,
            _rev: 0,
            updatedAt: Date.now(),
            exportSize: { w: 1080, h: 1920 },
            imageRef: { kind: 'local', localId: 'mock' },
            textLayers: [{ 
              id: '1',
              kind: 'title' as const,
              text: `Mock slide 1 for ${sheetName}`,
              x: 540,
              y: 960,
              w: 1000,
              h: 200,
              align: 'center' as CanvasTextAlign,
              font: 'Arial',
              size: 48,
              lineHeight: 1.2,
              color: '#FFFFFF'
            }],
            thumbUrl: '/assets/logo/logo_drafter_transparent.png',
            meta: { day: 'Monday' }
          } as Slide
        ]
      })
    }
    setSlidesBySheet(mockSlides)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1|2|3)
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
      {step === 1 && <Step1MultiSheet onNext={handleStep1Next} />}
      {step === 2 && sheetSelection && (
        <Step2MultiSheet 
          sheetSelection={sheetSelection}
          onNext={handleStep2Next} 
          onBack={handleBack} 
        />
      )}
      {step === 3 && runConfig && (
        <Step3MultiSheet 
          run={runConfig}
          slidesBySheet={slidesBySheet}
          getSheetName={getSheetName}
          resolveDay={defaultDayResolver}
          onReroll={handleReroll}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}