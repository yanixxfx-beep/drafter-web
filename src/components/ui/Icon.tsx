'use client'

import React from 'react'

export type IconVariant = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface IconProps {
  name: string
  variant?: IconVariant
  size?: IconSize
  className?: string
  color?: string
}

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  variant = 'regular', 
  size = 'md', 
  className = '',
  color
}) => {
  // Phosphor icons use different naming: house.svg, not house-regular.svg
  const iconPath = `/assets/icons/SVGs/${variant}/${name}.svg`
  
  return (
    <div
      className={`${sizeMap[size]} ${className} inline-block ph-icon`}
      style={{
        maskImage: `url(${iconPath})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        backgroundColor: color || 'currentColor',
        WebkitMaskImage: `url(${iconPath})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        color: color || 'currentColor'
      }}
      onError={(e) => {
        console.log(`Failed to load icon: ${iconPath}`)
      }}
    />
  )
}

// Fallback icon component
const FallbackIcon = ({ size = 'md', className = '' }: { size?: IconSize, className?: string }) => (
  <div 
    className={`${sizeMap[size]} ${className} flex items-center justify-center rounded`}
    style={{ backgroundColor: '#666', color: 'white' }}
  >
    ?
  </div>
)

// Common icons for easy access
export const HomeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="house" {...props} />
export const GenerateIcon = (props: Omit<IconProps, 'name'>) => <Icon name="magic-wand" {...props} />
export const SessionsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="clock" {...props} />
export const SettingsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="gear" {...props} />
export const UploadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="upload" {...props} />
export const MenuIcon = (props: Omit<IconProps, 'name'>) => <Icon name="list" {...props} />
export const CloseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />
export const XIcon = (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />
export const ChevronRightIcon = (props: Omit<IconProps, 'name'>) => <Icon name="caret-right" {...props} />
export const ChevronLeftIcon = (props: Omit<IconProps, 'name'>) => <Icon name="caret-left" {...props} />
export const ShuffleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="shuffle" {...props} />
export const ImageIcon = (props: Omit<IconProps, 'name'>) => <Icon name="image" {...props} />
export const TextIcon = (props: Omit<IconProps, 'name'>) => <Icon name="text-aa" {...props} />
export const PaletteIcon = (props: Omit<IconProps, 'name'>) => <Icon name="paint-brush" {...props} />
export const PositionIcon = (props: Omit<IconProps, 'name'>) => <Icon name="circle" {...props} />
export const FileIcon = (props: Omit<IconProps, 'name'>) => <Icon name="file" {...props} />
export const VideoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="play-circle" {...props} />
export const DocumentIcon = (props: Omit<IconProps, 'name'>) => <Icon name="file-text" {...props} />
export const FolderIcon = (props: Omit<IconProps, 'name'>) => <Icon name="folder" {...props} />
export const PlusIcon = (props: Omit<IconProps, 'name'>) => <Icon name="plus" {...props} />
export const TrashIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trash" {...props} />
export const EyeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="eye" {...props} />
export const DownloadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="download" {...props} />
export const SearchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="magnifying-glass" {...props} />
export const FilterIcon = (props: Omit<IconProps, 'name'>) => <Icon name="funnel" {...props} />
export const GridIcon = (props: Omit<IconProps, 'name'>) => <Icon name="grid-four" {...props} />
export const ListIcon = (props: Omit<IconProps, 'name'>) => <Icon name="list-bullets" {...props} />
export const CheckIcon = (props: Omit<IconProps, 'name'>) => <Icon name="check" {...props} />
export const TestIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flask" {...props} />
export const UserIcon = (props: Omit<IconProps, 'name'>) => <Icon name="user" {...props} />
export const LogOutIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sign-out" {...props} />
