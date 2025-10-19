// src/lib/workflow/MultiSheetWorkflow.ts
import { readSheetData, parseIdeasFromSheet } from '@/lib/googleSheets'
import { renderSlideToCanvas } from '@/lib/render/SlideRenderer'
import { enqueueThumb } from '@/lib/images/thumbnail'
import { mulberry32 } from '@/lib/rand'
import type { Slide } from '@/types/slide'

export interface SheetConfig {
  sheetId: string
  sheetName: string
  isSelected: boolean
  settings: {
    slideColumns: string[]
    format: '9:16' | '3:4' | 'combined'
    customName?: string
  }
}

export interface MultiSheetProject {
  id: string
  name: string
  sheets: SheetConfig[]
  globalSettings: {
    fontChoice: string
    fontSize: number
    outlinePx: number
    lineSpacing: number
    verticalAlignment: string
    horizontalAlignment: string
    yOffset: number
    xOffset: number
    textRotation: number
    autoFit: boolean
    rotateBg180: boolean
    useSafeZone: boolean
    safeZoneFormat: '9:16' | '3:4'
    showSafeZoneOverlay: boolean
  }
  applyMode: 'all' | 'perSheet'
}

export interface GeneratedSlideGroup {
  sheetName: string
  sheetId: string
  slides: Slide[]
  totalIdeas: number
  generatedAt: Date
}

export class MultiSheetWorkflow {
  private static instance: MultiSheetWorkflow
  private currentProject: MultiSheetProject | null = null

  static getInstance(): MultiSheetWorkflow {
    if (!MultiSheetWorkflow.instance) {
      MultiSheetWorkflow.instance = new MultiSheetWorkflow()
    }
    return MultiSheetWorkflow.instance
  }

  // Create a new multi-sheet project
  createProject(name: string, sheets: SheetConfig[], globalSettings: any, applyMode: 'all' | 'perSheet'): MultiSheetProject {
    const project: MultiSheetProject = {
      id: `project_${Date.now()}`,
      name,
      sheets: sheets.filter(s => s.isSelected),
      globalSettings,
      applyMode
    }
    
    this.currentProject = project
    return project
  }

  // Generate slides for all selected sheets
  async generateSlidesForAllSheets(
    accessToken: string,
    availableImages: string[],
    onProgress?: (progress: { current: string; completed: number; total: number }) => void
  ): Promise<GeneratedSlideGroup[]> {
    if (!this.currentProject) {
      throw new Error('No project loaded')
    }

    const selectedSheets = this.currentProject.sheets.filter(s => s.isSelected)
    const results: GeneratedSlideGroup[] = []
    let completed = 0

    for (const sheet of selectedSheets) {
      try {
        onProgress?.({
          current: sheet.settings.customName || sheet.sheetName,
          completed,
          total: selectedSheets.length
        })

        const slideGroup = await this.generateSlidesForSheet(
          accessToken,
          sheet,
          availableImages,
          this.currentProject.globalSettings
        )

        results.push(slideGroup)
        completed++
      } catch (error) {
        console.error(`Failed to generate slides for sheet ${sheet.sheetName}:`, error)
        // Continue with other sheets
      }
    }

    return results
  }

  // Generate slides for a single sheet
  private async generateSlidesForSheet(
    accessToken: string,
    sheet: SheetConfig,
    availableImages: string[],
    globalSettings: any
  ): Promise<GeneratedSlideGroup> {
    // Read sheet data
    const sheetData = await readSheetData(accessToken, sheet.sheetId, sheet.sheetName)
    const parsedData = parseIdeasFromSheet(sheetData)

    // Generate slides for each idea
    const slides: Slide[] = []
    
    for (let i = 0; i < parsedData.ideas.length; i++) {
      const idea = parsedData.ideas[i]
      const ideaText = idea[parsedData.slideColumns[0]] || ''
      
      if (!ideaText.trim()) continue

      // Split idea into slides (you can customize this logic)
      const slideTexts = [ideaText] // For now, one slide per idea

      for (let slideIndex = 0; slideIndex < slideTexts.length; slideIndex++) {
        const slideText = slideTexts[slideIndex]

        // Get random image using deterministic RNG
        const slideId = `${sheet.sheetId}_idea_${i + 1}_slide_${slideIndex + 1}`
        const rnd = mulberry32(slideId)
        const randomImage = availableImages[Math.floor(rnd() * availableImages.length)]

        // Determine format
        const slideFormat = sheet.settings.format === 'combined' 
          ? (Math.random() > 0.5 ? '9:16' : '3:4')
          : sheet.settings.format

        // Create new slide using new format
        const exportSize = slideFormat === '3:4' 
          ? { w: 1080, h: 1440 }
          : { w: 1080, h: 1920 }

        const newSlide: Slide = {
          id: slideId,
          seed: slideId,
          _rev: 1,
          updatedAt: Date.now(),
          exportSize,
          imageRef: {
            kind: 'local',
            localId: randomImage?.url || ''
          },
          textLayers: [{
            id: `${slideId}_text`,
            kind: 'title',
            text: slideText,
            x: 0,
            y: 0,
            w: exportSize.w,
            h: exportSize.h,
            align: 'center',
            font: 'TikTok Sans',
            size: globalSettings.fontSize || 52,
            lineHeight: globalSettings.lineSpacing || 12,
            color: '#ffffff',
            stroke: globalSettings.outlinePx ? {
              color: '#000000',
              width: globalSettings.outlinePx
            } : undefined
          }],
          templateId: undefined,
          watermark: undefined,
          thumbUrl: null // Will be generated by queue
        }

        slides.push(newSlide)

        // Enqueue thumbnail generation
        enqueueThumb(newSlide, 216)
      }
    }

    return {
      sheetName: sheet.settings.customName || sheet.sheetName,
      sheetId: sheet.sheetId,
      slides,
      totalIdeas: parsedData.ideas.length,
      generatedAt: new Date()
    }
  }

  // Get current project
  getCurrentProject(): MultiSheetProject | null {
    return this.currentProject
  }

  // Update project settings
  updateProjectSettings(settings: Partial<MultiSheetProject['globalSettings']>): void {
    if (this.currentProject) {
      this.currentProject.globalSettings = {
        ...this.currentProject.globalSettings,
        ...settings
      }
    }
  }

  // Update sheet settings
  updateSheetSettings(sheetId: string, settings: Partial<SheetConfig['settings']>): void {
    if (this.currentProject) {
      this.currentProject.sheets = this.currentProject.sheets.map(sheet =>
        sheet.sheetId === sheetId
          ? { ...sheet, settings: { ...sheet.settings, ...settings } }
          : sheet
      )
    }
  }

  // Export all slides grouped by sheet
  async exportAllSlidesGrouped(slideGroups: GeneratedSlideGroup[]): Promise<void> {
    // This would integrate with the ExportManager
    console.log('Exporting slides grouped by sheet:', slideGroups.map(g => ({
      sheetName: g.sheetName,
      slideCount: g.slides.length
    })))
  }
}
