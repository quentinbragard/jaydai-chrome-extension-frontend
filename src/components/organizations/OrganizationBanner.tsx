// src/components/organizations/OrganizationBanner.tsx - simplified banner
import React from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { OrganizationImage } from '@/components/organizations';
import { Organization } from '@/types/organizations';

interface OrganizationBannerProps {
  organization: Organization;
  className?: string;
  variant?: 'default' | 'compact';
}

export const OrganizationBanner: React.FC<OrganizationBannerProps> = ({
  organization,
  className = '',
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  const bannerStyle = organization.banner_url
    ? {
        backgroundImage: `url(${organization.banner_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined;

  return (
    <div
      className={cn(
        'jd-relative jd-overflow-hidden jd-rounded-lg jd-border',
        organization.banner_url ? 'jd-text-white' : 'jd-bg-muted/50',
        isCompact ? 'jd-p-3' : 'jd-p-4 jd-mb-4',
        className
      )}
      style={bannerStyle}
    >
      {organization.banner_url && (
        <div className="jd-absolute jd-inset-0 jd-bg-black/40 jd-backdrop-blur-sm" />
      )}
      <div className="jd-relative jd-flex jd-items-center jd-gap-3">
        {organization.image_url ? (
          <OrganizationImage
            imageUrl={organization.image_url}
            organizationName={organization.name}
            size={isCompact ? 'md' : 'lg'}
            className="jd-ring-2 jd-ring-white/50"
          />
        ) : (
          <div
            className={cn(
              'jd-flex jd-items-center jd-justify-center jd-rounded-lg jd-bg-muted',
              isCompact ? 'jd-w-10 jd-h-10' : 'jd-w-12 jd-h-12'
            )}
          >
            <Building2 className={cn(isCompact ? 'jd-h-5 jd-w-5' : 'jd-h-6 jd-w-6')} />
          </div>
        )}
        <div className="jd-space-y-0.5">
          <p
            className={cn(
              'jd-font-semibold',
              organization.banner_url ? 'jd-text-white' : 'jd-text-gray-800 jd-dark:jd-text-gray-100',
              isCompact ? 'jd-text-sm' : 'jd-text-base'
            )}
          >
            {organization.name}
          </p>
          <p
            className={cn(
              'jd-text-xs',
              organization.banner_url ? 'jd-text-white/80' : 'jd-text-gray-600 jd-dark:jd-text-gray-300'
            )}
          >
            Used by {organization.name}
          </p>
        </div>
      </div>
    </div>
  );
};
