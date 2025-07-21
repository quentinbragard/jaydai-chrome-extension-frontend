// Enhanced Enterprise CTA Component
import React, { useState } from 'react';
import { ChevronRight, Building2, Mail, Star, Sparkles } from "lucide-react";
import { getMessage } from '@/core/utils/i18n';


export const EnterpriseCTA: React.FC<{ onContactSales: () => void }> = ({ onContactSales }) => {
    const [isHovered, setIsHovered] = useState(false);
  
    return (
      <div 
        className="jd-my-2 jd-rounded-xl jd-relative jd-overflow-hidden jd-transition-all jd-duration-300 jd-transform hover:jd-scale-[1.02] jd-group jd-cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onContactSales}
      >
        {/* Animated background gradient */}
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-blue-500/10 jd-via-purple-500/10 jd-to-indigo-500/10 jd-dark:jd-from-blue-600/20 jd-dark:jd-via-purple-600/20 jd-dark:jd-to-indigo-600/20"></div>
        
        {/* Subtle animated shimmer effect */}
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-transparent jd-via-white/5 jd-to-transparent jd-translate-x-[-100%] group-hover:jd-translate-x-[100%] jd-transition-transform jd-duration-1000"></div>
        
        {/* Border with gradient */}
        <div className="jd-absolute jd-inset-0 jd-rounded-xl jd-border jd-border-blue-200/60 jd-dark:jd-border-blue-500/30 group-hover:jd-border-blue-300/80 jd-dark:group-hover:jd-border-blue-400/50 jd-transition-colors jd-duration-300"></div>
        
        <div className="jd-relative jd-p-4 jd-space-y-3">
          {/* Header section with enhanced visuals */}
          <div className="jd-flex jd-items-start jd-justify-between">
            <div className="jd-flex jd-items-start jd-gap-3">
              {/* Enhanced icon with glow effect */}
              <div className="jd-relative jd-p-2 jd-rounded-lg jd-bg-gradient-to-br jd-from-blue-500/20 jd-to-purple-500/20 jd-dark:jd-from-blue-600/30 jd-dark:jd-to-purple-600/30">
                <Building2 className="jd-w-5 jd-h-5 jd-text-primary" />
                {isHovered && (
                  <div className="jd-absolute jd-inset-0 jd-rounded-lg jd-bg-primary/20 jd-animate-pulse"></div>
                )}
              </div>
              
              <div className="jd-flex jd-flex-col jd-gap-1">
                <div className="jd-flex jd-items-center jd-gap-2">
                  <h3 className="jd-text-sm jd-font-semibold jd-text-primary">
                    {getMessage('company_templates_cta_title', undefined, 'Company Templates')}
                  </h3>
                  <div className="jd-flex jd-items-center jd-gap-1 jd-px-2 jd-py-0.5 jd-rounded-full jd-bg-gradient-to-r jd-from-amber-400/20 jd-to-orange-400/20 jd-border jd-border-amber-300/30">
                    <Star className="jd-h-2.5 jd-w-2.5 jd-text-amber-600 jd-dark:jd-text-amber-400" />
                    <span className="jd-text-xs jd-font-medium jd-text-amber-700 jd-dark:jd-text-amber-400">
                      {getMessage('premium', undefined, 'Premium')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Animated arrow that appears on hover */}
            <ChevronRight 
              className={`jd-w-4 jd-h-4 jd-text-blue-500 jd-dark:jd-text-blue-400 jd-transition-all jd-duration-300 ${
                isHovered ? 'jd-translate-x-1 jd-opacity-100' : 'jd-translate-x-0 jd-opacity-60'
              }`} 
            />
          </div>
  
          {/* Enhanced CTA button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContactSales();
            }}
            className="jd-group jd-relative jd-w-full jd-overflow-hidden jd-rounded-lg jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 jd-p-3 jd-text-white jd-transition-all jd-duration-300 hover:jd-from-blue-700 hover:jd-to-purple-700 hover:jd-shadow-lg hover:jd-shadow-blue-500/25 jd-dark:hover:jd-shadow-blue-400/20"
          >
            {/* Button shimmer effect */}
            <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-bg-secondary jd-translate-x-[-100%] group-hover:jd-translate-x-[100%] jd-transition-transform jd-duration-700"></div>
            
            <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
              <Mail className=" jd-text-secondary-foreground jd-h-4 jd-w-4 jd-transition-transform jd-duration-300 group-hover:jd-scale-110" />
              <span className="jd-text-sm jd-font-medium jd-text-secondary-foreground">
                {getMessage('get_enterprise_access', undefined, 'Get Enterprise Access')}
              </span>
              <Sparkles className="jd-h-3 jd-w-3 jd-opacity-70 jd-transition-all jd-duration-300 group-hover:jd-opacity-100 group-hover:jd-rotate-12" />
            </div>
          </button>
  
          {/* Subtle social proof */}
          <div className="jd-flex jd-items-center jd-justify-center jd-gap-1 jd-text-xs jd-text-secondary-foreground">
            <span>✨</span>
            <span>{getMessage('join_50_teams_already_using_enterprise', undefined, 'Join 50+ teams already using Enterprise')}</span>
          </div>
        </div>
      </div>
    );
  };
  