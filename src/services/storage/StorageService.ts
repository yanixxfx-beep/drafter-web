export type UploadIntentInput = {
  workspaceId: string
  kind: 'source'|'export'|'thumb'
  file: File
}

export type UploadedRef = { bucket: 'user'; storageKey: string }

export interface StorageService {
  uploadFile(input: UploadIntentInput): Promise<UploadedRef>
  getSignedUrl(bucket: 'user'|'system', storageKey: string, ttl?: number): Promise<string>
}
