'use client'

import { useState } from 'react'
import { SupabaseStorageService } from '@/services/storage/SupabaseStorageService'
import { useSession } from 'next-auth/react'

export default function CloudUploadExample() {
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const storageService = new SupabaseStorageService()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user?.email) {
      setError('Please sign in to upload files')
      return
    }

    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      // Create or get workspace for this user
      let workspaceId = 'default-workspace'
      
      try {
        // Try to create a workspace
        const workspaceResponse = await fetch('/api/workspace/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Workspace' })
        })
        
        if (workspaceResponse.ok) {
          const workspace = await workspaceResponse.json()
          workspaceId = workspace.id
        }
      } catch (err) {
        console.log('Using default workspace ID')
      }

      for (const file of files) {
        const result = await storageService.uploadFile({
          workspaceId,
          kind: 'source', // or 'export' or 'thumb'
          file
        })

        setUploadedFiles(prev => [...prev, result.storageKey])
        console.log('File uploaded successfully:', result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const getSignedUrl = async (storageKey: string) => {
    try {
      const url = await storageService.getSignedUrl('user', storageKey)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get file URL')
    }
  }

  if (!session) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-gray-600">Please sign in to use cloud storage</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Cloud Storage Example</h3>
      
      <div>
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {uploading && (
        <div className="text-blue-600">Uploading files...</div>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded">
          Error: {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((storageKey, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{storageKey}</span>
                <button
                  onClick={() => getSignedUrl(storageKey)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
