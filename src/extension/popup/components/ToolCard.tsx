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
    <div className="jd-relative jd-group jd-perspective">
      <div className={`jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-${tool.color} jd-rounded-lg jd-m-0.5 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300`}></div>
      <Button 
        variant="default"
        className={`jd-w-full jd-justify-start jd-py-7 jd-relative jd-bg-card/95 jd-border-none jd-shadow-sm jd-hover:jd-shadow-md jd-transition-all jd-card-3d ${tool.disabled ? 'jd-opacity-80 jd-hover:jd-opacity-80 jd-cursor-not-allowed' : ''}`}
        onClick={onClick}
        disabled={tool.disabled}
      >
        <div className="jd-flex jd-items-center jd-w-full">
          <div className="jd-flex-shrink-0 jd-mr-3 jd-p-1.5 jd-bg-gradient-to-br jd-from-background/80 jd-to-background jd-rounded-md jd-tool-icon">
            {tool.icon}
          </div>
          <div className="jd-flex-grow jd-text-left">
            <div className="jd-font-semibold jd-text-foreground">{tool.name}</div>
            <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-[160px]">
              {tool.description}
            </div>
          </div>
          <div className="jd-flex-shrink-0 jd-ml-2 jd-text-muted-foreground">
            {!tool.disabled ? (
              <ChevronRight className="jd-h-4 jd-w-4" />
            ) : (
              <span className="jd-text-xs">{getMessage('comingSoon')}</span>
            )}
          </div>
        </div>
        {!tool.disabled && (
          <div className="jd-absolute jd-top-0 jd-left-0 jd-w-full jd-h-full jd-overflow-hidden jd-rounded-lg jd-pointer-events-none">
            <div className="jd-absolute jd-top-0 jd-right-0 jd-w-8 jd-h-8 jd-bg-blue-500/10 jd-rounded-full"></div>
            <div className="jd-absolute jd-bottom-0 jd-left-0 jd-w-10 jd-h-10 jd-bg-indigo-500/10 jd-rounded-full"></div>
          </div>
        )}
      </Button>
      {tool.disabled && (
        <Badge 
          className="jd-absolute jd-top-0 jd-right-0 jd-transform jd-translate-y-1/2 jd-translate-x-0 jd-bg-gradient-to-r jd-from-blue-500 jd-to-indigo-500 jd-text-white jd-border-none jd-text-xs jd-font-medium jd-px-2 jd-py-1 jd-rounded-full jd-shadow-md jd-coming-soon-badge jd-badge-glow"
        >
          {getMessage('comingSoon')}
        </Badge>
      )}
    </div>
  );
};