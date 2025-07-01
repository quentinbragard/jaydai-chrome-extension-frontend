// src/components/organizations/OrganizationImage.tsx
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface OrganizationImageProps {
  imageUrl?: string;
  organizationName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'jd-h-4 jd-w-4',
  md: 'jd-h-6 jd-w-6', 
  lg: 'jd-h-8 jd-w-8'
};

export function OrganizationImage({ 
  imageUrl, 
  organizationName, 
  className = '', 
  size = 'md',
  showFallback = true 
}: OrganizationImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Show fallback if no image URL, image failed to load, or showFallback is false
  if (!imageUrl || imageError || !showFallback) {
    return (
      <></>
    );
  }

  return (
    <div className={cn('jd-relative jd-flex-shrink-0', sizeClasses[size], className)}>
      {imageLoading && (
        <div className={cn(
          'jd-absolute jd-inset-0 jd-bg-gray-200 jd-animate-pulse jd-rounded-sm',
          sizeClasses[size]
        )} />
      )}
      <img
        src={imageUrl}
        alt={organizationName}
        title={organizationName}
        className={cn(
          'jd-object-cover jd-rounded-sm jd-transition-opacity',
          sizeClasses[size],
          imageLoading ? 'jd-opacity-0' : 'jd-opacity-100'
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}