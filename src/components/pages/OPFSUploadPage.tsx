'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { 
  UploadIcon, 
  ImageIcon, 
  VideoIcon, 
  DocumentIcon, 
  FileIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  SearchIcon,
  FilterIcon,
  GridIcon,
  ListIcon
} from '@/components/ui/Icon'
import { usePersistentSession } from '@/session/usePersistentSession'
import { ImageItem } from '@/session/manifest'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  category: 'affiliate' | 'ai-method'
  format: '9:16' | '3:4'
  uploadDate: Date
}

const ITEMS_PER_PAGE = 50

export function OPFSUploadPage() {
  const { colors } = useTheme()
  const { store, ready } = usePersistentSession()
  
  // UI State
  const [dragActive, setDragActive] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'affiliate' | 'ai-method'>('affiliate')
  const [activeFormat, setActiveFormat] = useState<'9:16' | '3:4'>('9:16')
  
  // Debug activeFormat changes
  useEffect(() => {
    console.log('activeFormat changed to:', activeFormat)
  }, [activeFormat])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 })

  // Load files from storage on mount and category/format change
  useEffect(() => {
    let cancelled = false
    if (store && ready) {
      (async () => {
        setIsLoadingFiles(true)
        const files = await loadFiles()
        if (cancelled) return
        setUploadedFiles(files)
        setIsLoadingFiles(false)
      })()
    }
    return () => { cancelled = true }
  }, [store, ready, activeCategory, activeFormat])

  const loadFiles = async (): Promise<UploadedFile[]> => {
    if (!store) return []
    
    try {
      // Convert session items to uploaded files format
      const files: UploadedFile[] = []
      const validItems: ImageItem[] = []
      
      for (const item of store.items) {
        try {
          // Get the actual file for preview
          const file = await store.storage.getFile(item.opfsPath)
          const url = URL.createObjectURL(file)
          
          files.push({
            id: item.id,
            name: item.originalName,
            size: item.bytes,
            type: item.mime,
            url: url,
            category: (item.category || 'affiliate') as const,
            format: (item.format || '9:16') as const,
            uploadDate: new Date(item.createdAt)
          })
          
          // Keep track of valid items
          validItems.push(item)
        } catch (error) {
          // Silently skip invalid files - don't spam console
          // Only log if it's not a "file not found" error
          if (!error.message?.includes('could not be found')) {
            console.debug(`Skipping invalid file ${item.originalName}:`, error)
          }
        }
      }
      
      // If we have invalid items, clean up the store
      if (validItems.length !== store.items.length) {
        console.log(`Cleaning up ${store.items.length - validItems.length} invalid files from session`)
        // Update the store with only valid items
        store.items = validItems
        await store.save()
      }
      
      // If no valid files remain, clear the entire session
      if (validItems.length === 0 && store.items.length > 0) {
        console.log('No valid files found, clearing entire session')
        store.items = []
        await store.save()
      }
      
      console.log(`Loaded ${files.length} files from OPFS storage (${store.items.length} items in manifest)`)
      
      // Debug: Check for manifest vs OPFS mismatches
      if (files.length !== store.items.length) {
        console.warn(`Mismatch: ${files.length} files loaded vs ${store.items.length} items in manifest`)
        const loadedIds = new Set(files.map(f => f.id))
        const missingItems = store.items.filter(item => !loadedIds.has(item.id))
        console.warn('Missing files:', missingItems.map(item => ({ name: item.originalName, path: item.opfsPath })))
      }
      
      // Debug: Check AI Method files specifically
      const aiMethodFiles = files.filter(f => f.category === 'ai-method')
      console.log(`AI Method files found: ${aiMethodFiles.length}`)
      if (aiMethodFiles.length > 0) {
        const formatDist = aiMethodFiles.reduce((acc, f) => {
          acc[f.format] = (acc[f.format] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log('AI Method format distribution:', JSON.stringify(formatDist, null, 2))
      }
      
      return files
    } catch (error) {
      console.error('Failed to load files:', error)
      return []
    }
  }

  // Pure helper that DOES NOT close over state
  const getFilesByCategory = useCallback(
    (files: UploadedFile[], category: string, format: UploadedFile["format"]) =>
      files.filter(f => f.category === category && f.format === format),
    []
  )

  // Derived view-model recomputes when inputs change
  const categoryFiles = useMemo(
    () => getFilesByCategory(uploadedFiles, activeCategory, activeFormat),
    [getFilesByCategory, uploadedFiles, activeCategory, activeFormat]
  )

  // Safe logging after hydration
  useEffect(() => {
    if (!isLoadingFiles) {
      console.log(
        `categoryFiles for ${activeCategory}-${activeFormat}: ${categoryFiles.length} / ${uploadedFiles.length} total`
      )
      console.log('Sample uploadedFiles:', uploadedFiles.slice(0, 3).map(f => ({ name: f.name, category: f.category, format: f.format })))
      console.log('Sample categoryFiles:', categoryFiles.slice(0, 3).map(f => ({ name: f.name, category: f.category, format: f.format })))
    }
  }, [isLoadingFiles, activeCategory, activeFormat, categoryFiles, uploadedFiles])

  // Filter files based on search query (within current category/format)
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return categoryFiles
    return categoryFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categoryFiles, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex)

  // Storage statistics (for current category/format)
  const storageStats = useMemo(() => {
    const totalFiles = categoryFiles.length
    const totalSize = categoryFiles.reduce((sum, file) => sum + file.size, 0)
    return { totalFiles, totalSize }
  }, [categoryFiles])

  // Check if there are any files in the current category/format (for DELETE ALL button visibility)
  const hasFilesInCurrentSection = useMemo(() => {
    if (!store) {
      return false
    }
    
    const hasFiles = store.items.some(item => {
      const itemCategory = item.category || 'affiliate'
      const itemFormat = item.format || '9:16'
      return itemCategory === activeCategory && itemFormat === activeFormat
    })
    
    return hasFiles
  }, [store, activeCategory, activeFormat])

  // Handle delete all files in current category/format
  const handleDeleteAll = useCallback(async () => {
    if (!store) {
      console.log('No store available')
      return
    }
    
    console.log(`Attempting to delete files in ${activeCategory}-${activeFormat}`)
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete all files in ${activeCategory} (${activeFormat})? This action cannot be undone.`
    )
    
    if (!confirmDelete) {
      console.log('User cancelled deletion')
      return
    }
    
    try {
      const deletedCount = await store.removeItemsByCategoryAndFormat(activeCategory, activeFormat)
      console.log(`Successfully deleted ${deletedCount} files from ${activeCategory}-${activeFormat}`)
      // Rehydrate uploadedFiles BEFORE rendering/using them
      const refreshed = await loadFiles()
      setUploadedFiles(refreshed)
    } catch (error) {
      console.error('Failed to delete files:', error)
      alert('Failed to delete files. Please try again.')
    }
  }, [store, activeCategory, activeFormat])

  // Handle file upload
  const handleFiles = useCallback(async (files: File[]) => {
    if (!store) {
      console.log('No store available for handleFiles')
      return
    }

    console.log(`handleFiles called with ${files.length} files, category=${activeCategory}, format=${activeFormat}`)
    console.log('Store details:', { 
      storeId: store.id, 
      itemsCount: store.items.length,
      storage: !!store.storage 
    })
    setIsUploading(true)
    setUploadProgress(0)
    
    // Filter only image and video files (including HEIC)
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    )


      try {
        
        await store.importFiles(validFiles, activeCategory, activeFormat, (done, total) => {
          setUploadProgress((done / total) * 100)
        })
        
        // Rehydrate uploadedFiles BEFORE rendering/using them
        const refreshed = await loadFiles()
        setUploadedFiles(refreshed)
      } catch (error) {
        console.error('Failed to upload files:', error)
        console.error('Error details:', error)
        alert(`Failed to upload files: ${error.message || 'Unknown error'}`)
      }
    
    setIsUploading(false)
    setUploadProgress(0)
  }, [store, activeCategory, activeFormat])

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  // Handle folder input change
  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  // Remove file
  const removeFile = async (id: string) => {
    if (!store) return
    
    try {
      await store.removeItem(id)
      // Rehydrate uploadedFiles BEFORE rendering/using them
      const refreshed = await loadFiles()
      setUploadedFiles(refreshed)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading storage system...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to initialize storage system</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Content Library
          </h1>
          <p 
            className="text-lg"
            style={{ color: colors.textMuted }}
          >
            Manage your uploaded images and videos
          </p>
        </div>

        {/* Category & Format Selector */}
        <div 
          className="p-6 rounded-2xl border"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Selection */}
            <div>
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colors.textMuted }}
              >
                Content Type
              </h3>
              <div className="flex space-x-2">
                {(['affiliate', 'ai-method'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 ${
                      activeCategory === category ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: activeCategory === category ? colors.accent : colors.surface2,
                      borderColor: activeCategory === category ? colors.accent : colors.border,
                      color: activeCategory === category ? 'white' : colors.text
                    }}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {category === 'affiliate' ? 'Affiliate Content' : 'AI Method Content'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <h3 
                className="text-sm font-semibold mb-3 uppercase tracking-wide"
                style={{ color: colors.textMuted }}
              >
                Aspect Ratio
              </h3>
              <div className="flex space-x-2">
                {(['9:16', '3:4'] as const).map((format) => {
                  const formatFiles = getFilesByCategory(uploadedFiles, activeCategory, format)
                  return (
                    <button
                      key={format}
                      onClick={() => setActiveFormat(format)}
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 ${
                        activeFormat === format ? 'shadow-sm' : ''
                      }`}
                      style={{
                        backgroundColor: activeFormat === format ? colors.accent : colors.surface2,
                        borderColor: activeFormat === format ? colors.accent : colors.border,
                        color: activeFormat === format ? 'white' : colors.text
                      }}
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium">{format}</div>
                        <div className="text-xs opacity-75">{formatFiles.length} files</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.textMuted }}
                >
                  Total Files
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: colors.text }}
                >
                  {storageStats.totalFiles}
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: colors.textMuted }}
                >
                  Stored in OPFS
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.surface2 }}
              >
                <FileIcon size="lg" color={colors.accent} />
              </div>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.textMuted }}
                >
                  Storage Used
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: colors.text }}
                >
                  {formatFileSize(storageStats.totalSize)}
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: colors.textMuted }}
                >
                  Local storage
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.surface2 }}
              >
                <FolderIcon size="lg" color={colors.accent} />
              </div>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: colors.textMuted }}
                >
                  Session
                </p>
                <p 
                  className="text-lg font-bold font-mono"
                  style={{ color: colors.text }}
                >
                  {store?.id.slice(0, 8)}...
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: colors.textMuted }}
                >
                  Active session
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.surface2 }}
              >
                <UploadIcon size="lg" color={colors.accent} />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div 
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            dragActive ? 'scale-[1.02]' : ''
          }`}
          style={{
            borderColor: dragActive ? colors.accent : colors.border,
            backgroundColor: dragActive ? colors.surface2 : colors.surface
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="relative p-12 text-center">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: dragActive ? colors.accent : colors.surface2,
                color: dragActive ? 'white' : colors.textMuted
              }}
            >
              <UploadIcon size="xl" />
            </div>
            
            <h3 
              className="text-2xl font-bold mb-3"
              style={{ color: colors.text }}
            >
              {dragActive ? 'Drop files here!' : 'Upload your content'}
            </h3>
            
            <p 
              className="mb-6 max-w-md mx-auto"
              style={{ color: colors.textMuted }}
            >
              Drag & drop {activeCategory === 'affiliate' ? 'affiliate' : 'AI method'} content for {activeFormat} format, or click to browse files or folders
            </p>
            
            <input
              type="file"
              multiple
              accept="image/*,video/*,.heic,.heif"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            
            <input
              type="file"
              multiple
              webkitdirectory=""
              directory=""
              onChange={handleFolderInputChange}
              className="hidden"
              id="folder-upload"
            />
            
            <div className="flex gap-3 justify-center">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: colors.accent,
                  color: 'white'
                }}
              >
                <PlusIcon size="sm" />
                Choose Files
              </label>
              
              <label
                htmlFor="folder-upload"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                  borderWidth: '1px',
                  color: colors.text
                }}
              >
                <FolderIcon size="sm" />
                Choose Folder
              </label>
            </div>
            
            <p 
              className="text-xs mt-4"
              style={{ color: colors.textMuted }}
            >
              Supports images and videos • Max 50MB per file • Folder upload preserves structure
            </p>
          </div>
          
          {/* Upload Progress */}
          {isUploading && (
            <div 
              className="absolute bottom-0 left-0 right-0 p-6 backdrop-blur-sm"
              style={{ backgroundColor: colors.surface }}
            >
              <div className="flex items-center justify-between mb-3">
                <span 
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Uploading files...
                </span>
                <span 
                  className="text-sm font-bold"
                  style={{ color: colors.accent }}
                >
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div 
                className="w-full rounded-full h-3 overflow-hidden"
                style={{ backgroundColor: colors.surface2 }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${uploadProgress}%`,
                    backgroundColor: colors.accent
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div 
          className="p-6 rounded-2xl border"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon 
                size="sm" 
                className="absolute left-4 top-1/2 transform -translate-y-1/2" 
                color={colors.textMuted}
              />
              <input
                type="text"
                placeholder="Search your files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                style={{
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 rounded-xl border transition-all duration-200 ${
                  viewMode === 'grid' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? colors.accent : colors.surface2,
                  borderColor: viewMode === 'grid' ? colors.accent : colors.border,
                  color: viewMode === 'grid' ? 'white' : colors.text
                }}
              >
                <div className="flex items-center gap-2">
                  <GridIcon size="sm" />
                  <span className="text-sm font-medium">Grid</span>
                </div>
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 rounded-xl border transition-all duration-200 ${
                  viewMode === 'list' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? colors.accent : colors.surface2,
                  borderColor: viewMode === 'list' ? colors.accent : colors.border,
                  color: viewMode === 'list' ? 'white' : colors.text
                }}
              >
                <div className="flex items-center gap-2">
                  <ListIcon size="sm" />
                  <span className="text-sm font-medium">List</span>
                </div>
              </button>
              
              {hasFilesInCurrentSection && (
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-3 rounded-xl border transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    color: 'white'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <TrashIcon size="sm" />
                    <span className="text-sm font-medium">Delete All</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Files Grid/List */}
        {paginatedFiles.length === 0 ? (
          <div 
            className="p-16 text-center rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: colors.surface2 }}
            >
              <FileIcon size="xl" color={colors.textMuted} />
            </div>
            <h3 
              className="text-2xl font-bold mb-3"
              style={{ color: colors.text }}
            >
              {searchQuery ? 'No files found' : 'No files yet'}
            </h3>
            <p 
              className="mb-6 max-w-md mx-auto"
              style={{ color: colors.textMuted }}
            >
              {searchQuery 
                ? 'Try adjusting your search terms or upload some files to get started' 
                : 'Upload your first files to start building your content library'
              }
            </p>
            {!searchQuery && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  style={{
                    backgroundColor: colors.accent,
                    color: 'white'
                  }}
                >
                  <PlusIcon size="sm" />
                  Upload Files
                </button>
                
                <button
                  onClick={() => document.getElementById('folder-upload')?.click()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  style={{
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    borderWidth: '1px',
                    color: colors.text
                  }}
                >
                  <FolderIcon size="sm" />
                  Upload Folder
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }}
            >
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
                : 'space-y-3'
              }>
                {paginatedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                      viewMode === 'grid' 
                        ? 'aspect-square' 
                        : 'flex items-center gap-4 p-4'
                    }`}
                    style={{
                      backgroundColor: colors.surface2,
                      borderColor: colors.border
                    }}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        {/* Grid View */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={file.url} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style="background-color: ${colors.surface}">
                                      <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" style="color: ${colors.textMuted}">
                                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                      </svg>
                                    </div>
                                  `
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: colors.surface }}
                            >
                              {file.type.startsWith('video/') ? (
                                <VideoIcon size="lg" color={colors.textMuted} />
                              ) : (
                                <FileIcon size="lg" color={colors.textMuted} />
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <TrashIcon size="sm" />
                            </button>
                          </div>
                        </div>
                        
                        {/* File Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-xs font-medium truncate">{file.name}</p>
                          <p className="text-gray-300 text-xs">{formatFileSize(file.size)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* List View */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-lg">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={file.url} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.style.backgroundColor = colors.accent
                                  parent.innerHTML = `
                                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                  `
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: colors.accent }}
                            >
                              {file.type.startsWith('video/') ? (
                                <VideoIcon size="lg" color="white" />
                              ) : (
                                <FileIcon size="lg" color="white" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-semibold truncate"
                            style={{ color: colors.text }}
                          >
                            {file.name}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: colors.textMuted }}
                          >
                            {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <TrashIcon size="sm" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div 
                className="p-6 rounded-2xl border"
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="text-sm"
                    style={{ color: colors.textMuted }}
                  >
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredFiles.length)} of {filteredFiles.length} files
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{
                        backgroundColor: colors.surface2,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        const isActive = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              isActive ? 'shadow-sm' : ''
                            }`}
                            style={{
                              backgroundColor: isActive ? colors.accent : colors.surface2,
                              color: isActive ? 'white' : colors.text
                            }}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{
                        backgroundColor: colors.surface2,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
