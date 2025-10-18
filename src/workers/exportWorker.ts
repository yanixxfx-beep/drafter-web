import { layoutDesktop, LayoutSpec } from '@/lib/textLayout'

export type ExportJob = {
  id: string
  imageUrl: string
  spec: LayoutSpec        // desktop-space
  outW?: number
  outH?: number          // default 1080x1920
  super?: number         // default 2
  outlinePx?: number
  outlineColor?: string
  fillColor?: string
}

function drawCover(ctx: OffscreenCanvasRenderingContext2D, img: ImageBitmap, W: number, H: number) {
  const iw = img.width, ih = img.height
  const s = Math.max(W/iw, H/ih)
  const dw = iw*s, dh = ih*s
  ctx.drawImage(img, (W-dw)/2, (H-dh)/2, dw, dh)
}

function diskOffsets(r: number): Array<[number,number]> {
  const pts: Array<[number,number]> = []
  for (let y=-r; y<=r; y++) {
    for (let x=-r; x<=r; x++) {
      if (x*x+y*y<=r*r) pts.push([x,y])
    }
  }
  return pts
}

self.onmessage = (async (e: MessageEvent<{ job: ExportJob }>) => {
  const { job } = e.data
  const OUT_W = job.outW ?? 1080, OUT_H = job.outH ?? 1920, SS = job.super ?? 2

  try {
    // Create high-resolution canvas for supersampling
    const hi = new OffscreenCanvas(OUT_W*SS, OUT_H*SS)
    const hctx = hi.getContext('2d')!
    hctx.scale(SS, SS)
    hctx.imageSmoothingEnabled = true
    ;(hctx as any).imageSmoothingQuality = 'high'

    // Create measuring canvas for layout
    const meas = new OffscreenCanvas(1, 1).getContext('2d')!
    meas.font = `${job.spec.fontWeight} ${job.spec.fontPx}px "${job.spec.fontFamily}", Arial, sans-serif`
    const L = layoutDesktop(meas as unknown as CanvasRenderingContext2D, job.spec)

    // Load background image
    const response = await fetch(job.imageUrl)
    const blob = await response.blob()
    const bmp = await createImageBitmap(blob)
    drawCover(hctx, bmp, OUT_W, OUT_H)

    // Set font for high-res rendering
    hctx.font = `${job.spec.fontWeight} ${job.spec.fontPx}px "${job.spec.fontFamily}", Arial, sans-serif`
    hctx.textAlign = 'center'
    ;(hctx as any).textBaseline = 'alphabetic'

    const r = Math.round(job.outlinePx ?? 0)
    const OFF = r > 0 ? diskOffsets(r) : []
    const outlineColor = job.outlineColor ?? '#000'
    const fillColor = job.fillColor ?? '#fff'

    // Draw text with circular outline algorithm (following ChatGPT spec)
    for (let i = 0; i < L.lines.length; i++) {
      const x = L.centerX, y = L.baselines[i]
      
      // Draw outline first if specified
      if (r > 0 && OFF.length > 0) {
        hctx.fillStyle = outlineColor
        for (const [dx, dy] of OFF) {
          hctx.fillText(L.lines[i], x + dx, y + dy)
        }
      }
      
      // Draw fill
      hctx.fillStyle = fillColor
      hctx.fillText(L.lines[i], x, y)
    }

    // Downsample to final resolution
    const lo = new OffscreenCanvas(OUT_W, OUT_H)
    const lctx = lo.getContext('2d')!
    lctx.imageSmoothingEnabled = true
    ;(lctx as any).imageSmoothingQuality = 'high'
    lctx.drawImage(hi, 0, 0, OUT_W, OUT_H)

    // Convert to blob and send back
    const resultBlob = await lo.convertToBlob({ type: 'image/png' })
    
    // Clean up resources
    bmp.close()
    
    ;(self as any).postMessage({ id: job.id, blob: resultBlob }, [resultBlob as any])
    
  } catch (error) {
    console.error('Worker export failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Log additional context for debugging
    console.error('Export job details:', {
      id: job.id,
      imageUrl: job.imageUrl,
      textLength: job.spec.text.length,
      fontPx: job.spec.fontPx,
      outlinePx: job.outlinePx
    })
    
    ;(self as any).postMessage({ 
      id: job.id, 
      error: errorMessage
    })
  }
}) as any
