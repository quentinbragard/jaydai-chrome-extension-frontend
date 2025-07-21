"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { trackEvent } from '@/lib/analytics'

// Import modular components
import ShareHeader from "./ShareHeader"
import ShareButton from "./ShareButton"
import CopyButton from "./CopyButton"
import SharePreview from "./SharePreview"

// Import utility functions and types
import { getShareUrl, getPreviewMessage } from "./shareUtils"
import { PlatformMessages } from "./types"

interface ShareButtonSectionProps {
  title?: string;
  description?: string;
  index?: number;
  messages?: PlatformMessages;
  className?: string;
  variant?: 'default' | 'colorful' | 'minimal' | 'cards';
  showPreview?: boolean;
}

const ShareButtonSection: React.FC<ShareButtonSectionProps> = ({ 
  title, 
  description, 
  index = 0,
  messages = {},
  className = "",
  variant = 'default',
  showPreview = true
}) => {
  const t = useTranslations('blog');
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);
  
  // Get the full URL
  const shareUrl = `https://jayd.ai${pathname}`;
  const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
  
  // Platform labels for preview
  const platformLabels: Record<string, string> = {
    facebook: "Facebook",
    linkedin: "LinkedIn",
    whatsapp: "WhatsApp",
    messenger: "Messenger",
    email: "Email"
  };
  
  const handleShare = (platform: string) => {
    // Get platform-specific share URL
    const url = getShareUrl(platform, shareUrl, pageTitle, description || '', messages);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Track share event
    trackEvent('Article Shared', {
      platform,
      article_title: pageTitle,
      page_location: pathname,
      source: 'blogArticle',
      timestamp: new Date().toISOString()
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);

    // Track copy event
    trackEvent('Article URL Copied', {
      article_title: pageTitle,
      page_location: pathname,
      source: 'blogArticle',
      timestamp: new Date().toISOString()
    });

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Get the platforms from the messages object
  const platforms = Object.keys(messages).filter(key => 
    ['facebook', 'linkedin', 'whatsapp', 'email'].includes(key)
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className={`my-12 ${className}`}
    >
      <div className="rounded-xl overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 md:p-8 shadow-md">
        {/* Header Component */}
        <ShareHeader 
          title={title} 
          description={description} 
          defaultTitle={t('shareButton.title') || 'Partagez cet article'}
        />
        
        {/* Share Buttons Grid */}
        <div className={`${variant === 'cards' ? 'grid grid-cols-2 sm:grid-cols-4 gap-4' : 'flex flex-wrap justify-center gap-4'} mt-6`}>
          {/* Platform Share Buttons */}
          {platforms.map(platform => (
            <ShareButton
              key={platform}
              platform={platform}
              variant={variant}
              onClick={() => handleShare(platform)}
              onHover={() => setPreviewPlatform(platform)}
              onLeave={() => setPreviewPlatform(null)}
            />
          ))}
          
          {/* Copy Link Button */}
          <CopyButton
            copied={copied}
            onClick={copyToClipboard}
            variant={variant}
            copiedText={t('shareButton.copied') || 'Copié!'}
            copyText={t('shareButton.copyLink') || 'Copier'}
          />
        </div>
        
        
        {/* Copied Notification */}
        {copied && (
          <div className="mt-4 text-center text-sm text-green-500 font-medium">
            {t('shareButton.copied') || 'Lien copié dans le presse-papier!'}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ShareButtonSection