import { supabaseClient } from '@/lib/supabase.client'
import { StorageService, UploadIntentInput, UploadedRef } from './StorageService'

export class SupabaseStorageService implements StorageService {
  async uploadFile(input: UploadIntentInput): Promise<UploadedRef> {
    const { workspaceId, kind, file } = input
    
    // Get upload intent
    const intentResponse = await fetch('/api/upload-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        kind,
        mime: file.type,
        bytes: file.size,
        filename: file.name
      })
    })

    if (!intentResponse.ok) {
      throw new Error(`Upload intent failed: ${intentResponse.statusText}`)
    }

    const { bucket, path, token } = await intentResponse.json()

    // Upload file to Supabase
    const { error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file)

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Confirm upload
    const confirmResponse = await fetch('/api/upload-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        storageKey: path,
        kind,
        mime: file.type,
        bytes: file.size
      })
    })

    if (!confirmResponse.ok) {
      throw new Error(`Upload confirm failed: ${confirmResponse.statusText}`)
    }

    return { bucket, storageKey: path }
  }

  async getSignedUrl(bucket: 'user'|'system', storageKey: string, ttl: number = 900): Promise<string> {
    const response = await fetch(`/api/signed-url?bucket=${bucket}&storageKey=${storageKey}&expiresIn=${ttl}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.statusText}`)
    }

    const { url } = await response.json()
    return url
  }
}

