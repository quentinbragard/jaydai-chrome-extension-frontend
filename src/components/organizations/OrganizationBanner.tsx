// src/components/organizations/OrganizationBanner.tsx - Enhanced design
import React from 'react';
import { Building2, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { OrganizationImage } from '@/components/organizations';
import { Organization } from '@/types/organizations';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';

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
        backgroundPosition: 'center',
        aspectRatio: '1094 / 75'
      }
    : undefined;

  return (
    <div
      className={cn(
        'jd-relative jd-overflow-hidden jd-rounded-lg jd-border',
        organization.banner_url ? 'jd-text-white' : 'jd-bg-gradient-to-br jd-from-blue-50 jd-to-indigo-100 jd-dark:jd-from-gray-800 jd-dark:jd-to-gray-900',
        isCompact ? 'jd-p-6' : 'jd-p-8 jd-mb-4',
        className
      )}
      style={bannerStyle}
    >
      {/* Background overlay for banner images */}
      {organization.banner_url && (
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-black/60 jd-via-black/40 jd-to-black/60" />
      )}
      
      {/* Main content */}
      <div className="jd-relative jd-flex jd-items-start jd-justify-between jd-gap-4">
        {/* Left side: Logo and info */}
        <div className="jd-flex jd-items-center jd-gap-3 jd-flex-1 jd-min-w-0">
          {organization.image_url ? (
            <OrganizationImage
              imageUrl={organization.image_url}
              organizationName={organization.name}
              size={isCompact ? 'md' : 'lg'}
              className="jd-ring-2 jd-ring-white/50 jd-shadow-lg"
            />
          ) : (
            <div
              className={cn(
                'jd-flex jd-items-center jd-justify-center jd-rounded-lg jd-shadow-lg',
                organization.banner_url 
                  ? 'jd-bg-white/20 jd-backdrop-blur-sm jd-ring-2 jd-ring-white/50' 
                  : 'jd-bg-blue-100 jd-dark:jd-bg-gray-700',
                isCompact ? 'jd-w-10 jd-h-10' : 'jd-w-12 jd-h-12'
              )}
            >
              <Building2 
                className={cn(
                  isCompact ? 'jd-h-5 jd-w-5' : 'jd-h-6 jd-w-6',
                  organization.banner_url 
                    ? 'jd-text-white' 
                    : 'jd-text-blue-600 jd-dark:jd-text-gray-300'
                )} 
              />
            </div>
          )}
          
          <div className="jd-space-y-1 jd-flex-1 jd-min-w-0">
            <h3
              className={cn(
                'jd-font-bold jd-truncate',
                organization.banner_url 
                  ? 'jd-text-white jd-drop-shadow-sm' 
                  : 'jd-text-gray-900 jd-dark:jd-text-gray-100',
                isCompact ? 'jd-text-sm' : 'jd-text-lg'
              )}
            >
              {organization.name}
            </h3>
            <p
              className={cn(
                'jd-text-xs jd-font-medium',
                organization.banner_url 
                  ? 'jd-text-white/90 jd-drop-shadow-sm' 
                  : 'jd-text-gray-600 jd-dark:jd-text-gray-400'
              )}
            >
              {getMessage('organizationTemplateNoticeWithName', [organization.name], 'Organization Template')}
            </p>
          </div>
        </div>

        {/* Right side: Website link */}
        {organization.website_url && (
          <div className="jd-flex-shrink-0">
            <a
              href={organization.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent(EVENTS.ORGANIZATION_WEBSITE_CLICKED, {
                  organization_id: organization.id,
                  organization_name: organization.name,
                })
              }
              className={cn(
                'jd-group jd-inline-flex jd-items-center jd-gap-2 jd-px-3 jd-py-2 jd-rounded-full jd-text-xs jd-font-medium jd-transition-all jd-duration-200 jd-transform hover:jd-scale-105 jd-shadow-sm hover:jd-shadow-md',
                organization.banner_url
                  ? 'jd-bg-white/20 jd-backdrop-blur-sm jd-text-white jd-border jd-border-white/30 hover:jd-bg-white/30 hover:jd-border-white/50'
                  : 'jd-bg-white jd-text-blue-600 jd-border jd-border-blue-200 hover:jd-bg-blue-50 hover:jd-border-blue-300 jd-dark:jd-bg-gray-800 jd-dark:jd-text-blue-400 jd-dark:jd-border-gray-600 jd-dark:hover:jd-bg-gray-700',
                isCompact ? 'jd-px-2 jd-py-1.5' : 'jd-px-3 jd-py-2'
              )}
              title={getMessage('visitWebsite', undefined, 'Visit website')}
            >
              <Globe 
                className={cn(
                  'jd-transition-transform jd-duration-200 group-hover:jd-rotate-12',
                  isCompact ? 'jd-h-3 jd-w-3' : 'jd-h-3.5 jd-w-3.5'
                )} 
              />
              <span className="jd-hidden sm:jd-inline">
                {getMessage('visitWebsite', undefined, 'Visit Website')}
              </span>
              <span className="jd-inline sm:jd-hidden">
                {getMessage('visit', undefined, 'Visit')}
              </span>
              <ExternalLink 
                className={cn(
                  'jd-transition-transform jd-duration-200 group-hover:jd-translate-x-0.5 group-hover:-jd-translate-y-0.5',
                  isCompact ? 'jd-h-2.5 jd-w-2.5' : 'jd-h-3 jd-w-3'
                )} 
              />
            </a>
          </div>
        )}
      </div>

      {/* Optional: Decorative elements for non-banner organizations */}
      {!organization.banner_url && (
        <div className="jd-absolute jd-top-0 jd-right-0 jd-w-32 jd-h-32 jd-bg-gradient-to-bl jd-from-blue-200/30 jd-to-transparent jd-rounded-bl-full jd-dark:jd-from-gray-600/20" />
      )}
    </div>
  );
};