'use client'

import { useTheme } from '@/context/ThemeContext'
import { GlowingCard } from '@/components/ui/GlowingCard'
import { Zap, FileText, BarChart3, Users, Bot } from 'lucide-react'

export function HomePage() {
  const { colors } = useTheme()

  const cards = [
    {
      icon: Zap,
      title: 'Quick Generate',
      description: 'Generate content instantly with our AI-powered engine',
      color: '#B347FF',
      action: () => console.log('Quick Generate clicked')
    },
    {
      icon: FileText,
      title: 'Templates',
      description: 'Choose from hundreds of professional templates',
      color: '#7F16D4',
      action: () => console.log('Templates clicked')
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track your content performance and engagement',
      color: '#D966FF',
      action: () => console.log('Analytics clicked')
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Work together with your team in real-time',
      color: '#A855F7',
      action: () => console.log('Collaboration clicked')
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get personalized suggestions and optimize your content with advanced AI',
      color: '#8B5CF6',
      action: () => console.log('AI Assistant clicked'),
      span: 2
    }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 
            className="text-4xl font-bold"
            style={{ color: colors.text }}
          >
            Welcome to Drafter
          </h1>
          <p 
            className="text-lg"
            style={{ color: colors.textMuted }}
          >
            Your AI-powered content creation assistant
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {cards.map((card, index) => (
            <GlowingCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              color={card.color}
              onClick={card.action}
              span={card.span}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
