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
    <div className="relative group perspective">
      <div className={`absolute inset-0 bg-gradient-to-r ${tool.color} rounded-lg -m-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <Button 
        variant="default"
        className={`w-full justify-start py-7 relative bg-card/95 border-none shadow-sm hover:shadow-md transition-all card-3d ${tool.disabled ? 'opacity-80 hover:opacity-80 cursor-not-allowed' : ''}`}
        onClick={onClick}
        disabled={tool.disabled}
      >
        <div className="flex items-center w-full">
          <div className="flex-shrink-0 mr-3 p-1.5 bg-gradient-to-br from-background/80 to-background rounded-md tool-icon">
            {tool.icon}
          </div>
          <div className="flex-grow text-left">
            <div className="font-semibold text-foreground">{tool.name}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[160px]">
              {tool.description}
            </div>
          </div>
          <div className="flex-shrink-0 ml-2 text-muted-foreground">
            {!tool.disabled ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="text-xs">{getMessage('comingSoon')}</span>
            )}
          </div>
        </div>
        {!tool.disabled && (
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500/10 rounded-full"></div>
            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-indigo-500/10 rounded-full"></div>
          </div>
        )}
      </Button>
      {tool.disabled && (
        <Badge 
          className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none text-xs font-medium px-2 py-1 rounded-full shadow-md coming-soon-badge badge-glow"
        >
          {getMessage('comingSoon')}
        </Badge>
      )}
    </div>
  );
};