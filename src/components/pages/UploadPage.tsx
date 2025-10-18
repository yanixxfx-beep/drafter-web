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
import * as SimpleStorage from '@/lib/simpleStorage'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  category: 'affiliate' | 'ai-method'
  uploadDate: Date
}

const ITEMS_PER_PAGE = 50

export function UploadPage() {
  const { colors } = useTheme()
  const [dragActive, setDragActive] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'affiliate' | 'ai-method'>('affiliate')
  const [activeFormat, setActiveFormat] = useState<'9:16' | '3:4'>('9:16')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUploading, setIsUploading] = useState(false)
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 })

  // Load files from storage on mount and category/format change
  useEffect(() => {
    loadFiles()
  }, [activeCategory, activeFormat])

  const loadFiles = async () => {
    try {
      // Load all files from all categories to support stats display
      const allStoredFiles = await SimpleStorage.getAllFiles()
      const files: UploadedFile[] = allStoredFiles.map(sf => ({
        id: sf.id,
        name: sf.name,
        size: sf.size,
        type: sf.type,
        url: sf.url,
        category: sf.category.split('-')[0] as 'affiliate' | 'ai-method',
        uploadDate: new Date(sf.uploadedAt),
      }))
      setUploadedFiles(files)
      console.log(`Loaded ${files.length} files from storage`)
      console.log('Loaded files:', files)
      
      // Debug: Check current category/format
      console.log('Current category:', activeCategory, 'format:', activeFormat)
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Process folder upload
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = useCallback(async (files: File[]) => {
    setIsUploading(true)
    
    // Filter only image and video files
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    try {
      // Save files to storage (creates object URLs)
      const categoryKey = `${activeCategory}-${activeFormat}`
      const savedFiles = await SimpleStorage.saveFiles(validFiles, categoryKey)

      // Reload files from storage
      loadFiles()

      console.log(`Uploaded ${savedFiles.length} files to ${categoryKey} category`)
      console.log('Saved files:', savedFiles)
      
      // Debug: Check what's in storage after upload
      const allFiles = await SimpleStorage.getAllFiles()
      console.log('All files in storage:', allFiles)
    } catch (error) {
      console.error('Failed to upload files:', error)
      alert('Failed to upload files. Please try again.')
    }
    
    setIsUploading(false)
  }, [activeCategory, activeFormat])

  const removeFile = async (id: string) => {
    try {
      // Delete from storage
      await SimpleStorage.deleteFile(id)
      
      // Reload files
      loadFiles()
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const getFilesByCategoryLocal = (categoryKey: string) => {
    // Since we store the full category key (e.g., "affiliate-9:16") in the file metadata,
    // we need to find files that match this exact category key
    return uploadedFiles.filter(file => {
      // The file.category in uploadedFiles contains the base category (affiliate/ai-method)
      // but we need to match against the full category key
      // We need to check if this file belongs to the specific category-format combination
      
      // Get all stored files to find the full category key for this file
      const storedFiles = SimpleStorage.getMetadata()
      const storedFile = storedFiles.find(sf => sf.id === file.id)
      
      if (storedFile) {
        return storedFile.category === categoryKey
      }
      
      // Fallback: if we can't find the stored file, use the base category
      return file.category === categoryKey.split('-')[0]
    })
  }

  const filteredFiles = useMemo(() => {
    const categoryKey = `${activeCategory}-${activeFormat}`
    const categoryFiles = getFilesByCategoryLocal(categoryKey)
    if (!searchQuery) return categoryFiles
    
    return categoryFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [uploadedFiles, activeCategory, activeFormat, searchQuery])

  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredFiles, currentPage])

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.startsWith('video/')) return VideoIcon
    if (type.includes('pdf') || type.includes('document')) return DocumentIcon
    return FileIcon
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Content Management
          </h1>
          <p className="text-lg" style={{ color: colors.textMuted }}>
            Upload and organize your content for generation
          </p>
        </div>

        {/* Info Banner */}
        <div 
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.accent,
            borderLeftColor: colors.accent
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: colors.accent }}>
                Session Storage
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Files are stored in browser memory for this session. Upload once at the start, keep tab open while working.
              </p>
              <p className="text-sm mt-2 font-medium" style={{ color: colors.text }}>
                💡 Files will clear on: refresh, close tab, or clear cache
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Main Category Selection */}
          <div 
            className="flex rounded-lg border"
            style={{ borderColor: colors.border }}
          >
            <button
              onClick={() => {
                setActiveCategory('affiliate')
                setCurrentPage(1)
              }}
              className={`px-6 py-3 rounded-l-lg font-medium transition-colors ${
                activeCategory === 'affiliate' ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: activeCategory === 'affiliate' ? colors.accent : 'transparent',
                color: activeCategory === 'affiliate' ? 'white' : colors.textMuted
              }}
            >
              Affiliate Content
            </button>
            <button
              onClick={() => {
                setActiveCategory('ai-method')
                setCurrentPage(1)
              }}
              className={`px-6 py-3 rounded-r-lg font-medium transition-colors ${
                activeCategory === 'ai-method' ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: activeCategory === 'ai-method' ? colors.accent : 'transparent',
                color: activeCategory === 'ai-method' ? 'white' : colors.textMuted
              }}
            >
              AI Method Content
            </button>
          </div>
          
          {/* Format Selection */}
          <div 
            className="flex rounded-lg border"
            style={{ borderColor: colors.border }}
          >
            <button
              onClick={() => {
                setActiveFormat('9:16')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-l-lg text-sm font-medium transition-colors ${
                activeFormat === '9:16' ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: activeFormat === '9:16' ? colors.accent : 'transparent',
                color: activeFormat === '9:16' ? 'white' : colors.textMuted
              }}
            >
              9:16 ({getFilesByCategoryLocal(`${activeCategory}-9:16`).length})
            </button>
            <button
              onClick={() => {
                setActiveFormat('3:4')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-r-lg text-sm font-medium transition-colors ${
                activeFormat === '3:4' ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: activeFormat === '3:4' ? colors.accent : 'transparent',
                color: activeFormat === '3:4' ? 'white' : colors.textMuted
              }}
            >
              3:4 ({getFilesByCategoryLocal(`${activeCategory}-3:4`).length})
            </button>
          </div>
        </div>

        {/* Category Description */}
        <div className="text-center mb-8">
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {activeCategory === 'affiliate' 
              ? 'Upload images for your first slides (slides 1-N-1) - product images, lifestyle shots, etc.'
              : 'Upload background images for your last slides - abstract backgrounds, patterns, etc.'
            }
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors mb-8 ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
          style={{
            backgroundColor: dragActive ? `${colors.accent}10` : colors.surface,
            borderColor: dragActive ? colors.accent : colors.border,
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <UploadIcon size="xl" color={colors.textMuted} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            {isUploading ? 'Uploading...' : `Drag & Drop ${activeCategory === 'affiliate' ? 'Affiliate' : 'AI Method'} Content (${activeFormat}) Here`}
          </h3>
          <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
            or click to browse your computer
          </p>
          
          <div className="flex gap-4 justify-center">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 rounded-lg cursor-pointer"
              style={{ 
                backgroundColor: colors.accent, 
                color: 'white' 
              }}
            >
              Choose Files
            </label>

            <input
              type="file"
              multiple
              webkitdirectory=""
              directory=""
              onChange={handleFolderInput}
              className="hidden"
              id="folder-upload"
            />
            <label
              htmlFor="folder-upload"
              className="inline-block px-6 py-3 rounded-lg cursor-pointer border"
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }}
            >
              <FolderIcon size="sm" className="inline mr-2" />
              Choose Folder
            </label>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: colors.accent,
                    width: '60%'
                  }}
                ></div>
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                Processing files... This may take a moment for large folders.
              </p>
            </div>
          )}
        </div>

        {/* Search and Controls */}
        {filteredFiles.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <SearchIcon 
                size="sm" 
                color={colors.textMuted} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              />
              <input
                type="text"
                placeholder={`Search ${activeCategory === 'affiliate' ? 'affiliate' : 'AI method'} content...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
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
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' ? 'bg-opacity-20' : ''
                }`}
                style={{ 
                  backgroundColor: viewMode === 'grid' ? `${colors.accent}20` : colors.surface2,
                  color: viewMode === 'grid' ? colors.accent : colors.textMuted
                }}
              >
                <GridIcon size="sm" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' ? 'bg-opacity-20' : ''
                }`}
                style={{ 
                  backgroundColor: viewMode === 'list' ? `${colors.accent}20` : colors.surface2,
                  color: viewMode === 'list' ? colors.accent : colors.textMuted
                }}
              >
                <ListIcon size="sm" />
              </button>
            </div>
          </div>
        )}

        {/* File Grid/List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              {activeCategory === 'affiliate' ? 'Affiliate Content' : 'AI Method Content'} ({activeFormat}) 
              ({filteredFiles.length} files)
            </h3>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {filteredFiles.reduce((total, file) => total + file.size, 0) > 0 && 
                `Total: ${formatFileSize(filteredFiles.reduce((total, file) => total + file.size, 0))}`
              }
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div 
              className="text-center py-12 rounded-lg border-2 border-dashed"
              style={{ 
                backgroundColor: colors.surface2, 
                borderColor: colors.border 
              }}
            >
              <FolderIcon size="xl" color={colors.textMuted} className="mx-auto mb-4" />
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {searchQuery 
                  ? `No files found matching "${searchQuery}"`
                  : `No ${activeCategory === 'affiliate' ? 'affiliate' : 'AI method'} content uploaded yet`
                }
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {paginatedFiles.map((file) => {
                    const FileIconComponent = getFileIcon(file.type)
                    return (
                      <div
                        key={file.id}
                        className="relative group rounded-lg border overflow-hidden"
                        style={{ 
                          backgroundColor: colors.surface, 
                          borderColor: colors.border 
                        }}
                      >
                        <div className="aspect-square flex items-center justify-center p-4">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                              loading="lazy"
                            />
                          ) : (
                            <FileIconComponent size="lg" color={colors.textMuted} />
                          )}
                        </div>
                        
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" style={{ color: colors.text }}>
                            {file.name}
                          </p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="p-2 rounded-full"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <EyeIcon size="sm" color="white" />
                          </button>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-2 rounded-full"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <TrashIcon size="sm" color="white" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedFiles.map((file) => {
                    const FileIconComponent = getFileIcon(file.type)
                    return (
                      <div
                        key={file.id}
                        className="flex items-center p-4 rounded-lg border group"
                        style={{ 
                          backgroundColor: colors.surface, 
                          borderColor: colors.border 
                        }}
                      >
                        <div className="w-12 h-12 flex items-center justify-center mr-4">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover rounded"
                              loading="lazy"
                            />
                          ) : (
                            <FileIconComponent size="lg" color={colors.textMuted} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: colors.text }}>
                            {file.name}
                          </p>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <EyeIcon size="sm" color="white" />
                          </button>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            <TrashIcon size="sm" color="white" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: currentPage === 1 ? colors.surface2 : colors.buttonBg, 
                      color: colors.text 
                    }}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          currentPage === page ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: currentPage === page ? colors.accent : colors.surface2,
                          color: currentPage === page ? 'white' : colors.text
                        }}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: currentPage === totalPages ? colors.surface2 : colors.buttonBg, 
                      color: colors.text 
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}
          >
            <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Affiliate Content
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Files:</span>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  {(getFilesByCategoryLocal('affiliate-9:16').length + getFilesByCategoryLocal('affiliate-3:4').length).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Size:</span>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  {formatFileSize(
                    [...getFilesByCategoryLocal('affiliate-9:16'), ...getFilesByCategoryLocal('affiliate-3:4')]
                      .reduce((total, file) => total + file.size, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}
          >
            <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              AI Method Content
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Files:</span>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  {(getFilesByCategoryLocal('ai-method-9:16').length + getFilesByCategoryLocal('ai-method-3:4').length).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Size:</span>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  {formatFileSize(
                    [...getFilesByCategoryLocal('ai-method-9:16'), ...getFilesByCategoryLocal('ai-method-3:4')]
                      .reduce((total, file) => total + file.size, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div 
            className="p-6 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}
          >
            <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Storage Usage
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Total Files:</span>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  {uploadedFiles.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Storage:</span>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  In-Memory
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  Note: Files are stored in browser memory. For persistent storage, we'll add cloud upload later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}