// Session store for OPFS-based file management
import { OPFSStorage } from "../storage/opfs";
import { StorageProvider } from "../storage/provider";
import { SessionManifest, ImageItem } from "./manifest";
import { sha256OfBlob } from "../utils/hash";

export class SessionStore {
  private storage: StorageProvider;
  private manifest!: SessionManifest;
  private manifestPath!: string;
  public readonly id: string;

  constructor(id?: string, storage: StorageProvider = new OPFSStorage()) {
    this.storage = storage;
    this.id = id ?? crypto.randomUUID();
    this.manifestPath = `sessions/${this.id}/manifest.json`;
  }

  async init(name?: string) {
    if (await this.storage.exists(this.manifestPath)) {
      const buf = await this.storage.read(this.manifestPath);
      const text = new TextDecoder().decode(buf);
      this.manifest = JSON.parse(text);
    } else {
      const now = new Date().toISOString();
      this.manifest = { version: 1, id: this.id, name, createdAt: now, updatedAt: now, items: [] };
      await this.flush();
    }
    localStorage.setItem("drafter:lastSession", this.id);
    return this.manifest;
  }

  get items() { return this.manifest.items; }

  async importFiles(files: File[], category: 'affiliate' | 'ai-method' = 'affiliate', format: '9:16' | '3:4' = '9:16', onProgress?: (done: number, total: number) => void) {
    console.log(`SessionStore.importFiles called with category=${category}, format=${format}, files=${files.length}`)
    let done = 0;
    for (const file of files) {
      const id = await sha256OfBlob(file);
      // Check for duplicates based on file ID AND category/format combination
      if (this.manifest.items.find(x => x.id === id && x.category === category && x.format === format)) {
        done++; 
        onProgress?.(done, files.length); 
        continue;
      }
      
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const rawPath = `sessions/${this.id}/raw/${id}.${ext}`;

      await this.storage.put(rawPath, file);

      // Skip thumbnail generation for now due to worker transferability issues
      // TODO: Fix worker transferability and re-enable thumbnails
      let width = 0, height = 0;
      const thumbPath = undefined; // No thumbnails for now

      this.manifest.items.push({
        id,
        originalName: file.name,
        mime: file.type || "application/octet-stream",
        bytes: file.size,
        width, height,
        opfsPath: rawPath,
        thumbPath,
        createdAt: new Date().toISOString(),
        category: category,
        format: format,
      });
      
      console.log(`Added file ${file.name} with category=${category}, format=${format}`)

      if (++done % 20 === 0) await this.flush();
      onProgress?.(done, files.length);
    }
    await this.flush();
    
    // Debug: Log final manifest items for this category/format
    const categoryItems = this.manifest.items.filter(item => item.category === category && item.format === format)
    console.log(`Final manifest has ${categoryItems.length} items for ${category}-${format}:`, 
      categoryItems.map(item => item.originalName))
    console.log(`Added ${files.length} new files to existing ${categoryItems.length - files.length} files`)
  }

  async flush() {
    this.manifest.updatedAt = new Date().toISOString();
    const buf = new TextEncoder().encode(JSON.stringify(this.manifest));
    await this.storage.put(this.manifestPath, buf);
  }

  async removeItem(id: string) {
    const item = this.manifest.items.find(x => x.id === id);
    if (!item) return;
    
    if (item.thumbPath) await this.storage.remove(item.thumbPath);
    await this.storage.remove(item.opfsPath);
    
    this.manifest.items = this.manifest.items.filter(x => x.id !== id);
    await this.flush();
  }

  async removeItemsByCategoryAndFormat(category: 'affiliate' | 'ai-method', format: '9:16' | '3:4') {
    console.log(`Removing items for ${category}-${format}`)
    console.log('Current manifest items:', this.manifest.items.map(item => ({ 
      id: item.id, 
      category: item.category, 
      format: item.format 
    })))
    
    // Use the same logic as the visibility check - with fallback defaults
    const itemsToRemove = this.manifest.items.filter(item => {
      const itemCategory = item.category || 'affiliate'
      const itemFormat = item.format || '9:16'
      const matches = itemCategory === category && itemFormat === format
      console.log(`Item ${item.originalName}: category=${itemCategory}, format=${itemFormat}, matches=${matches}`)
      return matches
    });
    
    console.log(`Found ${itemsToRemove.length} items to remove:`, itemsToRemove.map(item => ({ 
      id: item.id, 
      category: item.category, 
      format: item.format 
    })))
    
    for (const item of itemsToRemove) {
      try {
        if (item.thumbPath) await this.storage.remove(item.thumbPath);
        await this.storage.remove(item.opfsPath);
        console.log(`Removed file: ${item.originalName}`)
      } catch (error) {
        console.error(`Failed to remove file ${item.originalName}:`, error)
      }
    }
    
    // Use the same filtering logic for removal
    this.manifest.items = this.manifest.items.filter(item => {
      const itemCategory = item.category || 'affiliate'
      const itemFormat = item.format || '9:16'
      return !(itemCategory === category && itemFormat === format)
    });
    
    console.log(`After removal, ${this.manifest.items.length} items remain`)
    
    await this.flush();
    return itemsToRemove.length;
  }

  async getFile(id: string): Promise<File | null> {
    const item = this.manifest.items.find(x => x.id === id);
    if (!item) return null;
    
    try {
      return await this.storage.getFile(item.opfsPath);
    } catch {
      return null;
    }
  }

  async getThumbnail(id: string): Promise<File | null> {
    const item = this.manifest.items.find(x => x.id === id);
    if (!item?.thumbPath) return null;
    
    try {
      return await this.storage.getFile(item.thumbPath);
    } catch {
      return null;
    }
  }
}
