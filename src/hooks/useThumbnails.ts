// src/hooks/useThumbnails.ts
import { useState, useEffect, useCallback } from 'react'
import { ThumbnailManager } from '@/lib/thumbnail/ThumbnailManager'
import type { Slide } from '@/types/slide'

export function useThumbnails() {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const manager = ThumbnailManager.getInstance()
  
  // Generate thumbnail for a single slide
  const generateThumbnail = useCallback(async (slide: Slide, targetWidth = 216) => {
    if (thumbnails.has(slide.id)) {
      return thumbnails.get(slide.id)!
    }
    
    if (loading.has(slide.id)) {
      return null // Already loading
    }
    
    setLoading(prev => new Set(prev).add(slide.id))
    
    try {
      const url = await manager.generateThumbnail(slide, targetWidth)
      if (url) {
        setThumbnails(prev => new Map(prev).set(slide.id, url))
      }
      return url
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(slide.id)
        return newSet
      })
    }
  }, [thumbnails, loading, manager])
  
  // Generate thumbnails for multiple slides
  const generateThumbnails = useCallback(async (slides: Slide[], targetWidth = 216) => {
    const results = await manager.generateThumbnails(slides, targetWidth)
    setThumbnails(prev => new Map([...prev, ...results]))
    return results
  }, [manager])
  
  // Get thumbnail URL for a slide
  const getThumbnail = useCallback((slideId: string) => {
    return thumbnails.get(slideId) || null
  }, [thumbnails])
  
  // Check if thumbnail is loading
  const isThumbnailLoading = useCallback((slideId: string) => {
    return loading.has(slideId)
  }, [loading])
  
  // Update slide and regenerate thumbnail
  const updateSlideThumbnail = useCallback(async (slide: Slide, targetWidth = 216) => {
    setLoading(prev => new Set(prev).add(slide.id))
    
    try {
      const url = await manager.updateSlideThumbnail(slide, targetWidth)
      if (url) {
        setThumbnails(prev => new Map(prev).set(slide.id, url))
      }
      return url
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(slide.id)
        return newSet
      })
    }
  }, [manager])
  
  // Cleanup thumbnail
  const cleanupThumbnail = useCallback((slideId: string) => {
    manager.cleanupThumbnail(slideId)
    setThumbnails(prev => {
      const newMap = new Map(prev)
      newMap.delete(slideId)
      return newMap
    })
  }, [manager])
  
  // Cleanup all thumbnails
  const cleanupAll = useCallback(() => {
    manager.cleanupAll()
    setThumbnails(new Map())
    setLoading(new Set())
  }, [manager])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAll()
    }
  }, [cleanupAll])
  
  return {
    thumbnails,
    loading,
    generateThumbnail,
    generateThumbnails,
    getThumbnail,
    isThumbnailLoading,
    updateSlideThumbnail,
    cleanupThumbnail,
    cleanupAll
  }
}

