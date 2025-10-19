'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { HomeIcon, GenerateIcon, SessionsIcon, SettingsIcon, UploadIcon, TestIcon } from '@/components/ui/Icon'
import { ProfileModal } from '@/components/ui/ProfileModal'

interface EnhancedSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function EnhancedSidebar({ currentPage, onPageChange }: EnhancedSidebarProps) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const iconColor = '#808080' // Grey with good contrast against #1E1E1E background

  const links = [
    {
      label: 'Home',
      href: '#',
      icon: (
        <HomeIcon 
          className="h-6 w-6 shrink-0 transition-colors duration-200" 
          color={currentPage === 'home' ? colors.accent : iconColor} 
        />
      ),
    },
    {
      label: 'Generate',
      href: '#',
      icon: (
        <GenerateIcon 
          className="h-6 w-6 shrink-0 transition-colors duration-200" 
          color={currentPage === 'generate' ? colors.accent : iconColor} 
        />
      ),
    },
    {
      label: 'Sessions',
      href: '#',
      icon: (
        <SessionsIcon 
          className="h-6 w-6 shrink-0 transition-colors duration-200" 
          color={currentPage === 'sessions' ? colors.accent : iconColor} 
        />
      ),
    },
    {
      label: 'Upload',
      href: '#',
      icon: (
        <UploadIcon 
          className="h-6 w-6 shrink-0 transition-colors duration-200" 
          color={currentPage === 'upload' ? colors.accent : iconColor} 
        />
      ),
    },
    {
      label: 'Settings',
      href: '#',
      icon: (
        <SettingsIcon 
          className="h-6 w-6 shrink-0 transition-colors duration-200" 
          color={currentPage === 'settings' ? colors.accent : iconColor} 
        />
      ),
    },
    {
      label: 'Tests',
      href: '#',
      icon: (
        <TestIcon 
          className="h-6 w-6 shrink-0 transition-colors duration-200" 
          color={currentPage === 'tests' ? colors.accent : iconColor} 
        />
      ),
    },
  ]

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Logo open={open} />
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(link.label.toLowerCase())
                }}
                className="w-full text-left"
              >
                <SidebarLink link={link} />
              </button>
            ))}
          </div>
        </div>
        <div>
          {/* Auth-aware account block */}
          <AccountBlock onOpenProfile={() => setProfileModalOpen(true)} />
        </div>
      </SidebarBody>
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </Sidebar>
  )
}

interface LogoProps {
  open: boolean
}

export const Logo = ({ open }: LogoProps) => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center justify-start gap-2 py-2"
    >
      <div className="h-8 w-8 shrink-0">
        <img 
          src="/assets/logo/logo_drafter_transparent.png"
          alt="Drafter Logo"
          className="h-8 w-8 object-contain"
          style={{ width: '32px', height: '32px' }}
        />
      </div>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="font-medium whitespace-pre text-base inline-block !p-0 !m-0"
        style={{ color: '#808080' }}
      >
        Drafter
      </motion.span>
    </a>
  )
}

interface AccountBlockProps {
  onOpenProfile: () => void
}

const AccountBlock = ({ onOpenProfile }: AccountBlockProps) => {
  const { data: session, status } = useSession()
  const isAuthed = status === 'authenticated' && !!session?.user
  const avatar = (session?.user as any)?.image as string | undefined
  const name = (session?.user as any)?.name as string | undefined

  if (!isAuthed) {
    return (
      <button
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          onOpenProfile()
        }}
        className="w-full text-left"
      >
        <SidebarLink
          link={{
            label: 'Sign up / Log in',
            href: '#',
            icon: (
              <img
                src="/assets/logo/logo_drafter_transparent.png"
                className="h-7 w-7 shrink-0 rounded-full object-contain"
                alt="Avatar"
              />
            ),
          }}
        />
      </button>
    )
  }

  return (
    <button
      onClick={(e: React.MouseEvent) => {
        e.preventDefault()
        onOpenProfile()
      }}
      className="w-full text-left"
    >
      <SidebarLink
        link={{
          label: name || 'My account',
          href: '#',
          icon: (
            <img
              src={avatar || '/assets/logo/logo_drafter_transparent.png'}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
              alt={name || 'Avatar'}
            />
          ),
        }}
      />
    </button>
  )
}