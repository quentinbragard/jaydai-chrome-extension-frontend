// src/components/prompts/organizations/OrganizationBanner.tsx
import React from 'react';
import { Building2, Sparkles, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/classNames';
import { OrganizationImage } from '@/components/organizations';
import { Organization } from '@/types/organizations';

interface OrganizationBannerProps {
  organization: Organization;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Beautiful organization branding banner for templates
 * Shows organization logo and branding information
 */
export const OrganizationBanner: React.FC<OrganizationBannerProps> = ({
  organization,
  className = '',
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'jd-relative jd-overflow-hidden jd-rounded-lg jd-border',
        'jd-bg-gradient-to-r jd-from-blue-50 jd-via-indigo-50 jd-to-purple-50',
        'jd-dark:jd-from-blue-950/30 jd-dark:jd-via-indigo-950/30 jd-dark:jd-to-purple-950/30',
        'jd-border-blue-200/60 jd-dark:jd-border-blue-800/30',
        isCompact ? 'jd-p-3' : 'jd-p-4 jd-mb-4',
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="jd-absolute jd-inset-0 jd-opacity-30">
        <div className="jd-absolute jd-top-0 jd-right-0 jd-w-32 jd-h-32 jd-bg-gradient-to-bl jd-from-purple-200/40 jd-to-transparent jd-rounded-full jd-transform jd-translate-x-16 jd--translate-y-16" />
        <div className="jd-absolute jd-bottom-0 jd-left-0 jd-w-24 jd-h-24 jd-bg-gradient-to-tr jd-from-blue-200/40 jd-to-transparent jd-rounded-full jd-transform jd--translate-x-12 jd-translate-y-12" />
      </div>

      <div className="jd-relative jd-z-10">
        <div className="jd-flex jd-items-center jd-gap-3">
          {/* Organization Logo or Fallback Icon */}
          <div className="jd-flex-shrink-0">
            {organization.image_url ? (
              <OrganizationImage
                imageUrl={organization.image_url}
                organizationName={organization.name}
                size={isCompact ? "md" : "lg"}
                className={cn(
                  'jd-border-2 jd-border-white/80 jd-dark:jd-border-gray-800/80 jd-shadow-lg',
                  'jd-ring-2 jd-ring-blue-200/50 jd-dark:jd-ring-blue-800/30'
                )}
              />
            ) : (
              <div
                className={cn(
                  'jd-flex jd-items-center jd-justify-center jd-rounded-lg',
                  'jd-bg-gradient-to-br jd-from-blue-500 jd-to-indigo-600',
                  'jd-text-white jd-shadow-lg jd-border-2 jd-border-white/20',
                  isCompact ? 'jd-w-10 jd-h-10' : 'jd-w-12 jd-h-12'
                )}
              >
                <Building2 className={cn(isCompact ? 'jd-h-5 jd-w-5' : 'jd-h-6 jd-w-6')} />
              </div>
            )}
          </div>

          {/* Organization Information */}
          <div className="jd-flex-1 jd-min-w-0">
            <div className="jd-flex jd-items-center jd-gap-2 jd-mb-1">
              <Badge 
                variant="secondary" 
                className={cn(
                  'jd-bg-blue-100 jd-text-blue-800 jd-border-blue-200',
                  'jd-dark:jd-bg-blue-900/40 jd-dark:jd-text-blue-200 jd-dark:jd-border-blue-800',
                  'jd-flex jd-items-center jd-gap-1 jd-font-medium',
                  isCompact ? 'jd-text-xs jd-px-2 jd-py-0.5' : 'jd-text-sm jd-px-3 jd-py-1'
                )}
              >
                <Sparkles className={cn(isCompact ? 'jd-h-3 jd-w-3' : 'jd-h-4 jd-w-4')} />
                Organization Template
              </Badge>
              
              <div className="jd-flex jd-items-center jd-gap-1 jd-text-green-600 jd-dark:jd-text-green-400">
                <CheckCircle className="jd-h-4 jd-w-4" />
                <span className="jd-text-xs jd-font-medium">Verified</span>
              </div>
            </div>

            <div className="jd-space-y-1">
              <h3 
                className={cn(
                  'jd-font-semibold jd-text-gray-800 jd-dark:jd-text-gray-100 jd-truncate',
                  isCompact ? 'jd-text-sm' : 'jd-text-base'
                )}
                title={organization.name}
              >
                {organization.name}
              </h3>
              
              <p 
                className={cn(
                  'jd-text-gray-600 jd-dark:jd-text-gray-300 jd-leading-relaxed',
                  isCompact ? 'jd-text-xs' : 'jd-text-sm'
                )}
              >
                This template is curated and provided by{' '}
                <span className="jd-font-medium jd-text-blue-700 jd-dark:jd-text-blue-300">
                  {organization.name}
                </span>
                {!isCompact && ' to help you achieve better results with proven prompting strategies.'}
              </p>

              {/* Organization Description (only in default variant) */}
              {!isCompact && organization.description && (
                <p className="jd-text-xs jd-text-gray-500 jd-dark:jd-text-gray-400 jd-mt-1 jd-italic">
                  "{organization.description}"
                </p>
              )}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="jd-flex jd-flex-col jd-items-end jd-gap-1 jd-flex-shrink-0">
            <div className="jd-flex jd-items-center jd-gap-1">
              <div className="jd-w-2 jd-h-2 jd-bg-green-500 jd-rounded-full jd-animate-pulse" />
              <span className="jd-text-xs jd-text-gray-500 jd-dark:jd-text-gray-400 jd-font-medium">
                Active
              </span>
            </div>
            
            {!isCompact && (
              <div className="jd-text-right">
                <div className="jd-text-xs jd-text-gray-500 jd-dark:jd-text-gray-400">
                  Professional Quality
                </div>
                <div className="jd-flex jd-gap-0.5 jd-mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="jd-w-1.5 jd-h-1.5 jd-bg-yellow-400 jd-rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional features for default variant */}
        {!isCompact && (
          <div className="jd-mt-3 jd-pt-3 jd-border-t jd-border-blue-200/40 jd-dark:jd-border-blue-800/30">
            <div className="jd-flex jd-items-center jd-justify-between jd-text-xs">
              <div className="jd-flex jd-items-center jd-gap-4 jd-text-gray-600 jd-dark:jd-text-gray-300">
                <div className="jd-flex jd-items-center jd-gap-1">
                  <div className="jd-w-1.5 jd-h-1.5 jd-bg-blue-500 jd-rounded-full" />
                  <span>Enterprise Grade</span>
                </div>
                <div className="jd-flex jd-items-center jd-gap-1">
                  <div className="jd-w-1.5 jd-h-1.5 jd-bg-green-500 jd-rounded-full" />
                  <span>Regularly Updated</span>
                </div>
                <div className="jd-flex jd-items-center jd-gap-1">
                  <div className="jd-w-1.5 jd-h-1.5 jd-bg-purple-500 jd-rounded-full" />
                  <span>Expert Reviewed</span>
                </div>
              </div>
              
              <div className="jd-text-gray-500 jd-dark:jd-text-gray-400">
                Trusted by professionals
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};