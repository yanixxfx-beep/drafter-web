// src/components/SlideCard.tsx
import React from 'react'
import { useThumbnails } from '@/hooks/useThumbnails'
import type { Slide } from '@/types/slide'
import { DownloadIcon, ShuffleIcon, EyeIcon } from '@/components/ui/Icon'

interface SlideCardProps {
  slide: Slide
  onExport?: (slide: Slide) => void
  onRandomize?: (slide: Slide) => void
  onEdit?: (slide: Slide) => void
  className?: string
  showActions?: boolean
}

export function SlideCard({ 
  slide, 
  onExport, 
  onRandomize, 
  onEdit, 
  className = '',
  showActions = true 
}: SlideCardProps) {
  const { getThumbnail, isThumbnailLoading, generateThumbnail } = useThumbnails()
  
  // Get or generate thumbnail
  const thumbnailUrl = getThumbnail(slide.id)
  const isLoading = isThumbnailLoading(slide.id)
  
  // Generate thumbnail if not available
  React.useEffect(() => {
    if (!thumbnailUrl && !isLoading) {
      generateThumbnail(slide, 216)
    }
  }, [slide, thumbnailUrl, isLoading, generateThumbnail])
  
  return (
    <div className={`relative group ${className}`}>
      {/* Thumbnail Container */}
      <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-900 relative">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={slide.textLayers[0]?.text || 'Slide'} 
            className="w-full h-full object-cover"
          />
        ) : isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm">No thumbnail</div>
            </div>
          </div>
        )}
        
        {/* Overlay Actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              {onExport && (
                <button
                  onClick={() => onExport(slide)}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Export slide"
                >
                  <DownloadIcon size="sm" />
                </button>
              )}
              
              {onRandomize && (
                <button
                  onClick={() => onRandomize(slide)}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Randomize image"
                >
                  <ShuffleIcon size="sm" />
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => onEdit(slide)}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Edit slide"
                >
                  <EyeIcon size="sm" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Slide Info */}
      <div className="mt-2">
        <p className="text-sm text-gray-300 truncate">
          {slide.textLayers[0]?.text || 'No text'}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {slide.exportSize.w}×{slide.exportSize.h}
          </span>
          <span className="text-xs text-gray-500">
            v{slide._rev}
          </span>
        </div>
      </div>
    </div>
  )
}
