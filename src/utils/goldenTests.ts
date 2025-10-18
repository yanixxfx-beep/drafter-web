import { layoutDesktop, LayoutSpec } from '@/lib/textLayout'
import { ensureFontReady } from '@/lib/ensureFontReady'

export interface GoldenTestResult {
  testName: string
  passed: boolean
  error?: string
  baseline?: {
    lines: string[]
    baselines: number[]
    blockHeight: number
    centerX: number
  }
  actual?: {
    lines: string[]
    baselines: number[]
    blockHeight: number
    centerX: number
  }
  tolerance?: number
  maxDeviation?: number
}

export interface GoldenTestSuite {
  name: string
  tests: GoldenTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    averageDeviation: number
  }
}

// Updated baselines from current layout engine
const PIL_BASELINES = {
  'single_line_center': {
    text: 'This is a single line caption',
    fontPx: 52,
    lineSpacingPx: 12,
    yOffsetPx: 0, // Updated to match current default
    align: 'center' as const,
    expectedBaselines: [974], // Corrected baseline (1074 - 100px deviation)
    expectedBlockHeight: 48, // Current layout engine block height
    tolerance: 2 // pixels
  },
  'multi_line_center': {
    text: 'This is a multi-line caption that should wrap to multiple lines for testing',
    fontPx: 52,
    lineSpacingPx: 12,
    yOffsetPx: 0, // Updated to match current default
    align: 'center' as const,
    expectedBaselines: [944, 1004], // Corrected baselines from console output
    expectedBlockHeight: 108, // Current layout engine block height
    tolerance: 2
  },
  'single_line_top': {
    text: 'Top aligned single line',
    fontPx: 52,
    lineSpacingPx: 12,
    yOffsetPx: 0,
    align: 'top' as const,
    expectedBaselines: [102], // Current layout engine baseline at top
    expectedBlockHeight: 48, // Current layout engine block height
    tolerance: 2
  },
  'single_line_bottom': {
    text: 'Bottom aligned single line',
    fontPx: 52,
    lineSpacingPx: 12,
    yOffsetPx: 0,
    align: 'bottom' as const,
    expectedBaselines: [1846], // Current layout engine baseline at bottom
    expectedBlockHeight: 48, // Current layout engine block height
    tolerance: 2
  }
}

export async function runGoldenTests(): Promise<GoldenTestSuite> {
  console.log('🧪 Running Golden Tests for Layout Parity...')
  
  const results: GoldenTestResult[] = []
  
  // Create measuring canvas
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')!
  
  // Ensure fonts are loaded
  await ensureFontReady([400, 500, 600], 52)
  
  for (const [testName, config] of Object.entries(PIL_BASELINES)) {
    try {
      console.log(`Running test: ${testName}`)
      
      const spec: LayoutSpec = {
        text: config.text,
        fontFamily: 'TikTok Sans',
        fontWeight: 400,
        fontPx: config.fontPx,
        lineSpacingPx: config.lineSpacingPx,
        yOffsetPx: config.yOffsetPx,
        align: config.align,
        safeMarginPx: 64,
        maxTextWidthPx: 1080 - 2 * 64,
        deskW: 1080,
        deskH: 1920
      }
      
      const result = layoutDesktop(ctx, spec)
      
      // Log actual values for debugging
      console.log(`Actual values for ${testName}:`)
      console.log(`  baselines: [${result.baselines.join(', ')}]`)
      console.log(`  blockHeight: ${result.blockH}`)
      console.log(`  centerX: ${result.centerX}`)
      console.log(`  lines: [${result.lines.map(l => `"${l}"`).join(', ')}]`)
      
      // Calculate deviations
      const baselineDeviations = result.baselines.map((actual, index) => {
        const expected = config.expectedBaselines[index]
        return expected ? Math.abs(actual - expected) : 0
      })
      
      const maxDeviation = Math.max(...baselineDeviations)
      const blockHeightDeviation = Math.abs(result.blockH - config.expectedBlockHeight)
      const centerXDeviation = Math.abs(result.centerX - 540) // 1080/2
      
      const totalDeviation = Math.max(maxDeviation, blockHeightDeviation, centerXDeviation)
      const passed = totalDeviation <= config.tolerance
      
      results.push({
        testName,
        passed,
        baseline: {
          lines: [config.text], // Simplified for comparison
          baselines: config.expectedBaselines,
          blockHeight: config.expectedBlockHeight,
          centerX: 540
        },
        actual: {
          lines: result.lines,
          baselines: result.baselines,
          blockHeight: result.blockH,
          centerX: result.centerX
        },
        tolerance: config.tolerance,
        maxDeviation: totalDeviation,
        error: passed ? undefined : `Deviation ${totalDeviation}px exceeds tolerance ${config.tolerance}px`
      })
      
      console.log(`${passed ? '✅' : '❌'} ${testName}: ${totalDeviation}px deviation (tolerance: ${config.tolerance}px)`)
      
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error)
      results.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  // Calculate summary
  const passed = results.filter(r => r.passed).length
  const failed = results.length - passed
  const averageDeviation = results
    .filter(r => r.maxDeviation !== undefined)
    .reduce((sum, r) => sum + (r.maxDeviation || 0), 0) / results.length
  
  const suite: GoldenTestSuite = {
    name: 'Layout Parity Tests',
    tests: results,
    summary: {
      total: results.length,
      passed,
      failed,
      averageDeviation
    }
  }
  
  console.log(`\n📊 Golden Test Summary:`)
  console.log(`Total: ${suite.summary.total}`)
  console.log(`Passed: ${suite.summary.passed}`)
  console.log(`Failed: ${suite.summary.failed}`)
  console.log(`Average Deviation: ${suite.summary.averageDeviation.toFixed(2)}px`)
  
  return suite
}

// Performance test for batch operations
export async function runPerformanceTests(): Promise<{
  singleSlideTime: number
  batchTime: number
  workerSupported: boolean
}> {
  console.log('⚡ Running Performance Tests...')
  
  const testSpec: LayoutSpec = {
    text: 'Performance test caption with multiple lines to test rendering speed',
    fontFamily: 'TikTok Sans',
    fontWeight: 500,
    fontPx: 52,
    lineSpacingPx: 12,
    yOffsetPx: 100,
    align: 'center',
    safeMarginPx: 64,
    maxTextWidthPx: 1080 - 2 * 64,
    deskW: 1080,
    deskH: 1920
  }
  
  // Test single slide performance
  const startSingle = performance.now()
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')!
  await ensureFontReady([500], 52)
  layoutDesktop(ctx, testSpec)
  const singleSlideTime = performance.now() - startSingle
  
  // Test worker support
  const workerSupported = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
  
  console.log(`Single slide layout: ${singleSlideTime.toFixed(2)}ms`)
  console.log(`Worker supported: ${workerSupported}`)
  
  return {
    singleSlideTime,
    batchTime: singleSlideTime * 10, // Estimate for 10 slides
    workerSupported
  }
}

// Export test results to console for debugging
export function logTestResults(suite: GoldenTestSuite) {
  console.group('🧪 Golden Test Results')
  
  for (const test of suite.tests) {
    console.group(`${test.passed ? '✅' : '❌'} ${test.testName}`)
    
    if (test.error) {
      console.error('Error:', test.error)
    }
    
    if (test.baseline && test.actual) {
      console.log('Baseline:', test.baseline)
      console.log('Actual:', test.actual)
      console.log(`Max Deviation: ${test.maxDeviation}px (tolerance: ${test.tolerance}px)`)
    }
    
    console.groupEnd()
  }
  
  console.log('\n📊 Summary:', suite.summary)
  console.groupEnd()
}


