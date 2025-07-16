import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

export function ResponsiveImage({
  src,
  alt,
  className = '',
  fill = false,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  aspectRatio = 'auto',
  objectFit = 'cover'
}: ResponsiveImageProps) {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: '',
  }

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          objectFitClasses[objectFit],
          'transition-transform duration-300',
          className
        )}
      />
    )
  }

  return (
    <div className={cn(
      'relative overflow-hidden',
      aspectRatioClasses[aspectRatio],
      className
    )}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          objectFitClasses[objectFit],
          'transition-transform duration-300'
        )}
      />
    </div>
  )
}
