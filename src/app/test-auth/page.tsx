'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useTheme } from '@/context/ThemeContext'

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const { colors } = useTheme()

  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth/test')
      const data = await response.json()
      console.log('Auth test result:', data)
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Auth test error:', error)
      alert('Error: ' + error)
    }
  }

  const testUpload = async () => {
    try {
      const response = await fetch('/api/upload-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'test',
          kind: 'source',
          mime: 'image/jpeg',
          bytes: 1024,
          filename: 'test.jpg'
        })
      })
      const data = await response.json()
      console.log('Upload test result:', data)
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Upload test error:', error)
      alert('Error: ' + error)
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: colors.textPrimary }}>
          Authentication Test Page
        </h1>

        <div className="space-y-6">
          {/* Session Status */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Session Status
            </h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</p>
              <p><strong>User Email:</strong> {session?.user?.email || 'None'}</p>
              <p><strong>User Name:</strong> {session?.user?.name || 'None'}</p>
            </div>
          </div>

          {/* Auth Actions */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Auth Actions
            </h2>
            <div className="space-y-3">
              {!session ? (
                <button
                  onClick={() => signIn('google')}
                  className="w-full px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: colors.accent,
                    color: 'white'
                  }}
                >
                  Sign In with Google
                </button>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white'
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* API Tests */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              API Tests
            </h2>
            <div className="space-y-3">
              <button
                onClick={testAuth}
                className="w-full px-4 py-2 rounded-lg border font-medium"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              >
                Test Auth API
              </button>
              
              <button
                onClick={testUpload}
                className="w-full px-4 py-2 rounded-lg border font-medium"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              >
                Test Upload API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
