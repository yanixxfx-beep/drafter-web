/**
 * Timeout wrapper for promises to prevent hanging
 */
function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Font loading timeout after ${ms}ms`)), ms)
    )
  ])
}

export async function ensureFontReady(weights: number[], px: number, family = "TikTok Sans") {
  try {
    // Load fonts with timeout
    await withTimeout(
      Promise.all(weights.map(w => document.fonts.load(`${w} ${px}px "${family}"`))),
      3000
    );
    
    // Wait for fonts to be ready with timeout
    await withTimeout((document as any).fonts.ready, 2000);
    
    // Verify fonts are actually loaded
    for (const weight of weights) {
      const faceDesc = `${weight} ${px}px "${family}"`
      if (!document.fonts.check(faceDesc)) {
        console.warn(`Font ${faceDesc} failed to load properly`)
      }
    }
  } catch (error) {
    console.warn(`Font loading failed for ${family} weights ${weights.join(', ')}:`, error)
    // Don't throw - let the app continue with fallback fonts
  }
}
