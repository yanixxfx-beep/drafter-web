// Storage abstraction interface for OPFS and future cloud providers
export interface PutResult { 
  path: string; 
  size: number; 
}

export interface StorageProvider {
  put(path: string, data: Blob | ArrayBuffer | Uint8Array): Promise<PutResult>;
  getFile(path: string): Promise<File>;        // for object URLs / previews
  getFileHandle?(path: string): Promise<FileSystemFileHandle>; // for OPFS file handles
  read(path: string): Promise<ArrayBuffer>;    // raw bytes if needed
  list(prefix: string): Promise<string[]>;     // shallow list of paths
  remove(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

