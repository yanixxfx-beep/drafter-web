'use client'

import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const { colors } = useTheme()

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      default:
        return 'An error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="max-w-md w-full p-8">
        <div 
          className="p-6 rounded-2xl border text-center"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }}
        >
          <h1 
            className="text-2xl font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Authentication Error
          </h1>
          
          <p 
            className="text-sm mb-6"
            style={{ color: colors.textSecondary }}
          >
            {getErrorMessage(error)}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: colors.accent,
                color: 'white'
              }}
            >
              Go Home
            </button>
            
            <button
              onClick={() => window.location.href = '/api/auth/signin'}
              className="w-full px-4 py-2 rounded-lg border font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
