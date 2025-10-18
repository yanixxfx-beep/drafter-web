'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { LucideIcon } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/GlowingEffect'

interface GlowingCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: string
  onClick?: () => void
  span?: number
}

export function GlowingCard({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  onClick,
  span = 1 
}: GlowingCardProps) {
  const { colors } = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  // Determine if this is the AI Assistant card for special gradient
  const isAICard = title === 'AI Assistant'

  return (
    <div
      className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] relative ${
        span === 2 ? 'md:col-span-2' : ''
      }`}
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        boxShadow: isHovered 
          ? `0 0 30px ${color}40, 0 0 60px ${color}20`
          : `0 0 10px ${color}20`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        variant={isAICard ? "ai" : "purple"}
        borderWidth={2}
      />
      <div className="p-6 h-48 flex flex-col justify-center items-center text-center space-y-4 relative z-10">
        {/* Icon */}
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
          style={{ 
            backgroundColor: `${color}20`,
            color: color
          }}
        >
          <Icon size={32} color={color} />
        </div>

        {/* Title */}
        <h3 
          className="text-xl font-bold"
          style={{ color: colors.text }}
        >
          {title}
        </h3>

        {/* Description */}
        <p 
          className="text-sm leading-relaxed"
          style={{ color: colors.textMuted }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
