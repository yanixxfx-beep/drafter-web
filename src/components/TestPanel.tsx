'use client'

import { useState } from 'react'
import { runGoldenTests, runPerformanceTests, logTestResults } from '@/utils/goldenTests'

export default function TestPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [performanceResults, setPerformanceResults] = useState<any>(null)

  const runTests = async () => {
    setIsRunning(true)
    try {
      // Run golden tests
      const goldenResults = await runGoldenTests()
      setResults(goldenResults)
      logTestResults(goldenResults)
      
      // Run performance tests
      const perfResults = await runPerformanceTests()
      setPerformanceResults(perfResults)
      
    } catch (error) {
      console.error('Test execution failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🧪 Drafter Web - Quality Assurance Tests</h2>
        <p className="text-sm text-gray-600">
          Run golden tests to verify layout parity with PIL desktop app and performance benchmarks.
        </p>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>

        {results && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  📊 Golden Test Results
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    results.summary.failed === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {results.summary.passed}/{results.summary.total} passed
                  </span>
                </h3>
              </div>
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {results.summary.averageDeviation.toFixed(1)}px
                    </div>
                    <div className="text-sm text-gray-600">Avg Deviation</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {results.tests.map((test: any, index: number) => (
                    <div 
                      key={index}
                      className={`p-3 rounded border ${
                        test.passed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{test.testName}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          test.passed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {test.passed ? '✅ PASS' : '❌ FAIL'}
                        </span>
                      </div>
                      {test.error && (
                        <div className="mt-2 text-sm text-red-600">{test.error}</div>
                      )}
                      {test.maxDeviation !== undefined && (
                        <div className="mt-1 text-xs text-gray-600">
                          Deviation: {test.maxDeviation}px (tolerance: {test.tolerance}px)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {performanceResults && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">⚡ Performance Results</h3>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceResults.singleSlideTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600">Single Slide</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceResults.batchTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600">10 Slides (Est.)</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    performanceResults.workerSupported ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performanceResults.workerSupported ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Worker Support</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Golden Tests:</strong> Verify text placement parity with PIL desktop app (≤2px tolerance)</p>
          <p><strong>Performance Tests:</strong> Measure layout calculation speed and worker availability</p>
          <p><strong>Worker Support:</strong> Enables batch export for better UI responsiveness</p>
        </div>
      </div>
    </div>
  )
}


