// Font loading utility with timeout and fallback handling
// Based on ChatGPT's recommendations for robust font loading

/**
 * Timeout wrapper for promises to prevent hanging
 */
function withTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Font loading timeout after ${ms}ms`)), ms)
    )
  ])
}

/**
 * Ensure TikTok Sans font is loaded with timeout and fallback
 */
export async function ensureTikTokFont(
  weight: 400 | 500 | 600 = 400, 
  testPx = 52
): Promise<boolean> {
  const faceDesc = `${weight} ${testPx}px "TikTok Sans"`
  
  try {
    // Check if already loaded
    if (document.fonts.check(faceDesc)) {
      return true
    }

    // Load with timeout
    await withTimeout(document.fonts.load(faceDesc), 1500)
    
    // Wait for all fonts to be ready
    await withTimeout(document.fonts.ready, 2000)
    
    // Verify it's actually loaded
    const isLoaded = document.fonts.check(faceDesc)
    if (isLoaded) {
      console.log(`TikTok Sans ${weight} loaded successfully`)
      return true
    } else {
      console.warn(`TikTok Sans ${weight} failed to load properly`)
      return false
    }
  } catch (error) {
    console.warn(`TikTok Sans ${weight} failed to load in time, using fallback:`, error)
    return false
  }
}

/**
 * Load all TikTok Sans weights with timeout
 */
export async function ensureAllTikTokFonts(): Promise<{
  regular: boolean
  medium: boolean
  semiBold: boolean
  allLoaded: boolean
}> {
  try {
    const [regular, medium, semiBold] = await Promise.allSettled([
      ensureTikTokFont(400),
      ensureTikTokFont(500),
      ensureTikTokFont(600)
    ])

    const results = {
      regular: regular.status === 'fulfilled' && regular.value,
      medium: medium.status === 'fulfilled' && medium.value,
      semiBold: semiBold.status === 'fulfilled' && semiBold.value,
      allLoaded: false
    }

    results.allLoaded = results.regular || results.medium || results.semiBold

    console.log('TikTok Sans loading results:', results)
    return results
  } catch (error) {
    console.error('Error loading TikTok Sans fonts:', error)
    return {
      regular: false,
      medium: false,
      semiBold: false,
      allLoaded: false
    }
  }
}

/**
 * Get font metrics with fallback for older browsers
 */
export function getFontMetrics(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  fontSize: number, 
  fontWeight: 400 | 500 | 600
): {
  width: number
  ascent: number
  descent: number
  lineHeight: number
} {
  // Set font for measurement
  ctx.font = `${fontWeight} ${fontSize}px "TikTok Sans", Arial, sans-serif`
  
  const metrics = ctx.measureText(text)
  
  // Check if actualBoundingBox is available (modern browsers)
  const hasAdvancedMetrics = 'actualBoundingBoxAscent' in metrics && 'actualBoundingBoxDescent' in metrics
  
  if (hasAdvancedMetrics) {
    return {
      width: metrics.width,
      ascent: metrics.actualBoundingBoxAscent,
      descent: metrics.actualBoundingBoxDescent,
      lineHeight: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    }
  } else {
    // Fallback for older browsers
    const ascent = fontSize * 0.8  // Approximate ascent
    const descent = fontSize * 0.2 // Approximate descent
    return {
      width: metrics.width,
      ascent,
      descent,
      lineHeight: fontSize * 1.2
    }
  }
}

/**
 * Memoized font metrics cache
 */
const metricsCache = new Map<string, ReturnType<typeof getFontMetrics>>()

export function getCachedFontMetrics(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontWeight: 400 | 500 | 600
): ReturnType<typeof getFontMetrics> {
  const cacheKey = `${fontWeight}-${fontSize}-${text}`
  
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey)!
  }
  
  const metrics = getFontMetrics(ctx, text, fontSize, fontWeight)
  metricsCache.set(cacheKey, metrics)
  
  return metrics
}

/**
 * Clear metrics cache (useful for memory management)
 */
export function clearMetricsCache(): void {
  metricsCache.clear()
}
