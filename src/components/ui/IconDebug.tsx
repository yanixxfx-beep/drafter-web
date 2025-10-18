'use client'

import { useState, useEffect } from 'react'

export function IconDebug() {
  const [iconStatus, setIconStatus] = useState<Record<string, boolean>>({})
  
  const testIcons = [
    'house',
    'magic-wand', 
    'clock',
    'upload',
    'gear'
  ]

  useEffect(() => {
    testIcons.forEach(iconName => {
      const img = new Image()
      img.onload = () => setIconStatus(prev => ({ ...prev, [iconName]: true }))
      img.onerror = () => setIconStatus(prev => ({ ...prev, [iconName]: false }))
      img.src = `/assets/icons/SVGs/regular/${iconName}.svg`
    })
  }, [])

  return (
    <div className="p-4 bg-gray-800 text-white rounded">
      <h3 className="font-bold mb-2">Icon Debug Status:</h3>
      {testIcons.map(iconName => (
        <div key={iconName} className="flex items-center space-x-2">
          <span className={iconStatus[iconName] ? 'text-green-400' : 'text-red-400'}>
            {iconStatus[iconName] ? '✓' : '✗'}
          </span>
          <span>{iconName}</span>
        </div>
      ))}
    </div>
  )
}
