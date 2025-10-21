// src/store/generateStore.ts
import { create } from 'zustand'
import type { Slide } from '@/types/slide'

export type GenerateState = {
  step: 1|2|3
  mode: 'single'|'multi'
  slidesBySheet: Record<string, Slide[]>
  selected: Record<string, boolean>
  setStep: (s: 1|2|3) => void
  setMode: (m: 'single'|'multi') => void
  setSlidesBySheet: (m: Record<string, Slide[]>) => void
  toggleSelect: (slideId: string) => void
  clearSelection: () => void
}

export const useGenerateStore = create<GenerateState>((set) => ({
  step: 1,
  mode: 'single',
  slidesBySheet: {},
  selected: {},
  setStep: (step) => set({ step }),
  setMode: (mode) => set({ mode }),
  setSlidesBySheet: (slidesBySheet) => set({ slidesBySheet }),
  toggleSelect: (id) => set(s => ({ selected: { ...s.selected, [id]: !s.selected[id] } })),
  clearSelection: () => set({ selected: {} })
}))
