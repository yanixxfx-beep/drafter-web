'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { XIcon, UploadIcon, UserIcon, LogOutIcon, CheckIcon } from '@/components/ui/Icon'
import { GlowingEffect } from '@/components/ui/GlowingEffect'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: session, status } = useSession()
  const { colors } = useTheme()
  const [customName, setCustomName] = useState('')
  const [customAvatar, setCustomAvatar] = useState<string | null>(null)
  const [sheetsConnected, setSheetsConnected] = useState(false)
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAuthenticated = status === 'authenticated' && !!session?.user

  // Check if Google Sheets is connected on mount
  useEffect(() => {
    if (isAuthenticated) {
      const connected = localStorage.getItem('sheets_connected') === 'true'
      setSheetsConnected(connected)
    }
  }, [isAuthenticated])


  const googleName = (session?.user as any)?.name as string | undefined
  const googleEmail = (session?.user as any)?.email as string | undefined
  const googleAvatar = (session?.user as any)?.image as string | undefined

  const displayName = customName || googleName || 'User'
  const displayAvatar = customAvatar || googleAvatar || '/assets/logo/logo_drafter_transparent.png'

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCustomAvatar(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSignOut = () => {
    signOut()
    onClose()
  }

  const handleSheetsConnect = async () => {
    setSheetsLoading(true)
    try {
      console.log('🔄 Starting Google Sheets connection...')
      // Connect to Google Sheets with specific scopes
      await signIn('google', {
        callbackUrl: `${window.location.origin}/?sheets_connected=true`,
        redirect: true
      })
    } catch (error) {
      console.error('❌ Failed to connect Google Sheets:', error)
      setSheetsLoading(false)
      alert('Failed to connect to Google Sheets. Please try again.')
    }
  }

  const handleSheetsDisconnect = () => {
    // Clear stored sheets credentials
    localStorage.removeItem('sheets_connected')
    setSheetsConnected(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,40,0.9) 100%)',
          backdropFilter: 'blur(10px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg relative rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Purple glowing border effect - wraps entire modal with rounded corners */}
          <div className="absolute inset-0 rounded-3xl">
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={80}
              inactiveZone={0.01}
              variant="purple"
              borderWidth={2}
            />
          </div>
          
          {/* Glass morphism container */}
          <div 
            className="relative rounded-3xl p-8 overflow-hidden"
            style={{
              background: 'rgba(15, 15, 15, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}
          >

            {/* Close button */}
            <motion.button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClose()
              }}
              className="absolute top-4 right-4 p-3 rounded-full cursor-pointer z-50"
              style={{ 
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              whileHover={{ 
                scale: 1.1, 
                rotate: 90,
                background: 'rgba(255, 255, 255, 0.2)'
              }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <XIcon size="sm" color="white" />
            </motion.button>

            {!isAuthenticated ? (
              // Sign in/up section
              <div className="text-center space-y-8 relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center relative"
                  style={{ 
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <UserIcon size="xl" color="white" />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                      filter: 'blur(20px)',
                      opacity: 0.6
                    }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Welcome to Drafter
                  </h2>
                  <p className="text-gray-300 text-lg">
                    Sign in to save your sessions and access all features
                  </p>
                </motion.div>

                <motion.button
                  onClick={() => signIn('google')}
                  className="w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-4 relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                    className="w-6 h-6"
                  />
                  <span>Sign up / Log in with Google</span>
                </motion.button>
              </div>
            ) : (
              // Profile settings section
              <div className="space-y-8 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <motion.div
                    className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                        filter: 'blur(20px)',
                        opacity: 0.3
                      }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {displayName}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {googleEmail}
                  </p>
                </motion.div>

                <div className="space-y-6">
                  {/* Custom Display Name */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label htmlFor="custom-name" className="block text-sm font-medium mb-3 text-gray-300">
                      Display Name
                    </label>
                    <div className="relative">
                      <input
                        id="custom-name"
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder={googleName || 'Enter custom name'}
                        className="w-full px-6 py-4 rounded-2xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Avatar Upload */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label htmlFor="avatar-upload" className="block text-sm font-medium mb-3 text-gray-300">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-6">
                      <motion.div 
                        className="w-16 h-16 rounded-full overflow-hidden relative"
                        whileHover={{ scale: 1.05 }}
                      >
                        <img
                          src={displayAvatar}
                          alt="Current avatar"
                          className="w-full h-full object-cover"
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                            filter: 'blur(15px)',
                            opacity: 0.3
                          }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 relative overflow-hidden group"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white'
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                        />
                        <UploadIcon size="sm" />
                        <span>Change</span>
                      </motion.button>
                      <input
                        ref={fileInputRef}
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </motion.div>

                  {/* Google Sheets Connection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="border-t pt-6"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <label className="block text-sm font-medium mb-3 text-gray-300">
                      Google Sheets Integration
                    </label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Sheets_logo_%282014-2020%29.svg"
                            alt="Google Sheets"
                            className="w-6 h-6"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {sheetsConnected ? 'Connected' : 'Not Connected'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {sheetsConnected ? 'Access to your idea files' : 'Connect to access idea files'}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={sheetsConnected ? handleSheetsDisconnect : handleSheetsConnect}
                        disabled={sheetsLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden group"
                        style={{
                          background: sheetsConnected 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : 'rgba(34, 197, 94, 0.1)',
                          border: sheetsConnected 
                            ? '1px solid rgba(239, 68, 68, 0.3)' 
                            : '1px solid rgba(34, 197, 94, 0.3)',
                          color: sheetsConnected ? '#ef4444' : '#22c55e'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {sheetsLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : sheetsConnected ? (
                          <>
                            <XIcon size="sm" />
                            <span>Disconnect</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon size="sm" />
                            <span>Connect</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Sign Out Button */}
                  <motion.button
                    onClick={handleSignOut}
                    className="w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 100, 100, 0.3)',
                      color: '#ff6b6b'
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                    />
                    <LogOutIcon size="sm" />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
