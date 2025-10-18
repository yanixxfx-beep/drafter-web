// OPFS implementation for cloudless, fast, restart-safe storage
import { StorageProvider, PutResult } from "./provider";
import { splitPath } from "./paths";

async function getRootDir() {
  // OPFS root; no permissions required in Chromium-based browsers
  return await (navigator as any).storage.getDirectory();
}

async function getDirHandle(path: string, create = true): Promise<FileSystemDirectoryHandle> {
  const root = await getRootDir();
  const parts = splitPath(path).dirs;
  let dir: FileSystemDirectoryHandle = root;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create });
  }
  return dir;
}

async function getFileHandle(path: string, create = true): Promise<FileSystemFileHandle> {
  const { file } = splitPath(path);
  const dir = await getDirHandle(path, create);
  const fileHandle = await dir.getFileHandle(file, { create });
  return fileHandle;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const { file } = splitPath(path);
    const dir = await getDirHandle(path, false);
    await dir.getFileHandle(file);
    return true;
  } catch {
    return false;
  }
}

export class OPFSStorage implements StorageProvider {
  async put(path: string, data: Blob | ArrayBuffer | Uint8Array): Promise<PutResult> {
    const fh = await getFileHandle(path, true);
    // Atomic: the write swaps into place on close()
    const w = await (fh as any).createWritable();
    if (data instanceof Blob) {
      if ((w as any).write) {
        await (w as WritableStream).write(data);
      } else {
        await (w as any).write(data);
      }
    } else {
      await (w as any).write(data);
    }
    await (w as any).close();
    const f = await fh.getFile();
    return { path, size: f.size };
  }

  async getFile(path: string): Promise<File> {
    const fh = await getFileHandle(path, false);
    return await fh.getFile();
  }

  async getFileHandle(path: string): Promise<FileSystemFileHandle> {
    return await getFileHandle(path, false);
  }

  async read(path: string): Promise<ArrayBuffer> {
    const f = await this.getFile(path);
    return await f.arrayBuffer();
  }

  async list(prefix: string): Promise<string[]> {
    const dir = await getDirHandle(prefix.endsWith("/") ? prefix : `${prefix}/`, false);
    const out: string[] = [];
    for await (const entry of (dir as any).values()) {
      out.push(entry.kind === "file" ? `${prefix}/${entry.name}` : `${prefix}/${entry.name}/`);
    }
    return out;
  }

  async remove(path: string): Promise<void> {
    const { file } = splitPath(path);
    const dir = await getDirHandle(path, false);
    await dir.removeEntry(file);
  }

  async exists(path: string): Promise<boolean> {
    return fileExists(path);
  }
}

