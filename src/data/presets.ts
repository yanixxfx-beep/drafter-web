export type TextPreset = {
  id: string
  name: string
  font: string
  size: number
  lineHeight: number
  color: string
  title?: Partial<{
    size: number
    lineHeight: number
    color: string
    font: string
  }>
  subtitle?: Partial<{
    size: number
    lineHeight: number
    color: string
    font: string
  }>
  cta?: Partial<{
    size: number
    lineHeight: number
    color: string
    font: string
  }>
}

export const PRESETS: TextPreset[] = [
  { 
    id: 'clean', 
    name: 'Clean', 
    font: 'TikTokSans_18pt_Regular', 
    size: 56, 
    lineHeight: 1.15, 
    color: '#fff',
    title: { size: 72, font: 'TikTokSans_18pt_SemiBold' },
    subtitle: { size: 48, font: 'TikTokSans_18pt_Regular' },
    cta: { size: 40, font: 'TikTokSans_18pt_Medium' }
  },
  { 
    id: 'bold', 
    name: 'Bold', 
    font: 'TikTokSans_18pt_SemiBold', 
    size: 64, 
    lineHeight: 1.05, 
    color: '#fff',
    title: { size: 80, font: 'TikTokSans_18pt_SemiBold' },
    subtitle: { size: 56, font: 'TikTokSans_18pt_Medium' },
    cta: { size: 48, font: 'TikTokSans_18pt_SemiBold' }
  },
  { 
    id: 'minimal', 
    name: 'Minimal', 
    font: 'TikTokSans_18pt_Regular', 
    size: 48, 
    lineHeight: 1.2, 
    color: '#fff',
    title: { size: 60, font: 'TikTokSans_18pt_Medium' },
    subtitle: { size: 40, font: 'TikTokSans_18pt_Regular' },
    cta: { size: 36, font: 'TikTokSans_18pt_Medium' }
  },
  { 
    id: 'dramatic', 
    name: 'Dramatic', 
    font: 'TikTokSans_18pt_SemiBold', 
    size: 72, 
    lineHeight: 1.0, 
    color: '#fff',
    title: { size: 96, font: 'TikTokSans_18pt_SemiBold' },
    subtitle: { size: 64, font: 'TikTokSans_18pt_Medium' },
    cta: { size: 52, font: 'TikTokSans_18pt_SemiBold' }
  }
]