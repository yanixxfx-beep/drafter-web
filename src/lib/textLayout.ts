import { loadSafeZone, getSafeZoneConstraints } from '@/utils/safeZones'

export type Align = 'top' | 'center' | 'bottom';

export interface LayoutSpec {
  text: string;
  fontFamily: string;     // "TikTok Sans"
  fontWeight: 400 | 500 | 600;
  fontPx: number;         // desktop px, e.g., 52
  lineSpacingPx: number;  // desktop px, e.g., 8
  yOffsetPx: number;      // desktop px, positive moves DOWN
  xOffsetPx: number;      // desktop px, positive moves RIGHT
  align: Align;
  horizontalAlign: 'left' | 'center' | 'right';
  textRotation: number;   // degrees, e.g., 0, 15, -30
  safeMarginPx: number;   // e.g., 64
  maxTextWidthPx: number; // e.g., 1080 - 2*64
  deskW?: number;         // default 1080
  deskH?: number;         // default 1920
  safeZoneFormat?: '9:16' | '3:4'; // Safe zone format
  useSafeZone?: boolean;  // Enable safe zone constraints
}

export interface LayoutResult {
  lines: string[];
  lineH: number;
  baselines: number[];    // y-baseline per line (desktop coords)
  blockY: number;         // top of text block (desktop coords)
  blockH: number;         // block height
  centerX: number;        // desktop x
  deskW: number;          // 1080
  deskH: number;          // 1920
}

export function computeLineHeight(ctx: CanvasRenderingContext2D, size: number) {
  const m = ctx.measureText('Mg');
  const asc = m.actualBoundingBoxAscent ?? size * 0.8;
  const desc = m.actualBoundingBoxDescent ?? size * 0.2;
  return asc + desc;
}


/** Word-based tokenization to avoid breaking words */
function tokenize(para: string): string[] {
  // Split on whitespace while preserving the whitespace tokens
  return para.split(/(\s+)/);
}

export function wrapRespectingNewlines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const tokens = tokenize(para);
    let line = '';
    for (const t of tokens) {
      const tryLine = line + t;
      if (ctx.measureText(tryLine).width <= maxW || line === '') line = tryLine;
      else { out.push(line.trimEnd()); line = t.trimStart(); }
    }
    out.push(line.trimEnd());
  }
  return out;
}

export function layoutDesktop(ctx: CanvasRenderingContext2D, spec: LayoutSpec): LayoutResult {
  const deskW = spec.deskW ?? 1080, deskH = spec.deskH ?? 1920;
  ctx.font = `${spec.fontWeight} ${spec.fontPx}px "${spec.fontFamily}", Arial, sans-serif`;
  
  // Apply safe zone constraints if enabled
  let maxTextWidth = spec.maxTextWidthPx;
  let safeMargin = spec.safeMarginPx;
  
  if (spec.useSafeZone && spec.safeZoneFormat) {
    const safeZone = loadSafeZone(spec.safeZoneFormat);
    if (safeZone) {
      const constraints = getSafeZoneConstraints(safeZone);
      maxTextWidth = constraints.maxWidth;
      safeMargin = 0; // Safe zone handles margins
    }
  }
  
  const lines = wrapRespectingNewlines(ctx, spec.text, maxTextWidth);
  const lineH = computeLineHeight(ctx, spec.fontPx);
  const spacing = spec.lineSpacingPx;
  
  // Full block height includes spacing only BETWEEN lines (following ChatGPT spec)
  const blockH = lines.length * lineH + Math.max(0, lines.length - 1) * spacing;

  // Vertical alignment identical to PIL (top/center/bottom measured from TOP of block)
  let baseTopY: number;
  if (spec.align === 'top') {
    baseTopY = safeMargin;
  } else if (spec.align === 'bottom') {
    baseTopY = deskH - safeMargin - blockH;
  } else { // 'center'
    baseTopY = (deskH - blockH) / 2;
  }
  
  // Apply safe zone constraints for vertical positioning
  if (spec.useSafeZone && spec.safeZoneFormat) {
    const safeZone = loadSafeZone(spec.safeZoneFormat);
    if (safeZone) {
      const constraints = getSafeZoneConstraints(safeZone);
      
      // Constrain to safe zone boundaries
      if (spec.align === 'top') {
        baseTopY = Math.max(baseTopY, constraints.top);
      } else if (spec.align === 'bottom') {
        baseTopY = Math.min(baseTopY, constraints.bottom - blockH);
      } else { // 'center'
        baseTopY = Math.max(constraints.top, Math.min(baseTopY, constraints.bottom - blockH));
      }
    }
  }
  
  // yOffset: positive moves DOWN in Canvas (following ChatGPT spec)
  // Apply yOffset to the CENTER of the text block for proper centering
  const textBlockCenter = baseTopY + blockH / 2;
  const adjustedCenter = textBlockCenter + spec.yOffsetPx;
  const textBlockTop = adjustedCenter - blockH / 2;

  // Convert PIL top-of-line to Canvas baseline via ascent
  const baselines = lines.map((line, i) => {
    const m = ctx.measureText(line);
    const ascent = m.actualBoundingBoxAscent ?? spec.fontPx * 0.8;
    const topY = textBlockTop + i * (lineH + spacing); // PIL "top" of the line
    return topY + ascent; // Convert to Canvas baseline
  });

  // Debug 3:4 positioning
  if (spec.safeZoneFormat === '3:4') {
    console.log(`3:4 Debug:`, {
      deskH,
      blockH,
      textBlockTop,
      textBlockCenter: textBlockTop + blockH / 2,
      canvasCenter: deskH / 2,
      align: spec.align,
      yOffset: spec.yOffsetPx,
      useSafeZone: spec.useSafeZone,
      baselines: baselines.slice(0, 2) // First 2 baselines
    });
  }

  // Calculate horizontal alignment and X offset
  let centerX = deskW / 2;
  
  // Apply X offset (positive moves RIGHT)
  centerX += spec.xOffsetPx || 0;
  
  // Apply safe zone constraints for horizontal positioning
  if (spec.useSafeZone && spec.safeZoneFormat) {
    const safeZone = loadSafeZone(spec.safeZoneFormat);
    if (safeZone) {
      const constraints = getSafeZoneConstraints(safeZone);
      centerX = Math.max(constraints.left, Math.min(centerX, constraints.right));
    }
  }

  return { lines, lineH, baselines, blockY: textBlockTop, blockH, centerX, deskW, deskH };
}
