import React, { useState, useEffect } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  suffix?: string
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  className = '',
  style,
  suffix = ''
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const [isFocused, setIsFocused] = useState(false)

  // Update input value when prop value changes (but not when focused to avoid cursor jumping)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString())
    }
  }, [value, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
  }

  const handleBlur = () => {
    setIsFocused(false)
    
    // Parse and validate the input
    const numValue = parseFloat(inputValue)
    
    if (isNaN(numValue)) {
      // Reset to original value if invalid
      setInputValue(value.toString())
      return
    }

    // Apply min/max constraints
    let constrainedValue = numValue
    if (min !== undefined && numValue < min) {
      constrainedValue = min
    }
    if (max !== undefined && numValue > max) {
      constrainedValue = max
    }

    // Apply step constraint (round to nearest step)
    if (step !== undefined && step !== 1) {
      constrainedValue = Math.round(constrainedValue / step) * step
    }

    setInputValue(constrainedValue.toString())
    
    // Only call onChange if the value actually changed
    if (constrainedValue !== value) {
      onChange(constrainedValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      setInputValue(value.toString())
      e.currentTarget.blur()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border text-sm text-center transition-colors focus:outline-none focus:ring-2 ${className}`}
        style={{
          backgroundColor: style?.backgroundColor || '#1a1a1a',
          borderColor: isFocused ? style?.borderColor || '#6366f1' : style?.borderColor || '#374151',
          color: style?.color || '#ffffff',
          ...style
        }}
      />
      {suffix && (
        <div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs pointer-events-none"
          style={{ color: style?.color || '#9ca3af' }}
        >
          {suffix}
        </div>
      )}
    </div>
  )
}


