import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './fonts.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ClientInitializer } from '@/components/ClientInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drafter - AI Content Creation Assistant',
  description: 'Your AI-powered content creation assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload TikTok Sans fonts for better performance */}
        <link 
          rel="preload" 
          as="font" 
          href="/assets/fonts/TikTok_font/TikTokSans_18pt_Regular.ttf" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          as="font" 
          href="/assets/fonts/TikTok_font/TikTokSans_18pt_Medium.ttf" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          as="font" 
          href="/assets/fonts/TikTok_font/TikTokSans_18pt_SemiBold.ttf" 
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>
            <ClientInitializer />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

