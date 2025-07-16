import { getErrorMessage } from './backendI18n'
import type { Locale } from './i18n'

export const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      // Set canvas size
      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', quality)
      resolve(base64)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export const validateImageFile = (file: File, locale: Locale = 'de'): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    alert(getErrorMessage('file.invalid_type', locale))
    return false
  }

  if (file.size > maxSize) {
    alert(getErrorMessage('file.too_large', locale))
    return false
  }

  return true
}

export const getImageDisplaySrc = (item: { imageData?: string | null; imageUrl?: string | null }): string => {
  if (item.imageData) {
    return item.imageData
  }
  if (item.imageUrl) {
    return item.imageUrl
  }
  return '/images/cars/default.svg' // Fallback
}
