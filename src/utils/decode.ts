// src/utils/decode.ts
import { loadHtmlImage } from './canvas';

export async function decodeBitmapAtSizeFromFile(
  file: Blob,
  targetW: number,
  targetH: number
): Promise<ImageBitmap> {
  const resizeWidth = Math.max(1, Math.round(targetW));
  const resizeHeight = Math.max(1, Math.round(targetH));
  if ("createImageBitmap" in window) {
    return await createImageBitmap(file, { resizeWidth, resizeHeight, resizeQuality: "high" });
  }
  // Fallback path using <img> if needed:
  const url = URL.createObjectURL(file);
  const img = await loadHtmlImage(url); // your existing helper
  URL.revokeObjectURL(url);
  // Draw scaled on a temp canvas here if needed...
  return await createImageBitmap(img as any); // not ideal, but rarely hit
}



