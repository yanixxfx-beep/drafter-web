'use client'

import { UserIcon } from '@/components/ui/Icon'

interface Step1PaneProps {
  colors: any
  status: string
  isLoadingSheets: boolean
  spreadsheets: any[]
  fetchSpreadsheets: () => void
  step1Data: any
  handleSpreadsheetSelect: (value: string) => void
  availableSheets: string[]
  handleSheetSelect: (value: string) => void
  signIn: (provider: string) => void
}

export default function Step1Pane({
  colors,
  status,
  isLoadingSheets,
  spreadsheets,
  fetchSpreadsheets,
  step1Data,
  handleSpreadsheetSelect,
  availableSheets,
  handleSheetSelect,
  signIn
}: Step1PaneProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Step 1: Select Ideas
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
            Choose your Google Sheets file to access your idea files
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
          {/* Check if user is authenticated */}
        {status === 'unauthenticated' && (
          <div 
            className="p-8 rounded-lg border text-center"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}
          >
            <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <UserIcon size="xl" color="#8B5CF6" />
                </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                  Sign in to Drafter
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                  Sign in with your Google account to access your idea files
              </p>
            </div>
            
            <button
                onClick={() => signIn('google')}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
            >
              Sign in with Google
            </button>
          </div>
        )}

          {/* Check if Google Sheets is connected */}
          {status === 'authenticated' && localStorage.getItem('sheets_connected') !== 'true' && (
            <div 
              className="p-6 rounded-lg border text-center"
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.border 
              }}
            >
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Sheets_logo_%282014-2020%29.svg"
                    alt="Google Sheets"
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                  Connect Google Sheets
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                  Go to your profile settings to connect your Google Sheets account
                  </p>
                </div>
              
              <button
                onClick={() => {
                  // Open profile modal to connect Google Sheets
                  window.dispatchEvent(new CustomEvent('openProfileModal'))
                }}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}
              >
                Open Profile Settings
              </button>
              
              <p className="text-xs mt-4" style={{ color: colors.textMuted }}>
                Click your profile in the sidebar to manage connections
              </p>
            </div>
          )}

          {/* Spreadsheet Selection - only show if authenticated and connected */}
          {status === 'authenticated' && localStorage.getItem('sheets_connected') === 'true' && (
            <div className="space-y-6">
            {/* Spreadsheet Selector */}
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                backgroundColor: colors.surface, 
                borderColor: colors.border 
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Select Spreadsheet
              </h3>
              
              {isLoadingSheets ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-transparent mx-auto mb-2" style={{ borderTopColor: colors.accent }}></div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Loading your spreadsheets...
                  </p>
                </div>
              ) : spreadsheets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                    No spreadsheets found in your Google Drive
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    Make sure you have Google Sheets in your Drive, then try signing out and back in.
                  </p>
                  <button
                    onClick={() => {
                      console.log('Retrying fetch...')
                      fetchSpreadsheets()
                    }}
                    className="mt-3 px-4 py-2 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: colors.surface2, 
                      borderColor: colors.border,
                      color: colors.text 
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                  <>
                    <label htmlFor="spreadsheet-select" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                      Choose a spreadsheet
                    </label>
                <select
                      id="spreadsheet-select"
                      name="spreadsheetId"
                      value={step1Data?.spreadsheetId || ''}
                  onChange={(e) => handleSpreadsheetSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="">Choose a spreadsheet...</option>
                  {spreadsheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
                  </>
              )}
            </div>

            {/* Sheet/Tab Selector */}
            {availableSheets.length > 0 && (
              <div 
                className="p-6 rounded-lg border"
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border 
                }}
              >
                  <label htmlFor="sheet-select" className="block text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Select Day Sheet
                  </label>
                
                <select
                    id="sheet-select"
                    name="sheetName"
                  value={step1Data?.sheetName || ''}
                  onChange={(e) => handleSheetSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.surface2, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }}
                >
                  <option value="">Select a sheet...</option>
                  {availableSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Summary */}
            {step1Data?.sheetName && (
              <div 
                className="p-6 rounded-lg border"
                style={{ 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border 
                }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Ready to Generate
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {step1Data.summary.ideasCount}
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      Ideas Available
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: colors.accent }}>
                      {step1Data.summary.slideCols.length}
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      Slide Columns
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.surface2 }}>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    <strong>Spreadsheet:</strong> {step1Data.spreadsheetName}<br />
                    <strong>Sheet:</strong> {step1Data.sheetName}<br />
                    <strong>Note:</strong> Content images will be pulled from your Content page.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}