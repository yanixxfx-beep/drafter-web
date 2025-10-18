// Session manifest types for OPFS storage
export type ImageItem = {
  id: string;                   // sha256 or uuid
  originalName: string;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  opfsPath: string;             // sessions/<id>/raw/<id>.<ext>
  thumbPath?: string;           // sessions/<id>/thumbs/<id>.webp
  createdAt: string;
  category?: 'affiliate' | 'ai-method';  // Category for organization
  format?: '9:16' | '3:4';              // Format for filtering
};

export type SessionManifest = {
  version: 1;
  id: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  items: ImageItem[];
  meta?: Record<string, any>;   // your text preset refs etc.
};
