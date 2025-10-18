export interface SafeZone {
  canvas: [number, number]
  clamp_box: {
    x: number
    y: number
    w: number
    h: number
  }
  pad: number
  text_box: {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
    anchor_x: number
  }
}

export interface SafeZoneConfig {
  '9:16': SafeZone
  '3:4'?: SafeZone // Future implementation
}

// Load safe zone configuration
export function loadSafeZone(format: '9:16' | '3:4' = '9:16'): SafeZone | null {
  // For now, we'll hardcode the 9:16 safe zone from the JSON file
  // Later we can load this from the actual JSON file
  if (format === '9:16') {
    return {
      canvas: [1080, 1920],
      clamp_box: { x: 171.22, y: 126.5, w: 751.53, h: 1332.01 },
      pad: 12,
      text_box: {
        left: 169,
        right: 911,
        top: 139,
        bottom: 1447,
        width: 742,
        height: 1308,
        anchor_x: 540
      }
    }
  }
  
  // 3:4 safe zone - optimized for better text placement
  if (format === '3:4') {
    return {
      canvas: [1080, 1440], // 3:4 aspect ratio
      clamp_box: { x: 171.22, y: 126.5, w: 751.53, h: 1187.01 }, // Increased height
      pad: 12,
      text_box: {
        left: 169,
        right: 911,
        top: 139,
        bottom: 1301, // Increased from 967 to 1301 (1440 - 139)
        width: 742,
        height: 1162, // Increased from 828 to 1162
        anchor_x: 540
      }
    }
  }
  
  return null
}

// Check if text fits within safe zone
export function isTextWithinSafeZone(
  textBox: { x: number; y: number; width: number; height: number },
  safeZone: SafeZone
): boolean {
  const { text_box } = safeZone
  
  return (
    textBox.x >= text_box.left &&
    textBox.y >= text_box.top &&
    textBox.x + textBox.width <= text_box.right &&
    textBox.y + textBox.height <= text_box.bottom
  )
}

// Get safe zone constraints for layout
export function getSafeZoneConstraints(safeZone: SafeZone) {
  const { text_box, pad } = safeZone
  
  return {
    maxWidth: text_box.width - (pad * 2),
    maxHeight: text_box.height - (pad * 2),
    left: text_box.left + pad,
    right: text_box.right - pad,
    top: text_box.top + pad,
    bottom: text_box.bottom - pad,
    centerX: text_box.anchor_x
  }
}

// Draw safe zone overlay on canvas
export function drawSafeZoneOverlay(
  ctx: CanvasRenderingContext2D,
  safeZone: SafeZone,
  showOverlay: boolean = true
) {
  if (!showOverlay) return
  
  const { text_box, clamp_box } = safeZone
  
  ctx.save()
  
  // Draw semi-transparent overlay
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
  ctx.fillRect(0, 0, safeZone.canvas[0], safeZone.canvas[1])
  
  // Draw safe zone boundaries
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'
  ctx.lineWidth = 2
  
  // Text box boundary
  ctx.strokeRect(
    text_box.left,
    text_box.top,
    text_box.width,
    text_box.height
  )
  
  // Clamp box boundary
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
  ctx.strokeRect(
    clamp_box.x,
    clamp_box.y,
    clamp_box.w,
    clamp_box.h
  )
  
  // Add labels
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
  ctx.font = '12px Arial'
  ctx.fillText('Text Safe Zone', text_box.left, text_box.top - 5)
  
  ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'
  ctx.fillText('Content Safe Zone', clamp_box.x, clamp_box.y - 5)
  
  ctx.restore()
}

