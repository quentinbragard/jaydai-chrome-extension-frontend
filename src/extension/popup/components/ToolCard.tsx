// src/extension/popup/components/ToolCard.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AITool } from '../types/tool-types';
import { getMessage } from '@/core/utils/i18n';

interface ToolCardProps {
  tool: AITool;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ 
  tool,
  onClick
}) => {
  return (
    <div className="jd-relative jd-group jd-perspective jd-mb-3">
      {/* Enhanced background glow effect */}
      <div 
        className={`jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-${tool.color} jd-rounded-lg jd-m-0.5 
                   jd-opacity-0 group-hover:jd-opacity-100 jd-transition-all jd-duration-300
                   jd-blur-[2px] group-hover:jd-blur-[1px] jd-scale-[0.97] group-hover:jd-scale-100`}
      />
      
      <Button 
        variant="default"
        className={`jd-w-full jd-justify-start jd-py-6 jd-px-4 jd-relative 
                   jd-bg-card/95 jd-border jd-border-gray-800/30 
                   jd-shadow-sm hover:jd-shadow-lg jd-rounded-lg
                   jd-transition-all jd-duration-300 jd-ease-out
                   group-hover:jd-translate-y-[-2px] group-hover:jd-border-gray-700/50
                   ${tool.disabled ? 'jd-opacity-80 hover:jd-opacity-80 jd-cursor-not-allowed' : ''}`}
        onClick={onClick}
        disabled={tool.disabled}
      >
        <div className="jd-flex jd-items-center jd-w-full jd-gap-3">
          {/* Enhanced icon container */}
          <div className={`jd-flex-shrink-0 jd-p-2 jd-rounded-md
                         jd-transition-all jd-duration-300
                         jd-bg-gradient-to-br jd-from-background/90 jd-to-background
                         group-hover:jd-shadow-md jd-shadow-sm
                         jd-border jd-border-gray-800/40 group-hover:jd-border-gray-700/70
                         ${!tool.disabled ? 'group-hover:jd-scale-110' : ''}`}>
            {tool.icon}
          </div>
          
          {/* Text content */}
          <div className="jd-flex-grow jd-text-left jd-overflow-hidden">
            <div className="jd-font-semibold jd-text-foreground group-hover:jd-text-white jd-transition-colors jd-duration-300">
              {tool.name}
            </div>
            <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-[160px] group-hover:jd-text-gray-300 jd-transition-colors jd-duration-300">
              {tool.description}
            </div>
          </div>
          
          {/* Right icon/status */}
          <div className="jd-flex-shrink-0 jd-ml-1 jd-text-muted-foreground jd-opacity-70 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300">
            {!tool.disabled ? (
              <div className="jd-p-1 jd-rounded-full jd-bg-gray-800/50 group-hover:jd-bg-blue-600/20 jd-transition-colors jd-duration-300">
                <ChevronRight className="jd-h-4 jd-w-4 group-hover:jd-text-blue-400 jd-transition-colors jd-duration-300" />
              </div>
            ) : (
              <span className="jd-text-[10px] jd-font-medium jd-opacity-60">
                {getMessage('comingSoon', undefined, 'Coming Soon')}
              </span>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        {!tool.disabled && (
          <div className="jd-absolute jd-top-0 jd-left-0 jd-w-full jd-h-full jd-overflow-hidden jd-rounded-lg jd-pointer-events-none jd-opacity-40 group-hover:jd-opacity-70 jd-transition-opacity jd-duration-300">
            <div className="jd-absolute jd-top-1 jd-right-1 jd-w-10 jd-h-10 jd-bg-blue-500/20 jd-rounded-full jd-blur-sm"></div>
            <div className="jd-absolute jd-bottom-1 jd-left-1 jd-w-12 jd-h-12 jd-bg-indigo-500/20 jd-rounded-full jd-blur-sm"></div>
          </div>
        )}
      </Button>
    </div>
  );
};