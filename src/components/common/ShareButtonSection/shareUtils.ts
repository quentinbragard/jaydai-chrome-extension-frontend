"use client"

import { PlatformMessages } from "./types"

/**
 * Generate share URLs for different platforms
 */
export const getShareUrl = (
  platform: string,
  shareUrl: string,
  title: string = "",
  description: string = "",
  messages: PlatformMessages = {}
) => {
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  
  // Use custom messages if provided, otherwise use defaults
  switch(platform) {      
    case 'facebook':
      // Facebook's share URL
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      
    case 'linkedin':
      // For LinkedIn post creation with Feed Share URL format
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(messages.linkedin || '')}%20${encodedUrl}`
      
    case 'whatsapp':
      const whatsappText = `${messages.whatsapp || title} \n${shareUrl}`
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`
      
    case 'email':
      const emailSubject = messages.email?.subject || title
      const emailBody = messages.email?.body || description
      return `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}%0A%0A${encodedUrl}`
      
    default:
      return '#'
  }
}

/**
 * Generate preview message content for different platforms
 */
export const getPreviewMessage = (
  platform: string,
  shareUrl: string,
  title: string = "",
  description: string = "",
  messages: PlatformMessages = {}
) => {
  switch(platform) {
    case 'twitter':
      return messages.twitter || `${title} ${shareUrl}`
    case 'linkedin':
      return messages.linkedin || `${title}\n\n${shareUrl}`
    case 'facebook':
      return messages.facebook || `Partage sur Facebook: ${title}`
    case 'messenger':
      return messages.messenger || `Regarde cet article: ${title} ${shareUrl}`
    case 'whatsapp':
      return messages.whatsapp || `${title} ${shareUrl}`
    case 'email':
      return `${messages.email?.subject || title}\n\n${messages.email?.body || description}\n\n${shareUrl}`
    default:
      return ''
  }
}