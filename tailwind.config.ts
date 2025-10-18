import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Drafter brand colors (from your Python app)
        ink: {
          bg: '#12081B',
        },
        surface: {
          DEFAULT: '#1A0F27',
          secondary: '#211436',
        },
        accent: {
          DEFAULT: '#7C5CFF',
          dim: '#3A2B66',
          hover: '#8B70FF',
          light: 'rgba(255,255,255,0.08)',
        },
        text: {
          primary: '#F3EEFF',
          secondary: '#C9C2E8',
          tertiary: '#A0A0A0',
        },
        border: 'rgba(255,255,255,0.08)',
        hover: 'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 92, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 92, 255, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config


